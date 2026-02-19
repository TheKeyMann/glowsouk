import Link from 'next/link'
import Image from 'next/image'
import StarRating from './StarRating'
import type { Product, ProductStats } from '@/lib/types'

interface ProductCardProps {
  product: Product & { product_stats?: ProductStats }
}

export default function ProductCard({ product }: ProductCardProps) {
  const stats = product.product_stats
  const avgRating = stats?.avg_rating ?? 0
  const reviewCount = stats?.review_count ?? 0

  const categoryColors: Record<string, string> = {
    skincare:  'bg-emerald-50 text-emerald-700',
    makeup:    'bg-pink-50 text-pink-700',
    haircare:  'bg-amber-50 text-amber-700',
    fragrance: 'bg-purple-50 text-purple-700',
    bodycare:  'bg-blue-50 text-blue-700',
  }

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="card overflow-hidden h-full flex flex-col">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-glowsouk-cream">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {product.category === 'skincare'  ? '✨' :
               product.category === 'makeup'    ? '💄' :
               product.category === 'haircare'  ? '💆' :
               product.category === 'fragrance' ? '🌸' : '🧴'}
            </div>
          )}

          {/* Category badge */}
          <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${categoryColors[product.category] || 'bg-gray-100 text-gray-600'}`}>
            {product.category}
          </span>
        </div>

        {/* Product Info */}
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs font-medium text-glowsouk-rose uppercase tracking-wide mb-0.5">
            {product.brand}
          </p>
          <h3 className="font-medium text-glowsouk-dark text-sm leading-snug line-clamp-2 flex-1 mb-2 group-hover:text-glowsouk-rose transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between mt-auto">
            <StarRating rating={avgRating} size="sm" showValue />
            <span className="text-xs text-glowsouk-dark-muted">
              {reviewCount > 0
                ? `${reviewCount} review${reviewCount !== 1 ? 's' : ''}`
                : 'No reviews yet'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
