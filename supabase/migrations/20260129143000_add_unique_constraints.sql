-- Aggiungi vincolo UNIQUE alla tabella recipes
ALTER TABLE public.recipes ADD CONSTRAINT recipes_name_unique UNIQUE (name);

-- Aggiungi vincolo UNIQUE alla tabella pantry_items
ALTER TABLE public.pantry_items ADD CONSTRAINT pantry_items_name_unique UNIQUE (name);
