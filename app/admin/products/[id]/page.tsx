import { notFound } from 'next/navigation'
import { connectDB } from '@/lib/db'
import Product from '@/lib/models/Product'
import { ProductForm } from '@/components/admin/ProductForm'
import { IProduct } from '@/types'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connectDB()
  const { id } = await params
  const product = await Product.findById(id).lean()

  if (!product) notFound()

  const serialized: IProduct = {
    _id: product._id.toString(),
    name: product.name,
    slug: product.slug,
    description: product.description,
    category: product.category,
    style: product.style,
    color: product.color,
    sizes: product.sizes,
    images: product.images,
    rentalPrice: product.rentalPrice,
    salePrice: product.salePrice,
    available: product.available,
    offersRental: product.offersRental,
    offersSale: product.offersSale,
    metaTitle: product.metaTitle,
    metaDescription: product.metaDescription,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
      <ProductForm initialData={serialized} productId={serialized._id} />
    </div>
  )
}
