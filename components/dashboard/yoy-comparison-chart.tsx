"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { YoYMonthlyTrend } from '@/lib/hooks/use-dashboard-data';

interface YoYComparisonChartProps {
  data: YoYMonthlyTrend[];
  targetYear: number;
}

const MONTH_NAMES_KO = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export function YoYComparisonChart({ data, targetYear }: YoYComparisonChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    monthLabel: MONTH_NAMES_KO[item.month - 1],
    currentYearLabel: `${targetYear}년`,
    prevYearLabel: `${targetYear - 1}년`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>전년 동기 대비 생산량</CardTitle>
        <CardDescription>
          {targetYear}년 vs {targetYear - 1}년 월별 생산 수량 비교
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              formatter={(value, name) => [
                Number(value).toLocaleString(),
                name === 'currentYearQuantity' ? `${targetYear}년` : `${targetYear - 1}년`,
              ]}
              labelFormatter={(label) => `${label} 생산량`}
            />
            <Legend
              formatter={(value) =>
                value === 'currentYearQuantity' ? `${targetYear}년` : `${targetYear - 1}년`
              }
            />
            <Bar
              dataKey="prevYearQuantity"
              fill="#94a3b8"
              name="prevYearQuantity"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="currentYearQuantity"
              fill="#3b82f6"
              name="currentYearQuantity"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface GrowthRateChartProps {
  data: YoYMonthlyTrend[];
  targetYear: number;
}

export function GrowthRateChart({ data, targetYear }: GrowthRateChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    monthLabel: MONTH_NAMES_KO[item.month - 1],
    growthRate: item.quantityGrowthRate ?? 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>성장률 추이</CardTitle>
        <CardDescription>
          {targetYear}년 전년 동월 대비 증감률 (%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(value) => [`${value}%`, '성장률']}
              labelFormatter={(label) => `${label}`}
            />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Bar dataKey="growthRate" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.growthRate >= 0 ? '#22c55e' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
