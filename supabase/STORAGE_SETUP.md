# Supabase Storage Bucket Setup Guide

The migration SQL (`001_new_features.sql`) creates the `product-images` bucket automatically.
Use this guide to **verify** the setup in the Supabase dashboard or recreate it manually.

---

## Buckets Required

| Bucket name      | Public | Max file size | Allowed types                     |
|------------------|--------|---------------|-----------------------------------|
| `review-images`  | ✅ Yes  | 5 MB          | image/jpeg, image/png, image/webp |
| `avatars`        | ✅ Yes  | 2 MB          | image/jpeg, image/png, image/webp |
| `product-images` | ✅ Yes  | 10 MB         | image/jpeg, image/png, image/webp |

---

## Option A — Verify via Dashboard (Recommended)

1. Go to **Storage** in the left sidebar of your Supabase project
2. Check that all three buckets above exist
3. Click each bucket → **Policies** tab → confirm the policies below are present

If any bucket is missing, use Option B below.

---

## Option B — Create Manually via Dashboard

### Step 1 — Create the bucket

1. **Storage → New bucket**
2. Set **Name**: `product-images`
3. Toggle **Public bucket**: ON
4. Click **Save**

### Step 2 — Add access policies

Go to **Storage → product-images → Policies** and create two policies:

#### Policy 1 — Public read access

| Field        | Value                    |
|--------------|--------------------------|
| Policy name  | `Anyone can view product images` |
| Allowed operation | SELECT               |
| Target roles | `anon`, `authenticated`  |
| USING expression | `bucket_id = 'product-images'` |

#### Policy 2 — Authenticated upload

| Field        | Value                    |
|--------------|--------------------------|
| Policy name  | `Authenticated users can upload product images` |
| Allowed operation | INSERT               |
| Target roles | `authenticated`          |
| WITH CHECK expression | `bucket_id = 'product-images' AND auth.role() = 'authenticated'` |

---

## Option C — SQL (run in SQL Editor)

```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Authenticated upload
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

---

## Verifying It Works

After setup, upload a test image via the **Submit a Product** form at `/products/submit`.
The image URL returned will look like:
```
https://<project-id>.supabase.co/storage/v1/object/public/product-images/<user-id>/filename.jpg
```

This URL is already whitelisted in `next.config.mjs` under `remotePatterns`.
