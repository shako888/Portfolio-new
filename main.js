import Lenis from '@studio-freight/lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)


const lenis = new Lenis({
  duration: 1.6,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
  smoothTouch: false,
})
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add(time => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0, 0)


const dot      = document.querySelector('.cursor')
const follower = document.querySelector('.cursor-follower')
const isTouch  = !window.matchMedia('(pointer: fine)').matches

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
lenis.on('scroll', ({ scroll }) => {
  navbar.classList.toggle('scrolled', scroll > 60)
})


gsap.timeline({ defaults: { ease: 'expo.out' } })
  .from('.hero-badge',  { y: -30, opacity: 0, duration: 1.2,                          delay: 0.2 })
  .from('.hero .line',  { y: '110%', rotationZ: 3, opacity: 0, duration: 1.6, stagger: 0.12 }, '-=0.8')
  .from('.hero-sub',    { opacity: 0, letterSpacing: '10px', duration: 1.2 },                   '-=0.8')
  .to('.hero-scroll',   { opacity: 1, duration: 0.6 },                                          '-=0.4')
  .to('.scroll-line',   { scaleX: 1, duration: 0.8, ease: 'power3.out' },                       '<')


gsap.from('.about .eyebrow', {
  opacity: 0, y: 20, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.about', start: 'top 80%' }
})

// Animated number counters
document.querySelectorAll('.stat-num').forEach(el => {
  const target = parseInt(el.dataset.target, 10)
  gsap.fromTo(el,
    { textContent: 0 },
    { textContent: target, duration: 2, ease: 'power2.out',
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

// Hide ALL cards immediately via GSAP so CSS isn't fighting us
gsap.set(cards, { autoAlpha: 0 })

const masterTl = gsap.timeline({
  scrollTrigger: {
    trigger: '.builds-section',
    start: 'top top',
    end: () => `+=${window.innerHeight * 5}`,
    pin: true,
    scrub: 1,
  }
})

cards.forEach((card, i) => {
  const imgWrap = card.querySelector('.build-image-wrapper')
  const img     = card.querySelector('img')
  const titles  = card.querySelectorAll('h3')
  const meta    = card.querySelector('.info-meta')

  /* ── IN ── */
  const inTl = gsap.timeline()

  // Make card visible first
  inTl.set(card, { autoAlpha: 1 })

  if (i === 0) {
    // Clip-path wipe from bottom + zoom out
    inTl.fromTo(imgWrap,
      { clipPath: 'inset(100% 0% 0% 0%)', y: 40 },
      { clipPath: 'inset(0%   0% 0% 0%)', y: 0, duration: 1, ease: 'expo.inOut' }
    )
    inTl.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.1, ease: 'expo.out' }, '<')
    inTl.fromTo(titles,
      { y: '115%', rotation: 4 },
      { y: '0%', rotation: 0, duration: 1, stagger: 0.1, ease: 'expo.out' }, '-=0.6')

  } else if (i === 1) {
    // Slide from far right + skew title drops from above
    inTl.fromTo(imgWrap,
      { x: '55%', opacity: 0, scale: 0.88 },
      { x: '0%', opacity: 1, scale: 1, duration: 1.1, ease: 'power4.out' }
    )
    inTl.fromTo(titles,
      { y: '-115%', skewY: -5 },
      { y: '0%', skewY: 0, duration: 1.1, stagger: 0.1, ease: 'back.out(1.3)' }, '-=0.8')

  } else {
    // 3D rotationX flip + blur-fade text
    inTl.fromTo(imgWrap,
      { rotationX: -65, scale: 0.75, opacity: 0, transformPerspective: 1200 },
      { rotationX: 0, scale: 1, opacity: 1, duration: 1.3, ease: 'elastic.out(1, 0.65)' }
    )
    inTl.fromTo(titles,
      { opacity: 0, y: 55, filter: 'blur(12px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, stagger: 0.1, ease: 'power3.out' }, '-=0.7')
  }

  // Meta always floats up
  inTl.fromTo(meta,
    { opacity: 0, y: 22 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.4'
  )

  masterTl.add(inTl)
  masterTl.to({}, { duration: 0.9 }) // hold

  /* ── OUT ── */
  if (i < cards.length - 1) {
    const outTl = gsap.timeline()

    if (i === 0) {
      outTl.to(imgWrap, { y: -70, opacity: 0, duration: 0.8, ease: 'power3.in' })
      outTl.to(titles,  { y: '-130%', duration: 0.6, stagger: 0.06, ease: 'power3.in' }, '<')
      outTl.to(meta,    { opacity: 0, duration: 0.3 }, '<')
    } else if (i === 1) {
      outTl.to(imgWrap, { x: '-55%', scale: 0.6, opacity: 0, duration: 0.8, ease: 'expo.in' })
      outTl.to(titles,  { opacity: 0, x: -35, duration: 0.5, stagger: 0.06, ease: 'expo.in' }, '<')
      outTl.to(meta,    { opacity: 0, duration: 0.3 }, '<')
    } else if (i === 2) {
      outTl.to(imgWrap, { rotationX: 45, opacity: 0, scale: 0.8, duration: 0.8, ease: 'power2.in' })
      outTl.to(titles,  { opacity: 0, y: -45, filter: 'blur(10px)', duration: 0.6, stagger: 0.06, ease: 'power2.in' }, '<')
      outTl.to(meta,    { opacity: 0, duration: 0.3 }, '<')
    }

    // Hide the card after it exits so it doesn't bleed through
    outTl.set(card, { autoAlpha: 0 })
    masterTl.add(outTl)
  }
})


gsap.timeline({ scrollTrigger: { trigger: '.contact', start: 'top 75%' } })
  .from('.contact-eyebrow', { opacity: 0, y: 20, duration: 0.8 })
  .from('.contact .line',   { y: '110%', duration: 1.4, stagger: 0.1, ease: 'expo.out' }, '-=0.4')
  .from('.contact-sub',     { opacity: 0, y: 20, duration: 1, ease: 'power3.out' }, '-=0.8')
  .from('.contact-links a', { opacity: 0, y: 30, stagger: 0.15, duration: 0.9, ease: 'power3.out' }, '-=0.6')


if (!isTouch) {
  document.querySelectorAll('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect()
      gsap.to(btn, {
        x: (e.clientX - r.left - r.width  / 2) * 0.35,
        y: (e.clientY - r.top  - r.height / 2) * 0.35,
        duration: 0.5, ease: 'power3.out'
      })
    })
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' })
    })
  })
}


