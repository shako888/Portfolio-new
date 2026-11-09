import { latestQuillwave, QUILLWAVE_RELEASES_PAGE } from './_releases.js'

/*
   GET /api/quillwave          → redirects to the newest Quillwave Windows installer
   GET /api/quillwave?info=1   → { version, name, size, published } for labels on the page
   If GitHub can't be reached, the download falls back to the latest-release page.
*/
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).json({ error: 'Method not allowed' })

  const latest = await latestQuillwave()
  const wantsInfo = /[?&]info=1\b/.test(req.url || '')

  if (wantsInfo) {
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    if (!latest) return res.status(503).json({ error: 'Release info unavailable' })
    const { version, name, size, published } = latest
    return res.status(200).json({ version, name, size, published })
  }

  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  res.statusCode = 302
  res.setHeader('Location', latest ? latest.url : QUILLWAVE_RELEASES_PAGE)
  res.end()
}
