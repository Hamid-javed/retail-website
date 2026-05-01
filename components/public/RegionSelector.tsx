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
