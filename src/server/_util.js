import crypto from 'node:crypto'

export const send = (res, status, obj, headers = {}) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
  res.end(JSON.stringify(obj))
}
export async function readJson(req) {
  if (req.body !== undefined && req.body !== null) return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body
  const chunks = []
  for await (const c of req) chunks.push(c)
  const t = Buffer.concat(chunks).toString('utf8')
  return t ? JSON.parse(t) : {}
}
export const query = (req) => Object.fromEntries(new URL(req.url, 'http://x').searchParams)
export const ip = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'x').split(',')[0].trim()
export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex')

/* ---------- Auth admin (token bertanda tangan HMAC, berlaku 12 jam) ---------- */
const DEFAULT_HASH = 'df33c437524285d8db5749d5ff820d461387fc3a64bd1c54cae64edd245040c8' // password: babuljannah
export const ADMIN_HASH = process.env.ADMIN_PASSWORD_HASH || process.env.VITE_ADMIN_HASH || DEFAULT_HASH
const SECRET = process.env.SESSION_SECRET || sha256('bj-session:' + ADMIN_HASH)
const sign = (p) => crypto.createHmac('sha256', SECRET).update(p).digest('base64url')
export const makeToken = () => { const p = String(Date.now() + 12 * 3600e3); return `${p}.${sign(p)}` }
export function verifyToken(t = '') {
  const [p, s] = String(t).split('.')
  if (!p || !s || Number(p) < Date.now()) return false
  const a = Buffer.from(sign(p)), b = Buffer.from(s)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}
export const isAuthed = (req) => verifyToken(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''))

export const KINDS = ['artikel', 'acara', 'jadwal', 'postingan', 'sorotan', 'pengurus']
export const REQUIRED_KINDS = ['artikel', 'acara', 'jadwal'] // jenis lain boleh tidak ada di cadangan lama
export const ORDERABLE = ['postingan', 'pengurus', 'sorotan']
export const MAX_FOTO = { artikel: 4, acara: 4, postingan: 10, pengurus: 1 }
export const SOROTAN_ICONS = ['calendar_month', 'event', 'favorite', 'star', 'article', 'campaign', 'person', 'location_on', 'notifications', 'mail', 'schedule', 'home', 'target', 'check']
// Tempat gambar tampil (kunci pengaturan crop). Harus sama dengan PLACES di src/data.js
export const PLACES = ['beranda', 'artikel', 'feed', 'grid', 'cover', 'galeri', 'popup', 'pengurus']
export const RATIO_RE = /^([1-9]|1[0-9]|2[0-1])\/([1-9]|1[0-9]|2[0-1])$/
const num = (v, lo, hi, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v * 100) / 100)) : d }
// fokus = array sejajar dengan foto: [{ [tempat]: {x,y,z} }]
export function cleanFokus(f) {
  const o = {}
  if (f && typeof f === 'object') for (const p of PLACES) if (f[p] && typeof f[p] === 'object') o[p] = { x: num(f[p].x, 0, 100, 50), y: num(f[p].y, 0, 100, 50), z: num(f[p].z, 1, 3, 1) }
  return o
}
export function cleanCrop(c) {
  const o = {}
  if (c && typeof c === 'object') for (const p of PLACES) if (RATIO_RE.test(String(c[p] || ''))) o[p] = String(c[p])
  return o
}
export const SAFE_ID = /^[a-zA-Z0-9_-]{1,120}$/

// Profil yang diatur admin (bio, visi, misi, jumlah pengikut, infaq, foto profil)
const str = (v, n) => String(v ?? '').trim().slice(0, n)
export function cleanProfil(p = {}) {
  return {
    bio: str(p.bio, 300), visi: str(p.visi, 600),
    misi: (Array.isArray(p.misi) ? p.misi : []).map((m) => str(m, 200)).filter(Boolean).slice(0, 8),
    pengikut: str(p.pengikut, 12), infaq: str(p.infaq, 500),
    foto: /^\/api\/foto\?id=[a-f0-9]{16,40}$/.test(String(p.foto || '')) ? String(p.foto) : '',
  }
}
// Isian per jenis item (batas panjang, nilai yang diizinkan)
export function cleanItem(kind, it) {
  const o = { ...it }
  if (kind === 'postingan') {
    o.caption = str(o.caption, 2200); o.lokasi = str(o.lokasi, 120); o.sematkan = !!o.sematkan
    if (Number.isFinite(Number(o.urut))) o.urut = Number(o.urut); else delete o.urut
    if (Number.isFinite(Number(o.dibuat))) o.dibuat = Number(o.dibuat); else delete o.dibuat
  }
  if (kind === 'pengurus') { o.nama = str(o.nama, 80); o.peran = str(o.peran, 80); if (Number.isFinite(Number(o.urut))) o.urut = Number(o.urut); else delete o.urut }
  if (kind === 'sorotan') {
    o.label = str(o.label, 30); o.slides = str(o.slides, 2500)
    if (!SOROTAN_ICONS.includes(o.icon)) o.icon = 'star'
    if (Number.isFinite(Number(o.urut))) o.urut = Number(o.urut); else delete o.urut
    delete o.foto; delete o.fokus
  }
  return o
}
