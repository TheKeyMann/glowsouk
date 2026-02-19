import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StarRating from '@/components/StarRating'
import ReviewCard from '@/components/ReviewCard'
import ReviewForm from '@/components/ReviewForm'
import ReviewFilters from '@/components/ReviewFilters'
import ProductCard from '@/components/ProductCard'
import type { Product, ProductStats, Review } from '@/lib/types'
import type { Metadata } from 'next'

interface ProductPageProps {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ review_sort?: string; review_rating?: string }>
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

async function getProduct(id: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, product_stats(*)')
    .eq('id', id)
    .single()
  return data as (Product & { product_stats: ProductStats }) | null
}

async function getReviews(productId: string, sort: string, filterRating: number | null) {
  const supabase = await createClient()
  let query = supabase
    .from('reviews')
    .select('*, users(id, username, avatar_url, skin_type, nationality)')
    .eq('product_id', productId)

  if (filterRating) query = query.eq('rating', filterRating)

  const ordered =
    sort === 'highest'
      ? query.order('rating',        { ascending: false })
      : sort === 'most_helpful'
      ? query.order('helpful_count', { ascending: false })
      : query.order('created_at',    { ascending: false })

  const { data } = await ordered
  return (data || []) as Review[]
}

async function getRelatedProducts(productId: string, category: string, limit = 4) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, product_stats(*)')
    .eq('category', category)
    .neq('id', productId)
    .order('avg_rating', { referencedTable: 'product_stats', ascending: false })
    .limit(limit)
  return (data || []) as (Product & { product_stats: ProductStats })[]
}

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function getUserVotedReviewIds(userId: string, reviewIds: string[]): Promise<Set<string>> {
  if (!userId || reviewIds.length === 0) return new Set()
  const supabase = await createClient()
  const { data } = await supabase
    .from('review_votes')
    .select('review_id')
    .eq('user_id', userId)
    .in('review_id', reviewIds)
  return new Set((data || []).map((v) => v.review_id))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Product Not Found' }
  return {
    title: `${product.name} by ${product.brand}`,
    description: product.description || `Read reviews for ${product.name} by ${product.brand} on Glowsouk.`,
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

const categoryEmojis: Record<string, string> = {
  skincare: '✨', makeup: '💄', haircare: '💆', fragrance: '🌸', bodycare: '🧴',
}

function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null
  const total = reviews.length
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    pct:   Math.round((reviews.filter((r) => r.rating === star).length / total) * 100),
  }))

  return (
    <div className="space-y-2">
      {counts.map(({ star, count, pct }) => (
        <div key={star} className="flex items-center gap-3 text-sm">
          <span className="w-4 text-right text-glowsouk-dark-muted font-medium">{star}</span>
          <div className="flex-1 bg-glowsouk-cream-dark rounded-full h-2 overflow-hidden">
            <div className="h-full bg-glowsouk-gold rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <span className="w-8 text-xs text-glowsouk-dark-muted">{count}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { id }       = await params
  const sp           = await searchParams
  const reviewSort   = ['newest', 'highest', 'most_helpful'].includes(sp.review_sort || '') ? sp.review_sort! : 'newest'
  const reviewRating = sp.review_rating ? parseInt(sp.review_rating, 10) : null
  const validRating  = reviewRating && reviewRating >= 1 && reviewRating <= 5 ? reviewRating : null

  const [product, currentUser] = await Promise.all([getProduct(id), getCurrentUser()])
  if (!product) notFound()

  const [reviews, relatedProducts] = await Promise.all([
    getReviews(id, reviewSort, validRating),
    getRelatedProducts(id, product.category),
  ])

  const votedIds = currentUser
    ? await getUserVotedReviewIds(currentUser.id, reviews.map((r) => r.id))
    : new Set<string>()

  const stats      = product.product_stats
  const avgRating  = stats?.avg_rating  ?? 0
  const reviewCount = stats?.review_count ?? 0
  const hasUserReviewed = currentUser ? reviews.some((r) => r.user_id === currentUser.id) : false

  // For rating breakdown we use all reviews (unfiltered count from stats)
  const allReviewsForBreakdown = validRating ? reviews : reviews

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-glowsouk-dark-muted mb-8">
        <Link href="/products" className="hover:text-glowsouk-rose inline-flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Products
        </Link>
        <span>/</span>
        <Link href={`/products?category=${product.category}`} className="capitalize hover:text-glowsouk-rose transition-colors">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-glowsouk-dark truncate">{product.name}</span>
      </div>

      {/* Product hero */}
      <div className="grid lg:grid-cols-2 gap-10 mb-16">
        {/* Image */}
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-glowsouk-cream">
          {product.image_url ? (
            <Image src={product.image_url} alt={product.name} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">
              {categoryEmojis[product.category] || '🌸'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 text-sm bg-glowsouk-rose/10 text-glowsouk-rose px-3 py-1 rounded-full font-medium capitalize">
              {categoryEmojis[product.category]} {product.category}
            </span>
            {product.subcategory && (
              <span className="text-sm text-glowsouk-dark-muted capitalize">{product.subcategory}</span>
            )}
          </div>

          <p className="text-glowsouk-rose font-semibold text-sm uppercase tracking-widest mb-2">{product.brand}</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-glowsouk-dark mb-4">{product.name}</h1>

          {/* Rating summary */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-glowsouk-cream rounded-2xl">
            <div className="text-center">
              <p className="font-serif text-5xl font-bold text-glowsouk-dark">
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </p>
              <StarRating rating={avgRating} size="md" />
              <p className="text-xs text-glowsouk-dark-muted mt-1">
                {reviewCount} review{reviewCount !== 1 ? 's' : ''}
              </p>
            </div>
            {reviewCount > 0 && (
              <div className="flex-1">
                <RatingBreakdown reviews={allReviewsForBreakdown} />
              </div>
            )}
          </div>

          {product.description && (
            <p className="text-glowsouk-dark-muted leading-relaxed mb-6">{product.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm mb-6">
            {product.country_of_origin && (
              <div className="bg-white rounded-xl p-3 border border-glowsouk-cream-dark">
                <p className="text-glowsouk-dark-muted/60 text-xs uppercase tracking-wide mb-0.5">Origin</p>
                <p className="font-medium text-glowsouk-dark">{product.country_of_origin}</p>
              </div>
            )}
            {product.subcategory && (
              <div className="bg-white rounded-xl p-3 border border-glowsouk-cream-dark">
                <p className="text-glowsouk-dark-muted/60 text-xs uppercase tracking-wide mb-0.5">Type</p>
                <p className="font-medium text-glowsouk-dark capitalize">{product.subcategory}</p>
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${product.brand} ${product.name} buy`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <ShoppingBag className="w-4 h-4" /> Find Where to Buy
            </a>
            <Link href="/products/submit" className="btn-ghost text-sm">
              + Submit a product
            </Link>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="grid lg:grid-cols-3 gap-8 mb-16">
        {/* Review form */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="font-serif text-xl font-bold text-glowsouk-dark mb-5">Write a Review</h2>
            {currentUser ? (
              hasUserReviewed ? (
                <div className="text-center py-6">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="font-medium text-glowsouk-dark mb-1">Review submitted</p>
                  <p className="text-sm text-glowsouk-dark-muted">You&apos;ve already reviewed this product. Thank you!</p>
                </div>
              ) : (
                <ReviewForm productId={product.id} userId={currentUser.id} />
              )
            ) : (
              <div className="text-center py-6">
                <p className="text-2xl mb-3">✨</p>
                <p className="font-medium text-glowsouk-dark mb-2">Share your experience</p>
                <p className="text-sm text-glowsouk-dark-muted mb-4">
                  Sign in to leave a review and help others find what works.
                </p>
                <Link href="/auth/login" className="btn-primary w-full">Sign in to Review</Link>
                <Link href="/auth/signup" className="btn-ghost w-full mt-2 text-sm">Create free account</Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews list */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="font-serif text-2xl font-bold text-glowsouk-dark mb-4">Community Reviews</h2>
            <Suspense fallback={null}>
              <ReviewFilters
                activeSort={reviewSort}
                activeRating={validRating}
                reviewCount={reviews.length}
              />
            </Suspense>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-glowsouk-cream-dark">
              <p className="text-4xl mb-3">🌸</p>
              <h3 className="font-serif text-lg font-bold text-glowsouk-dark mb-2">
                {validRating ? `No ${validRating}-star reviews yet` : 'Be the first to review'}
              </h3>
              <p className="text-glowsouk-dark-muted text-sm">
                {validRating ? 'Try a different star filter.' : 'Share your honest experience with this product.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  userId={currentUser?.id ?? null}
                  hasVoted={votedIds.has(review.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold text-glowsouk-dark">
              More {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
            </h2>
            <Link
              href={`/products?category=${product.category}`}
              className="text-sm font-medium text-glowsouk-rose hover:text-glowsouk-rose-dark transition-colors"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
