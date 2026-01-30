"use client";

import { useMemo, useState } from 'react';
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
  ComposedChart,
  Bar,
  Area,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  HelpCircle,
  Activity,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { MetricType } from '@/lib/hooks/use-analysis-data';

// 이동평균 데이터 타입
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

interface TrendAnalysisProps {
  data: TrendDataPoint[];
  summary: TrendSummaryData | null;
  metric: MetricType;
  isLoading?: boolean;
  maShortPeriod?: number;
  maLongPeriod?: number;
  onMaShortChange?: (period: number) => void;
  onMaLongChange?: (period: number) => void;
}

export function TrendAnalysis({
  data,
  summary,
  metric,
  isLoading,
  maShortPeriod = 7,
  maLongPeriod = 30,
  onMaShortChange,
  onMaLongChange,
}: TrendAnalysisProps) {
  const metricLabel = metric === 'quantity' ? '수량' : '면적(평)';
  const metricKey = metric === 'quantity' ? 'quantity' : 'area_pyeong';

  // 차트 데이터 변환
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      dateLabel: format(parseISO(item.date), 'MM/dd'),
      value: metric === 'quantity' ? item.quantity : item.area_pyeong,
    }));
  }, [data, metric]);

  // 이상치 데이터 추출
  const outliers = useMemo(() => {
    return chartData.filter((item) => item.isOutlier);
  }, [chartData]);

  // 추세 관련 유틸
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
        return 'bg-green-100 text-green-800 border-green-300';
      case 'down':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // 변동성 레벨
  const getVolatilityLevel = (volatility: number) => {
    if (volatility >= 50) return { label: '매우 높음', color: 'text-red-600' };
    if (volatility >= 30) return { label: '높음', color: 'text-orange-600' };
    if (volatility >= 15) return { label: '보통', color: 'text-yellow-600' };
    return { label: '낮음', color: 'text-green-600' };
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center border rounded-lg">
        <p className="text-muted-foreground">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center border rounded-lg">
        <p className="text-muted-foreground">데이터가 없습니다.</p>
      </div>
    );
  }

  const volatilityInfo = summary ? getVolatilityLevel(summary.volatility) : null;

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                전체 추세
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={getTrendColor(summary.overallTrend)}>
                {getTrendIcon(summary.overallTrend)}
                <span className="ml-1">{getTrendLabel(summary.overallTrend)}</span>
                {summary.trendStrength !== 0 && (
                  <span className="ml-1">
                    ({summary.trendStrength > 0 ? '+' : ''}
                    {summary.trendStrength.toFixed(1)}%)
                  </span>
                )}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                일평균 {metricLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {metric === 'quantity'
                  ? summary.avgDailyQuantity.toLocaleString()
                  : summary.avgDailyArea.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                최대값
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {metric === 'quantity'
                  ? summary.maxQuantity.toLocaleString()
                  : summary.maxArea.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                최소값
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {metric === 'quantity'
                  ? summary.minQuantity.toLocaleString()
                  : summary.minArea.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                변동성
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${volatilityInfo?.color}`}>
                {summary.volatility.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">{volatilityInfo?.label}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                이상치
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.outlierCount}건</p>
              <p className="text-xs text-muted-foreground">분석 기간: {summary.totalDays}일</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 이동평균 설정 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">이동평균 설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">단기 MA:</Label>
              <Select
                value={maShortPeriod.toString()}
                onValueChange={(v) => onMaShortChange?.(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3일</SelectItem>
                  <SelectItem value="5">5일</SelectItem>
                  <SelectItem value="7">7일</SelectItem>
                  <SelectItem value="10">10일</SelectItem>
                  <SelectItem value="14">14일</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">장기 MA:</Label>
              <Select
                value={maLongPeriod.toString()}
                onValueChange={(v) => onMaLongChange?.(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">14일</SelectItem>
                  <SelectItem value="20">20일</SelectItem>
                  <SelectItem value="30">30일</SelectItem>
                  <SelectItem value="60">60일</SelectItem>
                  <SelectItem value="90">90일</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 메인 차트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>생산량 추이 (이동평균)</CardTitle>
              <CardDescription>
                일별 {metricLabel} + {maShortPeriod}일/{maLongPeriod}일 이동평균선
              </CardDescription>
            </div>
            {outliers.length > 0 && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                이상치 {outliers.length}건 감지
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) =>
                  metric === 'quantity' ? value.toLocaleString() : value.toFixed(1)
                }
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    value: metricLabel,
                    maShort: `${maShortPeriod}일 이동평균`,
                    maLong: `${maLongPeriod}일 이동평균`,
                  };
                  const formattedValue =
                    metric === 'quantity' ? value.toLocaleString() : value.toFixed(1);
                  return [formattedValue, labels[name] || name];
                }}
                labelFormatter={(label) => `${label}`}
              />
              <Legend
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    value: metricLabel,
                    maShort: `${maShortPeriod}일 MA`,
                    maLong: `${maLongPeriod}일 MA`,
                  };
                  return labels[value] || value;
                }}
              />

              {/* 실제 값 */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
              />

              {/* 단기 이동평균 */}
              <Line
                type="monotone"
                dataKey="maShort"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />

              {/* 장기 이동평균 */}
              <Line
                type="monotone"
                dataKey="maLong"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="10 5"
                dot={false}
              />

              {/* 이상치 하이라이트 */}
              {outliers.map((outlier, index) => (
                <ReferenceDot
                  key={index}
                  x={outlier.dateLabel}
                  y={outlier.value}
                  r={8}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 이상치 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              이상치 목록
            </CardTitle>
            <CardDescription>
              {maLongPeriod}일 평균 대비 ±2 표준편차를 벗어난 날
            </CardDescription>
          </CardHeader>
          <CardContent>
            {outliers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                이상치가 감지되지 않았습니다.
              </p>
            ) : (
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>날짜</TableHead>
                      <TableHead className="text-right">{metricLabel}</TableHead>
                      <TableHead className="text-right">{maLongPeriod}일 평균</TableHead>
                      <TableHead className="text-right">편차</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outliers.slice(0, 20).map((item) => {
                      const deviation = item.maLong
                        ? (((item.value - item.maLong) / item.maLong) * 100).toFixed(1)
                        : '-';
                      return (
                        <TableRow key={item.date}>
                          <TableCell>{format(parseISO(item.date), 'yyyy-MM-dd')}</TableCell>
                          <TableCell className="text-right font-medium">
                            {metric === 'quantity'
                              ? item.value.toLocaleString()
                              : item.value.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {item.maLong
                              ? metric === 'quantity'
                                ? item.maLong.toLocaleString()
                                : item.maLong.toFixed(1)
                              : '-'}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              parseFloat(deviation) > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {deviation !== '-' ? `${deviation}%` : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 설명 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              이동평균 분석 가이드
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">이동평균이란?</p>
              <p>
                일정 기간의 데이터 평균값을 연속적으로 계산한 것으로, 단기적인 변동을 완화하고
                전체적인 추세를 파악하는 데 유용합니다.
              </p>
            </div>
            <div>
              <p className="font-medium text-amber-600 mb-1">{maShortPeriod}일 이동평균 (단기)</p>
              <p>
                최근 {maShortPeriod}일간의 평균값입니다. 단기적인 추세 변화를 빠르게 감지할 수 있으며,
                실제 값에 민감하게 반응합니다.
              </p>
            </div>
            <div>
              <p className="font-medium text-emerald-600 mb-1">{maLongPeriod}일 이동평균 (장기)</p>
              <p>
                최근 {maLongPeriod}일간의 평균값입니다. 일시적인 변동을 제외한 전반적인 방향성을
                보여주며, 계절적 패턴을 파악하는 데 적합합니다.
              </p>
            </div>
            <div>
              <p className="font-medium text-red-500 mb-1">이상치 (빨간 점)</p>
              <p>
                {maLongPeriod}일 평균 대비 ±2 표준편차를 벗어난 날입니다. 특별한 이벤트, 장비 문제,
                또는 비정상적인 주문이 있었는지 확인이 필요합니다.
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">골든크로스 / 데드크로스</p>
              <p>
                단기 MA가 장기 MA를 상향 돌파하면 <span className="text-green-600">골든크로스</span>
                (상승 신호), 하향 돌파하면 <span className="text-red-600">데드크로스</span>
                (하락 신호)로 해석합니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
