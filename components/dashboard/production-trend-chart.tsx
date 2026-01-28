"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ProductionTrend } from '@/lib/hooks/use-dashboard-data';
import { format, parseISO } from 'date-fns';

interface ProductionTrendChartProps {
  data: ProductionTrend[];
}

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
