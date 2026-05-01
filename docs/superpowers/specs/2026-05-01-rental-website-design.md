# Rental Website — Design Spec
Date: 2026-05-01

## Overview
A dress rental and sales website for a Lebanon-based business. Lebanon users see rental pricing and a WhatsApp rent flow. International users see sale pricing and a WhatsApp buy flow. Includes a Shopify-like admin panel for product management.

## Stack
- **Framework:** Next.js 16, App Router, TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** MongoDB + Mongoose
- **Image Storage:** Cloudinary if `CLOUDINARY_URL` env var is set, else `/public/uploads/`
- **Auth:** `ADMIN_PASSWORD` env var → JWT signed with `JWT_SECRET`, stored in httpOnly cookie
- **WhatsApp:** Pre-filled link per product (`wa.me/...?text=...`)

## File Structure

```
rental-website/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx              # Product listing
│   │   │   └── [slug]/page.tsx       # Product detail
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── login/page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx              # Product list
│   │   │   ├── new/page.tsx          # Add product
│   │   │   └── [id]/page.tsx         # Edit product
│   │   └── layout.tsx
│   └── api/
│       ├── products/route.ts         # GET (public), POST (admin)
│       ├── products/[id]/route.ts    # GET, PUT, DELETE
│       ├── upload/route.ts           # Image upload
│       └── auth/route.ts             # Login / logout
├── lib/
│   ├── db.ts                         # MongoDB connection singleton
│   ├── models/Product.ts             # Mongoose model
│   └── auth.ts                       # JWT helpers
├── middleware.ts                      # Protects /admin/* except /admin/login
└── components/
    ├── ui/                            # Button, Input, Badge, etc.
    └── admin/                         # AdminSidebar, ProductForm, ImageUpload
```

## Data Model

```typescript
Product {
  _id: ObjectId
  name: string
  slug: string           // auto-generated from name
  description: string
  category: string       // e.g. "Evening Gown", "Cocktail Dress"
  style: string          // e.g. "Formal", "Casual", "Bridal"
  color: string[]
  sizes: string[]        // ["XS","S","M","L","XL"]
  images: string[]       // Cloudinary URLs or /uploads/filename

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
```

## Region Logic
- User selects Lebanon or International once on the homepage.
- Selection saved to `localStorage` as `region` (`"lebanon"` | `"international"`).
- Lebanon → shows `rentalPrice`, "Rent via WhatsApp" CTA (if `offersRental: true`)
- International → shows `salePrice`, "Buy via WhatsApp" CTA (if `offersSale: true`)
- Products with only one mode hide the irrelevant option.

## Public Pages

### Homepage (`/`)
- Hero: brand name + tagline
- Region selector (Lebanon / International) — prominent, persists to localStorage
- Featured products grid (latest 8 products)
- "How it works" section (3 steps rental, 2 steps purchase)
- Footer with WhatsApp contact link

### Product Listing (`/products`)
- Filter sidebar: category, style, color, size, availability
- Product cards: image, name, price, availability badge
- Responsive: 3 cols desktop / 2 tablet / 1 mobile
- Filters applied client-side via query params

### Product Detail (`/products/[slug]`)
- Image gallery: main image + thumbnails
- Name, description, colors, sizes, price
- WhatsApp CTA button with pre-filled message: `"Hi, I'm interested in renting/buying [Product Name]"`
- Dynamic `<head>` meta tags from `metaTitle` / `metaDescription`

## Admin Panel (`/admin`)

### Auth
- `POST /api/auth` — checks password against `ADMIN_PASSWORD` env var, returns JWT in httpOnly cookie
- `middleware.ts` — redirects unauthenticated requests on `/admin/*` (except `/admin/login`) to `/admin/login`

### Pages
- `/admin/login` — password form
- `/admin/products` — table: name, category, availability toggle, edit/delete actions
- `/admin/products/new` — product form (all fields + image upload + SEO)
- `/admin/products/[id]` — same form pre-filled for editing

### Product Form Fields
- Name, Slug (auto + editable), Description
- Category, Style, Color (multi-select), Sizes (multi-select)
- Rental Price, Sale Price
- Offers Rental (toggle), Offers Sale (toggle), Available (toggle)
- Images: drag-and-drop upload, preview, reorder, delete
- SEO: Meta Title, Meta Description (with character counters)

## Image Upload
- `POST /api/upload`
- If `CLOUDINARY_URL` env var is set → upload to Cloudinary, return URL
- Otherwise → save to `/public/uploads/`, return `/uploads/filename`

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/products` | No | List all products (with filters) |
| POST | `/api/products` | Yes | Create product |
| GET | `/api/products/[id]` | No | Get single product |
| PUT | `/api/products/[id]` | Yes | Update product |
| DELETE | `/api/products/[id]` | Yes | Delete product |
| POST | `/api/upload` | Yes | Upload image |
| POST | `/api/auth` | No | Admin login |
| DELETE | `/api/auth` | Yes | Admin logout |

## Environment Variables

```env
MONGODB_URI=
ADMIN_PASSWORD=
JWT_SECRET=
CLOUDINARY_URL=          # optional — if absent, uses local /public/uploads/
WHATSAPP_NUMBER=         # e.g. 9611234567
NEXT_PUBLIC_SITE_URL=    # for canonical URLs
```

## SEO
- Dynamic `generateMetadata()` on product detail pages
- Slug-based URLs: `/products/black-evening-gown`
- Sitemap via `app/sitemap.ts`
- robots.txt via `app/robots.ts`
