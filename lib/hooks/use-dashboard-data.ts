import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';

export interface DashboardStats {
  totalQuantity: number;
  totalAreaPyeong: number;
  uniqueClients: number;
  todayQuantity: number;
}

export interface ProductionTrend {
  date: string;
  quantity: number;
  area_pyeong: number;
}

export interface ClientStats {
  client: string;
  quantity: number;
  area_pyeong: number;
}

export interface ProductStats {
  product_name: string;
  quantity: number;
  area_pyeong: number;
}

export interface YoYComparison {
  currentQuantity: number;
  currentAreaPyeong: number;
  currentClients: number;
  prevYearQuantity: number;
  prevYearAreaPyeong: number;
  prevYearClients: number;
  quantityGrowthRate: number | null;
  areaGrowthRate: number | null;
  clientGrowthRate: number | null;
}

export interface YoYMonthlyTrend {
  month: number;
  monthName: string;
  currentYearQuantity: number;
  currentYearArea: number;
  prevYearQuantity: number;
  prevYearArea: number;
  quantityGrowthRate: number | null;
  areaGrowthRate: number | null;
}

export interface DailyYoYComparison {
  date: string;
  currentQuantity: number;
  currentArea: number;
  prevYearQuantity: number;
  prevYearArea: number;
  quantityGrowthRate: number | null;
}

export interface ProductionTrendWithMA {
  date: string;
  quantity: number;
  area_pyeong: number;
  maShort: number | null;
  maLong: number | null;
  stdDev: number | null;
  isOutlier: boolean;
  trendDirection: 'up' | 'down' | 'neutral';
}

export interface TrendSummary {
  overallTrend: 'up' | 'down' | 'neutral';
  trendStrength: number;
  outlierCount: number;
  avgDailyQuantity: number;
  maxQuantity: number;
  minQuantity: number;
  volatility: number;
}

export interface ClientConcentration {
  client: string;
  quantity: number;
  areaPyeong: number;
  percentage: number;
  cumulativePercentage: number;
  abcGrade: 'A' | 'B' | 'C';
  rank: number;
}

export interface ConcentrationSummary {
  totalClients: number;
  top1Percentage: number;
  top3Percentage: number;
  top5Percentage: number;
  top10Percentage: number;
  hhiIndex: number;
  concentrationRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  aGradeCount: number;
  bGradeCount: number;
  cGradeCount: number;
}

export interface HighRiskClient {
  client: string;
  quantity: number;
  percentage: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'NORMAL';
}

export interface MonthlyAchievement {
  year: number;
  month: number;
  targetQuantity: number;
  targetAreaPyeong: number;
  actualQuantity: number;
  actualAreaPyeong: number;
  quantityAchievementRate: number;
  areaAchievementRate: number;
  remainingQuantity: number;
  remainingArea: number;
  daysPassed: number;
  daysRemaining: number;
  dailyTargetQuantity: number;
  isOnTrack: boolean;
}

export interface YearlyAchievementTrend {
  month: number;
  monthName: string;
  targetQuantity: number;
  actualQuantity: number;
  achievementRate: number;
  isCompleted: boolean;
}

export interface ProductionTarget {
  id: number;
  year: number;
  month: number;
  targetQuantity: number;
  targetAreaPyeong: number;
  client: string | null;
  productName: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// 전체 통계 조회 (PostgreSQL RPC 함수 사용)
export function useDashboardStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['dashboard-stats', startDate, endDate],
    queryFn: async (): Promise<DashboardStats> => {
      const { data, error } = await supabase.rpc('get_dashboard_stats', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });

      if (error) {
        console.error('Dashboard stats error:', error);
        throw error;
      }

      // RPC 함수는 배열을 반환하므로 첫 번째 요소 사용
      const stats = data?.[0] || {
        total_quantity: 0,
        total_area_pyeong: 0,
        unique_clients: 0,
        today_quantity: 0,
      };

      return {
        totalQuantity: Number(stats.total_quantity) || 0,
        totalAreaPyeong: Number(stats.total_area_pyeong) || 0,
        uniqueClients: Number(stats.unique_clients) || 0,
        todayQuantity: Number(stats.today_quantity) || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5분간 캐시
  });
}

