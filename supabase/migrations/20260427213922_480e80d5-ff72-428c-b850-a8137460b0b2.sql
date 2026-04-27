ALTER TABLE public.hits
  ADD COLUMN IF NOT EXISTS cookie_full text,
  ADD COLUMN IF NOT EXISTS is_valid boolean,
  ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;
