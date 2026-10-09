import { PROJECTS } from './projects.js'

/*
   COMMAND PALETTE — Ctrl/⌘+K (or the navbar button) to jump anywhere.
   Sections, every project, and quick actions, with fuzzy search and full keyboard control.
*/

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// Subsequence fuzzy match: every query char in order; rewards consecutive and word-start hits.
function score(query, text) {
  if (!query) return 1
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  let ti = 0
  let total = 0
  let streak = 0
  for (const ch of q) {
    const found = t.indexOf(ch, ti)
    if (found < 0) return 0
    streak = found === ti ? streak + 1 : 0
    total += 1 + streak * 2 + (found === 0 || /[\s\-_]/.test(t[found - 1]) ? 3 : 0)
    ti = found + 1
  }
  return total - t.length * 0.01
}

export function initPalette({ lenis, openProject, actions }) {
  const root = document.getElementById('cmdk')
  const input = document.getElementById('cmdk-input')
  const list = document.getElementById('cmdk-list')
  const trigger = document.getElementById('cmdk-trigger')
  if (!root) return

  const go = id => () => lenis ? lenis.scrollTo(`#${id}`, { duration: 1.6 }) : document.getElementById(id)?.scrollIntoView()
  const items = [
    { group: 'Jump to', label: 'Top', hint: 'Hero', run: () => lenis ? lenis.scrollTo(0, { duration: 1.6 }) : scrollTo(0, 0) },
    { group: 'Jump to', label: 'About', hint: 'Mission & stack', run: go('about') },
    { group: 'Jump to', label: 'Certifications', hint: 'IBM badges', run: go('certs') },
    { group: 'Jump to', label: 'Selected Builds', hint: 'Featured projects', run: go('builds') },
    { group: 'Jump to', label: 'All Projects', hint: 'Gallery', run: go('gallery') },
    { group: 'Jump to', label: 'Experience', hint: 'Terminal', run: go('experience') },
    { group: 'Jump to', label: 'Contact', hint: "Let's talk", run: go('contact') },
    ...PROJECTS.map(p => ({ group: 'Projects', label: p.name, hint: p.lang, keywords: `${p.desc} ${p.tags.join(' ')}`, run: () => openProject?.(p.name) })),
    ...actions.map(a => ({ group: 'Actions', ...a })),
  ]

  let results = []
  let active = 0
  let lastFocus = null

  function render() {
    const q = input.value.trim()
    results = items
      .map(it => ({ it, s: Math.max(score(q, it.label) * 2, score(q, `${it.label} ${it.hint || ''} ${it.keywords || ''}`)) }))
      .filter(r => r.s > 0)
      .sort((a, b) => (q ? b.s - a.s : 0))
      .map(r => r.it)
      .slice(0, q ? 12 : items.length)
    active = Math.min(active, Math.max(results.length - 1, 0))

    let html = ''
    let group = ''
    results.forEach((it, i) => {
      if (!q && it.group !== group) {
        group = it.group
        html += `<li class="cmdk-group" role="presentation">${esc(group)}</li>`
      }
      html += `<li role="option" id="cmdk-opt-${i}" class="cmdk-item${i === active ? ' active' : ''}" aria-selected="${i === active}" data-i="${i}">
        <span class="cmdk-label">${esc(it.label)}</span>${it.hint ? `<span class="cmdk-hint">${esc(it.hint)}</span>` : ''}
        ${q ? `<span class="cmdk-kind">${esc(it.group)}</span>` : ''}</li>`
    })
    list.innerHTML = html || '<li class="cmdk-empty" role="presentation">No matches</li>'
    input.setAttribute('aria-activedescendant', results.length ? `cmdk-opt-${active}` : '')
    list.querySelector('.cmdk-item.active')?.scrollIntoView({ block: 'nearest' })
  }

  function open() {
    if (!root.hidden) return
    lastFocus = document.activeElement
    root.hidden = false
    requestAnimationFrame(() => root.classList.add('open'))
    input.value = ''
    active = 0
    render()
    input.focus()
    lenis?.stop()
  }

  function close() {
    if (root.hidden) return
    root.classList.remove('open')
    lenis?.start()
    setTimeout(() => { root.hidden = true }, 200)
    lastFocus?.focus?.()
  }

  function run(i) {
    const it = results[i]
    if (!it) return
    close()
    setTimeout(() => it.run(), 60)
  }

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      root.hidden ? open() : close()
      return
    }
    if (root.hidden) return
    if (e.key === 'Escape') { e.preventDefault(); close() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(results.length, 1); render() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + results.length) % Math.max(results.length, 1); render() }
    else if (e.key === 'Enter') { e.preventDefault(); run(active) }
    else if (e.key === 'Tab') e.preventDefault() // focus stays in the search box
  })
  input.addEventListener('input', () => { active = 0; render() })
  list.addEventListener('pointermove', e => {
    const li = e.target.closest('.cmdk-item')
    if (li && +li.dataset.i !== active) { active = +li.dataset.i; render() }
  })
  list.addEventListener('click', e => {
    const li = e.target.closest('.cmdk-item')
    if (li) run(+li.dataset.i)
  })
  root.addEventListener('click', e => { if (e.target === root) close() })
  trigger?.addEventListener('click', open)

  // Show the right shortcut for the platform
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
  document.querySelectorAll('.cmdk-key').forEach(k => { k.textContent = mac ? '⌘K' : 'Ctrl K' })
}
