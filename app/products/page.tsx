import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ProductCard from '@/components/ProductCard'
import CategoryFilter from '@/components/CategoryFilter'
import { CATEGORIES, type Category, type Product, type ProductStats } from '@/lib/types'
import { SlidersHorizontal } from 'lucide-react'

interface ProductsPageProps {
  searchParams: Promise<{
    category?: string
    sort?: string
    page?: string
  }>
}

const ITEMS_PER_PAGE = 12

async function ProductGrid({
  category,
  sort,
  page,
}: {
  category: Category | null
  sort: string
  page: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(`
      *,
      product_stats (*)
    `, { count: 'exact' })

  if (category) {
    query = query.eq('category', category)
  }

  // Sorting
  if (sort === 'top_rated') {
    query = query.order('avg_rating', { referencedTable: 'product_stats', ascending: false })
  } else if (sort === 'most_reviewed') {
    query = query.order('review_count', { referencedTable: 'product_stats', ascending: false })
  } else {
    // Newest first (default)
    query = query.order('created_at', { ascending: false })
  }

  const from = (page - 1) * ITEMS_PER_PAGE
  const to = from + ITEMS_PER_PAGE - 1
  query = query.range(from, to)

  const { data, count } = await query
  const products = (data || []) as (Product & { product_stats: ProductStats })[]
  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE)

  if (products.length === 0) {
    return (
      <div className="col-span-full text-center py-24">
        <p className="text-4xl mb-4">🌸</p>
        <h3 className="font-serif text-xl font-bold text-glowsouk-dark mb-2">No products found</h3>
        <p className="text-glowsouk-dark-muted">
          {category ? `No ${category} products yet.` : 'No products available.'}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/products?${category ? `category=${category}&` : ''}${sort !== 'newest' ? `sort=${sort}&` : ''}page=${p}`}
              className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-glowsouk-rose text-white'
                  : 'bg-white text-glowsouk-dark-muted hover:bg-glowsouk-cream border border-glowsouk-cream-dark'
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </>
  )
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams
  const rawCategory = params.category
  const validCategories = CATEGORIES.map(c => c.value) as string[]
  const category = (rawCategory && validCategories.includes(rawCategory) ? rawCategory : null) as Category | null
  const sort = params.sort || 'newest'
  const page = Math.max(1, parseInt(params.page || '1', 10))

  const categoryMeta = category ? CATEGORIES.find(c => c.value === category) : null

  const sortOptions = [
    { value: 'newest',       label: 'Newest' },
    { value: 'top_rated',    label: 'Top Rated' },
    { value: 'most_reviewed', label: 'Most Reviewed' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-glowsouk-dark mb-2">
          {categoryMeta ? (
            <span>{categoryMeta.emoji} {categoryMeta.label}</span>
          ) : (
            'All Products'
          )}
        </h1>
        {category && (
          <p className="text-glowsouk-dark-muted">
            Browse our community-reviewed {category} collection
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <Suspense fallback={<div className="h-10 bg-glowsouk-cream rounded-full w-96 animate-pulse" />}>
          <CategoryFilter activeCategory={category} />
        </Suspense>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-glowsouk-dark-muted" />
          <div className="flex rounded-xl border border-glowsouk-cream-dark bg-white overflow-hidden">
            {sortOptions.map((opt) => (
              <a
                key={opt.value}
                href={`/products?${category ? `category=${category}&` : ''}sort=${opt.value}`}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  sort === opt.value
                    ? 'bg-glowsouk-rose text-white'
                    : 'text-glowsouk-dark-muted hover:bg-glowsouk-cream'
                }`}
              >
                {opt.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <Suspense
        key={`${category}-${sort}-${page}`}
        fallback={
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-square bg-glowsouk-cream animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-glowsouk-cream rounded animate-pulse w-1/3" />
                  <div className="h-4 bg-glowsouk-cream rounded animate-pulse" />
                  <div className="h-3 bg-glowsouk-cream rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <ProductGrid category={category} sort={sort} page={page} />
      </Suspense>
    </div>
  )
}
