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
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
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
