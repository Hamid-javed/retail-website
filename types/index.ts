export interface IProduct {
  _id: string
  name: string
  slug: string
  description: string
  category: string
  style: string
  color: string[]
  sizes: string[]
  images: string[]
  rentalPrice: number
  salePrice: number
  available: boolean
  offersRental: boolean
  offersSale: boolean
  metaTitle: string
  metaDescription: string
  createdAt: string
  updatedAt: string
}

export type Region = 'lebanon' | 'international'

export interface ProductFilters {
  category?: string
  style?: string
  color?: string
  size?: string
  available?: boolean
  region?: Region
}
