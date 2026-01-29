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
-- 다차원 분석 함수 (Multi-Dimensional Analysis)
-- ===================================================================

-- 5. 다차원 분석 - 기간 x 거래처별 집계
CREATE OR REPLACE FUNCTION get_analysis_by_period_client(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  period_type VARCHAR DEFAULT 'daily'  -- 'daily', 'weekly', 'monthly', 'yearly'
)
RETURNS TABLE (
  period VARCHAR,
  client VARCHAR,
  quantity BIGINT,
  area_pyeong NUMERIC,
  record_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE period_type
      WHEN 'daily' THEN TO_CHAR(production_date, 'YYYY-MM-DD')
      WHEN 'weekly' THEN TO_CHAR(production_date, 'IYYY-IW')
      WHEN 'monthly' THEN TO_CHAR(production_date, 'YYYY-MM')
      WHEN 'yearly' THEN TO_CHAR(production_date, 'YYYY')
      ELSE TO_CHAR(production_date, 'YYYY-MM-DD')
    END AS period,
    production_records.client,
    COALESCE(SUM(production_records.quantity), 0)::BIGINT AS quantity,
    COALESCE(SUM(production_records.area_pyeong), 0)::NUMERIC AS area_pyeong,
    COUNT(*)::BIGINT AS record_count
  FROM production_records
  WHERE
    production_date IS NOT NULL
    AND production_records.client IS NOT NULL
    AND (start_date IS NULL OR production_date >= start_date)
    AND (end_date IS NULL OR production_date <= end_date)
  GROUP BY
    CASE period_type
      WHEN 'daily' THEN TO_CHAR(production_date, 'YYYY-MM-DD')
      WHEN 'weekly' THEN TO_CHAR(production_date, 'IYYY-IW')
      WHEN 'monthly' THEN TO_CHAR(production_date, 'YYYY-MM')
      WHEN 'yearly' THEN TO_CHAR(production_date, 'YYYY')
      ELSE TO_CHAR(production_date, 'YYYY-MM-DD')
    END,
    production_records.client
  ORDER BY period ASC, quantity DESC;
END;
$$;

-- 6. 다차원 분석 - 기간 x 품목별 집계
CREATE OR REPLACE FUNCTION get_analysis_by_period_product(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  period_type VARCHAR DEFAULT 'daily'
)
RETURNS TABLE (
  period VARCHAR,
  product_name VARCHAR,
  quantity BIGINT,
  area_pyeong NUMERIC,
  record_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE period_type
      WHEN 'daily' THEN TO_CHAR(production_date, 'YYYY-MM-DD')
      WHEN 'weekly' THEN TO_CHAR(production_date, 'IYYY-IW')
      WHEN 'monthly' THEN TO_CHAR(production_date, 'YYYY-MM')
      WHEN 'yearly' THEN TO_CHAR(production_date, 'YYYY')
      ELSE TO_CHAR(production_date, 'YYYY-MM-DD')
    END AS period,
    production_records.product_name,
    COALESCE(SUM(production_records.quantity), 0)::BIGINT AS quantity,
    COALESCE(SUM(production_records.area_pyeong), 0)::NUMERIC AS area_pyeong,
    COUNT(*)::BIGINT AS record_count
  FROM production_records
  WHERE
    production_date IS NOT NULL
    AND production_records.product_name IS NOT NULL
    AND (start_date IS NULL OR production_date >= start_date)
    AND (end_date IS NULL OR production_date <= end_date)
  GROUP BY
    CASE period_type
      WHEN 'daily' THEN TO_CHAR(production_date, 'YYYY-MM-DD')
      WHEN 'weekly' THEN TO_CHAR(production_date, 'IYYY-IW')
      WHEN 'monthly' THEN TO_CHAR(production_date, 'YYYY-MM')
      WHEN 'yearly' THEN TO_CHAR(production_date, 'YYYY')
      ELSE TO_CHAR(production_date, 'YYYY-MM-DD')
    END,
    production_records.product_name
  ORDER BY period ASC, quantity DESC;
END;
$$;

-- 7. 다차원 분석 - 거래처 x 품목별 집계
CREATE OR REPLACE FUNCTION get_analysis_by_client_product(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  client_filter VARCHAR DEFAULT NULL,
  limit_count INT DEFAULT 100
)
RETURNS TABLE (
  client VARCHAR,
  product_name VARCHAR,
  quantity BIGINT,
  area_pyeong NUMERIC,
  record_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    production_records.client,
    production_records.product_name,
    COALESCE(SUM(production_records.quantity), 0)::BIGINT AS quantity,
    COALESCE(SUM(production_records.area_pyeong), 0)::NUMERIC AS area_pyeong,
    COUNT(*)::BIGINT AS record_count
  FROM production_records
  WHERE
    production_records.client IS NOT NULL
    AND production_records.product_name IS NOT NULL
    AND (start_date IS NULL OR production_date >= start_date)
    AND (end_date IS NULL OR production_date <= end_date)
    AND (client_filter IS NULL OR production_records.client = client_filter)
  GROUP BY production_records.client, production_records.product_name
  ORDER BY quantity DESC
  LIMIT limit_count;
END;
$$;

-- 8. 피벗 분석용 - 기간별 집계 (행: 거래처/품목, 열: 기간)
CREATE OR REPLACE FUNCTION get_pivot_analysis(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  row_dimension VARCHAR DEFAULT 'client',  -- 'client' or 'product'
  period_type VARCHAR DEFAULT 'monthly'
)
RETURNS TABLE (
  dimension_value VARCHAR,
  period VARCHAR,
  quantity BIGINT,
  area_pyeong NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE row_dimension
      WHEN 'client' THEN production_records.client
      WHEN 'product' THEN production_records.product_name
      ELSE production_records.client
    END AS dimension_value,
    CASE period_type
      WHEN 'daily' THEN TO_CHAR(production_date, 'YYYY-MM-DD')
      WHEN 'weekly' THEN TO_CHAR(production_date, 'IYYY-IW')
      WHEN 'monthly' THEN TO_CHAR(production_date, 'YYYY-MM')
      WHEN 'yearly' THEN TO_CHAR(production_date, 'YYYY')
      ELSE TO_CHAR(production_date, 'YYYY-MM')
    END AS period,
    COALESCE(SUM(production_records.quantity), 0)::BIGINT AS quantity,
    COALESCE(SUM(production_records.area_pyeong), 0)::NUMERIC AS area_pyeong
  FROM production_records
  WHERE
    production_date IS NOT NULL
    AND (start_date IS NULL OR production_date >= start_date)
    AND (end_date IS NULL OR production_date <= end_date)
    AND (
      (row_dimension = 'client' AND production_records.client IS NOT NULL) OR
      (row_dimension = 'product' AND production_records.product_name IS NOT NULL)
    )
  GROUP BY dimension_value, period
  ORDER BY dimension_value ASC, period ASC;
END;
$$;

-- 9. 거래처 목록 조회 (필터용)
CREATE OR REPLACE FUNCTION get_client_list(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  client VARCHAR,
  total_quantity BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    production_records.client,
    COALESCE(SUM(production_records.quantity), 0)::BIGINT AS total_quantity
  FROM production_records
  WHERE
    production_records.client IS NOT NULL
    AND (start_date IS NULL OR production_date >= start_date)
    AND (end_date IS NULL OR production_date <= end_date)
  GROUP BY production_records.client
  ORDER BY total_quantity DESC;
END;
$$;

-- 10. 품목 목록 조회 (필터용)
CREATE OR REPLACE FUNCTION get_product_list(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  product_name VARCHAR,
  total_quantity BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    production_records.product_name,
    COALESCE(SUM(production_records.quantity), 0)::BIGINT AS total_quantity
  FROM production_records
  WHERE
    production_records.product_name IS NOT NULL
    AND (start_date IS NULL OR production_date >= start_date)
    AND (end_date IS NULL OR production_date <= end_date)
  GROUP BY production_records.product_name
  ORDER BY total_quantity DESC;
END;
$$;

-- 권한 부여 (다차원 분석 함수)
GRANT EXECUTE ON FUNCTION get_analysis_by_period_client(DATE, DATE, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_analysis_by_period_product(DATE, DATE, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_analysis_by_client_product(DATE, DATE, VARCHAR, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pivot_analysis(DATE, DATE, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_list(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_list(DATE, DATE) TO authenticated;

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

-- 6. 월별 거래처 분석
-- SELECT * FROM get_analysis_by_period_client(NULL, NULL, 'monthly');

-- 7. 월별 품목 분석
-- SELECT * FROM get_analysis_by_period_product(NULL, NULL, 'monthly');

-- 8. 거래처-품목 교차 분석
-- SELECT * FROM get_analysis_by_client_product(NULL, NULL, NULL, 100);

-- 9. 피벗 분석 (거래처별 월별)
-- SELECT * FROM get_pivot_analysis(NULL, NULL, 'client', 'monthly');
-- ===================================================================
