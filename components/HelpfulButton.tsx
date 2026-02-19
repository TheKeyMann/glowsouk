'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HelpfulButtonProps {
  reviewId: string
  initialCount: number
  initialHasVoted: boolean
  userId: string | null
}

export default function HelpfulButton({
  reviewId,
  initialCount,
  initialHasVoted,
  userId,
}: HelpfulButtonProps) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted)
  const [count, setCount]       = useState(initialCount)
  const [loading, setLoading]   = useState(false)
  const supabase = createClient()

  const handleToggle = async () => {
    if (!userId || loading) return
    setLoading(true)

    if (hasVoted) {
      const { error } = await supabase
        .from('review_votes')
        .delete()
        .eq('user_id', userId)
        .eq('review_id', reviewId)

      if (!error) {
        setHasVoted(false)
        setCount((c) => Math.max(0, c - 1))
      }
    } else {
      const { error } = await supabase
        .from('review_votes')
        .insert({ user_id: userId, review_id: reviewId })

      if (!error) {
        setHasVoted(true)
        setCount((c) => c + 1)
      }
    }

    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading || !userId}
      title={!userId ? 'Sign in to mark reviews as helpful' : hasVoted ? 'Remove helpful vote' : 'Mark as helpful'}
      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${
        !userId
          ? 'bg-glowsouk-cream text-glowsouk-dark-muted/50 cursor-not-allowed'
          : hasVoted
          ? 'bg-glowsouk-rose text-white shadow-sm'
          : 'bg-glowsouk-cream text-glowsouk-dark-muted hover:bg-glowsouk-rose/10 hover:text-glowsouk-rose'
      } disabled:opacity-60`}
    >
      <ThumbsUp className={`w-3 h-3 ${loading ? 'animate-pulse' : ''}`} />
      Helpful{count > 0 ? ` (${count})` : ''}
    </button>
  )
}
