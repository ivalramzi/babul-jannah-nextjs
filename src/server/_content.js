import seed from './_seed.js'
import { cmd, pipe, toObj } from './_redis.js'
import { KINDS } from './_util.js'

const hkey = (k) => 'bj:' + k
const parse = (s) => { try { return JSON.parse(s) } catch { return null } }

export async function seedIfEmpty(force = false) {
  if (!force && (await cmd('EXISTS', 'bj:seeded'))) return
  const cmds = []
  for (const k of KINDS) {
    if (!seed[k]) continue // postingan tidak ikut data awal (tidak ikut terhapus saat Reset)
    if (force) cmds.push(['DEL', hkey(k)])
    for (const it of seed[k]) cmds.push(['HSET', hkey(k), it.id, JSON.stringify(it)])
  }
  cmds.push(['SET', 'bj:seeded', '1'])
  await pipe(cmds)
}

export async function readAll() {
  await seedIfEmpty()
  const r = await pipe([...KINDS.map((k) => ['HGETALL', hkey(k)]), ['HGETALL', 'bj:likecount'], ['GET', 'bj:crop'], ['GET', 'bj:profil']])
  const out = {}
  KINDS.forEach((k, i) => { out[k] = Object.values(toObj(r[i])).map(parse).filter(Boolean) })
  const lc = toObj(r[KINDS.length]); out.likes = {}; out.crop = parse(r[KINDS.length + 1]) || {}; out.profil = parse(r[KINDS.length + 2]) || {}
  for (const [k, v] of Object.entries(lc)) out.likes[k] = Number(v) || 0
  return out
}
