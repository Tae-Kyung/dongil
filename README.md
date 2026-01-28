# 동일유리 생산실적 분석 시스템

동일유리의 생산실적 데이터를 다차원으로 분석하여 의사결정을 지원하는 웹 애플리케이션입니다.

![Phase 1 MVP 완료](https://img.shields.io/badge/Phase%201-MVP%20Complete-success)
![Progress](https://img.shields.io/badge/Progress-100%25-brightgreen)

## 주요 기능

### 📊 대시보드
- 실시간 KPI 모니터링 (총 수량, 평수, 거래처 수, 금일 생산량)
- 생산량 추이 라인 차트 (일별)
- 거래처별 생산 현황 바 차트
- 품목별 생산 비중 파이 차트
- 유연한 날짜 범위 필터

### 📋 데이터 그리드
- 서버 사이드 페이지네이션 (성능 최적화)
- 전체 텍스트 검색 (거래처, 품명, 의뢰번호, 현장)
- 정렬 기능
- 15개 주요 컬럼 표시

### 📤 데이터 임포트
- CSV/TXT 파일 업로드 (드래그 앤 드롭 지원)
- 대용량 파일 처리 (배치 처리)
- 자동 데이터 검증
- 실시간 진행률 표시
- 업로드 결과 통계

### 🔐 사용자 인증
- Supabase Auth 통합
- 이메일/비밀번호 로그인
- 보호된 라우트 (Middleware)
- 세션 관리

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Data Fetching**: TanStack React Query
- **Table**: TanStack Table
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (권장)
- **Package Manager**: pnpm

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- pnpm 8 이상
- Supabase 계정

### 설치

1. **저장소 클론**

```bash
git clone https://github.com/YOUR_USERNAME/dongil-analytics.git
cd dongil-analytics/app
```

2. **의존성 설치**

```bash
pnpm install
```

3. **환경변수 설정**

`.env.local` 파일을 생성하고 다음 내용을 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. **Supabase 설정**

- `supabase/schema.sql` 파일의 내용을 Supabase Dashboard의 SQL Editor에서 실행
- 자세한 내용은 `supabase/README.md` 참조

5. **개발 서버 실행**

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

### 빌드

```bash
pnpm build
```

### 프로덕션 실행

```bash
pnpm start
```

## 프로젝트 구조

```
app/
├── app/                      # Next.js App Router
│   ├── dashboard/            # 대시보드 페이지
│   ├── data/                 # 데이터 그리드 페이지
│   ├── import/               # 데이터 임포트 페이지
│   ├── login/                # 로그인 페이지
│   ├── layout.tsx            # 루트 레이아웃
│   └── page.tsx              # 홈페이지
├── components/               # 재사용 컴포넌트
│   ├── dashboard/            # 대시보드 컴포넌트
│   ├── data-grid/            # 데이터 그리드 컴포넌트
│   ├── layout/               # 레이아웃 컴포넌트
│   ├── providers/            # Provider 컴포넌트
│   ├── ui/                   # shadcn/ui 컴포넌트
│   └── upload/               # 파일 업로드 컴포넌트
├── lib/                      # 유틸리티 및 라이브러리
│   ├── hooks/                # 커스텀 hooks
│   ├── supabase/             # Supabase 클라이언트
│   ├── types/                # TypeScript 타입
│   └── utils/                # 유틸리티 함수
├── supabase/                 # Supabase 설정
│   ├── schema.sql            # 데이터베이스 스키마
│   └── README.md             # Supabase 가이드
├── middleware.ts             # Next.js Middleware (인증)
└── ...
```

## Phase 1 MVP 기능 (✅ 100% 완료)

- [x] Next.js 프로젝트 초기화
- [x] shadcn/ui 설정 및 컴포넌트 설치
- [x] Supabase 설정 및 연동
- [x] 데이터베이스 스키마 생성
- [x] CSV/TXT 파일 업로드 및 파싱
- [x] 기본 대시보드 (KPI, 차트)
- [x] 데이터 그리드 (검색, 정렬, 페이지네이션)
- [x] 사용자 인증 (로그인/로그아웃)
- [x] Vercel 배포 준비

## 배포

Vercel로 배포하는 방법은 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

### 빠른 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/dongil-analytics&root-directory=app)

**중요**: 배포 후 환경변수 설정 필수!

## 문서

- [PRD.md](../PRD.md) - 제품 요구사항 정의서
- [TASK.md](../TASK.md) - 작업 현황
- [UPLOAD_GUIDE.md](./UPLOAD_GUIDE.md) - 데이터 업로드 가이드
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Vercel 배포 가이드
- [supabase/README.md](./supabase/README.md) - Supabase 설정 가이드

## 사용 방법

### 1. 로그인
- `/login` 페이지에서 이메일/비밀번호로 로그인
- Supabase Dashboard에서 사용자 생성 필요

### 2. 데이터 업로드
- `/import` 페이지에서 CSV/TXT 파일 업로드
- 드래그 앤 드롭 또는 파일 선택
- 업로드 진행 상황 확인

### 3. 대시보드 확인
- `/dashboard` 페이지에서 생산실적 현황 확인
- 날짜 범위 필터로 데이터 조회
- 차트로 시각적 분석

### 4. 데이터 조회
- `/data` 페이지에서 상세 데이터 조회
- 검색, 정렬, 페이지네이션 활용

## 라이선스

MIT

---

**개발**: Claude AI Assistant
**버전**: 1.0.0 (Phase 1 MVP)
**최종 업데이트**: 2026-01-28
