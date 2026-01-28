# Supabase 설정 가이드

## 1. Supabase 프로젝트 설정

### 데이터베이스 스키마 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인합니다.
2. 프로젝트를 선택합니다.
3. 왼쪽 메뉴에서 **SQL Editor**를 클릭합니다.
4. `supabase/schema.sql` 파일의 내용을 복사하여 SQL 에디터에 붙여넣습니다.
5. **Run** 버튼을 클릭하여 스키마를 생성합니다.

### API 키 확인

1. 왼쪽 메뉴에서 **Project Settings** > **API**를 클릭합니다.
2. **Project URL**과 **anon public** 키를 복사합니다.
3. `.env.local` 파일에 다음과 같이 설정합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 2. 인증 설정

### 이메일/비밀번호 인증 활성화

1. 왼쪽 메뉴에서 **Authentication** > **Providers**를 클릭합니다.
2. **Email** 프로바이더가 활성화되어 있는지 확인합니다.
3. 필요한 경우 **Confirm email** 옵션을 끌 수 있습니다 (개발 환경).

### 첫 번째 사용자 생성

1. **Authentication** > **Users**를 클릭합니다.
2. **Add user** > **Create new user**를 클릭합니다.
3. 이메일과 비밀번호를 입력하여 테스트 사용자를 생성합니다.

## 3. Row Level Security (RLS)

스키마에는 이미 RLS 정책이 포함되어 있습니다:

- **인증된 사용자만** 데이터를 조회, 추가, 수정, 삭제할 수 있습니다.
- **저장된 리포트**는 각 사용자가 자신의 것만 관리할 수 있습니다.

## 4. 데이터베이스 구조

### production_records (생산실적)

주요 필드:
- `id`: 기본 키
- `pid`: 생산 ID
- `product_code`, `product_name`: 품목 정보
- `width`, `height`: 크기 (mm)
- `quantity`: 수량
- `area_pyeong`: 평수
- `client`: 거래처
- `site`: 현장
- `order_number`: 의뢰번호
- `production_date`: 생산일
- `year`, `month`, `week`: 시간 차원

### clients (거래처 마스터)

거래처 정보를 관리합니다.

### products (품목 마스터)

품목 정보를 관리합니다.

### saved_reports (저장된 리포트)

사용자별 커스텀 리포트 설정을 저장합니다.

## 5. 성능 최적화

### 인덱스

주요 조회 필드에 인덱스가 생성되어 있습니다:
- production_date
- client
- order_number
- product_name
- site
- year, month
- year, week

### 추가 최적화 (옵션)

대용량 데이터의 경우 Materialized View를 활성화할 수 있습니다 (schema.sql 하단 주석 참조).

## 문제 해결

### 연결 오류

- `.env.local` 파일의 URL과 키가 정확한지 확인하세요.
- Supabase 프로젝트가 활성 상태인지 확인하세요.

### RLS 오류

- 사용자가 로그인되어 있는지 확인하세요.
- SQL Editor에서 RLS 정책이 올바르게 생성되었는지 확인하세요.
