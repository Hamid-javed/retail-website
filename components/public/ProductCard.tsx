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
