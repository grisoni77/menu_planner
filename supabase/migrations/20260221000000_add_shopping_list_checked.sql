ALTER TABLE public.weekly_plans
ADD COLUMN IF NOT EXISTS shopping_list_checked text[] NOT NULL DEFAULT '{}';
