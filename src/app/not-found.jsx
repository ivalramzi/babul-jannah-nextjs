import Link from 'next/link'

export const metadata = { title: 'Halaman tidak ditemukan' }
export default function NotFound() {
  return <div className="route"><div className="wrap page"><h1>Halaman tidak ditemukan</h1><Link className="btn" href="/">Kembali ke beranda</Link></div></div>
}
