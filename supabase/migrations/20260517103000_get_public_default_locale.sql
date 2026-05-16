-- Allow anon/authenticated callers to read shop default UI locale without exposing
-- other system_settings columns via the Data API.
CREATE OR REPLACE FUNCTION public.get_public_default_locale()
RETURNS public.locale_code
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT default_locale FROM public.system_settings WHERE id = 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_default_locale() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_default_locale() TO anon, authenticated;
