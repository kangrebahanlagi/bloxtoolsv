
-- 1. Attach the handle_new_user trigger so signups generate a profile + key
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Attach username validation trigger to profiles
DROP TRIGGER IF EXISTS validate_profile_username ON public.profiles;
CREATE TRIGGER validate_profile_username
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_username();

-- 3. Attach updated_at trigger
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. Clean up orphan auth users (no matching profile row)
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
  AND email LIKE '%@users.local';

-- 5. Seed reserved usernames
INSERT INTO public.reserved_usernames (name) VALUES
  ('login'), ('signup'), ('dashboard'), ('tools'), ('faq'), ('contact'),
  ('bot-followers'), ('copy-games'), ('copy-clothes'),
  ('admin'), ('api'), ('assets'), ('register'), ('logout'), ('settings'),
  ('account'), ('profile'), ('hits'), ('webhooks'), ('subdomain'),
  ('about'), ('terms'), ('privacy'), ('home'), ('www'), ('app'),
  ('support'), ('help'), ('docs'), ('blog')
ON CONFLICT DO NOTHING;
