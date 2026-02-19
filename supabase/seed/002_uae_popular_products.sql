-- ============================================================
-- Glowsouk - Seed 002: UAE-Popular Products
-- Run in Supabase SQL Editor to populate homepage & ranking
-- ============================================================

INSERT INTO public.products
  (name, brand, category, subcategory, description, image_url, country_of_origin, status)
VALUES

  -- ── Skincare ──────────────────────────────────────────────
  (
    'Crème de la Mer',
    'La Mer',
    'skincare', 'moisturizer',
    'The legendary moisturizer powered by Miracle Broth™. Heals, restores and transforms skin with deep hydration and a luminous finish. A cult icon across the Gulf.',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format',
    'France', 'approved'
  ),
  (
    'Lip Sleeping Mask (Berry)',
    'Laneige',
    'skincare', 'lip treatment',
    'An overnight lip mask that intensively hydrates and repairs lips while you sleep. Formulated with antioxidant-rich vitamin C and berry extracts. Best-seller in the Middle East.',
    'https://images.unsplash.com/photo-1586495777744-4e6232bf2919?w=600&auto=format',
    'South Korea', 'approved'
  ),
  (
    'Facial Treatment Essence',
    'SK-II',
    'skincare', 'essence',
    'The iconic SK-II essence, over 90% PITERA™ – a bio-ingredient that transforms skin texture, clarity and radiance. A staple in luxury skincare routines.',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format',
    'Japan', 'approved'
  ),
  (
    'Protini Polypeptide Cream',
    'Drunk Elephant',
    'skincare', 'moisturizer',
    'Signal peptide-packed moisturizer that dramatically improves skin tone, texture and firmness. Free from the "Suspicious 6". Loved for its lightweight, skin-identical formula.',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format',
    'USA', 'approved'
  ),
  (
    'Multi-Peptide + HA Serum',
    'The Ordinary',
    'skincare', 'serum',
    'Combines multiple peptide technologies with hyaluronic acid to visibly target signs of aging, improve skin texture and boost hydration. Exceptional value.',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format',
    'Canada', 'approved'
  ),

  -- ── Makeup ────────────────────────────────────────────────
  (
    'Faux Filter Foundation',
    'Huda Beauty',
    'makeup', 'foundation',
    'A full-coverage, long-wearing foundation with a natural matte finish. Available in 55 shades with undertones for every skin tone. Developed in Dubai, loved globally.',
    'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&auto=format',
    'UAE', 'approved'
  ),
  (
    'Soft Pinch Liquid Blush',
    'Rare Beauty',
    'makeup', 'blush',
    'A lightweight, long-lasting liquid blush that blends seamlessly for a natural flush. One drop covers the whole face. Minimalist formula with a dewy finish.',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format',
    'USA', 'approved'
  ),
  (
    'Magic Cream',
    'Charlotte Tilbury',
    'skincare', 'moisturizer',
    'The iconic rose-gold moisturizer used backstage at fashion weeks worldwide. Hyaluronic acid and peptides deliver instant glow, plumping and smoothing in one step.',
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format',
    'UK', 'approved'
  ),

  -- ── Haircare ──────────────────────────────────────────────
  (
    'Nutritive Bain Satin Shampoo',
    'Kérastase',
    'haircare', 'shampoo',
    'A luxurious nourishing shampoo for dry, sensitised hair. Restores softness, shine and vitality with every wash. A top seller in UAE salons and spas.',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format',
    'France', 'approved'
  ),

  -- ── Bodycare ──────────────────────────────────────────────
  (
    'Brazilian Bum Bum Cream',
    'Sol de Janeiro',
    'bodycare', 'body cream',
    'A fast-absorbing body cream with a cult following. Guaraná, cupuaçu butter and coconut oil visibly firm and smooth skin while leaving a warm, addictive Cheirosa 62 scent.',
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format',
    'Brazil', 'approved'
  );
