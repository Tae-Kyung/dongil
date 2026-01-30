"use client";

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  TrendingUp,
  Building2,
  Package,
} from 'lucide-react';
import { RowDimension, MetricType } from '@/lib/hooks/use-analysis-data';

// ABC 분석 데이터 타입
export interface ConcentrationData {
  name: string;
  quantity: number;
  areaPyeong: number;
  percentage: number;
  cumulativePercentage: number;
  abcGrade: 'A' | 'B' | 'C';
  rank: number;
}

export interface ConcentrationSummaryData {
  totalCount: number;
  top1Percentage: number;
  top3Percentage: number;
  top5Percentage: number;
  top10Percentage: number;
  hhiIndex: number;
  concentrationRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  riskScore: number;
  aGradeCount: number;
  bGradeCount: number;
  cGradeCount: number;
}

interface ConcentrationAnalysisProps {
  data: ConcentrationData[];
  summary: ConcentrationSummaryData | null;
  dimension: RowDimension;
  metric: MetricType;
  isLoading?: boolean;
}

const ABC_COLORS = {
  A: '#ef4444', // red
  B: '#f59e0b', // amber
  C: '#22c55e', // green
};

export function ConcentrationAnalysis({
  data,
  summary,
  dimension,
  metric,
  isLoading,
}: ConcentrationAnalysisProps) {
  const dimensionLabel = dimension === 'client' ? '거래처' : '품목';
  const metricLabel = metric === 'quantity' ? '수량' : '면적';

  // 상위 20개만 차트에 표시
  const chartData = useMemo(() => {
    return data.slice(0, 20).map((item) => ({
      ...item,
      shortName: item.name.length > 10 ? item.name.substring(0, 10) + '...' : item.name,
    }));
  }, [data]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return <ShieldAlert className="h-4 w-4" />;
      case 'MEDIUM':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <ShieldCheck className="h-4 w-4" />;
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return '고위험';
      case 'MEDIUM':
        return '주의';
      default:
        return '양호';
    }
  };

  // 고위험 항목 (비중 15% 이상)
  const highRiskItems = useMemo(() => {
    return data.filter((item) => item.percentage >= 15);
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center border rounded-lg">
        <p className="text-muted-foreground">데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center border rounded-lg">
        <p className="text-muted-foreground">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {dimension === 'client' ? <Building2 className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                전체 {dimensionLabel}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.totalCount}개</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top 1 점유율
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.top1Percentage.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top 5 점유율
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.top5Percentage.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                HHI 지수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.hhiIndex.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                집중도 리스크
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={getRiskColor(summary.concentrationRisk)}>
                {getRiskIcon(summary.concentrationRisk)}
                <span className="ml-1">{getRiskLabel(summary.concentrationRisk)}</span>
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 고위험 경고 */}
      {highRiskItems.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>집중도 경고</AlertTitle>
          <AlertDescription>
            {highRiskItems.map((item, i) => (
              <span key={item.name}>
                <strong>{item.name}</strong> ({item.percentage.toFixed(1)}%)
                {i < highRiskItems.length - 1 ? ', ' : ''}
              </span>
            ))}
            {' '}{dimensionLabel}의 비중이 높습니다. 리스크 분산을 검토하세요.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 파레토 차트 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{dimensionLabel} 집중도 분석</CardTitle>
                <CardDescription>파레토 차트 (ABC 분석) - {metricLabel} 기준</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 60, left: 120, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 'auto']}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={110}
                  tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'percentage') return [`${value.toFixed(1)}%`, '비중'];
                    if (name === 'cumulativePercentage') return [`${value.toFixed(1)}%`, '누적비중'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `${label}`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend
                  formatter={(value) => {
                    if (value === 'percentage') return '비중 (%)';
                    if (value === 'cumulativePercentage') return '누적비중 (%)';
                    return value;
                  }}
                />
                <Bar dataKey="percentage" name="percentage" radius={[0, 4, 4, 0]} barSize={16}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ABC_COLORS[entry.abcGrade]} />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="cumulativePercentage"
                  name="cumulativePercentage"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            {/* ABC 등급 분포 */}
            {summary && (
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: ABC_COLORS.A }} />
                  <span>A등급: {summary.aGradeCount}개</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: ABC_COLORS.B }} />
                  <span>B등급: {summary.bGradeCount}개</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: ABC_COLORS.C }} />
                  <span>C등급: {summary.cGradeCount}개</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ABC 등급별 상세 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>ABC 등급별 {dimensionLabel} 목록</CardTitle>
            <CardDescription>상위 30개 {dimensionLabel} ({metricLabel} 기준)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[450px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">순위</TableHead>
                    <TableHead className="w-16">등급</TableHead>
                    <TableHead>{dimensionLabel}</TableHead>
                    <TableHead className="text-right">{metricLabel}</TableHead>
                    <TableHead className="text-right">비중</TableHead>
                    <TableHead className="text-right">누적</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 30).map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.rank}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${ABC_COLORS[item.abcGrade]}20`,
                            borderColor: ABC_COLORS[item.abcGrade],
                            color: ABC_COLORS[item.abcGrade],
                          }}
                        >
                          {item.abcGrade}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={item.name}>
                        {item.name}
                      </TableCell>
                      <TableCell className="text-right">
                        {metric === 'quantity'
                          ? item.quantity.toLocaleString()
                          : item.areaPyeong.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{item.cumulativePercentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 설명 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p>
                <span className="font-medium text-red-500">A등급</span>: 누적 70%까지의 핵심 {dimensionLabel}.
                {dimension === 'client' ? ' 매출 대부분을 차지하며 관리가 중요합니다.' : ' 주력 품목으로 품질 관리가 중요합니다.'}
              </p>
              <p>
                <span className="font-medium text-amber-500">B등급</span>: 누적 70~90%의 중요 {dimensionLabel}.
                {dimension === 'client' ? ' 성장 가능성이 있어 관심이 필요합니다.' : ' 성장 잠재력이 있는 품목입니다.'}
              </p>
              <p>
                <span className="font-medium text-green-500">C등급</span>: 나머지 10%의 일반 {dimensionLabel}.
                {dimension === 'client' ? ' 효율적인 관리 방안을 고려하세요.' : ' 수익성 검토가 필요할 수 있습니다.'}
              </p>
              <p>
                <span className="font-medium">HHI 지수</span>: 허핀달-허쉬만 지수로 집중도를 측정합니다.
                2,500 이상이면 고집중, 1,500~2,500은 중간 집중, 1,500 미만은 분산 상태입니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
