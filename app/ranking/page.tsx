import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Medal } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StarRating from '@/components/StarRating'
import RankingControls from './RankingControls'
import { CATEGORIES, type Category, type Product, type ProductStats } from '@/lib/types'

interface RankingPageProps {
  searchParams: Promise<{
    category?: string
    period?: string
    sort?: string
  }>
}

type RankedProduct = Product & { product_stats: ProductStats }

async function getRankedProducts(
  category: Category | null,
  period: string,
  sort: string
): Promise<RankedProduct[]> {
  const supabase = await createClient()

  if (period === 'all') {
    let query = supabase
      .from('products')
      .select('*, product_stats(*)')
      .not('product_stats', 'is', null)

    if (category) query = query.eq('category', category)

    const ordered =
      sort === 'review_count'
        ? query.order('review_count', { referencedTable: 'product_stats', ascending: false })
        : query.order('avg_rating',   { referencedTable: 'product_stats', ascending: false })

    const { data } = await ordered.limit(20)
    return (data || []) as RankedProduct[]
  }

  // Weekly / Monthly — compute dynamically from reviews
  const since =
    period === 'week'
      ? new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('product_id, rating')
    .gte('created_at', since)

  if (!reviews || reviews.length === 0) return []

  // Aggregate per product
  const statsMap = new Map<string, { sum: number; count: number }>()
  for (const r of reviews) {
    const s = statsMap.get(r.product_id) || { sum: 0, count: 0 }
    statsMap.set(r.product_id, { sum: s.sum + r.rating, count: s.count + 1 })
  }

  let productQuery = supabase
    .from('products')
    .select('*')
    .in('id', Array.from(statsMap.keys()))

  if (category) productQuery = productQuery.eq('category', category)

  const { data: products } = await productQuery
  if (!products) return []

  return products
    .filter((p) => statsMap.has(p.id))
    .map((p) => {
      const s = statsMap.get(p.id)!
      return {
        ...p,
        product_stats: {
          product_id:   p.id,
          avg_rating:   Math.round((s.sum / s.count) * 100) / 100,
          review_count: s.count,
          updated_at:   new Date().toISOString(),
        },
      }
    })
    .sort((a, b) =>
      sort === 'review_count'
        ? b.product_stats.review_count - a.product_stats.review_count
        : b.product_stats.avg_rating   - a.product_stats.avg_rating
    )
    .slice(0, 20) as RankedProduct[]
}

const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600']
const rankBg     = ['bg-yellow-50 border-yellow-200', 'bg-gray-50 border-gray-200', 'bg-amber-50 border-amber-200']

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="text-sm font-bold text-glowsouk-dark-muted w-5 text-center">{rank}</span>
}

const categoryEmojis: Record<string, string> = {
  skincare: '✨', makeup: '💄', haircare: '💆', fragrance: '🌸', bodycare: '🧴',
}

async function LeaderboardList({
  category,
  period,
  sort,
}: {
  category: Category | null
  period: string
  sort: string
}) {
  const products = await getRankedProducts(category, period, sort)

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-glowsouk-cream-dark">
        <p className="text-4xl mb-3">🌸</p>
        <h3 className="font-serif text-lg font-bold text-glowsouk-dark mb-2">No rankings yet</h3>
        <p className="text-glowsouk-dark-muted text-sm">
          {period !== 'all'
            ? 'No reviews submitted in this time period.'
            : 'Be the first to review a product!'}
        </p>
        <Link href="/products" className="btn-primary mt-4 inline-flex">Browse Products</Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {products.map((product, index) => {
        const rank = index + 1
        const stats = product.product_stats
        const isTopThree = rank <= 3

        return (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md group ${
              isTopThree
                ? `${rankBg[rank - 1]} hover:border-glowsouk-rose/30`
                : 'bg-white border-glowsouk-cream-dark hover:border-glowsouk-rose/30'
            }`}
          >
            {/* Rank */}
            <div className={`flex-shrink-0 w-8 flex items-center justify-center ${rankColors[rank - 1] || 'text-glowsouk-dark-muted'}`}>
              <RankBadge rank={rank} />
            </div>

            {/* Product image */}
            <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-glowsouk-cream">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  {categoryEmojis[product.category] || '🌸'}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-glowsouk-rose uppercase tracking-wide truncate">
                {product.brand}
              </p>
              <p className="font-semibold text-glowsouk-dark group-hover:text-glowsouk-rose transition-colors truncate">
                {product.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium bg-glowsouk-cream text-glowsouk-dark-muted`}>
                  {categoryEmojis[product.category]} {product.category}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center justify-end gap-1.5 mb-1">
                <StarRating rating={stats.avg_rating} size="sm" />
                <span className="text-sm font-bold text-glowsouk-dark">
                  {stats.avg_rating.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-glowsouk-dark-muted">
                {stats.review_count} review{stats.review_count !== 1 ? 's' : ''}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const params = await searchParams
  const validCategories = CATEGORIES.map((c) => c.value) as string[]
  const rawCategory = params.category
  const category = (rawCategory && validCategories.includes(rawCategory) ? rawCategory : null) as Category | null
  const period = ['all', 'month', 'week'].includes(params.period || '') ? (params.period || 'all') : 'all'
  const sort   = ['avg_rating', 'review_count'].includes(params.sort || '') ? (params.sort || 'avg_rating') : 'avg_rating'

  const periodLabels: Record<string, string> = {
    all: 'All Time', month: 'This Month', week: 'This Week',
  }
  const categoryMeta = category ? CATEGORIES.find((c) => c.value === category) : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-glowsouk-dark">
              Beauty Rankings
            </h1>
            <p className="text-glowsouk-dark-muted text-sm">
              {periodLabels[period]} · {categoryMeta ? `${categoryMeta.emoji} ${categoryMeta.label}` : 'All Categories'} ·{' '}
              {sort === 'avg_rating' ? 'Top Rated' : 'Most Reviewed'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-glowsouk-cream-dark p-5 mb-8">
        <Suspense fallback={<div className="h-24 animate-pulse bg-glowsouk-cream rounded-xl" />}>
          <RankingControls
            activeCategory={category}
            activePeriod={period}
            activeSort={sort}
          />
        </Suspense>
      </div>

      {/* Leaderboard */}
      <Suspense
        key={`${category}-${period}-${sort}`}
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-glowsouk-cream-dark animate-pulse">
                <div className="w-8 h-8 rounded-full bg-glowsouk-cream" />
                <div className="w-16 h-16 rounded-xl bg-glowsouk-cream" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-glowsouk-cream rounded w-1/4" />
                  <div className="h-4 bg-glowsouk-cream rounded w-1/2" />
                </div>
                <div className="w-20 space-y-1">
                  <div className="h-4 bg-glowsouk-cream rounded" />
                  <div className="h-3 bg-glowsouk-cream rounded" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <LeaderboardList category={category} period={period} sort={sort} />
      </Suspense>
    </div>
  )
}
