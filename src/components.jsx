'use client'
import { useState, useEffect, useRef, memo } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation } from './nav.jsx'
import { site } from './data.js'
import { useContent } from './store.js'
import { useExit, useSlide, Count } from './motion.jsx'
import { Icon, useStored, toast, toggleIn, tones, fmt, upcoming, daysLeft, inkOn, fotos, useLike, scrollToTop, setReminder, setAnnounce, PUSH_MSG, pushSupported, paras, fit, useRatio, useSorotan } from './lib.jsx'

export { Count }
export const Logo = ({ size = 40 }) => <img className="logo" src={size > 64 ? '/logo-512.png' : '/logo-128.png'} width={size} height={size} alt="" decoding="async" />

/* ---------- Bola pengikut kursor (putih keabu-abuan, blur) (delay halus, hanya jalan saat bergerak) ---------- */
export function Cursor() {
  const ref = useRef(null)
  useEffect(() => {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion:reduce)').matches) return
    const el = ref.current
    let x = 0, y = 0, cx = 0, cy = 0, s = 1, ts = 1, hov = false, raf = 0, first = true
    const tick = () => {
      cx += (x - cx) * 0.14; cy += (y - cy) * 0.14; s += (ts - s) * 0.18
      el.style.transform = `translate3d(${cx}px,${cy}px,0) scale(${s})`
      raf = Math.abs(x - cx) > 0.1 || Math.abs(y - cy) > 0.1 || Math.abs(ts - s) > 0.01 ? requestAnimationFrame(tick) : 0
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(tick) }
    const move = (e) => {
      x = e.clientX; y = e.clientY
      if (first) { cx = x; cy = y; first = false }
      hov = !!e.target.closest?.('a,button,input,textarea,select,[data-hover]')
      ts = hov ? 2 : 1; el.style.opacity = 1; wake()
    }
    const down = () => { ts = hov ? 1.5 : 0.8; wake() }
    const up = () => { ts = hov ? 2 : 1; wake() }
    const leave = () => (el.style.opacity = 0)
    const o = { passive: true }
    addEventListener('mousemove', move, o); addEventListener('mousedown', down, o); addEventListener('mouseup', up, o)
    document.documentElement.addEventListener('mouseleave', leave)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('mousemove', move); removeEventListener('mousedown', down); removeEventListener('mouseup', up)
      document.documentElement.removeEventListener('mouseleave', leave)
    }
  }, [])
  return <div ref={ref} className="ball" aria-hidden="true" />
}

export function Toast() {
  const [msg, setMsg] = useState('')
  useEffect(() => {
    let t
    const h = (e) => { setMsg(e.detail); clearTimeout(t); t = setTimeout(() => setMsg(''), 2200) }
    addEventListener('toast', h)
    return () => { removeEventListener('toast', h); clearTimeout(t) }
  }, [])
  return <div className={msg ? 'toast show' : 'toast'} role="status">{msg}</div>
}

/* ---------- Navigasi ---------- */
const menu = [['/', 'Beranda', 'home'], ['/jadwal', 'Jadwal', 'calendar_month'], ['/acara', 'Acara', 'event'], ['/artikel', 'Artikel', 'article'], ['/tentang', 'Profil', 'person'], ['/kontak', 'Kontak', 'mail']]
/* Tombol notifikasi umum: pengumuman acara & artikel baru */
function NotifButton() {
  const [on, setOn] = useStored('bj-announce', false)
  const click = async () => {
    const r = await setAnnounce(!on)
    if (!r.ok) return toast(PUSH_MSG[r.why] || PUSH_MSG.error)
    setOn(!on); toast(on ? 'Notifikasi pengumuman dimatikan' : 'Notifikasi aktif: kamu akan diberi tahu soal acara & artikel baru')
  }
  const ok = on && pushSupported() && Notification.permission === 'granted'
  return <button className={ok ? 'adm-btn on' : 'adm-btn'} aria-pressed={ok} aria-label={ok ? 'Matikan notifikasi pengumuman' : 'Aktifkan notifikasi pengumuman'} onClick={click}><Icon n="notifications" size={20} fill={ok} /></button>
}

