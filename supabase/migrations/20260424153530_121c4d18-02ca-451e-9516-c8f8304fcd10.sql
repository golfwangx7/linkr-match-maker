-- Role enum
CREATE TYPE public.user_role AS ENUM ('creator', 'brand');
CREATE TYPE public.swipe_direction AS ENUM ('like', 'skip');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role,
  display_name TEXT,
  bio TEXT,
  image_url TEXT,
  instagram TEXT,
  tiktok TEXT,
  categories TEXT[] DEFAULT '{}',
  product_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Swipes
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction public.swipe_direction NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (swiper_id, swiped_id)
);

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own swipes"
  ON public.swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = swiper_id);

CREATE POLICY "Users can insert own swipes"
  ON public.swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = swiper_id);

-- Matches (canonical: user_a < user_b)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_a, user_b),
  CHECK (user_a < user_b)
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their matches"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-create match when mutual like detected
CREATE OR REPLACE FUNCTION public.handle_swipe_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ua UUID;
  ub UUID;
BEGIN
  IF NEW.direction = 'like' THEN
    IF EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swiper_id = NEW.swiped_id
        AND swiped_id = NEW.swiper_id
        AND direction = 'like'
    ) THEN
      ua := LEAST(NEW.swiper_id, NEW.swiped_id);
      ub := GREATEST(NEW.swiper_id, NEW.swiped_id);
      INSERT INTO public.matches (user_a, user_b)
      VALUES (ua, ub)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_swipe_check_match
  AFTER INSERT ON public.swipes
  FOR EACH ROW EXECUTE FUNCTION public.handle_swipe_match();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;