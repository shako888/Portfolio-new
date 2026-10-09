import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Color,
  EdgesGeometry, Group, IcosahedronGeometry, InstancedBufferAttribute, InstancedMesh,
  LineBasicMaterial, LineSegments, Matrix4, Mesh, PlaneGeometry, Points, Quaternion,
  ShaderMaterial, Sprite, SpriteMaterial, SRGBColorSpace, Vector3,
} from 'three'

/*
   WORLD BUILDERS
   Every builder takes the shared uniforms `u` (time, accent, fog, pixel ratio)
   and returns { object, uniforms?, update? }. All geometry is procedural.
*/

const FOG = /* glsl */ `
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  float fogFactor(float d) { return clamp(1.0 - exp(-uFogDensity * uFogDensity * d * d), 0.0, 1.0); }
`

// Nodes, edges and packets all move with the same function so the graph stays connected.
const NODE_POS = /* glsl */ `
  uniform float uBreak;
  uniform float uTime;
  vec3 nodePos(vec3 core, vec3 spread) {
    float b = smoothstep(0.0, 1.0, uBreak);
    vec3 p = mix(core, spread, b);
    p += 0.35 * b * vec3(sin(uTime * 0.6 + spread.y), cos(uTime * 0.5 + spread.x), sin(uTime * 0.4 + spread.z));
    return p;
  }
`

const rand = (a, b) => a + Math.random() * (b - a)

function randomDir() {
  const u = Math.random() * 2 - 1
  const t = Math.random() * Math.PI * 2
  const s = Math.sqrt(1 - u * u)
  return new Vector3(s * Math.cos(t), u, s * Math.sin(t))
}

