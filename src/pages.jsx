'use client'
import { useState, useEffect } from 'react'
import { Link, useParams } from './nav.jsx'
import { site, profil } from './data.js'
import { useContent, useInstagram, loadInstagram } from './store.js'
import { Icon, Head, useProfil, useTitle, useStored, useLike, Loading, toast, tones, fmt, upcoming, past, byDate, inkOn, paras, daysLeft, fotos } from './lib.jsx'
import { Post, FeedPost, PostGrid, IgPost, JadwalCard, EventCard, Logo, Gallery, Cover } from './components.jsx'

export function Jadwal() {
  const { jadwal, ready } = useContent()
  const [f, setF] = useState('Semua')
  const jenis = ['Semua', ...new Set(jadwal.map((j) => j.jenis))]
  const data = f === 'Semua' ? jadwal : jadwal.filter((j) => j.jenis === f)
  if (!ready) return <Loading />
  return (
    <div className="wrap page">
      <Head title="Jadwal kajian" sub="Semua kajian terbuka untuk umum. Nyalakan pengingat agar tidak ketinggalan." />
      <div className="chips">{jenis.map((j) => <button key={j} className={f === j ? 'chip on' : 'chip'} aria-pressed={f === j} onClick={() => setF(j)}>{j}</button>)}</div>
      {data.length ? <ul className="list">{data.map((j) => <JadwalCard j={j} key={j.id} />)}</ul> : <p className="empty">Belum ada jadwal.</p>}
    </div>
  )
}

export function Acara() {
  const { acara, ready } = useContent()
  const up = upcoming(acara), done = past(acara)
  if (!ready) return <Loading />
  return (
    <div className="wrap page">
      <Head title="Acara" sub="Acara yang akan datang ada di paling atas. Di bawahnya, dokumentasi acara yang sudah terlaksana." />
      <h2 className="h2">Akan datang</h2>
      {up.length ? <ul className="list">{up.map((e) => <EventCard e={e} key={e.id} />)}</ul>
        : <p className="empty">Belum ada acara terjadwal. Pantau terus halaman ini.</p>}
      <h2 className="h2 gap">Sudah dilaksanakan</h2>
      {done.length ? <ul className="list">{done.map((e) => <EventCard e={e} done key={e.id} />)}</ul>
        : <p className="empty">Belum ada acara yang selesai.</p>}
    </div>
  )
}

