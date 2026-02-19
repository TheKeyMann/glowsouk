-- ============================================================
-- Glowsouk - Beauty Product Review Platform
-- Supabase Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  username    TEXT UNIQUE,
  avatar_url  TEXT,
  skin_type   TEXT CHECK (skin_type IN ('oily', 'dry', 'combination', 'normal', 'sensitive')),
  nationality TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Products table
CREATE TABLE public.products (
  id                UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  name              TEXT    NOT NULL,
  brand             TEXT    NOT NULL,
  category          TEXT    NOT NULL CHECK (category IN ('skincare', 'makeup', 'haircare', 'fragrance', 'bodycare')),
  subcategory       TEXT,
  description       TEXT,
  image_url         TEXT,
  country_of_origin TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Reviews table
CREATE TABLE public.reviews (
  id            UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID    REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  product_id    UUID    REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text   TEXT,
  image_url     TEXT,
  helpful_count INTEGER DEFAULT 0 NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- Product stats table (maintained by trigger)
CREATE TABLE public.product_stats (
  product_id   UUID    REFERENCES public.products(id) ON DELETE CASCADE PRIMARY KEY,
  avg_rating   DECIMAL(3,2) DEFAULT 0 NOT NULL,
  review_count INTEGER DEFAULT 0 NOT NULL,
  updated_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_user_id    ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating     ON public.reviews(rating);
CREATE INDEX idx_products_category  ON public.products(category);
CREATE INDEX idx_products_brand     ON public.products(brand);

-- Full-text search index on name + brand
CREATE INDEX idx_products_search ON public.products
  USING gin(to_tsvector('english', name || ' ' || brand));

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stats ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users: anyone can view profiles"
  ON public.users FOR SELECT USING (true);

CREATE POLICY "Users: own row insert"
  ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users: own row update"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- Products policies (public catalog, no public insert)
CREATE POLICY "Products: anyone can view"
  ON public.products FOR SELECT USING (true);

-- Reviews policies
CREATE POLICY "Reviews: anyone can view"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Reviews: authenticated users can create"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Reviews: users can update own"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Reviews: users can delete own"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Product stats policies
CREATE POLICY "Product stats: anyone can view"
  ON public.product_stats FOR SELECT USING (true);

-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- Automatically create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatically update product_stats when reviews change
CREATE OR REPLACE FUNCTION public.update_product_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
BEGIN
  -- Determine which product to update
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;

  INSERT INTO public.product_stats (product_id, avg_rating, review_count, updated_at)
  SELECT
    target_product_id,
    COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0),
    COUNT(*),
    NOW()
  FROM public.reviews
  WHERE product_id = target_product_id
  ON CONFLICT (product_id) DO UPDATE SET
    avg_rating   = EXCLUDED.avg_rating,
    review_count = EXCLUDED.review_count,
    updated_at   = EXCLUDED.updated_at;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_product_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_product_stats();

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('review-images', 'review-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars',       'avatars',       true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view review images"
  ON storage.objects FOR SELECT USING (bucket_id = 'review-images');

CREATE POLICY "Authenticated users can upload review images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'review-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own review images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'review-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- SEED DATA - Sample Products
-- ============================================================

INSERT INTO public.products (name, brand, category, subcategory, description, image_url, country_of_origin) VALUES
  -- Skincare
  ('Niacinamide 10% + Zinc 1%', 'The Ordinary', 'skincare', 'serum',
   'High-strength vitamin and mineral blemish formula that visibly reduces pores and controls shine.',
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format', 'Canada'),

  ('Moisturizing Cream', 'CeraVe', 'skincare', 'moisturizer',
   'Developed with dermatologists, this rich cream with ceramides and hyaluronic acid is perfect for normal to dry skin.',
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format', 'USA'),

  ('Gentle Skin Cleanser', 'Cetaphil', 'skincare', 'cleanser',
   'A gentle daily face wash for normal to oily sensitive skin. Soap-free, non-irritating formula.',
   'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format', 'USA'),

  ('Vitamin C Suspension 23%', 'The Ordinary', 'skincare', 'serum',
   'A high-concentration ascorbic acid formula that brightens skin and targets uneven tone.',
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format', 'Canada'),

  -- Makeup
  ('Pillow Talk Lipstick', 'Charlotte Tilbury', 'makeup', 'lipstick',
   'The most universally flattering nude-pink shade. A timeless, romantic rose-pink with a touch of gold shimmer.',
   'https://images.unsplash.com/photo-1586495777744-4e6232bf2919?w=600&auto=format', 'UK'),

  ('Ruby Woo Lipstick', 'MAC Cosmetics', 'makeup', 'lipstick',
   'The most iconic red lipstick with a retro matte finish. Highly pigmented, long-wearing formula.',
   'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format', 'USA'),

  ('Double Wear Foundation', 'Estée Lauder', 'makeup', 'foundation',
   '24-hour full coverage foundation that stays fresh in heat and humidity. Transfer-resistant and waterproof.',
   'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&auto=format', 'USA'),

  -- Haircare
  ('No. 3 Hair Perfector', 'Olaplex', 'haircare', 'treatment',
   'Award-winning at-home treatment that reduces breakage and visibly strengthens hair. Use weekly for best results.',
   'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format', 'USA'),

  ('Argan Oil Treatment', 'Moroccanoil', 'haircare', 'oil',
   'The iconic argan oil-infused treatment that absorbs instantly for softer, shinier, more manageable hair.',
   'https://images.unsplash.com/photo-1505455184862-554165e5f6ba?w=600&auto=format', 'Israel'),

  -- Fragrance
  ('Peony & Blush Suede', 'Jo Malone London', 'fragrance', 'eau de cologne',
   'A flirtatious blend of peony with red apple, Egyptian jasmine, rose and suede. Worn alone or layered.',
   'https://images.unsplash.com/photo-1541643600914-78b084683702?w=600&auto=format', 'UK'),

  ('No. 5 Eau de Parfum', 'Chanel', 'fragrance', 'eau de parfum',
   'The world''s most iconic fragrance. A timeless floral-aldehyde with notes of ylang ylang and rose.',
   'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format', 'France'),

  -- Bodycare
  ('Shea Butter Body Cream', 'L''Occitane', 'bodycare', 'body cream',
   'Ultra-rich body cream with 25% shea butter. Intensely nourishes and softens even the driest skin.',
   'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format', 'France'),

  ('Intensive Repair Lotion', 'Eucerin', 'bodycare', 'body lotion',
   'Clinically proven body lotion with 5% urea and ceramides for very dry, rough and flaky skin.',
   'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format', 'Germany');
