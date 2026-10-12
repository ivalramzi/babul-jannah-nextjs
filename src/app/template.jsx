'use client'
import { Suspense, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Boundary } from '../shell.jsx'
import { useReveal } from '../motion.jsx'

// Hanya <main> yang diganti saat pindah halaman (navbar, tab bar & footer ada di layout, tidak dipasang ulang).
// Template dibuat ulang tiap navigasi, jadi animasi masuk .route (spring: naik + sedikit membal) berjalan otomatis.
// Isi halaman muncul bertahap lewat useReveal (stagger + reveal saat digulir), bukan memuat ulang seluruh halaman.
export default function Template({ children }) {
  const pathname = usePathname()
  const ref = useRef(null)
  useReveal(ref)
  return (
    <main className="route" ref={ref}>
      <Boundary path={pathname}>
        <Suspense fallback={<div className="wrap page" />}>{children}</Suspense>
      </Boundary>
    </main>
  )
}
