'use client'
import { Component, useEffect, useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
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

// Kursor, garis progres, toast, sinkronisasi data, dan service worker (sekali di layout).
export default function Providers() {
  const pathname = usePathname()
  useLayoutEffect(() => window.scrollTo(0, 0), [pathname])
  useEffect(() => {
    startSync()
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return (
    <>
      <Cursor />
      <div key={'bar' + pathname} className="routebar" aria-hidden="true" />
      <Toast />
    </>
  )
}
