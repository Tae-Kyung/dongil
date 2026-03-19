"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SqlBlock {
  sql: string;
  explanation: string;
  sqlError?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sqlBlocks?: SqlBlock[];
}

const SAMPLE_QUESTIONS = [
  '이번 달 생산실적을 요약해줘',
  '거래처별 평수 TOP 10은?',
  '올해 월별 생산량 추이는 어때?',
  '최근 3개월 라인별 생산량 비교해줘',
  '전년 동기 대비 생산량 변화는?',
  '가장 많이 생산된 품명 TOP 5는?',
];

function SqlViewer({ sql, explanation, sqlError }: SqlBlock) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2 rounded-md border border-border/50 overflow-hidden text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted text-muted-foreground transition-colors"
      >
        <span className="font-mono">{explanation || 'SQL 쿼리 보기'}</span>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <pre className="p-3 bg-muted/30 overflow-x-auto text-foreground font-mono leading-relaxed whitespace-pre-wrap break-all">
          {sql}
        </pre>
      )}
      {sqlError && (
        <div className="px-3 py-2 bg-destructive/10 text-destructive text-xs font-mono border-t border-destructive/20">
          오류: {sqlError}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3 max-w-4xl', isUser && 'ml-auto flex-row-reverse')}>
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn('flex-1', isUser && 'flex flex-col items-end')}>
        <div className={cn(
          'rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm max-w-lg'
            : 'bg-muted rounded-tl-sm'
        )}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.sqlBlocks && message.sqlBlocks.length > 0 && (
          <div className="w-full mt-1">
            {message.sqlBlocks.map((block, i) => (
              <SqlViewer key={i} {...block} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (question?: string) => {
    const text = (question ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // assistant 메시지 placeholder 추가
    const assistantPlaceholder: Message = { role: 'assistant', content: '', sqlBlocks: [] };
    setMessages([...newMessages, assistantPlaceholder]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('API 오류');

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      const sqlBlocks: SqlBlock[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'text_delta') {
              assistantText += event.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: assistantText,
                  sqlBlocks: [...sqlBlocks],
                };
                return updated;
              });
            } else if (event.type === 'sql') {
              sqlBlocks.push({ sql: event.sql, explanation: event.explanation });
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  sqlBlocks: [...sqlBlocks],
                };
                return updated;
              });
            } else if (event.type === 'sql_error') {
              if (sqlBlocks.length > 0) {
                sqlBlocks[sqlBlocks.length - 1] = {
                  ...sqlBlocks[sqlBlocks.length - 1],
                  sqlError: event.message,
                };
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    sqlBlocks: [...sqlBlocks],
                  };
                  return updated;
                });
              }
            } else if (event.type === 'error') {
              assistantText = `오류가 발생했습니다: ${event.message}`;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantText };
                return updated;
              });
            }
          } catch {
            // JSON parse 실패 무시
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.',
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* 헤더 */}
      <div className="border-b px-6 py-4 bg-background">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold">AI 데이터 분석</h1>
            <p className="text-xs text-muted-foreground">생산실적 데이터를 자연어로 질문하세요</p>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-6">
              <div className="text-center space-y-2">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto" />
                <h2 className="text-xl font-semibold">무엇이 궁금하신가요?</h2>
                <p className="text-muted-foreground text-sm">
                  생산실적에 대해 자연어로 질문하면 데이터를 분석해 드립니다.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSubmit(q)}
                    className="text-left px-4 py-3 rounded-xl border border-border hover:bg-muted hover:border-primary/30 transition-colors text-sm text-muted-foreground hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, i) => (
              <MessageBubble key={i} message={message} />
            ))
          )}

          {isLoading && messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="border-t bg-background px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <Card className="flex items-end gap-2 p-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="질문을 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50 max-h-32 leading-relaxed"
              style={{ minHeight: '24px' }}
              onInput={e => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
            <Button
              size="icon"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </Card>
          <p className="text-xs text-muted-foreground text-center mt-2">
            AI가 생성한 SQL 쿼리는 각 답변 하단에서 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
