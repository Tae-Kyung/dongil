"use client";

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  ComposedChart,
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
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from 'lucide-react';
import { MetricType } from '@/lib/hooks/use-analysis-data';

// YoY 데이터 타입
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

interface YoYAnalysisProps {
  data: YoYMonthlyData[];
  summary: YoYSummaryData | null;
  targetYear: number;
  metric: MetricType;
  isLoading?: boolean;
  availableYears: number[];
  onYearChange?: (year: number) => void;
}

const MONTH_NAMES_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export function YoYAnalysis({
  data,
  summary,
  targetYear,
  metric,
  isLoading,
  availableYears,
  onYearChange,
}: YoYAnalysisProps) {
  const metricLabel = metric === 'quantity' ? '수량' : '면적(평)';

  // 차트 데이터 변환
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      monthLabel: MONTH_NAMES_KO[item.month - 1],
      currentValue: metric === 'quantity' ? item.currentYearQuantity : item.currentYearArea,
      prevValue: metric === 'quantity' ? item.prevYearQuantity : item.prevYearArea,
      growthRate: metric === 'quantity' ? item.quantityGrowthRate : item.areaGrowthRate,
    }));
  }, [data, metric]);

  // 성장률 색상
  const getGrowthColor = (rate: number | null) => {
    if (rate === null) return 'text-gray-500';
    if (rate > 10) return 'text-green-600';
    if (rate > 0) return 'text-green-500';
    if (rate > -10) return 'text-red-500';
    return 'text-red-600';
  };

  const getGrowthBadgeColor = (rate: number | null) => {
    if (rate === null) return 'bg-gray-100 text-gray-800';
    if (rate > 0) return 'bg-green-100 text-green-800 border-green-300';
    if (rate < 0) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800';
  };

  const getGrowthIcon = (rate: number | null) => {
    if (rate === null) return <Minus className="h-4 w-4" />;
    if (rate > 0) return <TrendingUp className="h-4 w-4" />;
    if (rate < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
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

  return (
    <div className="space-y-6">
      {/* 연도 선택 및 요약 */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">비교 연도:</Label>
            <Select
              value={targetYear.toString()}
              onValueChange={(v) => onYearChange?.(parseInt(v))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}년
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-muted-foreground">
            vs {targetYear - 1}년
          </span>
        </div>

        {summary && (
          <Badge variant="outline" className={getGrowthBadgeColor(summary.overallGrowthRate)}>
            {getGrowthIcon(summary.overallGrowthRate)}
            <span className="ml-1">
              전년 대비 {summary.overallGrowthRate !== null ? (
                <>
                  {summary.overallGrowthRate > 0 ? '+' : ''}
                  {summary.overallGrowthRate.toFixed(1)}%
                </>
              ) : '-'}
            </span>
          </Badge>
        )}
      </div>

      {/* 요약 카드 */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {targetYear}년 총계
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {summary.currentYearTotal.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {targetYear - 1}년 총계
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-muted-foreground">
                {summary.prevYearTotal.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                평균 월별 성장률
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${getGrowthColor(summary.avgMonthlyGrowth)}`}>
                {summary.avgMonthlyGrowth !== null
                  ? `${summary.avgMonthlyGrowth > 0 ? '+' : ''}${summary.avgMonthlyGrowth.toFixed(1)}%`
                  : '-'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="h-4 w-4 text-green-500" />
                최고 성장월
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.bestMonth ? (
                <>
                  <p className="text-2xl font-bold text-green-600">
                    {MONTH_NAMES_KO[summary.bestMonth.month - 1]}
                  </p>
                  <p className="text-sm text-green-600">+{summary.bestMonth.rate.toFixed(1)}%</p>
                </>
              ) : (
                <p className="text-2xl font-bold text-muted-foreground">-</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <ArrowDownRight className="h-4 w-4 text-red-500" />
                최저 성장월
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.worstMonth ? (
                <>
                  <p className="text-2xl font-bold text-red-600">
                    {MONTH_NAMES_KO[summary.worstMonth.month - 1]}
                  </p>
                  <p className="text-sm text-red-600">{summary.worstMonth.rate.toFixed(1)}%</p>
                </>
              ) : (
                <p className="text-2xl font-bold text-muted-foreground">-</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                성장/감소 월
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-green-600">{summary.positiveMonths}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-xl font-bold text-red-600">{summary.negativeMonths}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 차트 영역 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 월별 비교 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>전년 동기 대비 생산량</CardTitle>
            <CardDescription>
              {targetYear}년 vs {targetYear - 1}년 월별 {metricLabel} 비교
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) =>
                    metric === 'quantity' ? value.toLocaleString() : value.toFixed(0)
                  }
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    metric === 'quantity' ? value.toLocaleString() : value.toFixed(1),
                    name === 'currentValue' ? `${targetYear}년` : `${targetYear - 1}년`,
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend
                  formatter={(value) =>
                    value === 'currentValue' ? `${targetYear}년` : `${targetYear - 1}년`
                  }
                />
                <Bar
                  dataKey="prevValue"
                  fill="#94a3b8"
                  name="prevValue"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="currentValue"
                  fill="#3b82f6"
                  name="currentValue"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 성장률 추이 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>성장률 추이</CardTitle>
            <CardDescription>
              {targetYear}년 전년 동월 대비 증감률 (%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  formatter={(value: number) => [`${value?.toFixed(1) ?? '-'}%`, '성장률']}
                  labelFormatter={(label) => `${label}`}
                />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Bar dataKey="growthRate" radius={[4, 4, 0, 0]} name="성장률">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.growthRate === null
                          ? '#9ca3af'
                          : entry.growthRate >= 0
                          ? '#22c55e'
                          : '#ef4444'
                      }
                    />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="growthRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  name="추이"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>월별 상세 비교</CardTitle>
          <CardDescription>{metricLabel} 기준 전년 동기 대비 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>월</TableHead>
                <TableHead className="text-right">{targetYear}년</TableHead>
                <TableHead className="text-right">{targetYear - 1}년</TableHead>
                <TableHead className="text-right">증감</TableHead>
                <TableHead className="text-right">성장률</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((item) => {
                const diff = item.currentValue - item.prevValue;
                const rate = item.growthRate;
                return (
                  <TableRow key={item.month}>
                    <TableCell className="font-medium">{item.monthLabel}</TableCell>
                    <TableCell className="text-right">
                      {metric === 'quantity'
                        ? item.currentValue.toLocaleString()
                        : item.currentValue.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {metric === 'quantity'
                        ? item.prevValue.toLocaleString()
                        : item.prevValue.toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {diff >= 0 ? '+' : ''}
                      {metric === 'quantity' ? diff.toLocaleString() : diff.toFixed(1)}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${getGrowthColor(rate)}`}>
                      {rate !== null ? (
                        <>
                          {rate > 0 ? '+' : ''}
                          {rate.toFixed(1)}%
                        </>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {rate !== null ? (
                        <Badge
                          variant="outline"
                          className={
                            rate > 10
                              ? 'bg-green-100 text-green-800'
                              : rate > 0
                              ? 'bg-green-50 text-green-700'
                              : rate > -10
                              ? 'bg-red-50 text-red-700'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {rate > 10
                            ? '급성장'
                            : rate > 0
                            ? '성장'
                            : rate > -10
                            ? '감소'
                            : '급감'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-100 text-gray-600">
                          데이터 없음
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 설명 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p>
                <span className="font-medium text-foreground">전년 동기 대비 분석</span>은
                올해의 실적을 전년도 같은 기간과 비교하여 성장세를 파악하는 분석 방법입니다.
              </p>
              <p>
                <span className="font-medium text-green-600">양의 성장률</span>: 전년 대비 생산량이 증가했음을 의미합니다.
                10% 이상은 급성장으로 분류됩니다.
              </p>
              <p>
                <span className="font-medium text-red-600">음의 성장률</span>: 전년 대비 생산량이 감소했음을 의미합니다.
                -10% 이하는 급감으로 분류되어 원인 분석이 필요합니다.
              </p>
              <p>
                <span className="font-medium">계절성 분석</span>: 특정 월에 성장률이 일정한 패턴을 보인다면
                계절적 요인이 있을 수 있습니다. 여러 해의 데이터를 비교하면 패턴을 파악할 수 있습니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
