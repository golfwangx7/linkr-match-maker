-- Helper: insert auth users with minimal required fields
DO $$
DECLARE
  demo_users JSONB := '[
    {"id":"11111111-1111-1111-1111-111111111101","role":"creator","name":"luna_beauty","bio":"Clean beauty obsessed ✨ Sharing honest reviews and skincare routines.","img":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600","ig":"luna.beauty","tt":"lunabeauty","cats":["Beauty","Fashion"]},
    {"id":"11111111-1111-1111-1111-111111111102","role":"creator","name":"max_fitness","bio":"Personal trainer & nutrition coach. Helping you build sustainable habits 💪","img":"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600","ig":"max.lifts","tt":"maxfitness","cats":["Fitness"]},
    {"id":"11111111-1111-1111-1111-111111111103","role":"creator","name":"otaku_kira","bio":"Anime reviews, figure collecting, and cosplay tutorials 🎌","img":"https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=600","ig":"kira.anime","tt":"otakukira","cats":["Anime"]},
    {"id":"11111111-1111-1111-1111-111111111104","role":"creator","name":"chloe_styles","bio":"Streetwear lover from NYC. Daily fits & thrift hauls 👗","img":"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600","ig":"chloe.styles","tt":"chloestyles","cats":["Fashion","Beauty"]},
    {"id":"11111111-1111-1111-1111-111111111105","role":"creator","name":"pawsome_jake","bio":"Two golden retrievers and a chaotic cat. Pet content & training tips 🐶","img":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600","ig":"pawsome.jake","tt":"pawsomejake","cats":["Pets"]},
    {"id":"11111111-1111-1111-1111-111111111106","role":"creator","name":"techie_ren","bio":"Gadget reviewer. New phones, laptops, and smart home gear 📱","img":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600","ig":"ren.tech","tt":"techieren","cats":["Tech"]},
    {"id":"11111111-1111-1111-1111-111111111107","role":"creator","name":"yoga_mia","bio":"Yoga teacher 🧘‍♀️ Mindful movement and wellness rituals.","img":"https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600","ig":"yoga.mia","tt":"yogamia","cats":["Fitness","Beauty"]},
    {"id":"11111111-1111-1111-1111-111111111108","role":"creator","name":"sora_draws","bio":"Digital artist & anime illustrator. Commissions open 🎨","img":"https://images.unsplash.com/photo-1463453091185-61582044d556?w=600","ig":"sora.draws","tt":"soradraws","cats":["Anime","Fashion"]},
    {"id":"22222222-2222-2222-2222-222222222201","role":"brand","name":"GlowLab","bio":null,"img":"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600","desc":"Vitamin C serum that brightens skin in 14 days. Looking for honest beauty creators.","cats":["Beauty"]},
    {"id":"22222222-2222-2222-2222-222222222202","role":"brand","name":"PeakProtein","bio":null,"img":"https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600","desc":"Plant-based protein powder, 25g per scoop. Partnering with fitness creators.","cats":["Fitness"]},
    {"id":"22222222-2222-2222-2222-222222222203","role":"brand","name":"NekoMerch","bio":null,"img":"https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600","desc":"Premium anime apparel & figures. Looking for otaku content creators.","cats":["Anime"]},
    {"id":"22222222-2222-2222-2222-222222222204","role":"brand","name":"PupCrate","bio":null,"img":"https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600","desc":"Monthly subscription box for dogs. Treats, toys, and surprises.","cats":["Pets"]},
    {"id":"22222222-2222-2222-2222-222222222205","role":"brand","name":"NovaBuds","bio":null,"img":"https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600","desc":"Wireless earbuds with 40h battery and ANC. Tech reviewers wanted.","cats":["Tech"]}
  ]'::JSONB;
  u JSONB;
BEGIN
  FOR u IN SELECT * FROM jsonb_array_elements(demo_users)
  LOOP
    -- Insert auth user (minimal record so the FK / system constraints are satisfied)
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
    ) VALUES (
      (u->>'id')::uuid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'demo+' || (u->>'id') || '@linkr.local',
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      false, false
    )
    ON CONFLICT (id) DO NOTHING;

    -- Insert / upsert profile
    INSERT INTO public.profiles (
      id, role, display_name, bio, image_url, instagram, tiktok,
      product_description, categories
    ) VALUES (
      (u->>'id')::uuid,
      (u->>'role')::public.user_role,
      u->>'name',
      u->>'bio',
      u->>'img',
      u->>'ig',
      u->>'tt',
      u->>'desc',
      ARRAY(SELECT jsonb_array_elements_text(u->'cats'))
    )
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      display_name = EXCLUDED.display_name,
      bio = EXCLUDED.bio,
      image_url = EXCLUDED.image_url,
      instagram = EXCLUDED.instagram,
      tiktok = EXCLUDED.tiktok,
      product_description = EXCLUDED.product_description,
      categories = EXCLUDED.categories;
  END LOOP;
END $$;