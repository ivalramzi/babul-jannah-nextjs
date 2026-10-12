'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion:reduce)').matches

/* ---------- Animasi keluar untuk overlay/sheet ----------
   Mengembalikan [out, exit]. Pasang class "out" pada .overlay saat out === true;
   callback onClose baru dijalankan setelah animasi keluar selesai (dilewati bila reduced-motion). */
export function useExit(onClose, ms = 230) {
  const [out, setOut] = useState(false)
  const fn = useRef(onClose); fn.current = onClose
  const busy = useRef(false), t = useRef(0)
  useEffect(() => () => clearTimeout(t.current), [])
  const exit = useCallback(() => {
    if (busy.current) return
    busy.current = true; setOut(true)
    t.current = setTimeout(() => { busy.current = false; setOut(false); fn.current() }, reduced() ? 0 : ms)
  }, [ms])
  return [out, exit]
}

/* ---------- Indikator yang meluncur (bouncy) ke item aktif ----------
   Mengisi CSS var --x --y --w --h pada kontainer; gaya pill-nya ada di styles.css ([data-ind]).
   Sebelum JS siap, gaya bawaan item aktif tetap dipakai, jadi tidak ada kedipan. */
export function useSlide(ref, sel, dep, inset = 0) {
  useEffect(() => {
    const box = ref.current
    if (!box) return
    const place = () => {
      const a = box.querySelector(sel)
      if (!a) return box.style.setProperty('--o', 0)
      const s = box.style
      s.setProperty('--x', a.offsetLeft + inset + 'px'); s.setProperty('--y', a.offsetTop + 'px')
      s.setProperty('--w', Math.max(0, a.offsetWidth - inset * 2) + 'px'); s.setProperty('--h', a.offsetHeight + 'px')
      s.setProperty('--o', 1); box.dataset.ind = '1'
    }
    place()
    const id = requestAnimationFrame(() => requestAnimationFrame(() => { box.dataset.live = '1' })) // aktifkan transisi setelah posisi awal
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(place) : null
    ro?.observe(box)
    document.fonts?.ready.then(place)
    return () => { cancelAnimationFrame(id); ro?.disconnect() }
  }, [dep])
}

/* ---------- Angka suka yang "membal" tiap berubah ---------- */
export function Count({ n }) {
  const prev = useRef(n), [k, setK] = useState(0)
  useEffect(() => { if (prev.current !== n) { prev.current = n; setK((x) => x + 1) } }, [n])
  return <b key={k} className={k ? 'bump' : undefined}>{n} suka</b>
}

/* ---------- Reveal: konten muncul bertahap (stagger) dengan spring ----------
   - Elemen yang sudah terlihat saat halaman pertama kali dibuka tidak dianimasikan ulang (hindari kedipan SSR).
   - Elemen yang muncul belakangan (data selesai dimuat, ganti tab, filter) langsung masuk dengan stagger.
   - Elemen di bawah layar disembunyikan dulu, lalu masuk saat digulir ke tampilan.
   Memakai atribut data-rv (bukan className) agar tidak ditimpa React. */
const SEL = '.head,.h2,.h3,.chips,.stories,.ptabs,.cta,.empty,.facts li,.body,.cover,.rc,.post,.tile,.itile,.gthumb,.card,.back,.meta,.cform,.arow,.crow,.team li,.pro-top,.about .card,.read>.actions,.page>.actions,.feedcol>.btn,.login'
let booted = false
export function useReveal(ref) {
  useEffect(() => {
    const root = ref.current
    if (!root || reduced() || !('IntersectionObserver' in window)) return
    const first = !booted; booted = true
    const show = (el, n) => { el.style.setProperty('--d', Math.min(n, 8) * 60 + 'ms'); el.dataset.rv = 'in' }
    const io = new IntersectionObserver((es) => {
      let n = 0
      for (const e of es) if (e.isIntersecting) { show(e.target, n++); io.unobserve(e.target) }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 })
    const scan = (initial) => {
      let n = 0
      root.querySelectorAll(SEL).forEach((el) => {
        if (el.dataset.rv || el.closest('.hero,.overlay') || el.parentElement?.closest(SEL)) return
        if (el.getBoundingClientRect().top < innerHeight - 24) { if (initial) el.dataset.rv = 'seen'; else show(el, n++) }
        else { el.dataset.rv = 'wait'; io.observe(el) }
      })
    }
    scan(first)
    let raf = 0
    const mo = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; scan(false) }) })
    mo.observe(root, { childList: true, subtree: true })
    return () => { cancelAnimationFrame(raf); mo.disconnect(); io.disconnect() }
  }, [])
}
