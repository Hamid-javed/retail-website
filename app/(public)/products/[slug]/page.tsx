import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { connectDB } from '@/lib/db'
import Product from '@/lib/models/Product'
import { ImageGallery } from '@/components/public/ImageGallery'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { Badge } from '@/components/ui/Badge'

interface Params {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await connectDB()
  const { slug } = await params
  const product = await Product.findOne({ slug }).lean()
  if (!product) return {}
  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.description,
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDescription || product.description,
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: Params) {
  await connectDB()
  const { slug } = await params
  const product = await Product.findOne({ slug }).lean()
  if (!product) notFound()

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
        <ImageGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-6">
          <div>
            {product.category && (
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
                {product.category}
              </p>
            )}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{product.name}</h1>
          </div>

          {!product.available && <Badge variant="red">Currently Unavailable</Badge>}

          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {product.color.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Colors</p>
              <div className="flex flex-wrap gap-2">
                {product.color.map((c) => (
                  <span key={c} className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Available Sizes</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <span key={s} className="text-sm border border-gray-300 px-3 py-1 rounded-full text-gray-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
            {product.offersRental && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Rental price (Lebanon)</span>
                <span className="font-bold text-gray-900">${product.rentalPrice}</span>
              </div>
            )}
            {product.offersSale && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Sale price (International)</span>
                <span className="font-bold text-gray-900">${product.salePrice}</span>
              </div>
            )}
          </div>

          {product.available && (
            <WhatsAppButton
              productName={product.name}
              offersRental={product.offersRental}
              offersSale={product.offersSale}
            />
          )}

          {product.style && (
            <p className="text-xs text-gray-400">Style: {product.style}</p>
          )}
        </div>
      </div>
    </div>
  )
}
