import Image from 'next/image'
import StarRating from './StarRating'
import HelpfulButton from './HelpfulButton'
import type { Review } from '@/lib/types'

interface ReviewCardProps {
  review: Review
  userId?: string | null
  hasVoted?: boolean
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const skinTypeLabels: Record<string, string> = {
  oily: 'Oily', dry: 'Dry', combination: 'Combination', normal: 'Normal', sensitive: 'Sensitive',
}

export default function ReviewCard({ review, userId = null, hasVoted = false }: ReviewCardProps) {
  const reviewer    = review.users
  const displayName = reviewer?.username || 'Anonymous'
  const initial     = displayName.charAt(0).toUpperCase()

  return (
    <div className="bg-white rounded-2xl p-5 border border-glowsouk-cream-dark hover:border-glowsouk-rose/30 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0">
          {reviewer?.avatar_url ? (
            <Image
              src={reviewer.avatar_url}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-glowsouk-rose flex items-center justify-center">
              <span className="text-white font-bold text-sm">{initial}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-glowsouk-dark text-sm truncate">{displayName}</p>
            <time className="text-xs text-glowsouk-dark-muted flex-shrink-0">
              {formatDate(review.created_at)}
            </time>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-glowsouk-dark-muted font-medium">{review.rating}/5</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {reviewer?.skin_type && (
              <span className="text-xs bg-glowsouk-cream px-2 py-0.5 rounded-full text-glowsouk-dark-muted">
                {skinTypeLabels[reviewer.skin_type] || reviewer.skin_type} skin
              </span>
            )}
            {reviewer?.nationality && (
              <span className="text-xs bg-glowsouk-cream px-2 py-0.5 rounded-full text-glowsouk-dark-muted">
                {reviewer.nationality}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Review text */}
      {review.review_text && (
        <p className="text-sm text-glowsouk-dark-muted leading-relaxed mt-2">
          {review.review_text}
        </p>
      )}

      {/* Review image */}
      {review.image_url && (
        <div className="mt-3">
          <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-glowsouk-cream-dark">
            <Image src={review.image_url} alt="Review photo" fill className="object-cover" />
          </div>
        </div>
      )}

      {/* Footer: helpful button */}
      <div className="mt-3 pt-3 border-t border-glowsouk-cream-dark flex items-center justify-between">
        <HelpfulButton
          reviewId={review.id}
          initialCount={review.helpful_count}
          initialHasVoted={hasVoted}
          userId={userId}
        />
        {!userId && (
          <p className="text-xs text-glowsouk-dark-muted/50">
            <a href="/auth/login" className="underline hover:text-glowsouk-rose">Sign in</a> to vote
          </p>
        )}
      </div>
    </div>
  )
}
