-- 페이체크 DB 스키마. Supabase 대시보드 → SQL Editor에 붙여 넣고 실행한다.
-- 로그인한 사용자가 점검한 결과만 저장한다. 사진은 저장하지 않는다.

create table if not exists public.check_results (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,                      -- "kakao:12345" (lib/session.ts의 SessionUser.id)
  created_at timestamptz not null default now(),
  rules_version text not null,                -- 판정 기준 버전 (rules/version.ts)
  contract jsonb not null,                    -- 사용자가 확인한 계약 내용. 근거 문장(evidence)은 빼고 저장
  weekly_hours numeric,                       -- 스케줄 근무일 때 입력한 주 근로시간
  minor boolean not null default false,       -- 18세 미만 여부
  result jsonb not null                       -- 판정 결과 (CheckResult)
);

create index if not exists check_results_user_created
  on public.check_results (user_id, created_at desc);

-- 브라우저에서 바로 읽고 쓰지 못하게 막는다. 정책을 만들지 않으면 서버의 비밀 키로만 접근할 수 있다.
alter table public.check_results enable row level security;
