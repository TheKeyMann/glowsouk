'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  showValue?: boolean
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showValue = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const displayRating = interactive ? (hovered || rating) : rating

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1
        const filled = starValue <= displayRating
        const halfFilled = !filled && starValue - 0.5 <= displayRating

        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={interactive ? () => onRatingChange?.(starValue) : undefined}
            onMouseEnter={interactive ? () => setHovered(starValue) : undefined}
            onMouseLeave={interactive ? () => setHovered(0) : undefined}
            className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            aria-label={interactive ? `Rate ${starValue} star${starValue > 1 ? 's' : ''}` : undefined}
          >
            {halfFilled ? (
              <span className="relative inline-block">
                <Star className={`${sizeMap[size]} text-glowsouk-cream-dark fill-glowsouk-cream-dark`} />
                <span className="absolute inset-0 w-1/2 overflow-hidden">
                  <Star className={`${sizeMap[size]} text-glowsouk-gold fill-glowsouk-gold`} />
                </span>
              </span>
            ) : (
              <Star
                className={`${sizeMap[size]} transition-colors ${
                  filled
                    ? 'text-glowsouk-gold fill-glowsouk-gold'
                    : 'text-glowsouk-cream-dark fill-glowsouk-cream-dark'
                } ${interactive && hovered >= starValue ? 'text-glowsouk-gold fill-glowsouk-gold' : ''}`}
              />
            )}
          </button>
        )
      })}
      {showValue && (
        <span className="ml-1.5 text-sm font-semibold text-glowsouk-dark">
          {rating > 0 ? rating.toFixed(1) : '—'}
        </span>
      )}
    </div>
  )
}
