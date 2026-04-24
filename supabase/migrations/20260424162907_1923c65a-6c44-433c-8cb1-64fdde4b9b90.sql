ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS last_read_a timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_read_b timestamptz NOT NULL DEFAULT now();

DROP POLICY IF EXISTS "Users can update read state on own matches" ON public.matches;
CREATE POLICY "Users can update read state on own matches"
ON public.matches
FOR UPDATE
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b)
WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);