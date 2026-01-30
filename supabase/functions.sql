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
-- 전년 동기 대비 분석 함수 (Year-over-Year Comparison)
-- ===================================================================

-- 11. 전년 동기 대비 통계 (KPI용)
CREATE OR REPLACE FUNCTION get_yoy_comparison(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  current_quantity BIGINT,
  current_area_pyeong NUMERIC,
  current_clients BIGINT,
  prev_year_quantity BIGINT,
  prev_year_area_pyeong NUMERIC,
  prev_year_clients BIGINT,
  quantity_growth_rate NUMERIC,
  area_growth_rate NUMERIC,
  client_growth_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calc_start_date DATE;
  calc_end_date DATE;
  prev_start_date DATE;
  prev_end_date DATE;
  curr_qty BIGINT;
  curr_area NUMERIC;
  curr_clients BIGINT;
  prev_qty BIGINT;
  prev_area NUMERIC;
  prev_clients BIGINT;
BEGIN
  -- 날짜 범위 설정 (기본값: 최근 30일)
  calc_end_date := COALESCE(end_date, CURRENT_DATE);
  calc_start_date := COALESCE(start_date, calc_end_date - INTERVAL '30 days');

  -- 전년 동기 날짜 계산
  prev_end_date := calc_end_date - INTERVAL '1 year';
  prev_start_date := calc_start_date - INTERVAL '1 year';

  -- 현재 기간 통계
  SELECT
    COALESCE(SUM(quantity), 0)::BIGINT,
    COALESCE(SUM(area_pyeong), 0)::NUMERIC,
    COUNT(DISTINCT client)::BIGINT
  INTO curr_qty, curr_area, curr_clients
  FROM production_records
  WHERE production_date >= calc_start_date AND production_date <= calc_end_date;

  -- 전년 동기 통계
  SELECT
    COALESCE(SUM(quantity), 0)::BIGINT,
    COALESCE(SUM(area_pyeong), 0)::NUMERIC,
    COUNT(DISTINCT client)::BIGINT
  INTO prev_qty, prev_area, prev_clients
  FROM production_records
  WHERE production_date >= prev_start_date AND production_date <= prev_end_date;

  RETURN QUERY SELECT
    curr_qty AS current_quantity,
    curr_area AS current_area_pyeong,
    curr_clients AS current_clients,
    prev_qty AS prev_year_quantity,
    prev_area AS prev_year_area_pyeong,
    prev_clients AS prev_year_clients,
    CASE WHEN prev_qty > 0
      THEN ROUND(((curr_qty - prev_qty)::NUMERIC / prev_qty * 100), 1)
      ELSE NULL
    END AS quantity_growth_rate,
    CASE WHEN prev_area > 0
      THEN ROUND(((curr_area - prev_area) / prev_area * 100), 1)
      ELSE NULL
    END AS area_growth_rate,
    CASE WHEN prev_clients > 0
      THEN ROUND(((curr_clients - prev_clients)::NUMERIC / prev_clients * 100), 1)
      ELSE NULL
    END AS client_growth_rate;
END;
$$;

-- 12. 전년 동월 대비 추이 (월별 비교 차트용)
CREATE OR REPLACE FUNCTION get_yoy_monthly_trend(
  target_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT
)
RETURNS TABLE (
  month INT,
  month_name VARCHAR,
  current_year_quantity BIGINT,
  current_year_area NUMERIC,
  prev_year_quantity BIGINT,
  prev_year_area NUMERIC,
  quantity_growth_rate NUMERIC,
  area_growth_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH current_year AS (
    SELECT
      EXTRACT(MONTH FROM production_date)::INT AS m,
      COALESCE(SUM(quantity), 0)::BIGINT AS qty,
      COALESCE(SUM(area_pyeong), 0)::NUMERIC AS area
    FROM production_records
    WHERE EXTRACT(YEAR FROM production_date) = target_year
    GROUP BY EXTRACT(MONTH FROM production_date)
  ),
  prev_year AS (
    SELECT
      EXTRACT(MONTH FROM production_date)::INT AS m,
      COALESCE(SUM(quantity), 0)::BIGINT AS qty,
      COALESCE(SUM(area_pyeong), 0)::NUMERIC AS area
    FROM production_records
    WHERE EXTRACT(YEAR FROM production_date) = target_year - 1
    GROUP BY EXTRACT(MONTH FROM production_date)
  ),
  all_months AS (
    SELECT generate_series(1, 12) AS m
  )
  SELECT
    am.m AS month,
    TO_CHAR(TO_DATE(am.m::TEXT, 'MM'), 'Mon')::VARCHAR AS month_name,
    COALESCE(cy.qty, 0) AS current_year_quantity,
    COALESCE(cy.area, 0) AS current_year_area,
    COALESCE(py.qty, 0) AS prev_year_quantity,
    COALESCE(py.area, 0) AS prev_year_area,
    CASE WHEN COALESCE(py.qty, 0) > 0
      THEN ROUND(((COALESCE(cy.qty, 0) - py.qty)::NUMERIC / py.qty * 100), 1)
      ELSE NULL
    END AS quantity_growth_rate,
    CASE WHEN COALESCE(py.area, 0) > 0
      THEN ROUND(((COALESCE(cy.area, 0) - py.area) / py.area * 100), 1)
      ELSE NULL
    END AS area_growth_rate
  FROM all_months am
  LEFT JOIN current_year cy ON am.m = cy.m
  LEFT JOIN prev_year py ON am.m = py.m
  ORDER BY am.m;
END;
$$;

-- 13. 성장률 추이 (일별 전년 동일 대비)
CREATE OR REPLACE FUNCTION get_daily_yoy_comparison(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  date DATE,
  current_quantity BIGINT,
  current_area NUMERIC,
  prev_year_quantity BIGINT,
  prev_year_area NUMERIC,
  quantity_growth_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calc_start_date DATE;
  calc_end_date DATE;
BEGIN
  calc_end_date := COALESCE(end_date, CURRENT_DATE);
  calc_start_date := COALESCE(start_date, calc_end_date - INTERVAL '30 days');

  RETURN QUERY
  WITH current_period AS (
    SELECT
      production_date AS d,
      COALESCE(SUM(quantity), 0)::BIGINT AS qty,
      COALESCE(SUM(area_pyeong), 0)::NUMERIC AS area
    FROM production_records
    WHERE production_date >= calc_start_date AND production_date <= calc_end_date
    GROUP BY production_date
  ),
  prev_year_period AS (
    SELECT
      production_date + INTERVAL '1 year' AS d,
      COALESCE(SUM(quantity), 0)::BIGINT AS qty,
      COALESCE(SUM(area_pyeong), 0)::NUMERIC AS area
    FROM production_records
    WHERE production_date >= (calc_start_date - INTERVAL '1 year')
      AND production_date <= (calc_end_date - INTERVAL '1 year')
    GROUP BY production_date
  )
  SELECT
    cp.d::DATE AS date,
    cp.qty AS current_quantity,
    cp.area AS current_area,
    COALESCE(pyp.qty, 0) AS prev_year_quantity,
    COALESCE(pyp.area, 0) AS prev_year_area,
    CASE WHEN COALESCE(pyp.qty, 0) > 0
      THEN ROUND(((cp.qty - pyp.qty)::NUMERIC / pyp.qty * 100), 1)
      ELSE NULL
    END AS quantity_growth_rate
  FROM current_period cp
  LEFT JOIN prev_year_period pyp ON cp.d = pyp.d
  ORDER BY cp.d ASC;
END;
$$;

-- 권한 부여 (전년 동기 대비 함수)
GRANT EXECUTE ON FUNCTION get_yoy_comparison(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_yoy_monthly_trend(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_yoy_comparison(DATE, DATE) TO authenticated;

-- ===================================================================
-- 이동평균 분석 함수 (Moving Average Analysis)
-- ===================================================================

-- 14. 이동평균 포함 생산량 추이
CREATE OR REPLACE FUNCTION get_production_trend_with_ma(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  ma_period_short INT DEFAULT 7,
  ma_period_long INT DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  quantity BIGINT,
  area_pyeong NUMERIC,
  ma_short NUMERIC,
  ma_long NUMERIC,
  std_dev NUMERIC,
  is_outlier BOOLEAN,
  trend_direction VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH daily_data AS (
    SELECT
      production_date AS d,
      COALESCE(SUM(production_records.quantity), 0)::BIGINT AS qty,
      COALESCE(SUM(production_records.area_pyeong), 0)::NUMERIC AS area
    FROM production_records
    WHERE
      production_date IS NOT NULL
      AND (start_date IS NULL OR production_date >= start_date)
      AND (end_date IS NULL OR production_date <= end_date)
    GROUP BY production_date
    ORDER BY production_date
  ),
  with_ma AS (
    SELECT
      d,
      qty,
      area,
      -- 단기 이동평균 (7일)
      ROUND(AVG(qty) OVER (
        ORDER BY d
        ROWS BETWEEN (ma_period_short - 1) PRECEDING AND CURRENT ROW
      ), 1) AS ma_s,
      -- 장기 이동평균 (30일)
      ROUND(AVG(qty) OVER (
        ORDER BY d
        ROWS BETWEEN (ma_period_long - 1) PRECEDING AND CURRENT ROW
      ), 1) AS ma_l,
      -- 표준편차 (30일 기준)
      ROUND(STDDEV(qty) OVER (
        ORDER BY d
        ROWS BETWEEN (ma_period_long - 1) PRECEDING AND CURRENT ROW
      ), 1) AS std
    FROM daily_data
  ),
  with_lag AS (
    SELECT
      wm.*,
      LAG(wm.ma_s, 3) OVER (ORDER BY wm.d) AS prev_ma_s
    FROM with_ma wm
  )
  SELECT
    wl.d::DATE AS date,
    wl.qty AS quantity,
    wl.area AS area_pyeong,
    wl.ma_s AS ma_short,
    wl.ma_l AS ma_long,
    wl.std AS std_dev,
    -- 이상치 판단: 장기 이동평균 ± 2 표준편차 벗어남
    CASE
      WHEN wl.std > 0 AND ABS(wl.qty - wl.ma_l) > (2 * wl.std) THEN TRUE
      ELSE FALSE
    END AS is_outlier,
    -- 추세 방향: 단기 이동평균 변화 기준
    CASE
      WHEN wl.prev_ma_s IS NULL THEN 'neutral'::VARCHAR
      WHEN wl.ma_s > wl.prev_ma_s * 1.02 THEN 'up'::VARCHAR
      WHEN wl.ma_s < wl.prev_ma_s * 0.98 THEN 'down'::VARCHAR
      ELSE 'neutral'::VARCHAR
    END AS trend_direction
  FROM with_lag wl
  ORDER BY wl.d ASC;
END;
$$;

-- 15. 추세 요약 통계 (대시보드용)
CREATE OR REPLACE FUNCTION get_trend_summary(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  overall_trend VARCHAR,
  trend_strength NUMERIC,
  outlier_count INT,
  avg_daily_quantity NUMERIC,
  max_quantity BIGINT,
  min_quantity BIGINT,
  volatility NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  calc_start DATE;
  calc_end DATE;
  first_half_avg NUMERIC;
  second_half_avg NUMERIC;
BEGIN
  calc_end := COALESCE(end_date, CURRENT_DATE);
  calc_start := COALESCE(start_date, calc_end - INTERVAL '30 days');

  -- 전반부/후반부 평균 비교로 전체 추세 계산
  SELECT
    AVG(CASE WHEN production_date < calc_start + (calc_end - calc_start) / 2 THEN quantity END),
    AVG(CASE WHEN production_date >= calc_start + (calc_end - calc_start) / 2 THEN quantity END)
  INTO first_half_avg, second_half_avg
  FROM production_records
  WHERE production_date >= calc_start AND production_date <= calc_end;

  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      production_date,
      SUM(quantity) AS daily_qty
    FROM production_records
    WHERE production_date >= calc_start AND production_date <= calc_end
    GROUP BY production_date
  ),
  stats AS (
    SELECT
      AVG(daily_qty) AS avg_qty,
      STDDEV(daily_qty) AS std_qty,
      MAX(daily_qty) AS max_qty,
      MIN(daily_qty) AS min_qty
    FROM daily_stats
  )
  SELECT
    CASE
      WHEN second_half_avg > first_half_avg * 1.05 THEN 'up'::VARCHAR
      WHEN second_half_avg < first_half_avg * 0.95 THEN 'down'::VARCHAR
      ELSE 'neutral'::VARCHAR
    END AS overall_trend,
    CASE
      WHEN first_half_avg > 0 THEN ROUND(((second_half_avg - first_half_avg) / first_half_avg * 100), 1)
      ELSE 0
    END AS trend_strength,
    (SELECT COUNT(*)::INT FROM daily_stats ds, stats s WHERE ABS(ds.daily_qty - s.avg_qty) > 2 * s.std_qty) AS outlier_count,
    ROUND(s.avg_qty, 1) AS avg_daily_quantity,
    s.max_qty::BIGINT AS max_quantity,
    s.min_qty::BIGINT AS min_quantity,
    CASE WHEN s.avg_qty > 0 THEN ROUND((s.std_qty / s.avg_qty * 100), 1) ELSE 0 END AS volatility
  FROM stats s;
END;
$$;

-- 권한 부여 (이동평균 함수)
GRANT EXECUTE ON FUNCTION get_production_trend_with_ma(DATE, DATE, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_trend_summary(DATE, DATE) TO authenticated;

-- ===================================================================
-- 거래처 집중도 분석 함수 (Client Concentration Analysis)
-- ===================================================================

-- 16. 거래처 집중도 분석 (ABC 분석 포함)
CREATE OR REPLACE FUNCTION get_client_concentration(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  client VARCHAR,
  quantity BIGINT,
  area_pyeong NUMERIC,
  percentage NUMERIC,
  cumulative_percentage NUMERIC,
  abc_grade VARCHAR,
  rank INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH client_totals AS (
    SELECT
      production_records.client,
      COALESCE(SUM(production_records.quantity), 0)::BIGINT AS qty,
      COALESCE(SUM(production_records.area_pyeong), 0)::NUMERIC AS area
    FROM production_records
    WHERE
      production_records.client IS NOT NULL
      AND (start_date IS NULL OR production_date >= start_date)
      AND (end_date IS NULL OR production_date <= end_date)
    GROUP BY production_records.client
  ),
  total_sum AS (
    SELECT SUM(qty) AS total_qty FROM client_totals
  ),
  with_percentage AS (
    SELECT
      ct.client,
      ct.qty,
      ct.area,
      ROUND((ct.qty::NUMERIC / NULLIF(ts.total_qty, 0) * 100), 2) AS pct,
      ROW_NUMBER() OVER (ORDER BY ct.qty DESC) AS rn
    FROM client_totals ct, total_sum ts
  ),
  with_cumulative AS (
    SELECT
      wp.*,
      SUM(wp.pct) OVER (ORDER BY wp.rn) AS cum_pct
    FROM with_percentage wp
  )
  SELECT
    wc.client,
    wc.qty AS quantity,
    wc.area AS area_pyeong,
    wc.pct AS percentage,
    wc.cum_pct AS cumulative_percentage,
    CASE
      WHEN wc.cum_pct <= 70 THEN 'A'::VARCHAR
      WHEN wc.cum_pct <= 90 THEN 'B'::VARCHAR
      ELSE 'C'::VARCHAR
    END AS abc_grade,
    wc.rn::INT AS rank
  FROM with_cumulative wc
  ORDER BY wc.rn;
END;
$$;

-- 17. 거래처 집중도 요약 (리스크 점수 포함)
CREATE OR REPLACE FUNCTION get_concentration_summary(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_clients INT,
  top1_percentage NUMERIC,
  top3_percentage NUMERIC,
  top5_percentage NUMERIC,
  top10_percentage NUMERIC,
  hhi_index NUMERIC,
  concentration_risk VARCHAR,
  risk_score INT,
  a_grade_count INT,
  b_grade_count INT,
  c_grade_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH client_totals AS (
    SELECT
      production_records.client,
      COALESCE(SUM(production_records.quantity), 0)::BIGINT AS qty
    FROM production_records
    WHERE
      production_records.client IS NOT NULL
      AND (start_date IS NULL OR production_date >= start_date)
      AND (end_date IS NULL OR production_date <= end_date)
    GROUP BY production_records.client
  ),
  total_sum AS (
    SELECT SUM(qty) AS total_qty, COUNT(*) AS client_count FROM client_totals
  ),
  with_percentage AS (
    SELECT
      ct.client,
      ct.qty,
      ROUND((ct.qty::NUMERIC / NULLIF(ts.total_qty, 0) * 100), 2) AS pct,
      ROW_NUMBER() OVER (ORDER BY ct.qty DESC) AS rn
    FROM client_totals ct, total_sum ts
  ),
  with_cumulative AS (
    SELECT
      wp.*,
      SUM(wp.pct) OVER (ORDER BY wp.rn) AS cum_pct
    FROM with_percentage wp
  ),
  hhi_calc AS (
    SELECT SUM(POWER(pct, 2)) AS hhi FROM with_percentage
  ),
  abc_counts AS (
    SELECT
      COUNT(CASE WHEN cum_pct <= 70 OR (rn = 1 AND pct <= 70) THEN 1 END) AS a_cnt,
      COUNT(CASE WHEN cum_pct > 70 AND cum_pct <= 90 THEN 1 END) AS b_cnt,
      COUNT(CASE WHEN cum_pct > 90 THEN 1 END) AS c_cnt
    FROM with_cumulative
  )
  SELECT
    ts.client_count::INT AS total_clients,
    COALESCE((SELECT pct FROM with_percentage WHERE rn = 1), 0) AS top1_percentage,
    COALESCE((SELECT cum_pct FROM with_cumulative WHERE rn = 3), 0) AS top3_percentage,
    COALESCE((SELECT cum_pct FROM with_cumulative WHERE rn = 5), 0) AS top5_percentage,
    COALESCE((SELECT cum_pct FROM with_cumulative WHERE rn = 10), 0) AS top10_percentage,
    ROUND(hc.hhi, 2) AS hhi_index,
    CASE
      WHEN hc.hhi >= 2500 THEN 'HIGH'::VARCHAR
      WHEN hc.hhi >= 1500 THEN 'MEDIUM'::VARCHAR
      ELSE 'LOW'::VARCHAR
    END AS concentration_risk,
    CASE
      WHEN hc.hhi >= 2500 THEN 3
      WHEN hc.hhi >= 1500 THEN 2
      ELSE 1
    END::INT AS risk_score,
    ac.a_cnt::INT AS a_grade_count,
    ac.b_cnt::INT AS b_grade_count,
    ac.c_cnt::INT AS c_grade_count
  FROM total_sum ts, hhi_calc hc, abc_counts ac;
END;
$$;

-- 18. 고위험 거래처 목록 (비중 > 임계값)
CREATE OR REPLACE FUNCTION get_high_risk_clients(
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  threshold_pct NUMERIC DEFAULT 20
)
RETURNS TABLE (
  client VARCHAR,
  quantity BIGINT,
  percentage NUMERIC,
  risk_level VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH client_totals AS (
    SELECT
      production_records.client,
      COALESCE(SUM(production_records.quantity), 0)::BIGINT AS qty
    FROM production_records
    WHERE
      production_records.client IS NOT NULL
      AND (start_date IS NULL OR production_date >= start_date)
      AND (end_date IS NULL OR production_date <= end_date)
    GROUP BY production_records.client
  ),
  total_sum AS (
    SELECT SUM(qty) AS total_qty FROM client_totals
  ),
  with_percentage AS (
    SELECT
      ct.client,
      ct.qty,
      ROUND((ct.qty::NUMERIC / NULLIF(ts.total_qty, 0) * 100), 2) AS pct
    FROM client_totals ct, total_sum ts
  )
  SELECT
    wp.client,
    wp.qty AS quantity,
    wp.pct AS percentage,
    CASE
      WHEN wp.pct >= 30 THEN 'CRITICAL'::VARCHAR
      WHEN wp.pct >= threshold_pct THEN 'WARNING'::VARCHAR
      ELSE 'NORMAL'::VARCHAR
    END AS risk_level
  FROM with_percentage wp
  WHERE wp.pct >= threshold_pct
  ORDER BY wp.pct DESC;
END;
$$;

-- 권한 부여 (거래처 집중도 함수)
GRANT EXECUTE ON FUNCTION get_client_concentration(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_concentration_summary(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_high_risk_clients(DATE, DATE, NUMERIC) TO authenticated;

-- ===================================================================
-- 목표 관리 테이블 및 함수 (Production Targets)
-- ===================================================================

-- 목표 테이블 생성
CREATE TABLE IF NOT EXISTS production_targets (
  id SERIAL PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  target_quantity BIGINT NOT NULL DEFAULT 0,
  target_area_pyeong NUMERIC NOT NULL DEFAULT 0,
  client VARCHAR DEFAULT NULL,  -- NULL이면 전체
  product_name VARCHAR DEFAULT NULL,  -- NULL이면 전체
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(year, month, client, product_name)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_production_targets_year_month ON production_targets(year, month);
CREATE INDEX IF NOT EXISTS idx_production_targets_client ON production_targets(client);

-- RLS 활성화
ALTER TABLE production_targets ENABLE ROW LEVEL SECURITY;

-- RLS 정책 (인증된 사용자는 모든 목표 조회/수정 가능)
DROP POLICY IF EXISTS "Enable read for authenticated users" ON production_targets;
CREATE POLICY "Enable read for authenticated users" ON production_targets
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON production_targets;
CREATE POLICY "Enable insert for authenticated users" ON production_targets
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON production_targets;
CREATE POLICY "Enable update for authenticated users" ON production_targets
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON production_targets;
CREATE POLICY "Enable delete for authenticated users" ON production_targets
  FOR DELETE TO authenticated USING (true);

-- updated_at 트리거
CREATE OR REPLACE FUNCTION update_production_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_production_targets_updated_at ON production_targets;
CREATE TRIGGER trigger_update_production_targets_updated_at
  BEFORE UPDATE ON production_targets
  FOR EACH ROW EXECUTE FUNCTION update_production_targets_updated_at();

-- 19. 월별 목표 달성률 조회
CREATE OR REPLACE FUNCTION get_monthly_achievement(
  target_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  target_month INT DEFAULT EXTRACT(MONTH FROM CURRENT_DATE)::INT
)
RETURNS TABLE (
  year INT,
  month INT,
  target_quantity BIGINT,
  target_area_pyeong NUMERIC,
  actual_quantity BIGINT,
  actual_area_pyeong NUMERIC,
  quantity_achievement_rate NUMERIC,
  area_achievement_rate NUMERIC,
  remaining_quantity BIGINT,
  remaining_area NUMERIC,
  days_passed INT,
  days_remaining INT,
  daily_target_quantity NUMERIC,
  is_on_track BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  first_day DATE;
  last_day DATE;
  today DATE := CURRENT_DATE;
  total_days INT;
  passed_days INT;
BEGIN
  first_day := make_date(target_year, target_month, 1);
  last_day := (first_day + INTERVAL '1 month - 1 day')::DATE;
  total_days := EXTRACT(DAY FROM last_day)::INT;

  IF today < first_day THEN
    passed_days := 0;
  ELSIF today > last_day THEN
    passed_days := total_days;
  ELSE
    passed_days := EXTRACT(DAY FROM today)::INT;
  END IF;

  RETURN QUERY
  WITH targets AS (
    SELECT
      COALESCE(SUM(pt.target_quantity), 0)::BIGINT AS t_qty,
      COALESCE(SUM(pt.target_area_pyeong), 0)::NUMERIC AS t_area
    FROM production_targets pt
    WHERE pt.year = target_year AND pt.month = target_month
      AND pt.client IS NULL AND pt.product_name IS NULL
  ),
  actuals AS (
    SELECT
      COALESCE(SUM(quantity), 0)::BIGINT AS a_qty,
      COALESCE(SUM(area_pyeong), 0)::NUMERIC AS a_area
    FROM production_records
    WHERE EXTRACT(YEAR FROM production_date) = target_year
      AND EXTRACT(MONTH FROM production_date) = target_month
  )
  SELECT
    target_year AS year,
    target_month AS month,
    t.t_qty AS target_quantity,
    t.t_area AS target_area_pyeong,
    a.a_qty AS actual_quantity,
    a.a_area AS actual_area_pyeong,
    CASE WHEN t.t_qty > 0 THEN ROUND((a.a_qty::NUMERIC / t.t_qty * 100), 1) ELSE 0 END AS quantity_achievement_rate,
    CASE WHEN t.t_area > 0 THEN ROUND((a.a_area / t.t_area * 100), 1) ELSE 0 END AS area_achievement_rate,
    GREATEST(t.t_qty - a.a_qty, 0)::BIGINT AS remaining_quantity,
    GREATEST(t.t_area - a.a_area, 0)::NUMERIC AS remaining_area,
    passed_days AS days_passed,
    (total_days - passed_days) AS days_remaining,
    CASE WHEN (total_days - passed_days) > 0
      THEN ROUND((GREATEST(t.t_qty - a.a_qty, 0)::NUMERIC / (total_days - passed_days)), 1)
      ELSE 0
    END AS daily_target_quantity,
    CASE WHEN t.t_qty > 0
      THEN (a.a_qty::NUMERIC / t.t_qty) >= (passed_days::NUMERIC / total_days)
      ELSE TRUE
    END AS is_on_track
  FROM targets t, actuals a;
END;
$$;

-- 20. 연간 목표 달성률 추이
CREATE OR REPLACE FUNCTION get_yearly_achievement_trend(
  target_year INT DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INT
)
RETURNS TABLE (
  month INT,
  month_name VARCHAR,
  target_quantity BIGINT,
  actual_quantity BIGINT,
  achievement_rate NUMERIC,
  is_completed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH all_months AS (
    SELECT generate_series(1, 12) AS m
  ),
  targets AS (
    SELECT
      pt.month AS m,
      COALESCE(SUM(pt.target_quantity), 0)::BIGINT AS t_qty
    FROM production_targets pt
    WHERE pt.year = target_year
      AND pt.client IS NULL AND pt.product_name IS NULL
    GROUP BY pt.month
  ),
  actuals AS (
    SELECT
      EXTRACT(MONTH FROM production_date)::INT AS m,
      COALESCE(SUM(quantity), 0)::BIGINT AS a_qty
    FROM production_records
    WHERE EXTRACT(YEAR FROM production_date) = target_year
    GROUP BY EXTRACT(MONTH FROM production_date)
  )
  SELECT
    am.m AS month,
    TO_CHAR(TO_DATE(am.m::TEXT, 'MM'), 'Mon')::VARCHAR AS month_name,
    COALESCE(t.t_qty, 0)::BIGINT AS target_quantity,
    COALESCE(a.a_qty, 0)::BIGINT AS actual_quantity,
    CASE WHEN COALESCE(t.t_qty, 0) > 0
      THEN ROUND((COALESCE(a.a_qty, 0)::NUMERIC / t.t_qty * 100), 1)
      ELSE 0
    END AS achievement_rate,
    (am.m < EXTRACT(MONTH FROM CURRENT_DATE) OR
     (am.m = EXTRACT(MONTH FROM CURRENT_DATE) AND target_year < EXTRACT(YEAR FROM CURRENT_DATE)))
    AS is_completed
  FROM all_months am
  LEFT JOIN targets t ON am.m = t.m
  LEFT JOIN actuals a ON am.m = a.m
  ORDER BY am.m;
END;
$$;

-- 21. 목표 목록 조회
CREATE OR REPLACE FUNCTION get_production_targets(
  target_year INT DEFAULT NULL
)
RETURNS TABLE (
  id INT,
  year INT,
  month INT,
  target_quantity BIGINT,
  target_area_pyeong NUMERIC,
  client VARCHAR,
  product_name VARCHAR,
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id,
    pt.year,
    pt.month,
    pt.target_quantity,
    pt.target_area_pyeong,
    pt.client,
    pt.product_name,
    pt.description,
    pt.created_at,
    pt.updated_at
  FROM production_targets pt
  WHERE (target_year IS NULL OR pt.year = target_year)
  ORDER BY pt.year DESC, pt.month DESC, pt.client NULLS FIRST;
END;
$$;

-- 권한 부여 (목표 관리 함수)
GRANT EXECUTE ON FUNCTION get_monthly_achievement(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_yearly_achievement_trend(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_production_targets(INT) TO authenticated;

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
