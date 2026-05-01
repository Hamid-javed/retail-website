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
    color: initialData?.color ?? [] as string[],
    sizes: initialData?.sizes ?? [] as string[],
    images: initialData?.images ?? [] as string[],
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
        <ImageUpload
          images={form.images}
          onChange={(imgs) => setForm((f) => ({ ...f, images: imgs }))}
        />
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, rentalPrice: parseFloat(e.target.value) || 0 }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, salePrice: parseFloat(e.target.value) || 0 }))
                }
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
