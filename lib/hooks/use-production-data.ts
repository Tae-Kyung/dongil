import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { ProductionRecord } from '@/lib/types/production';

export interface ProductionDataParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string>;
}

export interface ProductionDataResult {
  data: ProductionRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useProductionData(params: ProductionDataParams = {}) {
  const {
    page = 1,
    pageSize = 50,
    sortBy = 'production_date',
    sortOrder = 'desc',
    search = '',
    filters = {},
  } = params;

  return useQuery({
    queryKey: ['production-data', page, pageSize, sortBy, sortOrder, search, filters],
    queryFn: async (): Promise<ProductionDataResult> => {
      // 기본 쿼리
      let query = supabase
        .from('production_records')
        .select('*', { count: 'exact' });

      // 검색 (여러 필드에서 검색)
      if (search) {
        query = query.or(
          `client.ilike.%${search}%,` +
          `product_name.ilike.%${search}%,` +
          `order_number.ilike.%${search}%,` +
          `site.ilike.%${search}%`
        );
      }

      // 필터 적용
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          query = query.eq(key, value);
        }
      });

      // 정렬
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // 페이지네이션
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: data || [],
        total,
        page,
        pageSize,
        totalPages,
      };
    },
  });
}