const overlay    = document.getElementById('modal-overlay')
const modalClose = document.getElementById('modal-close')
const modalImg   = document.getElementById('modal-img')
const modalTitle = document.getElementById('modal-title')
const modalDesc  = document.getElementById('modal-desc')
const modalTags  = document.getElementById('modal-tags')
const modalLink  = document.getElementById('modal-link')

function openModal(card) {
  const title  = card.dataset.title
  const desc   = card.dataset.desc
  const img    = card.dataset.img
  const github = card.dataset.github
  const tags   = (card.dataset.tags || '').split(',').map(t => t.trim()).filter(Boolean)

  modalImg.src       = img
  modalImg.alt       = title
  modalTitle.textContent = title
  modalDesc.textContent  = desc
  modalLink.href     = github

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

// Click on "Explore →" buttons inside build cards
document.querySelectorAll('.open-modal-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation()
    const card = btn.closest('.build-card')
    if (card) openModal(card)
  })
})

// Close via × button
modalClose.addEventListener('click', closeModal)

// Close by clicking backdrop
overlay.addEventListener('click', e => {
  if (e.target === overlay) closeModal()
})

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal()
})

/*
   MASCOT – AI Dynamic Speech Bubble */
const mascotChar   = document.getElementById('mascot-char')
const mascotBubble = document.getElementById('mascot-bubble')
const bubbleText   = document.getElementById('bubble-text')
const bubbleClose  = document.getElementById('bubble-close')

// ── State ─────────────────────────────────────────────
let activeSection    = ''       
let typingTimer      = null    
let lastSectionSwap  = 0       
const COOLDOWN_MS    = 1500    // Minimum ms between scroll-triggered section changes

// Cache Groq API responses per section to avoid spamming it
const CACHED_RESPONSES = {} 

