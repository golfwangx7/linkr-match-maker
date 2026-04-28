CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  default_name TEXT;
BEGIN
  -- Apple may not share email or name. Derive a safe default display_name
  -- so the profile insert always succeeds and the user can complete onboarding.
  default_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    NULLIF(
      TRIM(
        COALESCE(NEW.raw_user_meta_data->'name'->>'firstName', '') || ' ' ||
        COALESCE(NEW.raw_user_meta_data->'name'->>'lastName', '')
      ),
      ''
    ),
    'User'
  );

  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, default_name)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth signup because profile insert failed.
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists (it may have been dropped at some point).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();