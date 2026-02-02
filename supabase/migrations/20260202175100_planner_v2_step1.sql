-- Migration for Planner v2 Step 1: DB Foundations

-- 1. Create enums
DO $$ BEGIN
    CREATE TYPE public.nutritional_class AS ENUM ('veg', 'carbs', 'protein');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.recipe_role AS ENUM ('main', 'side');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.recipe_source AS ENUM ('user', 'ai');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Alter recipes table
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS nutritional_classes nutritional_class[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS meal_role recipe_role NOT NULL DEFAULT 'main',
ADD COLUMN IF NOT EXISTS source recipe_source NOT NULL DEFAULT 'user',
ADD COLUMN IF NOT EXISTS generated_at timestamptz NULL,
ADD COLUMN IF NOT EXISTS model_name text NULL,
ADD COLUMN IF NOT EXISTS generation_prompt_version text NULL;

-- 3. Alter weekly_plans table
ALTER TABLE public.weekly_plans
ADD COLUMN IF NOT EXISTS family_profile_text text NULL;
