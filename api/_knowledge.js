/*
   SHARED AI KNOWLEDGE + LIVE READING (server-side only)
   The leading underscore keeps Vercel from turning this file into an endpoint.

   Everything the mascot and the chat know comes from here:
   · PROFILE: the facts shown on the site (single source of truth for the prompts)
   · PROJECTS: imported from ../projects.js (the same list the gallery shows)
   · live GitHub: the repo list (last push, stars) and the README of any project
     the visitor asks about, fetched and trimmed so answers come from real docs
*/
import { PROJECTS } from '../projects.js'

export const MODEL = 'openai/gpt-oss-120b'
export const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const USER = 'jjtjtyt6644'
const FEATURED = ['Quillwave', 'Web-Proxy', 'CompTools', 'Killswitch', 'RobloxAccountManager']

export const PROFILE = `
ABOUT JUNYU
- Junyu is a high-school student in Singapore who builds things around cyber security, networking and software tools. The site's headline: "Hi, I'm Junyu — High Schooler & Builder." Focus: Cyber Security · Networking · Open Source.
- GitHub: https://github.com/${USER} · Email: yaoprox0@gmail.com · Credly badges: https://www.credly.com/users/yao-junyu/badges
- Languages used: JavaScript, TypeScript, Python, HTML/CSS, SQL, Bash. Projects on GitHub also use Rust and C#.
- Security: interested in penetration testing and application-layer vulnerabilities; built a deliberately vulnerable practice site (SQL injection, XSS) with a SOC monitoring dashboard.
- Networking: learnt traffic routing and packet analysis and applied it in projects such as a web proxy.
- Development: builds full-stack tools, browser extensions and desktop apps, and integrates AI APIs.
- Timeline (from the site's terminal): 2023 started high school and began ideating; 2024–2025 building and testing projects; 2026 earned IBM SkillsBuild badges, kept learning cyber security, and became lead developer of Quillwave.

CREDENTIALS (exact names; these are introductory "Fundamentals" badges, not professional certifications)
- IBM SkillsBuild: Artificial Intelligence Fundamentals — issued 3 March 2026 (verifiable on Credly)
- IBM SkillsBuild: Cybersecurity Fundamentals — issued 11 March 2026 (verifiable on Credly)

THIS WEBSITE
- Built with Vite, GSAP and Lenis, with a scroll-driven Three.js 3D scene, an animated mascot (that's you), a live projects gallery, a Ctrl+K command menu and a playful fake terminal.
- Sections: Hero, About, Certs, Selected Builds, All Projects, Experience (fake terminal — try: help, ls, cat about.txt, whoami, matrix), Contact.
`.trim()

// What each section shows, for the mascot's narration
export const SECTIONS = {
  hero: 'Hero: "Hi, I\'m Junyu — High Schooler & Builder." A Singapore high-school student focused on cyber security, networking and open source.',
  about: 'About: three disciplines — Security (vulnerability practice, a SOC dashboard), Networking (traffic routing, a custom web proxy), Development (full-stack tools, extensions, desktop apps). Languages: JavaScript, TypeScript, Python, HTML/CSS, SQL, Bash.',
  certs: 'Certifications: two IBM SkillsBuild badges — Artificial Intelligence Fundamentals (March 2026) and Cybersecurity Fundamentals (March 2026), both verifiable on Credly.',
  builds: 'Selected Builds: Quillwave first (Junyu is the lead developer; a Windows desktop app with nearly 100 AI news sources in one ranked feed, an assistant that briefs you in a minute, and notes that sync; built with Electron, a Python scanner and Firebase; website: quillwave-app.web.app), then Web Proxy "Ambient" (web proxy with games/apps pages, one-click Vercel deploy), CompTools (Windows utility: hardware diagnostics, one-click winget installs, debloat and tweaks; C#/.NET), Killswitch (Electron tray app — one panic hotkey closes every running game), Roblox Account Manager (Rust app running many Roblox accounts with auto-reconnect and memory/CPU savers).',
  gallery: 'All Projects: every public repo, synced live from GitHub — searchable, filterable by domain and language; click any card to read its README.',
  experience: 'Experience: a fake interactive terminal with a short timeline (2023 ideation, 2024–2025 building, 2026 IBM badges).',
  contact: 'Contact: email yaoprox0@gmail.com or GitHub @jjtjtyt6644; open to collaborations and security chats.',
}

// "owner/name" of a project: its own `repo` field, else taken from the jjtjtyt6644 URL
const fullRepo = p => p.repo || `${USER}/${(p.url.split(`github.com/${USER}/`)[1] || '').split('/')[0]}`

// Extra words people use for each repo (matched case-insensitively against the question)
const ALIASES = {
  'ai-news-downloader': ['quillwave', 'quill wave', 'ai pulse', 'ai news'],
  'Web-Proxy': ['proxy', 'ambient', 'web proxy', 'proxyyy'],
  Comptools: ['comptools', 'comp tools', 'comptool'],
  killswitch: ['killswitch', 'kill switch', 'panic'],
  RobloxAccountManager: ['roblox', 'account manager', 'alt manager'],
  mcConfigUI: ['minecraft', 'mcconfig', 'mc config'],
  'Spotify-tools': ['spotify'],
  'Medal-Tv-downloader': ['medal'],
  'Cookie-editor': ['cookie'],
  'CyberAttacks-Simulation': ['cyberattack', 'cyber attack', 'soc', 'sql injection', 'vulnerable'],
  FocusMode: ['focusmode', 'focus mode'],
  'Ai-Vison-': ['ai vision', 'ai-vision', 'aivision', 'ai vison'],
  'AutoQuest-Plugin': ['autoquest', 'auto quest', 'vencord', 'discord quest'],
  'Autoquest-Installer': ['autoquest installer'],
  Aetheris: ['aetheris'],
  'Itinfinder-Website': ['itinfinder', 'itinerary', 'travel'],
  'Voting-web': ['voting', 'vote'],
  Studify: ['studify'],
  tution: ['tution', 'tuition'],
  Portfolio: ['portfolio', 'this website', 'this site'],
}

