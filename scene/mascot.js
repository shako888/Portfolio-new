import {
  Group, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, TextureLoader,
  LinearFilter, Vector2, WebGLRenderer, Color,
} from 'three'
import { gsap } from 'gsap'

/*
   MASCOT 2.5D — the mascot image rendered as a bendable, lit card.
   It leans and tilts toward the cursor (with a depth bulge so the tilt reads as 3D),
   breathes and sways, rim-lights its silhouette on the side facing the cursor,
   RGB-glitches on hover, squashes when clicked and bobs while the bubble "talks".
   The original <img> stays in the DOM as the fallback.
*/

const ACCENT = new Color('#7dd3fc')
const RED = new Color('#ef4444')

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uLook;
  uniform float uSquash;
  uniform float uTalk;
  uniform float uHover;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;          // plane is 1x1 with its feet at y = 0
    float h = uv.y;
    float torso = smoothstep(0.1, 0.45, h) * (1.0 - smoothstep(0.45, 0.8, h));

    p.x *= 1.0 + 0.014 * sin(uTime * 2.2) * torso;                // breathing
    p.y += 0.008 * sin(uTime * 2.2) * h;
    p.x += 0.022 * sin(uTime * 1.1) * h * h;                      // idle sway
    p.x += uLook.x * 0.07 * h * h;                                // lean toward the cursor
    p.y += uLook.y * 0.02 * h * h;
    p.y += uTalk * 0.014 * abs(sin(uTime * 13.0)) * h;            // talking bob
    p.y += 0.018 * sin(uTime * 1.6);                              // float
    p.y *= 1.0 - uSquash * 0.2;                                   // squash & stretch from the feet
    p.x *= 1.0 + uSquash * 0.14;
    p *= 1.0 + uHover * 0.035;

    // depth bulge so tilting gives parallax instead of a flat card
    p.z = 0.16 * max(0.0, 1.0 - length(uv - vec2(0.5, 0.55)) * 1.7);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uTexel;
  uniform vec2 uLight;
  uniform vec3 uRim;
  uniform float uGlitch;
  uniform float uTime;
  varying vec2 vUv;

  float alphaAt(vec2 uv) { return texture2D(uTex, uv).a; }

  void main() {
    // RGB split while glitching (matches the site's hover glitch)
    float jitter = uGlitch * (0.012 + 0.008 * sin(uTime * 90.0));
    vec4 base = texture2D(uTex, vUv);
    float r = texture2D(uTex, vUv + vec2(jitter, 0.0)).r;
    float b = texture2D(uTex, vUv - vec2(jitter, 0.0)).b;
    vec3 col = vec3(mix(base.r, r, uGlitch), base.g, mix(base.b, b, uGlitch));
    float a = max(base.a, uGlitch * 0.6 * max(texture2D(uTex, vUv + vec2(jitter, 0.0)).a, texture2D(uTex, vUv - vec2(jitter, 0.0)).a));

    // silhouette rim light, strongest on the side facing the cursor
    vec2 o = uTexel * 2.0;
    float aL = alphaAt(vUv - vec2(o.x, 0.0)), aR = alphaAt(vUv + vec2(o.x, 0.0));
    float aD = alphaAt(vUv - vec2(0.0, o.y)), aU = alphaAt(vUv + vec2(0.0, o.y));
    vec2 grad = vec2(aR - aL, aU - aD);
    float edge = clamp(base.a - min(min(aL, aR), min(aD, aU)), 0.0, 1.0);
    vec2 outward = length(grad) > 0.001 ? -normalize(grad) : vec2(0.0);
    float facing = clamp(dot(outward, uLight) * 0.5 + 0.5, 0.0, 1.0);
    col += uRim * edge * (0.25 + facing * 1.1);

    // soft directional shading across the body
    col *= 1.0 + 0.1 * dot(vUv - 0.5, uLight);

    if (a < 0.01) discard;
    gl_FragColor = vec4(col * a, a);   // premultiplied
  }
