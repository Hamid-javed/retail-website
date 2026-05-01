import Link from 'next/link'
import { connectDB } from '@/lib/db'
import Product from '@/lib/models/Product'
import { ProductCard } from '@/components/public/ProductCard'
import { RegionSelector } from '@/components/public/RegionSelector'
import { IProduct } from '@/types'

export default async function HomePage() {
  await connectDB()
  const products = await Product.find({ available: true }).sort({ createdAt: -1 }).limit(8).lean()

  const featured: IProduct[] = products.map((p) => ({
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

  return (
    <div>
      {/* Hero */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-gradient-to-b from-gray-50 to-white">
        <p className="text-sm font-medium text-gray-400 tracking-widest uppercase mb-4">Luxury Dress</p>
        <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 leading-tight max-w-2xl mb-6">
          Rent or Own Your Perfect Dress
        </h1>
        <p className="text-lg text-gray-500 max-w-md mb-10">
          Premium dresses for every occasion. Rent in Lebanon or purchase internationally.
        </p>
        <RegionSelector />
        <div className="mt-8 flex gap-4">
          <Link
            href="/products"
            className="bg-black text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Browse Collection
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}?text=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20dresses`}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Latest Arrivals</h2>
            <Link href="/products" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-black text-white w-7 h-7 rounded-full flex items-center justify-center text-xs">🇱🇧</span>
                Renting in Lebanon
              </h3>
              <ol className="flex flex-col gap-4">
                {[
                  'Browse our collection and pick your dress',
                  'Contact us on WhatsApp to confirm availability and dates',
                  'Receive your dress, wear it, and return it',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-black text-white w-7 h-7 rounded-full flex items-center justify-center text-xs">🌍</span>
                Buying Internationally
              </h3>
              <ol className="flex flex-col gap-4">
                {[
                  'Browse and select your dress',
                  'Contact us on WhatsApp to arrange purchase and shipping',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
