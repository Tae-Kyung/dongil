"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MonthlyAchievement, YearlyAchievementTrend } from '@/lib/hooks/use-dashboard-data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface AchievementGaugeProps {
  data: MonthlyAchievement | null;
}

const MONTH_NAMES = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export function AchievementGauge({ data }: AchievementGaugeProps) {
  if (!data || data.targetQuantity === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            월별 목표 달성률
          </CardTitle>
          <CardDescription>이번 달 목표가 설정되지 않았습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>목표 설정 페이지에서 월별 목표를 등록하세요.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressPercent = Math.min(data.quantityAchievementRate, 100);
  const expectedProgress = Math.round((data.daysPassed / (data.daysPassed + data.daysRemaining)) * 100);

  const getStatusColor = () => {
    if (data.quantityAchievementRate >= 100) return 'text-green-600';
    if (data.isOnTrack) return 'text-blue-600';
    return 'text-red-600';
  };

  const getStatusBadge = () => {
    if (data.quantityAchievementRate >= 100) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          달성 완료
        </Badge>
      );
    }
    if (data.isOnTrack) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <TrendingUp className="h-3 w-3 mr-1" />
          정상 진행
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        목표 미달
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {data.year}년 {MONTH_NAMES[data.month - 1]} 목표 달성률
            </CardTitle>
            <CardDescription>
              {data.daysPassed}일 경과 / {data.daysRemaining}일 남음
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 메인 게이지 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>진행률</span>
            <span className={`font-bold ${getStatusColor()}`}>
              {data.quantityAchievementRate}%
            </span>
          </div>
          <div className="relative">
            <Progress value={progressPercent} className="h-4" />
            {/* 예상 진행률 마커 */}
            <div
              className="absolute top-0 h-4 w-0.5 bg-gray-800"
              style={{ left: `${expectedProgress}%` }}
              title={`예상 진행률: ${expectedProgress}%`}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-800 rounded-full" />
              예상 {expectedProgress}%
            </span>
            <span>100%</span>
          </div>
        </div>

        {/* 상세 수치 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">목표 수량</div>
            <div className="text-lg font-bold">{data.targetQuantity.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">실적 수량</div>
            <div className={`text-lg font-bold ${getStatusColor()}`}>
              {data.actualQuantity.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">잔여 수량</div>
            <div className="text-lg font-bold">{data.remainingQuantity.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">일일 필요 수량</div>
            <div className="text-lg font-bold flex items-center gap-1">
              {data.dailyTargetQuantity.toLocaleString()}
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* 경고 메시지 */}
        {!data.isOnTrack && data.quantityAchievementRate < 100 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              현재 진행률({data.quantityAchievementRate}%)이 예상 진행률({expectedProgress}%)보다 낮습니다.
              목표 달성을 위해 일일 {data.dailyTargetQuantity.toLocaleString()}개 이상 생산이 필요합니다.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

interface YearlyAchievementChartProps {
  data: YearlyAchievementTrend[];
  year: number;
}

export function YearlyAchievementChart({ data, year }: YearlyAchievementChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    monthLabel: MONTH_NAMES[item.month - 1],
    hasTarget: item.targetQuantity > 0,
  }));

  const currentMonth = new Date().getMonth() + 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{year}년 월별 목표 달성 현황</CardTitle>
        <CardDescription>목표 대비 실적 및 달성률</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip
              formatter={(value, name) => [
                Number(value).toLocaleString(),
                name === 'targetQuantity' ? '목표' : '실적',
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Legend
              formatter={(value) => (value === 'targetQuantity' ? '목표' : '실적')}
            />
            <ReferenceLine y={0} stroke="#666" />
            <Bar dataKey="targetQuantity" fill="#94a3b8" name="targetQuantity" radius={[4, 4, 0, 0]} />
            <Bar dataKey="actualQuantity" name="actualQuantity" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => {
                let fill = '#3b82f6'; // 기본 파랑
                if (entry.month > currentMonth) {
                  fill = '#e2e8f0'; // 미래월은 회색
                } else if (entry.achievementRate >= 100) {
                  fill = '#22c55e'; // 달성 완료 녹색
                } else if (entry.achievementRate >= 80) {
                  fill = '#3b82f6'; // 80% 이상 파랑
                } else if (entry.achievementRate > 0) {
                  fill = '#f59e0b'; // 80% 미만 주황
                }
                return <Cell key={`cell-${index}`} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* 달성률 테이블 */}
        <div className="mt-4 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2 text-xs">
          {chartData.map((item) => (
            <div
              key={item.month}
              className={`p-2 rounded text-center ${
                item.month > currentMonth
                  ? 'bg-gray-100 text-gray-400'
                  : item.achievementRate >= 100
                  ? 'bg-green-100 text-green-800'
                  : item.achievementRate >= 80
                  ? 'bg-blue-100 text-blue-800'
                  : item.targetQuantity > 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <div className="font-medium">{item.monthLabel}</div>
              <div>{item.targetQuantity > 0 ? `${item.achievementRate}%` : '-'}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
