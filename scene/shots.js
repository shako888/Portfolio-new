/*
   SHOT LIST — the film's camera keyframes.
   Each key is anchored to a section's scroll position ("top top") plus an
   offset in viewport heights, so shots stay locked to the content even when
   the pinned Builds section changes length. `sec: 'end'` means the bottom of the page.

   cam / look : camera position and look-at target (world units)
   fov        : lens
   exp        : exposure (lower = darker, for text-heavy sections)
   brk        : core → network break-apart (0..1)
   rise       : city towers rising out of the grid (0..1)
   col        : final collapse into a single point of light (0..1)
   hue        : accent colour, 0 = cyan, 1 = violet
   flare      : certificate node clusters glowing (0..1)
   lb         : letterbox bars (0..1)
*/

export const CORE = [0, 8, -60]

export const KEYS = [
  // SC.01 — Cold open: low and wide on the horizon
  // (look-at sits left of the core so it frames in the right third, clear of the headline)
  { sec: 'hero', vh: 0, cam: [0, 3, 42], look: [-27, 10, -60], fov: 36, exp: 1.0, brk: 0, rise: 0, col: 0, hue: 0, flare: 0, lb: 1 },
  { sec: 'about', vh: -0.6, cam: [0, 6, -8], look: [-6, 8, -60], fov: 44, exp: 1.0, brk: 0.05, rise: 0, col: 0, hue: 0, flare: 0, lb: 1 },

  // SC.02 — Push-in: through the core as it breaks into a network
  { sec: 'about', vh: 0, cam: [0, 8, -47], look: [0, 8, -60], fov: 55, exp: 0.85, brk: 0.4, rise: 0, col: 0, hue: 0, flare: 0, lb: 0 },
  { sec: 'about', vh: 0.9, cam: [5, 9, -63], look: [-4, 7, -80], fov: 62, exp: 0.7, brk: 1, rise: 0, col: 0, hue: 0.1, flare: 0, lb: 0 },

  // SC.03 — Orbit: arc around the network, two clusters flare
  { sec: 'certs', vh: 0, cam: [38, 17, -36], look: [0, 8, -60], fov: 45, exp: 0.6, brk: 1, rise: 0, col: 0, hue: 1, flare: 1, lb: 0 },
  { sec: 'certs', vh: 0.6, cam: [36, 12, -92], look: [0, 8, -60], fov: 45, exp: 0.6, brk: 1, rise: 0.1, col: 0, hue: 1, flare: 1, lb: 0 },

  // SC.04 — The avenue: drop to street level, towers rise, track down the avenue
  // (Builds pins for one screen per card + 1, i.e. 6 screens for the 5 featured builds)
  { sec: 'builds', vh: 0, cam: [0, 3, -102], look: [0, 5, -150], fov: 52, exp: 0.95, brk: 1, rise: 0.35, col: 0, hue: 0.3, flare: 0, lb: 0, ease: 'power2.inOut' },
  { sec: 'builds', vh: 1.5, cam: [-3, 2.6, -138], look: [1, 6, -185], fov: 52, exp: 0.95, brk: 1, rise: 0.8, col: 0, hue: 0.2, flare: 0, lb: 0, ease: 'none' },
  { sec: 'builds', vh: 3, cam: [3, 3.2, -172], look: [-1, 7, -220], fov: 52, exp: 0.95, brk: 1, rise: 1, col: 0, hue: 0.45, flare: 0, lb: 0, ease: 'none' },
  { sec: 'builds', vh: 4.5, cam: [-2, 5, -206], look: [0, 8, -250], fov: 52, exp: 0.95, brk: 1, rise: 1, col: 0, hue: 0.7, flare: 0, lb: 0, ease: 'none' },
  { sec: 'builds', vh: 6, cam: [0, 14, -236], look: [0, 5, -285], fov: 52, exp: 0.9, brk: 1, rise: 1, col: 0, hue: 0.5, flare: 0, lb: 0 },

  // SC.05 — Aerial: crane up over the city
  { sec: 'gallery', vh: 0, cam: [0, 112, -168], look: [0, 0, -186], fov: 50, exp: 0.42, brk: 1, rise: 1, col: 0, hue: 0.35, flare: 0, lb: 0 },
  { sec: 'gallery', vh: 0.9, cam: [24, 96, -206], look: [0, 0, -190], fov: 50, exp: 0.42, brk: 1, rise: 1, col: 0, hue: 0.5, flare: 0, lb: 0 },

  // SC.06 — Night watch: low drift, dark so the terminal reads
  { sec: 'experience', vh: 0, cam: [-42, 26, -148], look: [0, 10, -190], fov: 48, exp: 0.38, brk: 1, rise: 1, col: 0, hue: 0.15, flare: 0, lb: 0 },
  { sec: 'experience', vh: 0.25, cam: [-34, 22, -128], look: [0, 10, -175], fov: 48, exp: 0.38, brk: 1, rise: 1, col: 0, hue: 0, flare: 0, lb: 0 },

  // SC.07 — Pull-back: the world collapses into a single point of light.
  // The last key is pinned to the end of the page ('end'), since Contact is the final, short section.
  { sec: 'contact', vh: -0.5, cam: [0, 40, 30], look: [0, 8, -60], fov: 45, exp: 0.85, brk: 1, rise: 1, col: 0.1, hue: 0, flare: 0, lb: 0.3 },
  // (look-at sits below-left of the core so the last light lands upper-right, clear of the centred contact copy)
  { sec: 'end', vh: 0, cam: [0, 62, 170], look: [-80, -30, -60], fov: 40, exp: 1.0, brk: 1, rise: 1, col: 1, hue: 0, flare: 0, lb: 1 },
]

export const SECTIONS = ['hero', 'about', 'certs', 'builds', 'gallery', 'experience', 'contact']

/* Flattens a key into the rig's scalar fields (GSAP tweens plain numbers). */
export function pose(k) {
  return {
    cx: k.cam[0], cy: k.cam[1], cz: k.cam[2],
    tx: k.look[0], ty: k.look[1], tz: k.look[2],
    fov: k.fov, exp: k.exp, brk: k.brk, rise: k.rise,
    col: k.col, hue: k.hue, flare: k.flare, lb: k.lb,
  }
}
