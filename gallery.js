import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROJECTS } from './projects.js'

gsap.registerPlugin(Flip, ScrollTrigger)

/*
   ALL PROJECTS — live, searchable, sortable gallery.
   · merges live stats (stars, last push, topics) from the GitHub API, cached per session
   · search, domain filters with counts, sort, and a clickable language breakdown
   · cards tilt toward the cursor with a spotlight; filtering/sorting animates with GSAP Flip
   · each card opens a side panel with the repo's README rendered live from GitHub
*/

const USER = 'jjtjtyt6644'
const CACHE_KEY = 'gh-repos-v1'
const CACHE_MS = 30 * 60 * 1000

const LANG_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  HTML: '#e34c26',
  CSS: '#7c5cbf',
  Rust: '#dea584',
  'C#': '#2fa84f',
}
const langColor = lang => LANG_COLORS[lang] || '#64748b'

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// "github.com/jjtjtyt6644/Comptools/releases/latest" → "comptools"
const repoKey = url => (url.split(`github.com/${USER}/`)[1] || '').split('/')[0].toLowerCase()

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  const units = [['y', 31536000], ['mo', 2592000], ['w', 604800], ['d', 86400], ['h', 3600], ['m', 60]]
  for (const [u, n] of units) if (s >= n) return `${Math.floor(s / n)}${u} ago`
  return 'just now'
}

