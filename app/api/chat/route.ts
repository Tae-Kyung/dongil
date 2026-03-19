import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const DEFAULT_SYSTEM_PROMPT = `당신은 동일유리 생산실적 데이터 분석 AI 어시스턴트입니다.
의사결정자가 자연어로 질문하면 데이터베이스에서 정보를 조회하여 명확하고 통찰력 있는 답변을 제공합니다.

## 데이터베이스 스키마
### production_records (생산실적 테이블)
- id: BIGINT (PK)
- production_date: DATE (생산일자) — 날짜 필터/집계의 핵심 컬럼
- registered_at: TIMESTAMP (등록일시)
- pid: VARCHAR (레코드 고유 ID)
- process: VARCHAR (공정명, 예: 포장공정)
- product_code: VARCHAR (품목코드)
- product_name: VARCHAR (품명)
- width: DECIMAL (가로 mm)
- height: DECIMAL (세로 mm)
- quantity: INTEGER (수량)
- area_pyeong: DECIMAL (평수)
- order_number: VARCHAR (의뢰번호)
- client: VARCHAR (거래처명)
- site: VARCHAR (현장명)
- line: VARCHAR (라인명, 예: 1-LINE, 2-LINE)
- registrar: VARCHAR (등록자/공정구분, 예: 복층1, 복층2, 단판)
- note: TEXT (비고)

## SQL 작성 규칙
- production_date 컬럼으로 날짜 필터링
- 연도: EXTRACT(YEAR FROM production_date)
- 월: EXTRACT(MONTH FROM production_date)
- 집계: SUM(quantity) 수량합계, SUM(area_pyeong) 평수합계, COUNT(*) 건수
- 비율 계산 시 ROUND(..., 1) 사용
- 항상 ORDER BY 추가하여 의미 있는 순서로 정렬
- 세부 데이터 조회 시 LIMIT 20 이하, 집계 결과는 LIMIT 없어도 됨

## 답변 가이드
- 항상 한국어로 답변
- 수치는 천 단위 구분자(,)와 함께 표시
- 데이터를 바탕으로 의사결정에 도움이 되는 인사이트 제공
- 간결하되 핵심을 빠짐없이 전달`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'execute_sql',
    description: 'production_records 테이블에 SELECT SQL 쿼리를 실행하여 생산실적 데이터를 조회합니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: '실행할 SELECT SQL 쿼리',
        },
        explanation: {
          type: 'string',
          description: '이 쿼리가 무엇을 조회하는지 한 줄 설명',
        },
      },
      required: ['query'],
    },
  },
];

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), { status: 401 });
    }

    // DB에서 커스텀 프롬프트 로드 (없으면 기본값 사용)
    const { data: settingRow } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'chat_system_prompt')
      .single();
    const systemPrompt = settingRow?.value ?? DEFAULT_SYSTEM_PROMPT;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const emit = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          let apiMessages: Anthropic.MessageParam[] = messages.map((m: { role: string; content: string }) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

          // 최대 5회 반복 (무한루프 방지)
          for (let turn = 0; turn < 5; turn++) {
            const claudeStream = anthropic.messages.stream({
              model: 'claude-opus-4-6',
              max_tokens: 4096,
              system: systemPrompt,
              tools: TOOLS,
              messages: apiMessages,
            });

            // 텍스트 토큰 실시간 스트리밍
            for await (const event of claudeStream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                emit({ type: 'text_delta', text: event.delta.text });
              }
            }

            const finalMessage = await claudeStream.finalMessage();

            if (finalMessage.stop_reason === 'end_turn') break;

            if (finalMessage.stop_reason === 'tool_use') {
              apiMessages.push({ role: 'assistant', content: finalMessage.content });

              const toolResults: Anthropic.ToolResultBlockParam[] = [];

              for (const block of finalMessage.content) {
                if (block.type !== 'tool_use') continue;

                if (block.name === 'execute_sql') {
                  const input = block.input as { query: string; explanation?: string };
                  const query = input.query;

                  // SELECT 쿼리만 허용
                  if (!query.trim().toUpperCase().startsWith('SELECT')) {
                    toolResults.push({
                      type: 'tool_result',
                      tool_use_id: block.id,
                      content: 'SELECT 쿼리만 허용됩니다.',
                      is_error: true,
                    });
                    continue;
                  }

                  // 프론트엔드에 SQL 전달 (표시용)
                  emit({ type: 'sql', sql: query, explanation: input.explanation ?? '' });

                  const { data, error } = await supabase.rpc('execute_nl_query', { query_text: query });

                  if (error) {
                    toolResults.push({
                      type: 'tool_result',
                      tool_use_id: block.id,
                      content: `오류: ${error.message}`,
                      is_error: true,
                    });
                  } else {
                    const resultStr = JSON.stringify(data);
                    // 토큰 한도 방지: 50KB 초과 시 truncate
                    const truncated = resultStr.length > 50000
                      ? resultStr.substring(0, 50000) + '\n...(결과가 너무 많아 일부 생략됨)'
                      : resultStr;

                    toolResults.push({
                      type: 'tool_result',
                      tool_use_id: block.id,
                      content: truncated,
                    });
                  }
                }
              }

              apiMessages.push({ role: 'user', content: toolResults });
            } else {
              break;
            }
          }

          emit({ type: 'done' });
        } catch (err) {
          emit({ type: 'error', message: err instanceof Error ? err.message : '알 수 없는 오류' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: '서버 오류가 발생했습니다.' }), { status: 500 });
  }
}
