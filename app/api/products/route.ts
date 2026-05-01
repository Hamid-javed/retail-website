import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import Product from '@/lib/models/Product'
import { isAdminRequest } from '@/lib/apiAuth'
import slugify from 'slugify'

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  category: z.string().default(''),
  style: z.string().default(''),
  color: z.array(z.string()).default([]),
  sizes: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  rentalPrice: z.number().min(0).default(0),
  salePrice: z.number().min(0).default(0),
  available: z.boolean().default(true),
  offersRental: z.boolean().default(true),
  offersSale: z.boolean().default(false),
  metaTitle: z.string().default(''),
  metaDescription: z.string().default(''),
  slug: z.string().optional(),
})

export async function GET(request: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(request.url)
  const query: Record<string, unknown> = {}

  const category = searchParams.get('category')
  const style = searchParams.get('style')
  const color = searchParams.get('color')
  const size = searchParams.get('size')
  const available = searchParams.get('available')

  if (category) query.category = category
  if (style) query.style = style
  if (color) query.color = { $in: [color] }
  if (size) query.sizes = { $in: [size] }
  if (available === 'true') query.available = true

  const products = await Product.find(query).sort({ createdAt: -1 }).lean()
  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()
    const body = await request.json()
    const data = productSchema.parse(body)

    const slug = data.slug || slugify(data.name, { lower: true, strict: true })
    const product = await Product.create({ ...data, slug })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
