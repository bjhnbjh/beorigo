# 버리고(Beorigo) — React + TypeScript 마이그레이션 계획

> `beorigo-site.html`의 **현재 기능 그대로**를
> React + TypeScript + Supabase + Vercel로 옮기는 계획. (기능 추가 없음)

---

## 1. 옮길 기능 (HTML에 있는 것만)

1. 배경 별 파티클 (`stars`)
2. 헤더 (브랜드 / 타이틀 / 안내 문구)
3. 글 작성기 (`textarea`, 최대 400자)
4. 카테고리 단일 선택 — 감정·기분(emo) / 일·고민(work) / 불편·아쉬움(need)
5. 공개/비공개 토글 (🔒 조용히 버리기 / 🌙 공개로 버리기)
6. 버리기 → **공개일 때만** 피드 맨 위에 추가, afterglow 표시
7. 피드 목록 + 카테고리 필터 (전체/emo/work/need)
8. afterglow 오버레이 (랜덤 위로 메시지)
9. "내가 버린 것" 배지

> ※ 익명 작성(로그인 없음). "좋아요/공감" 같은 반응 기능은 **없음** —
> HTML에 있던 "🤍 나도 그래요" 버튼은 제거.

### 추가로 넣을 것 (실제 DB 연동 시 필요)
10. **도배 방지 쿨다운** — localStorage에 마지막 등록 시각 저장, N분(예: 3분) 내 재등록 차단.
11. **footer 보강** — 이용약관·개인정보처리방침 링크 + 문의/신고 이메일 + 자살예방상담 109 / 정신건강상담 1577-0199 상시 노출.
12. **상대시간 표시** — `created_at`(timestamptz) → "3분 전" 변환 (date-fns + ko locale).
13. **피드 상태 처리** — 로딩 / 에러 / 빈 상태("아직 버려진 마음이 없어요"), 최신 50개 LIMIT.

> ※ **욕설/금지어 필터는 두지 않음** — "마음을 버리는" 감정 토로 특성상 거친 표현이 자연스러움.
> 실제 광고 링크 도배가 보이면 그때 "URL 포함 글 차단" 한 줄만 추가.

---

## 2. 기술 스택

| 영역 | 선택 |
|------|------|
| 프레임워크 | Vite + React 18 + TypeScript |
| 라우팅 | react-router-dom (`/`, `/terms`, `/privacy`) |
| 스타일 | 기존 CSS 그대로 `index.css`로 이동 |
| DB | Supabase (Postgres) — 테이블 1개 |
| 배포 | Vercel (도메인은 `*.vercel.app` 그대로) |

---

## 3. 프로젝트 구조

```
beorigo/
├─ db/
│  └─ schema.sql          # Supabase 초기 셋업(테이블+인덱스+RLS) — SQL Editor에 1회 실행
├─ src/
│  ├─ components/
│  │  ├─ Stars.tsx        # 배경 파티클
│  │  ├─ Header.tsx
│  │  ├─ Composer.tsx     # textarea + 카테고리 + 공개토글 + 버리기 (+ 쿨다운)
│  │  ├─ Filters.tsx
│  │  ├─ Feed.tsx
│  │  ├─ FeedItem.tsx     # 글 1개 (텍스트/카테고리/시간/내가 버린 것)
│  │  ├─ Afterglow.tsx
│  │  └─ Footer.tsx       # 약관/처리방침 링크 + 문의 이메일 + 상담번호
│  ├─ pages/
│  │  ├─ Home.tsx         # 메인(헤더+컴포저+피드) = 기존 App 내용
│  │  ├─ Terms.tsx        # 이용약관 (/terms)
│  │  └─ Privacy.tsx      # 개인정보처리방침 (/privacy)
│  ├─ lib/
│  │  ├─ supabase.ts      # 클라이언트
│  │  ├─ time.ts          # created_at → "3분 전" (date-fns/ko)
│  │  ├─ cooldown.ts      # localStorage 등록 쿨다운
│  │  ├─ mine.ts          # localStorage "내가 버린 것" id 관리
│  │  └─ types.ts
│  ├─ App.tsx
│  ├─ main.tsx
│  └─ index.css           # 기존 <style> 이동
├─ .env.local             # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
├─ .gitignore             # .env* 포함
└─ index.html
```

