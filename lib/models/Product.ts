import mongoose, { Schema, Document, Model } from 'mongoose'
import slugify from 'slugify'

export interface ProductDocument extends Document {
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
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    style: { type: String, default: '' },
    color: [{ type: String }],
    sizes: [{ type: String }],
    images: [{ type: String }],
    rentalPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    available: { type: Boolean, default: true },
    offersRental: { type: Boolean, default: true },
    offersSale: { type: Boolean, default: false },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
  },
  { timestamps: true }
)

ProductSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true })
  }
  next()
})

const Product: Model<ProductDocument> =
  mongoose.models.Product || mongoose.model<ProductDocument>('Product', ProductSchema)

export default Product