export function AcaraDetail() {
  const { id } = useParams()
  const { acara, ready } = useContent()
  const e = acara.find((x) => x.id === id)
  useTitle(e ? e.judul : 'Acara')
  if (!ready) return <Loading />
  if (!e) return <div className="wrap page"><h1>Acara tidak ditemukan</h1><Link className="btn" to="/acara">Semua acara</Link></div>
  const done = past([e]).length === 1
  const wa = `https://wa.me/${site.wa}?text=${encodeURIComponent(`Assalamu\u2019alaikum, saya ingin bertanya tentang acara "${e.judul}".`)}`
  return (
    <article className="read">
      <Link to="/acara" className="link back"><Icon n="arrow_back" size={18} />Semua acara</Link>
      <Cover item={e} tone={done ? 'ink' : 'green'}>
        <span className="chip inv">{done ? 'Selesai' : `Akan datang · ${daysLeft(e.tanggal)}`}</span>
        <h1>{e.judul}</h1>
      </Cover>
      <ul className="facts">
        <li><Icon n="event" size={22} /><span>{fmt(e.tanggal, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></li>
        <li><Icon n="schedule" size={22} /><span>{e.jam} WIB</span></li>
        <li><Icon n="location_on" size={22} /><span>{e.lokasi}</span></li>
        {e.pemateri && <li><Icon n="person" size={22} /><span>{e.pemateri}</span></li>}
      </ul>
      {paras(e.deskripsi).map((p, i) => <p className="body" key={i}>{p}</p>)}
      {done && (e.laporan || e.peserta > 0) && (
        <>
          <h2 className="h3">Laporan acara{e.peserta > 0 && ` · ${e.peserta} peserta`}</h2>
          {paras(e.laporan).map((p, i) => <p className="body" key={i}>{p}</p>)}
        </>
      )}
      <Gallery item={e} title={done ? 'Dokumentasi acara' : 'Foto'} />
      {!done && <div className="actions"><a className="btn" href={wa} target="_blank" rel="noreferrer">Tanya via WhatsApp</a></div>}
    </article>
  )
}

export function Artikel() {
  const { artikel, ready } = useContent()
  const [saved] = useStored('bj-saved', [])
  const [tab, setTab] = useState('semua')
  const all = byDate(artikel)
  const data = tab === 'semua' ? all : all.filter((a) => saved.includes(a.id))
  if (!ready) return <Loading />
  return (
    <div className="wrap page">
      <Head title="Artikel" sub="Tulisan ringan dari para pemateri. Klik dua kali pada gambar atau tekan ikon hati untuk memberi suka." />
      <div className="chips">
        <button className={tab === 'semua' ? 'chip on' : 'chip'} onClick={() => setTab('semua')}>Semua</button>
        <button className={tab === 'simpan' ? 'chip on' : 'chip'} onClick={() => setTab('simpan')}>Disimpan ({saved.length})</button>
      </div>
      {data.length ? <div className="grid3">{data.map((a, i) => <Post a={a} i={i} custom place="artikel" key={a.id} />)}</div>
        : <p className="empty">{tab === 'semua' ? 'Belum ada artikel.' : 'Belum ada artikel tersimpan. Tekan ikon penanda di artikel mana saja untuk menyimpannya.'}</p>}
    </div>
  )
}

export function ArtikelDetail() {
  const { slug } = useParams()
  const { artikel, ready } = useContent()
  const a = artikel.find((x) => x.id === slug)
  const { liked, count, toggle } = useLike('artikel', slug)
  useTitle(a ? a.judul : 'Artikel')
  if (!ready) return <Loading />
  if (!a) return <div className="wrap page"><h1>Artikel tidak ditemukan</h1><Link className="btn" to="/artikel">Semua artikel</Link></div>
  return (
    <article className="read">
      <Link to="/artikel" className="link back"><Icon n="arrow_back" size={18} />Semua artikel</Link>
      <Cover item={a} style={{ background: a.warna, color: inkOn(a.warna) }}><h1>{a.judul}</h1></Cover>
      <p className="meta">{a.penulis} · {fmt(a.tanggal)}</p>
      {paras(a.isi).map((p, i) => <p className="body" key={i}>{p}</p>)}
      <Gallery item={a} />
      <div className="acts flat">
        <button type="button" className={liked ? 'act liked' : 'act'} onClick={toggle} aria-pressed={liked} aria-label="Suka"><Icon n="favorite" fill={liked} /></button>
        <b>{count} suka</b>
      </div>
    </article>
  )
}

export function Tentang() {
  const [tab, setTab] = useState('kegiatan')
  const { acara, postingan, ready } = useContent()
  const tabs = [['kegiatan', 'grid_view', 'Postingan'], ['visi', 'star', 'Visi'], ['misi', 'target', 'Misi']]
  useTitle('Profil')
  const feed = byDate(acara)
  const pf = useProfil()
  const gram = [...postingan].sort((x, y) => y.tanggal.localeCompare(x.tanggal) || y.id.localeCompare(x.id)) // dibuat admin
  useEffect(() => { if (ready && (!gram.length || !(pf.pengikut && pf.mengikuti))) loadInstagram() }, [ready, gram.length, pf.pengikut, pf.mengikuti])
  const { data: ig, loading: igLoading } = useInstagram()
  const short = (n) => (n == null ? '–' : n >= 1e6 ? (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + ' jt' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : n >= 1e3 ? (n / 1e3).toFixed(1).replace('.', ',').replace(',0', '') + 'K' : String(n))
  const posts = gram.length ? String(gram.length) : ig && ig.postingan != null ? short(ig.postingan) : ready ? String(acara.length) : '–'
  const fol = pf.pengikut || (ig?.pengikut != null ? short(ig.pengikut) : profil.pengikut)
  const ing = pf.mengikuti || (ig?.mengikuti != null ? short(ig.mengikuti) : profil.mengikuti)
  const stats = [[posts, 'Postingan'], [fol, 'Pengikut'], [ing, 'Mengikuti']]
  return (
    <div className="wrap page">
      <div className="pro-top">
        <span className="ring lg">{pf.foto ? <img className="logo avatar" src={pf.foto} alt="" width="140" height="140" decoding="async" /> : <Logo size={140} />}</span>
        <div className="pro-info">
          <h1>{site.nama}</h1>
          <p className="bio">{pf.bio}</p>
          <div className="stats">{stats.map(([n, l]) => <div key={l}><b>{n}</b><span>{l}</span></div>)}</div>
          <div className="actions left">
            <a href={site.instagram} target="_blank" rel="noreferrer" className="btn">Ikuti di Instagram</a>
            <Link to="/kontak" className="btn ghost">Hubungi</Link>
          </div>
        </div>
      </div>
      <div className="ptabs" role="tablist">
        {tabs.map(([k, ic, l]) => <button type="button" key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon n={ic} size={20} fill={tab === k} />{l}</button>)}
      </div>
      {tab === 'kegiatan' && (gram.length ? <PostGrid list={gram} />
        : ig && ig.posts.length ? (
          <div className="feedcol">
            {ig.posts.map((p) => <IgPost p={p} user={ig.username || site.instagramUser} key={p.id} />)}
            <a className="btn ghost" href={site.instagram} target="_blank" rel="noreferrer">Lihat semua di Instagram</a>
          </div>)
        : igLoading ? <p className="empty" role="status">Memuat postingan…</p>
        : !ready ? <p className="empty" role="status">Memuat…</p>
        : feed.length ? <div className="feedcol">{feed.map((e, i) => <FeedPost e={e} i={i} key={e.id} />)}</div>
        : <p className="empty">Belum ada kegiatan yang diposting.</p>)}
      {tab === 'visi' && <div className="card"><h3>Visi</h3><p className="bio">{pf.visi}</p></div>}
      {tab === 'misi' && (
        <div className="card"><h3>Misi</h3>
          <ul className="ul">{pf.misi.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
      )}
    </div>
  )
}

export function Kontak() {
  const [f, setF] = useState({ nama: '', pesan: '' })
  const kirim = (e) => {
    e.preventDefault()
    window.open(`https://wa.me/${site.wa}?text=${encodeURIComponent(`Assalamu\u2019alaikum, saya ${f.nama}. ${f.pesan}`)}`, '_blank')
    toast('Membuka WhatsApp…')
  }
  return (
    <div className="wrap page">
      <Head title="Kontak" sub="Tulis pesanmu, lalu lanjutkan lewat WhatsApp." />
      <div className="grid2">
        <form className="card form" onSubmit={kirim}>
          <label>Nama<input required value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} placeholder="Nama lengkap" /></label>
          <label>Pesan<textarea required rows="5" value={f.pesan} onChange={(e) => setF({ ...f, pesan: e.target.value })} placeholder="Apa yang ingin kamu tanyakan?" /></label>
          <button className="btn" type="submit">Kirim lewat WhatsApp</button>
        </form>
        <div className="card">
          <h3>Alamat</h3><p>{site.alamat}</p>
          <h3 className="gap">Email</h3><p><a className="link" href={`mailto:${site.email}`}>{site.email}</a></p>
          <h3 className="gap">Sosial media</h3>
          <p className="socials"><a className="link" href={site.instagram} target="_blank" rel="noreferrer">Instagram @potret.babuljannah</a><a className="link" href={site.youtube} target="_blank" rel="noreferrer">YouTube @babul_jannahtv</a></p>
        </div>
      </div>
    </div>
  )
}
