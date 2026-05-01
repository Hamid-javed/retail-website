'use client'

import Link from 'next/link'

export function BackButton() {
  return (
    <Link
      href="/products"
      className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-black transition-colors duration-150 group"
    >
      <svg
        className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      <span>Back to Collection</span>
    </Link>
  )
}
