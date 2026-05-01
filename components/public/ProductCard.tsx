'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { IProduct, Region } from '@/types'

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
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100 mb-3">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/8 transition-colors duration-300 rounded-2xl" />

        {price !== null && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}>
            <span className="text-white text-sm font-semibold tracking-wide">
              {priceLabel} ${price}
            </span>
          </div>
        )}

        {!product.available && (
          <div className="absolute top-2.5 left-2.5">
            <span className="bg-white/90 backdrop-blur-sm text-red-600 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full">
              Unavailable
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-0.5 px-0.5">
        <h3 className="font-medium text-neutral-900 text-sm leading-snug group-hover:text-neutral-500 transition-colors duration-200 line-clamp-2">
          {product.name}
        </h3>
        {product.color.length > 0 && (
          <p className="text-xs text-neutral-400">{product.color.slice(0, 3).join(' · ')}</p>
        )}
        {price === null && (
          <span className="text-xs text-neutral-400 mt-0.5">—</span>
        )}
      </div>
    </Link>
  )
}
