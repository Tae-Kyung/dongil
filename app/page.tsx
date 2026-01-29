import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Upload, Table2, ArrowRight, PieChart } from "lucide-react";

export default function Home() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            동일유리 생산실적 분석 시스템
          </h1>
          <p className="text-xl text-muted-foreground">
            생산 데이터를 다차원으로 분석하여 신속한 의사결정을 지원합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
              </div>
              <CardTitle>대시보드</CardTitle>
              <CardDescription>
                주요 KPI 및 실시간 생산 현황을 한눈에 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full group">
                  바로가기
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <PieChart className="h-5 w-5 text-primary" />
                </div>
              </div>
              <CardTitle>다차원 분석</CardTitle>
              <CardDescription>
                기간별, 거래처별, 품목별 생산 현황을 분석하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/analysis">
                <Button variant="outline" className="w-full group">
                  바로가기
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Table2 className="h-5 w-5 text-primary" />
                </div>
              </div>
              <CardTitle>데이터 그리드</CardTitle>
              <CardDescription>
                생산실적 데이터를 조회하고 관리하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/data">
                <Button variant="outline" className="w-full group">
                  바로가기
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
              </div>
              <CardTitle>데이터 임포트</CardTitle>
              <CardDescription>
                CSV/TXT 파일을 업로드하여 생산 데이터를 등록하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/import">
                <Button className="w-full group">
                  업로드 시작
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>시작하기</CardTitle>
            <CardDescription>
              다음 단계를 따라 시스템을 사용해보세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">데이터 임포트</p>
                <p className="text-sm text-muted-foreground">
                  CSV 또는 TXT 파일을 업로드하여 생산실적 데이터를 등록합니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">대시보드 확인</p>
                <p className="text-sm text-muted-foreground">
                  주요 지표와 차트를 통해 전체 현황을 파악합니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">다차원 분석</p>
                <p className="text-sm text-muted-foreground">
                  기간별, 거래처별, 품목별로 생산 현황을 피벗 분석합니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium">상세 데이터 조회</p>
                <p className="text-sm text-muted-foreground">
                  데이터 그리드에서 세부 정보를 확인하고 필터링합니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
