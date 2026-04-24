CREATE POLICY "Users can view incoming swipes"
ON public.swipes
FOR SELECT
TO authenticated
USING (auth.uid() = swiped_id);