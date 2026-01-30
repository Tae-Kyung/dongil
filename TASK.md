# Phase 1 MVP 작업 현황

**프로젝트**: 동일유리 생산실적 분석 시스템
**시작일**: 2026-01-28
**현재 상태**: ✅ Phase 1 MVP 완료 (9/9 완료)

---

## 작업 목록

### ✅ Task #1: Next.js 프로젝트 초기화
**상태**: 완료
**완료일**: 2026-01-28

**작업 내용**:
- [x] pnpm 전역 설치
- [x] Next.js 15 프로젝트 생성 (TypeScript, Tailwind CSS, ESLint)
- [x] 프로젝트 구조 설정
  - `app/` - Next.js App Router
  - `components/` - 재사용 컴포넌트
  - `lib/` - 유틸리티 함수
  - `public/` - 정적 파일
- [x] 기본 설정 파일 작성
  - `next.config.ts`
  - `tsconfig.json`
  - `tailwind.config.ts`
  - `postcss.config.mjs`
  - `.eslintrc.json`
  - `.gitignore`
- [x] 루트 레이아웃 및 홈페이지 생성
- [x] 개발 서버 테스트 (http://localhost:3000)

**결과**:
- ✅ 프로젝트가 `app/` 폴더에 생성됨
- ✅ 개발 서버 정상 작동 확인

---

### ✅ Task #2: shadcn/ui 설정 및 기본 컴포넌트 설치
**상태**: 완료
**완료일**: 2026-01-28

**작업 내용**:
- [x] shadcn/ui 필수 의존성 설치
  - `class-variance-authority`
  - `clsx`
  - `tailwind-merge`
  - `lucide-react`
  - `tailwindcss-animate`
- [x] `lib/utils.ts` 유틸리티 함수 생성
- [x] `components.json` 설정 파일 생성
- [x] Tailwind CSS 설정 업데이트 (CSS 변수, 다크모드)
- [x] `globals.css` 테마 설정
- [x] 기본 컴포넌트 설치
  - Button
  - Card
  - Table
  - Input

**결과**:
- ✅ shadcn/ui 컴포넌트 시스템 준비 완료
- ✅ `components/ui/` 폴더에 4개 컴포넌트 생성

---

### ✅ Task #3: Supabase 설정 및 연동
**상태**: 완료
**완료일**: 2026-01-28

**작업 내용**:
- [x] Supabase 클라이언트 라이브러리 설치
  - `@supabase/supabase-js`
  - `@supabase/ssr`
- [x] Supabase 클라이언트 파일 생성
  - `lib/supabase/client.ts` - 클라이언트 컴포넌트용
  - `lib/supabase/server.ts` - 서버 컴포넌트용
- [x] 환경변수 파일 생성
  - `.env.local.example` - 템플릿
  - `.env.local` - 실제 설정 (gitignore됨)

**결과**:
- ✅ Supabase 연동 코드 준비 완료
- ⚠️ **추가 작업 필요**: `.env.local`에 실제 Supabase URL과 API 키 입력

**설정 방법**:
1. [Supabase Dashboard](https://supabase.com/dashboard)에서 프로젝트 선택
2. Project Settings > API에서 URL과 anon key 복사
3. `.env.local` 파일에 붙여넣기

---

### ✅ Task #4: 데이터베이스 스키마 생성
**상태**: 완료
**완료일**: 2026-01-28

**작업 내용**:
- [x] `supabase/schema.sql` SQL 스크립트 작성
- [x] 테이블 정의
  - `production_records` - 생산실적 (메인 테이블)
  - `clients` - 거래처 마스터
  - `products` - 품목 마스터
  - `saved_reports` - 사용자 정의 리포트
- [x] 인덱스 생성 (9개 - 성능 최적화)
- [x] 트리거 설정 (`updated_at` 자동 갱신)
- [x] Row Level Security (RLS) 정책 설정
  - 인증된 사용자만 데이터 접근 가능
  - 리포트는 사용자별 격리
- [x] `supabase/README.md` 설정 가이드 작성

**결과**:
- ✅ 데이터베이스 스키마 파일 준비 완료
- ⚠️ **추가 작업 필요**: Supabase Dashboard의 SQL Editor에서 스키마 실행

**실행 방법**:
1. Supabase Dashboard > SQL Editor
2. `supabase/schema.sql` 내용 복사
3. 붙여넣고 Run 버튼 클릭

---

### ✅ Task #5: CSV/TXT 파일 업로드 및 파싱 기능 구현
**상태**: 완료
**완료일**: 2026-01-28

**작업 내용**:
- [x] CSV 파싱 라이브러리 설치 (papaparse + @types/papaparse)
- [x] 추가 UI 컴포넌트 설치
  - Progress (진행률 표시)
  - Toast (알림 메시지)
  - Alert (경고 메시지)
  - Badge (배지)
  - Label (라벨)
- [x] 타입 정의 (`lib/types/production.ts`)
  - ProductionRecord - 데이터베이스 타입
  - ProductionRecordCSV - CSV 원본 타입
  - UploadResult - 업로드 결과 타입
- [x] CSV 파싱 유틸리티 (`lib/utils/csv-parser.ts`)
  - parseCSVFile() - 파일 파싱
  - convertCSVToRecord() - 데이터 변환
  - validateRecord() - 데이터 검증
  - chunkArray() - 배치 분할
- [x] 파일 업로드 컴포넌트 (`components/upload/file-upload.tsx`)
  - 드래그 앤 드롭 지원
  - 파일 선택 UI
  - 업로드 진행률 표시
- [x] 데이터 임포트 페이지 (`app/import/page.tsx`)
  - 파일 업로드 흐름 관리
  - CSV 파싱 및 검증
  - 배치 삽입 (1000건씩)
  - 결과 통계 표시
  - 에러 목록 표시
- [x] 네비게이션 바 추가 (`components/layout/navbar.tsx`)
- [x] 홈페이지 개선 (카드 UI, 시작 가이드)
- [x] Toaster를 레이아웃에 통합
- [x] 업로드 가이드 문서 작성 (`UPLOAD_GUIDE.md`)

**구현된 기능**:
- ✅ 드래그 앤 드롭 파일 업로드
- ✅ CSV/TXT 파일 파싱 (UTF-8)
- ✅ 데이터 타입 자동 변환 (날짜, 숫자, Boolean)
- ✅ 필수 필드 검증
- ✅ 배치 삽입 (1000건씩)
- ✅ 실시간 진행률 표시 (0% ~ 100%)
- ✅ Toast 알림
- ✅ 업로드 결과 통계
- ✅ 에러 메시지 표시

**결과**:
- ✅ `/import` 페이지에서 파일 업로드 가능
- ✅ 대용량 파일 처리 지원
- ✅ 사용자 친화적인 UI/UX
- ✅ 완료 후 결과 확인 가능

---

### ✅ Task #6: 기본 대시보드 구현
**상태**: 완료
**완료일**: 2026-01-28

**작업 내용**:
- [x] 필수 라이브러리 설치
  - `recharts` - 차트 라이브러리
  - `@tanstack/react-query` - 서버 상태 관리
  - `date-fns` - 날짜 처리
  - `react-day-picker` - 날짜 선택기
- [x] React Query Provider 설정 (`components/providers/query-provider.tsx`)
- [x] 데이터 조회 hooks 생성 (`lib/hooks/use-dashboard-data.ts`)
  - useDashboardStats() - 전체 통계
  - useProductionTrend() - 생산량 추이
  - useClientStats() - 거래처별 통계
  - useProductStats() - 품목별 통계
- [x] KPI 카드 컴포넌트 (`components/dashboard/kpi-card.tsx`)
- [x] 차트 컴포넌트 구현
  - ProductionTrendChart - 생산량 추이 라인 차트
  - ClientStatsChart - 거래처별 바 차트
  - ProductStatsChart - 품목별 파이 차트
- [x] 날짜 범위 선택기 (`components/dashboard/date-range-picker.tsx`)
- [x] shadcn/ui 컴포넌트 추가 (Popover, Calendar)
- [x] 대시보드 페이지 (`app/dashboard/page.tsx`)
  - 4개 KPI 카드 (총 수량, 총 평수, 거래처 수, 금일 생산량)
  - 3개 차트 (추이, 거래처, 품목)
  - 날짜 필터 (최근 30일, 전체)

**구현된 기능**:
- ✅ 실시간 데이터 조회 (React Query)
- ✅ 날짜 범위 필터 (캘린더 UI)
- ✅ 자동 데이터 집계 (거래처별, 품목별, 일별)
- ✅ 반응형 차트 (Recharts)
- ✅ 로딩 상태 표시
- ✅ 빈 데이터 처리

**결과**:
- ✅ `/dashboard` 페이지에서 생산실적 대시보드 확인 가능
- ✅ 인터랙티브 차트 및 KPI
- ✅ 유연한 날짜 범위 선택

---

### ✅ Task #7: 데이터 그리드 구현
**상태**: 완료
**완료일**: 2026-01-28

**작업 내용**:
- [x] TanStack Table 설치 (`@tanstack/react-table`)
- [x] 데이터 조회 hook (`lib/hooks/use-production-data.ts`)
  - 페이지네이션 (서버 사이드)
  - 정렬 (동적 필드, 오름차순/내림차순)
  - 검색 (거래처, 품명, 의뢰번호, 현장)
  - 필터링 (동적 필드)
- [x] 데이터 테이블 컴포넌트 (`components/data-grid/data-table.tsx`)
  - TanStack Table 통합
  - 페이지네이션 UI (첫/이전/다음/마지막 페이지)
  - 페이지당 행 수 선택 (10, 20, 50, 100)
  - 정렬 가능한 컬럼 헤더
- [x] 컬럼 정의 (`app/data/columns.tsx`)
  - 15개 주요 컬럼 정의
  - 날짜 포맷팅 (date-fns)
  - 숫자 포맷팅 (천 단위 구분)
  - 긴 텍스트 말줄임 (truncate)
  - Badge 스타일 (공정)
- [x] 데이터 그리드 페이지 (`app/data/page.tsx`)
  - 검색 입력 (Enter 키 지원)
  - 검색 초기화 버튼
  - 로딩 상태 표시
  - 빈 데이터 처리

**구현된 기능**:
- ✅ 서버 사이드 페이지네이션 (성능 최적화)
- ✅ 전체 텍스트 검색 (4개 필드)
- ✅ 동적 정렬 (클라이언트)
- ✅ 반응형 테이블
- ✅ 데이터 개수 표시
- ✅ 페이지 정보 표시

**결과**:
- ✅ `/data` 페이지에서 생산실적 데이터 조회 가능
- ✅ 대용량 데이터 효율적 처리
- ✅ 빠른 검색 및 탐색

---

### ✅ Task #8: 사용자 인증 구현
**상태**: 완료
**완료일**: 2026-01-28

**작업 내용**:
- [x] 인증 hook 생성 (`lib/hooks/use-auth.ts`)
  - useAuth() - 사용자 상태, 로그인/로그아웃 함수 제공
  - 세션 자동 감지 및 갱신
- [x] 로그인 페이지 (`app/login/page.tsx`)
  - 이메일/비밀번호 입력 폼
  - 에러 처리 및 사용자 피드백
  - 로딩 상태 표시
- [x] Middleware 설정 (`middleware.ts`)
  - 보호된 라우트 설정 (/dashboard, /data, /import)
  - 미인증 사용자 자동 리다이렉트 (/login)
  - 인증된 사용자가 /login 접근 시 대시보드로 리다이렉트
- [x] shadcn/ui 컴포넌트 추가 (Dropdown Menu, Avatar)
- [x] 네비게이션 바 업데이트 (`components/layout/navbar.tsx`)
  - 사용자 아바타 및 이메일 표시
  - 로그아웃 버튼
  - 로그인 페이지에서 네비게이션 숨김

**구현된 기능**:
- ✅ Supabase Auth 통합
- ✅ 이메일/비밀번호 로그인
- ✅ 자동 세션 관리
- ✅ 보호된 라우트 (Middleware)
- ✅ 로그아웃 기능
- ✅ 사용자 정보 표시

**결과**:
- ✅ 미인증 사용자는 보호된 페이지 접근 불가
- ✅ 로그인 후 세션 유지
- ✅ 네비게이션 바에서 사용자 정보 확인 가능

---

### ✅ Task #9: Vercel 배포 설정
**상태**: 완료
**완료일**: 2026-01-28

**작업 내용**:
- [x] 배포 가이드 문서 작성 (`DEPLOYMENT.md`)
  - GitHub 저장소 생성 가이드
  - Vercel 프로젝트 임포트 단계
  - 환경변수 설정 방법
  - 커스텀 도메인 설정 (선택)
  - 문제 해결 가이드
  - 성능 최적화 팁
- [x] README.md 업데이트
  - 주요 기능 설명
  - 완전한 설치 가이드
  - 프로젝트 구조 상세 설명
  - Phase 1 MVP 체크리스트 (100% 완료)
  - 사용 방법 추가
- [x] .gitignore 확인 (환경변수 보호)
- [x] 문서 링크 정리

**배포 준비 완료**:
- ✅ GitHub 저장소 생성 가이드
- ✅ Vercel 배포 설정 가이드
- ✅ 환경변수 설정 체크리스트
- ✅ 배포 후 확인 사항 문서화
- ✅ 자동 배포 설정 설명

**다음 단계**:
1. GitHub에 코드 푸시
2. Vercel에서 프로젝트 임포트
3. 환경변수 설정
4. 배포 및 테스트

**참고 문서**:
- [DEPLOYMENT.md](../app/DEPLOYMENT.md) - 상세 배포 가이드

---

## 기술 스택

### 프론트엔드
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **State Management**: React Query
- **Icons**: Lucide React

### 백엔드/인프라
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel

### 개발 도구
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Git**: .gitignore 설정 완료

---

## 🎉 Phase 1 MVP 완료!

**완료 일자**: 2026-01-28
**총 소요 시간**: 1일
**작성자**: Claude (AI Assistant)
**최종 진행률**: ✅ 100% (9/9 작업 완료)

### 완료된 주요 기능

1. ✅ **프로젝트 초기화** - Next.js 15 + TypeScript + Tailwind CSS
2. ✅ **UI 컴포넌트** - shadcn/ui 통합 (15개 컴포넌트)
3. ✅ **데이터베이스** - Supabase PostgreSQL + RLS
4. ✅ **데이터 임포트** - CSV 업로드, 파싱, 배치 처리
5. ✅ **대시보드** - KPI 카드 + 3개 차트 + 날짜 필터
6. ✅ **데이터 그리드** - 검색, 정렬, 페이지네이션
7. ✅ **사용자 인증** - Supabase Auth + Middleware
8. ✅ **배포 준비** - Vercel 배포 가이드 작성

### 기술 통계

- **파일 생성**: 50개 이상
- **컴포넌트**: 20개 이상
- **페이지**: 5개 (/, /login, /dashboard, /data, /import)
- **Hooks**: 3개 (useAuth, useDashboardData, useProductionData)
- **문서**: 6개 (README, PRD, TASK, UPLOAD_GUIDE, DEPLOYMENT, Supabase README)

---

# Phase 1.5: 다차원 분석 기능 (완료)

**완료일**: 2026-01-29
**진행률**: ✅ 100% 완료

### ✅ Task #10: 다차원 분석 페이지
- [x] 피벗 테이블 구현 (거래처별/품목별 × 기간별)
- [x] 차트 분석 (가로 바 차트, 라인 차트)
- [x] 교차 분석 (거래처-품목 조합)
- [x] 필터 기능 (기간, 집계 단위, 분석 기준, 측정 지표)
- [x] PostgreSQL RPC 함수 6개 추가
- [x] UI 컴포넌트 추가 (Select, Tabs)

---

# Phase 2: 분석 고도화 (단기 - 2주)

**목표**: 비교 분석 및 추세 파악 기능 강화
**예상 기간**: 2주
**진행률**: ✅ 100% (3/3 완료)

### ✅ Task #11: 전년 동기 대비 분석
**상태**: 완료
**완료일**: 2026-01-29
**우선순위**: 높음

**작업 내용**:
- [x] 전년 동월 대비 증감률 계산 함수 추가
- [x] 대시보드 KPI에 전년 대비 표시 (↑12%, ↓5% 등)
- [x] 전년 동기 비교 차트 추가
- [x] 성장률 트렌드 시각화

**구현된 기능**:
- ✅ PostgreSQL RPC 함수 3개 추가
  - `get_yoy_comparison` - 전년 동기 대비 통계 (KPI용)
  - `get_yoy_monthly_trend` - 월별 전년 대비 추이
  - `get_daily_yoy_comparison` - 일별 전년 동일 대비
- ✅ React Query hooks 3개 추가
  - `useYoYComparison` - 전년 동기 대비 KPI
  - `useYoYMonthlyTrend` - 월별 비교 차트용
  - `useDailyYoYComparison` - 일별 성장률 추이
- ✅ 대시보드 KPI 카드에 전년 대비 증감률 표시 (↑↓ + %)
- ✅ 전년 동기 비교 바 차트 (올해 vs 작년 월별)
- ✅ 성장률 추이 차트 (양수: 녹색, 음수: 빨간색)

**결과**:
- ✅ `/dashboard` 페이지에서 전년 대비 분석 확인 가능
- ✅ KPI 카드에 성장률 및 전년 수치 표시
- ✅ 월별 전년 대비 시각화 차트 2개 추가

**SQL 실행 필요**:
```sql
-- Supabase Dashboard > SQL Editor에서 실행
-- supabase/functions.sql의 새로운 함수 부분 실행
-- (get_yoy_comparison, get_yoy_monthly_trend, get_daily_yoy_comparison)
```

---

### ✅ Task #12: 이동평균 추세선
**상태**: 완료
**완료일**: 2026-01-29
**우선순위**: 높음

**작업 내용**:
- [x] 7일/30일 이동평균 계산 로직
- [x] 생산량 추이 차트에 추세선 오버레이
- [x] 추세 방향 표시 (상승/하락/보합)
- [x] 이상치 하이라이트

**구현된 기능**:
- ✅ PostgreSQL RPC 함수 2개 추가
  - `get_production_trend_with_ma` - 이동평균 포함 생산량 추이 (Window Function 사용)
  - `get_trend_summary` - 추세 요약 통계 (전체 추세, 변동성, 이상치 수)
- ✅ React Query hooks 2개 추가
  - `useProductionTrendWithMA` - 이동평균 데이터 조회
  - `useTrendSummary` - 추세 요약 조회
- ✅ 생산량 추이 차트 업그레이드
  - 7일 이동평균선 (주황색 점선)
  - 30일 이동평균선 (녹색 점선)
  - 이상치 빨간 점으로 하이라이트
  - 추세 방향 배지 (상승↑/하락↓/보합-)
  - 통계 요약 (일평균, 최대, 최소, 변동성)

**결과**:
- ✅ `/dashboard` 페이지에서 이동평균 차트 확인 가능
- ✅ 추세 방향 및 강도 자동 계산
- ✅ 이상치 자동 탐지 (±2σ 기준)

**SQL 실행 필요**:
```sql
-- Supabase Dashboard > SQL Editor에서 실행
-- get_production_trend_with_ma, get_trend_summary 함수 추가
```

---

### ✅ Task #13: 거래처 집중도 분석
**상태**: 완료
**완료일**: 2026-01-29
**우선순위**: 중간

**작업 내용**:
- [x] 상위 5개 거래처 의존도 계산
- [x] 파레토 차트 (ABC 분석)
- [x] 거래처 리스크 점수 산출
- [x] 집중도 경고 알림 (특정 거래처 비중 > 30%)

**구현된 기능**:
- ✅ PostgreSQL RPC 함수 3개 추가
  - `get_client_concentration` - 거래처별 비중 및 ABC 등급
  - `get_concentration_summary` - 집중도 요약 (HHI 지수, 리스크 점수)
  - `get_high_risk_clients` - 고위험 거래처 목록
- ✅ React Query hooks 3개 추가
  - `useClientConcentration` - 거래처 집중도 데이터
  - `useConcentrationSummary` - 집중도 요약
  - `useHighRiskClients` - 고위험 거래처
- ✅ 파레토 차트 (ComposedChart)
  - 막대: 거래처별 비중 (ABC 등급별 색상)
  - 선: 누적 비중
- ✅ 리스크 배지 (HIGH/MEDIUM/LOW)
- ✅ 고위험 거래처 경고 알림 (비중 > 20%)
- ✅ HHI 지수 표시 및 설명

**결과**:
- ✅ `/dashboard` 페이지에서 거래처 집중도 분석 확인 가능
- ✅ ABC 분석으로 핵심/중요/일반 거래처 구분
- ✅ 리스크 자동 평가 (HHI 지수 기반)

**SQL 실행 필요**:
```sql
-- Supabase Dashboard > SQL Editor에서 실행
-- get_client_concentration, get_concentration_summary, get_high_risk_clients
```

---

# Phase 3: 목표 관리 및 리포팅 (중기 - 1개월)

**목표**: 목표 설정 및 자동 리포트 생성
**예상 기간**: 1개월
**진행률**: 🔄 33% (1/3 완료)

### ✅ Task #14: 월별 목표 설정 및 달성률
**상태**: 완료
**완료일**: 2026-01-29
**우선순위**: 높음

**작업 내용**:
- [x] 목표 테이블 스키마 설계 (production_targets)
- [x] 목표 입력/수정 UI
- [x] 달성률 게이지 차트
- [x] 목표 대비 진행률 대시보드
- [x] 목표 미달 알림

**구현된 기능**:
- ✅ production_targets 테이블 (RLS 활성화)
- ✅ PostgreSQL RPC 함수 3개 추가
  - `get_monthly_achievement` - 월별 목표 달성률
  - `get_yearly_achievement_trend` - 연간 월별 달성률 추이
  - `get_production_targets` - 목표 목록 조회
- ✅ React Query hooks 3개 추가
- ✅ 목표 설정 페이지 (`/targets`)
  - 목표 추가/수정/삭제 UI
  - 연도별 필터링
- ✅ 대시보드 달성률 위젯
  - 게이지 차트 (진행률 + 예상 진행률)
  - 잔여 수량, 일일 필요 수량 표시
  - 목표 미달 경고 알림
- ✅ 연간 월별 달성률 차트
- ✅ 네비게이션에 목표 설정 메뉴 추가

**결과**:
- ✅ `/targets` 페이지에서 목표 관리 가능
- ✅ `/dashboard` 페이지에서 달성률 확인 가능
- ✅ 목표 미달 시 경고 알림 표시

**SQL 실행 필요**:
```sql
-- Supabase Dashboard > SQL Editor에서 실행
-- production_targets 테이블 생성
-- get_monthly_achievement, get_yearly_achievement_trend, get_production_targets 함수 추가
```

---

### 📋 Task #15: 자동 리포트 생성 (PDF)
**상태**: 대기
**우선순위**: 중간

**작업 내용**:
- [ ] 주간/월간 리포트 템플릿 설계
- [ ] PDF 생성 라이브러리 연동 (react-pdf 또는 puppeteer)
- [ ] 리포트 다운로드 기능
- [ ] 리포트 자동 생성 스케줄링

**리포트 내용**:
- 기간별 생산 요약
- 주요 KPI 및 전기 대비
- 거래처별/품목별 Top 10
- 차트 이미지 포함

---

### 📋 Task #16: 이상치 알림 기능
**상태**: 대기
**우선순위**: 중간

**작업 내용**:
- [ ] 이상치 탐지 알고리즘 (표준편차 기반)
- [ ] 알림 설정 UI (임계값 설정)
- [ ] 대시보드 알림 배지
- [ ] 이메일 알림 (선택)

**탐지 기준**:
- 평소 대비 ±2σ 이상 변동
- 연속 3일 감소/증가
- 특정 거래처 급변

---

# Phase 4: 예측 및 고급 분석 (장기 - 2~3개월)

**목표**: AI/ML 기반 예측 및 고급 분석
**예상 기간**: 2~3개월

### 📋 Task #17: 시계열 예측 모델
**상태**: 대기
**우선순위**: 낮음

**작업 내용**:
- [ ] 예측 모델 선택 (이동평균, 지수평활, ARIMA)
- [ ] Python 예측 서비스 구축 (FastAPI)
- [ ] Next.js와 API 연동
- [ ] 예측 결과 시각화 (신뢰구간 포함)

**기술 스택**:
- Python + pandas + statsmodels
- FastAPI 또는 Supabase Edge Functions
- Vercel Serverless Functions

---

### 📋 Task #18: 대시보드 커스터마이징
**상태**: 대기
**우선순위**: 낮음

**작업 내용**:
- [ ] 드래그 앤 드롭 위젯 배치
- [ ] 위젯 크기 조절
- [ ] 사용자별 레이아웃 저장
- [ ] 위젯 추가/삭제

**라이브러리**:
- react-grid-layout

---

### 📋 Task #19: 모바일 앱 / PWA
**상태**: 대기
**우선순위**: 낮음

**작업 내용**:
- [ ] PWA 매니페스트 설정
- [ ] 오프라인 지원 (Service Worker)
- [ ] 모바일 최적화 UI
- [ ] 푸시 알림

---

## 우선순위 요약

| 순위 | Task | 예상 기간 | 비즈니스 가치 |
|------|------|----------|--------------|
| 1 | 전년 동기 대비 분석 | 3일 | 높음 - 성과 비교 |
| 2 | 이동평균 추세선 | 2일 | 높음 - 트렌드 파악 |
| 3 | 거래처 집중도 분석 | 3일 | 중간 - 리스크 관리 |
| 4 | 월별 목표 달성률 | 1주 | 높음 - 목표 관리 |
| 5 | 자동 리포트 (PDF) | 1주 | 중간 - 업무 효율화 |
| 6 | 이상치 알림 | 4일 | 중간 - 조기 경보 |
| 7 | 시계열 예측 | 2주 | 낮음 - 미래 대비 |

---

**최종 업데이트**: 2026-01-29 (Task #11 완료)
