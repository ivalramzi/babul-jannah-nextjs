'use client'
import '../styles.css'

// Pengaman terakhir: bila terjadi error tak terduga di level atas, tampilkan halaman bergaya situs (bukan halaman default Next.js).
export default function GlobalError() {
  return (
    <html lang="id">
      <body>
        <div className="wrap page">
          <h1>Ada kendala memuat halaman</h1>
          <p className="muted">Silakan coba lagi.</p>
          <div className="actions">
            <button type="button" className="btn" onClick={() => location.reload()}>Muat ulang</button>
            <a className="btn ghost" href="/">Ke beranda</a>
          </div>
        </div>
      </body>
    </html>
  )
}
