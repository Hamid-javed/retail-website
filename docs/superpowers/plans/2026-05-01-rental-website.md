# Rental Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Next.js dress rental/sales website with MongoDB, WhatsApp rental flow, region-aware pricing (Lebanon = rent, International = buy), and a Shopify-like admin panel.

**Architecture:** Single Next.js 16 App Router monorepo. Public site at `/`, admin at `/admin/*` protected by JWT httpOnly cookie middleware. All backend logic in Next.js API routes. MongoDB via Mongoose.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, MongoDB, Mongoose, jsonwebtoken, zod, slugify, cloudinary (optional), Vitest + @testing-library/react

---

## File Map

| File | Responsibility |
|------|---------------|
| `lib/db.ts` | MongoDB connection singleton |
| `lib/models/Product.ts` | Mongoose Product schema + model |
| `lib/auth.ts` | JWT sign/verify helpers |
| `lib/upload.ts` | Image upload (Cloudinary or local) |
| `middleware.ts` | Protect `/admin/*` routes |
| `app/api/auth/route.ts` | POST login, DELETE logout |
| `app/api/products/route.ts` | GET list, POST create |
| `app/api/products/[id]/route.ts` | GET one, PUT update, DELETE remove |
| `app/api/upload/route.ts` | POST image upload |
| `app/(public)/layout.tsx` | Public layout (nav, footer) |
| `app/(public)/page.tsx` | Homepage |
| `app/(public)/products/page.tsx` | Product listing with filters |
| `app/(public)/products/[slug]/page.tsx` | Product detail |
| `app/admin/layout.tsx` | Admin layout (sidebar) |
| `app/admin/login/page.tsx` | Admin login form |
| `app/admin/products/page.tsx` | Admin product list |
| `app/admin/products/new/page.tsx` | Add product |
| `app/admin/products/[id]/page.tsx` | Edit product |
| `app/sitemap.ts` | Dynamic sitemap |
| `app/robots.ts` | robots.txt |
| `components/ui/Button.tsx` | Reusable button |
| `components/ui/Input.tsx` | Reusable input |
| `components/ui/Badge.tsx` | Reusable badge |
| `components/admin/ProductForm.tsx` | Shared add/edit product form |
| `components/admin/ImageUpload.tsx` | Drag-drop image upload widget |
| `components/public/RegionSelector.tsx` | Lebanon / International picker |
| `components/public/ProductCard.tsx` | Product card for listing grid |
| `components/public/ImageGallery.tsx` | Main + thumbnail gallery |
| `types/index.ts` | Shared TypeScript types |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install mongoose jsonwebtoken zod slugify cloudinary
```

- [ ] **Step 2: Install type definitions and dev tools**

```bash
npm install --save-dev @types/jsonwebtoken vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Add vitest config**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 4: Create vitest setup file**

Create `vitest.setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Add test script to package.json**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 6: Create .env.local**

```env
MONGODB_URI=mongodb://localhost:27017/rental-website
ADMIN_PASSWORD=changeme
JWT_SECRET=supersecretjwtsecret
WHATSAPP_NUMBER=9611234567
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

- [ ] **Step 7: Commit**

```bash
git add package.json vitest.config.ts vitest.setup.ts .env.local
git commit -m "chore: add dependencies and test config"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Write types**

```typescript
// types/index.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: MongoDB Connection

**Files:**
- Create: `lib/db.ts`
- Create: `lib/__tests__/db.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/__tests__/db.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('mongoose', () => ({
  default: {
    connect: vi.fn().mockResolvedValue({}),
    connection: { readyState: 0 },
  },
}))

describe('connectDB', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('calls mongoose.connect with MONGODB_URI', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/test'
    const mongoose = (await import('mongoose')).default
    const { connectDB } = await import('../db')
    await connectDB()
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test')
  })

  it('throws if MONGODB_URI is not set', async () => {
    delete process.env.MONGODB_URI
    await expect(async () => {
      const { connectDB } = await import('../db')
      await connectDB()
    }).rejects.toThrow('MONGODB_URI')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- lib/__tests__/db.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement connectDB**

Create `lib/db.ts`:
```typescript
import mongoose from 'mongoose'

