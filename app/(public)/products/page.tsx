import { Suspense } from 'react'
import { connectDB } from '@/lib/db'
import Product from '@/lib/models/Product'
import { ProductCard } from '@/components/public/ProductCard'
import { ProductFilters } from '@/components/public/ProductFilters'
import { IProduct } from '@/types'

interface SearchParams {
  category?: string
  style?: string
  color?: string
  size?: string
}

export const metadata = {
  title: 'Collection',
  description: 'Browse our full collection of rental and sale dresses',
}

async function getProducts(filters: SearchParams): Promise<IProduct[]> {
  await connectDB()
  const query: Record<string, unknown> = {}
  if (filters.category) query.category = filters.category
  if (filters.style) query.style = filters.style
  if (filters.color) query.color = { $in: [filters.color] }
  if (filters.size) query.sizes = { $in: [filters.size] }

  const products = await Product.find(query).sort({ createdAt: -1 }).lean()
  return products.map((p) => ({
    _id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    description: p.description,
    category: p.category,
    style: p.style,
    color: p.color,
    sizes: p.sizes,
    images: p.images,
    rentalPrice: p.rentalPrice,
    salePrice: p.salePrice,
    available: p.available,
    offersRental: p.offersRental,
    offersSale: p.offersSale,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const filters = await searchParams
  const products = await getProducts(filters)

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Collection</h1>
        <p className="text-sm text-gray-500 mt-1">{products.length} items</p>
      </div>

      <div className="flex gap-10">
        <Suspense>
          <ProductFilters />
        </Suspense>

        <div className="flex-1">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">👗</div>
              <p className="text-gray-500">No products found. Try clearing the filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
