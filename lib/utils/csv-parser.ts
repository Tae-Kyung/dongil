import Papa from 'papaparse';
import { ProductionRecord, ProductionRecordCSV } from '@/lib/types/production';

// CSV 데이터를 ProductionRecord로 변환
export function convertCSVToRecord(csvRow: ProductionRecordCSV): ProductionRecord {
  // 날짜 파싱 헬퍼 (PostgreSQL DATE 형식: YYYY-MM-DD)
  const parseDate = (dateStr?: string): string | undefined => {
    if (!dateStr) return undefined;
    try {
      const trimmed = dateStr.trim();
      // YYYY-MM-DD 형식 검증
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(trimmed)) {
        return undefined;
      }

      // 실제 유효한 날짜인지 확인
      const parts = trimmed.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);

      if (month < 1 || month > 12 || day < 1 || day > 31) {
        return undefined;
      }

      return trimmed;
    } catch {
      return undefined;
    }
  };

  // 시간 파싱 헬퍼 (PostgreSQL TIME 형식: HH:MM:SS)
  const parseTime = (timeStr?: string): string | undefined => {
    if (!timeStr) return undefined;
    try {
      const trimmed = timeStr.trim();

      // "오전 8:36:54" 또는 "오후 2:30:00" 형식 처리
      let hour = 0;
      let minute = 0;
      let second = 0;
      let isPM = false;

      if (trimmed.includes('오전') || trimmed.includes('오후')) {
        isPM = trimmed.includes('오후');
        const timeOnly = trimmed.replace('오전', '').replace('오후', '').trim();
        const parts = timeOnly.split(':');

        if (parts.length >= 2) {
          hour = parseInt(parts[0]);
          minute = parseInt(parts[1]);
          second = parts.length >= 3 ? parseInt(parts[2]) : 0;

          // 오후인 경우 12시간 더하기 (12시 제외)
          if (isPM && hour !== 12) {
            hour += 12;
          }
          // 오전 12시는 0시로 변환
          if (!isPM && hour === 12) {
            hour = 0;
          }
        }
      } else {
        // 이미 24시간 형식인 경우
        const parts = trimmed.split(':');
        if (parts.length >= 2) {
          hour = parseInt(parts[0]);
          minute = parseInt(parts[1]);
          second = parts.length >= 3 ? parseInt(parts[2]) : 0;
        }
      }

      // 유효성 검증
      if (isNaN(hour) || isNaN(minute) || isNaN(second) ||
          hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
        return undefined;
      }

      // HH:MM:SS 형식으로 포맷팅
      return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
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

  // Timestamp 파싱 (PostgreSQL TIMESTAMP 형식: YYYY-MM-DD HH:MM:SS)
  const parseTimestamp = (timestampStr?: string): string | undefined => {
    if (!timestampStr) return undefined;
    try {
      const trimmed = timestampStr.trim();

      // "2025-01-02 8:36" 또는 "2025-01-02 오전 8:36:54" 형식
      const parts = trimmed.split(' ');
      if (parts.length < 2) return undefined;

      const datePart = parts[0];
      const timePart = parts.slice(1).join(' '); // "오전 8:36:54" 또는 "8:36"

      // 날짜 검증
      const validDate = parseDate(datePart);
      if (!validDate) return undefined;

      // 시간 파싱
      let timeFormatted = parseTime(timePart);

      // 시간이 없으면 초까지 추가
      if (!timeFormatted) {
        // "8:36" 형식 처리
        const simpleTimeParts = timePart.split(':');
        if (simpleTimeParts.length >= 2) {
          const hour = parseInt(simpleTimeParts[0]);
          const minute = parseInt(simpleTimeParts[1]);
          const second = simpleTimeParts.length >= 3 ? parseInt(simpleTimeParts[2]) : 0;

          if (!isNaN(hour) && !isNaN(minute) && !isNaN(second) &&
              hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 && second >= 0 && second <= 59) {
            timeFormatted = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
          }
        }
      }

      if (!timeFormatted) return undefined;

      return `${validDate} ${timeFormatted}`;
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
