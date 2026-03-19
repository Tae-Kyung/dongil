"use client";

import { useState, useEffect } from 'react';
import { Save, RotateCcw, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DEFAULT_PROMPT_PLACEHOLDER = '저장된 프롬프트를 불러오는 중...';

export default function SettingsPage() {
  const [prompt, setPrompt] = useState('');
  const [defaultPrompt, setDefaultPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // 현재 저장된 프롬프트 로드
        const res = await fetch('/api/settings');
        const data = await res.json();

        // 기본 프롬프트 로드 (export된 상수)
        const defaultRes = await fetch('/api/settings/default');
        const defaultData = await defaultRes.json();
        setDefaultPrompt(defaultData.value ?? '');

        setPrompt(data.value ?? defaultData.value ?? '');
      } catch {
        setStatus({ type: 'error', message: '설정을 불러오는 중 오류가 발생했습니다.' });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!prompt.trim()) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: prompt }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStatus({ type: 'success', message: '저장되었습니다. 다음 AI 대화부터 적용됩니다.' });
    } catch (err) {
      setStatus({ type: 'error', message: err instanceof Error ? err.message : '저장 실패' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPrompt(defaultPrompt);
    setStatus(null);
  };

  const isChanged = prompt !== defaultPrompt;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground mt-2">AI 분석 동작 방식을 커스터마이징합니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI 시스템 프롬프트</CardTitle>
          <CardDescription>
            AI가 질문을 해석하고 답변을 생성하는 방식을 정의합니다.
            데이터베이스 스키마 정보, 답변 스타일, 분석 기준 등을 자유롭게 수정하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              스키마 정보(컬럼명, 테이블명)를 정확하게 유지해야 AI가 올바른 SQL을 생성합니다.
              답변 톤, 강조할 지표, 업무 맥락 등을 추가하면 더 유용한 인사이트를 얻을 수 있습니다.
            </AlertDescription>
          </Alert>

          <textarea
            value={isLoading ? DEFAULT_PROMPT_PLACEHOLDER : prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={isLoading}
            rows={24}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono leading-relaxed resize-y outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="시스템 프롬프트를 입력하세요..."
          />

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {prompt.length.toLocaleString()}자
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading || isSaving || !isChanged}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                기본값으로 되돌리기
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || isSaving || !prompt.trim()}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>

          {status && (
            <Alert variant={status.type === 'error' ? 'destructive' : 'default'}>
              {status.type === 'success'
                ? <CheckCircle2 className="h-4 w-4" />
                : <AlertCircle className="h-4 w-4" />
              }
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
