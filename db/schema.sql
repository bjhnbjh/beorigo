-- ============================================================
-- 버리고(Beorigo) — Supabase 초기 DB 셋업
-- ------------------------------------------------------------
-- 사용법:
--   1) Supabase 프로젝트 생성 (리전: Seoul / ap-northeast-2 권장)
--   2) 좌측 메뉴 → SQL Editor → New query
--   3) 이 파일 전체를 붙여넣고 Run
--   * 다시 실행해도 안전하도록 작성됨 (if not exists / drop policy)
-- ============================================================

-- ------------------------------------------------------------
-- 1. 테이블: 공개·비공개 글 모두 저장
--    is_public = true  → 공개 피드에 노출
--    is_public = false → DB에 저장만 (RLS상 anon은 조회 불가, 본인 보관용)
-- ------------------------------------------------------------
create table if not exists public.tosses (
  id          uuid        primary key default gen_random_uuid(),
  text        text        not null check (char_length(text) between 1 and 400),
  category    text        not null check (category in ('emo','work','need')),
  is_public   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- 기존 테이블에 컬럼이 없으면 추가 (이미 운영 중인 DB용)
--   기존 행들은 모두 공개 글이었으므로 default true로 백필됨
alter table public.tosses
  add column if not exists is_public boolean not null default true;

-- 최신순 조회용 인덱스 (피드: created_at desc limit 50)
create index if not exists tosses_created_idx
  on public.tosses (created_at desc);

-- ------------------------------------------------------------
-- 2. RLS (Row Level Security) — 필수
--    안 켜면 anon key로 테이블 전체가 노출/조작됨
-- ------------------------------------------------------------
alter table public.tosses enable row level security;

-- 읽기: 공개 글만 누구나 조회 가능 (비공개 글은 anon에게 보이지 않음)
drop policy if exists "tosses_read" on public.tosses;
create policy "tosses_read"
  on public.tosses
  for select
  using (is_public = true);

-- 쓰기: 누구나 가능하되, 길이/카테고리 조건을 만족할 때만
drop policy if exists "tosses_insert" on public.tosses;
create policy "tosses_insert"
  on public.tosses
  for insert
  with check (
    char_length(text) between 1 and 400
    and category in ('emo','work','need')
  );

-- update / delete 정책은 만들지 않음
--   → anon key로는 수정·삭제 불가 (기본 거부)
--   → 운영자 삭제는 Supabase 대시보드(Table Editor)에서 직접 수행
--     (대시보드는 service_role이라 RLS를 우회하여 삭제 가능)

-- ------------------------------------------------------------
-- 3. 테이블 권한(GRANT) — 필수
--    RLS 정책이 있어도 역할(anon)에 테이블 GRANT가 없으면
--    "permission denied for table tosses" (42501) 에러가 남.
--    SQL Editor로 테이블을 직접 만들면 자동 GRANT가 빠질 수 있어 명시.
-- ------------------------------------------------------------
grant select, insert on public.tosses to anon, authenticated;

-- ============================================================
-- 끝. 이후 .env(또는 .env.local) 에 아래 두 값을 채우면 앱이 자동 연결됩니다.
--   NEXT_PUBLIC_SUPABASE_URL=...              (Project Settings → API → Project URL)
--   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...  (Project Settings → API → publishable key)
-- ============================================================

-- 이거 비공개 글도 db에 저장하는 방식
-- 1) is_public 컬럼 추가 (기존 공개 글은 default true로 백필)
alter table public.tosses
  add column if not exists is_public boolean not null default true;

-- 2) 읽기 정책: 공개 글만 노출되도록 변경
drop policy if exists "tosses_read" on public.tosses;
create policy "tosses_read"
  on public.tosses
  for select
  using (is_public = true);