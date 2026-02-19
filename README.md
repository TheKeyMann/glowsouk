# Glowsouk ✨

> A community-driven beauty product review platform for skincare, makeup, haircare, fragrance and bodycare.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Language**: TypeScript

---

## Features

- User signup / login (email + Google OAuth)
- Product listing by category (Skincare, Makeup, Haircare, Fragrance, Bodycare)
- Product detail pages with average rating and reviews
- Star rating (1–5) + text review + optional photo upload
- Homepage showing top-rated products by category
- Full-text search by product name or brand
- Row-level security so users can only edit their own reviews

---

## Local Setup

### 1. Clone & install

```bash
git clone <your-repo-url> glowsouk
cd glowsouk
npm install
```

### 2. Create a Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and create a new project
2. In the SQL editor, run the full contents of `supabase/schema.sql`
3. Under **Authentication → Providers**, enable:
   - **Email** (enabled by default)
   - **Google** — add your OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)
     - Authorized redirect URI: `https://<your-project-id>.supabase.co/auth/v1/callback`

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in **Supabase → Project Settings → API**.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Extended user profiles (username, skin type, nationality) |
| `products` | Product catalog (name, brand, category, images) |
| `reviews` | User reviews (rating 1–5, text, optional photo) |
| `product_stats` | Materialized avg rating + review count, auto-updated by trigger |

### RLS Policies

- Anyone can **view** products, reviews, and user profiles
- Only authenticated users can **create** reviews
- Users can only **update / delete their own** reviews and profile

---

## Deploying to Vercel

### Option 1: Vercel Dashboard

1. Push the project to GitHub
2. Import the repo in [vercel.com/new](https://vercel.com/new)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel
```

Set the same env vars when prompted, or add them in Project → Settings → Environment Variables.

### Supabase Auth redirect URL

In **Supabase → Authentication → URL Configuration**, add your production URL to **Redirect URLs**:

```
https://your-app.vercel.app/auth/callback
```

---

## Project Structure

```
glowsouk/
├── app/
│   ├── layout.tsx              # Root layout with header + footer
│   ├── page.tsx                # Homepage (top-rated + category spotlights)
│   ├── auth/
│   │   ├── login/page.tsx      # Email + Google login
│   │   ├── signup/page.tsx     # Registration
│   │   └── callback/route.ts   # OAuth callback handler
│   ├── products/
│   │   ├── page.tsx            # Product listing + filters
│   │   └── [id]/page.tsx       # Product detail + reviews
│   └── search/page.tsx         # Search results
├── components/
│   ├── Header.tsx              # Sticky header with nav + search + auth
│   ├── ProductCard.tsx         # Product tile with rating
│   ├── ReviewCard.tsx          # Individual review display
│   ├── ReviewForm.tsx          # Star rating + text + photo upload form
│   ├── StarRating.tsx          # Interactive & display star component
│   └── CategoryFilter.tsx      # Category pill filter bar
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       └── server.ts           # Server-side Supabase client
├── supabase/
│   └── schema.sql              # Full DB schema, RLS, triggers, seed data
├── middleware.ts               # Session refresh middleware
└── vercel.json                 # Vercel deployment config
```

---

## Customisation Notes

- **Brand colours** are defined in `tailwind.config.ts` under `glowsouk.*`
- **Categories** can be extended in `lib/types.ts` → `CATEGORIES` array and the SQL `CHECK` constraint
- **Product images** — replace seed URLs with Supabase Storage URLs for production
- **Storage** — the schema creates `review-images` and `avatars` buckets automatically
