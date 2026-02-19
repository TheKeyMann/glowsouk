'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORIES } from '@/lib/types'
import type { Category } from '@/lib/types'

interface CategoryFilterProps {
  activeCategory?: Category | null
}

export default function CategoryFilter({ activeCategory }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSelect = (category: Category | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    params.delete('page') // reset pagination
    router.push(`/products?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleSelect(null)}
        className={`category-pill ${!activeCategory ? 'category-pill-active' : 'category-pill-inactive'}`}
      >
        All
      </button>
      {CATEGORIES.map(({ value, label, emoji }) => (
        <button
          key={value}
          onClick={() => handleSelect(value)}
          className={`category-pill ${activeCategory === value ? 'category-pill-active' : 'category-pill-inactive'}`}
        >
          <span>{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  )
}
