'use client'
import dynamic from 'next/dynamic'

// Admin hanya dirender di browser (memakai sesi & localStorage), dan dimuat terpisah agar halaman publik tetap ringan.
const Admin = dynamic(() => import('../../Admin.jsx'), { ssr: false, loading: () => <div className="wrap page" /> })
export default function Page() { return <Admin /> }
