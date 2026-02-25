-- Tabella singleton per il profilo famiglia
-- Contiene le informazioni stabili da includere nel prompt di generazione del menu
CREATE TABLE IF NOT EXISTS public.family_profile (
  id text PRIMARY KEY DEFAULT 'default',
  profile_text text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Inserisce la riga di default (unica riga della tabella)
INSERT INTO public.family_profile (id, profile_text)
VALUES ('default', '')
ON CONFLICT (id) DO NOTHING;

-- RLS permissiva (come le altre tabelle del progetto - no auth ancora)
ALTER TABLE public.family_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on family_profile"
  ON public.family_profile
  FOR ALL
  USING (true)
  WITH CHECK (true);
