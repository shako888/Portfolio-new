/*
   Latest Quillwave release, fetched once and shared by the Builds card, the Explore popup
   and the gallery. Visitors are linked to the Quillwave website; this only feeds the
   version labels.
*/

export const QUILLWAVE_DOWNLOAD = '/api/quillwave'

export const quillwaveRelease = fetch(`${QUILLWAVE_DOWNLOAD}?info=1`)
  .then(r => (r.ok ? r.json() : null))
  .then(info => (info && info.version ? info : null))
  .catch(() => null)

export function formatSize(bytes) {
  return bytes ? `${Math.round(bytes / 1e6)} MB` : ''
}

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  const units = [['y', 31536000], ['mo', 2592000], ['w', 604800], ['d', 86400], ['h', 3600], ['m', 60]]
  for (const [u, n] of units) if (s >= n) return `${Math.floor(s / n)}${u} ago`
  return 'just now'
}
