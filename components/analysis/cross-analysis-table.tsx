"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisByClientProduct, MetricType } from '@/lib/hooks/use-analysis-data';

interface CrossAnalysisTableProps {
  data: AnalysisByClientProduct[];
  metric: MetricType;
  title: string;
}

export function CrossAnalysisTable({ data, metric, title }: CrossAnalysisTableProps) {
  const formatValue = (value: number) => {
    if (metric === 'quantity') {
      return value.toLocaleString();
    }
    return value.toFixed(1);
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            표시할 데이터가 없습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">순위</TableHead>
              <TableHead className="font-bold">거래처</TableHead>
              <TableHead className="font-bold">품목</TableHead>
              <TableHead className="text-right font-bold">수량</TableHead>
              <TableHead className="text-right font-bold">면적(평)</TableHead>
              <TableHead className="text-right font-bold">건수</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={`${item.client}-${item.product_name}-${index}`}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{item.client}</TableCell>
                <TableCell>{item.product_name}</TableCell>
                <TableCell className="text-right">
                  {item.quantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {item.area_pyeong.toFixed(1)}
                </TableCell>
                <TableCell className="text-right">
                  {item.record_count.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