`

export function initMascot(container) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const canvas = document.createElement('canvas')
  canvas.className = 'mascot-canvas'
  canvas.setAttribute('aria-hidden', 'true')

  let renderer
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true })
  } catch (err) {
    console.warn('Mascot WebGL unavailable, keeping the static image.', err)
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  container.appendChild(canvas)

  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 0.75, 0.1, 20)
  // Frame a 1x1 plane so it fills ~72% of the canvas width with its feet at the bottom edge
  camera.position.set(0, 0.893, 3.44)

  const img = container.querySelector('img')
  const uniforms = {
    uTex: { value: null },
    uTexel: { value: new Vector2(1 / 200, 1 / 200) },
    uTime: { value: 0 },
    uLook: { value: new Vector2() },
    uLight: { value: new Vector2(0, 1) },
    uRim: { value: ACCENT.clone() },
    uSquash: { value: 0 },
    uTalk: { value: 0 },
    uHover: { value: 0 },
    uGlitch: { value: 0 },
  }

  const geo = new PlaneGeometry(1, 1, 24, 24)
  geo.translate(0, 0.5, 0) // pivot at the feet
  const mesh = new Mesh(geo, new ShaderMaterial({
    uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false,
    premultipliedAlpha: true,
  }))
  const pivot = new Group()
  pivot.add(mesh)
  scene.add(pivot)

  const bubbleText = document.getElementById('bubble-text')
  const look = new Vector2()   // smoothed
  const want = new Vector2()   // target from the cursor
  let pointerSeen = false
  let live = false

  function resize() {
    const w = canvas.clientWidth || 180
    const h = canvas.clientHeight || 240
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  function frame(time) {
    uniforms.uTime.value = time
    if (!pointerSeen) {
      // no mouse (touch devices): glance around on its own
      want.set(Math.sin(time * 0.35) * 0.6, Math.sin(time * 0.23) * 0.3)
    }
    look.lerp(want, reduced ? 1 : 0.08)
    uniforms.uLook.value.copy(look)
    if (look.lengthSq() > 0.0001) uniforms.uLight.value.copy(look).normalize()
    pivot.rotation.y = look.x * 0.45
    pivot.rotation.x = -look.y * 0.18

    const talking = bubbleText && bubbleText.classList.contains('typing') ? 1 : 0
    uniforms.uTalk.value += (talking - uniforms.uTalk.value) * 0.15
    uniforms.uRim.value.copy(document.body.classList.contains('red-team-mode') ? RED : ACCENT)

    renderer.render(scene, camera)
  }

  function tick(time) {
    if (document.hidden) return
    frame(time)
  }

  window.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return
    pointerSeen = true
    const r = canvas.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height * 0.45
    want.set(
      gsap.utils.clamp(-1, 1, (e.clientX - cx) / (window.innerWidth * 0.45)),
      gsap.utils.clamp(-1, 1, (cy - e.clientY) / (window.innerHeight * 0.45)),
    )
  }, { passive: true })

  container.addEventListener('pointerenter', () => {
    gsap.to(uniforms.uHover, { value: 1, duration: 0.4, ease: 'power3.out' })
    gsap.fromTo(uniforms.uGlitch, { value: 1 }, { value: 0, duration: 0.35, ease: 'steps(5)' })
  })
  container.addEventListener('pointerleave', () => {
    gsap.to(uniforms.uHover, { value: 0, duration: 0.5, ease: 'power3.out' })
  })
  container.addEventListener('click', () => {
    gsap.timeline()
      .to(uniforms.uSquash, { value: 1, duration: 0.12, ease: 'power2.out' })
      .to(uniforms.uSquash, { value: -0.35, duration: 0.18, ease: 'power2.out' })
      .to(uniforms.uSquash, { value: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' })
  })

  new TextureLoader().load(img ? img.currentSrc || img.src : '', tex => {
    tex.minFilter = LinearFilter
    tex.generateMipmaps = false
    uniforms.uTex.value = tex
    uniforms.uTexel.value.set(1 / tex.image.width, 1 / tex.image.height)
    resize()
    container.classList.add('is-3d')
    live = true
    if (reduced) frame(0)
    else gsap.ticker.add(tick)
  }, undefined, err => {
    console.warn('Mascot texture failed, keeping the static image.', err)
    canvas.remove()
  })

  let rt
  window.addEventListener('resize', () => {
    clearTimeout(rt)
    rt = setTimeout(() => { resize(); if (reduced && live) frame(0) }, 150)
  })

  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault()
    gsap.ticker.remove(tick)
    container.classList.remove('is-3d')
  })

  if (import.meta.env.DEV) {
    // dev-only: render a frame and return it as an image, for checking the shader
    window.__mascot = { uniforms, look: want, snapshot: () => { frame(performance.now() / 1000); return canvas.toDataURL('image/png') } }
  }
  return { uniforms }
}
