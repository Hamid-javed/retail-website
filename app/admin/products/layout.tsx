import { ReactNode } from 'react'
import { Sidebar } from '@/components/admin/Sidebar'

export default function AdminProductsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
