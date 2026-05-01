'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'

export function ProductSearch() {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [value, setValue] = useState(params.get('q') ?? '')

  useEffect(() => {
    setValue(params.get('q') ?? '')
  }, [params])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setValue(q)
    const next = new URLSearchParams(params.toString())
    if (q) {
      next.set('q', q)
    } else {
      next.delete('q')
    }
    startTransition(() => {
      router.push(`/products?${next.toString()}`)
    })
  }

  return (
    <div className="relative w-full max-w-sm">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder="Search dresses…"
        value={value}
        onChange={handleChange}
        className={`w-full pl-9 pr-4 py-2 text-sm rounded-full bg-white border border-neutral-200 text-neutral-900 placeholder-neutral-400 outline-none focus:border-black transition-all duration-150 ${isPending ? 'opacity-60' : ''}`}
      />
    </div>
  )
}
