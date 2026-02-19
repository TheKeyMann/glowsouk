-- ============================================================
-- Glowsouk - Migration 001: New Features
-- Run this in Supabase SQL Editor AFTER the initial schema.sql
-- ============================================================

-- ============================================================
-- 1. PRODUCT STATUS (for submission workflow)
-- ============================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Mark all existing products as approved
UPDATE public.products SET status = 'approved' WHERE status IS NULL;

-- Update products RLS: public only sees approved products
DROP POLICY IF EXISTS "Products: anyone can view"  ON public.products;
DROP POLICY IF EXISTS "Products: view approved"    ON public.products;

CREATE POLICY "Products: view approved"
  ON public.products FOR SELECT
  USING (status = 'approved' OR auth.uid() IS NOT NULL AND status = 'pending');

-- Authenticated users can submit new products
DROP POLICY IF EXISTS "Products: authenticated users can submit" ON public.products;

CREATE POLICY "Products: authenticated users can submit"
  ON public.products FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 2. REVIEW VOTES (helpful button)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.review_votes (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  review_id  UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, review_id)
);

ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Review votes: anyone can view"          ON public.review_votes;
DROP POLICY IF EXISTS "Review votes: authenticated users can vote" ON public.review_votes;
DROP POLICY IF EXISTS "Review votes: users can remove own vote"    ON public.review_votes;

CREATE POLICY "Review votes: anyone can view"
  ON public.review_votes FOR SELECT USING (true);

CREATE POLICY "Review votes: authenticated users can vote"
  ON public.review_votes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Review votes: users can remove own vote"
  ON public.review_votes FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id   ON public.review_votes(user_id);

-- Trigger: auto-increment/decrement helpful_count on reviews
CREATE OR REPLACE FUNCTION public.update_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews
    SET helpful_count = helpful_count + 1
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews
    SET helpful_count = GREATEST(0, helpful_count - 1)
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_helpful_count_trigger ON public.review_votes;

CREATE TRIGGER update_helpful_count_trigger
  AFTER INSERT OR DELETE ON public.review_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_helpful_count();

-- ============================================================
-- 3. STORAGE — product-images bucket (user submissions)
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 'product-images', true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view product images"                ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ============================================================
-- 4. RPC — get_ranked_products (time-period aware ranking)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_ranked_products(
  p_period   TEXT    DEFAULT 'all',
  p_category TEXT    DEFAULT NULL,
  p_sort     TEXT    DEFAULT 'avg_rating',
  p_limit    INTEGER DEFAULT 20
)
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  brand        TEXT,
  category     TEXT,
  subcategory  TEXT,
  image_url    TEXT,
  avg_rating   NUMERIC,
  review_count BIGINT
) AS $$
DECLARE
  date_cutoff TIMESTAMPTZ;
BEGIN
  date_cutoff := CASE p_period
    WHEN 'week'  THEN NOW() - INTERVAL '7 days'
    WHEN 'month' THEN NOW() - INTERVAL '30 days'
    ELSE NULL
  END;

  RETURN QUERY
  SELECT
    pr.id,
    pr.name,
    pr.brand,
    pr.category::TEXT,
    pr.subcategory,
    pr.image_url,
    COALESCE(ROUND(AVG(r.rating)::NUMERIC, 2), 0) AS avg_rating,
    COUNT(r.id)::BIGINT                            AS review_count
  FROM public.products pr
  LEFT JOIN public.reviews r
    ON  r.product_id = pr.id
    AND (date_cutoff IS NULL OR r.created_at >= date_cutoff)
  WHERE pr.status = 'approved'
    AND (p_category IS NULL OR pr.category = p_category)
  GROUP BY pr.id
  HAVING COUNT(r.id) > 0
  ORDER BY
    CASE WHEN p_sort = 'review_count'
      THEN COUNT(r.id)::NUMERIC
      ELSE COALESCE(ROUND(AVG(r.rating)::NUMERIC, 2), 0)
    END DESC NULLS LAST,
    pr.name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
