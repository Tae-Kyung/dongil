# Vercel 배포 가이드

## 사전 준비사항

### 1. GitHub 저장소 생성

1. [GitHub](https://github.com)에 로그인
2. 새 저장소 생성
   - 저장소 이름: `dongil-analytics` (또는 원하는 이름)
   - Private 또는 Public 선택
3. 로컬 코드를 GitHub에 푸시

```bash
cd app
git init
git add .
git commit -m "Initial commit: 동일유리 생산실적 분석 시스템"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dongil-analytics.git
git push -u origin main
```

### 2. Supabase 프로젝트 확인

배포 전에 Supabase 설정이 완료되어 있어야 합니다:
- ✅ 프로젝트 생성 완료
- ✅ 데이터베이스 스키마 실행 완료
- ✅ URL 및 API 키 확보

---

## Vercel 배포 단계

### Step 1: Vercel 계정 생성

1. [Vercel](https://vercel.com)에 접속
2. GitHub 계정으로 로그인

### Step 2: 프로젝트 임포트

1. Vercel 대시보드에서 **"Add New Project"** 클릭
2. GitHub 저장소 선택
   - `dongil-analytics` 저장소를 찾아 **"Import"** 클릭
3. 프로젝트 설정
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Root Directory**: `app` (중요!)
   - **Build Command**: `pnpm build` (자동 설정됨)
   - **Output Directory**: `.next` (자동 설정됨)

### Step 3: 환경변수 설정

**Environment Variables** 섹션에서 다음 변수를 추가:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**중요**:
- Supabase Dashboard > Project Settings > API에서 값 복사
- **Production**, **Preview**, **Development** 모두 체크

### Step 4: 배포

1. **"Deploy"** 버튼 클릭
2. 배포 진행 상황 확인 (약 2-3분 소요)
3. 배포 완료 후 URL 확인
   - 예: `https://dongil-analytics.vercel.app`

---

## 배포 후 확인 사항

### 1. 사이트 접속 테스트

- [ ] 홈페이지 접속 확인
- [ ] 로그인 페이지 접속 (`/login`)
- [ ] 로그인 기능 테스트

### 2. 기능 테스트

- [ ] 대시보드 데이터 로딩 확인
- [ ] 데이터 그리드 페이지 확인
- [ ] CSV 파일 업로드 테스트

### 3. 성능 확인

- [ ] 초기 로딩 속도 (Lighthouse 점수)
- [ ] 차트 렌더링 속도
- [ ] 검색 및 필터링 반응 속도

---

## 자동 배포 설정

Vercel은 GitHub와 연동되어 자동 배포를 지원합니다:

### Production 배포
- `main` 브랜치에 푸시할 때마다 자동 배포
- URL: `https://your-project.vercel.app`

### Preview 배포
- Pull Request 생성 시 미리보기 배포
- URL: `https://your-project-git-branch-name.vercel.app`

---

## 커스텀 도메인 설정 (선택사항)

### 1. 도메인 추가

1. Vercel 프로젝트 > **Settings** > **Domains**
2. 도메인 입력 (예: `analytics.dongil.com`)
3. DNS 설정 안내 확인

### 2. DNS 설정

도메인 등록업체에서 다음 레코드 추가:

**A 레코드**:
```
Type: A
Name: @ (또는 서브도메인)
Value: 76.76.21.21
```

**CNAME 레코드**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL 인증서

- Vercel이 자동으로 Let's Encrypt SSL 인증서 발급
- 약 10-20분 소요

---

## 환경별 설정

### Development (로컬)
- `.env.local` 파일 사용
- `pnpm dev`로 실행

### Preview (미리보기)
- Vercel 환경변수 사용
- Pull Request마다 자동 배포

### Production (프로덕션)
- Vercel 환경변수 사용
- `main` 브랜치 자동 배포

---

## 문제 해결

### 배포 실패 시

1. **Build 로그 확인**
   - Vercel 대시보드 > Deployments > 실패한 배포 클릭
   - 로그에서 오류 메시지 확인

2. **흔한 오류**
   - `Root Directory` 설정 확인 (`app`으로 설정해야 함)
   - 환경변수 누락 확인
   - `package.json`의 build 명령어 확인

### 환경변수 변경 후

1. Vercel 대시보드 > Settings > Environment Variables
2. 값 수정 후 **Save**
3. 새로 배포하거나 **Redeploy** 버튼 클릭

### 로그인 문제

1. Supabase Dashboard > Authentication > URL Configuration
2. **Site URL**에 Vercel 배포 URL 추가
3. **Redirect URLs**에 다음 추가:
   - `https://your-project.vercel.app/auth/callback`
   - `https://your-custom-domain.com/auth/callback` (커스텀 도메인 사용 시)

---

## 성능 최적화 팁

### 1. 이미지 최적화
- Next.js Image 컴포넌트 사용

### 2. 캐싱 전략
- React Query의 `staleTime` 조정
- Supabase 쿼리 최적화

### 3. 번들 크기 최적화
- 불필요한 라이브러리 제거
- 코드 스플리팅 활용

---

## 모니터링

### Vercel Analytics
1. Vercel 대시보드 > **Analytics** 탭
2. 페이지 뷰, 성능 지표 확인

### Vercel Speed Insights
1. **Speed Insights** 활성화
2. 실제 사용자 성능 데이터 확인

---

## 추가 리소스

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Auth with Vercel](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

**배포 완료 후 이 문서의 체크리스트를 확인하세요!**