export function projectsText() {
  const featured = PROJECTS.filter(p => FEATURED.includes(p.name))
  const rest = PROJECTS.filter(p => !FEATURED.includes(p.name))
  const line = p => `- ${p.name}${p.role ? ` [Junyu's role: ${p.role}; the app's code is in a private repository, and Junyu leads its development]` : ''} (${p.lang}; ${p.tags.join(', ')}): ${p.desc} — ${p.website || p.url}`
  // Curated overview for projects without a public README (Quillwave)
  const details = p => p.about
    ? `\n  ${p.name} details:\n${p.about.map(s => `  ${s.title}: ${s.items.join(' ')}`).join('\n')}`
    : ''
  return `FEATURED BUILDS (shown in "Selected Builds")\n${featured.map(p => line(p) + details(p)).join('\n')}\n\nOTHER PUBLIC PROJECTS\n${rest.map(line).join('\n')}`
}

// Projects with a curated overview skip the README fetch (Quillwave's public repo is only its installer)
export const hasAbout = repo => PROJECTS.some(p => p.about && p.repo && p.repo.toLowerCase() === repo.toLowerCase())

/* ─── Live GitHub reading, cached in memory between warm invocations ─── */
const cache = new Map()
async function cached(key, ttlMs, load) {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < ttlMs) return hit.value
  const value = await load()
  cache.set(key, { at: Date.now(), value })
  return value
}

function ghHeaders(accept) {
  const h = { Accept: accept, 'User-Agent': 'junyu-portfolio-guide' }
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return h
}

async function fetchWithTimeout(url, opts = {}, ms = 4000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try { return await fetch(url, { ...opts, signal: ctrl.signal }) } finally { clearTimeout(t) }
}

export async function liveRepos() {
  try {
    return await cached('repos', 10 * 60 * 1000, async () => {
      const res = await fetchWithTimeout(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers: ghHeaders('application/vnd.github+json') })
      if (!res.ok) throw new Error(`GitHub ${res.status}`)
      return (await res.json()).filter(r => !r.fork).map(r => ({
        name: r.name, lang: r.language, stars: r.stargazers_count, pushed: r.pushed_at?.slice(0, 10), desc: r.description || '',
      }))
    })
  } catch {
    return null
  }
}

// Plain-text README: images, HTML, badges and link targets stripped, trimmed to fit the prompt
function cleanReadme(md, max = 3200) {
  const text = md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')            // images
    .replace(/<[^>]+>/g, ' ')                         // html tags
    .replace(/\[([^\]]+)\]\((?:[^)]+)\)/g, '$1')       // links → text
    .replace(/```[\s\S]*?```/g, m => m.length > 600 ? '[code block omitted]' : m)
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text.length > max ? `${text.slice(0, max)}\n[README truncated]` : text
}

export async function readme(repo) {
  try {
    return await cached(`readme:${repo}`, 60 * 60 * 1000, async () => {
      const res = await fetchWithTimeout(`https://api.github.com/repos/${repo}/readme`, { headers: ghHeaders('application/vnd.github.raw') })
      if (!res.ok) return null
      return cleanReadme(await res.text())
    })
  } catch {
    return null
  }
}

// Which repos is the visitor asking about? Checks the latest question first, then the one before (follow-ups like "how does it work?")
export function mentionedRepos(userMessages, max = 2) {
  const repos = PROJECTS.map(p => ({ repo: fullRepo(p), name: p.name }))
  const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const find = text => {
    const t = text.toLowerCase()
    return repos.filter(({ repo, name }) => {
      const short = repo.split('/')[1]
      const words = [name.toLowerCase(), short.toLowerCase(), ...(ALIASES[short] || [])]
      return words.some(w => new RegExp(`(^|[^a-z0-9])${escape(w)}($|[^a-z0-9])`).test(t))
    }).map(r => r.repo)
  }
  for (const msg of [...userMessages].reverse().slice(0, 2)) {
    const hits = [...new Set(find(msg))]
    if (hits.length) return hits.slice(0, max)
  }
  return []
}

/* ─── Request hygiene shared by both endpoints ─── */
const hits = new Map()
export function rateLimited(req, limit, windowMs) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  const now = Date.now()
  const list = (hits.get(ip) || []).filter(t => now - t < windowMs)
  list.push(now)
  hits.set(ip, list)
  return list.length > limit
}

export async function callGroq({ messages, maxTokens, temperature }) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { error: 'The AI key is not configured on the server.', status: 500 }
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_completion_tokens: maxTokens,
      temperature,
      reasoning_effort: 'low',
      include_reasoning: false,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) {
    console.error('Groq API error:', data.error || res.status)
    return { error: res.status === 429 ? 'The AI is busy right now — try again in a moment.' : 'The AI service returned an error.', status: res.status === 429 ? 429 : 502 }
  }
  const reply = data.choices?.[0]?.message?.content?.trim()
  return reply ? { reply } : { error: 'The AI returned an empty reply.', status: 502 }
}
