import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_SYSTEM_PROMPT } from '@/lib/constants/prompts';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
      .eq('setting_key', 'chat_system_prompt')
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
                    // 실제 오류를 프론트엔드에도 전달
                    emit({ type: 'sql_error', message: error.message, code: error.code });
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
