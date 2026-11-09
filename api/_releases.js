/*
   LATEST QUILLWAVE RELEASE (server-side only; the underscore keeps Vercel from routing it)
   Quillwave ships several releases a day and the installer name carries the version
   (Quillwave-Setup-1.29.0.exe), so a fixed link would go stale. This looks up the newest
   published release and its installer, cached briefly so GitHub isn't asked on every click.
*/

export const QUILLWAVE_REPO = 'stephanieloveshotpot/ai-news-downloader'
export const QUILLWAVE_RELEASES_PAGE = `https://github.com/${QUILLWAVE_REPO}/releases/latest`
const CACHE_MS = 5 * 60 * 1000

let cache = null

export async function latestQuillwave() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value

  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'junyu-portfolio' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 4000)
  try {
    const res = await fetch(`https://api.github.com/repos/${QUILLWAVE_REPO}/releases/latest`, { headers, signal: ctrl.signal })
    if (!res.ok) throw new Error(`GitHub ${res.status}`)
    const rel = await res.json()
    const assets = rel.assets || []
    // Prefer the current installer name; the AI-Pulse-* copies only exist for very old installs
    const installer =
      assets.find(a => /^Quillwave-Setup-.*\.exe$/i.test(a.name)) ||
      assets.find(a => /\.exe$/i.test(a.name))
    if (!installer) throw new Error('No installer in the latest release')

    const value = {
      version: (rel.tag_name || '').replace(/^v/i, ''),
      name: installer.name,
      size: installer.size,
      url: installer.browser_download_url,
      published: rel.published_at,
    }
    cache = { at: Date.now(), value }
    return value
  } catch (err) {
    console.warn('Quillwave release lookup failed:', err.message)
    return cache ? cache.value : null // serve the last good answer if GitHub is unreachable
  } finally {
    clearTimeout(timer)
  }
}
