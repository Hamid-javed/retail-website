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

  if (!isRent && !isBuy) return null

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
