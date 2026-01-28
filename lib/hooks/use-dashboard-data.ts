import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { format, startOfDay, endOfDay } from 'date-fns';

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

// 전체 통계 조회
export function useDashboardStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['dashboard-stats', startDate, endDate],
    queryFn: async (): Promise<DashboardStats> => {
      let query = supabase
        .from('production_records')
        .select('quantity, area_pyeong, client, production_date');

      if (startDate) {
        query = query.gte('production_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('production_date', format(endDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalQuantity = data?.reduce((sum, record) => sum + (record.quantity || 0), 0) || 0;
      const totalAreaPyeong = data?.reduce((sum, record) => sum + (record.area_pyeong || 0), 0) || 0;
      const uniqueClients = new Set(data?.map(record => record.client).filter(Boolean)).size;

      // 오늘 생산량
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayData = data?.filter(record => record.production_date === today) || [];
      const todayQuantity = todayData.reduce((sum, record) => sum + (record.quantity || 0), 0);

      return {
        totalQuantity,
        totalAreaPyeong,
        uniqueClients,
        todayQuantity,
      };
    },
  });
}

// 생산량 추이 조회 (일별)
export function useProductionTrend(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['production-trend', startDate, endDate],
    queryFn: async (): Promise<ProductionTrend[]> => {
      let query = supabase
        .from('production_records')
        .select('production_date, quantity, area_pyeong')
        .order('production_date', { ascending: true });

      if (startDate) {
        query = query.gte('production_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('production_date', format(endDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;

      // 날짜별로 그룹화
      const grouped = (data || []).reduce((acc, record) => {
        const date = record.production_date || '';
        if (!acc[date]) {
          acc[date] = { date, quantity: 0, area_pyeong: 0 };
        }
        acc[date].quantity += record.quantity || 0;
        acc[date].area_pyeong += record.area_pyeong || 0;
        return acc;
      }, {} as Record<string, ProductionTrend>);

      return Object.values(grouped);
    },
  });
}

// 거래처별 통계 조회 (상위 10개)
export function useClientStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['client-stats', startDate, endDate],
    queryFn: async (): Promise<ClientStats[]> => {
      let query = supabase
        .from('production_records')
        .select('client, quantity, area_pyeong');

      if (startDate) {
        query = query.gte('production_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('production_date', format(endDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;

      // 거래처별로 그룹화
      const grouped = (data || []).reduce((acc, record) => {
        const client = record.client || '미지정';
        if (!acc[client]) {
          acc[client] = { client, quantity: 0, area_pyeong: 0 };
        }
        acc[client].quantity += record.quantity || 0;
        acc[client].area_pyeong += record.area_pyeong || 0;
        return acc;
      }, {} as Record<string, ClientStats>);

      // 수량 기준 내림차순 정렬 후 상위 10개
      return Object.values(grouped)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    },
  });
}

// 품목별 통계 조회 (상위 10개)
export function useProductStats(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ['product-stats', startDate, endDate],
    queryFn: async (): Promise<ProductStats[]> => {
      let query = supabase
        .from('production_records')
        .select('product_name, quantity, area_pyeong');

      if (startDate) {
        query = query.gte('production_date', format(startDate, 'yyyy-MM-dd'));
      }
      if (endDate) {
        query = query.lte('production_date', format(endDate, 'yyyy-MM-dd'));
      }

      const { data, error } = await query;

      if (error) throw error;

      // 품목별로 그룹화
      const grouped = (data || []).reduce((acc, record) => {
        const productName = record.product_name || '미지정';
        if (!acc[productName]) {
          acc[productName] = { product_name: productName, quantity: 0, area_pyeong: 0 };
        }
        acc[productName].quantity += record.quantity || 0;
        acc[productName].area_pyeong += record.area_pyeong || 0;
        return acc;
      }, {} as Record<string, ProductStats>);

      // 수량 기준 내림차순 정렬 후 상위 10개
      return Object.values(grouped)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    },
  });
}
