import {
  ACESFilmicToneMapping, Color, Group, PerspectiveCamera, Scene, Vector2, Vector3, WebGLRenderer,
} from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { gsap } from 'gsap'
import { makeStarfield, makeGrid, makeCore, makeGlow, makeNetwork, makeCity } from './world.js'
import { createDirector } from './director.js'
import { CORE } from './shots.js'

/* Film grain + vignette, applied last (display space). */
const FilmLook = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0.045 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      c.rgb += (hash(vUv * 1024.0 + fract(uTime) * 97.0) - 0.5) * uGrain;
      vec2 q = (vUv - 0.5) * vec2(1.0, 0.85);
      c.rgb *= mix(0.5, 1.0, smoothstep(0.85, 0.25, length(q)));
      gl_FragColor = c;
    }`,
}

const CYAN = new Color('#7dd3fc')
const VIOLET = new Color('#a78bfa')

export function initStage(canvas) {
  const root = document.documentElement
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const lite = !window.matchMedia('(pointer: fine)').matches || window.innerWidth < 768

  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' })
  } catch (err) {
    console.warn('WebGL unavailable, using the static backdrop.', err)
    root.classList.add('no-webgl')
    return null
  }

  let dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.75)
  renderer.setPixelRatio(dpr)
  renderer.setSize(window.innerWidth, window.innerHeight, false)
  renderer.toneMapping = ACESFilmicToneMapping

  const scene = new Scene()
  scene.background = new Color('#07090f')
  const camera = new PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 2500)

  // Uniforms shared by every material in the world
  const u = {
    uTime: { value: 0 },
    uAccent: { value: CYAN.clone() },
    uFogColor: { value: scene.background.clone() },
    uFogDensity: { value: 0.0065 },
    uPR: { value: dpr },
  }

  // The world pivots on the core so the finale can collapse everything into it
  const c = new Vector3(...CORE)
  const world = new Group()
  world.position.copy(c)
  const set = new Group()
  set.position.copy(c).negate()
  world.add(set)
  scene.add(world)

  const stars = makeStarfield(lite ? 1400 : 3200, u)
  const grid = makeGrid(u)
  const core = makeCore()
  const glow = makeGlow()
  const net = makeNetwork(lite ? 130 : 220, lite ? 180 : 380, u)
  const city = makeCity({ cell: lite ? 8 : 6 }, u)

  grid.object.position.set(c.x, 0, c.z)
  core.object.position.copy(c)
  net.object.position.copy(c)
  glow.object.position.copy(c)
  set.add(grid.object, city.object, core.object, net.object)
  scene.add(stars.object, glow.object)

  // Post: bloom for the neon, then tone mapping, then grain + vignette
  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(dpr)
  composer.setSize(window.innerWidth, window.innerHeight)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), lite ? 0.7 : 0.9, 0.55, 0.18))
  composer.addPass(new OutputPass())
  const film = new ShaderPass(FilmLook)
  composer.addPass(film)

  const director = createDirector({ reduced })
  const intro = { v: 0 } // letterbox bars slide in on load
  if (!reduced) gsap.to(intro, { v: 1, duration: 2.2, ease: 'expo.out', delay: 0.2 })

  const target = new Vector3()
  let lastLb = -1

  function apply(t) {
    const r = director.rig
    const sway = reduced ? 0 : 1
    camera.position.set(r.cx + Math.sin(t * 0.45) * 0.18 * sway, r.cy + Math.sin(t * 0.62) * 0.12 * sway, r.cz)
    // Portrait screens: pull off-centre framing back toward the core and widen the lens,
    // so rule-of-thirds compositions don't push the subject out of a narrow frame.
    const narrow = Math.min(camera.aspect, 1)
    target.set(c.x + (r.tx - c.x) * narrow * narrow, r.ty, r.tz)
    camera.lookAt(target)
    const fov = r.fov * (1 + (1 - narrow) * 0.35)
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    renderer.toneMappingExposure = r.exp

    u.uAccent.value.copy(CYAN).lerp(VIOLET, r.hue)
    u.uFogDensity.value = 0.0065 * (1 - r.col * 0.85)
    net.uniforms.uBreak.value = r.brk
    net.uniforms.uFlare.value = r.flare
    city.uniforms.uRise.value = r.rise
    grid.uniforms.uFade.value = 1 - r.col * 0.6
    world.scale.setScalar(Math.max(1 - r.col * 0.985, 0.001))
    core.update(t, r.brk, u.uAccent.value)
    glow.update(t, r.brk, r.col, u.uAccent.value)
    stars.object.position.copy(camera.position)

    const lb = Math.round(r.lb * intro.v * 1000) / 1000
    if (lb !== lastLb) {
      root.style.setProperty('--lb', lb)
      lastLb = lb
    }
  }

  function setDpr(next) {
    dpr = next
    renderer.setPixelRatio(dpr)
    composer.setPixelRatio(dpr)
    u.uPR.value = dpr
  }

  function renderOnce(t = 0) {
    u.uTime.value = t
    apply(t)
    composer.render()
  }

  // Frame loop on GSAP's ticker, shared with Lenis and ScrollTrigger
  let ema = 16
  let since = 0
  function tick(time, deltaMs) {
    if (document.hidden) return
    u.uTime.value = time
    film.uniforms.uTime.value = time
    director.update()
    apply(time)
    composer.render()

    // Adaptive quality: step the pixel ratio down if frames run long
    ema = ema * 0.95 + deltaMs * 0.05
    since += deltaMs
    if (since > 2500 && ema > 24 && dpr > 0.8) {
      setDpr(Math.max(0.75, dpr - 0.25))
      since = 0
      ema = 16
    }
  }

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
    if (reduced) renderOnce()
  }
  let resizeTimer
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(resize, 150)
  })

  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault()
    gsap.ticker.remove(tick)
    root.classList.add('no-webgl')
  })

  if (reduced) {
    root.classList.add('reduced-motion')
    renderOnce()
  } else {
    gsap.ticker.add(tick)
  }
  requestAnimationFrame(() => canvas.classList.add('is-live'))

  if (import.meta.env.DEV) window.__stage = { renderer, camera, director, setDpr }
  return { renderer, director }
}
