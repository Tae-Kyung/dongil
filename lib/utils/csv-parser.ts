import Papa from 'papaparse';
import { ProductionRecord, ProductionRecordCSV } from '@/lib/types/production';

// CSV 데이터를 ProductionRecord로 변환
export function convertCSVToRecord(csvRow: ProductionRecordCSV): ProductionRecord {
  // 날짜 파싱 헬퍼
  const parseDate = (dateStr?: string): string | undefined => {
    if (!dateStr) return undefined;
    try {
      // "2025-01-02" 형식
      return dateStr.trim();
    } catch {
      return undefined;
    }
  };

  // 시간 파싱 헬퍼
  const parseTime = (timeStr?: string): string | undefined => {
    if (!timeStr) return undefined;
    try {
      // "오전 8:36:54" 형식을 "08:36:54"로 변환
      const cleaned = timeStr.replace('오전', '').replace('오후', '').trim();
      return cleaned;
    } catch {
      return undefined;
    }
  };

  // 숫자 파싱 헬퍼
  const parseNumber = (numStr?: string): number | undefined => {
    if (!numStr) return undefined;
    const num = parseFloat(numStr.replace(/,/g, ''));
    return isNaN(num) ? undefined : num;
  };

  // Boolean 파싱
  const parseBoolean = (boolStr?: string): boolean | undefined => {
    if (!boolStr) return undefined;
    return boolStr.toUpperCase() === 'TRUE';
  };

  // Timestamp 파싱
  const parseTimestamp = (timestampStr?: string): string | undefined => {
    if (!timestampStr) return undefined;
    try {
      // "2025-01-02 8:36" 형식
      return timestampStr.trim();
    } catch {
      return undefined;
    }
  };

  return {
    s: parseBoolean(csvRow.S),
    registered_at: parseTimestamp(csvRow.등록일시),
    pid: csvRow.PID?.trim(),
    process: csvRow.공정?.trim(),
    product_code: csvRow.품목코드?.trim(),
    product_name: csvRow.품명?.trim(),
    width: parseNumber(csvRow.가로),
    height: parseNumber(csvRow.세로),
    quantity: parseNumber(csvRow.수량) ? Math.floor(parseNumber(csvRow.수량)!) : undefined,
    area_pyeong: parseNumber(csvRow.평수),
    order_number: csvRow.의뢰번호?.trim(),
    order_no: csvRow["NO."]?.trim(),
    client: csvRow.거래처?.trim(),
    site: csvRow.현장?.trim(),
    line: csvRow.라인?.trim(),
    registrar: csvRow.등록자?.trim(),
    note: csvRow.비고?.trim(),
    production_date: parseDate(csvRow.일자),
    production_time: parseTime(csvRow.시간),
    year: parseNumber(csvRow.연) ? Math.floor(parseNumber(csvRow.연)!) : undefined,
    month: parseNumber(csvRow.월) ? Math.floor(parseNumber(csvRow.월)!) : undefined,
    week: parseNumber(csvRow.주차) ? Math.floor(parseNumber(csvRow.주차)!) : undefined,
    area_sqm: parseNumber(csvRow.면적),
  };
}

// CSV 파일 파싱
export function parseCSVFile(file: File): Promise<ProductionRecord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<ProductionRecordCSV>(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          const records = results.data.map(convertCSVToRecord);
          resolve(records);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

// 데이터 검증
export function validateRecord(record: ProductionRecord): string[] {
  const errors: string[] = [];

  // 필수 필드 검증
  if (!record.production_date) {
    errors.push('생산일자는 필수입니다.');
  }

  if (!record.product_name) {
    errors.push('품명은 필수입니다.');
  }

  if (record.quantity !== undefined && record.quantity < 0) {
    errors.push('수량은 0 이상이어야 합니다.');
  }

  if (record.area_pyeong !== undefined && record.area_pyeong < 0) {
    errors.push('평수는 0 이상이어야 합니다.');
  }

  return errors;
}

// 배치를 나누는 유틸리티
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
