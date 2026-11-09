import Lenis from '@studio-freight/lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initGallery } from './gallery.js'
import { initPalette } from './palette.js'
import { quillwaveRelease, formatSize, timeAgo } from './releases.js'
import { PROJECTS } from './projects.js'
import { initActivity } from './activity.js'

gsap.registerPlugin(ScrollTrigger)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const lenis = new Lenis({
  duration: 1.6,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: !reduceMotion, // native scrolling for visitors who ask for less motion
  smoothTouch: false,
})
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add(time => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0, 0)


const dot = document.querySelector('.cursor')
const follower = document.querySelector('.cursor-follower')
const isTouch = !window.matchMedia('(pointer: fine)').matches

if (isTouch) {
  dot.style.display = follower.style.display = 'none'
} else {
  let mx = 0, my = 0, fx = 0, fy = 0

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY })

  gsap.ticker.add(() => {
    gsap.set(dot, { x: mx, y: my })
    fx += (mx - fx) * 0.12
    fy += (my - fy) * 0.12
    gsap.set(follower, { x: fx, y: fy })
  })

  const expandTargets = 'a, button, .discipline-card, .cert-card, .build-card'
  document.querySelectorAll(expandTargets).forEach(el => {
    el.addEventListener('mouseenter', () => follower.classList.add('hovered'))
    el.addEventListener('mouseleave', () => follower.classList.remove('hovered'))
  })
}


const navbar = document.querySelector('.navbar')
const progressBar = document.getElementById('scroll-progress-bar')
lenis.on('scroll', ({ scroll, limit }) => {
  navbar.classList.toggle('scrolled', scroll > 60)
  if (progressBar) progressBar.style.transform = `scaleX(${limit ? scroll / limit : 0})`
})


gsap.timeline({ defaults: { ease: 'expo.out' } })
  // fromTo: the badge starts at opacity 0 in CSS, so a plain .from() would animate 0 → 0
  .fromTo('.hero-badge', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, delay: 0.2 })
  .from('.hero .line', { y: '110%', rotationZ: 3, opacity: 0, duration: 1.6, stagger: 0.12 }, '-=0.8')
  .from('.hero-sub', { opacity: 0, letterSpacing: '10px', duration: 1.2 }, '-=0.8')
  .to('.hero-scroll', { opacity: 1, duration: 0.6 }, '-=0.4')
  .to('.scroll-line', { scaleX: 1, duration: 0.8, ease: 'power3.out' }, '<')


gsap.from('.about .eyebrow', {
  opacity: 0, y: 20, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.about', start: 'top 80%' }
})


// Keep the About stats truthful: project count comes from the same list as the gallery
const statProjects = document.getElementById('stat-projects')
if (statProjects) statProjects.dataset.target = String(PROJECTS.length)
const footerYear = document.getElementById('footer-year')
if (footerYear) footerYear.textContent = String(new Date().getFullYear())

document.querySelectorAll('.stat-num').forEach(el => {
  const target = parseInt(el.dataset.target, 10)
  gsap.fromTo(el,
    { textContent: 0 },
    {
      textContent: target, duration: 2, ease: 'power2.out',
      snap: { textContent: 1 },
      scrollTrigger: { trigger: el, start: 'top 88%' }
    }
  )
})

gsap.from('.stat-item', {
  x: -30, opacity: 0, duration: 1.2, stagger: 0.15, ease: 'power3.out',
  scrollTrigger: { trigger: '.about-stat-stack', start: 'top 85%' }
})

gsap.utils.toArray('.discipline-card').forEach((card, i) => {
  gsap.to(card, {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: {
      trigger: card,
      start: 'top 85%'
    }
  })
})

gsap.to('.tech-pill', {
  opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'back.out(1.5)',
  scrollTrigger: { trigger: '.tech-stack', start: 'top 85%' }
})


gsap.from('.certs-section .eyebrow', {
  opacity: 0, y: 20, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.certs-section', start: 'top 80%' }
})

gsap.from('.certs-heading .line', {
  y: '110%', duration: 1.4, ease: 'expo.out',
  scrollTrigger: { trigger: '.certs-heading', start: 'top 85%' }
})

gsap.from('.certs-sub', {
  opacity: 0, y: 20, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.certs-sub', start: 'top 90%' }
})

gsap.to('.cert-card', {
  opacity: 1, y: 0, duration: 1.2, stagger: 0.2, ease: 'back.out(1.3)',
  scrollTrigger: { trigger: '.certs-grid', start: 'top 82%' }
})


const cards = gsap.utils.toArray('.build-card')
// One screen of scrolling per card, plus one for the last card to settle
const buildsScrollLength = () => window.innerHeight * (cards.length + 1)


gsap.set(cards, { autoAlpha: 0 })

const masterTl = gsap.timeline({
  scrollTrigger: {
    trigger: '.builds-section',
    start: 'top top',
    end: () => `+=${buildsScrollLength()}`,
    pin: true,
    scrub: 1,
  }
})

