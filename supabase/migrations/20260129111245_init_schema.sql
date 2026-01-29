-- Migrazione: init_schema
-- Crea tabelle: pantry_items, recipes, weekly_plans

-- Estensione per gen_random_uuid()
create extension if not exists "pgcrypto";

-- =========================
-- pantry_items
-- =========================
create table if not exists public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity text null,
  category text null,
  created_at timestamptz not null default now()
);

-- =========================
-- recipes
-- =========================
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ingredients jsonb not null,
  tags text[] null,
  created_at timestamptz not null default now()
);

-- =========================
-- weekly_plans
-- =========================
create table if not exists public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  menu_data jsonb not null,
  shopping_list jsonb not null
);

-- =========================
-- RLS (permissivo in dev)
-- =========================
alter table public.pantry_items enable row level security;
alter table public.recipes enable row level security;
alter table public.weekly_plans enable row level security;

-- Pantry items policies
drop policy if exists "dev_pantry_items_select" on public.pantry_items;
drop policy if exists "dev_pantry_items_insert" on public.pantry_items;
drop policy if exists "dev_pantry_items_update" on public.pantry_items;
drop policy if exists "dev_pantry_items_delete" on public.pantry_items;

create policy "dev_pantry_items_select"
on public.pantry_items for select
to public
using (true);

create policy "dev_pantry_items_insert"
on public.pantry_items for insert
to public
with check (true);

create policy "dev_pantry_items_update"
on public.pantry_items for update
to public
using (true)
with check (true);

create policy "dev_pantry_items_delete"
on public.pantry_items for delete
to public
using (true);

-- Recipes policies
drop policy if exists "dev_recipes_select" on public.recipes;
drop policy if exists "dev_recipes_insert" on public.recipes;
drop policy if exists "dev_recipes_update" on public.recipes;
drop policy if exists "dev_recipes_delete" on public.recipes;

create policy "dev_recipes_select"
on public.recipes for select
to public
using (true);

create policy "dev_recipes_insert"
on public.recipes for insert
to public
with check (true);

create policy "dev_recipes_update"
on public.recipes for update
to public
using (true)
with check (true);

create policy "dev_recipes_delete"
on public.recipes for delete
to public
using (true);

-- Weekly plans policies
drop policy if exists "dev_weekly_plans_select" on public.weekly_plans;
drop policy if exists "dev_weekly_plans_insert" on public.weekly_plans;
drop policy if exists "dev_weekly_plans_update" on public.weekly_plans;
drop policy if exists "dev_weekly_plans_delete" on public.weekly_plans;

create policy "dev_weekly_plans_select"
on public.weekly_plans for select
to public
using (true);

create policy "dev_weekly_plans_insert"
on public.weekly_plans for insert
to public
with check (true);

create policy "dev_weekly_plans_update"
on public.weekly_plans for update
to public
using (true)
with check (true);

create policy "dev_weekly_plans_delete"
on public.weekly_plans for delete
to public
using (true);