declare global {
  var _mongoConn: Promise<typeof mongoose> | undefined
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI environment variable is not set')
  if (global._mongoConn) {
    await global._mongoConn
    return
  }
  global._mongoConn = mongoose.connect(uri)
  await global._mongoConn
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- lib/__tests__/db.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts lib/__tests__/db.test.ts
git commit -m "feat: add MongoDB connection singleton"
```

---

## Task 4: Product Model

**Files:**
- Create: `lib/models/Product.ts`

- [ ] **Step 1: Create Mongoose model**

```typescript
// lib/models/Product.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/models/Product.ts
git commit -m "feat: add Product Mongoose model"
```

---

## Task 5: Auth Utilities

**Files:**
- Create: `lib/auth.ts`
- Create: `lib/__tests__/auth.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/__tests__/auth.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'

describe('auth helpers', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'testsecret'
    process.env.ADMIN_PASSWORD = 'testpassword'
  })

  it('signToken returns a string', async () => {
    const { signToken } = await import('../auth')
    const token = signToken()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(10)
  })

  it('verifyToken returns payload for valid token', async () => {
    const { signToken, verifyToken } = await import('../auth')
    const token = signToken()
    const payload = verifyToken(token)
    expect(payload).toBeTruthy()
  })

  it('verifyToken returns null for invalid token', async () => {
    const { verifyToken } = await import('../auth')
    const result = verifyToken('invalid.token.here')
    expect(result).toBeNull()
  })

  it('checkPassword returns true for correct password', async () => {
    const { checkPassword } = await import('../auth')
    expect(checkPassword('testpassword')).toBe(true)
  })

  it('checkPassword returns false for wrong password', async () => {
    const { checkPassword } = await import('../auth')
    expect(checkPassword('wrongpassword')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npm run test -- lib/__tests__/auth.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement auth helpers**

Create `lib/auth.ts`:
```typescript
import jwt from 'jsonwebtoken'

const COOKIE_NAME = 'admin_token'

export function signToken(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return jwt.sign({ admin: true }, secret, { expiresIn: '7d' })
}

export function verifyToken(token: string): jwt.JwtPayload | null {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    return jwt.verify(token, secret) as jwt.JwtPayload
  } catch {
    return null
  }
}

export function checkPassword(input: string): boolean {
  return input === process.env.ADMIN_PASSWORD
}

export { COOKIE_NAME }
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npm run test -- lib/__tests__/auth.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/auth.ts lib/__tests__/auth.test.ts
git commit -m "feat: add JWT auth helpers"
```

---

## Task 6: Middleware (Protect Admin Routes)

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Implement middleware**

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add admin route protection middleware"
```

---

## Task 7: Auth API Route

**Files:**
- Create: `app/api/auth/route.ts`

- [ ] **Step 1: Implement auth route**

```typescript
// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkPassword, signToken, COOKIE_NAME } from '@/lib/auth'

const loginSchema = z.object({
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = loginSchema.parse(body)

    if (!checkPassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = signToken()
    const response = NextResponse.json({ ok: true })
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(COOKIE_NAME)
  return response
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/auth/route.ts
git commit -m "feat: add auth API route (login/logout)"
```

---

## Task 8: Products API Routes

**Files:**
- Create: `app/api/products/route.ts`
- Create: `app/api/products/[id]/route.ts`
- Create: `lib/apiAuth.ts`

- [ ] **Step 1: Create API auth guard helper**

Create `lib/apiAuth.ts`:
```typescript
import { NextRequest } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export function isAdminRequest(request: NextRequest): boolean {
  const token = request.cookies.get(COOKIE_NAME)?.value
  return !!token && !!verifyToken(token)
}
```

- [ ] **Step 2: Implement products list/create route**

Create `app/api/products/route.ts`:
```typescript
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
```

- [ ] **Step 3: Implement product detail/update/delete route**

Create `app/api/products/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import Product from '@/lib/models/Product'
import { isAdminRequest } from '@/lib/apiAuth'
import slugify from 'slugify'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  style: z.string().optional(),
  color: z.array(z.string()).optional(),
  sizes: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  rentalPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  available: z.boolean().optional(),
  offersRental: z.boolean().optional(),
  offersSale: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB()
  const { id } = await params
  const product = await Product.findById(id).lean()
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await connectDB()
    const { id } = await params
    const body = await request.json()
    const data = updateSchema.parse(body)

    if (data.name && !data.slug) {
      data.slug = slugify(data.name, { lower: true, strict: true })
    }

    const product = await Product.findByIdAndUpdate(id, data, { new: true }).lean()
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(product)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await connectDB()
  const { id } = await params
  const product = await Product.findByIdAndDelete(id)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/products/ lib/apiAuth.ts
git commit -m "feat: add products CRUD API routes"
```

---

## Task 9: Image Upload API Route

**Files:**
- Create: `lib/upload.ts`
- Create: `app/api/upload/route.ts`

- [ ] **Step 1: Create upload helper**

Create `lib/upload.ts`:
```typescript
import { writeFile } from 'fs/promises'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'

export async function uploadImage(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  if (process.env.CLOUDINARY_URL) {
    return uploadToCloudinary(buffer, file.name)
  }
  return saveLocally(buffer, file.name)
}

async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: 'rental-website', public_id: filename.replace(/\.[^/.]+$/, '') },
        (error, result) => {
          if (error || !result) reject(error || new Error('Upload failed'))
          else resolve(result.secure_url)
        }
      )
      .end(buffer)
  })
}

async function saveLocally(buffer: Buffer, filename: string): Promise<string> {
  const uniqueName = `${Date.now()}-${filename.replace(/\s+/g, '-')}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await writeFile(path.join(uploadDir, uniqueName), buffer)
  return `/uploads/${uniqueName}`
}
```

- [ ] **Step 2: Create uploads directory**

```bash
mkdir -p public/uploads
echo "" > public/uploads/.gitkeep
```

- [ ] **Step 3: Implement upload route**

Create `app/api/upload/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/apiAuth'
import { uploadImage } from '@/lib/upload'

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const url = await uploadImage(file)
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Add public/uploads to .gitignore (keep .gitkeep)**

Append to `.gitignore`:
```
public/uploads/*
!public/uploads/.gitkeep
```

- [ ] **Step 5: Commit**

```bash
git add lib/upload.ts app/api/upload/route.ts public/uploads/.gitkeep .gitignore
git commit -m "feat: add image upload API (Cloudinary or local fallback)"
```

---

## Task 10: Base UI Components

**Files:**
- Create: `components/ui/Button.tsx`
- Create: `components/ui/Input.tsx`
- Create: `components/ui/Badge.tsx`
- Create: `components/ui/Toggle.tsx`

- [ ] **Step 1: Create Button component**

```typescript
// components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-black text-white hover:bg-gray-800',
  secondary: 'bg-white text-black border border-gray-300 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-gray-600 hover:bg-gray-100',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Create Input component**

```typescript
// components/ui/Input.tsx
import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-50 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
```

- [ ] **Step 3: Create Textarea component**

```typescript
// components/ui/Textarea.tsx
import { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-black focus:ring-1 focus:ring-black disabled:bg-gray-50 resize-y min-h-[100px] ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
```

- [ ] **Step 4: Create Badge component**

```typescript
// components/ui/Badge.tsx
interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'gray' | 'blue'
}

const variants = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 5: Create Toggle component**

```typescript
// components/ui/Toggle.tsx
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
          checked ? 'bg-black' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/
git commit -m "feat: add base UI components (Button, Input, Textarea, Badge, Toggle)"
```

---

## Task 11: Admin Login Page

**Files:**
- Create: `app/admin/login/page.tsx`
- Modify: `app/admin/layout.tsx` (create)

- [ ] **Step 1: Create admin login page**

```typescript
// app/admin/login/page.tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    setLoading(false)

    if (res.ok) {
      router.push('/admin/products')
      router.refresh()
    } else {
      setError('Invalid password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to manage products</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
            autoFocus
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create admin root layout**

```typescript
// app/admin/layout.tsx
import { ReactNode } from 'react'

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/login/page.tsx app/admin/layout.tsx
git commit -m "feat: add admin login page"
```

---

## Task 12: Admin Sidebar + Products Layout

**Files:**
- Create: `components/admin/Sidebar.tsx`
- Create: `app/admin/products/layout.tsx`

- [ ] **Step 1: Create sidebar component**

```typescript
// components/admin/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const navItems = [
  { href: '/admin/products', label: 'Products', icon: '📦' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
          Sign Out
        </Button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create products area layout with sidebar**

```typescript
// app/admin/products/layout.tsx
import { ReactNode } from 'react'
import { Sidebar } from '@/components/admin/Sidebar'

export default function AdminProductsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/Sidebar.tsx app/admin/products/layout.tsx
git commit -m "feat: add admin sidebar and products layout"
```

---

## Task 13: Admin Product List Page

**Files:**
- Create: `app/admin/products/page.tsx`

- [ ] **Step 1: Create admin products list page**

```typescript
// app/admin/products/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { IProduct } from '@/types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => { setProducts(data); setLoading(false) })
  }, [])

  async function toggleAvailability(id: string, available: boolean) {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available }),
    })
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, available } : p)))
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return
    await fetch(`/api/products/${id}`, { method: 'DELETE' })
    setProducts((prev) => prev.filter((p) => p._id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">{products.length} total</p>
        </div>
        <Link href="/admin/products/new">
          <Button>+ Add Product</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Product</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Category</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Rental</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Sale</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Available</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  No products yet. <Link href="/admin/products/new" className="text-black underline">Add one</Link>
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.images[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">📷</div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-gray-400 text-xs">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{product.category || '—'}</td>
                <td className="px-4 py-3">
                  {product.offersRental ? (
                    <Badge variant="blue">${product.rentalPrice}</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {product.offersSale ? (
                    <Badge variant="green">${product.salePrice}</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Toggle
                    checked={product.available}
                    onChange={(val) => toggleAvailability(product._id, val)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/products/${product._id}`}>
                      <Button variant="secondary" size="sm">Edit</Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => deleteProduct(product._id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/products/page.tsx
git commit -m "feat: add admin product list page"
```

---

## Task 14: ImageUpload Component

**Files:**
- Create: `components/admin/ImageUpload.tsx`

- [ ] **Step 1: Create image upload component**

```typescript
// components/admin/ImageUpload.tsx
'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
}

export function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    setUploading(true)
    const urls: string[] = []

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const { url } = await res.json()
        urls.push(url)
      }
    }

    onChange([...images, ...urls])
    setUploading(false)
  }

  function removeImage(index: number) {
    onChange(images.filter((_, i) => i !== index))
  }

  function moveImage(from: number, to: number) {
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-black border-t-transparent" />
            <p className="text-sm text-gray-500">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="text-3xl">📸</div>
            <p className="text-sm font-medium text-gray-700">Drop images here or click to browse</p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP up to 10MB each</p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={url} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, i - 1)}
                    className="text-white bg-white/20 rounded p-1 text-xs hover:bg-white/40"
                    title="Move left"
                  >←</button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="text-white bg-red-500/80 rounded p-1 text-xs hover:bg-red-500"
                  title="Remove"
                >✕</button>
                {i < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(i, i + 1)}
                    className="text-white bg-white/20 rounded p-1 text-xs hover:bg-white/40"
                    title="Move right"
                  >→</button>
                )}
              </div>
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-black text-white text-xs px-1.5 py-0.5 rounded">Main</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/ImageUpload.tsx
git commit -m "feat: add ImageUpload component with drag-drop and reorder"
```

---

## Task 15: Admin Product Form Component

**Files:**
- Create: `components/admin/ProductForm.tsx`

- [ ] **Step 1: Create shared product form**

```typescript
// components/admin/ProductForm.tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { IProduct } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Toggle } from '@/components/ui/Toggle'
import { ImageUpload } from '@/components/admin/ImageUpload'
import slugify from 'slugify'

const CATEGORIES = ['Evening Gown', 'Cocktail Dress', 'Bridal', 'Casual', 'Formal', 'Other']
const STYLES = ['Formal', 'Casual', 'Bridal', 'Party', 'Beach', 'Other']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom']
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Gold', 'Silver', 'Pink', 'Purple', 'Nude', 'Other']

interface ProductFormProps {
  initialData?: Partial<IProduct>
  productId?: string
}

export function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    description: initialData?.description ?? '',
    category: initialData?.category ?? '',
    style: initialData?.style ?? '',
    color: initialData?.color ?? [],
    sizes: initialData?.sizes ?? [],
    images: initialData?.images ?? [],
    rentalPrice: initialData?.rentalPrice ?? 0,
    salePrice: initialData?.salePrice ?? 0,
    available: initialData?.available ?? true,
    offersRental: initialData?.offersRental ?? true,
    offersSale: initialData?.offersSale ?? false,
    metaTitle: initialData?.metaTitle ?? '',
    metaDescription: initialData?.metaDescription ?? '',
  })

  function handleNameChange(name: string) {
    setForm((f) => ({
      ...f,
      name,
      slug: f.slug || slugify(name, { lower: true, strict: true }),
    }))
  }

  function toggleArrayItem(field: 'color' | 'sizes', value: string) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const url = productId ? `/api/products/${productId}` : '/api/products'
    const method = productId ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setSaving(false)

    if (res.ok) {
      router.push('/admin/products')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || 'Failed to save product')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-3xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-900">Basic Information</h2>
        <Input
          label="Product Name *"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />
        <Input
          label="Slug (URL)"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          hint="Auto-generated from name. Used in the product URL."
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Style</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none"
              value={form.style}
              onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
            >
              <option value="">Select style</option>
              {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Colors</label>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => toggleArrayItem('color', c)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  form.color.includes(c)
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Sizes */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Sizes</label>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleArrayItem('sizes', s)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  form.sizes.includes(s)
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Images */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-900">Images</h2>
        <ImageUpload images={form.images} onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))} />
      </section>

      {/* Pricing & Availability */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-900">Pricing & Availability</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3">
            <Toggle
              checked={form.offersRental}
              onChange={(v) => setForm((f) => ({ ...f, offersRental: v }))}
              label="Offers Rental"
            />
            {form.offersRental && (
              <Input
                label="Rental Price ($)"
                type="number"
                min={0}
                step={0.01}
                value={form.rentalPrice}
                onChange={(e) => setForm((f) => ({ ...f, rentalPrice: parseFloat(e.target.value) || 0 }))}
              />
            )}
          </div>
          <div className="flex flex-col gap-3">
            <Toggle
              checked={form.offersSale}
              onChange={(v) => setForm((f) => ({ ...f, offersSale: v }))}
              label="Offers Sale"
            />
            {form.offersSale && (
              <Input
                label="Sale Price ($)"
                type="number"
                min={0}
                step={0.01}
                value={form.salePrice}
                onChange={(e) => setForm((f) => ({ ...f, salePrice: parseFloat(e.target.value) || 0 }))}
              />
            )}
          </div>
        </div>
        <Toggle
          checked={form.available}
          onChange={(v) => setForm((f) => ({ ...f, available: v }))}
          label="Available for booking"
        />
      </section>

      {/* SEO */}
      <section className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-900">SEO</h2>
        <Input
          label="Meta Title"
          value={form.metaTitle}
          onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
          hint={`${form.metaTitle.length}/60 characters`}
          maxLength={60}
        />
        <Textarea
          label="Meta Description"
          value={form.metaDescription}
          onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
          hint={`${form.metaDescription.length}/160 characters`}
          maxLength={160}
          rows={3}
        />
      </section>

      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          {productId ? 'Save Changes' : 'Create Product'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push('/admin/products')}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/admin/ProductForm.tsx
git commit -m "feat: add ProductForm component"
```

---

## Task 16: Admin New/Edit Product Pages

**Files:**
- Create: `app/admin/products/new/page.tsx`
- Create: `app/admin/products/[id]/page.tsx`

- [ ] **Step 1: Create new product page**

```typescript
// app/admin/products/new/page.tsx
import { ProductForm } from '@/components/admin/ProductForm'

export default function NewProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Product</h1>
      <ProductForm />
    </div>
  )
}
```

- [ ] **Step 2: Create edit product page**

```typescript
// app/admin/products/[id]/page.tsx
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
    ...product,
    _id: product._id.toString(),
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
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/products/new/page.tsx app/admin/products/[id]/page.tsx
git commit -m "feat: add admin new and edit product pages"
```

---

## Task 17: Public Layout

**Files:**
- Create: `app/(public)/layout.tsx`
- Create: `components/public/RegionSelector.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update root layout**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: { default: 'Dress Rental & Sales', template: '%s | Dress Rental' },
  description: 'Luxury dress rental and sales',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create RegionSelector component**