cards.forEach((card, i) => {
  const imgWrap = card.querySelector('.build-image-wrapper')
  const img = card.querySelector('img')
  const titles = card.querySelectorAll('h3')
  const meta = card.querySelector('.info-meta')

  /* ── IN ── */
  const inTl = gsap.timeline()


  inTl.set(card, { autoAlpha: 1 })

  if (i === 0) {

    inTl.fromTo(imgWrap,
      { clipPath: 'inset(100% 0% 0% 0%)', y: 40 },
      { clipPath: 'inset(0%   0% 0% 0%)', y: 0, duration: 1, ease: 'expo.inOut' }
    )
    inTl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.1, ease: 'expo.out' }, '<')
    inTl.fromTo(titles,
      { y: '115%', rotation: 4 },
      { y: '0%', rotation: 0, duration: 1, stagger: 0.1, ease: 'expo.out' }, '-=0.6')

  } else if (i === 1) {

    inTl.fromTo(imgWrap,
      { x: '55%', opacity: 0, scale: 0.88 },
      { x: '0%', opacity: 1, scale: 1, duration: 1.1, ease: 'power4.out' }
    )
    inTl.fromTo(titles,
      { y: '-115%', skewY: -5 },
      { y: '0%', skewY: 0, duration: 1.1, stagger: 0.1, ease: 'back.out(1.3)' }, '-=0.8')

  } else {

    inTl.fromTo(imgWrap,
      { rotationX: -65, scale: 0.75, opacity: 0, transformPerspective: 1200 },
      { rotationX: 0, scale: 1, opacity: 1, duration: 1.3, ease: 'elastic.out(1, 0.65)' }
    )
    inTl.fromTo(titles,
      { opacity: 0, y: 55, filter: 'blur(12px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.1, ease: 'power3.out' }, '-=0.7')
  }


  inTl.fromTo(meta,
    { opacity: 0, y: 22 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4'
  )

  masterTl.add(inTl)
  masterTl.to({}, { duration: 0.9 })

  /* ── OUT ── */
  if (i < cards.length - 1) {
    const outTl = gsap.timeline()

    // Exit styles cycle so any number of cards gets a proper transition
    const exitStyle = i % 3
    if (exitStyle === 0) {
      outTl.to(imgWrap, { y: -70, opacity: 0, duration: 0.8, ease: 'power3.in' })
      outTl.to(titles, { y: '-130%', duration: 0.6, stagger: 0.06, ease: 'power3.in' }, '<')
      outTl.to(meta, { opacity: 0, duration: 0.3 }, '<')
    } else if (exitStyle === 1) {
      outTl.to(imgWrap, { x: '-55%', scale: 0.6, opacity: 0, duration: 0.8, ease: 'expo.in' })
      outTl.to(titles, { opacity: 0, x: -35, duration: 0.5, stagger: 0.06, ease: 'expo.in' }, '<')
      outTl.to(meta, { opacity: 0, duration: 0.3 }, '<')
    } else {
      outTl.to(imgWrap, { rotationX: 45, opacity: 0, scale: 0.8, duration: 0.8, ease: 'power2.in' })
      outTl.to(titles, { opacity: 0, y: -45, filter: 'blur(10px)', duration: 0.6, stagger: 0.06, ease: 'power2.in' }, '<')
      outTl.to(meta, { opacity: 0, duration: 0.3 }, '<')
    }


    outTl.set(card, { autoAlpha: 0 })
    masterTl.add(outTl)
  }
})


gsap.timeline({ scrollTrigger: { trigger: '.contact', start: 'top 75%' } })
  .from('.contact-eyebrow', { opacity: 0, y: 20, duration: 0.8 })
  .from('.contact .line', { y: '110%', duration: 1.4, stagger: 0.1, ease: 'expo.out' }, '-=0.4')
  .from('.contact-sub', { opacity: 0, y: 20, duration: 1, ease: 'power3.out' }, '-=0.8')
  .from('.contact-links a', { opacity: 0, y: 30, stagger: 0.15, duration: 0.9, ease: 'power3.out' }, '-=0.6')


if (!isTouch) {
  document.querySelectorAll('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect()
      gsap.to(btn, {
        x: (e.clientX - r.left - r.width / 2) * 0.35,
        y: (e.clientY - r.top - r.height / 2) * 0.35,
        duration: 0.5, ease: 'power3.out'
      })
    })
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' })
    })
  })
}


const overlay = document.getElementById('modal-overlay')
const modalClose = document.getElementById('modal-close')
const modalImg = document.getElementById('modal-img')
const modalTitle = document.getElementById('modal-title')
const modalDesc = document.getElementById('modal-desc')
const modalTags = document.getElementById('modal-tags')
const modalLink = document.getElementById('modal-link')

// Live "newest release" labels for Quillwave (the links themselves always resolve server-side)
const releaseInfo = {}
quillwaveRelease.then(info => {
  if (!info) return
  releaseInfo.quillwave = info
  document.querySelectorAll('[data-release-meta="quillwave"]')
    .forEach(el => { el.textContent = `v${info.version} · updated ${timeAgo(info.published)} · Windows 10/11 · ${formatSize(info.size)}` })
})

function openModal(card) {
  const title = card.dataset.title
  const desc = card.dataset.desc

  const imgElement = card.querySelector('.build-image-wrapper img')
  const img = imgElement ? imgElement.src : card.dataset.img
  const website = card.dataset.website
  const github = card.dataset.github
  const tags = (card.dataset.tags || '').split(',').map(t => t.trim()).filter(Boolean)

  modalImg.src = img
  modalImg.alt = title
  const isIcon = !!card.querySelector('.build-image-wrapper.is-icon')
  modalImg.parentElement.classList.toggle('is-icon', isIcon)
  modalTitle.textContent = title
  modalDesc.textContent = desc
  // Projects with their own website (Quillwave) link there instead of GitHub
  modalLink.href = website || github
  modalLink.textContent = website ? 'Visit the Quillwave website →' : 'View on GitHub →'
  modalLink.target = '_blank'
  modalLink.rel = 'noopener'

  modalTags.innerHTML = tags.map(t => `<span>${t}</span>`).join('')

  overlay.classList.add('open')
  document.body.style.overflow = 'hidden'
  lenis.stop()
}

