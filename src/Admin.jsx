'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from './nav.jsx'
import { useContent, refresh, applyItem, removeItem, applyCrop, applyProfil, adminCall, tryLogin, isAdmin, logout } from './store.js'
import { PLACES, RATIOS } from './data.js'
import { Icon, useTitle, toast, fmt, isUpcoming, slugify, uid, fotos, compressImage, MAX_FOTO, MAX_POST, ratioOf, imgStyle, focusOf, useProfil } from './lib.jsx'
import { Logo } from './components.jsx'

const today = () => new Date().toISOString().slice(0, 10)
const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']
const JENIS = ['Umum', 'Muslimah', 'Anak', 'Remaja']
const CFG = {
  artikel: {
    label: 'Artikel', icon: 'article', foto: true, max: MAX_FOTO, places: ['beranda', 'artikel', 'cover', 'galeri'], sort: (a, b) => b.tanggal.localeCompare(a.tanggal),
    sub: (x) => `${x.penulis} · ${fmt(x.tanggal)}`,
    blank: () => ({ id: uid(), judul: '', penulis: '', tanggal: today(), ringkas: '', isi: '', warna: '#0a6b30', foto: [] }),
    fields: [['judul', 'Judul', 'text'], ['penulis', 'Penulis', 'text'], ['tanggal', 'Tanggal terbit', 'date'], ['warna', 'Warna sampul artikel', 'color'],
      ['ringkas', 'Ringkasan / deskripsi (tampil di kartu & tombol komentar)', 'textarea', 3], ['isi', 'Isi artikel (pisahkan paragraf dengan baris kosong)', 'textarea', 10]],
  },
  acara: {
    label: 'Acara', icon: 'event', foto: true, max: MAX_FOTO, places: ['cover', 'galeri', 'popup', 'feed'], sort: (a, b) => b.tanggal.localeCompare(a.tanggal),
    sub: (x) => `${fmt(x.tanggal)} · ${x.lokasi}`,
    blank: () => ({ id: uid(), judul: '', tanggal: today(), jam: '19.30', lokasi: '', pemateri: '', deskripsi: '', laporan: '', peserta: 0, foto: [] }),
    fields: [['judul', 'Nama acara', 'text'], ['tanggal', 'Tanggal (tanggal ke depan = akan datang, lewat = selesai)', 'date'], ['jam', 'Jam', 'text'], ['lokasi', 'Lokasi', 'text'],
      ['pemateri', 'Pemateri / panitia', 'text'], ['deskripsi', 'Deskripsi acara', 'textarea', 5], ['laporan', 'Laporan (isi setelah acara selesai)', 'textarea', 5], ['peserta', 'Jumlah peserta', 'number']],
  },
  postingan: {
    label: 'Postingan', icon: 'photo_library', foto: true, max: MAX_POST, places: ['grid', 'feed'], noun: 'postingan feed profil',
    title: (x) => (x.caption || '').split('\n')[0].slice(0, 70) || `Postingan ${fmt(x.tanggal)}`,
    sort: (a, b) => b.tanggal.localeCompare(a.tanggal) || b.id.localeCompare(a.id),
    sub: (x) => `${fmt(x.tanggal)}${x.lokasi ? ' · ' + x.lokasi : ''} · ${fotos(x).length} foto`,
    blank: () => ({ id: uid(), tanggal: today(), lokasi: '', caption: '', foto: [], fokus: [] }),
    fields: [['tanggal', 'Tanggal posting (yang terbaru tampil paling atas)', 'date'], ['lokasi', 'Lokasi (opsional, tampil di bawah nama)', 'text'], ['caption', 'Caption', 'textarea', 6]],
  },
  jadwal: {
    label: 'Jadwal', icon: 'calendar_month', sort: (a, b) => HARI.indexOf(a.hari) - HARI.indexOf(b.hari),
    sub: (x) => `${x.hari}, ${x.jam} WIB · ${x.pemateri}`,
    blank: () => ({ id: uid(), hari: 'Senin', jam: '19.30', judul: '', pemateri: '', tempat: '', jenis: 'Umum' }),
    fields: [['judul', 'Nama kajian', 'text'], ['hari', 'Hari', 'select', HARI], ['jam', 'Jam', 'text'], ['pemateri', 'Pemateri', 'text'], ['tempat', 'Tempat', 'text'], ['jenis', 'Kategori', 'select', JENIS]],
  },
}

