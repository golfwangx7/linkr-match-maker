DO $$
DECLARE
  v_id uuid;
  rec record;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('demo-brand-lumen@linkr.demo',   'Lumen Skincare',   'brand',   'Female', 'United States',
        'Clean, science-backed skincare for sensitive skin. Looking for honest UGC creators to showcase our new Glow Serum launch.',
        'Glow Serum — vitamin C + niacinamide, free product + paid post for selected creators.',
        ARRAY['Beauty']::text[],
        ARRAY['UGC Creators','Paid collaborations']::text[],
        '@lumenskincare', null,
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop'),
      ('demo-brand-pulsefit@linkr.demo','PulseFit Apparel', 'brand',   'Male',   'United Kingdom',
        'Performance gym wear designed in London. Seeking fitness creators for our spring drop campaign.',
        'New seamless training set — sponsored posts + affiliate code with 20% commission.',
        ARRAY['Fitness','Fashion']::text[],
        ARRAY['UGC Creators','Affiliate deals','Long-term partnerships']::text[],
        '@pulsefit', '@pulsefit',
        'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop'),
      ('demo-brand-otaku@linkr.demo',   'OtakuCrate',        'brand',   'Diverse','Japan',
        'Monthly anime merch boxes shipped worldwide. Looking for anime creators to unbox and review.',
        'Free monthly crate + paid Reels for top anime creators. Global shipping covered.',
        ARRAY['Anime']::text[],
        ARRAY['UGC Creators','Long-term partnerships']::text[],
        '@otakucrate', '@otakucrate',
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop'),
      ('demo-brand-pawnest@linkr.demo', 'PawNest',           'brand',   'Female', 'Germany',
        'Premium organic pet food and treats. Searching for pet creators with engaged communities.',
        'Free 3-month supply + paid collab for cat and dog content creators.',
        ARRAY['Pets']::text[],
        ARRAY['UGC Creators','Paid collaborations']::text[],
        '@pawnest', null,
        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&auto=format&fit=crop'),
      ('demo-brand-novacore@linkr.demo','NovaCore Audio',    'brand',   'Male',   'United States',
        'Wireless earbuds and audio gear for creators. Seeking tech reviewers for honest video reviews.',
        'Free NovaBuds Pro + $300 paid review on YouTube or TikTok.',
        ARRAY['Tech']::text[],
        ARRAY['Paid collaborations','UGC Creators']::text[],
        '@novacore.audio', '@novacoreaudio',
        'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop'),
      ('demo-creator-mia@linkr.demo',   'Mia Chen',          'creator', 'Female', 'United States',
        'Beauty & skincare creator. I share honest, no-filter routines with a community of 85k. Open to paid skincare collabs.',
        null,
        ARRAY['Beauty','Fashion']::text[],
        ARRAY['Paid deals','Free products','Long-term collaborations']::text[],
        '@miachen.beauty', '@miachen',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop'),
      ('demo-creator-jay@linkr.demo',   'Jay Carter',        'creator', 'Male',   'United Kingdom',
        'Fitness coach & content creator. Daily workouts, gym vlogs and supplement reviews to 120k followers.',
        null,
        ARRAY['Fitness']::text[],
        ARRAY['Paid deals','Long-term collaborations']::text[],
        '@jaycarter.fit', '@jaycarter',
        'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=800&auto=format&fit=crop'),
      ('demo-creator-aki@linkr.demo',   'Aki Tanaka',        'creator', 'Diverse','Japan',
        'Anime cosplayer and reviewer. Weekly cosplay reels, manga reviews and convention vlogs.',
        null,
        ARRAY['Anime','Fashion']::text[],
        ARRAY['Paid deals','Free products']::text[],
        '@aki.cosplay', '@akitanaka',
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop'),
      ('demo-creator-luna@linkr.demo',  'Luna & Mochi',      'creator', 'Female', 'Germany',
        'Two cats, one camera. Funny pet content + product reviews loved by 60k pet parents.',
        null,
        ARRAY['Pets']::text[],
        ARRAY['Paid deals','Free products','Long-term collaborations']::text[],
        '@lunaandmochi', '@lunaandmochi',
        'https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=800&auto=format&fit=crop'),
      ('demo-creator-marco@linkr.demo', 'Marco Rivera',      'creator', 'Male',   'Spain',
        'Tech reviewer & gadget nerd. In-depth video reviews of audio, smart home and creator gear.',
        null,
        ARRAY['Tech']::text[],
        ARRAY['Paid deals','Free products']::text[],
        '@marco.tech', '@marcotech',
        'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop')
    ) AS t(email, display_name, role, gender, country, bio, product_description, categories, looking_for, instagram, tiktok, image_url)
  LOOP
    -- Skip if already exists
    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE display_name = rec.display_name AND role = rec.role::user_role
    ) THEN
      CONTINUE;
    END IF;

    -- Reuse auth user if email already exists, otherwise create one
    SELECT id INTO v_id FROM auth.users WHERE email = rec.email;
    IF v_id IS NULL THEN
      v_id := gen_random_uuid();
      INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
      ) VALUES (
        v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
        rec.email, crypt(gen_random_uuid()::text, gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('demo', true),
        false, false
      );
    END IF;

    -- Upsert profile (a trigger may have already created an empty row)
    INSERT INTO public.profiles (
      id, role, display_name, bio, image_url, instagram, tiktok,
      categories, product_description, country, gender, looking_for
    ) VALUES (
      v_id, rec.role::user_role, rec.display_name, rec.bio, rec.image_url,
      rec.instagram, rec.tiktok, rec.categories, rec.product_description,
      rec.country, rec.gender, rec.looking_for
    )
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      display_name = EXCLUDED.display_name,
      bio = EXCLUDED.bio,
      image_url = EXCLUDED.image_url,
      instagram = EXCLUDED.instagram,
      tiktok = EXCLUDED.tiktok,
      categories = EXCLUDED.categories,
      product_description = EXCLUDED.product_description,
      country = EXCLUDED.country,
      gender = EXCLUDED.gender,
      looking_for = EXCLUDED.looking_for;
  END LOOP;
END $$;