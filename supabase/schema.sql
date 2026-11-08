-- 中山資工備考網站：手寫筆跡雲端同步
-- 用法：Supabase 專案 → SQL Editor → New query，整段貼上，按 Run。重複執行也沒關係。

create table if not exists public.ink_pads (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  key        text        not null,                -- 「頁面:題目 id」，例如 discrete:q-u1-quiz-2
  t          bigint      not null,                -- 最後修改時間（瀏覽器的毫秒時間戳），同步時比較新舊
  deleted    boolean     not null default false,  -- 這一題的筆跡被清除了
  data       jsonb,                               -- 筆畫資料 { v, H, s, t }
  updated_at timestamptz not null default now(),  -- 伺服器收到的時間（只是紀錄）
  primary key (user_id, key)
);

-- 每個人只能讀寫自己的資料
alter table public.ink_pads enable row level security;

drop policy if exists "ink_pads_select_own" on public.ink_pads;
drop policy if exists "ink_pads_insert_own" on public.ink_pads;
drop policy if exists "ink_pads_update_own" on public.ink_pads;
drop policy if exists "ink_pads_delete_own" on public.ink_pads;

create policy "ink_pads_select_own" on public.ink_pads
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "ink_pads_insert_own" on public.ink_pads
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "ink_pads_update_own" on public.ink_pads
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ink_pads_delete_own" on public.ink_pads
  for delete to authenticated using ((select auth.uid()) = user_id);

-- 建專案時沒勾「Automatically expose new tables」也能用：這裡自己開權限給登入的使用者
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.ink_pads to authenticated;
revoke all on public.ink_pads from anon;

-- 每次更新自動記錄伺服器時間
create or replace function public.ink_pads_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists ink_pads_touch on public.ink_pads;
create trigger ink_pads_touch before update on public.ink_pads
  for each row execute function public.ink_pads_touch();

-- ============================================================
-- 讀書進度（每日行程打勾、休息日、考古題進度、小考紀錄）
-- key 例如 cgep:nsysu-cse-116:done、cgep:quiz:discrete；data 是那一項的 JSON
-- ============================================================
create table if not exists public.user_state (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  key        text        not null,
  t          bigint      not null,                -- 最後修改時間（瀏覽器的毫秒時間戳）
  data       jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_state enable row level security;

drop policy if exists "user_state_select_own" on public.user_state;
drop policy if exists "user_state_insert_own" on public.user_state;
drop policy if exists "user_state_update_own" on public.user_state;
drop policy if exists "user_state_delete_own" on public.user_state;

create policy "user_state_select_own" on public.user_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_state_insert_own" on public.user_state
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_state_update_own" on public.user_state
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_state_delete_own" on public.user_state
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_state to authenticated;
revoke all on public.user_state from anon;

drop trigger if exists user_state_touch on public.user_state;
create trigger user_state_touch before update on public.user_state
  for each row execute function public.ink_pads_touch();

-- ============================================================
-- 使用者自己刪除帳號：刪掉 auth.users 裡自己那一筆，ink_pads、user_state 會跟著刪除（on delete cascade）
-- 網頁上的「刪除帳號」按鈕呼叫這個函式。security definer：用建立者的權限執行，但只能刪 auth.uid() 自己。
-- ============================================================
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from public.ink_pads where user_id = auth.uid();
  delete from public.user_state where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
