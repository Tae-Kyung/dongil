// 생산실적 데이터 타입 정의

export interface ProductionRecord {
  id?: number;
  s?: boolean;
  registered_at?: string;
  pid?: string;
  process?: string;
  product_code?: string;
  product_name?: string;
  width?: number;
  height?: number;
  quantity?: number;
  area_pyeong?: number;
  order_number?: string;
  order_no?: string;
  client?: string;
  site?: string;
  line?: string;
  registrar?: string;
  note?: string;
  production_date?: string;
  production_time?: string;
  year?: number;
  month?: number;
  week?: number;
  area_sqm?: number;
  created_at?: string;
  updated_at?: string;
}

// CSV 원본 데이터 타입 (한글 헤더)
export interface ProductionRecordCSV {
  S?: string;
  등록일시?: string;
  PID?: string;
  공정?: string;
  품목코드?: string;
  품명?: string;
  가로?: string;
  세로?: string;
  수량?: string;
  평수?: string;
  의뢰번호?: string;
  "NO."?: string;
  거래처?: string;
  현장?: string;
  라인?: string;
  등록자?: string;
  비고?: string;
  일자?: string;
  시간?: string;
  연?: string;
  월?: string;
  주차?: string;
  면적?: string;
}

// 업로드 결과 타입
export interface UploadResult {
  success: boolean;
  totalRecords: number;
  insertedRecords: number;
  failedRecords: number;
  errors: string[];
}
