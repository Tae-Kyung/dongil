"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { ProductionTrend, ProductionTrendWithMA, TrendSummary } from '@/lib/hooks/use-dashboard-data';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, HelpCircle } from 'lucide-react';

interface ProductionTrendChartProps {
  data: ProductionTrend[];
}

// 기존 차트 (하위 호환성 유지)
export function ProductionTrendChart({ data }: ProductionTrendChartProps) {
  const chartData = data.map(item => ({
    ...item,
    date: format(parseISO(item.date), 'MM/dd'),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>생산량 추이</CardTitle>
        <CardDescription>일별 생산 수량 및 평수</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="quantity"
              stroke="#8884d8"
              name="수량"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="area_pyeong"
              stroke="#82ca9d"
              name="평수"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ProductionTrendWithMAChartProps {
  data: ProductionTrendWithMA[];
  trendSummary?: TrendSummary;
  showMA?: boolean;
}

// 이동평균 포함 차트
export function ProductionTrendWithMAChart({
  data,
  trendSummary,
  showMA = true
}: ProductionTrendWithMAChartProps) {
  const chartData = data.map(item => ({
    ...item,
    dateLabel: format(parseISO(item.date), 'MM/dd'),
    originalDate: item.date,
  }));

  // 이상치 데이터 추출
  const outliers = chartData.filter(item => item.isOutlier);

  // 추세 아이콘 및 색상
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendLabel = (trend: string) => {
    switch (trend) {
      case 'up':
        return '상승';
      case 'down':
        return '하락';
      default:
        return '보합';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'bg-green-100 text-green-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>생산량 추이 (이동평균)</CardTitle>
            <CardDescription>
              일별 생산량 + 7일/30일 이동평균선
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {trendSummary && (
              <>
                <Badge variant="outline" className={getTrendColor(trendSummary.overallTrend)}>
                  {getTrendIcon(trendSummary.overallTrend)}
                  <span className="ml-1">{getTrendLabel(trendSummary.overallTrend)}</span>
                  {trendSummary.trendStrength !== 0 && (
                    <span className="ml-1">({trendSummary.trendStrength > 0 ? '+' : ''}{trendSummary.trendStrength}%)</span>
                  )}
                </Badge>
                {trendSummary.outlierCount > 0 && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    이상치 {trendSummary.outlierCount}건
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              formatter={(value, name) => {
                const labels: Record<string, string> = {
                  quantity: '생산량',
                  maShort: '7일 이동평균',
                  maLong: '30일 이동평균',
                };
                return [Number(value).toLocaleString(), labels[name as string] || name];
              }}
              labelFormatter={(label) => `${label}`}
            />
            <Legend
              formatter={(value) => {
                const labels: Record<string, string> = {
                  quantity: '생산량',
                  maShort: '7일 이동평균',
                  maLong: '30일 이동평균',
                };
                return labels[value] || value;
              }}
            />

            {/* 실제 생산량 */}
            <Line
              type="monotone"
              dataKey="quantity"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 5 }}
            />

            {/* 7일 이동평균 */}
            {showMA && (
              <Line
                type="monotone"
                dataKey="maShort"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}

            {/* 30일 이동평균 */}
            {showMA && (
              <Line
                type="monotone"
                dataKey="maLong"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="10 5"
                dot={false}
              />
            )}

            {/* 이상치 하이라이트 */}
            {outliers.map((outlier, index) => (
              <ReferenceDot
                key={index}
                x={outlier.dateLabel}
                y={outlier.quantity}
                r={8}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* 통계 요약 */}
        {trendSummary && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground">일평균</div>
              <div className="font-semibold">{trendSummary.avgDailyQuantity.toLocaleString()}</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground">최대</div>
              <div className="font-semibold">{trendSummary.maxQuantity.toLocaleString()}</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground">최소</div>
              <div className="font-semibold">{trendSummary.minQuantity.toLocaleString()}</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground">변동성</div>
              <div className="font-semibold">{trendSummary.volatility}%</div>
            </div>
          </div>
        )}

        {/* 이동평균 설명 */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p>
                <span className="font-medium text-amber-600">7일 이동평균</span>: 최근 7일간의 평균 생산량입니다.
                단기적인 생산 추세를 파악하는 데 유용하며, 일별 변동을 완화하여 최근 트렌드를 보여줍니다.
              </p>
              <p>
                <span className="font-medium text-emerald-600">30일 이동평균</span>: 최근 30일간의 평균 생산량입니다.
                장기적인 생산 추세를 나타내며, 계절적 변동이나 일시적 증감을 제외한 전반적인 방향성을 확인할 수 있습니다.
              </p>
              <p>
                <span className="font-medium text-red-500">빨간 점</span>: 이상치로, 30일 평균 대비 ±2 표준편차를 벗어난 날입니다.
                특별한 이벤트나 문제가 있었는지 확인이 필요합니다.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
