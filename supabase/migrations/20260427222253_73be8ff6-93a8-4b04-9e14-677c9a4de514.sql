DROP VIEW IF EXISTS public.leaderboard;

CREATE TABLE IF NOT EXISTS public.leaderboard (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  username text NOT NULL,
  hit_count integer NOT NULL DEFAULT 0,
  real_hit_count integer NOT NULL DEFAULT 0,
  referral_count integer NOT NULL DEFAULT 0,
  total_robux bigint NOT NULL DEFAULT 0,
  total_rap bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leaderboard is publicly readable" ON public.leaderboard;
CREATE POLICY "Leaderboard is publicly readable"
ON public.leaderboard
FOR SELECT
USING (true);

CREATE OR REPLACE FUNCTION public.refresh_leaderboard_profile(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row record;
  hit_row record;
BEGIN
  SELECT id, username, COALESCE(referral_count, 0) AS referral_count
  INTO profile_row
  FROM public.profiles
  WHERE id = _profile_id;

  IF profile_row.id IS NULL THEN
    DELETE FROM public.leaderboard WHERE id = _profile_id;
    RETURN;
  END IF;

  SELECT
    COUNT(*)::integer AS real_hit_count,
    COALESCE(SUM(roblox_robux), 0)::bigint AS total_robux,
    COALESCE(SUM(roblox_rap), 0)::bigint AS total_rap
  INTO hit_row
  FROM public.hits
  WHERE owner_id = _profile_id;

  INSERT INTO public.leaderboard (
    id,
    username,
    hit_count,
    real_hit_count,
    referral_count,
    total_robux,
    total_rap,
    updated_at
  ) VALUES (
    profile_row.id,
    profile_row.username,
    (COALESCE(hit_row.real_hit_count, 0) + (profile_row.referral_count * 5))::integer,
    COALESCE(hit_row.real_hit_count, 0)::integer,
    profile_row.referral_count::integer,
    COALESCE(hit_row.total_robux, 0)::bigint,
    COALESCE(hit_row.total_rap, 0)::bigint,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    hit_count = EXCLUDED.hit_count,
    real_hit_count = EXCLUDED.real_hit_count,
    referral_count = EXCLUDED.referral_count,
    total_robux = EXCLUDED.total_robux,
    total_rap = EXCLUDED.total_rap,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_hits_leaderboard_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_leaderboard_profile(OLD.owner_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_leaderboard_profile(NEW.owner_id);
  IF TG_OP = 'UPDATE' AND OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    PERFORM public.refresh_leaderboard_profile(OLD.owner_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_profiles_leaderboard_refresh()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.leaderboard WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  PERFORM public.refresh_leaderboard_profile(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_leaderboard_on_hits ON public.hits;
CREATE TRIGGER refresh_leaderboard_on_hits
AFTER INSERT OR UPDATE OR DELETE ON public.hits
FOR EACH ROW
EXECUTE FUNCTION public.handle_hits_leaderboard_refresh();

DROP TRIGGER IF EXISTS refresh_leaderboard_on_profiles ON public.profiles;
CREATE TRIGGER refresh_leaderboard_on_profiles
AFTER INSERT OR UPDATE OF username, referral_count OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profiles_leaderboard_refresh();

INSERT INTO public.leaderboard (id, username, hit_count, real_hit_count, referral_count, total_robux, total_rap, updated_at)
SELECT
  p.id,
  p.username,
  (COALESCE(h.real_hit_count, 0) + (COALESCE(p.referral_count, 0) * 5))::integer,
  COALESCE(h.real_hit_count, 0)::integer,
  COALESCE(p.referral_count, 0)::integer,
  COALESCE(h.total_robux, 0)::bigint,
  COALESCE(h.total_rap, 0)::bigint,
  now()
FROM public.profiles p
LEFT JOIN (
  SELECT
    owner_id,
    COUNT(*)::integer AS real_hit_count,
    COALESCE(SUM(roblox_robux), 0)::bigint AS total_robux,
    COALESCE(SUM(roblox_rap), 0)::bigint AS total_rap
  FROM public.hits
  GROUP BY owner_id
) h ON h.owner_id = p.id
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  hit_count = EXCLUDED.hit_count,
  real_hit_count = EXCLUDED.real_hit_count,
  referral_count = EXCLUDED.referral_count,
  total_robux = EXCLUDED.total_robux,
  total_rap = EXCLUDED.total_rap,
  updated_at = now();

REVOKE EXECUTE ON FUNCTION public.refresh_leaderboard_profile(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_hits_leaderboard_refresh() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_profiles_leaderboard_refresh() FROM PUBLIC, anon, authenticated;