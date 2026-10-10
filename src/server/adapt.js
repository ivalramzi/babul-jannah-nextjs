// Adaptor tipis: menjalankan handler gaya Node (req, res) sebagai Route Handler Next.js (Request -> Response).
// Dengan begitu seluruh logika API (Redis, push, admin, dst.) tetap sama seperti sebelumnya.
export function adapt(handler) {
  return async (request) => {
    const url = new URL(request.url)
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text()
    const req = { method: request.method, url: url.pathname + url.search, headers: Object.fromEntries(request.headers), body, socket: {} }
    return new Promise((resolve) => {
      const headers = new Headers()
      let done = false
      const res = {
        statusCode: 200,
        setHeader: (k, v) => headers.set(k, v),
        end(b) {
          if (done) return
          done = true
          const payload = b == null || b === '' ? null : typeof b === 'string' ? b : new Uint8Array(b)
          resolve(new Response(payload, { status: res.statusCode, headers }))
        },
      }
      Promise.resolve(handler(req, res)).then(() => res.end()).catch(() => { res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end('{"error":"server"}') })
    })
  }
}
