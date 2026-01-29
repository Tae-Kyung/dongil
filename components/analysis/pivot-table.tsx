"use client";

import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PivotData, MetricType, transformToPivotTable } from '@/lib/hooks/use-analysis-data';

interface PivotTableProps {
  data: PivotData[];
  metric: MetricType;
  rowLabel: string;
  title: string;
}

export function PivotTable({ data, metric, rowLabel, title }: PivotTableProps) {
  const pivotData = useMemo(() => transformToPivotTable(data, metric), [data, metric]);

  const formatValue = (value: number) => {
    if (metric === 'quantity') {
      return value.toLocaleString();
    }
    return value.toFixed(1);
  };

  if (pivotData.rows.length === 0 || pivotData.columns.length === 0) {
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
              <TableHead className="font-bold sticky left-0 bg-background min-w-[150px]">
                {rowLabel}
              </TableHead>
              {pivotData.columns.map((col) => (
                <TableHead key={col} className="text-right min-w-[100px]">
                  {col}
                </TableHead>
              ))}
              <TableHead className="text-right font-bold min-w-[100px] bg-muted">
                합계
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pivotData.rows.map((row) => (
              <TableRow key={row}>
                <TableCell className="font-medium sticky left-0 bg-background">
                  {row}
                </TableCell>
                {pivotData.columns.map((col) => (
                  <TableCell key={col} className="text-right">
                    {formatValue(pivotData.values[row][col])}
                  </TableCell>
                ))}
                <TableCell className="text-right font-bold bg-muted">
                  {formatValue(pivotData.rowTotals[row])}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted font-bold">
              <TableCell className="sticky left-0 bg-muted">합계</TableCell>
              {pivotData.columns.map((col) => (
                <TableCell key={col} className="text-right">
                  {formatValue(pivotData.columnTotals[col])}
                </TableCell>
              ))}
              <TableCell className="text-right">
                {formatValue(pivotData.grandTotal)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
