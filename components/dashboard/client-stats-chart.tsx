"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ClientStats } from '@/lib/hooks/use-dashboard-data';

interface ClientStatsChartProps {
  data: ClientStats[];
}

export function ClientStatsChart({ data }: ClientStatsChartProps) {
  const chartData = data.map(item => ({
    ...item,
    // 거래처명이 너무 길면 축약
    shortName: item.client.length > 15 ? item.client.substring(0, 15) + '...' : item.client,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>거래처별 생산 현황</CardTitle>
        <CardDescription>상위 10개 거래처</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="shortName" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip
              formatter={(value, name) => {
                if (value === undefined || value === null) return ['-', name];
                if (name === '수량') return [Number(value).toLocaleString(), name];
                if (name === '평수') return [Number(value).toFixed(1), name];
                return [value, name];
              }}
              labelFormatter={(label) => {
                const item = data.find(d => d.client.startsWith(label.replace('...', '')));
                return item?.client || label;
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
