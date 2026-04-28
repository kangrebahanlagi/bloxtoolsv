ALTER TABLE public.hits
  ADD COLUMN IF NOT EXISTS roblox_pending_robux bigint,
  ADD COLUMN IF NOT EXISTS roblox_incoming_robux bigint;