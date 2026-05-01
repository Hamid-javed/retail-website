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
      <section className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-white">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-4 text-neutral-400">Luxury Dress</p>
        <h1 className="text-5xl sm:text-7xl font-bold leading-tight max-w-2xl mb-6 text-black">
          Rent or Own Your Perfect Dress
        </h1>
        <p className="text-lg text-neutral-500 max-w-md mb-10">
          Premium dresses for every occasion. Rent in Lebanon or purchase internationally.
        </p>
        <RegionSelector />
        <div className="mt-8 flex gap-4">
          <Link
            href="/products"
            className="px-8 py-3 rounded-full text-sm font-semibold bg-black text-white hover:bg-neutral-800 transition-colors"
          >
            Browse Collection
          </Link>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}?text=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20dresses`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 rounded-full text-sm font-medium border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="border-t border-neutral-100" />
      </div>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-2xl font-bold text-black">Latest Arrivals</h2>
            <Link href="/products" className="text-sm text-neutral-500 hover:text-black transition-colors">
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
      <section className="py-16 bg-neutral-50 border-t border-neutral-100">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-black text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="font-semibold text-black mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-xs text-white">🇱🇧</span>
                Renting in Lebanon
              </h3>
              <ol className="flex flex-col gap-4">
                {[
                  'Browse our collection and pick your dress',
                  'Contact us on WhatsApp to confirm availability and dates',
                  'Receive your dress, wear it, and return it',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-neutral-600">
                    <span className="bg-neutral-200 text-neutral-700 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-black mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-xs text-white">🌍</span>
                Buying Internationally
              </h3>
              <ol className="flex flex-col gap-4">
                {[
                  'Browse and select your dress',
                  'Contact us on WhatsApp to arrange purchase and shipping',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-neutral-600">
                    <span className="bg-neutral-200 text-neutral-700 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold">
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