```typescript
// components/public/RegionSelector.tsx
'use client'

import { useEffect, useState } from 'react'
import { Region } from '@/types'

interface RegionSelectorProps {
  onSelect?: (region: Region) => void
}

export function RegionSelector({ onSelect }: RegionSelectorProps) {
  const [selected, setSelected] = useState<Region | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('region') as Region | null
    if (saved) setSelected(saved)
  }, [])

  function select(region: Region) {
    localStorage.setItem('region', region)
    setSelected(region)
    onSelect?.(region)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-500">Where are you shopping from?</p>
      <div className="flex gap-3">
        <button
          onClick={() => select('lebanon')}
          className={`px-6 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
            selected === 'lebanon'
              ? 'border-black bg-black text-white'
              : 'border-gray-200 text-gray-700 hover:border-gray-400'
          }`}
        >
          🇱🇧 Lebanon — Rent
        </button>
        <button
          onClick={() => select('international')}
          className={`px-6 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
            selected === 'international'
              ? 'border-black bg-black text-white'
              : 'border-gray-200 text-gray-700 hover:border-gray-400'
          }`}
        >
          🌍 International — Buy
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create public layout with nav and footer**

```typescript
// app/(public)/layout.tsx
'use client'

import { ReactNode, useEffect, useState } from 'react'
import Link from 'next/link'
import { Region } from '@/types'

