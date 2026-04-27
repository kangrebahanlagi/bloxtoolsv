DROP INDEX IF EXISTS public.hits_owner_cookie_unique;

ALTER TABLE public.hits REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hits;
  END IF;
END $$;

DROP VIEW IF EXISTS public.leaderboard;
CREATE VIEW public.leaderboard
WITH (security_invoker = false)
AS
SELECT
  p.id,
  p.username,
  (COALESCE(h.hit_count, 0) + (COALESCE(p.referral_count, 0) * 5))::integer AS hit_count,
  COALESCE(h.real_hit_count, 0)::integer AS real_hit_count,
  COALESCE(p.referral_count, 0)::integer AS referral_count,
  COALESCE(h.total_robux, 0)::bigint AS total_robux,
  COALESCE(h.total_rap, 0)::bigint AS total_rap
FROM public.profiles p
LEFT JOIN (
  SELECT
    owner_id,
    COUNT(*)::integer AS hit_count,
    COUNT(*)::integer AS real_hit_count,
    COALESCE(SUM(roblox_robux), 0)::bigint AS total_robux,
    COALESCE(SUM(roblox_rap), 0)::bigint AS total_rap
  FROM public.hits
  GROUP BY owner_id
) h ON h.owner_id = p.id;

GRANT SELECT ON public.leaderboard TO anon, authenticated;