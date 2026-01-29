"use client";

import { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { subMonths } from 'date-fns';
import { AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnalysisFilters } from '@/components/analysis/analysis-filters';
import { PivotTable } from '@/components/analysis/pivot-table';
import { AnalysisChart } from '@/components/analysis/analysis-chart';
import { CrossAnalysisTable } from '@/components/analysis/cross-analysis-table';
import {
  usePivotAnalysis,
  useAnalysisByClientProduct,
  useClientList,
  PeriodType,
  RowDimension,
  MetricType,
} from '@/lib/hooks/use-analysis-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalysisPage() {
  // 필터 상태
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [rowDimension, setRowDimension] = useState<RowDimension>('client');
  const [metric, setMetric] = useState<MetricType>('quantity');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  // 데이터 조회
  const { data: pivotData, isLoading: pivotLoading, error: pivotError } = usePivotAnalysis(
    dateRange?.from,
    dateRange?.to,
    rowDimension,
    periodType
  );

  const { data: crossData, isLoading: crossLoading, error: crossError } = useAnalysisByClientProduct(
    dateRange?.from,
    dateRange?.to,
    selectedClient === 'all' ? undefined : selectedClient,
    100
  );

  const { data: clientList } = useClientList(dateRange?.from, dateRange?.to);

  // SQL 함수 미등록 오류 체크
  const hasSetupError = pivotError || crossError;
  const errorMessage = pivotError?.message || crossError?.message || '';

  // 차트 데이터 변환
  const chartData = useMemo(() => {
    if (!pivotData) return [];

    const aggregated: Record<string, { quantity: number; area_pyeong: number }> = {};

    pivotData.forEach((item) => {
      if (!aggregated[item.dimension_value]) {
        aggregated[item.dimension_value] = { quantity: 0, area_pyeong: 0 };
      }
      aggregated[item.dimension_value].quantity += item.quantity;
      aggregated[item.dimension_value].area_pyeong += item.area_pyeong;
    });

    return Object.entries(aggregated)
      .map(([name, values]) => ({
        name,
        quantity: values.quantity,
        area_pyeong: values.area_pyeong,
      }))
      .sort((a, b) => b[metric] - a[metric])
      .slice(0, 15);
  }, [pivotData, metric]);

  // 기간별 추이 차트 데이터
  const trendChartData = useMemo(() => {
    if (!pivotData) return [];

    const aggregated: Record<string, { quantity: number; area_pyeong: number }> = {};

    pivotData.forEach((item) => {
      if (!aggregated[item.period]) {
        aggregated[item.period] = { quantity: 0, area_pyeong: 0 };
      }
      aggregated[item.period].quantity += item.quantity;
      aggregated[item.period].area_pyeong += item.area_pyeong;
    });

    return Object.entries(aggregated)
      .map(([name, values]) => ({
        name,
        quantity: values.quantity,
        area_pyeong: values.area_pyeong,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [pivotData]);

  // 상위 통계
  const topStats = useMemo(() => {
    if (!pivotData || pivotData.length === 0) return null;

    const totalQuantity = pivotData.reduce((sum, item) => sum + item.quantity, 0);
    const totalArea = pivotData.reduce((sum, item) => sum + item.area_pyeong, 0);
    const uniqueDimensions = new Set(pivotData.map((item) => item.dimension_value)).size;
    const uniquePeriods = new Set(pivotData.map((item) => item.period)).size;

    return { totalQuantity, totalArea, uniqueDimensions, uniquePeriods };
  }, [pivotData]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">다차원 분석</h1>
        <p className="text-muted-foreground mt-1">
          기간별, 거래처별, 품목별 생산 현황을 분석합니다
        </p>
      </div>

      {/* Setup Error Alert */}
      {hasSetupError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>데이터베이스 설정 필요</AlertTitle>
          <AlertDescription>
            다차원 분석 기능을 사용하려면 Supabase SQL Editor에서 분석용 함수를 실행해야 합니다.
            <br />
            <code className="text-sm bg-muted px-1 py-0.5 rounded">app/supabase/functions.sql</code> 파일의 내용을 실행해주세요.
            {errorMessage && (
              <>
                <br />
                <span className="text-xs mt-2 block">오류: {errorMessage}</span>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <AnalysisFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        periodType={periodType}
        onPeriodTypeChange={setPeriodType}
        rowDimension={rowDimension}
        onRowDimensionChange={setRowDimension}
        metric={metric}
        onMetricChange={setMetric}
      />

      {/* Summary Stats */}
      {topStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 생산 수량
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{topStats.totalQuantity.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                총 생산 면적
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{topStats.totalArea.toFixed(1)} 평</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {rowDimension === 'client' ? '거래처 수' : '품목 수'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{topStats.uniqueDimensions.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                분석 기간 수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{topStats.uniquePeriods}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pivot" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pivot">피벗 테이블</TabsTrigger>
          <TabsTrigger value="chart">차트 분석</TabsTrigger>
          <TabsTrigger value="cross">교차 분석</TabsTrigger>
        </TabsList>

        {/* 피벗 테이블 탭 */}
        <TabsContent value="pivot">
          {pivotLoading ? (
            <div className="h-[400px] flex items-center justify-center border rounded-lg">
              <p className="text-muted-foreground">데이터를 불러오는 중...</p>
            </div>
          ) : (
            <PivotTable
              data={pivotData || []}
              metric={metric}
              rowLabel={rowDimension === 'client' ? '거래처' : '품목'}
              title={`${rowDimension === 'client' ? '거래처별' : '품목별'} ${
                periodType === 'daily' ? '일별' : periodType === 'weekly' ? '주별' : periodType === 'monthly' ? '월별' : '연별'
              } ${metric === 'quantity' ? '수량' : '면적'} 분석`}
            />
          )}
        </TabsContent>

        {/* 차트 분석 탭 */}
        <TabsContent value="chart" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AnalysisChart
              data={chartData}
              title={`${rowDimension === 'client' ? '거래처별' : '품목별'} ${metric === 'quantity' ? '수량' : '면적'} 순위`}
              chartType="bar"
              metric={metric}
            />
            <AnalysisChart
              data={trendChartData}
              title={`${periodType === 'daily' ? '일별' : periodType === 'weekly' ? '주별' : periodType === 'monthly' ? '월별' : '연별'} ${metric === 'quantity' ? '수량' : '면적'} 추이`}
              chartType="line"
              metric={metric}
            />
          </div>
        </TabsContent>

        {/* 교차 분석 탭 */}
        <TabsContent value="cross" className="space-y-4">
          <div className="flex items-end gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex flex-col gap-2">
              <Label>거래처 필터</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="전체 거래처" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 거래처</SelectItem>
                  {clientList?.slice(0, 50).map((client) => (
                    <SelectItem key={client.client} value={client.client}>
                      {client.client} ({client.total_quantity.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {crossLoading ? (
            <div className="h-[400px] flex items-center justify-center border rounded-lg">
              <p className="text-muted-foreground">데이터를 불러오는 중...</p>
            </div>
          ) : (
            <CrossAnalysisTable
              data={crossData || []}
              metric={metric}
              title={selectedClient === 'all' ? '거래처-품목 교차 분석 (상위 100)' : `${selectedClient} 품목별 분석`}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
