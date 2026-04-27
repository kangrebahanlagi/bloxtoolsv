-- Remove duplicates: keep the newest hit per (owner_id, cookie_preview)
DELETE FROM public.hits a
USING public.hits b
WHERE a.owner_id = b.owner_id
  AND a.cookie_preview = b.cookie_preview
  AND a.cookie_preview IS NOT NULL
  AND a.created_at < b.created_at;

-- Prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS hits_owner_cookie_unique
  ON public.hits (owner_id, cookie_preview)
  WHERE cookie_preview IS NOT NULL;