/* ─── Starfield: lives at "infinity" (the stage moves it with the camera) ─── */
export function makeStarfield(count, u) {
  const pos = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const phase = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const d = randomDir()
    d.y = Math.abs(d.y) * 0.9 + 0.02 // keep stars above the horizon
    d.normalize().multiplyScalar(rand(700, 900))
    pos.set([d.x, d.y, d.z], i * 3)
    size[i] = Math.random() < 0.06 ? rand(2.6, 3.6) : rand(1.0, 2.2)
    phase[i] = Math.random() * 6.283
  }
  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(pos, 3))
  geo.setAttribute('aSize', new BufferAttribute(size, 1))
  geo.setAttribute('aPhase', new BufferAttribute(phase, 1))

  const mat = new ShaderMaterial({
    uniforms: { uTime: u.uTime, uPR: u.uPR },
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aPhase;
      uniform float uTime;
      uniform float uPR;
      varying float vTw;
      void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vTw = 0.55 + 0.45 * sin(uTime * 1.2 + aPhase);
        gl_PointSize = aSize * uPR;
      }`,
    fragmentShader: /* glsl */ `
      varying float vTw;
      void main() {
        float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(vec3(0.62, 0.7, 0.9) * a * vTw, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const object = new Points(geo, mat)
  object.frustumCulled = false
  return { object }
}

/* ─── Grid floor: endless anti-aliased lines with a pulse radiating from the core ─── */
export function makeGrid(u) {
  const uniforms = { uFade: { value: 1 } }
  const mat = new ShaderMaterial({
    uniforms: { ...uniforms, uTime: u.uTime, uAccent: u.uAccent, uFogColor: u.uFogColor, uFogDensity: u.uFogDensity },
    vertexShader: /* glsl */ `
      varying vec2 vLocal;
      varying vec3 vWorld;
      void main() {
        vLocal = position.xy;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uAccent;
      uniform float uFade;
      varying vec2 vLocal;
      varying vec3 vWorld;
      ${FOG}
      float gridLine(vec2 p, float size) {
        vec2 c = p / size;
        vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
        return 1.0 - min(min(g.x, g.y), 1.0);
      }
      void main() {
        float d = distance(cameraPosition, vWorld);
        float minor = gridLine(vLocal, 6.0);
        float major = gridLine(vLocal, 30.0);
        float wave = pow(0.5 + 0.5 * sin(length(vLocal) * 0.09 - uTime * 1.4), 14.0);
        float near = exp(-d * 0.004);
        vec3 col = vec3(0.012, 0.016, 0.03);
        col += uAccent * (minor * 0.16 + major * 0.32) * (0.6 + wave * 2.2) * near;
        col = mix(col, uFogColor, fogFactor(d));
        gl_FragColor = vec4(mix(uFogColor, col, uFade), 1.0);
      }`,
  })
  const object = new Mesh(new PlaneGeometry(1600, 1600, 1, 1), mat)
  object.rotation.x = -Math.PI / 2
  return { object, uniforms }
}

/* ─── Core: a wireframe icosahedron that pulses, then dissolves as the network spreads ─── */
export function makeCore() {
  const object = new Group()
  const outerMat = new LineBasicMaterial({ transparent: true, blending: AdditiveBlending, depthWrite: false })
  const innerMat = new LineBasicMaterial({ transparent: true, blending: AdditiveBlending, depthWrite: false })
  const outer = new LineSegments(new EdgesGeometry(new IcosahedronGeometry(4, 1)), outerMat)
  const inner = new LineSegments(new EdgesGeometry(new IcosahedronGeometry(2.1, 0)), innerMat)
  object.add(outer, inner)

  return {
    object,
    update(t, brk, accent) {
      const show = 1 - smooth(brk, 0, 0.55)
      object.visible = show > 0.001
      const s = 1 + brk * 2.6 + Math.sin(t * 2.0) * 0.03
      outer.scale.setScalar(s)
      inner.scale.setScalar(1 + brk * 1.4)
      outer.rotation.set(t * 0.07, t * 0.15, 0)
      inner.rotation.set(-t * 0.2, -t * 0.32, 0)
      outerMat.color.copy(accent).multiplyScalar(1.7)
      innerMat.color.copy(accent).lerp(WHITE, 0.5).multiplyScalar(2.2)
      outerMat.opacity = show
      innerMat.opacity = show
    },
  }
}

/* ─── Glow: the soft light inside the core, and the last point of light at the end ─── */
const WHITE = new Color(1, 1, 1)

export function makeGlow() {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 128
  const g = cv.getContext('2d')
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.18, 'rgba(255,255,255,0.55)')
  grd.addColorStop(0.5, 'rgba(255,255,255,0.1)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  const map = new CanvasTexture(cv)
  map.colorSpace = SRGBColorSpace

  const mat = new SpriteMaterial({ map, blending: AdditiveBlending, depthWrite: false, transparent: true })
  const object = new Sprite(mat)

  return {
    object,
    update(t, brk, col, accent) {
      const pulse = 0.85 + 0.15 * Math.sin(t * 2.2)
      const k = (1 - smooth(brk, 0, 0.6)) * 0.6 * pulse + col * 2.4
      object.visible = k > 0.01
      mat.color.copy(accent).lerp(WHITE, 0.2 + col * 0.6).multiplyScalar(k)
      const s = 9 + col * 8
      object.scale.set(s, s, 1)
    },
  }
}

/* ─── Network: nodes start packed on the core's shell and spread into a graph ─── */
export function makeNetwork(nodeCount, packetCount, u) {
  const uniforms = { uBreak: { value: 0 }, uFlare: { value: 0 } }
  const shared = { ...uniforms, uTime: u.uTime, uAccent: u.uAccent, uPR: u.uPR, uFogColor: u.uFogColor, uFogDensity: u.uFogDensity }

  const core = []
  const spread = []
  const seeds = [new Vector3(15, 4, 5), new Vector3(-13, -3, -9)] // the two certificate clusters
  const nodeCore = new Float32Array(nodeCount * 3)
  const nodeSpread = new Float32Array(nodeCount * 3)
  const nodeSize = new Float32Array(nodeCount)
  const nodeFlare = new Float32Array(nodeCount)

  for (let i = 0; i < nodeCount; i++) {
    const d = randomDir()
    const c = d.clone().multiplyScalar(4)
    const s = d.clone().multiplyScalar(6 + Math.pow(Math.random(), 0.6) * 20)
    s.y *= 0.55
    core.push(c)
    spread.push(s)
    nodeCore.set([c.x, c.y, c.z], i * 3)
    nodeSpread.set([s.x, s.y, s.z], i * 3)
    const flare = seeds.some(p => p.distanceTo(s) < 8) ? 1 : 0
    nodeFlare[i] = flare
    nodeSize[i] = flare ? rand(4, 6.5) : rand(2, 4.5)
  }

  const object = new Group()

  // Nodes
  const nodeGeo = new BufferGeometry()
  nodeGeo.setAttribute('position', new BufferAttribute(nodeCore.slice(), 3))
  nodeGeo.setAttribute('aCore', new BufferAttribute(nodeCore, 3))
  nodeGeo.setAttribute('aSpread', new BufferAttribute(nodeSpread, 3))
  nodeGeo.setAttribute('aSize', new BufferAttribute(nodeSize, 1))
  nodeGeo.setAttribute('aFlare', new BufferAttribute(nodeFlare, 1))
  const nodes = new Points(nodeGeo, new ShaderMaterial({
    uniforms: shared,
    vertexShader: /* glsl */ `
      attribute vec3 aCore;
      attribute vec3 aSpread;
      attribute float aSize;
      attribute float aFlare;
      uniform float uFlare;
      uniform float uPR;
      varying float vGlow;
      varying float vFog;
      ${NODE_POS}
      ${FOG}
      void main() {
        vec4 mv = modelViewMatrix * vec4(nodePos(aCore, aSpread), 1.0);
        gl_Position = projectionMatrix * mv;
        float d = max(-mv.z, 1.0);
        float f = aFlare * uFlare;
        vGlow = 1.0 + f * 1.2;
        // fade nodes that brush past the lens so they don't bloom into blobs
        vFog = (1.0 - fogFactor(d)) * smoothstep(2.0, 9.0, d);
        gl_PointSize = min(aSize * (1.0 + f * 0.8) * uPR * (110.0 / d), 16.0 * uPR);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uAccent;
      varying float vGlow;
      varying float vFog;
      void main() {
        float a = smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5));
        vec3 c = mix(uAccent, vec3(1.0), 0.35) * vGlow;
        gl_FragColor = vec4(c * a * vFog, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  }))
  nodes.frustumCulled = false

  // Edges: each node links to its 3 nearest neighbours (in the spread layout)
  const pairs = new Set()
  for (let i = 0; i < nodeCount; i++) {
    const near = []
    for (let j = 0; j < nodeCount; j++) {
      if (i !== j) near.push([spread[i].distanceToSquared(spread[j]), j])
    }
    near.sort((a, b) => a[0] - b[0])
    for (let k = 0; k < 3; k++) {
      const j = near[k][1]
      pairs.add(i < j ? `${i}:${j}` : `${j}:${i}`)
    }
  }
  const edgeList = [...pairs].map(p => p.split(':').map(Number))
  const eCore = new Float32Array(edgeList.length * 6)
  const eSpread = new Float32Array(edgeList.length * 6)
  edgeList.forEach(([a, b], i) => {
    eCore.set([core[a].x, core[a].y, core[a].z, core[b].x, core[b].y, core[b].z], i * 6)
    eSpread.set([spread[a].x, spread[a].y, spread[a].z, spread[b].x, spread[b].y, spread[b].z], i * 6)
  })
  const edgeGeo = new BufferGeometry()
  edgeGeo.setAttribute('position', new BufferAttribute(eCore.slice(), 3))
  edgeGeo.setAttribute('aCore', new BufferAttribute(eCore, 3))
  edgeGeo.setAttribute('aSpread', new BufferAttribute(eSpread, 3))
  const edges = new LineSegments(edgeGeo, new ShaderMaterial({
    uniforms: shared,
    vertexShader: /* glsl */ `
      attribute vec3 aCore;
      attribute vec3 aSpread;
      varying float vA;
      ${NODE_POS}
      ${FOG}
      void main() {
        vec4 mv = modelViewMatrix * vec4(nodePos(aCore, aSpread), 1.0);
        gl_Position = projectionMatrix * mv;
        vA = smoothstep(0.15, 0.7, uBreak) * (1.0 - fogFactor(-mv.z));
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uAccent;
      varying float vA;
      void main() { gl_FragColor = vec4(uAccent * 0.5 * vA, 1.0); }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  }))
  edges.frustumCulled = false

  // Packets: bright points travelling along random edges
  const pA = new Float32Array(packetCount * 3), pAS = new Float32Array(packetCount * 3)
  const pB = new Float32Array(packetCount * 3), pBS = new Float32Array(packetCount * 3)
  const pSpeed = new Float32Array(packetCount), pPhase = new Float32Array(packetCount)
  for (let i = 0; i < packetCount; i++) {
    let [a, b] = edgeList[(Math.random() * edgeList.length) | 0]
    if (Math.random() < 0.5) [a, b] = [b, a]
    pA.set([core[a].x, core[a].y, core[a].z], i * 3)
    pAS.set([spread[a].x, spread[a].y, spread[a].z], i * 3)
    pB.set([core[b].x, core[b].y, core[b].z], i * 3)
    pBS.set([spread[b].x, spread[b].y, spread[b].z], i * 3)
    pSpeed[i] = rand(0.15, 0.55)
    pPhase[i] = Math.random()
  }
  const packetGeo = new BufferGeometry()
  packetGeo.setAttribute('position', new BufferAttribute(pA.slice(), 3))
  packetGeo.setAttribute('aA', new BufferAttribute(pA, 3))
  packetGeo.setAttribute('aAS', new BufferAttribute(pAS, 3))
  packetGeo.setAttribute('aB', new BufferAttribute(pB, 3))
  packetGeo.setAttribute('aBS', new BufferAttribute(pBS, 3))
  packetGeo.setAttribute('aSpeed', new BufferAttribute(pSpeed, 1))
  packetGeo.setAttribute('aPhase', new BufferAttribute(pPhase, 1))
  const packets = new Points(packetGeo, new ShaderMaterial({
    uniforms: shared,
    vertexShader: /* glsl */ `
      attribute vec3 aA;
      attribute vec3 aAS;
      attribute vec3 aB;
      attribute vec3 aBS;
      attribute float aSpeed;
      attribute float aPhase;
      uniform float uPR;
      varying float vA;
      ${NODE_POS}
      ${FOG}
      void main() {
        float f = fract(uTime * aSpeed + aPhase);
        vec3 p = mix(nodePos(aA, aAS), nodePos(aB, aBS), f);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = max(-mv.z, 1.0);
        vA = smoothstep(0.3, 0.9, uBreak) * sin(f * 3.14159) * (1.0 - fogFactor(d));
        gl_PointSize = min(3.2 * uPR * (160.0 / d), 24.0 * uPR);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uAccent;
      varying float vA;
      void main() {
        float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(mix(uAccent, vec3(1.0), 0.6) * 2.2 * a * vA, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  }))
  packets.frustumCulled = false

  object.add(edges, nodes, packets)
  return { object, uniforms }
}

/* ─── City: instanced towers on the grid, rising row by row down the avenue ─── */
export function makeCity({ cell }, u) {
  const uniforms = { uRise: { value: 0 } }
  const placements = []
  const cols = Math.floor(120 / cell)
  const rows = Math.floor(165 / cell)
  for (let ix = 0; ix <= cols; ix++) {
    const x = (ix - cols / 2) * cell
    if (Math.abs(x) < 9) continue // keep the avenue clear for the camera
    for (let iz = 0; iz < rows; iz++) {
      if (Math.random() < 0.16) continue // plazas
      const z = -108 - iz * cell
      const edge = Math.min(Math.abs(x) / 60, 1)
      placements.push({
        x: x + rand(-0.6, 0.6),
        z: z + rand(-0.6, 0.6),
        w: cell * rand(0.45, 0.78),
        d: cell * rand(0.45, 0.78),
        h: 3 + Math.pow(Math.random(), 2.2) * 30 + edge * 10,
        delay: Math.min(((-z - 108) / 165) * 0.6 + Math.random() * 0.22, 0.82),
        tone: Math.random() < 0.1 ? rand(1.6, 2.2) : rand(0.35, 1),
      })
    }
  }

  const geo = new BoxGeometry(1, 1, 1)
  geo.translate(0, 0.5, 0)
  const count = placements.length
  const delay = new Float32Array(count)
  const tone = new Float32Array(count)
  placements.forEach((p, i) => { delay[i] = p.delay; tone[i] = p.tone })
  geo.setAttribute('aDelay', new InstancedBufferAttribute(delay, 1))
  geo.setAttribute('aTone', new InstancedBufferAttribute(tone, 1))

  const mat = new ShaderMaterial({
    uniforms: { ...uniforms, uTime: u.uTime, uAccent: u.uAccent, uFogColor: u.uFogColor, uFogDensity: u.uFogDensity },
    vertexShader: /* glsl */ `
      attribute float aDelay;
      attribute float aTone;
      uniform float uRise;
      varying vec3 vWorld;
      varying float vTop;
      varying float vTone;
      varying float vH;
      varying float vFace;
      varying vec2 vRoof;
      void main() {
        vRoof = position.xz;
        float r = clamp((uRise - aDelay) / 0.35, 0.0, 1.0);
        r = r * r * (3.0 - 2.0 * r);
        vec3 p = position;
        p.y = p.y * r - (1.0 - r) * 0.05; // fully sunk below the floor until it rises
        vec4 local = instanceMatrix * vec4(p, 1.0);
        vH = local.y;
        vec4 w = modelMatrix * local;
        vWorld = w.xyz;
        vTop = step(0.5, normal.y);
        vTone = aTone * r;
        vFace = position.x + position.z;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uAccent;
      varying vec3 vWorld;
      varying float vTop;
      varying float vTone;
      varying float vH;
      varying float vFace;
      varying vec2 vRoof;
      ${FOG}
      void main() {
        float d = distance(cameraPosition, vWorld);
        float floors = step(0.8, fract(vH * 0.55));
        float columns = step(0.38, fract(vFace * 3.0 + 0.5));
        float side = 1.0 - vTop;
        // roofs: a dim fill with a bright neon rim, so aerial shots don't flood the screen
        float rim = smoothstep(0.4, 0.49, max(abs(vRoof.x), abs(vRoof.y)));
        vec3 col = vec3(0.016, 0.022, 0.04);
        col += uAccent * floors * columns * side * 0.24 * vTone;
        col += uAccent * vTop * (0.12 + rim * 1.5) * vTone;
        col += uAccent * 0.12 * exp(-vH * 0.6) * side * vTone;
        col = mix(col, uFogColor, fogFactor(d));
        gl_FragColor = vec4(col, 1.0);
      }`,
  })

  const object = new InstancedMesh(geo, mat, count)
  const m = new Matrix4()
  const q = new Quaternion()
  placements.forEach((p, i) => {
    m.compose(new Vector3(p.x, 0, p.z), q, new Vector3(p.w, p.h, p.d))
    object.setMatrixAt(i, m)
  })
  object.instanceMatrix.needsUpdate = true
  object.frustumCulled = false
  return { object, uniforms }
}

function smooth(x, a, b) {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}