function Login({ onOk }) {
  const [pw, setPw] = useState(''), [show, setShow] = useState(false), [err, setErr] = useState(''), [shake, setShake] = useState(0), [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    const r = await tryLogin(pw); setBusy(false)
    if (r.ok) onOk(); else { setErr(r.msg); setShake((s) => s + 1); setPw('') }
  }
  return (
    <div className="wrap page login-wrap">
      <div className="card login">
        <Logo size={72} />
        <h1>Masuk admin</h1>
        <p className="muted">Kelola artikel, acara, postingan feed profil (lengkap dengan foto & crop), dan jadwal Babul Jannah. Semua data tersimpan di Redis.</p>
        <form key={shake} className={shake ? 'form shake' : 'form'} onSubmit={submit}>
          <label>Password
            <span className="pw">
              <input type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} autoFocus required autoComplete="current-password" />
              <button type="button" className="ib" aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShow(!show)}><Icon n={show ? 'visibility_off' : 'visibility'} size={22} /></button>
            </span>
          </label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn" type="submit" disabled={busy || !pw}>{busy ? 'Memeriksa…' : 'Masuk'}</button>
        </form>
      </div>
    </div>
  )
}

/* ---------- Atur crop satu foto: geser untuk memilih bagian yang tampil, tiap tempat bisa berbeda ---------- */
function CropEditor({ src, places, crop, value, onSave, onClose }) {
  const [vals, setVals] = useState(value || {})
  const [place, setPlace] = useState(places[0])
  const [nat, setNat] = useState(null)
  const frame = useRef(null), drag = useRef(null)
  const ratio = ratioOf(crop, place), [rw, rh] = ratio.split('/').map(Number)
  const f = focusOf({ fokus: [vals] }, 0, place)
  const put = (p, n) => setVals((v) => ({ ...v, [p]: { ...focusOf({ fokus: [v] }, 0, p), ...n } }))
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])
  const down = (e) => { e.currentTarget.setPointerCapture(e.pointerId); const r = frame.current.getBoundingClientRect(); drag.current = { px: e.clientX, py: e.clientY, x: f.x, y: f.y, w: r.width, h: r.height } }
  const move = (e) => {
    const d = drag.current; if (!d || !nat) return
    const s = Math.max(d.w / nat.w, d.h / nat.h), z = f.z
    // rentang geser total (px) setelah zoom = overflow*z + ukuran*(z-1)
    const rx = (nat.w * s - d.w) * z + d.w * (z - 1), ry = (nat.h * s - d.h) * z + d.h * (z - 1)
    const c = (v) => Math.min(100, Math.max(0, Math.round(v * 10) / 10))
    put(place, { x: rx > 1 ? c(d.x - ((e.clientX - d.px) / rx) * 100) : d.x, y: ry > 1 ? c(d.y - ((e.clientY - d.py) / ry) * 100) : d.y })
  }
  const up = () => { drag.current = null }
  const copyAll = () => { const cur = focusOf({ fokus: [vals] }, 0, place); setVals(Object.fromEntries(places.map((p) => [p, { ...cur }]))); toast('Posisi disalin ke semua tempat') }
  return createPortal(
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Atur crop foto" onClick={(e) => e.target === e.currentTarget && onClose()} style={{ zIndex: 120 }}>
      <div className="sheet cropwrap">
        <div className="ed-head"><h2>Atur crop foto</h2><button type="button" className="ib" aria-label="Tutup" onClick={onClose}><Icon n="close" /></button></div>
        <div className="chips" role="tablist">
          {places.map((p) => <button type="button" key={p} role="tab" aria-selected={p === place} className={p === place ? 'chip on' : 'chip'} onClick={() => setPlace(p)}>{PLACES[p].label} · {ratioOf(crop, p).replace('/', ':')}</button>)}
        </div>
        <div className="cframe-box">
          <div className="cframe" ref={frame} style={{ aspectRatio: ratio, width: `min(100%, ${(52 * rw / rh).toFixed(1)}vh)` }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
            <img src={src} alt="" draggable="false" style={imgStyle(f)} onLoad={(e) => setNat({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
            <span className="grid" />
          </div>
        </div>
        <label className="zoomrow">Zoom<input type="range" min="1" max="3" step="0.05" value={f.z} onChange={(e) => put(place, { z: Number(e.target.value) })} /><span>{f.z.toFixed(2).replace(/\.?0+$/, '')}×</span></label>
        <p className="muted">Geser gambar untuk memilih bagian yang tampil. Rasio ({ratio.replace('/', ':')}) diatur di tab <b>Pengaturan crop</b>. Aslinya tidak diubah, jadi bisa diatur ulang kapan saja.</p>
        <div className="actions">
          <button type="button" className="btn" onClick={() => onSave(vals)}>Simpan crop</button>
          <button type="button" className="btn ghost" onClick={() => put(place, { x: 50, y: 50, z: 1 })}>Reset</button>
          {places.length > 1 && <button type="button" className="btn ghost" onClick={copyAll}>Salin ke semua tempat</button>}
        </div>
      </div>
    </div>,
    document.body
  )
}

function PhotoPicker({ value, fokus, max, places, crop, onChange }) {
  const [busy, setBusy] = useState(false)
  const [crp, setCrp] = useState(-1)
  const fk = (i) => fokus[i] || {}
  const add = async (files) => {
    const room = max - value.length
    const list = [...files].filter((f) => f.type.startsWith('image/'))
    if (!list.length) return toast('Pilih file gambar (JPG/PNG/WebP)')
    if (list.length > room) toast(`Maksimal ${max} foto per item`)
    setBusy(true)
    try { const out = await Promise.all(list.slice(0, Math.max(room, 0)).map((f) => compressImage(f))); onChange([...value, ...out], [...value.map((_, i) => fk(i)), ...out.map(() => ({}))]) }
    catch { toast('Sebagian foto gagal dibaca') }
    setBusy(false)
  }
  const cover = (i) => onChange([value[i], ...value.filter((_, n) => n !== i)], [fk(i), ...value.map((_, n) => fk(n)).filter((_, n) => n !== i)])
  const del = (i) => onChange(value.filter((_, n) => n !== i), value.map((_, n) => fk(n)).filter((_, n) => n !== i))
  const setFk = (i, v) => onChange(value, value.map((_, n) => (n === i ? v : fk(n))))
  return (
    <div className="photos">
      <span className="plabel">Foto <small className="muted">(foto pertama jadi sampul · maks {max} · tombol <b>crop</b> untuk mengatur potongan tiap tempat)</small></span>
      <div className="pgrid">
        {value.map((src, i) => (
          <div className="pitem" key={src.slice(-40) + i}>
            <img src={src} alt={`Foto ${i + 1}`} style={imgStyle(focusOf({ fokus }, i, places[0]))} />
            {i === 0 && <span className="pbadge">Sampul</span>}
            <span className="pcrop"><button type="button" className="ib" aria-label="Atur crop" title="Atur crop" onClick={() => setCrp(i)}><Icon n="crop" size={18} /></button></span>
            <div className="pbtns">
              {i > 0 && <button type="button" className="ib" aria-label="Jadikan sampul" title="Jadikan sampul" onClick={() => cover(i)}><Icon n="star" size={18} /></button>}
              <button type="button" className="ib danger" aria-label="Hapus foto" title="Hapus foto" onClick={() => del(i)}><Icon n="delete" size={18} /></button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <label className={busy ? 'padd busy' : 'padd'}>
            <Icon n={busy ? 'hourglass_empty' : 'add_photo_alternate'} size={30} />
            <span>{busy ? 'Memproses…' : 'Tambah foto'}</span>
            <input type="file" accept="image/*" multiple hidden disabled={busy} onChange={(e) => { add(e.target.files); e.target.value = '' }} />
          </label>
        )}
      </div>
      {crp >= 0 && value[crp] && <CropEditor src={value[crp]} places={places} crop={crop} value={fk(crp)} onSave={(v) => { setFk(crp, v); setCrp(-1) }} onClose={() => setCrp(-1)} />}
    </div>
  )
}

/* ---------- Pengaturan rasio crop tiap tempat ---------- */
function CropSettings({ onFail }) {
  const c = useContent()
  const [d, setD] = useState(() => Object.fromEntries(Object.keys(PLACES).map((p) => [p, ratioOf(c.crop, p)])))
  const [busy, setBusy] = useState(false)
  const save = async (val) => {
    setBusy(true)
    try { const r = await adminCall('crop', { crop: val }); applyCrop(r.crop); toast('Pengaturan crop tersimpan'); refresh(true) } catch (e) { onFail(e) }
    setBusy(false)
  }
  return (
    <div className="cset">
      <p className="muted">Tentukan rasio (bentuk potongan) gambar untuk tiap tempat. Misalnya kartu di Beranda persegi 1:1, tetapi sampul di halaman detail lebar 16:9. Posisi tiap foto bisa diatur lewat tombol <b>crop</b> di editor artikel, acara, dan postingan.</p>
      {Object.entries(PLACES).map(([k, p]) => {
        const [w, h] = d[k].split('/').map(Number)
        return (
          <div className="crow" key={k}>
            <div><b>{p.label}</b><span className="muted">Bawaan {p.def.replace('/', ':')}</span></div>
            <select value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} aria-label={`Rasio ${p.label}`}>{RATIOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <span className="cprev" style={{ aspectRatio: `${w}/${h}`, width: w >= h ? 56 : Math.max(24, Math.round((56 * w) / h)) }} aria-hidden="true" />
          </div>
        )
      })}
      <div className="actions">
        <button type="button" className="btn" disabled={busy} onClick={() => save(d)}>{busy ? 'Menyimpan…' : 'Simpan pengaturan'}</button>
        <button type="button" className="btn ghost" disabled={busy} onClick={() => { const def = Object.fromEntries(Object.entries(PLACES).map(([k, p]) => [k, p.def])); setD(def); save(def) }}>Kembalikan bawaan</button>
      </div>
    </div>
  )
}

/* ---------- Profil: foto, bio, visi, misi, angka pengikut ---------- */
function ProfilForm({ onFail }) {
  const c = useContent(), p = useProfil(), raw = c.profil || {}
  const [d, setD] = useState({ foto: p.foto, bio: p.bio, visi: p.visi, misi: p.misi.join('\n'), pengikut: raw.pengikut || '', mengikuti: raw.mengikuti || '' })
  const [busy, setBusy] = useState(false), [pic, setPic] = useState(false)
  const set = (k) => (e) => setD({ ...d, [k]: e.target.value })
  const pick = async (f) => {
    if (!f || !f.type.startsWith('image/')) return toast('Pilih file gambar (JPG/PNG/WebP)')
    setPic(true)
    try { const url = await compressImage(f, 480, 0.82); setD((x) => ({ ...x, foto: url })) } catch { toast('Foto gagal dibaca') }
    setPic(false)
  }
  const save = async (e) => {
    e.preventDefault(); setBusy(true)
    try {
      const foto = d.foto.startsWith('data:') ? (await adminCall('foto', { dataUrl: d.foto })).url : d.foto
      const r = await adminCall('profil', { profil: { ...d, foto, misi: d.misi.split('\n').map((m) => m.trim()).filter(Boolean) } })
      applyProfil(r.profil); setD((x) => ({ ...x, foto: r.profil.foto })); toast('Profil tersimpan'); refresh(true)
    } catch (er) { onFail(er) }
    setBusy(false)
  }
  return (
    <form className="card form pform" onSubmit={save}>
      <p className="muted">Tampil di halaman <b>Profil</b>. Kosongkan Pengikut/Mengikuti agar diambil otomatis dari Instagram.</p>
      <div className="plabel">Foto profil <small className="muted">(kosong = logo)</small></div>
      <div className="avrow">
        {d.foto ? <img className="av" src={d.foto} alt="Foto profil" /> : <Logo size={84} />}
        <div className="btns">
          <label className="btn sm ghost"><Icon n="add_photo_alternate" size={18} />{pic ? 'Memproses…' : 'Pilih foto'}<input type="file" accept="image/*" hidden disabled={pic} onChange={(e) => { pick(e.target.files[0]); e.target.value = '' }} /></label>
          {d.foto && <button type="button" className="btn sm ghost" onClick={() => setD({ ...d, foto: '' })}><Icon n="delete" size={18} />Hapus</button>}
        </div>
      </div>
      <label>Bio<textarea rows="3" maxLength={300} value={d.bio} onChange={set('bio')} /></label>
      <label>Visi<textarea rows="3" maxLength={600} value={d.visi} onChange={set('visi')} /></label>
      <label>Misi (satu poin per baris)<textarea rows="5" value={d.misi} onChange={set('misi')} /></label>
      <label>Jumlah pengikut (opsional, mis. 1,2K)<input maxLength={12} value={d.pengikut} onChange={set('pengikut')} /></label>
      <label>Jumlah mengikuti (opsional)<input maxLength={12} value={d.mengikuti} onChange={set('mengikuti')} /></label>
      <div className="actions"><button className="btn" type="submit" disabled={busy || pic}>{busy ? 'Menyimpan…' : 'Simpan profil'}</button></div>
    </form>
  )
}

function Editor({ cfg, item, crop, onSave, onClose }) {
  const [d, setD] = useState(item)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [])
  const submit = async (e) => { e.preventDefault(); if (saving) return; if (cfg.label === 'Postingan' && !fotos(d).length && !(d.caption || '').trim()) return toast('Isi caption atau tambahkan minimal 1 foto'); setSaving(true); const ok = await onSave({ ...d, ...(d.peserta !== undefined && { peserta: Number(d.peserta) || 0 }) }); if (!ok) setSaving(false) }
  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="sheet editor form" onSubmit={submit}>
        <div className="ed-head"><h2>{item._exists ? 'Edit' : 'Tambah'} {cfg.label.toLowerCase()}</h2>
          <button type="button" className="ib" aria-label="Tutup" onClick={onClose}><Icon n="close" /></button></div>
        {cfg.fields.map(([k, l, t, x]) => (
          <label key={k}>{l}
            {t === 'textarea' ? <textarea rows={x} value={d[k] || ''} onChange={(e) => setD({ ...d, [k]: e.target.value })} required={k === 'isi' || k === 'ringkas'} />
              : t === 'select' ? <select value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })}>{x.map((o) => <option key={o}>{o}</option>)}</select>
              : t === 'color' ? <span className="colorrow"><input type="color" value={d[k]} onChange={(e) => setD({ ...d, [k]: e.target.value })} /><code>{d[k]}</code></span>
              : <input type={t} min={t === 'number' ? 0 : undefined} value={d[k] ?? ''} onChange={(e) => setD({ ...d, [k]: e.target.value })} required={k === 'judul' || t === 'date'} />}
          </label>
        ))}
        {cfg.foto && <PhotoPicker value={fotos(d)} fokus={d.fokus || []} max={cfg.max} places={cfg.places} crop={crop} onChange={(foto, fokus) => setD((p) => ({ ...p, foto, fokus }))} />}
        <div className="actions"><button className="btn" type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button><button type="button" className="btn ghost" onClick={onClose} disabled={saving}>Batal</button></div>
      </form>
    </div>
  )
}

