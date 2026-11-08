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
