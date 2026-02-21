-- Migrazione: add_shopping_list_checked
-- Aggiunge colonna per tracciare gli articoli della lista della spesa già acquistati
-- Utilizzata dall'app Android per persistere lo stato di spunta degli articoli

ALTER TABLE public.weekly_plans
ADD COLUMN IF NOT EXISTS shopping_list_checked text[] NOT NULL DEFAULT '{}';
