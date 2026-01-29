"use client";

import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { PeriodType, RowDimension, MetricType } from '@/lib/hooks/use-analysis-data';
import { subDays, subMonths } from 'date-fns';

interface AnalysisFiltersProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  periodType: PeriodType;
  onPeriodTypeChange: (type: PeriodType) => void;
  rowDimension: RowDimension;
  onRowDimensionChange: (dimension: RowDimension) => void;
  metric: MetricType;
  onMetricChange: (metric: MetricType) => void;
}

export function AnalysisFilters({
  dateRange,
  onDateRangeChange,
  periodType,
  onPeriodTypeChange,
  rowDimension,
  onRowDimensionChange,
  metric,
  onMetricChange,
}: AnalysisFiltersProps) {
  const handlePresetRange = (days: number) => {
    onDateRangeChange({
      from: subDays(new Date(), days),
      to: new Date(),
    });
  };

  const handlePresetMonths = (months: number) => {
    onDateRangeChange({
      from: subMonths(new Date(), months),
      to: new Date(),
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/50">
      <div className="flex flex-wrap items-end gap-4">
        {/* 기간 선택 */}
        <div className="flex flex-col gap-2">
          <Label>기간 선택</Label>
          <div className="flex items-center gap-2">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={onDateRangeChange}
            />
          </div>
        </div>

        {/* 빠른 기간 선택 */}
        <div className="flex flex-col gap-2">
          <Label>빠른 선택</Label>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => handlePresetRange(7)}>
              7일
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetRange(30)}>
              30일
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetMonths(3)}>
              3개월
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetMonths(6)}>
              6개월
            </Button>
            <Button variant="outline" size="sm" onClick={() => handlePresetMonths(12)}>
              1년
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDateRangeChange(undefined)}>
              전체
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {/* 집계 단위 */}
        <div className="flex flex-col gap-2">
          <Label>집계 단위</Label>
          <Select value={periodType} onValueChange={(v) => onPeriodTypeChange(v as PeriodType)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">일별</SelectItem>
              <SelectItem value="weekly">주별</SelectItem>
              <SelectItem value="monthly">월별</SelectItem>
              <SelectItem value="yearly">연별</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 분석 기준 */}
        <div className="flex flex-col gap-2">
          <Label>분석 기준</Label>
          <Select value={rowDimension} onValueChange={(v) => onRowDimensionChange(v as RowDimension)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="client">거래처</SelectItem>
              <SelectItem value="product">품목</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 측정 지표 */}
        <div className="flex flex-col gap-2">
          <Label>측정 지표</Label>
          <Select value={metric} onValueChange={(v) => onMetricChange(v as MetricType)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quantity">수량</SelectItem>
              <SelectItem value="area_pyeong">면적(평)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
