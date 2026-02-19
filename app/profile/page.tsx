import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, MessageSquare, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import StarRating from '@/components/StarRating'
import ProfileEditForm from './ProfileEditForm'
import type { User, Review, Product } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Profile' }

type ReviewWithProduct = Review & {
  products: Pick<Product, 'id' | 'name' | 'brand' | 'category' | 'image_url'>
}

const categoryEmojis: Record<string, string> = {
  skincare: '✨', makeup: '💄', haircare: '💆', fragrance: '🌸', bodycare: '🧴',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-AE', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) redirect('/auth/login?next=/profile')

  const [profileResult, reviewsResult] = await Promise.all([
    supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single(),
    supabase
      .from('reviews')
      .select('*, products(id, name, brand, category, image_url)')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false }),
  ])

  const profile = profileResult.data as User | null
  const reviews = (reviewsResult.data || []) as ReviewWithProduct[]

  if (!profile) redirect('/auth/login')

  const totalReviews = reviews.length
  const avgGiven =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

  // Rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile header */}
      <div className="card p-6 mb-8">
        <div className="flex items-start gap-5 mb-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.username || 'Profile'}
                width={72}
                height={72}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-glowsouk-rose flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  {(profile.username || profile.email).charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Name & email */}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl font-bold text-glowsouk-dark">
              {profile.username || profile.email.split('@')[0]}
            </h1>
            <p className="text-sm text-glowsouk-dark-muted">{profile.email}</p>
            <p className="text-xs text-glowsouk-dark-muted/50 mt-1">
              Member since {formatDate(profile.created_at)}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center bg-glowsouk-cream rounded-xl py-3 px-2">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <MessageSquare className="w-4 h-4 text-glowsouk-rose" />
              <span className="text-2xl font-bold font-serif text-glowsouk-dark">{totalReviews}</span>
            </div>
            <p className="text-xs text-glowsouk-dark-muted">Reviews</p>
          </div>
          <div className="text-center bg-glowsouk-cream rounded-xl py-3 px-2">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <Star className="w-4 h-4 text-glowsouk-gold fill-glowsouk-gold" />
              <span className="text-2xl font-bold font-serif text-glowsouk-dark">
                {totalReviews > 0 ? avgGiven.toFixed(1) : '—'}
              </span>
            </div>
            <p className="text-xs text-glowsouk-dark-muted">Avg Rating Given</p>
          </div>
          <div className="text-center bg-glowsouk-cream rounded-xl py-3 px-2">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <span className="text-2xl font-bold font-serif text-glowsouk-dark">
                {reviews.reduce((sum, r) => sum + r.helpful_count, 0)}
              </span>
            </div>
            <p className="text-xs text-glowsouk-dark-muted">Helpful Votes</p>
          </div>
        </div>

        {/* Edit form */}
        <ProfileEditForm profile={profile} />
      </div>

      {/* Rating distribution */}
      {totalReviews > 0 && (
        <div className="card p-5 mb-8">
          <h2 className="font-serif text-lg font-bold text-glowsouk-dark mb-4">My Rating Distribution</h2>
          <div className="space-y-2">
            {ratingCounts.map(({ star, count }) => (
              <div key={star} className="flex items-center gap-3 text-sm">
                <span className="w-4 text-right text-glowsouk-dark-muted font-medium">{star}</span>
                <div className="flex-1 bg-glowsouk-cream rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-glowsouk-gold rounded-full transition-all duration-700"
                    style={{ width: totalReviews > 0 ? `${(count / totalReviews) * 100}%` : '0%' }}
                  />
                </div>
                <span className="w-6 text-xs text-glowsouk-dark-muted">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-glowsouk-dark mb-5">
          My Reviews {totalReviews > 0 && <span className="text-glowsouk-dark-muted text-lg font-normal">({totalReviews})</span>}
        </h2>

        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-glowsouk-cream-dark">
            <p className="text-4xl mb-3">✍️</p>
            <h3 className="font-serif text-lg font-bold text-glowsouk-dark mb-2">No reviews yet</h3>
            <p className="text-glowsouk-dark-muted text-sm mb-5">
              Start reviewing products to help the community find what works.
            </p>
            <Link href="/products" className="btn-primary">
              Browse Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const product = review.products
              return (
                <div key={review.id} className="card p-5">
                  <div className="flex gap-4">
                    {/* Product thumbnail */}
                    <Link href={`/products/${product?.id}`} className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-glowsouk-cream">
                        {product?.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {categoryEmojis[product?.category || ''] || '🌸'}
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Review content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-glowsouk-rose uppercase tracking-wide">
                            {product?.brand}
                          </p>
                          <Link href={`/products/${product?.id}`} className="font-semibold text-glowsouk-dark hover:text-glowsouk-rose transition-colors text-sm line-clamp-1">
                            {product?.name}
                          </Link>
                        </div>
                        <time className="text-xs text-glowsouk-dark-muted flex-shrink-0">
                          {formatDate(review.created_at)}
                        </time>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-xs text-glowsouk-dark-muted">{review.rating}/5</span>
                      </div>

                      {review.review_text && (
                        <p className="text-sm text-glowsouk-dark-muted mt-2 line-clamp-2">
                          {review.review_text}
                        </p>
                      )}

                      {review.helpful_count > 0 && (
                        <p className="text-xs text-glowsouk-dark-muted/60 mt-2">
                          👍 {review.helpful_count} found this helpful
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
