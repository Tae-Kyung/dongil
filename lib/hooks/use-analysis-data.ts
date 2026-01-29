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
