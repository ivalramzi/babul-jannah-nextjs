'use client'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { Boundary } from '../shell.jsx'

// Hanya <main> yang diganti saat pindah halaman (navbar, tab bar & footer ada di layout, tidak dipasang ulang).
// Transisinya cukup fade singkat pada <main>, tanpa garis progres dan tanpa animasi ulang tiap elemen,
// supaya perpindahan halaman tidak terasa seperti memuat ulang.
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