### 타입 (src/lib/types.ts)
```ts
export type Category = 'emo' | 'work' | 'need';

export interface Toss {
  id: string;
  text: string;
  category: Category;
  created_at: string;
}
```

상태(React):
- `text` (작성 내용)
- `selCat: Category | null` (카테고리 선택)
- `isPublic: boolean` (공개 여부)
- `filter: 'all' | Category` (피드 필터)
- afterglow 표시 여부 / 메시지

---

## 4. Supabase — 테이블 1개

```sql
create table public.tosses (
  id          uuid primary key default gen_random_uuid(),
  text        text not null check (char_length(text) between 1 and 400),
  category    text not null check (category in ('emo','work','need')),
  created_at  timestamptz not null default now()
);

-- 공개 글만 저장(비공개는 DB에 안 넣음). 최신순 조회
create index tosses_created_idx on public.tosses (created_at desc);
```

> HTML 동작상 **비공개("조용히 버리기")는 어디에도 저장되지 않고** afterglow만 뜸.
> 그래서 DB에는 **공개 글만** 들어가고, `is_public` 컬럼도 필요 없음.

### "내가 버린 것" 배지
로그인이 없으므로, 글 등록 후 받은 `id`를 **localStorage**에 저장해두고
피드에서 그 id면 "내가 버린 것" 배지를 표시. (서버에 사용자 정보 저장 안 함)

### 게시물 삭제 (운영자)
- 삭제 UI/신고 테이블은 **만들지 않음**. 신고는 footer 이메일로 받음.
- 운영자가 **Supabase 대시보드에서 직접 삭제** → 대시보드는 `service_role`이라 RLS를 무시하고 바로 삭제됨.
- 따라서 `status` 컬럼·DELETE 정책·신고 기능 **불필요**. (법적 의무인 "신고→삭제 통로"는 이메일+대시보드로 충족)

---

## 5. 보안 — 꼭 필요한 것만 🔒

1. **RLS 켜기 (필수)** — 안 켜면 anon key로 테이블 전체가 노출됨.
   ```sql
   alter table public.tosses enable row level security;
   create policy "read"   on public.tosses for select using (true);
   create policy "insert" on public.tosses for insert with check (
     char_length(text) between 1 and 400
     and category in ('emo','work','need')
   );
   ```
2. **XSS** — React가 `{toss.text}`를 자동 이스케이프하므로 안전.
   `dangerouslySetInnerHTML` 쓰지 말 것. (기존 `escapeHtml` 불필요)
3. **키 관리** — `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`(publishable key)만 사용(공개돼도 RLS가 방어).
   `service_role` 키는 프론트에 넣지 말 것. `.env*`는 `.gitignore`에.
4. 길이/카테고리 검증은 위 RLS `with check` + 클라이언트 양쪽에서.
5. **도배 방지(쿨다운)** — localStorage에 마지막 등록 시각 저장, N분 내 재등록 차단.
   - 익명 유지를 위해 IP를 저장하지 않는 클라이언트 방식. localStorage 삭제로 우회 가능하나 MVP엔 충분.
   - 실제 봇 도배 발생 시 Cloudflare Turnstile(무료 캡차) 또는 Supabase Edge Function 도입.
6. **욕설/금지어 필터 — 두지 않음**(감정 토로 특성). 광고 스팸 보이면 "URL 포함 글 차단" 추가.

---

## 6. 구현 단계

- [ ] 1. `npm create vite@latest beorigo -- --template react-ts`
- [ ] 2. 기존 `<style>` → `index.css`, HTML 구조 → 컴포넌트로 분해
- [ ] 3. 우선 더미 `feedData`로 HTML과 똑같이 동작 확인
- [ ] 4. Supabase 프로젝트 생성 → 위 테이블/RLS 적용
- [ ] 5. 피드 조회 / 글 등록 연결
- [ ] 6. GitHub → Vercel 배포 (`*.vercel.app`)

---

## 7. Vercel 배포