export function Nav() {
  const { pathname } = useLocation()
  const linksRef = useRef(null), tabsRef = useRef(null)
  useSlide(linksRef, 'a.active', pathname)
  useSlide(tabsRef, 'a.active', pathname, 12)
  // Logo: bila sudah di beranda, gulir halus ke cover paling atas; bila di halaman lain, pindah ke beranda (tampil dari atas)
  const toHome = (e) => { if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; if (pathname === '/') { e.preventDefault(); scrollToTop() } }
  return (
    <>
      <header className="nav">
        <div className="nav-in">
          <Link to="/" className="brand" onClick={toHome} aria-label="Babul Jannah, ke beranda"><Logo size={40} />{site.nama}</Link>
          <nav className="links" ref={linksRef}>
            {menu.map(([to, l, i]) => <NavLink key={to} to={to} end={to === '/'}><Icon n={i} size={20} />{l}</NavLink>)}
          </nav>
          <NotifButton />
          <Link to="/admin" className="adm-btn" aria-label="Login admin"><Icon n="lock" size={20} /></Link>
        </div>
      </header>
      <nav className="tabbar" aria-label="Menu utama" ref={tabsRef}>
        {menu.filter((m) => m[0] !== '/kontak').map(([to, l, i]) => <NavLink key={to} to={to} end={to === '/'} onClick={(e) => { if (pathname === to) { e.preventDefault(); scrollToTop() } }}><Icon n={i} size={26} /><span>{l}</span></NavLink>)}
      </nav>
    </>
  )
}