// Pristine structured context for the AI, so it never gets confused by messy DOM text
const SECTION_CONTEXT = {
  hero: "Junyu's Hero Section: A high schooler from Singapore passionate about Cybersecurity, AI, and Networking. Mission is breaking things legally.",
  about: "Junyu's About Section: 18+ GitHub repos. 2 IBM certifications. Specializes in Security, Networking, and rapid development.",
  certs: "Junyu's Certifications: IBM AI Certified and IBM Cyber Security Certified while still in high school.",
  builds: "Junyu's Projects: 1. CyberAttacks-Simulation (vulnerable site with SOC dashboard). 2. FocusMode (Chrome productivity extension). 3. Ai-Vision (AI browser assistant). 4. Proxyyy (a proxy server for traffic routing & security).",
  contact: "Junyu's Contact Page: Email yaoprox0@gmail.com. Open to security chats and collaboration."
}

// ── Fetch from Groq AI ────────────────────────────────
async function fetchElaboration(sectionId) {
  // If we already generated an answer for this section, just return it
  if (CACHED_RESPONSES[sectionId]) {
    return CACHED_RESPONSES[sectionId]
  }

  // Use Vite env var
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
    return "API key missing! Please set VITE_GROQ_API_KEY in the .env file! 🔑"
  }

  const cleanContext = SECTION_CONTEXT[sectionId] || "Junyu's Portfolio space.";

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: "You are a professional, knowledgeable AI guide for Junyu's cybersecurity portfolio. Read the exact context of the section the user is looking at and provide a concise, professional 1-2 sentence elaboration. Be direct and analytical. Limit yourself to a maximum of one emoji per response. Do not use quotes, filler intros, overly hyped language, or ask questions."
          },
          {
            role: 'user',
            content: `The user is looking at this section on my portfolio right now:\n${cleanContext}`
          }
        ],
        max_tokens: 80,
        temperature: 0.4
      })
    })

    const data = await response.json()
    if (data.choices && data.choices.length > 0) {
      const result = data.choices[0].message.content.trim()
      CACHED_RESPONSES[sectionId] = result // Cache it!
      return result
    }
    return "Oops! My AI brain got scrambled! 😵‍💫"
  } catch (err) {
    console.error('Groq Error:', err)
    return "Uh oh, connection to the AI matrix failed! 🔌"
  }
}

// ── Typewriter ────────────────────────────────────────
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

// ── Switch to a new section ───────────────────────────
async function switchSection(section) {
  const now = Date.now()

  // Guard: user is scrolling fast and already saw this section, or triggered too soon
  if (section === activeSection || now - lastSectionSwap < COOLDOWN_MS) return

  activeSection   = section
  lastSectionSwap = now

  // Show thinking placeholder
  typeText("Processing context...")

  // Bounce character
  gsap.fromTo(mascotChar,
    { y: -16 },
    { y: 0, duration: 0.8, ease: 'elastic.out(1, 0.45)' }
  )

  // Fetch logic
  const message = await fetchElaboration(section)

  // Double check if user hasn't scrolled away during the API request taking time
  if (activeSection === section) {
    typeText(message)
  }
}

// ── Scroll-stop detection ─────────────────────────────
const TRACKED = ['hero', 'about', 'certs', 'builds', 'contact']

function getNearestSection() {
  // Flawless accuracy: what section is physically in the exact center of the user's screen?
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
  }, 750)  // User holds still for 750ms -> grab new section
})

// ── Click character → Force regenerate thought ───────
mascotChar.addEventListener('click', async () => {
  // Clear the cache for this section so it generates a fresh thought
  CACHED_RESPONSES[activeSection] = null;
  
  // Excitement animation
  gsap.timeline()
    .to(mascotChar, { scale: 0.85, rotation: -15, duration: 0.2 })
    .to(mascotChar, { scale: 1, rotation: 0, duration: 1.2, ease: 'elastic.out(1, 0.3)' });

  typeText("Analyzing current view...");

  const message = await fetchElaboration(activeSection || 'hero');
  typeText(message);
});

// ── Dismiss bubble via × ──────────────────────────────
bubbleClose.addEventListener('click', () => {
  mascotBubble.classList.remove('visible')
  clearInterval(typingTimer)
})

// ── Double-click → toggle bubble ─────────────────────
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

// ── Initial greeting 
setTimeout(() => {
  mascotBubble.classList.add('visible')
  activeSection  = ''
  lastSectionSwap = 0
  
  
  CACHED_RESPONSES['hero'] = "Hello. I am Junyu's AI assistant. Scroll down, and I will provide real-time context on his work.";
  switchSection('hero')
}, 2400)

