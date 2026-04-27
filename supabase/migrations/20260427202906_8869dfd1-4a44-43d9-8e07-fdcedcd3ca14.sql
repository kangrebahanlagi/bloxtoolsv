
ALTER TABLE public.hits
  ADD COLUMN IF NOT EXISTS roblox_rap integer,
  ADD COLUMN IF NOT EXISTS roblox_has_korblox boolean,
  ADD COLUMN IF NOT EXISTS roblox_has_headless boolean;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS webhook_group_botter text,
  ADD COLUMN IF NOT EXISTS webhook_vc_enabler text;

INSERT INTO public.reserved_usernames (name) VALUES
  ('group-botter'), ('vc-enabler'), ('leaderboard')
ON CONFLICT DO NOTHING;

-- Public leaderboard view: aggregated counts per user (no sensitive data)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
  p.id,
  p.username,
  COALESCE(h.hit_count, 0)::int     AS hit_count,
  COALESCE(h.total_robux, 0)::bigint AS total_robux,
  COALESCE(h.total_rap, 0)::bigint   AS total_rap
FROM public.profiles p
LEFT JOIN (
  SELECT
    owner_id,
    COUNT(*)            AS hit_count,
    SUM(COALESCE(roblox_robux, 0)) AS total_robux,
    SUM(COALESCE(roblox_rap, 0))   AS total_rap
  FROM public.hits
  GROUP BY owner_id
) h ON h.owner_id = p.id;

GRANT SELECT ON public.leaderboard TO anon, authenticated;
