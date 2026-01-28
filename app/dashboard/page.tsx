"use client";

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Package, TrendingUp, Users, Calendar as CalendarIcon } from 'lucide-react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { ProductionTrendChart } from '@/components/dashboard/production-trend-chart';
import { ClientStatsChart } from '@/components/dashboard/client-stats-chart';
import { ProductStatsChart } from '@/components/dashboard/product-stats-chart';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { Button } from '@/components/ui/button';
import {
  useDashboardStats,
  useProductionTrend,
  useClientStats,
  useProductStats,
} from '@/lib/hooks/use-dashboard-data';
import { subDays } from 'date-fns';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: stats, isLoading: statsLoading } = useDashboardStats(
    dateRange?.from,
    dateRange?.to
  );

  const { data: trendData, isLoading: trendLoading } = useProductionTrend(
    dateRange?.from,
    dateRange?.to
  );

  const { data: clientData, isLoading: clientLoading } = useClientStats(
    dateRange?.from,
    dateRange?.to
  );

  const { data: productData, isLoading: productLoading } = useProductStats(
    dateRange?.from,
    dateRange?.to
  );

  const handleResetDateRange = () => {
    setDateRange({
      from: subDays(new Date(), 30),
      to: new Date(),
    });
  };

  const handleClearDateRange = () => {
    setDateRange(undefined);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-muted-foreground mt-1">
            생산실적 현황을 한눈에 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <Button variant="outline" size="sm" onClick={handleResetDateRange}>
            최근 30일
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClearDateRange}>
            전체
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="총 생산 수량"
          value={stats?.totalQuantity || 0}
          subtitle="전체 기간"
          icon={Package}
        />
        <KPICard
          title="총 생산 평수"
          value={stats?.totalAreaPyeong.toFixed(1) || 0}
          subtitle="평 단위"
          icon={TrendingUp}
        />
        <KPICard
          title="거래처 수"
          value={stats?.uniqueClients || 0}
          subtitle="고유 거래처"
          icon={Users}
        />
        <KPICard
          title="오늘 생산량"
          value={stats?.todayQuantity || 0}
          subtitle="금일 생산 수량"
          icon={CalendarIcon}
        />
      </div>

      {/* Production Trend Chart */}
      {trendLoading ? (
        <div className="h-[400px] flex items-center justify-center border rounded-lg">
          <p className="text-muted-foreground">차트를 불러오는 중...</p>
        </div>
      ) : trendData && trendData.length > 0 ? (
        <ProductionTrendChart data={trendData} />
      ) : (
        <div className="h-[400px] flex items-center justify-center border rounded-lg">
          <p className="text-muted-foreground">표시할 데이터가 없습니다.</p>
        </div>
      )}

      {/* Client and Product Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {clientLoading ? (
          <div className="h-[400px] flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">차트를 불러오는 중...</p>
          </div>
        ) : clientData && clientData.length > 0 ? (
          <ClientStatsChart data={clientData} />
        ) : (
          <div className="h-[400px] flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">표시할 데이터가 없습니다.</p>
          </div>
        )}

        {productLoading ? (
          <div className="h-[400px] flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">차트를 불러오는 중...</p>
          </div>
        ) : productData && productData.length > 0 ? (
          <ProductStatsChart data={productData} />
        ) : (
          <div className="h-[400px] flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">표시할 데이터가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
