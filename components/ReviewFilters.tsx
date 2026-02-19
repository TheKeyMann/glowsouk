'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Star } from 'lucide-react'

interface ReviewFiltersProps {
  activeSort: string
  activeRating: number | null
  reviewCount: number
}

export default function ReviewFilters({ activeSort, activeRating, reviewCount }: ReviewFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const sortOptions = [
    { value: 'newest',       label: 'Newest' },
    { value: 'highest',      label: 'Highest Rated' },
    { value: 'most_helpful', label: 'Most Helpful' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort */}
      <div className="flex rounded-xl border border-glowsouk-cream-dark bg-white overflow-hidden">
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update('review_sort', opt.value)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              activeSort === opt.value
                ? 'bg-glowsouk-dark text-white'
                : 'text-glowsouk-dark-muted hover:bg-glowsouk-cream'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Star filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-glowsouk-dark-muted font-medium">Filter:</span>
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            onClick={() => update('review_rating', activeRating === star ? null : String(star))}
            className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
              activeRating === star
                ? 'bg-glowsouk-gold text-white border-glowsouk-gold'
                : 'bg-white border-glowsouk-cream-dark text-glowsouk-dark-muted hover:border-glowsouk-gold hover:text-glowsouk-gold'
            }`}
          >
            {star} <Star className="w-2.5 h-2.5 fill-current" />
          </button>
        ))}
        {activeRating && (
          <button
            onClick={() => update('review_rating', null)}
            className="text-xs text-glowsouk-rose hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <span className="text-xs text-glowsouk-dark-muted ml-auto">
        {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
      </span>
    </div>
  )
}
