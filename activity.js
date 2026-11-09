import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROJECTS } from './projects.js'
import { timeAgo } from './releases.js'

/*
   RECENTLY SHIPPED — Junyu's latest public GitHub activity, in the Experience section.
   Reads the public events feed, groups back-to-back events on the same project, and shows
   project names as the site uses them (pushes to the Quillwave repo read "Quillwave").
   Commit messages are deliberately not shown — only what, where and when.
*/

const USER = 'jjtjtyt6644'
const CACHE_KEY = 'gh-activity-v1'
const CACHE_MS = 15 * 60 * 1000
const MAX_ROWS = 6

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// "owner/name" → how the site names it, and where it links
function describeRepo(full) {
  const lower = full.toLowerCase()
  const project = PROJECTS.find(p =>
    (p.repo && p.repo.toLowerCase() === lower) ||
    p.url.toLowerCase().includes(`github.com/${lower}`))
  if (project) return { name: project.name, href: project.website || project.url }
  const short = full.split('/')[1]
  return { name: short.replace(/[-_]+/g, ' '), href: `https://github.com/${full}` }
}

async function loadEvents() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.events
  } catch { /* storage unavailable */ }
  const res = await fetch(`https://api.github.com/users/${USER}/events/public?per_page=50`)
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const events = (await res.json()).map(e => ({
    type: e.type, repo: e.repo.name, at: e.created_at,
    tag: e.payload?.release?.tag_name, refType: e.payload?.ref_type, action: e.payload?.action,
  }))
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), events })) } catch { /* ignore */ }
  return events
}

// Turn raw events into a few readable rows, merging runs of the same thing on the same repo
function toRows(events) {
  const rows = []
  for (const e of events) {
    let kind = null
    if (e.type === 'PushEvent') kind = 'push'
    else if (e.type === 'ReleaseEvent' && e.action === 'published') kind = 'release'
    else if (e.type === 'CreateEvent' && e.refType === 'repository') kind = 'create'
    else if (e.type === 'PublicEvent') kind = 'public'
    if (!kind) continue

    const last = rows[rows.length - 1]
    if (last && last.kind === kind && last.repo === e.repo && kind === 'push') {
      last.count++
      continue
    }
    if (rows.length >= MAX_ROWS) break
    rows.push({ kind, repo: e.repo, at: e.at, count: 1, tag: e.tag })
  }
  return rows
}

function rowHtml(r) {
  const { name, href } = describeRepo(r.repo)
  const what = {
    push: r.count > 1 ? `${r.count} pushes to` : 'Pushed to',
    release: r.tag ? `Released ${esc(r.tag)} of` : 'Published a release of',
    create: 'Started',
    public: 'Open-sourced',
  }[r.kind]
  return `<li class="activity-item activity-${r.kind}">
      <span class="activity-dot" aria-hidden="true"></span>
      <span class="activity-text">${what} <a href="${esc(href)}" target="_blank" rel="noopener">${esc(name)}</a></span>
      <time datetime="${esc(r.at)}" title="${esc(new Date(r.at).toLocaleString())}">${esc(timeAgo(r.at))}</time>
    </li>`
}

export function initActivity() {
  const list = document.getElementById('activity-list')
  if (!list) return
  ScrollTrigger.create({
    trigger: list,
    start: 'top 140%',
    once: true,
    onEnter: () => {
      loadEvents()
        .then(events => {
          const rows = toRows(events)
          list.innerHTML = rows.length
            ? rows.map(rowHtml).join('')
            : '<li class="activity-empty">No public activity in the last few weeks.</li>'
        })
        .catch(() => {
          list.innerHTML = '<li class="activity-empty">GitHub activity is unavailable right now.</li>'
        })
    },
  })
}
