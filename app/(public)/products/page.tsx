import { Suspense } from 'react'
import { connectDB } from '@/lib/db'
import Product from '@/lib/models/Product'
import { ProductCard } from '@/components/public/ProductCard'
import { ProductFilters } from '@/components/public/ProductFilters'
import { ProductSearch } from '@/components/public/ProductSearch'
import { IProduct } from '@/types'

interface SearchParams {
  category?: string
  style?: string
  color?: string
  size?: string
  q?: string
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
  if (filters.q) query.name = { $regex: filters.q, $options: 'i' }

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
      <div className="mb-10 pb-6 border-b border-neutral-200">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2 text-neutral-400">Dress Rental & Sales</p>
        <div className="flex items-end justify-between gap-4">
          <h1 className="text-4xl font-bold tracking-tight text-black">Collection</h1>
          <div className="flex items-center gap-4 mb-1">
            <Suspense>
              <ProductSearch />
            </Suspense>
            <p className="text-sm shrink-0 text-neutral-400">{products.length} pieces</p>
          </div>
        </div>
      </div>

      <div className="flex gap-10">
        <Suspense>
          <ProductFilters />
        </Suspense>

        <div className="flex-1">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-neutral-600">No pieces found.</p>
              <p className="text-xs mt-1 text-neutral-400">Try clearing the filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10">
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
