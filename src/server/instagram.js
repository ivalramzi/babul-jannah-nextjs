import { hasRedis, cmd } from './_redis.js'
import { send } from './_util.js'

/*
  Profil & feed Instagram publik (scraping ringan). Hasil disimpan di Redis 30 menit, jadi Instagram
  hanya diakses sesekali. Bila Instagram menolak (sering terjadi pada IP server), data terakhir yang
  berhasil diambil tetap dipakai. Tidak ada login/password Instagram yang disimpan.
*/
const USER = process.env.INSTAGRAM_USERNAME || 'potret.babuljannah'
const KEY = 'bj:ig', FRESH = 30 * 60e3
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'

async function scrape() {
  const r = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(USER)}`, {
    headers: { 'x-ig-app-id': '936619743392459', 'User-Agent': UA, Accept: '*/*', 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8', Referer: `https://www.instagram.com/${USER}/` },
    signal: AbortSignal.timeout(8000),
  })
  if (!r.ok) throw new Error('ig_' + r.status)
  const u = (await r.json())?.data?.user
  if (!u) throw new Error('ig_empty')
  const edges = u.edge_owner_to_timeline_media?.edges || []
  return {
    username: u.username || USER,
    nama: u.full_name || '',
    bio: u.biography || '',
    pengikut: u.edge_followed_by?.count ?? null,
    mengikuti: u.edge_follow?.count ?? null,
    postingan: u.edge_owner_to_timeline_media?.count ?? null,
    avatar: u.profile_pic_url_hd || u.profile_pic_url || '',
    posts: edges.slice(0, 12).map(({ node: n }) => ({
      id: n.shortcode,
      img: n.display_url || n.thumbnail_src || '',
      caption: n.edge_media_to_caption?.edges?.[0]?.node?.text || '',
      likes: n.edge_media_preview_like?.count ?? n.edge_liked_by?.count ?? 0,
      comments: n.edge_media_to_comment?.count ?? n.edge_media_preview_comment?.count ?? 0,
      ts: n.taken_at_timestamp || 0,
      video: !!n.is_video,
      multi: n.__typename === 'GraphSidecar',
    })).filter((p) => p.id && p.img),
  }
}

export default async function handler(req, res) {
  const H = { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' }
  let cached = null
  if (hasRedis()) { try { const raw = await cmd('GET', KEY); cached = raw ? JSON.parse(raw) : null } catch {} }
  if (cached && Date.now() - cached.t < FRESH) return send(res, 200, { ...cached.data, cached: true }, H)
  try {
    const data = await scrape()
    if (hasRedis()) { try { await cmd('SET', KEY, JSON.stringify({ t: Date.now(), data })) } catch {} }
    return send(res, 200, data, H)
  } catch (e) {
    if (cached) return send(res, 200, { ...cached.data, cached: true, stale: true }, { 'Cache-Control': 'public, s-maxage=300' })
    return send(res, 502, { error: 'instagram_unavailable', detail: String(e.message || e) }, { 'Cache-Control': 'no-store' })
  }
}
