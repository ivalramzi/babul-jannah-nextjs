'use client'
import { useState, useMemo, useRef } from 'react'
import { Link, useParams } from './nav.jsx'
import { site } from './data.js'
import { useContent } from './store.js'
import { Icon, Head, useProfil, sortPosts, byUrut, fit, useTitle, useStored, useLike, Loading, toast, tones, fmt, upcoming, past, byDate, inkOn, paras, daysLeft, fotos } from './lib.jsx'
import { useSlide } from './motion.jsx'
import { Count, Post, PostGrid, Stories, JadwalCard, EventCard, Logo, Gallery, Cover } from './components.jsx'

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
        <Count n={count} />
      </div>
    </article>
  )
}

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']
const initials = (n = '') => n.replace(/^(ust\.?|ustadz|ustadzah|ustz\.?|kh\.?|h\.|hj\.)\s+/i, '').trim().slice(0, 1).toUpperCase() || '•'

export function Tentang() {
  const [tab, setTab] = useState('postingan')
  const tabsRef = useRef(null)
  useSlide(tabsRef, 'button.on', tab)
  const { postingan, jadwal, pengurus, ready } = useContent()
  const pf = useProfil()
  useTitle('Profil')
  const gram = useMemo(() => sortPosts(postingan), [postingan])
  const tim = useMemo(() => [...pengurus].sort(byUrut), [pengurus])
  const kajian = useMemo(() => [...jadwal].sort((a, b) => HARI.indexOf(a.hari) - HARI.indexOf(b.hari) || a.jam.localeCompare(b.jam)), [jadwal])
  const stats = [[ready ? String(gram.length) : '–', 'Postingan'], [ready ? String(jadwal.length) : '–', 'Kajian rutin'], ...(pf.pengikut ? [[pf.pengikut, 'Pengikut']] : [])]
  const wa = `https://wa.me/${site.wa}?text=${encodeURIComponent('Assalamu\u2019alaikum, saya ingin bertanya.')}`
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.alamat)}`
  const tabs = [['postingan', 'grid_view', 'Postingan'], ['tentang', 'star', 'Tentang']]
  const share = async () => {
    const url = location.origin + '/tentang'
    try { if (navigator.share) await navigator.share({ title: site.nama, url }); else { await navigator.clipboard.writeText(url); toast('Tautan profil disalin') } } catch {}
  }
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
            <a href={wa} target="_blank" rel="noreferrer" className="btn ghost">WhatsApp</a>
            <button type="button" className="btn ghost" onClick={share} aria-label="Bagikan profil"><Icon n="send" size={18} />Bagikan</button>
          </div>
        </div>
      </div>
      <div className="pro-hl"><Stories /></div>
      <div className="ptabs" role="tablist" ref={tabsRef}>
        {tabs.map(([k, ic, l]) => <button type="button" key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}><Icon n={ic} size={20} fill={tab === k} />{l}</button>)}
      </div>
      {tab === 'postingan' && (gram.length ? <PostGrid list={gram} />
        : !ready ? <p className="empty" role="status">Memuat…</p>
        : <p className="empty">Belum ada postingan. Lihat kegiatan terbaru kami di Instagram.</p>)}
      {tab === 'postingan' && <div className="actions"><a className="btn ghost" href={site.instagram} target="_blank" rel="noreferrer">Lihat semua di Instagram</a></div>}
      {tab === 'tentang' && (
        <div className="about">
          <div className="card"><h3>Visi</h3><p className="bio">{pf.visi}</p></div>
          <div className="card"><h3>Misi</h3><ul className="ul">{pf.misi.map((m, i) => <li key={i}>{m}</li>)}</ul></div>
          <div className="card">
            <h3>Alamat & kontak</h3>
            <p>{site.alamat}</p>
            <div className="actions left"><a className="btn sm" href={maps} target="_blank" rel="noreferrer"><Icon n="location_on" size={18} />Buka di Maps</a><a className="btn sm ghost" href={wa} target="_blank" rel="noreferrer">WhatsApp</a></div>
            <p className="socials"><a className="link" href={site.instagram} target="_blank" rel="noreferrer">Instagram</a><a className="link" href={site.youtube} target="_blank" rel="noreferrer">YouTube</a><a className="link" href={`mailto:${site.email}`}>Email</a></p>
          </div>
          {kajian.length > 0 && (
            <div className="card">
              <h3>Kajian rutin</h3>
              <ul className="mini">{kajian.map((j) => <li key={j.id}><b>{j.hari}</b><span>{j.jam} · {j.judul}</span></li>)}</ul>
              <Link to="/jadwal" className="link">Lihat jadwal lengkap</Link>
            </div>
          )}
          {pf.infaq && (
            <div className="card">
              <h3>Infaq & donasi</h3>
              <p className="bio">{pf.infaq}</p>
              <div className="actions left"><a className="btn sm ghost" href={`https://wa.me/${site.wa}?text=${encodeURIComponent('Assalamu\u2019alaikum, saya ingin konfirmasi infaq.')}`} target="_blank" rel="noreferrer">Konfirmasi via WhatsApp</a></div>
            </div>
          )}
          {tim.length > 0 && (
            <div className="card">
              <h3>Pengurus & pemateri</h3>
              <ul className="team">{tim.map((t) => (
                <li key={t.id}>
                  <span className="tav">{fotos(t).length ? <img src={fotos(t)[0]} style={fit(t, 0, 'pengurus')} alt="" loading="lazy" decoding="async" /> : initials(t.nama)}</span>
                  <b>{t.nama}</b>{t.peran && <small>{t.peran}</small>}
                </li>
              ))}</ul>
            </div>
          )}
        </div>
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
