-- Set search_path on validate_username and update_updated_at
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username !~ '^[a-z0-9_-]{3,30}$' THEN
    RAISE EXCEPTION 'Invalid username. Use 3-30 lowercase letters, numbers, hyphens, or underscores.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Revoke execute on SECURITY DEFINER functions from anon/authenticated (only triggers should call them)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.validate_username() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM anon, authenticated, public;