// 생산량 추이 조회 (PostgreSQL RPC 함수 사용)
export function useProductionTrend(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['production-trend', startDate, endDate],
    queryFn: async (): Promise<ProductionTrend[]> => {
      const { data, error } = await supabase.rpc('get_production_trend', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });

      if (error) {
        console.error('Production trend error:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        date: row.date,
        quantity: Number(row.quantity) || 0,
        area_pyeong: Number(row.area_pyeong) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// 거래처별 통계 조회 (PostgreSQL RPC 함수 사용)
export function useClientStats(startDate?: Date, endDate?: Date, limit: number = 10) {
  return useQuery({
    queryKey: ['client-stats', startDate, endDate, limit],
    queryFn: async (): Promise<ClientStats[]> => {
      const { data, error } = await supabase.rpc('get_client_stats', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        limit_count: limit,
      });

      if (error) {
        console.error('Client stats error:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        client: row.client,
        quantity: Number(row.quantity) || 0,
        area_pyeong: Number(row.area_pyeong) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// 품목별 통계 조회 (PostgreSQL RPC 함수 사용)
export function useProductStats(startDate?: Date, endDate?: Date, limit: number = 10) {
  return useQuery({
    queryKey: ['product-stats', startDate, endDate, limit],
    queryFn: async (): Promise<ProductStats[]> => {
      const { data, error } = await supabase.rpc('get_product_stats', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        limit_count: limit,
      });

      if (error) {
        console.error('Product stats error:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        product_name: row.product_name,
        quantity: Number(row.quantity) || 0,
        area_pyeong: Number(row.area_pyeong) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// 전년 동기 대비 통계 조회 (YoY Comparison)
export function useYoYComparison(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['yoy-comparison', startDate, endDate],
    queryFn: async (): Promise<YoYComparison | null> => {
      const { data, error } = await supabase.rpc('get_yoy_comparison', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });

      if (error) {
        // 함수가 없는 경우 null 반환 (fallback)
        console.warn('YoY comparison not available:', error.message);
        return null;
      }

      const row = data?.[0] || {};
      return {
        currentQuantity: Number(row.current_quantity) || 0,
        currentAreaPyeong: Number(row.current_area_pyeong) || 0,
        currentClients: Number(row.current_clients) || 0,
        prevYearQuantity: Number(row.prev_year_quantity) || 0,
        prevYearAreaPyeong: Number(row.prev_year_area_pyeong) || 0,
        prevYearClients: Number(row.prev_year_clients) || 0,
        quantityGrowthRate: row.quantity_growth_rate !== null ? Number(row.quantity_growth_rate) : null,
        areaGrowthRate: row.area_growth_rate !== null ? Number(row.area_growth_rate) : null,
        clientGrowthRate: row.client_growth_rate !== null ? Number(row.client_growth_rate) : null,
      };
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 전년 동월 대비 추이 (월별 비교)
export function useYoYMonthlyTrend(targetYear?: number) {
  const year = targetYear || new Date().getFullYear();
  return useQuery({
    queryKey: ['yoy-monthly-trend', year],
    queryFn: async (): Promise<YoYMonthlyTrend[]> => {
      const { data, error } = await supabase.rpc('get_yoy_monthly_trend', {
        target_year: year,
      });

      if (error) {
        // 함수가 없는 경우 빈 배열 반환 (fallback)
        console.warn('YoY monthly trend not available:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        month: Number(row.month),
        monthName: row.month_name,
        currentYearQuantity: Number(row.current_year_quantity) || 0,
        currentYearArea: Number(row.current_year_area) || 0,
        prevYearQuantity: Number(row.prev_year_quantity) || 0,
        prevYearArea: Number(row.prev_year_area) || 0,
        quantityGrowthRate: row.quantity_growth_rate !== null ? Number(row.quantity_growth_rate) : null,
        areaGrowthRate: row.area_growth_rate !== null ? Number(row.area_growth_rate) : null,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 일별 전년 동일 대비 (성장률 추이)
export function useDailyYoYComparison(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['daily-yoy-comparison', startDate, endDate],
    queryFn: async (): Promise<DailyYoYComparison[]> => {
      const { data, error } = await supabase.rpc('get_daily_yoy_comparison', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });

      if (error) {
        console.error('Daily YoY comparison error:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        date: row.date,
        currentQuantity: Number(row.current_quantity) || 0,
        currentArea: Number(row.current_area) || 0,
        prevYearQuantity: Number(row.prev_year_quantity) || 0,
        prevYearArea: Number(row.prev_year_area) || 0,
        quantityGrowthRate: row.quantity_growth_rate !== null ? Number(row.quantity_growth_rate) : null,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// 이동평균 포함 생산량 추이 조회
export function useProductionTrendWithMA(
  startDate?: Date,
  endDate?: Date,
  maShort: number = 7,
  maLong: number = 30
) {
  return useQuery({
    queryKey: ['production-trend-ma', startDate, endDate, maShort, maLong],
    queryFn: async (): Promise<ProductionTrendWithMA[]> => {
      const { data, error } = await supabase.rpc('get_production_trend_with_ma', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        ma_period_short: maShort,
        ma_period_long: maLong,
      });

      if (error) {
        // 함수가 없는 경우 빈 배열 반환 (fallback)
        console.warn('Production trend with MA not available:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        date: row.date,
        quantity: Number(row.quantity) || 0,
        area_pyeong: Number(row.area_pyeong) || 0,
        maShort: row.ma_short !== null ? Number(row.ma_short) : null,
        maLong: row.ma_long !== null ? Number(row.ma_long) : null,
        stdDev: row.std_dev !== null ? Number(row.std_dev) : null,
        isOutlier: row.is_outlier || false,
        trendDirection: row.trend_direction || 'neutral',
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 추세 요약 통계 조회
export function useTrendSummary(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['trend-summary', startDate, endDate],
    queryFn: async (): Promise<TrendSummary | null> => {
      const { data, error } = await supabase.rpc('get_trend_summary', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });

      if (error) {
        // 함수가 없는 경우 null 반환 (fallback)
        console.warn('Trend summary not available:', error.message);
        return null;
      }

      const row = data?.[0] || {};
      return {
        overallTrend: row.overall_trend || 'neutral',
        trendStrength: Number(row.trend_strength) || 0,
        outlierCount: Number(row.outlier_count) || 0,
        avgDailyQuantity: Number(row.avg_daily_quantity) || 0,
        maxQuantity: Number(row.max_quantity) || 0,
        minQuantity: Number(row.min_quantity) || 0,
        volatility: Number(row.volatility) || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 거래처 집중도 분석 (ABC 분석 포함)
export function useClientConcentration(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['client-concentration', startDate, endDate],
    queryFn: async (): Promise<ClientConcentration[]> => {
      const { data, error } = await supabase.rpc('get_client_concentration', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });

      if (error) {
        console.warn('Client concentration not available:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        client: row.client,
        quantity: Number(row.quantity) || 0,
        areaPyeong: Number(row.area_pyeong) || 0,
        percentage: Number(row.percentage) || 0,
        cumulativePercentage: Number(row.cumulative_percentage) || 0,
        abcGrade: row.abc_grade || 'C',
        rank: Number(row.rank) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 거래처 집중도 요약 (리스크 점수 포함)
export function useConcentrationSummary(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['concentration-summary', startDate, endDate],
    queryFn: async (): Promise<ConcentrationSummary | null> => {
      const { data, error } = await supabase.rpc('get_concentration_summary', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });

      if (error) {
        console.warn('Concentration summary not available:', error.message);
        return null;
      }

      const row = data?.[0] || {};
      return {
        totalClients: Number(row.total_clients) || 0,
        top1Percentage: Number(row.top1_percentage) || 0,
        top3Percentage: Number(row.top3_percentage) || 0,
        top5Percentage: Number(row.top5_percentage) || 0,
        top10Percentage: Number(row.top10_percentage) || 0,
        hhiIndex: Number(row.hhi_index) || 0,
        concentrationRisk: row.concentration_risk || 'LOW',
        riskScore: Number(row.risk_score) || 1,
        aGradeCount: Number(row.a_grade_count) || 0,
        bGradeCount: Number(row.b_grade_count) || 0,
        cGradeCount: Number(row.c_grade_count) || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 고위험 거래처 목록
export function useHighRiskClients(startDate?: Date, endDate?: Date, threshold: number = 20) {
  return useQuery({
    queryKey: ['high-risk-clients', startDate, endDate, threshold],
    queryFn: async (): Promise<HighRiskClient[]> => {
      const { data, error } = await supabase.rpc('get_high_risk_clients', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        threshold_pct: threshold,
      });

      if (error) {
        console.warn('High risk clients not available:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        client: row.client,
        quantity: Number(row.quantity) || 0,
        percentage: Number(row.percentage) || 0,
        riskLevel: row.risk_level || 'NORMAL',
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 월별 목표 달성률 조회
export function useMonthlyAchievement(year?: number, month?: number) {
  const currentYear = year || new Date().getFullYear();
  const currentMonth = month || new Date().getMonth() + 1;

  return useQuery({
    queryKey: ['monthly-achievement', currentYear, currentMonth],
    queryFn: async (): Promise<MonthlyAchievement | null> => {
      const { data, error } = await supabase.rpc('get_monthly_achievement', {
        target_year: currentYear,
        target_month: currentMonth,
      });

      if (error) {
        console.warn('Monthly achievement not available:', error.message);
        return null;
      }

      const row = data?.[0] || {};
      return {
        year: Number(row.year) || currentYear,
        month: Number(row.month) || currentMonth,
        targetQuantity: Number(row.target_quantity) || 0,
        targetAreaPyeong: Number(row.target_area_pyeong) || 0,
        actualQuantity: Number(row.actual_quantity) || 0,
        actualAreaPyeong: Number(row.actual_area_pyeong) || 0,
        quantityAchievementRate: Number(row.quantity_achievement_rate) || 0,
        areaAchievementRate: Number(row.area_achievement_rate) || 0,
        remainingQuantity: Number(row.remaining_quantity) || 0,
        remainingArea: Number(row.remaining_area) || 0,
        daysPassed: Number(row.days_passed) || 0,
        daysRemaining: Number(row.days_remaining) || 0,
        dailyTargetQuantity: Number(row.daily_target_quantity) || 0,
        isOnTrack: row.is_on_track ?? true,
      };
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 연간 목표 달성률 추이
export function useYearlyAchievementTrend(year?: number) {
  const currentYear = year || new Date().getFullYear();

  return useQuery({
    queryKey: ['yearly-achievement-trend', currentYear],
    queryFn: async (): Promise<YearlyAchievementTrend[]> => {
      const { data, error } = await supabase.rpc('get_yearly_achievement_trend', {
        target_year: currentYear,
      });

      if (error) {
        console.warn('Yearly achievement trend not available:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        month: Number(row.month) || 0,
        monthName: row.month_name || '',
        targetQuantity: Number(row.target_quantity) || 0,
        actualQuantity: Number(row.actual_quantity) || 0,
        achievementRate: Number(row.achievement_rate) || 0,
        isCompleted: row.is_completed || false,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 목표 목록 조회
export function useProductionTargets(year?: number) {
  return useQuery({
    queryKey: ['production-targets', year],
    queryFn: async (): Promise<ProductionTarget[]> => {
      const { data, error } = await supabase.rpc('get_production_targets', {
        target_year: year || null,
      });

      if (error) {
        console.warn('Production targets not available:', error.message);
        return [];
      }

      return (data || []).map((row: any) => ({
        id: Number(row.id) || 0,
        year: Number(row.year) || 0,
        month: Number(row.month) || 0,
        targetQuantity: Number(row.target_quantity) || 0,
        targetAreaPyeong: Number(row.target_area_pyeong) || 0,
        client: row.client || null,
        productName: row.product_name || null,
        description: row.description || null,
        createdAt: row.created_at || '',
        updatedAt: row.updated_at || '',
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}