function closeModal() {
  overlay.classList.remove('open')
  document.body.style.overflow = ''
  lenis.start()
}


document.querySelectorAll('.open-modal-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation()
    const card = btn.closest('.build-card')
    if (card) openModal(card)
  })
})


modalClose.addEventListener('click', closeModal)


overlay.addEventListener('click', e => {
  if (e.target === overlay) closeModal()
})


document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal()
})

/*
   MASCOT – AI Dynamic Speech Bubble */
const mascotChar = document.getElementById('mascot-char')
const mascotBubble = document.getElementById('mascot-bubble')
const bubbleText = document.getElementById('bubble-text')
const bubbleClose = document.getElementById('bubble-close')


let activeSection = ''
let typingTimer = null
let lastSectionSwap = 0
const COOLDOWN_MS = 1500


// Sections in PINNED_RESPONSES are NEVER overridden by the API or cleared by mascot clicks.
// Arrays cycle through on each mascot click.
const PINNED_RESPONSES = {
  experience: [
    "This terminal is a playground, not a real shell. Try help, ls, cat about.txt or whoami.",
    "Try ./run_next_module.sh, or type matrix for a surprise.",
    "There is a small filesystem to explore. cat experience.timeline shows Junyu's timeline.",
    "Try sudo to see what happens when you're not in the sudoers file, or echo anything you like.",
    "Type clear to wipe the terminal. Nothing here can break."
  ]
}
const PINNED_INDEXES = {}

const CACHED_RESPONSES = {
  contact: "This is Junyu's contact info. Please note he is a high schooler!"
}


// The facts for each section live server-side (api/_knowledge.js); the browser only sends the section id.
async function fetchElaboration(sectionId) {

  // Always return pinned responses — never call the API for these sections
  if (PINNED_RESPONSES[sectionId]) {
    const msgs = PINNED_RESPONSES[sectionId]
    if (Array.isArray(msgs)) {
      const idx = (PINNED_INDEXES[sectionId] || 0) % msgs.length
      PINNED_INDEXES[sectionId] = idx + 1
      return msgs[idx]
    }
    return msgs
  }

  if (CACHED_RESPONSES[sectionId]) {
    return CACHED_RESPONSES[sectionId]
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: sectionId || 'hero' })
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok && data.reply) {
      CACHED_RESPONSES[sectionId] = data.reply
      return data.reply
    }
    console.warn('Mascot narration unavailable:', data.error || response.status)
    return FALLBACK_LINES[sectionId] || "Keep scrolling — there's more of Junyu's work below."
  } catch (err) {
    console.warn('Mascot narration unavailable:', err)
    return FALLBACK_LINES[sectionId] || "Keep scrolling — there's more of Junyu's work below."
  }
}

// Shown when the AI can't be reached, so the mascot still says something accurate
const FALLBACK_LINES = {
  hero: "Junyu is a Singapore high-schooler building in cyber security, networking and open source.",
  about: "Security, networking and development: the three things Junyu builds around.",
  certs: "Two IBM SkillsBuild badges, AI and Cybersecurity Fundamentals. Both are verifiable on Credly.",
  builds: "Up first: Quillwave, the AI news app Junyu leads. Then a web proxy, CompTools, Killswitch and a Roblox account manager.",
  gallery: "Every public repo, live from GitHub. Click a card to read its README.",
  contact: "Want to reach Junyu? Email or GitHub, right here.",
}


function typeText(text) {
  clearInterval(typingTimer)
  bubbleText.classList.remove('typing')
  bubbleText.textContent = ''

  const chars = Array.from(text)
  let i = 0

  bubbleText.classList.add('typing')
  typingTimer = setInterval(() => {
    if (i < chars.length) {
      bubbleText.textContent += chars[i]
      i++
    } else {
      clearInterval(typingTimer)
      typingTimer = null
      bubbleText.classList.remove('typing')
    }
  }, 38)
}


