'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2 } from 'lucide-react'
import StarRating from './StarRating'
import { createClient } from '@/lib/supabase/client'

interface ReviewFormProps {
  productId: string
  userId: string
  onSuccess?: () => void
}

export default function ReviewForm({ productId, userId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError(null)
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Please select a star rating.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      let imageUrl: string | null = null

      // Upload review image if provided
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${userId}/${productId}-${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('review-images')
          .upload(path, imageFile, { upsert: true })

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('review-images')
          .getPublicUrl(path)
        imageUrl = publicUrl
      }

      // Insert review
      const { error: insertError } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          product_id: productId,
          rating,
          review_text: reviewText.trim() || null,
          image_url: imageUrl,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          throw new Error('You have already reviewed this product.')
        }
        throw new Error(insertError.message)
      }

      // Reset form
      setRating(0)
      setReviewText('')
      removeImage()
      router.refresh()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Star Rating */}
      <div>
        <label className="label">Your Rating *</label>
        <div className="flex items-center gap-3">
          <StarRating
            rating={rating}
            size="lg"
            interactive
            onRatingChange={setRating}
          />
          {rating > 0 && (
            <span className="text-sm font-medium text-glowsouk-dark-muted">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Review Text */}
      <div>
        <label htmlFor="review-text" className="label">
          Your Review <span className="text-glowsouk-dark-muted/50 font-normal">(optional)</span>
        </label>
        <textarea
          id="review-text"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your experience with this product. What did you like or dislike? Who would you recommend it to?"
          rows={4}
          maxLength={1000}
          className="input resize-none"
        />
        <p className="text-right text-xs text-glowsouk-dark-muted/50 mt-1">
          {reviewText.length}/1000
        </p>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="label">
          Add a Photo <span className="text-glowsouk-dark-muted/50 font-normal">(optional, max 5MB)</span>
        </label>

        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-28 h-28 object-cover rounded-xl border border-glowsouk-cream-dark"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-glowsouk-cream-dark rounded-xl text-sm text-glowsouk-dark-muted hover:border-glowsouk-rose hover:text-glowsouk-rose transition-colors"
          >
            <Camera className="w-4 h-4" />
            Upload photo
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
      )}

      {/* Submit */}
      <button type="submit" disabled={submitting || rating === 0} className="btn-primary w-full">
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Review'
        )}
      </button>
    </form>
  )
}
