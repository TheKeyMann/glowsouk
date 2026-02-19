export type Category = 'skincare' | 'makeup' | 'haircare' | 'fragrance' | 'bodycare'

export interface User {
  id: string
  email: string
  username: string | null
  avatar_url: string | null
  skin_type: 'oily' | 'dry' | 'combination' | 'normal' | 'sensitive' | null
  nationality: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  brand: string
  category: Category
  subcategory: string | null
  description: string | null
  image_url: string | null
  country_of_origin: string | null
  created_at: string
  product_stats?: ProductStats
}

export interface Review {
  id: string
  user_id: string
  product_id: string
  rating: number
  review_text: string | null
  image_url: string | null
  helpful_count: number
  created_at: string
  users?: Pick<User, 'id' | 'username' | 'avatar_url' | 'skin_type' | 'nationality'>
}

export interface ProductStats {
  product_id: string
  avg_rating: number
  review_count: number
  updated_at: string
}

export interface ProductWithStats extends Product {
  product_stats: ProductStats
}

export const CATEGORIES: { value: Category; label: string; emoji: string }[] = [
  { value: 'skincare',   label: 'Skincare',   emoji: '✨' },
  { value: 'makeup',     label: 'Makeup',     emoji: '💄' },
  { value: 'haircare',   label: 'Haircare',   emoji: '💆' },
  { value: 'fragrance',  label: 'Fragrance',  emoji: '🌸' },
  { value: 'bodycare',   label: 'Bodycare',   emoji: '🧴' },
]
