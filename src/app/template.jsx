'use client'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { Boundary } from '../shell.jsx'

// template.jsx dipasang ulang di setiap pindah halaman, jadi animasi masuk (.route) diputar tiap navigasi.
export default function Template({ children }) {
  const pathname = usePathname()
  return (
    <main className="route">
      <Boundary path={pathname}>
        <Suspense fallback={<div className="wrap page" />}>{children}</Suspense>
      </Boundary>
    </main>
  )
}
