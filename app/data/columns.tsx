"use client";

import { ColumnDef } from '@tanstack/react-table';
import { ProductionRecord } from '@/lib/types/production';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export const columns: ColumnDef<ProductionRecord>[] = [
  {
    accessorKey: 'production_date',
    header: '생산일자',
    cell: ({ row }) => {
      const date = row.getValue('production_date') as string;
      return date ? format(parseISO(date), 'yyyy-MM-dd') : '-';
    },
  },
  {
    accessorKey: 'client',
    header: '거래처',
    cell: ({ row }) => row.getValue('client') || '-',
  },
  {
    accessorKey: 'product_name',
    header: '품명',
    cell: ({ row }) => {
      const name = row.getValue('product_name') as string;
      return name ? (
        <div className="max-w-[200px] truncate" title={name}>
          {name}
        </div>
      ) : '-';
    },
  },
  {
    accessorKey: 'quantity',
    header: '수량',
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number;
      return quantity?.toLocaleString() || 0;
    },
  },
  {
    accessorKey: 'area_pyeong',
    header: '평수',
    cell: ({ row }) => {
      const area = row.getValue('area_pyeong') as number;
      return area ? area.toFixed(1) : '0.0';
    },
  },
  {
    accessorKey: 'order_number',
    header: '의뢰번호',
    cell: ({ row }) => row.getValue('order_number') || '-',
  },
  {
    accessorKey: 'site',
    header: '현장',
    cell: ({ row }) => {
      const site = row.getValue('site') as string;
      return site ? (
        <div className="max-w-[200px] truncate" title={site}>
          {site}
        </div>
      ) : '-';
    },
  },
  {
    accessorKey: 'process',
    header: '공정',
    cell: ({ row }) => {
      const process = row.getValue('process') as string;
      return process ? <Badge variant="outline">{process}</Badge> : '-';
    },
  },
  {
    accessorKey: 'line',
    header: '라인',
    cell: ({ row }) => row.getValue('line') || '-',
  },
  {
    accessorKey: 'width',
    header: '가로(mm)',
    cell: ({ row }) => {
      const width = row.getValue('width') as number;
      return width?.toLocaleString() || '-';
    },
  },
  {
    accessorKey: 'height',
    header: '세로(mm)',
    cell: ({ row }) => {
      const height = row.getValue('height') as number;
      return height?.toLocaleString() || '-';
    },
  },
  {
    accessorKey: 'order_no',
    header: 'NO.',
    cell: ({ row }) => row.getValue('order_no') || '-',
  },
  {
    accessorKey: 'product_code',
    header: '품목코드',
    cell: ({ row }) => row.getValue('product_code') || '-',
  },
  {
    accessorKey: 'registrar',
    header: '등록자',
    cell: ({ row }) => row.getValue('registrar') || '-',
  },
  {
    accessorKey: 'note',
    header: '비고',
    cell: ({ row }) => {
      const note = row.getValue('note') as string;
      return note ? (
        <div className="max-w-[150px] truncate" title={note}>
          {note}
        </div>
      ) : '-';
    },
  },
];
