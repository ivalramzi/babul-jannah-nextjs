import crypto from 'node:crypto'
import { hasRedis, cmd, pipe } from './_redis.js'
import { seedIfEmpty } from './_content.js'
import { broadcast, pushReady } from './_push.js'
import { send, readJson, ip, sha256, ADMIN_HASH, makeToken, isAuthed, KINDS, SAFE_ID, MAX_FOTO, cleanFokus, cleanCrop, cleanProfil } from './_util.js'

const fotoId = (url = '') => (/^\/api\/foto\?id=([a-f0-9]{16,40})$/.exec(url) || [])[1]
const clean = (it) => { const o = { ...it }; delete o._exists; delete o.suka; delete o.komentar; return o }
const cap = (s, n) => String(s ?? '').slice(0, n)

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method' })
  if (!hasRedis()) return send(res, 503, { error: 'redis_not_configured' })
  let b
  try { b = await readJson(req) } catch { return send(res, 400, { error: 'bad_json' }) }
  const H = { 'Cache-Control': 'no-store' }
  try {
    /* ---- login (dibatasi 5 percobaan / menit per IP) ---- */
    if (b.action === 'login') {
      const fk = 'bj:fail:' + ip(req)
      const n = Number(await cmd('GET', fk)) || 0
      if (n >= 5) return send(res, 429, { ok: false, msg: 'Terlalu banyak percobaan. Tunggu 1 menit.' }, H)
      const a = Buffer.from(sha256(String(b.password || ''))), h = Buffer.from(ADMIN_HASH)
      if (a.length === h.length && crypto.timingSafeEqual(a, h)) { await cmd('DEL', fk); return send(res, 200, { ok: true, token: makeToken() }, H) }
      await pipe([['INCR', fk], ['EXPIRE', fk, 60]])
      return send(res, 401, { ok: false, msg: 'Password salah.' }, H)
    }
    if (!isAuthed(req)) return send(res, 401, { error: 'unauthorized' }, H)

    if (b.action === 'foto') {
      const m = /^data:(image\/(?:jpeg|png|webp));base64,[A-Za-z0-9+/=]+$/.exec(String(b.dataUrl || ''))
      if (!m || b.dataUrl.length > 900_000) return send(res, 400, { error: 'foto_invalid' }, H)
      const id = crypto.createHash('sha1').update(b.dataUrl).digest('hex').slice(0, 20)
      await cmd('SET', 'bj:foto:' + id, b.dataUrl)
      return send(res, 200, { url: `/api/foto?id=${id}` }, H)
    }

    if (b.action === 'save') {
      if (!KINDS.includes(b.kind) || !b.item || !SAFE_ID.test(String(b.item.id))) return send(res, 400, { error: 'bad_request' }, H)
      const item = clean(b.item), key = 'bj:' + b.kind
      const old = await cmd('HGET', key, item.id)
      const isNew = !old
      if (Array.isArray(item.foto)) {
        // foto & pengaturan crop-nya (fokus) harus tetap sejajar
        const pairs = item.foto.map((u, i) => [u, item.fokus?.[i]]).filter(([u]) => fotoId(u)).slice(0, MAX_FOTO[b.kind] || 4)
        item.foto = pairs.map((p) => p[0]); item.fokus = pairs.map((p) => cleanFokus(p[1]))
      } else delete item.fokus
      if (b.kind === 'postingan') { item.caption = cap(item.caption, 2200); item.lokasi = cap(item.lokasi, 120); if (!item.foto?.length && !item.caption.trim()) return send(res, 400, { error: 'empty_post' }, H) }
      const cmds = [['HSET', key, item.id, JSON.stringify(item)]]
      // hapus foto lama yang sudah tidak dipakai
      if (old) { const keep = new Set((item.foto || []).map(fotoId)); try { (JSON.parse(old).foto || []).map(fotoId).filter((x) => x && !keep.has(x)).forEach((x) => cmds.push(['DEL', 'bj:foto:' + x])) } catch {} }
      await pipe(cmds)
      let pushed = null
      if (isNew && pushReady() && (b.kind === 'artikel' || b.kind === 'acara')) {
        pushed = await broadcast(b.kind === 'artikel'
          ? { title: 'Artikel baru', body: item.judul, url: `/artikel/${item.id}`, tag: 'new-' + item.id }
          : { title: 'Acara baru', body: item.judul, url: `/acara/${item.id}`, tag: 'new-' + item.id })
      }
      return send(res, 200, { ok: true, item, pushed }, H)
    }

    if (b.action === 'delete') {
      if (!KINDS.includes(b.kind) || !SAFE_ID.test(String(b.id))) return send(res, 400, { error: 'bad_request' }, H)
      const key = 'bj:' + b.kind, old = await cmd('HGET', key, b.id)
      const cmds = [['HDEL', key, b.id]]
      if (b.kind !== 'jadwal') cmds.push(['HDEL', 'bj:likecount', `${b.kind}:${b.id}`], ['DEL', `bj:likes:${b.kind}:${b.id}`])
      try { (JSON.parse(old).foto || []).map(fotoId).filter(Boolean).forEach((x) => cmds.push(['DEL', 'bj:foto:' + x])) } catch {}
      await pipe(cmds)
      return send(res, 200, { ok: true }, H)
    }

    if (b.action === 'import') {
      const d = b.data || {}
      // cadangan lama belum punya "postingan": bagian itu dilewati (data postingan yang ada tidak dihapus)
      if (!KINDS.every((k) => Array.isArray(d[k]) || (k === 'postingan' && d[k] === undefined))) return send(res, 400, { error: 'bad_data' }, H)
      const cmds = []
      if (d.crop) cmds.push(['SET', 'bj:crop', JSON.stringify(cleanCrop(d.crop))])
      if (d.profil) cmds.push(['SET', 'bj:profil', JSON.stringify(cleanProfil(d.profil))])
      for (const k of KINDS) { if (!Array.isArray(d[k])) continue; cmds.push(['DEL', 'bj:' + k]); for (const it of d[k]) if (SAFE_ID.test(String(it.id))) cmds.push(['HSET', 'bj:' + k, it.id, JSON.stringify(clean(it))]) }
      cmds.push(['SET', 'bj:seeded', '1'])
      await pipe(cmds)
      return send(res, 200, { ok: true }, H)
    }

    if (b.action === 'crop') {
      const crop = cleanCrop(b.crop)
      await cmd('SET', 'bj:crop', JSON.stringify(crop))
      return send(res, 200, { ok: true, crop }, H)
    }

    if (b.action === 'profil') {
      const profil = cleanProfil(b.profil)
      const old = await cmd('GET', 'bj:profil'), cmds = [['SET', 'bj:profil', JSON.stringify(profil)]]
      try { const of = fotoId(JSON.parse(old).foto); if (of && of !== fotoId(profil.foto)) cmds.push(['DEL', 'bj:foto:' + of]) } catch {}
      await pipe(cmds)
      return send(res, 200, { ok: true, profil }, H)
    }

    if (b.action === 'reset') { await seedIfEmpty(true); return send(res, 200, { ok: true }, H) }

    if (b.action === 'broadcast') {
      const title = String(b.title || '').slice(0, 80), body = String(b.body || '').slice(0, 200)
      if (!title || !body) return send(res, 400, { error: 'bad_request' }, H)
      if (!pushReady()) return send(res, 503, { error: 'push_not_configured' }, H)
      const url = String(b.url || '/'); const r = await broadcast({ title, body, url: url.startsWith('/') ? url : '/', tag: 'bc-' + Date.now() })
      return send(res, 200, { ok: true, ...r }, H)
    }

    if (b.action === 'stats') {
      const [subs, all] = await pipe([['HLEN', 'bj:subs'], ['SCARD', 'bj:subs:all']])
      return send(res, 200, { subs, all, push: pushReady() }, H)
    }
    send(res, 400, { error: 'unknown_action' }, H)
  } catch (e) { send(res, 500, { error: 'server' }, H) }
}
