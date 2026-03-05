-- Migrazione: user_id NOT NULL
-- Rende user_id obbligatorio su tutte le tabelle dopo il backfill iniziale.
-- Righe orfane (user_id IS NULL) vengono eliminate prima del vincolo.

DELETE FROM public.pantry_items WHERE user_id IS NULL;
DELETE FROM public.recipes WHERE user_id IS NULL;
DELETE FROM public.weekly_plans WHERE user_id IS NULL;
DELETE FROM public.family_profile WHERE user_id IS NULL;

ALTER TABLE public.pantry_items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.recipes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.weekly_plans ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.family_profile ALTER COLUMN user_id SET NOT NULL;
