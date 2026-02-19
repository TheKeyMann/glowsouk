'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Camera, X, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/types'

const SUBCATEGORIES: Record<string, string[]> = {
  skincare:  ['serum', 'moisturizer', 'cleanser', 'toner', 'sunscreen', 'mask', 'eye cream', 'oil', 'exfoliant'],
  makeup:    ['foundation', 'lipstick', 'mascara', 'blush', 'highlighter', 'eyeshadow', 'bronzer', 'primer', 'concealer'],
  haircare:  ['shampoo', 'conditioner', 'treatment', 'oil', 'mask', 'serum', 'styling'],
  fragrance: ['eau de parfum', 'eau de toilette', 'eau de cologne', 'perfume oil', 'body mist'],
  bodycare:  ['body cream', 'body lotion', 'body oil', 'body wash', 'scrub', 'deodorant'],
}

export default function SubmitProductPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [description, setDescription] = useState('')
  const [countryOfOrigin, setCountryOfOrigin] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
      setAuthChecked(true)
    })
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setError('Image must be under 10MB'); return }
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
    if (!userId) { router.push('/auth/login?next=/products/submit'); return }

    setSubmitting(true)
    setError(null)

    try {
      let imageUrl: string | null = null

      if (imageFile) {
        const ext  = imageFile.name.split('.').pop()
        const path = `${userId}/${Date.now()}-${name.replace(/\s+/g, '-').toLowerCase()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, imageFile, { upsert: true })
        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`)
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
        imageUrl = publicUrl
      }

      const { error: insertError } = await supabase.from('products').insert({
        name:              name.trim(),
        brand:             brand.trim(),
        category,
        subcategory:       subcategory || null,
        description:       description.trim() || null,
        country_of_origin: countryOfOrigin.trim() || null,
        image_url:         imageUrl,
        status:            'pending',
      })

      if (insertError) throw new Error(insertError.message)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-glowsouk-rose" /></div>
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-3xl mb-4">🔒</p>
          <h2 className="font-serif text-xl font-bold text-glowsouk-dark mb-2">Sign in required</h2>
          <p className="text-glowsouk-dark-muted mb-5">You need an account to submit products.</p>
          <Link href="/auth/login?next=/products/submit" className="btn-primary">Sign in</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <h2 className="font-serif text-2xl font-bold text-glowsouk-dark mb-3">Product Submitted!</h2>
          <p className="text-glowsouk-dark-muted mb-6">
            Thanks for contributing to the community. Your product is pending review and will appear
            on the platform once approved by our team.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/products" className="btn-primary">Browse Products</Link>
            <button onClick={() => setSuccess(false)} className="btn-secondary">Submit Another</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-glowsouk-dark-muted hover:text-glowsouk-rose mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Products
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-glowsouk-dark mb-2">Submit a Product</h1>
        <p className="text-glowsouk-dark-muted">
          Can&apos;t find a product? Submit it for review and help grow the community catalog.
          All submissions are reviewed before going live.
        </p>
      </div>

      <div className="card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product name */}
          <div>
            <label className="label">Product Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Retinol 0.5% in Squalane"
              required
              maxLength={200}
              className="input"
            />
          </div>

          {/* Brand */}
          <div>
            <label className="label">Brand *</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. The Ordinary"
              required
              maxLength={100}
              className="input"
            />
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setSubcategory('') }}
                required
                className="input"
              >
                <option value="">Select…</option>
                {CATEGORIES.map(({ value, label, emoji }) => (
                  <option key={value} value={value}>{emoji} {label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Subcategory</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={!category}
                className="input disabled:opacity-50"
              >
                <option value="">Select…</option>
                {(SUBCATEGORIES[category] || []).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">
              Description <span className="font-normal text-glowsouk-dark-muted/50">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this product do? Key ingredients, who it's for…"
              rows={3}
              maxLength={500}
              className="input resize-none"
            />
          </div>

          {/* Country of origin */}
          <div>
            <label className="label">
              Country of Origin <span className="font-normal text-glowsouk-dark-muted/50">(optional)</span>
            </label>
            <input
              type="text"
              value={countryOfOrigin}
              onChange={(e) => setCountryOfOrigin(e.target.value)}
              placeholder="e.g. France, South Korea, USA"
              maxLength={50}
              className="input"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="label">
              Product Image <span className="font-normal text-glowsouk-dark-muted/50">(optional, max 10MB)</span>
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-xl border border-glowsouk-cream-dark" />
                <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-glowsouk-cream-dark rounded-xl text-sm text-glowsouk-dark-muted hover:border-glowsouk-rose hover:text-glowsouk-rose transition-colors"
              >
                <Camera className="w-4 h-4" /> Upload product image
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

          <div className="pt-2">
            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : 'Submit for Review'}
            </button>
            <p className="text-xs text-center text-glowsouk-dark-muted/50 mt-3">
              Submissions are reviewed within 2–3 business days.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
