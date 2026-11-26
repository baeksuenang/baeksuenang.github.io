-- 방명록 테이블. Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 Run.
-- 누구나(로그인 없이) 읽기·쓰기만 가능하고, 수정·삭제는 대시보드에서 본인만 가능.

create table if not exists public.guestbook (
  id bigint generated always as identity primary key,
  name text not null check (char_length(btrim(name)) between 1 and 20),
  message text not null check (char_length(btrim(message)) between 1 and 200),
  created_at timestamptz not null default now()
);

alter table public.guestbook enable row level security;

-- 읽기: 누구나
drop policy if exists "guestbook read" on public.guestbook;
create policy "guestbook read" on public.guestbook
  for select to anon using (true);

-- 쓰기: 누구나, 단 이름 1~20자 / 메시지 1~200자
drop policy if exists "guestbook write" on public.guestbook;
create policy "guestbook write" on public.guestbook
  for insert to anon
  with check (char_length(btrim(name)) between 1 and 20
          and char_length(btrim(message)) between 1 and 200);

-- 방문자는 name, message 두 칸만 넣을 수 있음 (작성 시간 조작 방지)
revoke all on public.guestbook from anon;
grant select on public.guestbook to anon;
grant insert (name, message) on public.guestbook to anon;

-- 도배 방지: 1분에 전체 10개까지만 (넘으면 잠시 뒤 다시 시도)
create or replace function public.guestbook_throttle() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.guestbook where created_at > now() - interval '1 minute') >= 10 then
    raise exception 'Too many messages right now. Please try again in a minute.';
  end if;
  return new;
end $$;

drop trigger if exists guestbook_throttle on public.guestbook;
create trigger guestbook_throttle before insert on public.guestbook
  for each row execute function public.guestbook_throttle();
