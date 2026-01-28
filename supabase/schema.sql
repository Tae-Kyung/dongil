-- 동일유리 생산실적 분석 시스템 데이터베이스 스키마

-- 생산실적 테이블 생성
CREATE TABLE IF NOT EXISTS production_records (
  id BIGSERIAL PRIMARY KEY,
  s BOOLEAN,
  registered_at TIMESTAMP,
  pid VARCHAR(50),
  process VARCHAR(100),
  product_code VARCHAR(50),
  product_name VARCHAR(255),
  width DECIMAL(10,2),
  height DECIMAL(10,2),
  quantity INTEGER,
  area_pyeong DECIMAL(10,2),
  order_number VARCHAR(50),
  order_no VARCHAR(10),
  client VARCHAR(255),
  site VARCHAR(255),
  line VARCHAR(50),
  registrar VARCHAR(100),
  note TEXT,
  production_date DATE,
  production_time TIME,
  year INTEGER,
  month INTEGER,
  week INTEGER,
  area_sqm DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_production_date ON production_records(production_date);
CREATE INDEX IF NOT EXISTS idx_client ON production_records(client);
CREATE INDEX IF NOT EXISTS idx_order_number ON production_records(order_number);
CREATE INDEX IF NOT EXISTS idx_product_name ON production_records(product_name);
CREATE INDEX IF NOT EXISTS idx_site ON production_records(site);
CREATE INDEX IF NOT EXISTS idx_year_month ON production_records(year, month);
CREATE INDEX IF NOT EXISTS idx_year_week ON production_records(year, week);
CREATE INDEX IF NOT EXISTS idx_process ON production_records(process);
CREATE INDEX IF NOT EXISTS idx_line ON production_records(line);

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_production_records_updated_at ON production_records;
CREATE TRIGGER update_production_records_updated_at
    BEFORE UPDATE ON production_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) 활성화
ALTER TABLE production_records ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 읽을 수 있도록 정책 설정
CREATE POLICY "인증된 사용자는 생산실적을 조회할 수 있습니다"
  ON production_records
  FOR SELECT
  TO authenticated
  USING (true);

-- 인증된 사용자가 데이터를 삽입할 수 있도록 정책 설정
CREATE POLICY "인증된 사용자는 생산실적을 추가할 수 있습니다"
  ON production_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 인증된 사용자가 데이터를 수정할 수 있도록 정책 설정
CREATE POLICY "인증된 사용자는 생산실적을 수정할 수 있습니다"
  ON production_records
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 인증된 사용자가 데이터를 삭제할 수 있도록 정책 설정
CREATE POLICY "인증된 사용자는 생산실적을 삭제할 수 있습니다"
  ON production_records
  FOR DELETE
  TO authenticated
  USING (true);

-- 거래처 마스터 테이블 (확장성)
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50),
  contact VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "인증된 사용자는 거래처를 조회할 수 있습니다"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

-- 품목 마스터 테이블 (확장성)
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "인증된 사용자는 품목을 조회할 수 있습니다"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

-- 사용자 정의 리포트 테이블 (확장성)
CREATE TABLE IF NOT EXISTS saved_reports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_reports_user_id ON saved_reports(user_id);

ALTER TABLE saved_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "사용자는 자신의 리포트를 관리할 수 있습니다"
  ON saved_reports
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 통계 뷰 (성능 최적화를 위한 Materialized View - 옵션)
-- CREATE MATERIALIZED VIEW IF NOT EXISTS production_stats AS
-- SELECT
--   production_date,
--   client,
--   SUM(quantity) as total_quantity,
--   SUM(area_pyeong) as total_area_pyeong,
--   COUNT(*) as record_count
-- FROM production_records
-- GROUP BY production_date, client;

-- CREATE INDEX ON production_stats(production_date);
-- CREATE INDEX ON production_stats(client);
