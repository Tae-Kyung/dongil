"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProductStats } from '@/lib/hooks/use-dashboard-data';

interface ProductStatsChartProps {
  data: ProductStats[];
}

export function ProductStatsChart({ data }: ProductStatsChartProps) {
  const chartData = data.map(item => ({
    ...item,
    // 품목명이 너무 길면 축약
    shortName: item.product_name.length > 12 ? item.product_name.substring(0, 12) + '...' : item.product_name,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>품목별 생산 현황</CardTitle>
        <CardDescription>상위 10개 품목</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
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
              formatter={(value, name) => {
                if (value === undefined || value === null) return ['-', name];
                if (name === '수량') return [Number(value).toLocaleString(), name];
                if (name === '평수') return [Number(value).toFixed(1), name];
                return [value, name];
              }}
              labelFormatter={(label) => {
                const item = data.find(d => d.product_name.startsWith(String(label).replace('...', '')));
                return item?.product_name || label;
              }}
            />
            <Legend />
            <Bar dataKey="quantity" fill="#8884d8" name="수량" />
            <Bar dataKey="area_pyeong" fill="#82ca9d" name="평수" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
