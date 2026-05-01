'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const CATEGORIES = ['Evening Gown', 'Cocktail Dress', 'Bridal', 'Casual', 'Formal', 'Other']
const STYLES = ['Formal', 'Casual', 'Bridal', 'Party', 'Beach', 'Other']
const COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Gold', 'Silver', 'Pink', 'Purple', 'Nude']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const COLOR_MAP: Record<string, string> = {
  Black: '#111', White: '#f5f5f5', Red: '#e53e3e', Blue: '#3182ce',
  Green: '#38a169', Gold: '#d4a017', Silver: '#a0aec0', Pink: '#ed64a6',
  Purple: '#805ad5', Nude: '#c9a992',
}

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
    <aside className="w-52 shrink-0 flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-black uppercase tracking-widest">Filters</h2>
        {active && (
          <button
            onClick={clearAll}
            className="text-[11px] text-neutral-400 hover:text-black transition-colors underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      {[
        { label: 'Category', key: 'category', options: CATEGORIES },
        { label: 'Style', key: 'style', options: STYLES },
        { label: 'Size', key: 'size', options: SIZES },
      ].map(({ label, key, options }) => (
        <div key={key}>
          <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2.5">{label}</p>
          <div className="flex flex-wrap gap-1.5">
            {options.map((opt) => {
              const isActive = params.get(key) === opt
              return (
                <button
                  key={opt}
                  onClick={() => setFilter(key, opt)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-150 ${
                    isActive
                      ? 'bg-black border-black text-white'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-black'
                  }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div>
        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-2.5">Color</p>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter('color', opt)}
              title={opt}
              className="w-6 h-6 rounded-full border-2 transition-all duration-150"
              style={{
                backgroundColor: COLOR_MAP[opt] ?? '#ccc',
                borderColor: params.get('color') === opt ? '#111' : 'transparent',
                transform: params.get('color') === opt ? 'scale(1.15)' : 'scale(1)',
                boxShadow: opt === 'White' ? 'inset 0 0 0 1px #e5e7eb' : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </aside>
  )
}
