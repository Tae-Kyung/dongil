"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProductStats } from '@/lib/hooks/use-dashboard-data';

interface ProductStatsChartProps {
  data: ProductStats[];
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
];

export function ProductStatsChart({ data }: ProductStatsChartProps) {
  const chartData = data.map(item => ({
    name: item.product_name.length > 20
      ? item.product_name.substring(0, 20) + '...'
      : item.product_name,
    fullName: item.product_name,
    value: item.quantity,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>품목별 생산 비중</CardTitle>
        <CardDescription>상위 10개 품목 (수량 기준)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => value !== undefined && value !== null ? Number(value).toLocaleString() : '-'}
              labelFormatter={(label) => {
                const item = chartData.find(d => d.name === label);
                return item?.fullName || label;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
