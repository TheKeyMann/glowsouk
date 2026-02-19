'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES, type Category } from '@/lib/types'

interface RankingControlsProps {
  activeCategory: Category | null
  activePeriod: string
  activeSort: string
}

export default function RankingControls({
  activeCategory,
  activePeriod,
  activeSort,
}: RankingControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    router.push(`/ranking?${params.toString()}`)
  }

  const periods = [
    { value: 'all',   label: 'All Time' },
    { value: 'month', label: 'This Month' },
    { value: 'week',  label: 'This Week' },
  ]

  const sorts = [
    { value: 'avg_rating',   label: 'Top Rated' },
    { value: 'review_count', label: 'Most Reviewed' },
  ]

  return (
    <div className="space-y-4">
      {/* Period toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-glowsouk-dark-muted w-16">Period:</span>
        <div className="flex rounded-xl border border-glowsouk-cream-dark bg-white overflow-hidden">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => update('period', p.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activePeriod === p.value
                  ? 'bg-glowsouk-plum text-white'
                  : 'text-glowsouk-dark-muted hover:bg-glowsouk-cream'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-glowsouk-dark-muted w-16">Sort by:</span>
        <div className="flex rounded-xl border border-glowsouk-cream-dark bg-white overflow-hidden">
          {sorts.map((s) => (
            <button
              key={s.value}
              onClick={() => update('sort', s.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeSort === s.value
                  ? 'bg-glowsouk-rose text-white'
                  : 'text-glowsouk-dark-muted hover:bg-glowsouk-cream'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-start gap-2 flex-wrap">
        <span className="text-sm font-medium text-glowsouk-dark-muted w-16 mt-2">Category:</span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.delete('category')
              router.push(`/ranking?${params.toString()}`)
            }}
            className={`category-pill ${!activeCategory ? 'category-pill-active' : 'category-pill-inactive'}`}
          >
            All
          </button>
          {CATEGORIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => update('category', value)}
              className={`category-pill ${activeCategory === value ? 'category-pill-active' : 'category-pill-inactive'}`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
