import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Decorative */}
        <div className="relative inline-block mb-8">
          <div className="font-serif text-[120px] font-bold text-glowsouk-cream-dark leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl animate-bounce">🌸</span>
          </div>
        </div>

        <h1 className="font-serif text-3xl font-bold text-glowsouk-dark mb-3">
          This page doesn&apos;t exist
        </h1>
        <p className="text-glowsouk-dark-muted mb-8">
          The product, page or link you&apos;re looking for has moved, been removed, or never existed.
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link href="/products" className="btn-secondary">
            Browse Products
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-10 pt-6 border-t border-glowsouk-cream-dark">
          <p className="text-sm text-glowsouk-dark-muted mb-3">Or jump to a category:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { href: '/products?category=skincare',  label: '✨ Skincare' },
              { href: '/products?category=makeup',    label: '💄 Makeup' },
              { href: '/products?category=haircare',  label: '💆 Haircare' },
              { href: '/products?category=fragrance', label: '🌸 Fragrance' },
              { href: '/products?category=bodycare',  label: '🧴 Bodycare' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm px-3 py-1.5 bg-white rounded-full border border-glowsouk-cream-dark text-glowsouk-dark-muted hover:border-glowsouk-rose hover:text-glowsouk-rose transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
