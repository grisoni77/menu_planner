-- Migrazione: add_auth
-- Aggiunge user_id a tutte le tabelle e sostituisce le policy dev con policy user-scoped

-- ===========================
-- 1. Aggiunge colonne user_id
-- ===========================
ALTER TABLE public.pantry_items
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.weekly_plans
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.family_profile
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Indice unique su family_profile.user_id (una riga per utente)
CREATE UNIQUE INDEX IF NOT EXISTS family_profile_user_id_key
  ON public.family_profile(user_id);

-- ===========================
-- 2. pantry_items: policy user-scoped
-- ===========================
DROP POLICY IF EXISTS "dev_pantry_items_select" ON public.pantry_items;
DROP POLICY IF EXISTS "dev_pantry_items_insert" ON public.pantry_items;
DROP POLICY IF EXISTS "dev_pantry_items_update" ON public.pantry_items;
DROP POLICY IF EXISTS "dev_pantry_items_delete" ON public.pantry_items;

CREATE POLICY "pantry_items_user" ON public.pantry_items
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================
-- 3. recipes: policy user-scoped
-- ===========================
DROP POLICY IF EXISTS "dev_recipes_select" ON public.recipes;
DROP POLICY IF EXISTS "dev_recipes_insert" ON public.recipes;
DROP POLICY IF EXISTS "dev_recipes_update" ON public.recipes;
DROP POLICY IF EXISTS "dev_recipes_delete" ON public.recipes;

CREATE POLICY "recipes_user" ON public.recipes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================
-- 4. weekly_plans: policy user-scoped
-- ===========================
DROP POLICY IF EXISTS "dev_weekly_plans_select" ON public.weekly_plans;
DROP POLICY IF EXISTS "dev_weekly_plans_insert" ON public.weekly_plans;
DROP POLICY IF EXISTS "dev_weekly_plans_update" ON public.weekly_plans;
DROP POLICY IF EXISTS "dev_weekly_plans_delete" ON public.weekly_plans;

CREATE POLICY "weekly_plans_user" ON public.weekly_plans
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================
-- 5. family_profile: policy user-scoped
-- ===========================
DROP POLICY IF EXISTS "Allow all operations on family_profile" ON public.family_profile;

CREATE POLICY "family_profile_user" ON public.family_profile
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
