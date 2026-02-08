-- Migration: add_seasons_to_recipes
-- Descrizione: Aggiunge il supporto per la stagionalità delle ricette

DO $$ BEGIN
    CREATE TYPE public.season AS ENUM ('Primavera', 'Estate', 'Autunno', 'Inverno');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS seasons public.season[] NOT NULL DEFAULT '{}';
