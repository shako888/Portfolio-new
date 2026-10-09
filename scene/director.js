import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { KEYS, SECTIONS, pose } from './shots.js'

gsap.registerPlugin(ScrollTrigger)

/*
   DIRECTOR — binds the page's scroll position to the film.

   One paused GSAP timeline whose time unit is scroll pixels: each keyframe in
   shots.js is placed at its section's real scroll offset (measured by
   ScrollTrigger, so the pinned Builds section's extra length is included).
   Scrolling eases a playhead towards the current scroll position, which gives
   the camera a little dolly inertia on top of Lenis.
*/
export function createDirector({ reduced }) {
  const rig = pose(KEYS[0])
  const play = { t: 0 }

  if (reduced) return { rig, update() {} }

  const anchors = {}
  SECTIONS.forEach(id => {
    const el = document.getElementById(id)
    if (el) anchors[id] = ScrollTrigger.create({ trigger: el, start: 'top top' })
  })

  let tl = null

  function rebuild() {
    const vh = window.innerHeight
    const max = ScrollTrigger.maxScroll(window) || 1

    let prev = -1
    const at = KEYS.map(k => {
      const a = anchors[k.sec]
      let p = k.sec === 'end' ? max + k.vh * vh : a ? a.start + k.vh * vh : prev + 1
      p = Math.min(Math.max(p, 0), max)
      if (p <= prev) p = prev + 1
      prev = p
      return p
    })

    if (tl) tl.kill()
    tl = gsap.timeline({ paused: true })
    for (let i = 1; i < KEYS.length; i++) {
      tl.fromTo(rig, pose(KEYS[i - 1]), {
        ...pose(KEYS[i]),
        duration: at[i] - at[i - 1],
        ease: KEYS[i].ease || 'sine.inOut',
        immediateRender: false,
      }, at[i - 1])
    }
    tl.time(Math.min(play.t, tl.duration()))
  }

  ScrollTrigger.addEventListener('refresh', rebuild)
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: self => {
      gsap.to(play, { t: self.scroll(), duration: 1.1, ease: 'power3.out', overwrite: true })
    },
  })

  play.t = window.scrollY
  ScrollTrigger.refresh()

  return {
    rig,
    update() {
      if (tl) tl.time(Math.min(play.t, tl.duration()))
    },
  }
}
