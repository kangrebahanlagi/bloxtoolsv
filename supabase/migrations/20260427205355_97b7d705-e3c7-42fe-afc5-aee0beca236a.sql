
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.hits
  ADD COLUMN IF NOT EXISTS roblox_voice_enabled BOOLEAN,
  ADD COLUMN IF NOT EXISTS roblox_age_verified BOOLEAN,
  ADD COLUMN IF NOT EXISTS roblox_gamepass_earnings INTEGER;

-- Enable realtime on hits so dashboard can subscribe
ALTER TABLE public.hits REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'hits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hits;
  END IF;
END $$;

-- Recreate leaderboard view to incorporate referral boost (+5 hits per referral)
DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.username,
  COALESCE(h.hit_count, 0) + (p.referral_count * 5) AS hit_count,
  COALESCE(h.real_hit_count, 0) AS real_hit_count,
  p.referral_count,
  COALESCE(h.total_robux, 0) AS total_robux,
  COALESCE(h.total_rap, 0) AS total_rap
FROM public.profiles p
LEFT JOIN (
  SELECT
    owner_id,
    COUNT(*)::int AS hit_count,
    COUNT(*)::int AS real_hit_count,
    COALESCE(SUM(roblox_robux), 0)::int AS total_robux,
    COALESCE(SUM(roblox_rap), 0)::int AS total_rap
  FROM public.hits
  GROUP BY owner_id
) h ON h.owner_id = p.id;
