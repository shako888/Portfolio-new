import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { KEYS, SECTIONS, pose } from './shots.js'

gsap.registerPlugin(ScrollTrigger)
// Mobile browsers resize the viewport when the address bar shows/hides; don't re-measure for that
ScrollTrigger.config({ ignoreMobileResize: true })

/*
   DIRECTOR — binds the page's scroll position to the film.

   One paused GSAP timeline whose time unit is scroll pixels: each keyframe in
   shots.js is placed at its section's real scroll offset (measured by
   ScrollTrigger, so the pinned Builds section's extra length is included).

   Every frame the playhead eases toward the current scroll position, which gives
   the camera a little dolly inertia on top of Lenis. While ScrollTrigger is
   re-measuring the page (resize, DevTools opening, content changing height) it
   briefly reports a scroll of 0, so the playhead holds still and then snaps to
   the true position once measuring is done — the film never rewinds to the start.
*/
const FOLLOW = 5.5 // higher = camera catches up with the scroll faster

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
  let refreshing = false

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
    // Section positions just changed, so old playhead pixels mean something else now:
    // jump straight to where the page really is instead of easing from a stale value.
    play.t = window.scrollY
    tl.time(Math.min(play.t, tl.duration()))
  }

  ScrollTrigger.addEventListener('refreshInit', () => { refreshing = true })
  ScrollTrigger.addEventListener('refresh', () => {
    refreshing = false
    rebuild()
  })

  play.t = window.scrollY
  ScrollTrigger.refresh()

  return {
    rig,
    update(dt = 1 / 60) {
      if (!tl || refreshing) return
      const target = Math.min(window.scrollY, tl.duration())
      // Frame-rate independent easing; long pauses (tab hidden) simply snap
      const k = dt > 0.5 ? 1 : 1 - Math.exp(-dt * FOLLOW)
      play.t += (target - play.t) * k
      if (Math.abs(target - play.t) < 0.5) play.t = target
      tl.time(play.t)
    },
  }
}
