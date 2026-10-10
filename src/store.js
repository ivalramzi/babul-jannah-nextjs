import { useSyncExternalStore } from 'react'
import seed from './content.json'

/* ---------- Konten (jadwal, acara, artikel) — sumber utama: Redis lewat /api/content ---------- */
const KEY = 'bj-content-cache-v2'
const valid = (s) => s && Array.isArray(s.artikel) && Array.isArray(s.acara) && Array.isArray(s.jadwal)
const EMPTY = { jadwal: [], acara: [], artikel: [], postingan: [], crop: {}, profil: {}, likes: {}, ready: false, offline: false }
const cached = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); return valid(s) ? s : null } catch { return null } }
const first = cached()
let state = first ? { ...EMPTY, ...first, postingan: first.postingan || [], crop: first.crop || {}, profil: first.profil || {}, likes: first.likes || {}, ready: true, offline: false } : EMPTY
const subs = new Set()
const emit = () => subs.forEach((f) => f())
const set = (n) => { state = n; emit() }
const SERVER_STATE = EMPTY // dipakai saat render server & hidrasi
export const useContent = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f) }, () => state, () => SERVER_STATE)

const touched = {} // key suka yang baru diubah di perangkat ini (jangan ditimpa data CDN yang masih lama)
function apply(d) {
  const likes = { ...(d.likes || {}) }
  for (const k in touched) { if (Date.now() - touched[k] < 20000 && k in state.likes) likes[k] = state.likes[k]; else delete touched[k] }
  const next = { jadwal: d.jadwal, acara: d.acara, artikel: d.artikel, postingan: d.postingan || [], crop: d.crop || {}, profil: d.profil || {}, likes }
  if (state.ready && JSON.stringify(next) === JSON.stringify({ jadwal: state.jadwal, acara: state.acara, artikel: state.artikel, postingan: state.postingan, crop: state.crop, profil: state.profil, likes: state.likes })) { if (state.offline) set({ ...state, offline: false }); return }
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  set({ ...next, ready: true, offline: false })
}
let inflight = null
export function refresh(fresh = false) {
  if (inflight) return inflight
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000)
  inflight = fetch('/api/content' + (fresh ? '?t=' + Date.now() : ''), { signal: ctl.signal, cache: 'no-store' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json() })
    .then((d) => { if (!valid(d)) throw new Error('bad'); apply(d); return true })
    .catch(() => {
      // Redis/jaringan tidak tersedia: tetap tampilkan cache terakhir, atau data awal bila belum pernah memuat
      if (!state.ready) set({ ...EMPTY, ...seed, postingan: [], likes: {}, ready: true, offline: true }); else if (!state.offline) set({ ...state, offline: true })
      return false
    })
    .finally(() => { clearTimeout(t); inflight = null })
  return inflight
}
let started = false
export function startSync() {
  if (started) return; started = true
  const go = () => document.visibilityState !== 'hidden' && refresh()
  refresh().then((ok) => { if (!ok) setTimeout(refresh, 4000) })
  addEventListener('online', go)
  document.addEventListener('visibilitychange', go)
  addEventListener('pageshow', (e) => e.persisted && go())
  setInterval(go, 60000)
}

/* perubahan lokal setelah admin menyimpan (data sudah ada di Redis) */
export function applyItem(kind, item) {
  const arr = state[kind] || [], has = arr.some((x) => x.id === item.id)
  set({ ...state, [kind]: has ? arr.map((x) => (x.id === item.id ? item : x)) : [item, ...arr] })
}
export const applyCrop = (crop) => set({ ...state, crop })
export const applyProfil = (profil) => set({ ...state, profil })
export function removeItem(kind, id) { set({ ...state, [kind]: state[kind].filter((x) => x.id !== id) }) }

/* ---------- Suka (data nyata, disimpan di Redis) ---------- */
export const likeKey = (kind, id) => `${kind}:${id}`
export const getDevice = () => {
  let d = ''
  try { d = localStorage.getItem('bj-device') || ''; if (!/^[a-zA-Z0-9-]{8,64}$/.test(d)) { d = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)); localStorage.setItem('bj-device', d) } } catch { d = d || 'anon-' + Math.random().toString(36).slice(2, 12) }
  return d
}
export async function sendLike(kind, id, like) {
  const k = likeKey(kind, id)
  const before = state.likes[k] || 0
  touched[k] = Date.now()
  set({ ...state, likes: { ...state.likes, [k]: Math.max(0, before + (like ? 1 : -1)) } }) // optimistis
  try {
    const r = await fetch('/api/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, id, device: getDevice(), like }) })
    if (!r.ok) throw new Error(r.status)
    const j = await r.json(); touched[k] = Date.now()
    set({ ...state, likes: { ...state.likes, [k]: j.count } })
    return true
  } catch {
    set({ ...state, likes: { ...state.likes, [k]: before } }); delete touched[k]
    return false
  }
}

/* ---------- Login admin (diperiksa di server) ---------- */
const TK = 'bj-token'
const tok = () => { try { return sessionStorage.getItem(TK) || '' } catch { return '' } }
export const isAdmin = () => { const t = tok(); return !!t && Number(t.split('.')[0]) > Date.now() }
export const logout = () => { try { sessionStorage.removeItem(TK) } catch {} }
export async function tryLogin(password) {
  try {
    const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', password }) })
    if (r.status === 503) return { ok: false, msg: 'Redis belum terhubung. Isi variabel UPSTASH_REDIS_REST_URL & TOKEN (lihat README).' }
    const j = await r.json().catch(() => ({}))
    if (j.ok) { sessionStorage.setItem(TK, j.token); return { ok: true } }
    return { ok: false, msg: j.msg || 'Gagal masuk. Coba lagi.' }
  } catch { return { ok: false, msg: 'Tidak bisa terhubung ke server.' } }
}
export async function adminCall(action, body = {}) {
  const r = await fetch('/api/admin', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok() }, body: JSON.stringify({ action, ...body }) })
  const j = await r.json().catch(() => ({}))
  if (r.status === 401) { logout(); const e = new Error('Sesi habis, silakan masuk lagi.'); e.code = 401; throw e }
  if (!r.ok) { const e = new Error(j.error || 'Gagal'); e.code = r.status; e.data = j; throw e }
  return j
}

/* ---------- Instagram (profil + feed asli lewat /api/instagram) ---------- */
const IGK = 'bj-ig-cache-v1'
const igCached = () => { try { const s = JSON.parse(localStorage.getItem(IGK)); return s && Array.isArray(s.posts) ? s : null } catch { return null } }
let ig = { data: igCached(), loading: true, failed: false }
const igSubs = new Set()
const igSet = (n) => { ig = n; igSubs.forEach((f) => f()) }
let igStarted = false
export function loadInstagram() {
  if (igStarted) return; igStarted = true
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 12000)
  fetch('/api/instagram', { signal: ctl.signal })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json() })
    .then((d) => { if (!Array.isArray(d.posts)) throw new Error('bad'); try { localStorage.setItem(IGK, JSON.stringify(d)) } catch {}; igSet({ data: d, loading: false, failed: false }) })
    .catch(() => igSet({ data: ig.data, loading: false, failed: !ig.data }))
    .finally(() => clearTimeout(t))
}
const IG_SERVER = { data: null, loading: true, failed: false }
export const useInstagram = () => useSyncExternalStore((f) => { igSubs.add(f); return () => igSubs.delete(f) }, () => ig, () => IG_SERVER)
