import { Suspense } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import type { Product, ProductStats } from '@/lib/types'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

async function SearchResults({ query }: { query: string }) {
  if (!query.trim()) {
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-4">🔍</p>
        <h2 className="font-serif text-xl font-bold text-glowsouk-dark mb-2">Start searching</h2>
        <p className="text-glowsouk-dark-muted">Type a product name or brand in the header to search.</p>
      </div>
    )
  }

  const supabase = await createClient()

  const { data } = await supabase
    .from('products')
    .select(`
      *,
      product_stats (*)
    `)
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(24)

  const products = (data || []) as (Product & { product_stats: ProductStats })[]

  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-4">😔</p>
        <h2 className="font-serif text-xl font-bold text-glowsouk-dark mb-2">
          No results for &ldquo;{query}&rdquo;
        </h2>
        <p className="text-glowsouk-dark-muted mb-6">
          Try a different product name or brand.
        </p>
        <Link href="/products" className="btn-primary">
          Browse all products
        </Link>
      </div>
    )
  }

  return (
    <>
      <p className="text-sm text-glowsouk-dark-muted mb-6">
        Found <strong>{products.length}</strong> result{products.length !== 1 ? 's' : ''} for{' '}
        <strong>&ldquo;{query}&rdquo;</strong>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Search className="w-6 h-6 text-glowsouk-rose" />
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-glowsouk-dark">
            {query ? `Search results` : 'Search'}
          </h1>
        </div>
        {query && (
          <p className="text-glowsouk-dark-muted ml-9">
            Showing results for <em>&ldquo;{query}&rdquo;</em>
          </p>
        )}
      </div>

      <Suspense
        key={query}
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-square bg-glowsouk-cream animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-glowsouk-cream rounded animate-pulse w-1/3" />
                  <div className="h-4 bg-glowsouk-cream rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <SearchResults query={query} />
      </Suspense>
    </div>
  )
}
