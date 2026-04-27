ALTER TABLE public.leaderboard REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'leaderboard'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;
  END IF;
END $$;