export default function PublicLayout({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<Region | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('region') as Region | null
    setRegion(saved)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Dress Rental
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/products" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Collection
            </Link>
            {region && (
              <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                {region === 'lebanon' ? '🇱🇧 Lebanon' : '🌍 International'}
              </span>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-100 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Dress Rental. All rights reserved.</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.528 5.845L0 24l6.335-1.51A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.364l-.36-.214-3.727.889.924-3.62-.234-.373A9.818 9.818 0 012.182 12c0-5.42 4.398-9.818 9.818-9.818 5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z" />
            </svg>
            Contact on WhatsApp
          </a>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/(public)/layout.tsx components/public/RegionSelector.tsx
git commit -m "feat: add public layout, nav, footer, and RegionSelector"
```

---

## Task 18: Product Card Component

**Files:**
- Create: `components/public/ProductCard.tsx`

- [ ] **Step 1: Create ProductCard**

```typescript
// components/public/ProductCard.tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { IProduct, Region } from '@/types'
import { Badge } from '@/components/ui/Badge'

export function ProductCard({ product }: { product: IProduct }) {
  const [region, setRegion] = useState<Region>('lebanon')

  useEffect(() => {
    const saved = localStorage.getItem('region') as Region | null
    if (saved) setRegion(saved)
  }, [])

  const showRent = region === 'lebanon' && product.offersRental
  const showBuy = region === 'international' && product.offersSale
  const price = showRent ? product.rentalPrice : showBuy ? product.salePrice : null
  const priceLabel = showRent ? 'Rent' : 'Buy'

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 mb-3">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">👗</div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-medium text-gray-900 text-sm leading-tight group-hover:text-gray-600 transition-colors line-clamp-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          {price !== null ? (
            <span className="text-sm font-semibold text-gray-900">
              {priceLabel} ${price}
            </span>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
          {!product.available && <Badge variant="red">Unavailable</Badge>}
        </div>
        {product.color.length > 0 && (
          <p className="text-xs text-gray-400">{product.color.slice(0, 3).join(', ')}</p>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/public/ProductCard.tsx
git commit -m "feat: add ProductCard component"
```

---

## Task 19: Homepage

**Files:**
- Create: `app/(public)/page.tsx`

- [ ] **Step 1: Build homepage**

```typescript
// app/(public)/page.tsx
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
    ...p,
    _id: p._id.toString(),
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
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''}?text=Hi, I'd like to learn more about your dresses`}
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
                {['Browse our collection and pick your dress', 'Contact us on WhatsApp to confirm availability and dates', 'Receive your dress, wear it, and return it'].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold">{i + 1}</span>
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
                {['Browse and select your dress', 'Contact us on WhatsApp to arrange purchase and shipping'].map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <span className="bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 font-bold">{i + 1}</span>
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
```

- [ ] **Step 2: Commit**

```bash
git add app/\(public\)/page.tsx
git commit -m "feat: build homepage with hero, featured products, and how-it-works"
```

---

## Task 20: Product Listing Page

**Files:**
- Create: `app/(public)/products/page.tsx`
- Create: `components/public/ProductFilters.tsx`

- [ ] **Step 1: Create ProductFilters component**

```typescript
// components/public/ProductFilters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = ['Evening Gown', 'Cocktail Dress', 'Bridal', 'Casual', 'Formal', 'Other']
const STYLES = ['Formal', 'Casual', 'Bridal', 'Party', 'Beach', 'Other']
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Gold', 'Silver', 'Pink', 'Purple', 'Nude']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function ProductFilters() {
  const router = useRouter()
  const params = useSearchParams()

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (next.get(key) === value) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    router.push(`/products?${next.toString()}`)
  }

  function clearAll() {
    router.push('/products')
  }

  const active = params.toString()

  return (
    <aside className="w-56 shrink-0 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-sm">Filters</h2>
        {active && (
          <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Clear all
          </button>
        )}
      </div>

      {[
        { label: 'Category', key: 'category', options: CATEGORIES },
        { label: 'Style', key: 'style', options: STYLES },
        { label: 'Color', key: 'color', options: COLORS },
        { label: 'Size', key: 'size', options: SIZES },
      ].map(({ label, key, options }) => (
        <div key={key}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</p>
          <div className="flex flex-col gap-1">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(key, opt)}
                className={`text-left text-sm px-2 py-1 rounded-lg transition-colors ${
                  params.get(key) === opt
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  )
}
```

- [ ] **Step 2: Create product listing page**

```typescript
// app/(public)/products/page.tsx
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
    ...p,
    _id: p._id.toString(),
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
```

- [ ] **Step 3: Commit**

```bash
git add app/\(public\)/products/page.tsx components/public/ProductFilters.tsx
git commit -m "feat: add product listing page with filters"
```

---

## Task 21: Product Detail Page

**Files:**
- Create: `app/(public)/products/[slug]/page.tsx`
- Create: `components/public/ImageGallery.tsx`
- Create: `components/public/WhatsAppButton.tsx`

- [ ] **Step 1: Create ImageGallery**

```typescript
// components/public/ImageGallery.tsx
'use client'

import { useState } from 'react'

export function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0)

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] rounded-2xl bg-gray-100 flex items-center justify-center text-6xl">👗</div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
        <img src={images[selected]} alt={name} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setSelected(i)}
              className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                selected === i ? 'border-black' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create WhatsAppButton**

```typescript
// components/public/WhatsAppButton.tsx
'use client'

import { useEffect, useState } from 'react'
import { Region } from '@/types'

interface WhatsAppButtonProps {
  productName: string
  offersRental: boolean
  offersSale: boolean
}

export function WhatsAppButton({ productName, offersRental, offersSale }: WhatsAppButtonProps) {
  const [region, setRegion] = useState<Region>('lebanon')

  useEffect(() => {
    const saved = localStorage.getItem('region') as Region | null
    if (saved) setRegion(saved)
  }, [])

  const isRent = region === 'lebanon' && offersRental
  const isBuy = region === 'international' && offersSale
  const available = isRent || isBuy

  if (!available) return null

  const action = isRent ? 'renting' : 'buying'
  const message = encodeURIComponent(`Hi, I'm interested in ${action} the ${productName}`)
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''
  const href = `https://wa.me/${number}?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.555 4.116 1.528 5.845L0 24l6.335-1.51A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.364l-.36-.214-3.727.889.924-3.62-.234-.373A9.818 9.818 0 012.182 12c0-5.42 4.398-9.818 9.818-9.818 5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z" />
      </svg>
      {isRent ? 'Rent via WhatsApp' : 'Buy via WhatsApp'}
    </a>
  )
}
```

- [ ] **Step 3: Create product detail page**

```typescript
// app/(public)/products/[slug]/page.tsx
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
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">{product.category}</p>
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
                  <span key={c} className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700">{c}</span>
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Available Sizes</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <span key={s} className="text-sm border border-gray-300 px-3 py-1 rounded-full text-gray-700">{s}</span>
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
```

- [ ] **Step 4: Commit**

```bash
git add app/\(public\)/products/\[slug\]/page.tsx components/public/ImageGallery.tsx components/public/WhatsAppButton.tsx
git commit -m "feat: add product detail page with gallery and WhatsApp CTA"
```

---

## Task 22: SEO — Sitemap + Robots

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

- [ ] **Step 1: Create sitemap**

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next'
import { connectDB } from '@/lib/db'
import Product from '@/lib/models/Product'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  await connectDB()
  const products = await Product.find({}, 'slug updatedAt').lean()

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...productUrls,
  ]
}
```

- [ ] **Step 2: Create robots.txt**

```typescript
// app/robots.ts
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/admin/' },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat: add sitemap and robots.txt for SEO"
```

---

## Task 23: Remove Default Next.js Boilerplate

**Files:**
- Modify: `app/globals.css`
- Delete boilerplate from `app/page.tsx` (replaced by `app/(public)/page.tsx`)

- [ ] **Step 1: Clean up globals.css**

Replace `app/globals.css` contents with:
```css
@import "tailwindcss";

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
}

img {
  display: block;
  max-width: 100%;
}
```

- [ ] **Step 2: Remove root page.tsx (public route group handles it)**

The `app/(public)/page.tsx` acts as the homepage via the route group. Delete `app/page.tsx` if it still exists to avoid route conflicts:

```bash
rm app/page.tsx
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "chore: clean up boilerplate CSS and remove default page"
```

---

## Task 24: Final Verification

- [ ] **Step 1: Run all tests**

```bash
npm run test:run
```
Expected: All tests pass

- [ ] **Step 2: Run type check**

```bash
npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 3: Start dev server and verify**

```bash
npm run dev
```

Visit and verify:
- `http://localhost:3000` — Homepage loads, region selector works
- `http://localhost:3000/products` — Listing page loads, filters work
- `http://localhost:3000/admin/login` — Login page loads
- Login with the password from `.env.local`
- `http://localhost:3000/admin/products` — Product list loads (protected, redirects if not logged in)
- `http://localhost:3000/admin/products/new` — Add product form loads, can create a product
- Product appears in listing and detail page
- WhatsApp button shows correct action based on region

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete rental website — admin panel, public site, SEO"
```
