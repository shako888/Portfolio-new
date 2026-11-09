import { gsap } from 'gsap'
import { Flip } from 'gsap/Flip'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROJECTS } from './projects.js'
import { quillwaveRelease, formatSize, timeAgo } from './releases.js'

gsap.registerPlugin(Flip, ScrollTrigger)

/*
   ALL PROJECTS — live, searchable, sortable gallery.
   · merges live stats (stars, last push, topics) from the GitHub API, cached per session
   · search, domain filters with counts, sort, and a clickable language breakdown
   · cards tilt toward the cursor with a spotlight; filtering/sorting animates with GSAP Flip
   · each card opens a side panel with the repo's README rendered live from GitHub
*/

const USER = 'jjtjtyt6644'
const CACHE_KEY = 'gh-repos-v2'
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

// Two-letter tile for each project: "RobloxAccountManager" → RA, "Web-Proxy" → WP, "Killswitch" → KI
const monogram = name => {
  const words = name.split(/[-_\s]+|(?=[A-Z][a-z])/).filter(Boolean)
  return (words.length > 1 ? words[0][0] + words[1][0] : name.slice(0, 2)).toUpperCase()
}

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// "owner/name" for each project: its own `repo` field, else taken from the jjtjtyt6644 URL
// ("github.com/jjtjtyt6644/Comptools/releases/latest" → "jjtjtyt6644/Comptools")
const fullRepo = p => p.repo || `${USER}/${(p.url.split(`github.com/${USER}/`)[1] || '').split('/')[0]}`

const toStats = r => ({
  full: r.full_name.toLowerCase(), stars: r.stargazers_count, forks: r.forks_count,
  pushed: r.pushed_at, topics: r.topics || [], lang: r.language,
})

