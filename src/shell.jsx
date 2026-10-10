'use client'
import { Component, useEffect } from 'react'
import { Link } from './nav.jsx'
import { startSync } from './store.js'
import { Cursor, Toast } from './components.jsx'

// Jika satu halaman error, tampilan tidak membeku: pengguna bisa lanjut pindah halaman tanpa refresh manual.
export class Boundary extends Component {
  state = { err: false, path: this.props.path }
  static getDerivedStateFromError() { return { err: true } }
  static getDerivedStateFromProps(p, s) { return p.path !== s.path ? { err: false, path: p.path } : null }
  render() {
    return this.state.err
      ? <div className="wrap page"><h1>Ada kendala memuat halaman</h1><p className="muted">Silakan coba lagi.</p><div className="actions"><button type="button" className="btn" onClick={() => this.setState({ err: false })}>Coba lagi</button><Link className="btn ghost" to="/">Ke beranda</Link></div></div>
      : this.props.children
  }
}

// Kursor, toast, sinkronisasi data, dan service worker (sekali di layout).
// Gulir ke atas saat pindah halaman sudah ditangani Next.js, jadi tidak perlu scrollTo manual (dulu menyebabkan lonjakan).
export default function Providers() {
  useEffect(() => {
    startSync()
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return (
    <>
      <Cursor />
      <Toast />
    </>
  )
}