1. GitHub repo 푸시 (`.env*` 제외 확인)
2. Vercel → New Project → import
3. 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Build `npm run build`, Output `dist` (Vite 자동 감지)
5. 발급된 `프로젝트명.vercel.app` 그대로 사용

---

## 8. 법적 / 컴플라이언스 체크리스트 ⚖️

> ⚠️ 본인은 변호사가 아니며 아래는 실무 참고용입니다.
> 정식 공개 전 **법률 전문가 검토** 권장.

### 8-1. 꼭 만들어야 할 문서 (사이트에 게시)
- [ ] **이용약관** — 서비스 성격, 금지 게시물, 운영자 책임 한계, 게시물 삭제 권한.
- [ ] **개인정보처리방침** — 수집 항목/목적/보관기간/파기/문의처. (아래 8-2 때문에 필수)
- [ ] **운영자/문의 연락처** — 신고·삭제요청 받을 이메일 등.

### 8-2. 개인정보보호법(PIPA) — "익명"이어도 주의
- 글 본문에 개인정보를 안 받아도, **IP·접속로그·localStorage 식별값**을 처리하면 개인정보 처리에 해당할 수 있음.
- **대응:** IP 등 식별정보를 가능한 한 **수집·저장하지 않기**. 꼭 필요하면(스팸차단 등) 보관기간·목적을 처리방침에 명시.
- 글 작성 시 사용자가 **실명·연락처 등 개인정보를 적지 않도록 안내 문구** 추가.

### 8-3. 데이터 국외이전 (Supabase = 해외 서버)
- Supabase 기본 리전은 해외(미국 등) → 개인정보를 저장하면 **국외이전**에 해당.
- **대응 1:** Supabase 프로젝트 리전을 **서울(ap-northeast-2)** 로 생성하면 부담 완화.
- **대응 2:** 그래도 처리방침에 **처리위탁/국외이전 사실(업체·국가·항목)** 고지.

### 8-4. 정보통신망법 — 게시판 운영자 의무
- 타인 권리침해(명예훼손 등) 게시물에 대한 **신고·삭제(임시조치) 절차** 마련.
- **대응:** 각 글에 "신고" 기능 또는 신고용 이메일 안내 + 신고 시 신속 삭제 정책.

### 8-5. 불법·유해정보 모더레이션
- 공개 게시판이라 욕설·명예훼손·음란물·광고스팸·**자해/자살 조장** 글이 올라올 수 있음.
- **대응:** 욕설/금지어 필터 + 신고 기반 삭제 + (선택) 등록 전 검수.

### 8-6. 자살예방 안내 (서비스 성격상 권장)
- "마음을 버린다"는 컨셉상 우울·자해·극단적 표현이 등장할 가능성 높음.
- **대응:** 푸터/작성창에 **상담 안내**(예: 자살예방상담 109, 정신건강상담 1577-0199) 상시 노출.
- 위험 키워드 감지 시 상담 배너를 띄우는 것도 고려.

### 8-7. 쿠키/저장소
- localStorage를 **순수 기능용("내가 버린 것" 표시)** 으로만 쓰면 동의 부담 낮음.
- 광고·분석(GA 등) 추가 시 **쿠키 동의 배너** 검토.

### 8-8. 청소년 보호
- 누구나 접근 가능하므로 유해정보 차단/신고 체계 + 처리방침에 보호 조치 기재.

### 8-9. 면책·저작권
- 게시물 책임은 작성자에게 있음을 약관에 명시.
- 타 폰트/이미지 라이선스 확인 (현재 Google Fonts는 OFL/Apache로 사용 가능).

---

## 9. 데이터 연동 / UX 디테일 🔌

> 원본 HTML은 더미 데이터라 안 보이지만, 실제 Supabase 연동 시 필요한 것들.

### 9-1. 피드 조회
```ts
const { data, error } = await supabase
  .from('tosses')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(50);              // 최신 50개만. 더 필요하면 '더보기'로 range 페이지네이션
```
- **상태 분기:** 로딩(스피너) / 에러(토스트) / 빈 상태("아직 버려진 마음이 없어요").

