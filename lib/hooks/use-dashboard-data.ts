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
