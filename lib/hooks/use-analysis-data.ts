import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type RowDimension = 'client' | 'product';
export type MetricType = 'quantity' | 'area_pyeong';

export interface AnalysisByPeriodClient {
  period: string;
  client: string;
  quantity: number;
  area_pyeong: number;
  record_count: number;
}

export interface AnalysisByPeriodProduct {
  period: string;
  product_name: string;
  quantity: number;
  area_pyeong: number;
  record_count: number;
}

export interface AnalysisByClientProduct {
  client: string;
  product_name: string;
  quantity: number;
  area_pyeong: number;
  record_count: number;
}

export interface PivotData {
  dimension_value: string;
  period: string;
  quantity: number;
  area_pyeong: number;
}

export interface ClientListItem {
  client: string;
  total_quantity: number;
}

export interface ProductListItem {
  product_name: string;
  total_quantity: number;
}

// 집중도 분석 관련 인터페이스
export interface ConcentrationData {
  name: string;
  quantity: number;
  areaPyeong: number;
  percentage: number;
  cumulativePercentage: number;
  abcGrade: 'A' | 'B' | 'C';
  rank: number;
}

export interface ConcentrationSummary {
  totalCount: number;
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

// 이동평균 분석 관련 인터페이스
export interface TrendDataPoint {
  date: string;
  quantity: number;
  area_pyeong: number;
  maShort: number | null;
  maLong: number | null;
  stdDev: number | null;
  isOutlier: boolean;
  trendDirection: 'up' | 'down' | 'neutral';
}

export interface TrendSummaryData {
  overallTrend: 'up' | 'down' | 'neutral';
  trendStrength: number;
  outlierCount: number;
  avgDailyQuantity: number;
  avgDailyArea: number;
  maxQuantity: number;
  minQuantity: number;
  maxArea: number;
  minArea: number;
  volatility: number;
  totalDays: number;
}

// 전년 동기 대비 분석 관련 인터페이스
export interface YoYMonthlyData {
  month: number;
  monthName: string;
  currentYearQuantity: number;
  currentYearArea: number;
  prevYearQuantity: number;
  prevYearArea: number;
  quantityGrowthRate: number | null;
  areaGrowthRate: number | null;
}

export interface YoYSummaryData {
  currentYearTotal: number;
  prevYearTotal: number;
  overallGrowthRate: number | null;
  avgMonthlyGrowth: number | null;
  bestMonth: { month: number; rate: number } | null;
  worstMonth: { month: number; rate: number } | null;
  positiveMonths: number;
  negativeMonths: number;
}

// 기간 x 거래처별 분석
export function useAnalysisByPeriodClient(
  startDate?: Date,
  endDate?: Date,
  periodType: PeriodType = 'monthly'
) {
  return useQuery({
    queryKey: ['analysis-period-client', startDate, endDate, periodType],
    queryFn: async (): Promise<AnalysisByPeriodClient[]> => {
      const { data, error } = await supabase.rpc('get_analysis_by_period_client', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        period_type: periodType,
      });

      if (error) {
        console.error('Analysis by period client error:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        period: row.period,
        client: row.client,
        quantity: Number(row.quantity) || 0,
        area_pyeong: Number(row.area_pyeong) || 0,
        record_count: Number(row.record_count) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 기간 x 품목별 분석
export function useAnalysisByPeriodProduct(
  startDate?: Date,
  endDate?: Date,
  periodType: PeriodType = 'monthly'
) {
  return useQuery({
    queryKey: ['analysis-period-product', startDate, endDate, periodType],
    queryFn: async (): Promise<AnalysisByPeriodProduct[]> => {
      const { data, error } = await supabase.rpc('get_analysis_by_period_product', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        period_type: periodType,
      });

      if (error) {
        console.error('Analysis by period product error:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        period: row.period,
        product_name: row.product_name,
        quantity: Number(row.quantity) || 0,
        area_pyeong: Number(row.area_pyeong) || 0,
        record_count: Number(row.record_count) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 거래처 x 품목별 분석
export function useAnalysisByClientProduct(
  startDate?: Date,
  endDate?: Date,
  clientFilter?: string,
  limit: number = 100
) {
  return useQuery({
    queryKey: ['analysis-client-product', startDate, endDate, clientFilter, limit],
    queryFn: async (): Promise<AnalysisByClientProduct[]> => {
      const { data, error } = await supabase.rpc('get_analysis_by_client_product', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        client_filter: clientFilter || null,
        limit_count: limit,
      });

      if (error) {
        console.error('Analysis by client product error:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        client: row.client,
        product_name: row.product_name,
        quantity: Number(row.quantity) || 0,
        area_pyeong: Number(row.area_pyeong) || 0,
        record_count: Number(row.record_count) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 피벗 분석
export function usePivotAnalysis(
  startDate?: Date,
  endDate?: Date,
  rowDimension: RowDimension = 'client',
  periodType: PeriodType = 'monthly'
) {
  return useQuery({
    queryKey: ['pivot-analysis', startDate, endDate, rowDimension, periodType],
    queryFn: async (): Promise<PivotData[]> => {
      const { data, error } = await supabase.rpc('get_pivot_analysis', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
        row_dimension: rowDimension,
        period_type: periodType,
      });

      if (error) {
        console.error('Pivot analysis error:', error.message, error.code, error.details);
        throw new Error(`Pivot analysis failed: ${error.message || 'Unknown error'}`);
      }

      return (data || []).map((row: any) => ({
        dimension_value: row.dimension_value,
        period: row.period,
        quantity: Number(row.quantity) || 0,
        area_pyeong: Number(row.area_pyeong) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 거래처 목록 (필터용)
export function useClientList(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['client-list', startDate, endDate],
    queryFn: async (): Promise<ClientListItem[]> => {
      const { data, error } = await supabase.rpc('get_client_list', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });

      if (error) {
        console.error('Client list error:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        client: row.client,
        total_quantity: Number(row.total_quantity) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 품목 목록 (필터용)
export function useProductList(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['product-list', startDate, endDate],
    queryFn: async (): Promise<ProductListItem[]> => {
      const { data, error } = await supabase.rpc('get_product_list', {
        start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
        end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      });

      if (error) {
        console.error('Product list error:', error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        product_name: row.product_name,
        total_quantity: Number(row.total_quantity) || 0,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}

// 피벗 테이블 데이터 변환 유틸리티
export function transformToPivotTable(
  data: PivotData[],
  metric: MetricType = 'quantity'
): {
  rows: string[];
  columns: string[];
  values: Record<string, Record<string, number>>;
  rowTotals: Record<string, number>;
  columnTotals: Record<string, number>;
  grandTotal: number;
} {
  const rows = [...new Set(data.map((d) => d.dimension_value))].sort();
  const columns = [...new Set(data.map((d) => d.period))].sort();

  const values: Record<string, Record<string, number>> = {};
  const rowTotals: Record<string, number> = {};
  const columnTotals: Record<string, number> = {};

  // 초기화
  rows.forEach((row) => {
    values[row] = {};
    rowTotals[row] = 0;
    columns.forEach((col) => {
      values[row][col] = 0;
    });
  });
  columns.forEach((col) => {
    columnTotals[col] = 0;
  });

  // 데이터 채우기
  data.forEach((item) => {
    const value = metric === 'quantity' ? item.quantity : item.area_pyeong;
    if (values[item.dimension_value]) {
      values[item.dimension_value][item.period] = value;
      rowTotals[item.dimension_value] += value;
      columnTotals[item.period] += value;
    }
  });

  const grandTotal = Object.values(rowTotals).reduce((sum, val) => sum + val, 0);

  return { rows, columns, values, rowTotals, columnTotals, grandTotal };
}

// 집중도 분석 (거래처/품목 모두 지원) - 클라이언트 사이드 계산
export function useConcentrationAnalysis(
  startDate?: Date,
  endDate?: Date,
  dimension: RowDimension = 'client',
  metric: MetricType = 'quantity'
) {
  // 피벗 데이터를 활용하여 집중도 계산
  const { data: pivotData, isLoading, error } = usePivotAnalysis(
    startDate,
    endDate,
    dimension,
    'monthly' // 기간별 집계 후 합산
  );

  // 집중도 데이터 계산
  const concentrationData = useMemo((): ConcentrationData[] => {
    if (!pivotData || pivotData.length === 0) return [];

    // 항목별 합계 계산
    const aggregated: Record<string, { quantity: number; areaPyeong: number }> = {};

    pivotData.forEach((item) => {
      if (!aggregated[item.dimension_value]) {
        aggregated[item.dimension_value] = { quantity: 0, areaPyeong: 0 };
      }
      aggregated[item.dimension_value].quantity += item.quantity;
      aggregated[item.dimension_value].areaPyeong += item.area_pyeong;
    });

    // 배열로 변환 및 정렬
    const items = Object.entries(aggregated)
      .map(([name, values]) => ({
        name,
        quantity: values.quantity,
        areaPyeong: values.areaPyeong,
        value: metric === 'quantity' ? values.quantity : values.areaPyeong,
      }))
      .sort((a, b) => b.value - a.value);

    // 전체 합계
    const total = items.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];

    // 비중 및 누적 비중 계산
    let cumulative = 0;
    return items.map((item, index) => {
      const percentage = (item.value / total) * 100;
      cumulative += percentage;

      // ABC 등급 결정
      let abcGrade: 'A' | 'B' | 'C';
      if (cumulative <= 70) {
        abcGrade = 'A';
      } else if (cumulative <= 90) {
        abcGrade = 'B';
      } else {
        abcGrade = 'C';
      }

      return {
        name: item.name,
        quantity: item.quantity,
        areaPyeong: item.areaPyeong,
        percentage,
        cumulativePercentage: cumulative,
        abcGrade,
        rank: index + 1,
      };
    });
  }, [pivotData, metric]);

  // 요약 통계 계산
  const summary = useMemo((): ConcentrationSummary | null => {
    if (concentrationData.length === 0) return null;

    const totalCount = concentrationData.length;
    const top1Percentage = concentrationData[0]?.percentage || 0;
    const top3Percentage = concentrationData.slice(0, 3).reduce((sum, item) => sum + item.percentage, 0);
    const top5Percentage = concentrationData.slice(0, 5).reduce((sum, item) => sum + item.percentage, 0);
    const top10Percentage = concentrationData.slice(0, 10).reduce((sum, item) => sum + item.percentage, 0);

    // HHI 지수 계산 (각 비중의 제곱의 합)
    const hhiIndex = Math.round(
      concentrationData.reduce((sum, item) => sum + Math.pow(item.percentage, 2), 0)
    );

    // 집중도 리스크 결정
    let concentrationRisk: 'HIGH' | 'MEDIUM' | 'LOW';
    let riskScore: number;

    if (hhiIndex >= 2500 || top1Percentage >= 25 || top3Percentage >= 60) {
      concentrationRisk = 'HIGH';
      riskScore = 5;
    } else if (hhiIndex >= 1500 || top1Percentage >= 15 || top5Percentage >= 70) {
      concentrationRisk = 'MEDIUM';
      riskScore = 3;
    } else {
      concentrationRisk = 'LOW';
      riskScore = 1;
    }

    // ABC 등급별 개수
    const aGradeCount = concentrationData.filter((item) => item.abcGrade === 'A').length;
    const bGradeCount = concentrationData.filter((item) => item.abcGrade === 'B').length;
    const cGradeCount = concentrationData.filter((item) => item.abcGrade === 'C').length;

    return {
      totalCount,
      top1Percentage,
      top3Percentage,
      top5Percentage,
      top10Percentage,
      hhiIndex,
      concentrationRisk,
      riskScore,
      aGradeCount,
      bGradeCount,
      cGradeCount,
    };
  }, [concentrationData]);

  return {
    data: concentrationData,
    summary,
    isLoading,
    error,
  };
}

// 이동평균 분석 훅 - 클라이언트 사이드 계산
export function useTrendAnalysis(
  startDate?: Date,
  endDate?: Date,
  maShortPeriod: number = 7,
  maLongPeriod: number = 30
) {
  // 피벗 데이터를 활용하여 일별 합계 계산
  const { data: pivotData, isLoading, error } = usePivotAnalysis(
    startDate,
    endDate,
    'client', // 거래처 기준으로 조회 후 일별 합산
    'daily'
  );

  // 일별 데이터로 변환 및 이동평균 계산
  const trendData = useMemo((): TrendDataPoint[] => {
    if (!pivotData || pivotData.length === 0) return [];

    // 날짜별 합계 계산
    const dailyData: Record<string, { quantity: number; area_pyeong: number }> = {};

    pivotData.forEach((item) => {
      if (!dailyData[item.period]) {
        dailyData[item.period] = { quantity: 0, area_pyeong: 0 };
      }
      dailyData[item.period].quantity += item.quantity;
      dailyData[item.period].area_pyeong += item.area_pyeong;
    });

    // 날짜순 정렬
    const sortedDates = Object.keys(dailyData).sort();
    const dataArray = sortedDates.map((date) => ({
      date,
      quantity: dailyData[date].quantity,
      area_pyeong: dailyData[date].area_pyeong,
    }));

    // 이동평균 및 통계 계산
    return dataArray.map((item, index) => {
      // 단기 이동평균
      const shortStart = Math.max(0, index - maShortPeriod + 1);
      const shortSlice = dataArray.slice(shortStart, index + 1);
      const maShort =
        shortSlice.length >= maShortPeriod
          ? shortSlice.reduce((sum, d) => sum + d.quantity, 0) / shortSlice.length
          : null;

      // 장기 이동평균
      const longStart = Math.max(0, index - maLongPeriod + 1);
      const longSlice = dataArray.slice(longStart, index + 1);
      const maLong =
        longSlice.length >= maLongPeriod
          ? longSlice.reduce((sum, d) => sum + d.quantity, 0) / longSlice.length
          : null;

      // 표준편차 계산 (장기 기준)
      let stdDev: number | null = null;
      if (longSlice.length >= maLongPeriod && maLong !== null) {
        const variance =
          longSlice.reduce((sum, d) => sum + Math.pow(d.quantity - maLong, 2), 0) /
          longSlice.length;
        stdDev = Math.sqrt(variance);
      }

      // 이상치 판정 (평균 ± 2 표준편차)
      const isOutlier =
        maLong !== null && stdDev !== null && Math.abs(item.quantity - maLong) > 2 * stdDev;

      // 추세 방향 (단기 MA 기준)
      let trendDirection: 'up' | 'down' | 'neutral' = 'neutral';
      if (index > 0 && maShort !== null) {
        const prevShortStart = Math.max(0, index - 1 - maShortPeriod + 1);
        const prevShortSlice = dataArray.slice(prevShortStart, index);
        if (prevShortSlice.length >= maShortPeriod) {
          const prevMaShort =
            prevShortSlice.reduce((sum, d) => sum + d.quantity, 0) / prevShortSlice.length;
          if (maShort > prevMaShort * 1.01) trendDirection = 'up';
          else if (maShort < prevMaShort * 0.99) trendDirection = 'down';
        }
      }

      return {
        date: item.date,
        quantity: item.quantity,
        area_pyeong: item.area_pyeong,
        maShort,
        maLong,
        stdDev,
        isOutlier,
        trendDirection,
      };
    });
  }, [pivotData, maShortPeriod, maLongPeriod]);

  // 요약 통계 계산
  const summary = useMemo((): TrendSummaryData | null => {
    if (trendData.length === 0) return null;

    const quantities = trendData.map((d) => d.quantity);
    const areas = trendData.map((d) => d.area_pyeong);

    const avgQuantity = quantities.reduce((a, b) => a + b, 0) / quantities.length;
    const avgArea = areas.reduce((a, b) => a + b, 0) / areas.length;
    const maxQuantity = Math.max(...quantities);
    const minQuantity = Math.min(...quantities);
    const maxArea = Math.max(...areas);
    const minArea = Math.min(...areas);

    // 변동성 (변동계수: 표준편차 / 평균 * 100)
    const quantityVariance =
      quantities.reduce((sum, q) => sum + Math.pow(q - avgQuantity, 2), 0) / quantities.length;
    const quantityStdDev = Math.sqrt(quantityVariance);
    const volatility = avgQuantity > 0 ? (quantityStdDev / avgQuantity) * 100 : 0;

    // 전체 추세 판정 (처음 vs 마지막 이동평균 비교)
    const firstValidMA = trendData.find((d) => d.maLong !== null);
    const lastValidMA = [...trendData].reverse().find((d) => d.maLong !== null);

    let overallTrend: 'up' | 'down' | 'neutral' = 'neutral';
    let trendStrength = 0;

    if (firstValidMA?.maLong && lastValidMA?.maLong) {
      const change = ((lastValidMA.maLong - firstValidMA.maLong) / firstValidMA.maLong) * 100;
      trendStrength = change;
      if (change > 5) overallTrend = 'up';
      else if (change < -5) overallTrend = 'down';
    }

    const outlierCount = trendData.filter((d) => d.isOutlier).length;

    return {
      overallTrend,
      trendStrength,
      outlierCount,
      avgDailyQuantity: Math.round(avgQuantity),
      avgDailyArea: avgArea,
      maxQuantity,
      minQuantity,
      maxArea,
      minArea,
      volatility: Math.round(volatility * 10) / 10,
      totalDays: trendData.length,
    };
  }, [trendData]);

  return {
    data: trendData,
    summary,
    isLoading,
    error,
  };
}

// 전년 동기 대비 분석 훅
const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export function useYoYAnalysis(targetYear: number, metric: MetricType = 'quantity') {
  // 현재 연도 데이터 조회
  const currentYearStart = new Date(targetYear, 0, 1);
  const currentYearEnd = new Date(targetYear, 11, 31);

  const { data: currentYearData, isLoading: currentLoading } = usePivotAnalysis(
    currentYearStart,
    currentYearEnd,
    'client',
    'monthly'
  );

  // 전년도 데이터 조회
  const prevYearStart = new Date(targetYear - 1, 0, 1);
  const prevYearEnd = new Date(targetYear - 1, 11, 31);

  const { data: prevYearData, isLoading: prevLoading } = usePivotAnalysis(
    prevYearStart,
    prevYearEnd,
    'client',
    'monthly'
  );

  // 월별 데이터 집계 및 비교
  const yoyData = useMemo((): YoYMonthlyData[] => {
    if (!currentYearData && !prevYearData) return [];

    // 월별 집계 함수
    const aggregateByMonth = (data: PivotData[] | undefined): Record<number, { quantity: number; area: number }> => {
      const result: Record<number, { quantity: number; area: number }> = {};
      for (let i = 1; i <= 12; i++) {
        result[i] = { quantity: 0, area: 0 };
      }

      if (!data) return result;

      data.forEach((item) => {
        // period 형식: "YYYY-MM"
        const month = parseInt(item.period.split('-')[1], 10);
        if (month >= 1 && month <= 12) {
          result[month].quantity += item.quantity;
          result[month].area += item.area_pyeong;
        }
      });

      return result;
    };

    const currentMonthly = aggregateByMonth(currentYearData);
    const prevMonthly = aggregateByMonth(prevYearData);

    // 월별 비교 데이터 생성
    return Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const current = currentMonthly[month];
      const prev = prevMonthly[month];

      const quantityGrowthRate =
        prev.quantity > 0 ? ((current.quantity - prev.quantity) / prev.quantity) * 100 : null;
      const areaGrowthRate =
        prev.area > 0 ? ((current.area - prev.area) / prev.area) * 100 : null;

      return {
        month,
        monthName: MONTH_NAMES[i],
        currentYearQuantity: current.quantity,
        currentYearArea: current.area,
        prevYearQuantity: prev.quantity,
        prevYearArea: prev.area,
        quantityGrowthRate: quantityGrowthRate !== null ? Math.round(quantityGrowthRate * 10) / 10 : null,
        areaGrowthRate: areaGrowthRate !== null ? Math.round(areaGrowthRate * 10) / 10 : null,
      };
    });
  }, [currentYearData, prevYearData]);

  // 요약 통계 계산
  const summary = useMemo((): YoYSummaryData | null => {
    if (yoyData.length === 0) return null;

    const getValue = (item: YoYMonthlyData) =>
      metric === 'quantity' ? item.currentYearQuantity : item.currentYearArea;
    const getPrevValue = (item: YoYMonthlyData) =>
      metric === 'quantity' ? item.prevYearQuantity : item.prevYearArea;
    const getRate = (item: YoYMonthlyData) =>
      metric === 'quantity' ? item.quantityGrowthRate : item.areaGrowthRate;

    const currentYearTotal = yoyData.reduce((sum, item) => sum + getValue(item), 0);
    const prevYearTotal = yoyData.reduce((sum, item) => sum + getPrevValue(item), 0);

    const overallGrowthRate =
      prevYearTotal > 0
        ? Math.round(((currentYearTotal - prevYearTotal) / prevYearTotal) * 1000) / 10
        : null;

    // 유효한 성장률만 필터링
    const validRates = yoyData
      .map((item) => ({ month: item.month, rate: getRate(item) }))
      .filter((item): item is { month: number; rate: number } => item.rate !== null);

    const avgMonthlyGrowth =
      validRates.length > 0
        ? Math.round((validRates.reduce((sum, item) => sum + item.rate, 0) / validRates.length) * 10) / 10
        : null;

    // 최고/최저 성장월
    const bestMonth = validRates.length > 0
      ? validRates.reduce((best, item) => (item.rate > best.rate ? item : best))
      : null;

    const worstMonth = validRates.length > 0
      ? validRates.reduce((worst, item) => (item.rate < worst.rate ? item : worst))
      : null;

    const positiveMonths = validRates.filter((item) => item.rate > 0).length;
    const negativeMonths = validRates.filter((item) => item.rate < 0).length;

    return {
      currentYearTotal: Math.round(metric === 'quantity' ? currentYearTotal : currentYearTotal * 10) / (metric === 'quantity' ? 1 : 10),
      prevYearTotal: Math.round(metric === 'quantity' ? prevYearTotal : prevYearTotal * 10) / (metric === 'quantity' ? 1 : 10),
      overallGrowthRate,
      avgMonthlyGrowth,
      bestMonth,
      worstMonth,
      positiveMonths,
      negativeMonths,
    };
  }, [yoyData, metric]);

  return {
    data: yoyData,
    summary,
    isLoading: currentLoading || prevLoading,
  };
}

// 사용 가능한 연도 목록 조회 훅
export function useAvailableYears() {
  const { data: allData, isLoading } = usePivotAnalysis(
    undefined, // 전체 기간
    undefined,
    'client',
    'yearly'
  );

  const years = useMemo(() => {
    if (!allData || allData.length === 0) {
      // 기본값: 현재 연도와 전년도
      const currentYear = new Date().getFullYear();
      return [currentYear, currentYear - 1, currentYear - 2];
    }

    const yearSet = new Set<number>();
    allData.forEach((item) => {
      const year = parseInt(item.period, 10);
      if (!isNaN(year)) {
        yearSet.add(year);
      }
    });

    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allData]);

  return { years, isLoading };
}