### 9-2. 글 등록 (공개일 때만)
```ts
const { data, error } = await supabase
  .from('tosses')
  .insert({ text, category })
  .select('id')
  .single();
// 성공 시: data.id를 localStorage "mine"에 추가 → "내가 버린 것" 배지
// 피드에 낙관적 추가(unshift) 또는 재조회
```
- 비공개("조용히 버리기")는 **DB insert 없이 afterglow만** (원본 동작 그대로).

### 9-3. 상대시간 (src/lib/time.ts)
```ts
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
export const ago = (iso: string) =>
  formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ko }); // "3분 전"
```

### 9-4. 쿨다운 (src/lib/cooldown.ts)
```ts
const KEY = 'beorigo:lastToss';
const COOLDOWN_MS = 3 * 60 * 1000;            // 3분
export const canToss = () =>
  Date.now() - Number(localStorage.getItem(KEY) ?? 0) > COOLDOWN_MS;
export const markTossed = () =>
  localStorage.setItem(KEY, String(Date.now()));
// 쿨다운 중이면 버리기 버튼 비활성화 + "잠시 후 다시 버려주세요" 안내
```

---

## 10. 법적 문서 배치 ⚖️📄

> 프로젝트 일관성을 위해 **React 페이지 + react-router-dom** 으로 처리.
> `/terms`, `/privacy` 라우트 → 공유 가능한 URL + SEO 노출.

### 10-1. 파일 & 링크
- `src/pages/Terms.tsx`(/terms), `src/pages/Privacy.tsx`(/privacy).
- `main.tsx`에 `<BrowserRouter>`, `App.tsx`에 `<Routes>` (`/`=Home, `/terms`, `/privacy`).
- **Footer.tsx** 에서 `<Link>` 로 연결 (원본의 한 줄 footer를 교체):
  ```tsx
  <Link to="/terms">이용약관</Link> · <Link to="/privacy">개인정보처리방침</Link>
  · 문의/신고: <a href="mailto:pok2026003@gmail.com">pok2026003@gmail.com</a>
  // 아래: 자살예방상담 109 · 정신건강상담 1577-0199 상시 노출
  ```
- Vercel SPA라우팅: `vercel.json`에 rewrite(`/* → /index.html`) 추가해야 `/terms` 직접 진입 시 404 방지.

### 10-2. 개인정보처리방침 — 필수 기재(개인정보보호법 제30조)
> "익명"이어도 Vercel·Supabase가 **IP·접속로그**를 자동 수집 → 처리방침 **의무**.

1. 처리 목적
2. 처리 항목 (접속 IP, 쿠키/localStorage 식별값, 접속 로그)
3. 보유·이용 기간 및 **파기 절차/방법**
4. 제3자 제공 (없으면 "없음")
5. **처리위탁 / 국외이전** ← 핵심: **Supabase, Vercel**(미국 등)에 위탁·국외이전 → 수탁사·업무·국가·항목·시점·방법 고지
6. 정보주체 권리·행사 방법
7. **개인정보 보호책임자** 성명·연락처 (← 실제 이메일 필요)
8. 안전성 확보조치 / 9. 쿠키 등 자동수집장치 거부방법 / 10. 권익침해 구제방법(분쟁조정위 등)

> 💡 Supabase 리전을 **서울(ap-northeast-2)** 로 만들면 국외이전 항목을 줄일 수 있음(Vercel은 미국이라 고지 여전히 필요).

### 10-3. 이용약관 — 핵심 조항
- 목적·정의, 서비스 내용/변경/중단
- **게시물 책임은 작성자에게** 귀속(면책)
- 금지행위: 명예훼손·음란·광고스팸·자해/자살 조장 등
- **게시물 삭제·임시조치 권한 + 신고 절차**(정보통신망법 제44조의2)
- 면책조항, 준거법·관할

> ⚠️ 신고된 명예훼손·사생활침해 게시물을 정당한 사유 없이 방치하면 **방조 책임** 가능 → footer 신고 이메일 + 대시보드 수동삭제 통로가 운영자 면책의 전제.
> ⚠️ 본인은 변호사가 아니며 위는 실무 참고용. 정식 공개 전 법률 전문가 검토 권장.
