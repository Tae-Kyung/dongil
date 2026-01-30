"use client";

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Package, TrendingUp, Users, Calendar as CalendarIcon } from 'lucide-react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { ProductionTrendChart, ProductionTrendWithMAChart } from '@/components/dashboard/production-trend-chart';
import { ClientStatsChart } from '@/components/dashboard/client-stats-chart';
import { ProductStatsChart } from '@/components/dashboard/product-stats-chart';
import { YoYComparisonChart, GrowthRateChart } from '@/components/dashboard/yoy-comparison-chart';
import { ClientConcentrationChart } from '@/components/dashboard/client-concentration-chart';
import { AchievementGauge, YearlyAchievementChart } from '@/components/dashboard/achievement-gauge';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useDashboardStats,
  useProductionTrend,
  useClientStats,
  useProductStats,
  useYoYComparison,
  useYoYMonthlyTrend,
  useProductionTrendWithMA,
  useTrendSummary,
  useClientConcentration,
  useConcentrationSummary,
  useHighRiskClients,
  useMonthlyAchievement,
  useYearlyAchievementTrend,
} from '@/lib/hooks/use-dashboard-data';
import { subDays } from 'date-fns';

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [achievementYear, setAchievementYear] = useState(currentYear);

  // 연도 선택 옵션 (현재 연도 기준 ±2년)
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

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

  // 전년 동기 대비 데이터
  const { data: yoyData, isLoading: yoyLoading } = useYoYComparison(
    dateRange?.from,
    dateRange?.to
  );

  // 월별 전년 대비 추이
  const { data: yoyMonthlyData, isLoading: yoyMonthlyLoading } = useYoYMonthlyTrend(currentYear);

  // 이동평균 포함 생산량 추이
  const { data: trendWithMAData, isLoading: trendWithMALoading } = useProductionTrendWithMA(
    dateRange?.from,
    dateRange?.to
  );

  // 추세 요약 통계
  const { data: trendSummary } = useTrendSummary(
    dateRange?.from,
    dateRange?.to
  );

  // 거래처 집중도 분석
  const { data: concentrationData, isLoading: concentrationLoading } = useClientConcentration(
    dateRange?.from,
    dateRange?.to
  );

  const { data: concentrationSummary } = useConcentrationSummary(
    dateRange?.from,
    dateRange?.to
  );

  const { data: highRiskClients } = useHighRiskClients(
    dateRange?.from,
    dateRange?.to,
    20
  );

  // 월별 목표 달성률
  const { data: monthlyAchievement } = useMonthlyAchievement();
  const { data: yearlyAchievementTrend, isLoading: achievementLoading } = useYearlyAchievementTrend(achievementYear);

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
          subtitle={yoyData?.prevYearQuantity ? `전년: ${yoyData.prevYearQuantity.toLocaleString()}` : '전체 기간'}
          icon={Package}
          trend={yoyData?.quantityGrowthRate !== null && yoyData?.quantityGrowthRate !== undefined ? {
            value: yoyData.quantityGrowthRate,
            isPositive: yoyData.quantityGrowthRate >= 0,
          } : undefined}
        />
        <KPICard
          title="총 생산 평수"
          value={stats?.totalAreaPyeong.toFixed(1) || 0}
          subtitle={yoyData?.prevYearAreaPyeong ? `전년: ${yoyData.prevYearAreaPyeong.toFixed(1)}평` : '평 단위'}
          icon={TrendingUp}
          trend={yoyData?.areaGrowthRate !== null && yoyData?.areaGrowthRate !== undefined ? {
            value: yoyData.areaGrowthRate,
            isPositive: yoyData.areaGrowthRate >= 0,
          } : undefined}
        />
        <KPICard
          title="거래처 수"
          value={stats?.uniqueClients || 0}
          subtitle={yoyData?.prevYearClients ? `전년: ${yoyData.prevYearClients}개` : '고유 거래처'}
          icon={Users}
          trend={yoyData?.clientGrowthRate !== null && yoyData?.clientGrowthRate !== undefined ? {
            value: yoyData.clientGrowthRate,
            isPositive: yoyData.clientGrowthRate >= 0,
          } : undefined}
        />
        <KPICard
          title="오늘 생산량"
          value={stats?.todayQuantity || 0}
          subtitle="금일 생산 수량"
          icon={CalendarIcon}
        />
      </div>

      {/* Achievement Gauge */}
      <div className="grid gap-4 md:grid-cols-2">
        <AchievementGauge data={monthlyAchievement || null} />
        <div className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <span className="text-sm text-muted-foreground">연도 선택:</span>
            <Select
              value={String(achievementYear)}
              onValueChange={(v) => setAchievementYear(Number(v))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {achievementLoading ? (
            <div className="h-[400px] flex items-center justify-center border rounded-lg">
              <p className="text-muted-foreground">차트를 불러오는 중...</p>
            </div>
          ) : yearlyAchievementTrend && yearlyAchievementTrend.length > 0 ? (
            <YearlyAchievementChart data={yearlyAchievementTrend} year={achievementYear} />
          ) : (
            <div className="h-[400px] flex items-center justify-center border rounded-lg">
              <p className="text-muted-foreground">{achievementYear}년 목표 달성 데이터가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Production Trend Chart with Moving Average */}
      {trendWithMALoading || trendLoading ? (
        <div className="h-[450px] flex items-center justify-center border rounded-lg">
          <p className="text-muted-foreground">차트를 불러오는 중...</p>
        </div>
      ) : trendWithMAData && trendWithMAData.length > 0 ? (
        <ProductionTrendWithMAChart data={trendWithMAData} trendSummary={trendSummary || undefined} />
      ) : trendData && trendData.length > 0 ? (
        <ProductionTrendChart data={trendData} />
      ) : (
        <div className="h-[450px] flex items-center justify-center border rounded-lg">
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

      {/* YoY Comparison Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {yoyMonthlyLoading ? (
          <div className="h-[400px] flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">차트를 불러오는 중...</p>
          </div>
        ) : yoyMonthlyData && yoyMonthlyData.length > 0 ? (
          <YoYComparisonChart data={yoyMonthlyData} targetYear={currentYear} />
        ) : (
          <div className="h-[400px] flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">전년 동기 대비 데이터가 없습니다.</p>
          </div>
        )}

        {yoyMonthlyLoading ? (
          <div className="h-[400px] flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">차트를 불러오는 중...</p>
          </div>
        ) : yoyMonthlyData && yoyMonthlyData.length > 0 ? (
          <GrowthRateChart data={yoyMonthlyData} targetYear={currentYear} />
        ) : (
          <div className="h-[400px] flex items-center justify-center border rounded-lg">
            <p className="text-muted-foreground">성장률 데이터가 없습니다.</p>
          </div>
        )}
      </div>

      {/* Client Concentration Chart */}
      {concentrationLoading ? (
        <div className="h-[500px] flex items-center justify-center border rounded-lg">
          <p className="text-muted-foreground">차트를 불러오는 중...</p>
        </div>
      ) : concentrationData && concentrationData.length > 0 ? (
        <ClientConcentrationChart
          data={concentrationData}
          summary={concentrationSummary}
          highRiskClients={highRiskClients}
        />
      ) : (
        <div className="h-[500px] flex items-center justify-center border rounded-lg">
          <p className="text-muted-foreground">거래처 집중도 데이터가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
