CREATE POLICY "Users can delete own matches"
ON public.matches
FOR DELETE
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);