async function switchSection(section) {
  const now = Date.now()


  if (section === activeSection || now - lastSectionSwap < COOLDOWN_MS) return

  activeSection = section
  lastSectionSwap = now


  typeText("Processing context...")


  gsap.fromTo(mascotChar,
    { y: -16 },
    { y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' }
  )


  const message = await fetchElaboration(section)


  if (activeSection === section) {
    typeText(message)
  }
}


const TRACKED = ['hero', 'about', 'certs', 'builds', 'gallery', 'experience', 'contact']

function getNearestSection() {

  const midX = window.innerWidth / 2;
  const midY = window.innerHeight / 2;
  const elements = document.elementsFromPoint(midX, midY);

  if (!elements) return null;

  for (let el of elements) {
    const section = el.closest('section');
    if (section && TRACKED.includes(section.id)) {
      return section.id;
    }
  }
  return null;
}

let scrollStopTimer = null

lenis.on('scroll', () => {
  clearTimeout(scrollStopTimer)
  scrollStopTimer = setTimeout(() => {
    const section = getNearestSection()
    if (section) switchSection(section)
  }, 750)
})


// Rate limits are enforced server-side (api/_knowledge.js); here we only ignore rapid repeat clicks
const MASCOT_CLICK_COOLDOWN_MS = 2500
let lastMascotClick = 0

mascotChar.addEventListener('click', async () => {
  const now = Date.now()
  if (now - lastMascotClick < MASCOT_CLICK_COOLDOWN_MS) return
  lastMascotClick = now


  // Don't clear pinned sections — they should never re-fetch from the API
  if (!PINNED_RESPONSES[activeSection]) {
    CACHED_RESPONSES[activeSection] = null;
  }


  gsap.timeline()
    .to(mascotChar, { scale: 0.85, rotation: -15, duration: 0.2 })
    .to(mascotChar, { scale: 1, rotation: 0, duration: 1.2, ease: 'elastic.out(1, 0.3)' });

  typeText("Analyzing current view...");

  const message = await fetchElaboration(activeSection || 'hero');
  typeText(message);
});


bubbleClose.addEventListener('click', () => {
  mascotBubble.classList.remove('visible')
  clearInterval(typingTimer)
})


mascotChar.addEventListener('dblclick', () => {
  if (mascotBubble.classList.contains('visible')) {
    mascotBubble.classList.remove('visible')
    clearInterval(typingTimer)
  } else {
    mascotBubble.classList.add('visible')
    lastSectionSwap = 0
    switchSection(activeSection || 'hero')
  }
})


setTimeout(() => {
  mascotBubble.classList.add('visible')
  activeSection = ''
  lastSectionSwap = 0


  CACHED_RESPONSES['hero'] = "Hi, I'm Junyu's guide. Scroll and I'll walk you through his work, or click me anytime.";
  switchSection('hero')
}, 2400)


const chatToggleBtn = document.getElementById('chat-toggle-btn')
const aiChatWindow = document.getElementById('ai-chat-window')
const aiChatClose = document.getElementById('ai-chat-close')
const aiChatMessages = document.getElementById('ai-chat-messages')
const aiChatInput = document.getElementById('ai-chat-input')
const aiChatSend = document.getElementById('ai-chat-send')

let conversationHistory = []
let chatBusy = false


chatToggleBtn.addEventListener('click', () => {
  aiChatWindow.classList.add('open')
  mascotChar.classList.add('peering')
  mascotBubble.style.opacity = '0'
  aiChatInput.focus()
})

aiChatClose.addEventListener('click', () => {
  aiChatWindow.classList.remove('open')
  mascotChar.classList.remove('peering')
  mascotBubble.style.opacity = '1'
})

function appendMessage(role, text) {
  const div = document.createElement('div')
  div.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`


  // Escape first, then apply a small safe subset of markdown: bold/italic, "- " bullets, links, line breaks
  const inline = s => s
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/(^|[\s(])(https:\/\/[^\s<)]+[^\s<).,!?;:])/g, '$1<a href="$2" target="_blank" rel="noopener">$2</a>')
    .replace(/(^|[\s(])(github\.com\/[\w.-]*[\w-](?:\/[\w.-]*[\w-])?)/g, '$1<a href="https://$2" target="_blank" rel="noopener">$2</a>')
    .replace(/(^|[\s(])([\w.+-]+@[\w-]+\.[\w.]+[a-z])/gi, '$1<a href="mailto:$2">$2</a>')

  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")

  let html = ''
  let inList = false
  for (const line of escaped.split(/\r?\n/)) {
    const bullet = /^\s*(?:[-•*]|\d+\.)\s+(.*)$/.exec(line)
    if (bullet) {
      if (!inList) { html += '<ul>'; inList = true }
      html += `<li>${inline(bullet[1])}</li>`
      continue
    }
    if (inList) { html += '</ul>'; inList = false }
    if (line.trim()) html += `<p>${inline(line)}</p>`
  }
  if (inList) html += '</ul>'

  div.innerHTML = html
  aiChatMessages.appendChild(div)



  setTimeout(() => {
    if (role === 'ai') {
      const offset = div.offsetTop - 15;
      aiChatMessages.scrollTo({ top: offset, behavior: 'smooth' });
    } else {
      aiChatMessages.scrollTop = aiChatMessages.scrollHeight
    }
  }, 10)
}

async function handleChatSubmit() {
  const text = aiChatInput.value.trim()
  if (!text) return


  if (text.toLowerCase() === 'flag_mhz7f') {
    appendMessage('user', text)
    aiChatInput.value = ''

    setTimeout(() => {
      const specialDiv = document.createElement('div')
      specialDiv.className = 'chat-message ai-message'
      specialDiv.style.color = '#4ade80'
      specialDiv.style.fontFamily = 'monospace'
      specialDiv.innerHTML = "ROOT ACCESS GRANTED.<br/><br/>Bypassing security protocols...<br/>Welcome, Operator. Initiating Matrix sequence..."
      aiChatMessages.appendChild(specialDiv)
      aiChatMessages.scrollTop = aiChatMessages.scrollHeight
      
      if (typeof startMatrixEffect === 'function') {
        startMatrixEffect();
      }
    }, 600)
    return
  }


  // One question at a time; the server answers "slow down" itself if someone floods it
  if (chatBusy) return
  chatBusy = true
  aiChatSend.disabled = true

  appendMessage('user', text)
  conversationHistory.push({ role: 'user', content: text })
  aiChatInput.value = ''


  const loadingDiv = document.createElement('div')
  loadingDiv.className = 'chat-message ai-message'
  loadingDiv.textContent = 'Reading Junyu’s projects…'
  aiChatMessages.appendChild(loadingDiv)
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight


  let responseText = ''
  let failed = false

  try {
    // The server reads the site facts, live GitHub data and any relevant README before answering
    const res = await fetch('/api/converse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: conversationHistory.slice(-8), section: activeSection || 'hero' })
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.reply) throw new Error(data.error || `HTTP ${res.status}`)
    responseText = data.reply
  } catch (err) {
    console.error('Chat Error:', err)
    failed = true
    responseText = /quickly|busy/i.test(err.message)
      ? err.message
      : "Sorry, I can't reach my brain right now. You can email Junyu at yaoprox0@gmail.com or check github.com/jjtjtyt6644."
  }


  loadingDiv.remove()
  chatBusy = false
  aiChatSend.disabled = false
  appendMessage('ai', responseText)
  // Don't feed error messages back to the model as if it had said them
  if (failed) conversationHistory.pop()
  else conversationHistory.push({ role: 'assistant', content: responseText })
}


aiChatSend.addEventListener('click', handleChatSubmit)
aiChatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleChatSubmit()
})


let firstOpen = true;
chatToggleBtn.addEventListener('click', () => {
  if (firstOpen) {
    appendMessage('ai', "Hi! I'm Junyu's AI guide. Ask me about his projects, how something he built works, or what he's been working on lately. I read his live GitHub repos and READMEs, so try things like:\n- How does Killswitch work?\n- What did Junyu push most recently?\n- What languages does he use?");
    firstOpen = false;
  }
});

/* ═══════════════════════════════════════════════════════════════
   DECODE TEXT EFFECT
═══════════════════════════════════════════════════════════════ */
function decodeText(element) {
  const originalText = element.textContent;
  const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  let iterations = 0;

  const interval = setInterval(() => {
    element.textContent = originalText.split('').map((letter, index) => {
      if (index < iterations) {
        return originalText[index];
      }
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');

    if (iterations >= originalText.length) {
      clearInterval(interval);
      element.textContent = originalText;
    }
    iterations += 1 / 3;
  }, 30);
}

gsap.utils.toArray('.decode-text').forEach(el => {
  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    onEnter: () => decodeText(el),
    once: true
  });
});

/* ═══════════════════════════════════════════════════════════════
   TERMINAL EXPERIENCE EFFECT
═══════════════════════════════════════════════════════════════ */
gsap.to('.terminal-window', {
  opacity: 1, y: 0, duration: 1, ease: 'power3.out',
  scrollTrigger: {
    trigger: '.terminal-section',
    start: 'top 75%',
    onEnter: () => startTerminalAnimation(),
    once: true
  }
});

let terminalStarted = false;
function startTerminalAnimation() {
  if (terminalStarted) return;
  terminalStarted = true;
  const termBody = document.getElementById('terminal-body');
  if (!termBody) return;

  const commands = [
    { text: "nmap localhost -p 22,80,443", type: "cmd", delay: 500 },
    { text: "Starting Nmap 7.94 ( https://nmap.org ) at 2024", type: "out", delay: 1000 },

    { text: "Port 443/tcp open https", type: "out", delay: 1900 },
    { text: "cat experience.timeline", type: "cmd", delay: 2800 },
    { text: "[2023] High School - Ideation", type: "out", delay: 3600 },
    { text: "[2024 - 2025] Testing projects and building", type: "out", delay: 4000 },
    { text: "[2026] Ibm certifications and learning cybersecurity", type: "out", delay: 4400 },
    { text: "Status: Ready for new challenges and projects.", type: "out", delay: 4800 }
  ];

  const cursor = document.createElement('span');
  cursor.className = 'term-cursor';
  termBody.appendChild(cursor);

  commands.forEach((cmd) => {
    setTimeout(() => {
      cursor.remove();
      const line = document.createElement('span');
      line.className = cmd.type === 'cmd' ? 'term-line term-command' : 'term-line';
      if (cmd.type === 'cmd') {
        line.innerHTML = `root@junyu:~$ `;
        termBody.appendChild(line);
        let i = 0;
        let typeInt = setInterval(() => {
          line.innerHTML += cmd.text.charAt(i);
          i++;
          if (i >= cmd.text.length) {
            clearInterval(typeInt);
            termBody.appendChild(cursor);
            termBody.scrollTop = termBody.scrollHeight;
          }
        }, 40);
        line.style.opacity = 1;
      } else {
        line.innerHTML = cmd.text;
        termBody.appendChild(line);
        termBody.appendChild(cursor);
        gsap.fromTo(line, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3 });
        termBody.scrollTop = termBody.scrollHeight;
      }
    }, cmd.delay);
  });


  setTimeout(() => setupInteractiveTerminal(termBody, cursor), 6000);
}

function setupInteractiveTerminal(termBody, cursor) {
  if (cursor && cursor.parentNode) cursor.remove();

  // ─── Virtual File System ───
  const vfs = {
    '~': {
      type: 'dir',
      contents: {
        'experience.timeline': { type: 'file', content: "2026: IBM SkillsBuild badges (AI &amp; Cybersecurity Fundamentals), leading Quillwave<br/>2024-2025: Building and testing projects<br/>2023: High school, ideation, first steps into networking and pentesting" },
        'run_next_module.sh': { type: 'file', content: "[OK] Initiating module...<br/>[OK] Bypassing mainframe...<br/>[OK] Payload injected successfully.<br/><span style=\"color:#a78bfa; font-weight:bold;\">Welcome to the next level.</span>", exec: true },
        'about.txt': { type: 'file', content: "Hi, I'm Junyu - Cyber Security & Networking Enthusiast.<br/>Contact: yaoprox0@gmail.com<br/>GitHub: jjtjtyt6644" },
        'secrets': {
          type: 'dir',
          locked: true,
          contents: {
            'flag.txt': { type: 'file', content: "flag{h1r3_m3_plz}" },
            '.bash_history': { type: 'file', content: "nmap localhost<br/>sudo su<br/>matrix" }
          }
        }
      }
    }
  };

  let cwd = '~';

  function getPromptText() {
    return `root@junyu:${cwd}$ `;
  }

  const promptWrapper = document.createElement('div');
  promptWrapper.className = 'term-line';
  promptWrapper.style.opacity = 1;
  promptWrapper.style.display = 'flex';

  const promptLabel = document.createElement('span');
  promptLabel.className = 'term-command';
  promptLabel.textContent = getPromptText();
  promptLabel.style.marginRight = '8px';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'term-input';
  input.autocomplete = 'off';
  input.spellcheck = false;

  promptWrapper.appendChild(promptLabel);
  promptWrapper.appendChild(input);
  termBody.appendChild(promptWrapper);

  termBody.scrollTop = termBody.scrollHeight;

  termBody.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = input.value.trim();
      input.value = '';

      const echo = document.createElement('div');
      echo.className = 'term-line';
      echo.style.opacity = 1;
      echo.innerHTML = `<span class="term-command">${getPromptText()}</span> <span style="color:#eef2ff">${val.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
      promptWrapper.before(echo);

      if (val !== '') {
        const out = document.createElement('div');
        out.className = 'term-line';
        out.style.opacity = 1;

        // Escape once at parse time: every message below goes into innerHTML,
        // so typed input like <img onerror=...> must never become markup
        const escHtml = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const args = (val.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []).map(escHtml);
        const cmd = args[0].toLowerCase();
        const parsedArgs = args.slice(1).map(a => a.replace(/^(["']|&quot;|&#39;)|(["']|&quot;|&#39;)$/g, ''));

        let outputStr = '';

        // Current Directory Context
        let currentDirObj = cwd === '~' ? vfs['~'] : vfs['~'].contents[cwd.replace('~/', '')];
        if (!currentDirObj) currentDirObj = vfs['~'];

        switch (cmd) {
          case 'help':
            outputStr = `Available commands:<br/> - ls [dir]<br/> - cd [dir]<br/> - cat [file]<br/> - pwd<br/> - whoami<br/> - clear<br/> - echo [text]<br/> - ./run_next_module.sh<br/> - matrix<br/> - sudo`;
            break;
          case 'whoami':
            outputStr = `junyu - Cyber Security & Networking Enthusiast`;
            break;
          case 'pwd':
            outputStr = cwd === '~' ? '/home/junyu' : `/home/junyu/${cwd.replace('~/', '')}`;
            break;
          case 'clear':
            termBody.innerHTML = '';
            break;
          case 'date':
            outputStr = new Date().toString();
            break;
          case 'echo':
            outputStr = parsedArgs.join(' ').replace(/</g, "&lt;").replace(/>/g, "&gt;");
            break;
          case 'sudo':
            outputStr = `junyu is not in the sudoers file. This incident will be reported.`;
            break;
          case 'ls': {
            let targetDir = currentDirObj;
            let targetPath = parsedArgs[0] || '';
            let showHidden = parsedArgs.includes('-a') || parsedArgs.includes('-la') || parsedArgs.includes('-al');
            let isLong = parsedArgs.includes('-l') || parsedArgs.includes('-la') || parsedArgs.includes('-al');

            // Cleanup args for path resolution
            targetPath = parsedArgs.filter(a => !a.startsWith('-'))[0] || '';

            if (targetPath && targetPath !== '.' && targetPath !== './') {
              if (targetPath === '..' || targetPath === '../') {
                targetDir = cwd === '~' ? { type: 'dir', contents: { 'junyu': { type: 'dir' } } } : vfs['~'];
              } else if (currentDirObj.contents[targetPath] && currentDirObj.contents[targetPath].type === 'dir') {
                targetDir = currentDirObj.contents[targetPath];
              } else {
                outputStr = `ls: cannot access '${targetPath}': No such file or directory`;
                break;
              }
            }

            if (targetDir.locked && cwd !== `~/${targetPath}`) {
              outputStr = `ls: cannot open directory '${targetPath}': Permission denied`;
              break;
            }

            let contents = Object.keys(targetDir.contents || {});
            if (!showHidden) contents = contents.filter(f => !f.startsWith('.'));

            if (isLong) {
              outputStr = contents.map(f => {
                const node = targetDir.contents[f];
                const perm = node.type === 'dir' ? 'drwxr-xr-x' : (node.exec ? '-rwxr-xr-x' : '-rw-r--r--');
                const color = node.type === 'dir' ? '#3b82f6' : (node.exec ? '#22c55e' : '#eef2ff');
                return `${perm} 1 root root 4096 Jan  1 00:00 <span style="color:${color}">${f}</span>`;
              }).join('<br/>');
            } else {
              outputStr = contents.map(f => {
                const node = targetDir.contents[f];
                const color = node.type === 'dir' ? '#3b82f6' : (node.exec ? '#22c55e' : '#eef2ff');
                return `<span style="color:${color}; margin-right: 15px;">${f}</span>`;
              }).join('');
            }
            break;
          }
          case 'cd': {
            const targetPath = parsedArgs[0] || '~';
            if (targetPath === '~' || targetPath === '/home/junyu') {
              cwd = '~';
            } else if (targetPath === '..' || targetPath === '../') {
              cwd = '~'; // Keep it simple, parent of anywhere is home for now
            } else if (targetPath === '/') {
              outputStr = `bash: cd: /: Permission denied`;
            } else if (currentDirObj.contents && currentDirObj.contents[targetPath]) {
              const node = currentDirObj.contents[targetPath];
              if (node.type !== 'dir') {
                outputStr = `bash: cd: ${targetPath}: Not a directory`;
              } else if (node.locked) {
                outputStr = `bash: cd: ${targetPath}: Permission denied`;
              } else {
                cwd = cwd === '~' ? `~/${targetPath}` : `${cwd}/${targetPath}`;
              }
            } else {
              outputStr = `bash: cd: ${targetPath}: No such file or directory`;
            }
            promptLabel.textContent = getPromptText();
            break;
          }
          case 'cat': {
            const targetPath = parsedArgs[0];
            if (!targetPath) {
              outputStr = `cat: missing operand`;
              break;
            }
            if (currentDirObj.contents && currentDirObj.contents[targetPath]) {
              const node = currentDirObj.contents[targetPath];
              if (node.type === 'dir') {
                outputStr = `cat: ${targetPath}: Is a directory`;
              } else {
                outputStr = node.content;
              }
            } else {
              outputStr = `cat: ${targetPath}: No such file or directory`;
            }
            break;
          }
          case './run_next_module.sh':
          case 'sh':
            if (cmd === 'sh' && parsedArgs[0] !== 'run_next_module.sh') {
              outputStr = `sh: ${parsedArgs[0] || 'missing operand'}: No such file or directory`;
              break;
            }
            if (cwd !== '~') {
              outputStr = `bash: ./run_next_module.sh: No such file or directory`;
              break;
            }
            outputStr = vfs['~'].contents['run_next_module.sh'].content;
            break;
          case 'matrix':
            {
              // Pass the element itself: an id would collide with the page-wide #matrix-canvas overlay
              const rainCanvas = document.createElement('canvas');
              termBody.replaceChildren(rainCanvas);
              startMatrixRain(rainCanvas, termBody);
            }
            return;
          default:
            outputStr = `bash: ${cmd}: command not found`;
        }

        if (cmd !== 'clear') {
          out.innerHTML = outputStr;
          if (outputStr !== '') promptWrapper.before(out);
        } else {
          termBody.appendChild(promptWrapper);
        }
      }

      termBody.scrollTop = termBody.scrollHeight;
      input.focus();
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   CINEMATIC 3D STAGE — scroll-bound Three.js film (scene/)
   Loaded after first paint so the hero intro isn't blocked by three.js.
═══════════════════════════════════════════════════════════════ */
const stageCanvas = document.getElementById('stage')
if (stageCanvas) {
  const bootStage = () => import('./scene/stage.js')
    .then(({ initStage }) => initStage(stageCanvas))
    .catch(err => {
      console.error('Stage failed to load:', err)
      document.documentElement.classList.add('no-webgl')
    })
  if ('requestIdleCallback' in window) requestIdleCallback(bootStage, { timeout: 1200 })
  else setTimeout(bootStage, 300)
}

/* ═══════════════════════════════════════════════════════════════
   2.5D MASCOT — the mascot image as a living, cursor-aware WebGL card
═══════════════════════════════════════════════════════════════ */
{
  const bootMascot = () => import('./scene/mascot.js')
    .then(({ initMascot }) => initMascot(mascotChar))
    .catch(err => console.warn('Mascot stays static:', err))
  if ('requestIdleCallback' in window) requestIdleCallback(bootMascot, { timeout: 2000 })
  else setTimeout(bootMascot, 600)
}

/* ═══════════════════════════════════════════════════════════════
   ALL PROJECTS GALLERY + COMMAND PALETTE (gallery.js, palette.js)
═══════════════════════════════════════════════════════════════ */
const gallery = initGallery({ lenis })
initActivity()

initPalette({
  lenis,
  openProject: name => gallery.openProject?.(name),
  actions: [
    { label: 'Chat with Junyu’s AI guide', hint: 'Open the chat window', run: () => chatToggleBtn.click() },
    {
      label: 'Copy email address', hint: 'yaoprox0@gmail.com',
      run: () => navigator.clipboard?.writeText('yaoprox0@gmail.com')
        .then(() => typeText('Email copied to your clipboard.'))
        .catch(() => { window.location.href = 'mailto:yaoprox0@gmail.com' }),
    },
    { label: 'Open GitHub profile', hint: 'github.com/jjtjtyt6644', run: () => window.open('https://github.com/jjtjtyt6644', '_blank', 'noopener') },
    { label: 'View badges on Credly', hint: 'IBM SkillsBuild', run: () => window.open('https://www.credly.com/users/yao-junyu/badges', '_blank', 'noopener') },
    { label: 'Search all projects', hint: 'Focus the gallery search', keywords: 'filter find repo', run: () => { lenis.scrollTo('#gallery', { offset: -40 }); setTimeout(() => document.getElementById('gallery-search')?.focus(), 900) } },
    { label: 'Toggle Red Team mode', hint: 'Easter egg', keywords: 'konami red theme', run: () => document.body.classList.toggle('red-team-mode') },
  ],
})

/* ═══════════════════════════════════════════════════════════════
   CONTACT — copy email in one click (falls back to opening the mail app)
═══════════════════════════════════════════════════════════════ */
const copyEmailBtn = document.getElementById('btn-copy-email')
const contactToast = document.getElementById('contact-toast')
if (copyEmailBtn) {
  let toastTimer
  copyEmailBtn.addEventListener('click', async () => {
    const email = copyEmailBtn.dataset.email
    try {
      await navigator.clipboard.writeText(email)
      copyEmailBtn.textContent = 'Copied ✓'
      contactToast.textContent = `${email} copied to your clipboard.`
    } catch {
      window.location.href = `mailto:${email}`
      return
    }
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      copyEmailBtn.textContent = 'Copy email'
      contactToast.textContent = ''
    }, 2500)
  })
}

/* ═══════════════════════════════════════════════════════════════
   KONAMI CODE -> RED TEAM MODE
═══════════════════════════════════════════════════════════════ */
let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiPosition = 0;

document.addEventListener('keydown', function (e) {
  if (e.key === konamiCode[konamiPosition]) {
    konamiPosition++;
    if (konamiPosition === konamiCode.length) {
      document.body.classList.toggle('red-team-mode');
      if (document.body.classList.contains('red-team-mode')) {
        appendMessage('ai', "WARNING: RED TEAM MODE ACTIVATED. NEURAL LINK COMPROMISED. ALL SYSTEMS INVERTED.");
        document.getElementById('ai-chat-window').classList.add('open');
      } else {
        appendMessage('ai', "SYSTEM RESTORED. Resuming standard operations.");
      }
      konamiPosition = 0;
    }
  } else {
    konamiPosition = 0;
  }
});




/* ═══════════════════════════════════════════════════════════════
   MATRIX RAIN TERMINAL LOGIC
═══════════════════════════════════════════════════════════════ */
function startMatrixRain(canvas, container) {
  const ctx = canvas.getContext('2d');

  canvas.width = container.clientWidth;
  canvas.height = 400;
  container.style.overflow = 'hidden';

  const chars = '01ABCDEFXYZ@#$%^&*()';
  const fontSize = 14;
  const columns = canvas.width / fontSize;
  const drops = [];
  for (let x = 0; x < columns; x++) drops[x] = 1;
  const rainColor = document.body.classList.contains('red-team-mode') ? '#ef4444' : '#4ade80';

  let rainInterval = setInterval(() => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = rainColor;
    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
      const text = chars.charAt(Math.floor(Math.random() * chars.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }, 33);

  setTimeout(() => {
    const hint = document.createElement('div');
    hint.style.position = 'absolute';
    hint.style.bottom = '10px';
    hint.style.left = '10px';
    hint.style.color = 'white';
    hint.style.zIndex = 10;
    hint.innerText = '[Type clear or press Ctrl+C to escape Matrix]';
    container.appendChild(hint);
  }, 2000);

  const pWrapper = document.createElement('div');
  pWrapper.className = 'term-line';
  pWrapper.style.position = 'absolute';
  pWrapper.style.bottom = '30px';
  pWrapper.style.left = '10px';
  pWrapper.style.zIndex = 10;

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'term-input';
  inp.style.width = '100px';

  pWrapper.appendChild(inp);
  container.appendChild(pWrapper);

  inp.focus();

  function destroyMatrix() {
    clearInterval(rainInterval);
    container.style.overflow = 'auto';
    container.innerHTML = '';
    setupInteractiveTerminal(container, null);
    document.removeEventListener('keydown', handleGlobalKey);
  }


  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = inp.value.trim().toLowerCase();
      if (val === 'clear' || val === 'exit') {
        destroyMatrix();
      } else {
        inp.value = '';
      }
    } else if (e.key === 'c' && e.ctrlKey) {
      destroyMatrix();
    }
  });


  function handleGlobalKey(e) {
    // Only when nothing is selected, so Ctrl+C still copies text elsewhere on the page
    if (e.key === 'c' && e.ctrlKey && !String(window.getSelection())) {
      destroyMatrix();
    }
  }
  document.addEventListener('keydown', handleGlobalKey)
}

/* ═══════════════════════════════════════════════════════════════
   NAV ACTIVE SECTION TRACKER
═══════════════════════════════════════════════════════════════ */
const navBtns = document.querySelectorAll('.nav-btn[data-nav]')
const sectionIds = ['about', 'certs', 'builds', 'gallery', 'experience', 'contact']

sectionIds.forEach(id => {
  const el = document.getElementById(id)
  if (!el) return
  ScrollTrigger.create({
    trigger: el,
    start: 'top 55%',
    end: 'bottom 55%',
    onEnter: () => setActiveNav(id),
    onEnterBack: () => setActiveNav(id),
  })
})

function setActiveNav(id) {
  navBtns.forEach(btn => btn.classList.remove('nav-active'))
  const active = document.querySelector(`.nav-btn[data-nav="${id}"]`)
  if (active) active.classList.add('nav-active')
}

/* ═══════════════════════════════════════════════════════════════
   BUILDS PROGRESS DOTS
═══════════════════════════════════════════════════════════════ */
const bpDots = document.querySelectorAll('.bp-dot')

function setActiveDot(index) {
  bpDots.forEach(d => d.classList.remove('active'))
  if (bpDots[index]) bpDots[index].classList.add('active')
}

// Sync dot with scroll progress of builds section
ScrollTrigger.create({
  trigger: '.builds-section',
  start: 'top top',
  end: () => `+=${buildsScrollLength()}`,
  scrub: true,
  onUpdate: (self) => {
    const idx = Math.min(Math.floor(self.progress * cards.length), cards.length - 1)
    setActiveDot(idx)
  }
})

/* ═══════════════════════════════════════════════════════════════
   MATRIX EASTER EGG
═══════════════════════════════════════════════════════════════ */
window.startMatrixEffect = function() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.opacity = '1';
  
  const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレゲゼデベペオォコソトノホモヨョロゴゾドボポヴッン';
  const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  const alphabet = katakana + latin + nums;
  
  const fontSize = 16;
  const columns = canvas.width / fontSize;
  
  const drops = [];
  for (let x = 0; x < columns; x++) {
    drops[x] = 1;
  }
  
  let interval;
  
  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#0F0';
    ctx.font = fontSize + 'px monospace';
    
    for (let i = 0; i < drops.length; i++) {
      const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  
  interval = setInterval(draw, 30);
  
  setTimeout(() => {
    canvas.style.opacity = '0';
    setTimeout(() => {
      clearInterval(interval);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 1000);
  }, 5000);
};