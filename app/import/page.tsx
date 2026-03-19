"use client";

import { useState } from 'react';
import { FileUpload } from '@/components/upload/file-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { parseCSVFile, validateRecord, chunkArray } from '@/lib/utils/csv-parser';
import { ProductionRecord, UploadResult } from '@/lib/types/production';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProgressState {
  step: 'parsing' | 'validating' | 'uploading';
  percent: number;
  currentBatch: number;
  totalBatches: number;
  insertedCount: number;
  totalValid: number;
}

const STEP_LABEL: Record<ProgressState['step'], string> = {
  parsing: '파일 파싱 중...',
  validating: '데이터 검증 중...',
  uploading: '데이터 저장 중...',
};

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
    setProgress(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // 1. CSV 파싱
      setProgress({ step: 'parsing', percent: 0, currentBatch: 0, totalBatches: 0, insertedCount: 0, totalValid: 0 });

      const records = await parseCSVFile(selectedFile);
      setUploadProgress(10);

      // 2. 데이터 검증
      setProgress({ step: 'validating', percent: 10, currentBatch: 0, totalBatches: 0, insertedCount: 0, totalValid: 0 });

      const validRecords: ProductionRecord[] = [];
      const errors: string[] = [];

      records.forEach((record, index) => {
        const recordErrors = validateRecord(record);
        if (recordErrors.length === 0) {
          validRecords.push(record);
        } else {
          errors.push(`행 ${index + 2}: ${recordErrors.join(', ')}`);
        }
      });

      setUploadProgress(20);

      if (validRecords.length === 0) {
        throw new Error('유효한 레코드가 없습니다.');
      }

      // 3. 배치로 나누기 (500개씩)
      const batches = chunkArray(validRecords, 500);
      const totalBatches = batches.length;

      let insertedCount = 0;
      let failedCount = 0;
      const batchErrors: string[] = [];

      // 4. 배치 삽입 (재시도 로직 포함)
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        let retryCount = 0;
        let success = false;

        setProgress({
          step: 'uploading',
          percent: 20 + Math.floor((i / totalBatches) * 70),
          currentBatch: i + 1,
          totalBatches,
          insertedCount,
          totalValid: validRecords.length,
        });

        // 최대 3번 재시도
        while (retryCount < 3 && !success) {
          try {
            console.log(`📦 배치 ${i + 1}/${totalBatches} 시작 (레코드 ${i * 500 + 1} ~ ${(i + 1) * 500})`);

            const response = await supabase
              .from('production_records')
              .upsert(batch, { onConflict: 'registered_at,pid', ignoreDuplicates: true })
              .select();

            console.log(`📊 배치 ${i + 1} 응답:`, {
              hasData: !!response.data,
              dataLength: response.data?.length,
              hasError: !!response.error,
              errorType: response.error ? typeof response.error : 'no error',
              status: response.status,
              statusText: response.statusText,
            });

            if (response.error) {
              console.error(`❌ 배치 ${i + 1} Supabase 에러:`, response.error);
              console.error(`에러 타입:`, typeof response.error);
              console.error(`에러 키들:`, Object.keys(response.error));

              for (const key in response.error) {
                console.error(`  ${key}:`, (response.error as any)[key]);
              }

              throw response.error;
            }

            insertedCount += response.data?.length || 0;
            success = true;

            if ((i + 1) % 10 === 0) {
              console.log(`✅ 진행: ${i + 1}/${totalBatches} 배치 완료 (총 ${insertedCount}개 레코드 저장됨)`);
            }
          } catch (error: any) {
            retryCount++;

            console.error(`❌ 배치 ${i + 1} catch 블록 - 시도 ${retryCount}/3`);
            console.error(`에러 타입:`, typeof error);
            console.error(`에러 생성자:`, error?.constructor?.name);
            console.error(`에러 객체:`, error);

            if (error && typeof error === 'object') {
              console.error(`에러 속성들:`);
              for (const key in error) {
                try {
                  console.error(`  ${key}:`, error[key]);
                } catch (e) {
                  console.error(`  ${key}: [출력 불가]`);
                }
              }
            }

            const errorInfo = {
              message: error?.message || '메시지 없음',
              code: error?.code || '코드 없음',
              details: error?.details || '상세정보 없음',
              hint: error?.hint || '힌트 없음',
              status: error?.status || error?.statusCode || '상태코드 없음',
              name: error?.name || '이름 없음',
            };

            console.error(`에러 요약:`, errorInfo);

            if (retryCount >= 3) {
              failedCount += batch.length;
              const errorMsg = error?.message || error?.details || error?.code || '알 수 없는 오류';
              batchErrors.push(`배치 ${i + 1} (레코드 ${i * 500 + 1}-${(i + 1) * 500}): ${errorMsg}`);
              console.error(`💥 배치 ${i + 1} 최종 실패 - 건너뜀`);
            } else {
              console.log(`⏳ 배치 ${i + 1} 재시도 대기 중... (시도 ${retryCount}/3)`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        // 진행률 업데이트 (20% ~ 90%)
        const percent = 20 + Math.floor(((i + 1) / totalBatches) * 70);
        setUploadProgress(percent);
        setProgress({
          step: 'uploading',
          percent,
          currentBatch: i + 1,
          totalBatches,
          insertedCount,
          totalValid: validRecords.length,
        });

        // 각 배치 사이에 짧은 딜레이 (Rate Limiting 방지)
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // 배치 에러를 전체 에러에 추가
      errors.push(...batchErrors);

      setUploadProgress(100);
      setProgress(null);

      // 5. 결과 설정
      console.log('=== 업로드 완료 ===');
      console.log(`총 레코드: ${records.length}`);
      console.log(`검증 통과: ${validRecords.length}`);
      console.log(`저장 성공: ${insertedCount}`);
      console.log(`저장 실패: ${failedCount}`);
      console.log(`검증 실패: ${records.length - validRecords.length}`);

      const result: UploadResult = {
        success: insertedCount > 0,
        totalRecords: records.length,
        insertedRecords: insertedCount,
        failedRecords: records.length - insertedCount,
        errors: errors.slice(0, 50),
      };

      setUploadResult(result);

      if (result.success) {
        toast({
          title: "업로드 완료!",
          description: `${insertedCount}개의 레코드가 성공적으로 저장되었습니다.`,
        });
      } else {
        toast({
          title: "업로드 실패",
          description: "데이터를 저장하는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('업로드 오류:', error);
      setProgress(null);
      toast({
        title: "오류 발생",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });

      setUploadResult({
        success: false,
        totalRecords: 0,
        insertedRecords: 0,
        failedRecords: 0,
        errors: [error instanceof Error ? error.message : "알 수 없는 오류"],
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">데이터 임포트</h1>
          <p className="text-muted-foreground mt-2">
            CSV 또는 TXT 파일을 업로드하여 생산실적 데이터를 등록합니다.
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>업로드 가이드</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>CSV 또는 TXT 파일 형식을 지원합니다.</li>
              <li>첫 번째 행은 헤더(컬럼명)이어야 합니다.</li>
              <li>대용량 파일의 경우 업로드에 시간이 걸릴 수 있습니다.</li>
              <li>중복 데이터는 자동으로 건너뜁니다 (등록일시+PID 기준).</li>
            </ul>
          </AlertDescription>
        </Alert>

        <FileUpload
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onClearFile={handleClearFile}
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />

        {/* 진행 상황 카드 */}
        {isUploading && progress && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {STEP_LABEL[progress.step]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{progress.percent}%</span>
                  {progress.step === 'uploading' && (
                    <span>배치 {progress.currentBatch} / {progress.totalBatches}</span>
                  )}
                </div>
                <Progress value={progress.percent} className="h-2" />
              </div>

              {progress.step === 'uploading' && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <div className="text-xl font-bold text-green-600">{progress.insertedCount.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">저장 완료</div>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <div className="text-xl font-bold">{progress.totalValid.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">전체 유효 레코드</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {uploadResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                업로드 결과
              </CardTitle>
              <CardDescription>
                {uploadResult.success
                  ? "데이터가 성공적으로 저장되었습니다."
                  : "일부 데이터 저장에 실패했습니다."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{uploadResult.totalRecords.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">총 레코드</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadResult.insertedRecords.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">성공</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {uploadResult.failedRecords.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">실패</div>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    오류 목록 (최대 50개 표시)
                  </h4>
                  <div className="text-sm text-muted-foreground mb-2">
                    전체 에러는 브라우저 콘솔(F12)에서 확인할 수 있습니다.
                  </div>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {uploadResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-destructive/10 rounded border border-destructive/20 font-mono"
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
