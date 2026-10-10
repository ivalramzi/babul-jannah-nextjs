import { query } from './_util.js'

// Proxy gambar Instagram: CDN Instagram memblokir hotlink dan tautannya kedaluwarsa. Hanya host Instagram/Facebook CDN yang diizinkan.
const okHost = (h) => /(^|\.)(cdninstagram\.com|fbcdn\.net)$/i.test(h)
export default async function handler(req, res) {
  try {
    const u = new URL(String(query(req).u || ''))
    if (u.protocol !== 'https:' || !okHost(u.hostname)) { res.statusCode = 400; return res.end('bad') }
    const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/*' }, signal: AbortSignal.timeout(8000) })
    const type = r.headers.get('content-type') || ''
    if (!r.ok || !type.startsWith('image/')) { res.statusCode = 404; return res.end('nf') }
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length > 4e6) { res.statusCode = 413; return res.end('big') }
    res.statusCode = 200
    res.setHeader('Content-Type', type)
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, immutable')
    res.end(buf)
  } catch { res.statusCode = 502; res.end('err') }
}
