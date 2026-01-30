"use client";

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
  ClientConcentration,
  ConcentrationSummary,
  HighRiskClient,
} from '@/lib/hooks/use-dashboard-data';
import { AlertTriangle, ShieldAlert, ShieldCheck, HelpCircle, TrendingUp } from 'lucide-react';

interface ClientConcentrationChartProps {
  data: ClientConcentration[];
  summary?: ConcentrationSummary | null;
  highRiskClients?: HighRiskClient[];
}

const ABC_COLORS = {
  A: '#ef4444', // red
  B: '#f59e0b', // amber
  C: '#22c55e', // green
};

export function ClientConcentrationChart({
  data,
  summary,
  highRiskClients = [],
}: ClientConcentrationChartProps) {
  // 상위 15개만 표시
  const chartData = data.slice(0, 15).map((item) => ({
    ...item,
    shortName: item.client.length > 8 ? item.client.substring(0, 8) + '...' : item.client,
  }));

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>거래처 집중도 분석</CardTitle>
            <CardDescription>파레토 차트 (ABC 분석)</CardDescription>
          </div>
          {summary && (
            <Badge variant="outline" className={getRiskColor(summary.concentrationRisk)}>
              {getRiskIcon(summary.concentrationRisk)}
              <span className="ml-1">{getRiskLabel(summary.concentrationRisk)}</span>
              <span className="ml-1">(HHI: {summary.hhiIndex.toLocaleString()})</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* 고위험 거래처 경고 */}
        {highRiskClients.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>집중도 경고</AlertTitle>
            <AlertDescription>
              {highRiskClients.map((c, i) => (
                <span key={c.client}>
                  <strong>{c.client}</strong> ({c.percentage}%)
                  {i < highRiskClients.length - 1 ? ', ' : ''}
                </span>
              ))}
              {' '}거래처의 비중이 높습니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 파레토 차트 (가로 막대) */}
        <ResponsiveContainer width="100%" height={450}>
          <ComposedChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 60, left: 140, bottom: 20 }}
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
              dataKey="client"
              tick={{ fontSize: 11 }}
              width={130}
              tickFormatter={(value) => value.length > 14 ? value.substring(0, 14) + '...' : value}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'percentage') return [`${value}%`, '비중'];
                if (name === 'cumulativePercentage') return [`${value}%`, '누적비중'];
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
            <Bar dataKey="percentage" name="percentage" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={ABC_COLORS[entry.abcGrade as keyof typeof ABC_COLORS]} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="cumulativePercentage"
              name="cumulativePercentage"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3b82f6' }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* 요약 통계 */}
        {summary && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground">Top 1</div>
              <div className="font-semibold">{summary.top1Percentage}%</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground">Top 5</div>
              <div className="font-semibold">{summary.top5Percentage}%</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground">Top 10</div>
              <div className="font-semibold">{summary.top10Percentage}%</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="text-muted-foreground">전체 거래처</div>
              <div className="font-semibold">{summary.totalClients}개</div>
            </div>
          </div>
        )}

        {/* ABC 등급 분포 */}
        {summary && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
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

        {/* 설명 */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p>
                <span className="font-medium text-red-500">A등급</span>: 누적 70%까지의 핵심 거래처.
                매출 대부분을 차지하며 관리가 중요합니다.
              </p>
              <p>
                <span className="font-medium text-amber-500">B등급</span>: 누적 70~90%의 중요 거래처.
                성장 가능성이 있어 관심이 필요합니다.
              </p>
              <p>
                <span className="font-medium text-green-500">C등급</span>: 나머지 10%의 일반 거래처.
                효율적인 관리 방안을 고려하세요.
              </p>
              <p>
                <span className="font-medium">HHI 지수</span>: 허핀달-허쉬만 지수로 시장 집중도를 측정합니다.
                2,500 이상이면 고집중, 1,500~2,500은 중간 집중입니다.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
