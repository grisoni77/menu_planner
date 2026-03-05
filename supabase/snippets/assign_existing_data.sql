-- Snippet: assign_existing_data
-- Da eseguire UNA SOLA VOLTA dal SQL Editor del dashboard Supabase
-- dopo aver creato il primo utente admin.
--
-- Trovare l'UUID in: Authentication > Users
-- Sostituire '<USER_UUID>' con l'UUID reale (es. 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')

DO $$
DECLARE
  target_user_id uuid := '715ae415-5bb6-4096-9895-9b4d181e7922';
BEGIN
  UPDATE public.pantry_items  SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE public.recipes        SET user_id = target_user_id WHERE user_id IS NULL;
  UPDATE public.weekly_plans   SET user_id = target_user_id WHERE user_id IS NULL;

  -- family_profile: aggiorna anche id (usato come chiave di upsert)
  UPDATE public.family_profile
    SET user_id = target_user_id, id = target_user_id::text
    WHERE user_id IS NULL;
END $$;