async function loadRepos() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.repos
  } catch { /* storage unavailable */ }
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`)
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const repos = (await res.json()).map(r => ({
    name: r.name, stars: r.stargazers_count, forks: r.forks_count,
    pushed: r.pushed_at, topics: r.topics || [], lang: r.language,
  }))
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos })) } catch { /* ignore */ }
  return repos
}

export function initGallery({ lenis }) {
  const grid = document.getElementById('gallery-grid')
  if (!grid) return {}
  const search = document.getElementById('gallery-search')
  const sortSel = document.getElementById('gallery-sort')
  const filtersEl = document.getElementById('gallery-filters')
  const langBar = document.getElementById('gallery-langbar')
  const langLegend = document.getElementById('gallery-langs')
  const status = document.getElementById('gallery-status')
  const empty = document.getElementById('gallery-empty')
  const follower = document.querySelector('.cursor-follower')

  const projects = PROJECTS.map((p, i) => ({ ...p, key: repoKey(p.url), order: i, stars: 0, pushed: null, topics: [] }))
  const state = { q: '', filter: 'all', lang: null, sort: 'updated' }

  /* ─── Cards ─── */
  projects.forEach(p => {
    const card = document.createElement('article')
    card.className = 'gallery-card'
    card.style.setProperty('--lang', langColor(p.lang))
    card.innerHTML = `
      <button class="gc-hit" type="button" aria-label="Open details for ${esc(p.name)}"></button>
      <div class="gc-spot" aria-hidden="true"></div>
      <div class="gc-header">
        <div class="gc-icon" aria-hidden="true">${esc(p.icon)}</div>
        <span class="gc-lang"><i style="background:${langColor(p.lang)}"></i>${esc(p.lang)}</span>
      </div>
      <h3 class="gc-title">${esc(p.name)}</h3>
      <p class="gc-desc">${esc(p.desc)}</p>
      <div class="gc-meta" aria-live="off"></div>
      <div class="gc-footer">
        <div class="gc-tags">${p.tags.map(t => `<span class="gc-tag">${esc(t)}</span>`).join('')}</div>
        <a href="${esc(p.url)}" target="_blank" rel="noopener" class="gc-link">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          GitHub
        </a>
      </div>`
    card.querySelector('.gc-hit').addEventListener('click', () => openProject(p))
    p.el = card
    grid.appendChild(card)
  })

  /* ─── Tilt + spotlight ─── */
  const fine = window.matchMedia('(pointer: fine)').matches
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (fine) {
    grid.addEventListener('pointermove', e => {
      const card = e.target.closest('.gallery-card')
      if (!card) return
      const r = card.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      card.style.setProperty('--mx', `${x * 100}%`)
      card.style.setProperty('--my', `${y * 100}%`)
      if (!still) {
        card.style.setProperty('--rx', `${(0.5 - y) * 9}deg`)
        card.style.setProperty('--ry', `${(x - 0.5) * 11}deg`)
      }
    })
    grid.addEventListener('pointerover', e => {
      if (e.target.closest('.gallery-card')) follower?.classList.add('hovered')
    })
    grid.addEventListener('pointerout', e => {
      const card = e.target.closest('.gallery-card')
      if (!card || card.contains(e.relatedTarget)) return
      follower?.classList.remove('hovered')
      card.style.setProperty('--rx', '0deg')
      card.style.setProperty('--ry', '0deg')
    })
  }

  /* ─── Filters with counts ─── */
  const DOMAINS = ['all', 'security', 'networking', 'ai', 'tools', 'web']
  filtersEl.innerHTML = DOMAINS.map(d => {
    const n = d === 'all' ? projects.length : projects.filter(p => p.tags.includes(d)).length
    const label = d === 'ai' ? 'AI' : d[0].toUpperCase() + d.slice(1)
    return `<button class="gf-btn${d === 'all' ? ' active' : ''}" type="button" data-filter="${d}" aria-pressed="${d === 'all'}">${label}<span class="gf-count">${n}</span></button>`
  }).join('')
  filtersEl.addEventListener('click', e => {
    const btn = e.target.closest('.gf-btn')
    if (!btn) return
    state.filter = btn.dataset.filter
    filtersEl.querySelectorAll('.gf-btn').forEach(b => {
      b.classList.toggle('active', b === btn)
      b.setAttribute('aria-pressed', String(b === btn))
    })
    apply()
  })

  /* ─── Language breakdown (click a language to filter) ─── */
  function renderLangs() {
    const counts = {}
    projects.forEach(p => { counts[p.lang] = (counts[p.lang] || 0) + 1 })
    const langs = Object.entries(counts).sort((a, b) => b[1] - a[1])
    langBar.innerHTML = langs.map(([l, n]) =>
      `<span style="flex:${n};background:${langColor(l)}" title="${esc(l)}: ${n}"></span>`).join('')
    langLegend.innerHTML = langs.map(([l, n]) =>
      `<button type="button" class="gl-chip${state.lang === l ? ' active' : ''}" data-lang="${esc(l)}" aria-pressed="${state.lang === l}"><i style="background:${langColor(l)}"></i>${esc(l)} <b>${Math.round((n / projects.length) * 100)}%</b></button>`).join('')
  }
  langLegend.addEventListener('click', e => {
    const chip = e.target.closest('.gl-chip')
    if (!chip) return
    state.lang = state.lang === chip.dataset.lang ? null : chip.dataset.lang
    renderLangs()
    apply()
  })
  renderLangs()

  /* ─── Search + sort ─── */
  search.addEventListener('input', () => { state.q = search.value.trim().toLowerCase(); apply() })
  sortSel.addEventListener('change', () => { state.sort = sortSel.value; apply() })
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable
    if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      lenis?.scrollTo('#gallery', { offset: -40 })
      setTimeout(() => search.focus(), 500)
    }
  })

  /* ─── Apply: filter, sort, then Flip-animate the change ─── */
  let refreshTimer
  function apply(animate = true) {
    const flipState = animate && !still ? Flip.getState(projects.map(p => p.el)) : null
    const visible = p =>
      (state.filter === 'all' || p.tags.includes(state.filter)) &&
      (!state.lang || p.lang === state.lang) &&
      (!state.q || `${p.name} ${p.desc} ${p.lang} ${p.tags.join(' ')} ${p.topics.join(' ')}`.toLowerCase().includes(state.q))

    const sorted = [...projects].sort((a, b) => {
      if (state.sort === 'name') return a.name.localeCompare(b.name)
      if (state.sort === 'stars') return b.stars - a.stars || a.order - b.order
      const ta = a.pushed ? Date.parse(a.pushed) : 0
      const tb = b.pushed ? Date.parse(b.pushed) : 0
      return tb - ta || a.order - b.order
    })
    let shown = 0
    sorted.forEach(p => {
      const on = visible(p)
      p.el.classList.toggle('is-hidden', !on)
      if (on) shown++
      grid.appendChild(p.el)
    })
    empty.hidden = shown > 0

    if (flipState) {
      Flip.from(flipState, {
        duration: 0.6, ease: 'power3.inOut', stagger: 0.015, absolute: true, nested: true,
        onEnter: els => gsap.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }),
        onLeave: els => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.3, ease: 'power2.in' }),
      })
    }
    // the page height changed: let ScrollTrigger (and the 3D film) re-measure
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 700)
  }

  /* ─── Live GitHub stats ─── */
  function renderMeta(p) {
    const meta = p.el.querySelector('.gc-meta')
    if (!p.pushed) { meta.innerHTML = ''; return }
    meta.innerHTML = `
      <span title="Last pushed ${esc(new Date(p.pushed).toLocaleString())}"><i class="gc-pulse"></i>Updated ${esc(timeAgo(p.pushed))}</span>
      <span title="Stars">★ ${p.stars}</span>
      ${p.forks ? `<span title="Forks">⑂ ${p.forks}</span>` : ''}`
  }

  ScrollTrigger.create({
    trigger: '#gallery',
    start: 'top 140%',
    once: true,
    onEnter: () => {
      status.textContent = 'Syncing with GitHub…'
      loadRepos().then(repos => {
        const byName = new Map(repos.map(r => [r.name.toLowerCase(), r]))
        projects.forEach(p => {
          const r = byName.get(p.key)
          if (!r) return
          Object.assign(p, { stars: r.stars, forks: r.forks, pushed: r.pushed, topics: r.topics })
          renderMeta(p)
        })
        const latest = projects.filter(p => p.pushed).sort((a, b) => Date.parse(b.pushed) - Date.parse(a.pushed))[0]
        status.innerHTML = `<i class="gc-pulse"></i>Live from GitHub${latest ? ` · last push ${esc(timeAgo(latest.pushed))} (${esc(latest.name)})` : ''}`
        apply(false)
      }).catch(err => {
        console.warn('GitHub stats unavailable:', err)
        status.textContent = 'Showing saved project list (GitHub is not reachable right now)'
        apply(false)
      })
    },
  })

  /* ─── Entrance ─── */
  ScrollTrigger.create({
    trigger: '.gallery-section',
    start: 'top 80%',
    once: true,
    onEnter: () => {
      gsap.from('.gallery-heading .line', { y: '110%', duration: 1.4, stagger: 0.1, ease: 'expo.out' })
      gsap.from('.gallery-sub, .gallery-toolbar, .gallery-langs-wrap', { opacity: 0, y: 20, duration: 1, ease: 'power3.out', delay: 0.3, stagger: 0.1 })
      gsap.from(projects.map(p => p.el), { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out', stagger: 0.04, delay: 0.4, clearProps: 'opacity,transform' })
    },
  })

  /* ─── Detail panel with the live README ─── */
  const drawer = document.getElementById('project-drawer')
  const drawerBody = document.getElementById('pd-body')
  const readme = document.getElementById('pd-readme')
  const closeBtn = document.getElementById('pd-close')
  let lastFocus = null
  const readmeCache = new Map()

  function openProject(p) {
    lastFocus = document.activeElement
    drawer.style.setProperty('--lang', langColor(p.lang))
    document.getElementById('pd-icon').textContent = p.icon
    document.getElementById('pd-title').textContent = p.name
    document.getElementById('pd-desc').textContent = p.desc
    document.getElementById('pd-meta').innerHTML = [
      `<span><i style="background:${langColor(p.lang)}"></i>${esc(p.lang)}</span>`,
      p.pushed ? `<span>Updated ${esc(timeAgo(p.pushed))}</span>` : '',
      p.pushed ? `<span>★ ${p.stars}</span>` : '',
      ...p.tags.map(t => `<span class="pd-tag">${esc(t)}</span>`),
      ...p.topics.filter(t => !p.tags.includes(t)).map(t => `<span class="pd-tag">${esc(t)}</span>`),
    ].join('')
    const gh = document.getElementById('pd-github')
    gh.href = p.url
    const cloneBtn = document.getElementById('pd-clone')
    const repoName = p.url.split(`github.com/${USER}/`)[1].split('/')[0]
    cloneBtn.dataset.cmd = `git clone https://github.com/${USER}/${repoName}.git`
    cloneBtn.textContent = 'Copy clone command'

    drawer.hidden = false
    requestAnimationFrame(() => drawer.classList.add('open'))
    lenis?.stop()
    drawerBody.scrollTop = 0
    closeBtn.focus()
    loadReadme(repoName)
  }

  async function loadReadme(repoName) {
    readme.innerHTML = '<p class="pd-loading">Loading README from GitHub…</p>'
    try {
      let html = readmeCache.get(repoName)
      if (!html) {
        const res = await fetch(`https://api.github.com/repos/${USER}/${repoName}/readme`, {
          headers: { Accept: 'application/vnd.github.html+json' },
        })
        if (!res.ok) throw new Error(`GitHub ${res.status}`)
        const { default: DOMPurify } = await import('dompurify') // only needed once a README is opened
        html = DOMPurify.sanitize(await res.text(), { FORBID_TAGS: ['style', 'form', 'input'], FORBID_ATTR: ['style'] })
        readmeCache.set(repoName, html)
      }
      readme.innerHTML = html
      // README paths like "docs/shot.png" are relative to the repo, not to this site
      const isRelative = v => v && !/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(v)
      const rawBase = `https://raw.githubusercontent.com/${USER}/${repoName}/HEAD/`
      const blobBase = `https://github.com/${USER}/${repoName}/blob/HEAD/`
      readme.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src')
        if (isRelative(src)) img.src = new URL(src.replace(/^\.?\//, ''), rawBase).href
        img.loading = 'lazy'
      })
      readme.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href')
        if (isRelative(href)) a.href = new URL(href.replace(/^\.?\//, ''), blobBase).href
        a.target = '_blank'
        a.rel = 'noopener'
      })
    } catch (err) {
      readme.innerHTML = '<p class="pd-loading">The README couldn\'t be loaded right now. Open the repo on GitHub instead.</p>'
    }
  }

  function closeProject() {
    if (drawer.hidden) return
    drawer.classList.remove('open')
    lenis?.start()
    setTimeout(() => { drawer.hidden = true }, 450)
    lastFocus?.focus?.()
  }

  closeBtn.addEventListener('click', closeProject)
  drawer.addEventListener('click', e => { if (e.target === drawer) closeProject() })
  document.addEventListener('keydown', e => {
    if (drawer.hidden) return
    if (e.key === 'Escape') closeProject()
    if (e.key === 'Tab') {
      // keep focus inside the panel
      const f = [...drawer.querySelectorAll('button, a[href]')].filter(el => el.offsetParent !== null)
      if (!f.length) return
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus() }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus() }
    }
  })
  document.getElementById('pd-clone').addEventListener('click', async e => {
    const btn = e.currentTarget
    try {
      await navigator.clipboard.writeText(btn.dataset.cmd)
      btn.textContent = 'Copied ✓'
    } catch {
      btn.textContent = btn.dataset.cmd
    }
  })

  apply(false)
  return { openProject: name => { const p = projects.find(x => x.name === name); if (p) openProject(p) } }
}