async function loadRepos() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.repos
  } catch { /* storage unavailable */ }
  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`)
  if (!res.ok) throw new Error(`GitHub ${res.status}`)
  const repos = (await res.json()).map(toStats)
  // Projects Junyu leads that live under other accounts (e.g. Quillwave)
  const external = PROJECTS.filter(p => p.repo && !p.repo.toLowerCase().startsWith(`${USER.toLowerCase()}/`))
  const extra = await Promise.all(external.map(p =>
    fetch(`https://api.github.com/repos/${p.repo}`).then(r => (r.ok ? r.json() : null)).catch(() => null)))
  extra.filter(Boolean).forEach(r => repos.push(toStats(r)))
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

  const projects = PROJECTS.map((p, i) => ({ ...p, full: fullRepo(p), order: i, stars: 0, pushed: null, topics: [] }))

  const WEB_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
  const GH_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>'
  // Projects with their own website (Quillwave) link there instead of GitHub
  const cardLink = p => p.website
    ? `<a href="${esc(p.website)}" target="_blank" rel="noopener" class="gc-link gc-download">${WEB_ICON}<span>Website</span></a>`
    : `<a href="${esc(p.url)}" target="_blank" rel="noopener" class="gc-link">${GH_ICON}GitHub</a>`
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
        <div class="gc-icon" aria-hidden="true" style="--tile:${langColor(p.lang)}">${esc(monogram(p.name))}</div>
        <span class="gc-lang"><i style="background:${langColor(p.lang)}"></i>${esc(p.lang)}</span>
      </div>
      <h3 class="gc-title">${esc(p.name)}${p.role ? ` <span class="gc-role">${esc(p.role)}</span>` : ''}</h3>
      <p class="gc-desc">${esc(p.desc)}</p>
      <div class="gc-meta" aria-live="off"></div>
      <div class="gc-footer">
        <div class="gc-tags">${p.tags.map(t => `<span class="gc-tag">${esc(t)}</span>`).join('')}</div>
        ${cardLink(p)}
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
    if (!p.pushed && !p.release) { meta.innerHTML = ''; return }
    meta.innerHTML = `
      ${p.pushed ? `<span title="Last pushed ${esc(new Date(p.pushed).toLocaleString())}"><i class="gc-pulse"></i>Updated ${esc(timeAgo(p.pushed))}</span>` : ''}
      ${p.release ? `<span title="Newest release">v${esc(p.release.version)} · ${esc(formatSize(p.release.size))}</span>` : `<span title="Stars">★ ${p.stars}</span>`}
      ${p.forks ? `<span title="Forks">⑂ ${p.forks}</span>` : ''}`
  }

  // Newest Quillwave release shown on its card (version + installer size)
  quillwaveRelease.then(info => {
    const q = info && projects.find(p => p.name === 'Quillwave')
    if (!q) return
    q.release = info
    renderMeta(q)
  })

  ScrollTrigger.create({
    trigger: '#gallery',
    start: 'top 140%',
    once: true,
    onEnter: () => {
      status.textContent = 'Syncing with GitHub…'
      loadRepos().then(repos => {
        const byRepo = new Map(repos.map(r => [r.full, r]))
        projects.forEach(p => {
          const r = byRepo.get(p.full.toLowerCase())
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
    const icon = document.getElementById('pd-icon')
    icon.textContent = monogram(p.name)
    icon.style.setProperty('--tile', langColor(p.lang))
    document.getElementById('pd-title').textContent = p.name
    document.getElementById('pd-desc').textContent = p.desc
    document.getElementById('pd-meta').innerHTML = [
      p.role ? `<span class="pd-tag pd-role">${esc(p.role)}</span>` : '',
      `<span><i style="background:${langColor(p.lang)}"></i>${esc(p.lang)}</span>`,
      p.release ? `<span>Latest v${esc(p.release.version)}</span>` : '',
      p.pushed ? `<span>Updated ${esc(timeAgo(p.pushed))}</span>` : '',
      p.pushed && !p.website ? `<span>★ ${p.stars}</span>` : '',
      ...p.tags.map(t => `<span class="pd-tag">${esc(t)}</span>`),
      ...p.topics.filter(t => !p.tags.includes(t)).map(t => `<span class="pd-tag">${esc(t)}</span>`),
    ].join('')
    const gh = document.getElementById('pd-github')
    const cloneBtn = document.getElementById('pd-clone')
    if (p.website) {
      // Projects with their own website: link there instead of GitHub, no clone command
      gh.href = p.website
      gh.target = '_blank'
      gh.textContent = 'Visit the Quillwave website →'
      cloneBtn.hidden = true
    } else {
      gh.href = p.url
      gh.target = '_blank'
      gh.textContent = 'Open on GitHub →'
      cloneBtn.hidden = false
      cloneBtn.dataset.cmd = `git clone https://github.com/${p.full}.git`
      cloneBtn.textContent = 'Copy clone command'
    }

    drawer.hidden = false
    requestAnimationFrame(() => drawer.classList.add('open'))
    lenis?.stop()
    drawerBody.scrollTop = 0
    closeBtn.focus()
    const label = drawer.querySelector('.pd-readme-label')
    if (p.about) {
      // Curated overview (e.g. Quillwave, whose app repo is private) instead of a README
      label.textContent = 'About the app'
      readme.innerHTML = p.about.map(sec => `
        <h3>${esc(sec.title)}</h3>
        <ul>${sec.items.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`).join('')
    } else {
      label.textContent = 'README · live from GitHub'
      loadReadme(p.full)
    }
    // Shareable link to this project (replaceState: no extra history entries)
    history.replaceState(null, '', `#project/${encodeURIComponent(p.name)}`)
    const share = document.getElementById('pd-share')
    share.textContent = 'Copy link'
  }

  async function loadReadme(repoName) {
    readme.innerHTML = '<p class="pd-loading">Loading README from GitHub…</p>'
    try {
      let html = readmeCache.get(repoName)
      if (!html) {
        const res = await fetch(`https://api.github.com/repos/${repoName}/readme`, {
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
      const rawBase = `https://raw.githubusercontent.com/${repoName}/HEAD/`
      const blobBase = `https://github.com/${repoName}/blob/HEAD/`
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
    if (location.hash.startsWith('#project/')) history.replaceState(null, '', location.pathname + location.search)
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

  document.getElementById('pd-share').addEventListener('click', async e => {
    const btn = e.currentTarget
    try {
      await navigator.clipboard.writeText(location.href)
      btn.textContent = 'Link copied ✓'
    } catch {
      btn.textContent = location.href
    }
  })

  // Deep links: /#project/Killswitch opens that project's panel on arrival
  const openFromHash = () => {
    const m = /^#project\/(.+)$/.exec(location.hash)
    const p = m && projects.find(x => x.name === decodeURIComponent(m[1]))
    if (!p) return
    lenis?.scrollTo('#gallery', { immediate: true })
    setTimeout(() => openProject(p), 300)
  }
  window.addEventListener('hashchange', openFromHash)
  if (location.hash.startsWith('#project/')) window.addEventListener('load', () => setTimeout(openFromHash, 600), { once: true })

  apply(false)
  return { openProject: name => { const p = projects.find(x => x.name === name); if (p) openProject(p) } }
}