function Dashboard({ onOut }) {
  const c = useContent()
  const [tab, setTab] = useState('artikel')
  const [edit, setEdit] = useState(null)
  const [st, setSt] = useState(null)
  const [bc, setBc] = useState({ title: '', body: '', url: '/' })
  const [sending, setSending] = useState(false)
  const isCrop = tab === 'crop' || tab === 'profil' // tab khusus (bukan daftar item)
  const cfg = CFG[tab] || CFG.artikel
  const list = isCrop ? [] : [...(c[tab] || [])].sort(cfg.sort)
  const nm = (x) => (cfg.title ? cfg.title(x) : x.judul)

  const fail = (e) => { if (e.code === 401) { onOut(); toast(e.message) } else toast(e.code === 503 ? 'Redis belum terhubung (lihat README).' : e.data?.error === 'empty_post' ? 'Postingan kosong: isi caption atau tambahkan foto.' : 'Gagal menyimpan. Periksa koneksi lalu coba lagi.') }
  const loadStats = () => adminCall('stats').then(setSt).catch(() => {})
  useEffect(() => { loadStats(); refresh(true) }, [])

  const save = async (it) => {
    const arr = c[tab] || [], exists = arr.some((x) => x.id === it.id)
    it = { ...it }; delete it._exists
    if (!exists && tab === 'artikel') { const base = slugify(it.judul); let id = base, n = 2; while (arr.some((x) => x.id === id)) id = `${base}-${n++}`; it.id = id }
    try {
      // foto baru (data URL) diunggah dulu ke Redis, item hanya menyimpan tautannya
      if (fotos(it).length) it.foto = await Promise.all(fotos(it).map(async (f) => (f.startsWith('data:') ? (await adminCall('foto', { dataUrl: f })).url : f)))
      const r = await adminCall('save', { kind: tab, item: it })
      applyItem(tab, r.item); setEdit(null)
      toast(r.pushed ? `Tersimpan & notifikasi terkirim ke ${r.pushed.sent} perangkat` : 'Tersimpan di Redis')
      refresh(true); return true
    } catch (e) { fail(e); return false }
  }
  const del = async (it) => {
    if (!confirm(`Hapus "${nm(it)}"? Tindakan ini tidak bisa dibatalkan.`)) return
    try { await adminCall('delete', { kind: tab, id: it.id }); removeItem(tab, it.id); toast('Dihapus'); refresh(true) } catch (e) { fail(e) }
  }
  const exp = () => {
    const a = document.createElement('a'), { jadwal, acara, artikel, postingan, crop, profil } = c
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ jadwal, acara, artikel, postingan, crop, profil }, null, 2)], { type: 'application/json' })); a.download = 'content.json'; a.click(); URL.revokeObjectURL(a.href)
  }
  const imp = (e) => {
    const f = e.target.files[0]; if (!f) return
    f.text().then((t) => adminCall('import', { data: JSON.parse(t) })).then(() => { toast('Konten diimpor ke Redis'); refresh(true) }).catch(() => toast('File tidak valid'))
    e.target.value = ''
  }
  const reset = async () => { if (!confirm('Kembalikan semua konten di Redis ke data awal? Data saat ini akan terhapus.')) return; try { await adminCall('reset'); toast('Konten dikembalikan'); refresh(true) } catch (e) { fail(e) } }
  const kirim = async (e) => {
    e.preventDefault(); setSending(true)
    try { const r = await adminCall('broadcast', bc); toast(`Notifikasi terkirim ke ${r.sent} perangkat`); setBc({ title: '', body: '', url: '/' }) }
    catch (er) { er.code === 503 ? toast('Push belum dikonfigurasi (kunci VAPID, lihat README).') : fail(er) }
    setSending(false)
  }
  return (
    <div className="wrap page">
      <div className="adm-head">
        <div><h1>Dashboard admin</h1><p className="muted">Kelola konten yang tampil di website.</p></div>
        <div className="adm-tools">
          <button className="btn sm ghost" onClick={exp}><Icon n="download" size={18} />Ekspor</button>
          <label className="btn sm ghost"><Icon n="upload" size={18} />Impor<input type="file" accept="application/json" hidden onChange={imp} /></label>
          <button className="btn sm ghost" onClick={reset}><Icon n="restart_alt" size={18} />Reset</button>
          <button className="btn sm" onClick={() => { logout(); onOut() }}><Icon n="logout" size={18} />Keluar</button>
        </div>
      </div>
      <p className="note"><Icon n="check" size={18} /> Semua perubahan langsung tersimpan di Redis dan tampil untuk seluruh pengunjung, tanpa deploy ulang.{c.offline && <> <b>Server tidak terjangkau, data yang tampil bukan data terbaru.</b></>}</p>
      <div className="chips">
        {Object.entries(CFG).map(([k, v]) => <button key={k} className={tab === k ? 'chip on' : 'chip'} aria-pressed={tab === k} onClick={() => setTab(k)}><Icon n={v.icon} size={18} />{v.label} ({(c[k] || []).length})</button>)}
        <button className={tab === 'crop' ? 'chip on' : 'chip'} aria-pressed={tab === 'crop'} onClick={() => setTab('crop')}><Icon n="crop" size={18} />Pengaturan crop</button>
        <button className={tab === 'profil' ? 'chip on' : 'chip'} aria-pressed={tab === 'profil'} onClick={() => setTab('profil')}><Icon n="person" size={18} />Profil</button>
        {!isCrop && <button className="btn sm add" onClick={() => setEdit(cfg.blank())}><Icon n="add" size={20} />Tambah {cfg.label.toLowerCase()}</button>}
      </div>
      {tab === 'crop' ? <CropSettings key={c.ready ? 'r' : 'l'} onFail={fail} /> : tab === 'profil' ? <ProfilForm key={c.ready ? 'r' : 'l'} onFail={fail} /> : <ul className="arows">
        {list.map((x) => (
          <li key={x.id} className="arow">
            {fotos(x).length > 0 ? <img className="athumb" src={fotos(x)[0]} alt="" /> : tab === 'artikel' && <span className="dot" style={{ background: x.warna }} />}
            <div className="grow"><b>{nm(x)}</b><span className="muted">{cfg.sub(x)}</span></div>
            {tab === 'acara' && <span className="chip soft">{isUpcoming(x.tanggal) ? 'Akan datang' : 'Selesai'}</span>}
            <button className="ib" aria-label={`Edit ${nm(x)}`} onClick={() => setEdit({ ...x, _exists: true })}><Icon n="edit" size={22} /></button>
            <button className="ib danger" aria-label={`Hapus ${nm(x)}`} onClick={() => del(x)}><Icon n="delete" size={22} /></button>
          </li>
        ))}
        {!list.length && <li className="empty">Belum ada data. Klik “Tambah”.</li>}
      </ul>}

      <h2 className="h3">Kirim notifikasi</h2>
      <form className="card form bcast" onSubmit={kirim}>
        <p className="muted">{st ? (st.push ? `${st.all} perangkat menerima pengumuman · ${st.subs} perangkat terdaftar` : 'Push belum dikonfigurasi di server (kunci VAPID belum diisi).') : 'Memuat…'} Acara & artikel baru otomatis diumumkan saat disimpan.</p>
        <label>Judul<input required maxLength={80} value={bc.title} onChange={(e) => setBc({ ...bc, title: e.target.value })} /></label>
        <label>Pesan<textarea required rows="2" maxLength={200} value={bc.body} onChange={(e) => setBc({ ...bc, body: e.target.value })} /></label>
        <label>Buka halaman (opsional, mis. /acara)<input value={bc.url} onChange={(e) => setBc({ ...bc, url: e.target.value })} /></label>
        <button className="btn" type="submit" disabled={sending}>{sending ? 'Mengirim…' : 'Kirim ke semua pelanggan'}</button>
      </form>
      {edit && <Editor key={edit.id} cfg={cfg} crop={c.crop} item={edit} onSave={save} onClose={() => setEdit(null)} />}
    </div>
  )
}

export default function Admin() {
  useTitle('Admin')
  const [ok, setOk] = useState(isAdmin())
  return ok ? <Dashboard onOut={() => setOk(false)} /> : <Login onOk={() => setOk(true)} />
}
