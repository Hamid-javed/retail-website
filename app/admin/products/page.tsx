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
                  No products yet.{' '}
                  <Link href="/admin/products/new" className="text-black underline">
                    Add one
                  </Link>
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        📷
                      </div>
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
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteProduct(product._id)}
                    >
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
