"use client";

import { useState } from 'react';
import { FileUpload } from '@/components/upload/file-upload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { parseCSVFile, validateRecord, chunkArray } from '@/lib/utils/csv-parser';
import { ProductionRecord, UploadResult } from '@/lib/types/production';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // 1. CSV 파싱
      toast({
        title: "파일 파싱 중...",
        description: "CSV 파일을 읽고 있습니다.",
      });

      const records = await parseCSVFile(selectedFile);
      setUploadProgress(10);

      // 2. 데이터 검증
      toast({
        title: "데이터 검증 중...",
        description: `${records.length}개의 레코드를 검증하고 있습니다.`,
      });

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

      // 3. 배치로 나누기 (1000개씩)
      const batches = chunkArray(validRecords, 1000);
      const totalBatches = batches.length;

      toast({
        title: "데이터 저장 중...",
        description: `${validRecords.length}개의 레코드를 ${totalBatches}개의 배치로 저장합니다.`,
      });

      let insertedCount = 0;
      let failedCount = 0;

      // 4. 배치 삽입
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const { data, error } = await supabase
          .from('production_records')
          .insert(batch)
          .select();

        if (error) {
          console.error(`배치 ${i + 1} 오류:`, error);
          failedCount += batch.length;
          errors.push(`배치 ${i + 1} 오류: ${error.message}`);
        } else {
          insertedCount += data?.length || 0;
        }

        // 진행률 업데이트 (20% ~ 90%)
        const progress = 20 + Math.floor(((i + 1) / totalBatches) * 70);
        setUploadProgress(progress);
      }

      setUploadProgress(100);

      // 5. 결과 설정
      const result: UploadResult = {
        success: insertedCount > 0,
        totalRecords: records.length,
        insertedRecords: insertedCount,
        failedRecords: records.length - insertedCount,
        errors: errors.slice(0, 10), // 최대 10개의 에러만 표시
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
              <li>중복 데이터는 자동으로 추가됩니다 (의뢰번호로 구분하지 않음).</li>
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
                  <div className="text-2xl font-bold">{uploadResult.totalRecords}</div>
                  <div className="text-sm text-muted-foreground">총 레코드</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {uploadResult.insertedRecords}
                  </div>
                  <div className="text-sm text-muted-foreground">성공</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {uploadResult.failedRecords}
                  </div>
                  <div className="text-sm text-muted-foreground">실패</div>
                </div>
              </div>

              {uploadResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    오류 목록 ({uploadResult.errors.length}개)
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {uploadResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="text-sm p-2 bg-destructive/10 rounded border border-destructive/20"
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