/* ---------- Stories ---------- */
export function Stories() {
  const stories = useSorotan()
  const [open, setOpen] = useState(null)
  const [seen, setSeen] = useStored('bj-seen', [])
  const [paused, setPaused] = useState(false)
  const [out, exit] = useExit(() => setOpen(null))
  const exitRef = useRef(exit); exitRef.current = exit
  const show = (g, s = 0) => { setOpen({ g, s }); setSeen((x) => (x.includes(stories[g].id) ? x : [...x, stories[g].id])) }
  const go = (d) => {
    let { g, s } = open
    s += d
    if (s >= stories[g].slides.length) { g++; s = 0 } else if (s < 0) { g--; s = g >= 0 ? stories[g].slides.length - 1 : 0 }
    if (g < 0) { g = 0; s = 0 }
    if (g >= stories.length) return exit()
    show(g, s)
  }
  const goRef = useRef(go); goRef.current = go
  const isOpen = !!open
  useEffect(() => {
    if (!isOpen) return
    const k = (e) => e.key === 'Escape' ? exitRef.current() : e.key === 'ArrowRight' ? goRef.current(1) : e.key === 'ArrowLeft' ? goRef.current(-1) : null
    addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [isOpen])
  const cur = open && stories[open.g]
  const slide = cur && cur.slides[open.s]
  if (!stories.length) return null
  return (
    <>
      <div className="stories">
        {stories.map((st, i) => (
          <button key={st.id} className={seen.includes(st.id) ? 'story seen' : 'story'} onClick={() => show(i)}>
            <span className="ring"><span className="av"><Icon n={st.icon} size={30} fill /></span></span>
            <span className="lbl">{st.label}</span>
          </button>
        ))}
      </div>
      {open && (
        <div className={out ? 'overlay dark out' : 'overlay dark'} role="dialog" aria-label={cur.label}>
          <div className={`vslide t-${slide.tone}`} onContextMenu={(e) => e.preventDefault()} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)}>
            <div className="bars">
              {cur.slides.map((_, i) => (
                <span key={`${open.g}-${i}-${open.s}`} className="bar">
                  <i className={i < open.s ? 'done' : i === open.s ? 'run' : ''} style={{ animationPlayState: paused ? 'paused' : 'running' }}
                    onAnimationEnd={() => i === open.s && goRef.current(1)} />
                </span>
              ))}
            </div>
            <div className="vhead"><Logo size={36} /><b>{site.nama}</b>
              <button className="x" aria-label="Tutup" onClick={exit}><Icon n="close" /></button></div>
            <button type="button" className="zone l" aria-label="Sebelumnya" onClick={() => go(-1)} />
            <button type="button" className="zone r" aria-label="Berikutnya" onClick={() => go(1)} />
            <div className="vbody" key={`${open.g}-${open.s}`}>
              <Icon n={slide.icon} size={96} fill />
              <h2>{slide.title}</h2>
              <p>{slide.text}</p>
              {slide.to && <Link to={slide.to} className="btn inv" onClick={() => setOpen(null)}>{slide.cta}</Link>}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------- Sheet deskripsi (tombol komentar): hanya deskripsi dan suka, tanpa komentar ---------- */
function DescSheet({ kind, id, title, sub, text, to, onClose }) {
  const { liked, count, toggle } = useLike(kind, id)
  const [out, exit] = useExit(onClose)
  const exitRef = useRef(exit); exitRef.current = exit
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && exitRef.current()
    addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [])
  // Dirender ke <body> lewat portal: kartu .post punya overflow:hidden & transform (hover) yang akan mengurung/memotong overlay fixed.
  return createPortal(
    <div className={out ? 'overlay out' : 'overlay'} role="dialog" aria-modal="true" aria-label="Deskripsi" onClick={(e) => e.target === e.currentTarget && exit()}>
      <div className="sheet desc">
        <div className="ed-head"><h2>{title}</h2><button type="button" className="ib" aria-label="Tutup" autoFocus onClick={exit}><Icon n="close" /></button></div>
        {sub && <p className="muted">{sub}</p>}
        {paras(text).map((p, i) => <p className="dtext" key={i}>{p}</p>)}
        <div className="acts flat dfoot">
          <button type="button" className={liked ? 'act liked' : 'act'} onClick={toggle} aria-pressed={liked} aria-label="Suka"><Icon n="favorite" fill={liked} /></button>
          <Count n={count} />
          {to && <Link to={to} className="link dmore" onClick={onClose}>Selengkapnya</Link>}
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ---------- Kartu artikel ala postingan ---------- */
export const Post = memo(function Post({ a, i = 0, custom = false, place = 'artikel' }) {
  const ratio = useRatio(place)
  const [saved, setSaved] = useStored('bj-saved', [])
  const { liked, count, toggle } = useLike('artikel', a.id)
  const [burst, setBurst] = useState(0)
  const [desc, setDesc] = useState(false)
  const sv = saved.includes(a.id)
  const dbl = () => { if (!liked) toggle(); setBurst((b) => b + 1) }
  const share = async () => {
    const url = `${location.origin}/artikel/${a.id}`
    try { if (navigator.share) await navigator.share({ title: a.judul, url }); else { await navigator.clipboard.writeText(url); toast('Tautan disalin') } } catch {}
  }
  const fl = fotos(a)
  const style = { aspectRatio: ratio, ...(fl.length ? null : custom ? { background: a.warna, color: inkOn(a.warna) } : null) }
  return (
    <article className="post">
      <div className="phead"><Logo size={40} /><div><b>{site.nama}</b><small>{a.penulis}</small></div></div>
      <div className={fl.length ? 'media has-img' : custom ? 'media' : `media t-${tones[i % 3]}`} style={style} onDoubleClick={dbl}>
        {fl.length > 0 && <><img className="mimg" src={fl[0]} style={fit(a, 0, place)} alt="" loading="lazy" decoding="async" draggable="false" /><span className="shade" /></>}
        <span className="pill">Artikel</span>
        <h3>{a.judul}</h3>
        {burst > 0 && <span key={burst} className="burst"><Icon n="favorite" fill size={96} /></span>}
      </div>
      <div className="acts">
        <button type="button" className={liked ? 'act liked' : 'act'} onClick={toggle} aria-pressed={liked} aria-label="Suka"><Icon n="favorite" fill={liked} /></button>
        <button type="button" className="act" onClick={() => setDesc(true)} aria-label="Lihat deskripsi"><Icon n="chat_bubble" /></button>
        <button type="button" className="act" onClick={share} aria-label="Bagikan"><Icon n="send" /></button>
        <button type="button" className={sv ? 'act saved right' : 'act right'} aria-pressed={sv} aria-label="Simpan"
          onClick={() => { toggleIn(setSaved, a.id); toast(sv ? 'Dihapus dari simpanan' : 'Disimpan') }}><Icon n="bookmark" fill={sv} /></button>
      </div>
      <div className="cap">
        <Count n={count} />
        <p>{a.ringkas}</p>
        <Link to={`/artikel/${a.id}`} className="muted">Baca selengkapnya</Link>
        <small>{fmt(a.tanggal)}</small>
      </div>
      {desc && <DescSheet kind="artikel" id={a.id} title={a.judul} sub={`${a.penulis} · ${fmt(a.tanggal)}`} text={a.ringkas} to={`/artikel/${a.id}`} onClose={() => setDesc(false)} />}
    </article>
  )
})

/* ---------- Media feed ala Instagram: carousel geser, rasio & posisi crop diatur admin (tempat "feed") ---------- */
function FeedMedia({ item, onDbl, burst, fallback }) {
  const ratio = useRatio('feed'), rail = useRef(null), [cur, setCur] = useState(0), fl = fotos(item)
  const onScroll = () => { const el = rail.current; if (el) setCur(Math.round(el.scrollLeft / el.clientWidth)) }
  return (
    <>
      <div className="fmedia" style={{ aspectRatio: ratio }} onDoubleClick={onDbl}>
        {fl.length ? (
          <div className="rail" ref={rail} onScroll={onScroll}>
            {fl.map((src, n) => <div className="slide" key={n}><img src={src} style={fit(item, n, 'feed')} alt="" loading={n ? 'lazy' : 'eager'} decoding="async" draggable="false" /></div>)}
          </div>
        ) : fallback}
        {fl.length > 1 && <span className="count">{cur + 1}/{fl.length}</span>}
        {burst > 0 && <span key={burst} className="burst"><Icon n="favorite" fill size={96} /></span>}
      </div>
      {fl.length > 1 && <div className="dots" aria-hidden="true">{fl.map((_, n) => <i key={n} className={n === cur ? 'on' : ''} />)}</div>}
    </>
  )
}
const sharePost = async (title, path) => {
  const url = location.origin + path
  try { if (navigator.share) await navigator.share({ title, url }); else { await navigator.clipboard.writeText(url); toast('Tautan disalin') } } catch {}
}

/* ---------- Postingan buatan admin (profil → Postingan) ---------- */
export const GramPost = memo(function GramPost({ p }) {
  const { liked, count, toggle } = useLike('postingan', p.id)
  const [burst, setBurst] = useState(0)
  const [desc, setDesc] = useState(false)
  const [more, setMore] = useState(false)
  const text = p.caption || ''
  const dbl = () => { if (!liked) toggle(); setBurst((b) => b + 1) }
  return (
    <article className="post feed">
      <div className="phead"><span className="ring sm"><Logo size={36} /></span><div><b>{site.nama}</b><small>{p.lokasi || fmt(p.tanggal)}</small></div></div>
      <FeedMedia item={p} onDbl={dbl} burst={burst} fallback={<div className="rail solo t-green"><div className="fcard"><Icon n="photo_library" size={40} fill /><p>{text.slice(0, 140)}</p></div></div>} />
      <div className="acts">
        <button type="button" className={liked ? 'act liked' : 'act'} onClick={toggle} aria-pressed={liked} aria-label="Suka"><Icon n="favorite" fill={liked} /></button>
        <button type="button" className="act" onClick={() => setDesc(true)} aria-label="Lihat deskripsi"><Icon n="chat_bubble" /></button>
        <button type="button" className="act" onClick={() => sharePost(site.nama, '/tentang')} aria-label="Bagikan"><Icon n="send" /></button>
      </div>
      <div className="cap">
        <Count n={count} />
        {text && <p className={more ? 'open' : 'clamp'}><b>{site.nama}</b> {text.replace(/\n+/g, ' ')}</p>}
        {!more && text.length > 110 && <button type="button" className="more" onClick={() => setMore(true)}>selengkapnya</button>}
        <small>{fmt(p.tanggal)}{p.lokasi ? ` · ${p.lokasi}` : ''}</small>
      </div>
      {desc && <DescSheet kind="postingan" id={p.id} title={text.split('\n')[0].slice(0, 70) || 'Postingan'} sub={`${fmt(p.tanggal)}${p.lokasi ? ' · ' + p.lokasi : ''}`} text={text} onClose={() => setDesc(false)} />}
    </article>
  )
})

/* ---------- Grid postingan 3 kolom ala profil Instagram (gambar polos; ketuk untuk membuka postingan) ---------- */
export function PostGrid({ list }) {
  const ratio = useRatio('grid')
  const [open, setOpen] = useState(-1)
  const isOpen = open >= 0, n = list.length
  const [out, exit] = useExit(() => setOpen(-1))
  const exitRef = useRef(exit); exitRef.current = exit
  useEffect(() => {
    if (!isOpen) return
    const k = (e) => e.key === 'Escape' ? exitRef.current() : e.key === 'ArrowRight' ? setOpen((x) => (x + 1) % n) : e.key === 'ArrowLeft' ? setOpen((x) => (x - 1 + n) % n) : null
    addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [isOpen, n])
  const cur = isOpen ? list[open] : null
  return (
    <>
      <div className="igrid">
        {list.map((p, i) => {
          const fl = fotos(p)
          return (
            <button type="button" key={p.id} className="itile" style={{ aspectRatio: ratio }} aria-label={`Buka postingan ${i + 1}`} onClick={() => setOpen(i)}>
              {fl.length ? <img src={fl[0]} style={fit(p, 0, 'grid')} alt="" loading={i < 6 ? 'eager' : 'lazy'} decoding="async" draggable="false" /> : <span className="itext t-green">{(p.caption || '').slice(0, 90)}</span>}
              {(fl.length > 1 || p.sematkan) && <span className="itype" aria-hidden="true">{p.sematkan && <Icon n="push_pin" size={20} fill />}{fl.length > 1 && <Icon n="photo_library" size={20} fill />}</span>}
            </button>
          )
        })}
      </div>
      {cur && createPortal(
        <div className={out ? 'overlay dark out' : 'overlay dark'} role="dialog" aria-modal="true" aria-label="Postingan" onClick={(e) => e.target === e.currentTarget && exit()}>
          <div className="pview" key={cur.id}><GramPost p={cur} /></div>
          <button type="button" className="x lb-x" aria-label="Tutup" onClick={exit}><Icon n="close" /></button>
          {n > 1 && <>
            <button type="button" className="x lb-n l" aria-label="Sebelumnya" onClick={() => setOpen((open - 1 + n) % n)}><Icon n="chevron_left" /></button>
            <button type="button" className="x lb-n r" aria-label="Berikutnya" onClick={() => setOpen((open + 1) % n)}><Icon n="chevron_right" /></button>
          </>}
        </div>,
        document.body
      )}
    </>
  )
}

/* ---------- Sampul halaman detail (foto dengan crop dari tempat "cover") ---------- */
export function Cover({ item, tone = 'green', style, place = 'cover', children }) {
  const ratio = useRatio(place), has = fotos(item).length > 0
  return (
    <div className={has ? 'cover photo' : `cover t-${tone}`} style={has ? { aspectRatio: ratio } : style}>
      {has && <div className="cimgw"><img className="cimg" src={fotos(item)[0]} style={fit(item, 0, place)} alt="" decoding="async" fetchPriority="high" /></div>}
      {children}
    </div>
  )
}

/* ---------- Tombol pengingat ---------- */
function Bell({ id, label }) {
  const [rem, setRem] = useStored('bj-rem', [])
  const [busy, setBusy] = useState(false)
  const on = rem.includes(id)
  const click = async () => {
    if (busy) return
    setBusy(true)
    const r = await setReminder(id, !on) // daftar ke server; notifikasi dikirim ke perangkat ini lewat push
    setBusy(false)
    if (!r.ok) return toast(PUSH_MSG[r.why] || PUSH_MSG.error)
    toggleIn(setRem, id)
    toast(on ? 'Pengingat dimatikan' : `Kami ingatkan lewat notifikasi: ${label}`)
  }
  return (
    <button type="button" className={on ? 'bell on' : 'bell'} aria-pressed={on} disabled={busy} onClick={click}>
      <Icon n="notifications" fill={on} size={20} /><span>{on ? 'Diingatkan' : 'Ingatkan'}</span>
    </button>
  )
}

/* ---------- Kartu jadwal rutin ---------- */
export const JadwalCard = memo(function JadwalCard({ j }) {
  return (
    <li className="rc">
      <div className="day"><b>{j.hari.slice(0, 3)}</b><span>{j.jam}</span></div>
      <div className="info"><h3>{j.judul}</h3><p>{j.pemateri}</p><p>{j.tempat}</p></div>
      <div className="side"><span className="chip soft">{j.jenis}</span><Bell id={'j:' + j.id} label={j.judul} /></div>
    </li>
  )
})

/* ---------- Kartu acara ---------- */
export const EventCard = memo(function EventCard({ e, done }) {
  return (
    <li className={done ? 'rc done' : 'rc'}>
      <div className={fotos(e).length ? 'day has-img' : 'day'}>{fotos(e).length > 0 && <div className="cimgw"><img className="cimg" src={fotos(e)[0]} style={fit(e, 0, 'cover')} alt="" loading="lazy" decoding="async" /></div>}<b>{fmt(e.tanggal, { day: 'numeric' })}</b><span>{fmt(e.tanggal, { month: 'short' })}</span></div>
      <div className="info">
        <span className="chip soft"><Icon n={done ? 'history' : 'event'} size={14} />{done ? 'Selesai' : daysLeft(e.tanggal)}</span>
        <h3><Link to={`/acara/${e.id}`}>{e.judul}</Link></h3>
        <p><Icon n="schedule" size={16} /> {e.jam} WIB</p>
        <p><Icon n="location_on" size={16} /> {e.lokasi}</p>
      </div>
      <div className="side">
        {done ? (e.peserta > 0 && <span className="muted">{e.peserta} peserta</span>) : <Bell id={'a:' + e.id} label={e.judul} />}
        <Link to={`/acara/${e.id}`} className="btn sm ghost">{done ? 'Lihat laporan' : 'Detail'}</Link>
      </div>
    </li>
  )
})

/* ---------- Pop up acara akan datang ---------- */
export function EventPopup() {
  const { acara } = useContent()
  const e = upcoming(acara)[0]
  const [show, setShow] = useState(false)
  const ratio = useRatio('popup')
  const id = e?.id
  const [out, exit] = useExit(() => setShow(false))
  useEffect(() => {
    let seen = false
    try { seen = !!sessionStorage.getItem('bj-pop-' + id) } catch {}
    if (!id || seen) return
    const t = setTimeout(() => setShow(true), 900)
    return () => clearTimeout(t)
  }, [id])
  const close = () => { try { sessionStorage.setItem('bj-pop-' + id, '1') } catch {} exit() }
  useEffect(() => {
    if (!show) return
    const k = (ev) => ev.key === 'Escape' && close()
    addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [show])
  if (!show || !e) return null
  return (
    <div className={out ? 'overlay out' : 'overlay'} role="dialog" aria-modal="true" aria-label="Acara akan datang" onClick={(ev) => ev.target === ev.currentTarget && close()}>
      <div className="sheet popup">
        <button className="x light" autoFocus aria-label="Tutup" onClick={close}><Icon n="close" /></button>
        <div className={fotos(e).length ? 'pop-top has-img' : 'pop-top'} style={fotos(e).length ? { aspectRatio: ratio } : undefined}>
          {fotos(e).length > 0 && <div className="cimgw"><img className="cimg" src={fotos(e)[0]} style={fit(e, 0, 'popup')} alt="" decoding="async" /></div>}
          <span className="chip inv"><Icon n="campaign" size={16} />Acara akan datang · {daysLeft(e.tanggal)}</span>
          <h2>{e.judul}</h2>
        </div>
        <div className="pop-body">
          <p><Icon n="event" size={20} /> {fmt(e.tanggal, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p><Icon n="schedule" size={20} /> {e.jam} WIB</p>
          <p><Icon n="location_on" size={20} /> {e.lokasi}</p>
          <div className="actions">
            <Link to={`/acara/${e.id}`} className="btn" onClick={close}>Lihat detail</Link>
            <Bell id={'a:' + e.id} label={e.judul} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Galeri foto + lightbox ---------- */
export function Gallery({ item, from = 1, title = 'Galeri foto' }) {
  const list = fotos(item).slice(from)
  const ratio = useRatio('galeri')
  const [i, setI] = useState(-1)
  const [out, exit] = useExit(() => setI(-1))
  const exitRef = useRef(exit); exitRef.current = exit
  useEffect(() => {
    if (i < 0) return
    const k = (e) => e.key === 'Escape' ? exitRef.current() : e.key === 'ArrowRight' ? setI((x) => (x + 1) % list.length) : e.key === 'ArrowLeft' ? setI((x) => (x - 1 + list.length) % list.length) : null
    addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [i, list.length])
  if (!list.length) return null
  return (
    <>
      <h2 className="h3">{title}</h2>
      <div className="gallery">
        {list.map((src, n) => <button key={n} className="gthumb" style={{ aspectRatio: ratio }} aria-label={`Buka foto ${n + 1}`} onClick={() => setI(n)}><img src={src} style={fit(item, from + n, 'galeri')} alt="" loading="lazy" decoding="async" /></button>)}
      </div>
      {i >= 0 && (
        <div className={out ? 'overlay dark out' : 'overlay dark'} role="dialog" aria-modal="true" aria-label="Foto" onClick={(e) => e.target === e.currentTarget && exit()}>
          <img className="lightbox" key={i} src={list[i]} alt="" />
          <button className="x lb-x" aria-label="Tutup" onClick={exit}><Icon n="close" /></button>
          {list.length > 1 && <>
            <button className="x lb-n l" aria-label="Sebelumnya" onClick={() => setI((i - 1 + list.length) % list.length)}><Icon n="chevron_left" /></button>
            <button className="x lb-n r" aria-label="Berikutnya" onClick={() => setI((i + 1) % list.length)}><Icon n="chevron_right" /></button>
          </>}
        </div>
      )}
    </>
  )
}
