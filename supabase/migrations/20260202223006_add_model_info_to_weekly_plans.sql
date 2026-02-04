-- Migration to add model information to weekly_plans table
ALTER TABLE public.weekly_plans
ADD COLUMN IF NOT EXISTS model_name text NULL,
ADD COLUMN IF NOT EXISTS generation_prompt_version text NULL;
