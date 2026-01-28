-- ===================================================================
-- PostgreSQL 집계 함수 (RPC Functions)
-- ===================================================================
-- 이 파일을 Supabase Dashboard > SQL Editor에서 실행하세요.
-- 대시보드의 성능을 크게 향상시킵니다.
-- ===================================================================

-- 1. 일별 생산량 추이 (GROUP BY production_date)
CREATE OR REPLACE FUNCTION get_production_trend(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  quantity BIGINT,
  area_pyeong NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    production_date AS date,
    COALESCE(SUM(production_records.quantity), 0)::BIGINT AS quantity,
    COALESCE(SUM(production_records.area_pyeong), 0)::NUMERIC AS area_pyeong
  FROM production_records
  WHERE
    production_date IS NOT NULL
    AND (start_date IS NULL OR production_date >= start_date)
    AND (end_date IS NULL OR production_date <= end_date)
  GROUP BY production_date
  ORDER BY production_date ASC;
END;
$$;

-- 2. 거래처별 통계 (GROUP BY client) - 상위 N개
CREATE OR REPLACE FUNCTION get_client_stats(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  client VARCHAR,
  quantity BIGINT,
  area_pyeong NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    production_records.client,
    COALESCE(SUM(production_records.quantity), 0)::BIGINT AS quantity,
    COALESCE(SUM(production_records.area_pyeong), 0)::NUMERIC AS area_pyeong
  FROM production_records
  WHERE
    production_records.client IS NOT NULL
    AND (start_date IS NULL OR production_date >= start_date)
    AND (end_date IS NULL OR production_date <= end_date)
  GROUP BY production_records.client
  ORDER BY SUM(production_records.quantity) DESC
  LIMIT limit_count;
END;
$$;

-- 3. 품목별 통계 (GROUP BY product_name) - 상위 N개
CREATE OR REPLACE FUNCTION get_product_stats(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  product_name VARCHAR,
  quantity BIGINT,
  area_pyeong NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    production_records.product_name,
    COALESCE(SUM(production_records.quantity), 0)::BIGINT AS quantity,
    COALESCE(SUM(production_records.area_pyeong), 0)::NUMERIC AS area_pyeong
  FROM production_records
  WHERE
    production_records.product_name IS NOT NULL
    AND (start_date IS NULL OR production_date >= start_date)
    AND (end_date IS NULL OR production_date <= end_date)
  GROUP BY production_records.product_name
  ORDER BY SUM(production_records.quantity) DESC
  LIMIT limit_count;
END;
$$;

-- 4. 대시보드 전체 통계 (단일 쿼리로 모든 KPI 계산)
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_quantity BIGINT,
  total_area_pyeong NUMERIC,
  unique_clients BIGINT,
  today_quantity BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(quantity), 0)::BIGINT AS total_quantity,
    COALESCE(SUM(area_pyeong), 0)::NUMERIC AS total_area_pyeong,
    COUNT(DISTINCT client)::BIGINT AS unique_clients,
    COALESCE(SUM(CASE WHEN production_date = today_date THEN quantity ELSE 0 END), 0)::BIGINT AS today_quantity
  FROM production_records
  WHERE
    (start_date IS NULL OR production_date >= start_date)
    AND (end_date IS NULL OR production_date <= end_date);
END;
$$;

-- 권한 부여 (인증된 사용자만 실행 가능)
GRANT EXECUTE ON FUNCTION get_production_trend(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_stats(DATE, DATE, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_stats(DATE, DATE, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(DATE, DATE) TO authenticated;

-- ===================================================================
-- 사용 예시:
-- ===================================================================
-- 1. 전체 기간 생산량 추이
-- SELECT * FROM get_production_trend(NULL, NULL);

-- 2. 최근 30일 생산량 추이
-- SELECT * FROM get_production_trend(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE);

-- 3. 상위 10개 거래처
-- SELECT * FROM get_client_stats(NULL, NULL, 10);

-- 4. 상위 10개 품목
-- SELECT * FROM get_product_stats(NULL, NULL, 10);

-- 5. 대시보드 전체 통계
-- SELECT * FROM get_dashboard_stats(NULL, NULL);
-- ===================================================================
