import Link from 'next/link'
import { site } from './data.js'

export default function Footer() {
  return (
    <footer className="footer">
      <p><b>{site.nama}</b> · {site.tagline}</p>
      <p className="faddr">{site.alamat}</p>
      <p><a href={`mailto:${site.email}`}>{site.email}</a></p>
      <p className="socials">
        <a href={site.instagram} target="_blank" rel="noreferrer">Instagram</a>
        <a href={site.youtube} target="_blank" rel="noreferrer">YouTube</a>
      </p>
      <p>© {new Date().getFullYear()} {site.nama} · <Link href="/admin">Admin</Link></p>
    </footer>
  )
}
