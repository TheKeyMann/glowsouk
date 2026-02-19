import Link from 'next/link'
import { ArrowRight, Sparkles, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import { CATEGORIES, type Category, type Product, type ProductStats } from '@/lib/types'

async function getTopProductsByCategory(category: Category, limit = 4) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      product_stats (*)
    `)
    .eq('category', category)
    .order('review_count', { referencedTable: 'product_stats', ascending: false })
    .limit(limit)

  return (data || []) as (Product & { product_stats: ProductStats })[]
}

async function getFeaturedProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      product_stats (*)
    `)
    .order('avg_rating', { referencedTable: 'product_stats', ascending: false })
    .limit(8)

  return (data || []) as (Product & { product_stats: ProductStats })[]
}

export default async function HomePage() {
  const [featuredProducts, skincareProducts, makeupProducts, hairProducts] = await Promise.all([
    getFeaturedProducts(),
    getTopProductsByCategory('skincare', 4),
    getTopProductsByCategory('makeup', 4),
    getTopProductsByCategory('haircare', 4),
  ])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-glowsouk-rose/10 text-glowsouk-rose px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Honest reviews from real beauty lovers
            </div>
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-glowsouk-dark leading-tight mb-6">
              Discover beauty
              <br />
              <span className="text-glowsouk-rose">that truly</span>
              <br />
              works for you.
            </h1>
            <p className="text-lg text-glowsouk-dark-muted mb-8 leading-relaxed">
              Join thousands of beauty enthusiasts sharing honest reviews of skincare, makeup,
              haircare, fragrance and bodycare products. Find what works for your skin type.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary text-base px-8 py-3">
                Explore Products
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/signup" className="btn-secondary text-base px-8 py-3">
                Join the Community
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-glowsouk-rose/5" />
        <div className="absolute -right-10 top-20 w-64 h-64 rounded-full bg-glowsouk-gold/5" />
      </section>

      {/* Category pills */}
      <section className="border-b border-glowsouk-cream-dark bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map(({ value, label, emoji }) => (
              <Link
                key={value}
                href={`/products?category=${value}`}
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-glowsouk-cream hover:bg-glowsouk-rose hover:text-white text-glowsouk-dark-muted font-medium rounded-full transition-colors text-sm"
              >
                <span className="text-base">{emoji}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-glowsouk-gold fill-glowsouk-gold" />
                <span className="text-sm font-medium text-glowsouk-gold uppercase tracking-wide">Community Favorites</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-glowsouk-dark">
                Top Rated Products
              </h2>
            </div>
            <Link href="/products" className="btn-ghost hidden sm:inline-flex">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link href="/products" className="btn-secondary">
              View all products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Category Spotlights */}
      {[
        { products: skincareProducts, category: 'skincare', label: 'Skincare Picks', emoji: '✨' },
        { products: makeupProducts,   category: 'makeup',   label: 'Makeup Picks',   emoji: '💄' },
        { products: hairProducts,     category: 'haircare', label: 'Hair Heroes',    emoji: '💆' },
      ].map(({ products, category, label, emoji }) =>
        products.length > 0 ? (
          <section key={category} className="py-12 odd:bg-white even:bg-glowsouk-cream/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-glowsouk-dark">
                  <span className="mr-2">{emoji}</span>
                  {label}
                </h2>
                <Link
                  href={`/products?category=${category}`}
                  className="text-sm font-medium text-glowsouk-rose hover:text-glowsouk-rose-dark inline-flex items-center gap-1 transition-colors"
                >
                  See all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        ) : null
      )}

      {/* CTA Banner */}
      <section className="bg-glowsouk-plum text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Share your beauty story
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Your skin is unique. Your reviews help others find what truly works.
            Join our community and start reviewing today.
          </p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-glowsouk-plum font-semibold rounded-full hover:bg-glowsouk-cream transition-colors text-base">
            Create Free Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
