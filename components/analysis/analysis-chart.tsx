"use client";

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricType } from '@/lib/hooks/use-analysis-data';

interface ChartDataItem {
  name: string;
  quantity: number;
  area_pyeong: number;
}

interface AnalysisChartProps {
  data: ChartDataItem[];
  title: string;
  chartType: 'bar' | 'line';
  metric: MetricType;
}

export function AnalysisChart({ data, title, chartType, metric }: AnalysisChartProps) {
  const chartData = useMemo(() => {
    return data.slice(0, 15).map((item) => ({
      ...item,
      shortName: item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            표시할 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  const dataKey = metric === 'quantity' ? 'quantity' : 'area_pyeong';
  const label = metric === 'quantity' ? '수량' : '면적(평)';
  const color = metric === 'quantity' ? '#3b82f6' : '#10b981';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {chartType === 'bar' ? (
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="shortName"
                width={75}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => {
                  if (value === undefined || value === null) return ['-', label];
                  const numVal = Number(value);
                  return [metric === 'quantity' ? numVal.toLocaleString() : numVal.toFixed(1), label];
                }}
                labelFormatter={(label) => {
                  const item = data.find(d => d.name.startsWith(String(label).replace('...', '')));
                  return item?.name || label;
                }}
              />
              <Legend />
              <Bar dataKey={dataKey} name={label} fill={color} />
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="shortName"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value) => {
                  if (value === undefined || value === null) return ['-', label];
                  const numVal = Number(value);
                  return [metric === 'quantity' ? numVal.toLocaleString() : numVal.toFixed(1), label];
                }}
                labelFormatter={(label) => {
                  const item = data.find(d => d.name.startsWith(String(label).replace('...', '')));
                  return item?.name || label;
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
