// Browser-side three.js scene used to render BUSTLAB placeholder imagery.
// All bust designs here are original, built from primitives. Loaded by render.mjs.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)

/* ---------------- materials ---------------- */

function noiseTexture(size = 256, amount = 40) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const img = g.createImageData(size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * amount
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(6, 6)
  return t
}
const resinBump = noiseTexture()

const PALETTES = {
  // Painted inspiration palettes (role -> [color, roughness, metalness])
  vanguard: { primary: [0x2f4a6b, 0.45, 0.3], secondary: [0xd8d2c4, 0.5, 0.1], metal: [0x9aa0a8, 0.3, 0.9], accent: [0xff7a1a, 0.4, 0.1], visor: [0x0e1a22, 0.15, 0.6], skin: [0xc49a7c, 0.6, 0], base: [0x161616, 0.5, 0.2] },
  thornhorn: { primary: [0x6e1414, 0.55, 0.1], secondary: [0x2a1a14, 0.7, 0.0], metal: [0x7a6a4a, 0.35, 0.8], accent: [0xffb02e, 0.3, 0.1], visor: [0xffb02e, 0.3, 0.1], skin: [0x8a2a1c, 0.55, 0], horn: [0xd9cbb0, 0.5, 0], base: [0x161616, 0.5, 0.2] },
  diver: { primary: [0xb8862f, 0.35, 0.85], secondary: [0x2c4d4a, 0.5, 0.2], metal: [0x8e9196, 0.3, 0.9], accent: [0x5ff0ff, 0.2, 0.1], visor: [0x0b2a33, 0.1, 0.5], skin: [0x2c4d4a, 0.6, 0], base: [0x161616, 0.5, 0.2] },
  warden: { primary: [0x5a5f66, 0.35, 0.85], secondary: [0x5b1f2a, 0.6, 0.0], metal: [0xb08d3c, 0.3, 0.9], accent: [0xb08d3c, 0.3, 0.9], visor: [0x0a0a0a, 0.5, 0], skin: [0x5a5f66, 0.35, 0.85], base: [0x161616, 0.5, 0.2] },
  basecoat: { primary: [0x34506e, 0.9, 0], secondary: [0xcfc8b8, 0.9, 0], metal: [0x7d8187, 0.9, 0], accent: [0xd8661e, 0.9, 0], visor: [0x1a2630, 0.9, 0], skin: [0xb88f73, 0.9, 0], base: [0x161616, 0.5, 0.2] },
}

function materialFactory(paint) {
  const cache = new Map()
  return (role) => {
    const key = role
    if (cache.has(key)) return cache.get(key)
    let m
    if (role === 'glow') {
      m = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xa100ff, emissiveIntensity: 6 })
    } else if (role === 'pedestal') {
      m = new THREE.MeshStandardMaterial({ color: 0x0c0c10, roughness: 0.22, metalness: 0.65 })
    } else if (paint === 'unpainted') {
      m = new THREE.MeshStandardMaterial({ color: role === 'base' ? 0x7d8086 : 0x8b8e94, roughness: 0.6, metalness: 0, bumpMap: resinBump, bumpScale: 0.6 })
    } else if (paint === 'primed') {
      m = new THREE.MeshStandardMaterial({ color: 0x232327, roughness: 0.92, metalness: 0, bumpMap: resinBump, bumpScale: 0.4 })
    } else {
      const pal = PALETTES[paint]
      const [color, roughness, metalness] = pal[role] || pal.primary
      m = new THREE.MeshStandardMaterial({ color, roughness, metalness, bumpMap: resinBump, bumpScale: 0.3 })
      if (role === 'accent' && paint === 'diver') { m.emissive = new THREE.Color(0x5ff0ff); m.emissiveIntensity = 0.6 }
    }
    m.side = THREE.DoubleSide
    cache.set(key, m)
    return m
  }
}

/* ---------------- builder context ---------------- */

function builder(group, mat) {
  const add = (geo, role, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) => {
    const mesh = new THREE.Mesh(geo, mat(role))
    mesh.position.set(...p)
    mesh.rotation.set(...r)
    mesh.scale.set(...s)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  }
  const sphere = (r, seg = 64, opts = {}) =>
    new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75), opts.phiStart ?? 0, opts.phiLength ?? Math.PI * 2, opts.thetaStart ?? 0, opts.thetaLength ?? Math.PI)
  const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg)
  const rbox = (w, h, d, rad = 0.04) => new RoundedBoxGeometry(w, h, d, 4, rad)
  const cyl = (rt, rb, h, seg = 48) => new THREE.CylinderGeometry(rt, rb, h, seg)
  const cone = (r, h, seg = 32) => new THREE.ConeGeometry(r, h, seg)
  const torus = (R, t, arc = Math.PI * 2) => new THREE.TorusGeometry(R, t, 24, 96, arc)

  // Tapered tube along a curve (horns, tusks, hoses)
  const taper = (points, r0, r1, role, closed = true) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => V(...p)))
    const tubular = 64, radial = 20
    const geo = new THREE.TubeGeometry(curve, tubular, 1, radial, false)
    const pos = geo.attributes.position
    const P = new THREE.Vector3(), Q = new THREE.Vector3()
    for (let k = 0; k < pos.count; k++) {
      const i = Math.floor(k / (radial + 1))
      const t = i / tubular
      curve.getPointAt(t, P)
      Q.fromBufferAttribute(pos, k).sub(P).multiplyScalar(r0 + (r1 - r0) * Math.pow(t, 0.9))
      pos.setXYZ(k, P.x + Q.x, P.y + Q.y, P.z + Q.z)
    }
    geo.computeVertexNormals()
    add(geo, role)
    if (closed) add(sphere(r1 * 1.02, 16), role, { p: curve.getPointAt(1).toArray() })
    add(sphere(r0 * 1.0, 24), role, { p: curve.getPointAt(0).toArray() })
  }
  return { add, sphere, lathe, rbox, cyl, cone, torus, taper }
}

/* ---------------- shared anatomy ---------------- */

function torso(b, { width = 1, collar = true } = {}) {
  const w = width
  // chest / shoulders: lathe profile flattened front-to-back, then pectoral + back masses
  b.add(
    b.lathe([
      [0, 0], [0.62 * w, 0], [0.7 * w, 0.06], [0.82 * w, 0.3], [0.96 * w, 0.58], [1.0 * w, 0.74],
      [0.9 * w, 0.9], [0.62 * w, 1.0], [0.4, 1.06], [0.28, 1.1], [0, 1.1],
    ]),
    'secondary',
    { s: [1, 1, 0.55] },
  )
  for (const s of [1, -1]) {
    b.add(b.sphere(0.36, 48), 'secondary', { p: [s * 0.3 * w, 0.62, 0.22], s: [1.15, 0.85, 0.65], r: [0, 0, s * 0.2] })
    b.add(b.sphere(0.3, 32), 'secondary', { p: [s * 0.62 * w, 0.82, 0], s: [1.1, 0.75, 0.9] })
  }
  // socle
  b.add(b.lathe([[0, -0.52], [0.52, -0.52], [0.52, -0.45], [0.44, -0.41], [0.26, -0.18], [0.3, -0.06], [0.44, -0.02], [0.44, 0], [0, 0]]), 'base')
  // neck
  b.add(b.cyl(0.24, 0.3, 0.62), 'skin', { p: [0, 1.32, 0] })
  if (collar) b.add(b.torus(0.32, 0.055), 'metal', { p: [0, 1.1, 0], r: [Math.PI / 2, 0, 0] })
}

function pauldron(b, side, { y = 0.86, size = 0.42, layers = 3, spikes = 0 } = {}) {
  const x = side * 0.82
  for (let i = 0; i < layers; i++) {
    const s = size * (1 - i * 0.16)
    b.add(b.sphere(s, 48, { thetaLength: Math.PI * 0.55 }), i === 0 ? 'primary' : 'metal', {
      p: [x + side * i * 0.07, y - i * 0.12, 0],
      r: [0, 0, -side * (0.35 + i * 0.12)],
      s: [1.15, 0.8, 0.95],
    })
  }
  for (let i = 0; i < spikes; i++) {
    const a = (i - (spikes - 1) / 2) * 0.35
    b.add(b.cone(0.07, 0.38), 'metal', { p: [x + side * 0.12, y + 0.3, a * 0.6], r: [a, 0, -side * 0.5] })
  }
}

/* ---------------- original bust designs ---------------- */

const MODELS = {
  // Sci-fi armoured helmet with visor band
  vanguard(b) {
    torso(b)
    b.add(b.rbox(1.1, 0.7, 0.32, 0.12), 'primary', { p: [0, 0.6, 0.42], r: [-0.12, 0, 0] })
    b.add(b.rbox(0.5, 0.18, 0.1, 0.04), 'accent', { p: [0, 0.7, 0.6], r: [-0.12, 0, 0] })
    pauldron(b, 1, { layers: 2 }); pauldron(b, -1, { layers: 2 })
    const hy = 1.85
    b.add(b.sphere(0.56), 'primary', { p: [0, hy, 0], s: [1, 1.08, 1.06] })
    b.add(b.sphere(0.6, 64, { phiStart: Math.PI * 0.14, phiLength: Math.PI * 0.72, thetaStart: Math.PI * 0.38, thetaLength: Math.PI * 0.15 }), 'visor', { p: [0, hy, 0], s: [1, 1.08, 1.06] })
    b.add(b.torus(0.6, 0.022, Math.PI * 0.72), 'metal', { p: [0, hy + 0.17, 0], r: [Math.PI / 2, 0, Math.PI * 0.14], s: [1, 1.06, 1] })
    b.add(b.torus(0.6, 0.022, Math.PI * 0.72), 'metal', { p: [0, hy - 0.06, 0], r: [Math.PI / 2, 0, Math.PI * 0.14], s: [1, 1.06, 1] })
    b.add(b.rbox(0.07, 0.5, 1.15, 0.03), 'metal', { p: [0, hy + 0.48, -0.05], r: [0.15, 0, 0] })
    for (const s of [1, -1]) {
      b.add(b.cyl(0.17, 0.2, 0.14), 'metal', { p: [s * 0.56, hy - 0.02, 0], r: [0, 0, Math.PI / 2] })
      b.add(b.cyl(0.05, 0.05, 0.42), 'accent', { p: [s * 0.62, hy + 0.25, -0.12], r: [-0.4, 0, 0] })
    }
    b.add(b.rbox(0.46, 0.28, 0.3, 0.1), 'secondary', { p: [0, hy - 0.5, 0.32], r: [0.3, 0, 0] })
    for (let i = 0; i < 3; i++) b.add(b.rbox(0.36, 0.035, 0.06, 0.015), 'metal', { p: [0, hy - 0.44 - i * 0.07, 0.48 - i * 0.02], r: [0.3, 0, 0] })
  },

  // Synthetic android with segmented neck
  android(b) {
    torso(b, { collar: false })
    for (let i = 0; i < 5; i++) b.add(b.torus(0.27, 0.045), 'metal', { p: [0, 1.15 + i * 0.09, 0], r: [Math.PI / 2, 0, 0] })
    b.add(b.rbox(0.9, 0.12, 0.28, 0.05), 'metal', { p: [0, 0.82, 0.38], r: [-0.3, 0, 0] })
    for (const s of [1, -1]) b.add(b.rbox(0.5, 0.9, 0.12, 0.05), 'primary', { p: [s * 0.5, 0.5, 0.48], r: [-0.18, s * 0.25, s * 0.12] })
    const hy = 1.92
    b.add(b.sphere(0.5), 'skin', { p: [0, hy, 0], s: [0.9, 1.18, 1.0] })
    b.add(b.sphere(0.515, 64, { phiStart: Math.PI * 0.2, phiLength: Math.PI * 0.6, thetaStart: 0.15, thetaLength: Math.PI * 0.5 }), 'primary', { p: [0, hy, 0], s: [0.9, 1.18, 1.0] })
    b.add(b.rbox(0.62, 0.06, 0.1, 0.02), 'visor', { p: [0, hy + 0.02, 0.44] })
    for (const s of [1, -1]) {
      b.add(b.rbox(0.05, 0.42, 0.34, 0.02), 'metal', { p: [s * 0.45, hy + 0.05, -0.05] })
      b.add(b.rbox(0.03, 0.5, 0.3, 0.015), 'accent', { p: [s * 0.18, hy + 0.55, -0.25], r: [-0.5, 0, s * 0.2] })
    }
    b.add(b.rbox(0.18, 0.06, 0.08, 0.02), 'metal', { p: [0, hy - 0.32, 0.42] })
  },

  // Fantasy great-helm knight
  warden(b) {
    torso(b, { width: 1.05 })
    b.add(b.rbox(1.15, 0.8, 0.3, 0.12), 'primary', { p: [0, 0.55, 0.44], r: [-0.1, 0, 0] })
    b.add(b.cone(0.16, 0.5, 4), 'accent', { p: [0, 0.6, 0.62], r: [Math.PI / 2 - 0.1, Math.PI / 4, 0], s: [1, 1, 0.3] })
    pauldron(b, 1, { layers: 4, size: 0.56 }); pauldron(b, -1, { layers: 4, size: 0.56 })
    const hy = 1.86
    b.add(b.cyl(0.5, 0.54, 0.78), 'primary', { p: [0, hy - 0.06, 0] })
    b.add(b.sphere(0.5, 64, { thetaLength: Math.PI / 2 }), 'primary', { p: [0, hy + 0.33, 0], s: [1, 0.6, 1] })
    b.add(b.rbox(1.08, 0.08, 0.12, 0.03), 'metal', { p: [0, hy + 0.12, 0.47] })
    b.add(b.rbox(1.08, 0.06, 0.12, 0.03), 'metal', { p: [0, hy - 0.0, 0.48] })
    b.add(b.rbox(0.1, 0.62, 0.1, 0.03), 'metal', { p: [0, hy - 0.08, 0.53] })
    b.add(b.rbox(0.07, 0.95, 1.1, 0.03), 'accent', { p: [0, hy + 0.38, 0], r: [0, 0, 0] })
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      for (const s of [1, -1]) b.add(b.cyl(0.022, 0.022, 0.06, 12), 'visor', { p: [s * (0.17 + c * 0.07), hy - 0.22 - r * 0.08, 0.5 - c * 0.025], r: [Math.PI / 2, 0, 0] })
    }
    b.add(b.cone(0.07, 0.32), 'accent', { p: [0, hy + 0.7, 0] })
  },

  // Horned demon — horror & dark art
  thornhorn(b) {
    torso(b, { width: 1.08, collar: false })
    pauldron(b, 1, { layers: 1, size: 0.55, spikes: 3 }); pauldron(b, -1, { layers: 1, size: 0.55, spikes: 3 })
    for (let i = 0; i < 5; i++) b.add(b.rbox(0.42 - i * 0.04, 0.09, 0.14, 0.04), 'skin', { p: [0, 0.3 + i * 0.13, 0.55 - i * 0.015], r: [-0.12, 0, 0] })
    const hy = 1.82
    b.add(b.sphere(0.52), 'skin', { p: [0, hy, 0], s: [1, 1.12, 1.02] })
    b.add(b.rbox(0.82, 0.16, 0.3, 0.07), 'skin', { p: [0, hy + 0.14, 0.32], r: [0.25, 0, 0] })
    b.add(b.rbox(0.55, 0.36, 0.4, 0.14), 'skin', { p: [0, hy - 0.38, 0.22] })
    for (const s of [1, -1]) {
      b.taper([[s * 0.38, hy + 0.32, 0.05], [s * 0.85, hy + 0.55, -0.1], [s * 1.0, hy + 1.0, -0.25], [s * 0.82, hy + 1.35, -0.1]], 0.16, 0.025, 'horn')
      b.add(b.sphere(0.06, 24), 'visor', { p: [s * 0.18, hy + 0.04, 0.47] })
      b.add(b.cone(0.035, 0.16), 'horn', { p: [s * 0.14, hy - 0.42, 0.44], r: [Math.PI, 0, 0] })
      for (let i = 0; i < 3; i++) b.add(b.cone(0.05, 0.22), 'horn', { p: [s * 0.2, hy + 0.5 - i * 0.12, -0.42], r: [-1.2, 0, s * 0.6] })
    }
    for (let i = 0; i < 5; i++) b.add(b.cone(0.05 - i * 0.004, 0.3 - i * 0.03), 'horn', { p: [0, hy + 0.58 - i * 0.18, -0.25 - i * 0.12], r: [-0.8 - i * 0.25, 0, 0] })
  },

  // Hooded gothic figure with skull face
  revenant(b) {
    torso(b, { width: 1.06, collar: false })
    for (let i = -3; i <= 3; i++) b.add(b.cone(0.16, 1.0, 16), 'secondary', { p: [i * 0.28, 0.48, 0.3 + (3 - Math.abs(i)) * 0.03], r: [-0.18, 0, i * 0.05], s: [1, 1, 0.6] })
    b.add(b.torus(0.12, 0.035), 'metal', { p: [0, 1.02, 0.46], r: [0.2, 0, 0] })
    const hy = 1.86
    b.add(b.sphere(0.72, 64, { phiStart: Math.PI * 0.82, phiLength: Math.PI * 1.36 }), 'secondary', { p: [0, hy + 0.05, -0.05], s: [0.95, 1.18, 1.0], r: [0.12, 0, 0] })
    b.add(b.cone(0.3, 0.6, 32), 'secondary', { p: [0, hy + 0.85, -0.38], r: [-0.9, 0, 0] })
    b.add(b.sphere(0.4), 'skin', { p: [0, hy + 0.02, 0.12], s: [0.9, 1.05, 0.95] })
    for (const s of [1, -1]) {
      b.add(b.sphere(0.1, 24), 'visor', { p: [s * 0.14, hy + 0.06, 0.44] })
      b.add(b.rbox(0.07, 0.22, 0.1, 0.03), 'skin', { p: [s * 0.27, hy - 0.08, 0.36], r: [0, s * 0.4, 0] })
    }
    b.add(b.cone(0.05, 0.1, 3), 'visor', { p: [0, hy - 0.08, 0.5], r: [Math.PI, 0, 0] })
    for (let i = -3; i <= 3; i++) b.add(b.rbox(0.045, 0.08, 0.05, 0.015), 'skin', { p: [i * 0.055, hy - 0.26, 0.42 - Math.abs(i) * 0.01] })
  },

  // Masked ronin — original character
  ronin(b) {
    torso(b)
    pauldron(b, 1, { layers: 4, size: 0.44 }); pauldron(b, -1, { layers: 4, size: 0.44 })
    b.add(b.rbox(1.0, 0.5, 0.2, 0.08), 'primary', { p: [0, 0.6, 0.48], r: [-0.12, 0, 0] })
    for (let i = 0; i < 4; i++) b.add(b.rbox(0.9, 0.025, 0.04, 0.01), 'metal', { p: [0, 0.44 + i * 0.1, 0.59 - i * 0.012], r: [-0.12, 0, 0] })
    const hy = 1.86
    b.add(b.sphere(0.48), 'skin', { p: [0, hy, 0], s: [0.95, 1.1, 1.02] })
    b.add(b.sphere(0.5, 64, { phiStart: Math.PI * 0.1, phiLength: Math.PI * 0.8, thetaStart: Math.PI * 0.38, thetaLength: Math.PI * 0.42 }), 'secondary', { p: [0, hy, 0.02], s: [0.98, 1.12, 1.08] })
    for (let i = 0; i < 3; i++) b.add(b.rbox(0.34 - i * 0.04, 0.025, 0.04, 0.01), 'metal', { p: [0, hy - 0.22 - i * 0.07, 0.5 - i * 0.02] })
    b.add(b.torus(0.47, 0.05), 'accent', { p: [0, hy + 0.18, 0], r: [Math.PI / 2 + 0.12, 0, 0], s: [0.98, 1.06, 1] })
    for (const s of [1, -1]) b.add(b.rbox(0.08, 0.5, 0.03, 0.015), 'accent', { p: [s * 0.08, hy + 0.0, -0.55], r: [0.35, 0, s * 0.3] })
    b.add(b.sphere(0.16, 32), 'skin', { p: [0, hy + 0.56, -0.12] })
    b.add(b.torus(0.12, 0.04), 'accent', { p: [0, hy + 0.5, -0.12], r: [Math.PI / 2, 0, 0] })
    for (const s of [1, -1]) b.add(b.rbox(0.18, 0.03, 0.06, 0.015), 'visor', { p: [s * 0.17, hy + 0.03, 0.46], r: [0, s * 0.2, s * 0.15] })
  },

  // Winged-helm champion — superhero-inspired original
  paragon(b) {
    torso(b, { width: 1.1, collar: false })
    b.add(b.lathe([[0.0, 0], [0.5, 0], [0.72, 0.5], [0.78, 1.0], [0.0, 1.0]], 64), 'accent', { p: [0, 0.9, -0.3], s: [1.15, 0.9, 0.45] })
    const em = new THREE.Shape()
    em.moveTo(0, 0.28); em.lineTo(0.3, 0.05); em.lineTo(0.16, -0.24); em.lineTo(0, -0.08); em.lineTo(-0.16, -0.24); em.lineTo(-0.3, 0.05); em.closePath()
    b.add(new THREE.ExtrudeGeometry(em, { depth: 0.06, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3 }), 'accent', { p: [0, 0.62, 0.6], r: [-0.12, 0, 0] })
    for (const s of [1, -1]) b.add(b.sphere(0.36, 48), 'primary', { p: [s * 0.36, 0.62, 0.3], s: [1, 0.8, 0.6] })
    const hy = 1.9
    b.add(b.sphere(0.48), 'skin', { p: [0, hy, 0], s: [0.92, 1.14, 1.0] })
    b.add(b.rbox(0.42, 0.3, 0.42, 0.14), 'skin', { p: [0, hy - 0.38, 0.1] })
    b.add(b.sphere(0.5, 64, { thetaLength: Math.PI * 0.5 }), 'primary', { p: [0, hy + 0.02, 0], s: [0.95, 1.2, 1.04] })
    b.add(b.sphere(0.505, 64, { phiStart: Math.PI * 0.12, phiLength: Math.PI * 0.76, thetaStart: Math.PI * 0.42, thetaLength: Math.PI * 0.12 }), 'primary', { p: [0, hy, 0], s: [0.95, 1.2, 1.04] })
    b.add(b.sphere(0.51, 64, { phiStart: Math.PI * 0.18, phiLength: Math.PI * 0.64, thetaStart: Math.PI * 0.36, thetaLength: Math.PI * 0.1 }), 'accent', { p: [0, hy, 0], s: [0.97, 1.22, 1.08] })
    b.add(b.rbox(0.1, 0.3, 0.12, 0.04), 'skin', { p: [0, hy - 0.08, 0.47], r: [-0.2, 0, 0] })
    for (const s of [1, -1]) {
      b.add(b.rbox(0.16, 0.035, 0.05, 0.015), 'visor', { p: [s * 0.16, hy + 0.06, 0.52], r: [0, s * 0.3, -s * 0.2] })
      for (let i = 0; i < 3; i++) {
        const wing = new THREE.Shape()
        wing.moveTo(0, 0); wing.quadraticCurveTo(0.25, 0.3, 0.6 - i * 0.1, 0.62 - i * 0.12); wing.quadraticCurveTo(0.2, 0.2, 0.05, -0.1); wing.closePath()
        b.add(new THREE.ExtrudeGeometry(wing, { depth: 0.03, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 }), 'metal', { p: [s * 0.44, hy + 0.1 - i * 0.07, -0.05 - i * 0.06], r: [0, -Math.PI / 2, 0], s: [0.8, 0.8, s] })
      }
    }
  },

  // Tusked warchief — gaming & fantasy
  warchief(b) {
    torso(b, { width: 1.12, collar: false })
    b.add(b.torus(0.62, 0.2), 'secondary', { p: [0, 1.0, 0], r: [Math.PI / 2, 0, 0], s: [1.05, 0.65, 1] })
    pauldron(b, 1, { layers: 2, size: 0.58, spikes: 3 }); pauldron(b, -1, { layers: 2, size: 0.58, spikes: 3 })
    b.add(b.rbox(0.9, 0.5, 0.22, 0.08), 'metal', { p: [0, 0.48, 0.5], r: [-0.12, 0, 0] })
    const hy = 1.84
    b.add(b.sphere(0.5), 'skin', { p: [0, hy, 0], s: [1.15, 1.05, 1.0] })
    b.add(b.rbox(0.78, 0.14, 0.28, 0.07), 'skin', { p: [0, hy + 0.1, 0.34], r: [0.2, 0, 0] })
    b.add(b.rbox(0.74, 0.42, 0.46, 0.16), 'skin', { p: [0, hy - 0.36, 0.2] })
    b.add(b.sphere(0.1, 24), 'skin', { p: [0, hy - 0.08, 0.5], s: [1.2, 0.9, 1] })
    for (const s of [1, -1]) {
      b.taper([[s * 0.2, hy - 0.42, 0.4], [s * 0.24, hy - 0.22, 0.5], [s * 0.3, hy - 0.06, 0.48]], 0.055, 0.015, 'horn')
      b.add(b.sphere(0.05, 16), 'visor', { p: [s * 0.18, hy + 0.0, 0.46] })
      b.add(b.cone(0.1, 0.36), 'skin', { p: [s * 0.6, hy + 0.05, -0.05], r: [0, 0, -s * 1.2], s: [0.5, 1, 1] })
    }
    for (let i = 0; i < 6; i++) b.add(b.cone(0.07, 0.3 - Math.abs(i - 2.5) * 0.03), 'accent', { p: [0, hy + 0.52 - (i > 2 ? (i - 2) * 0.05 : 0), 0.3 - i * 0.14], r: [-0.25 - i * 0.12, 0, 0] })
  },

  // Deep-sea style dive helmet — sci-fi
  diver(b) {
    torso(b, { collar: false })
    b.add(b.cyl(0.62, 0.7, 0.16), 'metal', { p: [0, 1.12, 0] })
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2
      b.add(b.sphere(0.035, 12), 'metal', { p: [Math.cos(a) * 0.66, 1.2, Math.sin(a) * 0.66] })
    }
    b.add(b.rbox(0.8, 0.55, 0.2, 0.08), 'secondary', { p: [0, 0.55, 0.46], r: [-0.1, 0, 0] })
    const hy = 1.82
    b.add(b.sphere(0.64), 'primary', { p: [0, hy, 0] })
    const port = (pos, rot, r) => {
      b.add(b.torus(r, 0.05), 'metal', { p: pos, r: rot })
      b.add(b.cyl(r, r, 0.04, 48), 'visor', { p: pos, r: [rot[0] + Math.PI / 2, rot[1], rot[2]] })
      for (let i = 0; i < 4; i++) b.add(b.rbox(r * 2, 0.03, 0.03, 0.01), 'metal', { p: pos, r: [rot[0], rot[1], (i * Math.PI) / 4] })
    }
    port([0, hy + 0.02, 0.62], [0, 0, 0], 0.27)
    port([0.58, hy + 0.02, 0.18], [0, Math.PI / 2 - 0.3, 0], 0.17)
    port([-0.58, hy + 0.02, 0.18], [0, -Math.PI / 2 + 0.3, 0], 0.17)
    b.add(b.cyl(0.14, 0.16, 0.2), 'metal', { p: [0, hy + 0.66, 0] })
    for (const s of [1, -1]) {
      b.taper([[s * 0.4, hy - 0.5, -0.3], [s * 0.85, hy - 0.2, -0.4], [s * 0.95, 0.9, -0.2], [s * 0.6, 0.55, 0.3]], 0.07, 0.07, 'secondary', false)
      b.add(b.cyl(0.08, 0.08, 0.14), 'accent', { p: [s * 0.32, hy - 0.42, 0.45], r: [Math.PI / 2, 0, 0] })
    }
  },

  // Crowned lich — dark fantasy
  lich(b) {
    torso(b, { collar: false })
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.15 + (i / 8) * 0.7)
      b.add(b.cone(0.09, 0.7, 4), 'metal', { p: [Math.cos(a) * 0.62, 1.4, -Math.sin(a) * 0.35], r: [-Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.6] })
    }
    b.add(b.rbox(0.18, 0.95, 0.14, 0.05), 'skin', { p: [0, 0.55, 0.5], r: [-0.1, 0, 0] })
    for (let i = 0; i < 5; i++) for (const s of [1, -1]) b.add(b.rbox(0.36 - i * 0.03, 0.05, 0.1, 0.02), 'skin', { p: [s * 0.25, 0.85 - i * 0.14, 0.48], r: [-0.1, 0, s * (0.25 + i * 0.04)] })
    const hy = 1.86
    b.add(b.sphere(0.46), 'skin', { p: [0, hy + 0.04, -0.02], s: [0.95, 1.05, 1.08] })
    b.add(b.rbox(0.42, 0.22, 0.34, 0.1), 'skin', { p: [0, hy - 0.36, 0.14] })
    for (const s of [1, -1]) {
      b.add(b.sphere(0.11, 24), 'visor', { p: [s * 0.15, hy + 0.02, 0.38] })
      b.add(b.rbox(0.12, 0.24, 0.12, 0.04), 'skin', { p: [s * 0.29, hy - 0.12, 0.28] })
    }
    b.add(b.cone(0.06, 0.12, 3), 'visor', { p: [0, hy - 0.14, 0.46], r: [Math.PI, 0, 0] })
    for (let i = -3; i <= 3; i++) b.add(b.rbox(0.045, 0.07, 0.05, 0.015), 'skin', { p: [i * 0.055, hy - 0.3, 0.33] })
    b.add(b.torus(0.42, 0.045), 'metal', { p: [0, hy + 0.32, -0.02], r: [Math.PI / 2 - 0.1, 0, 0] })
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2
      b.add(b.cone(0.05, i % 2 ? 0.26 : 0.42, 4), 'metal', { p: [Math.cos(a) * 0.42, hy + 0.48 + (i % 2 ? -0.08 : 0), Math.sin(a) * 0.42 - 0.02] })
    }
    b.add(b.sphere(0.06, 16), 'accent', { p: [0, hy + 0.4, 0.43] })
  },
}

/* ---------------- staging ---------------- */

function glowTexture(inner = '#3a0a66', outer = '#08080c') {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(256, 256, 10, 256, 256, 256)
  grd.addColorStop(0, inner)
  grd.addColorStop(0.55, '#140720')
  grd.addColorStop(1, outer)
  g.fillStyle = grd
  g.fillRect(0, 0, 512, 512)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function pedestal(group, mat) {
  const b = builder(group, mat)
  b.add(b.lathe([[0, 0], [1.5, 0], [1.5, 0.08], [1.38, 0.12], [1.25, 0.14], [1.2, 1.06], [1.32, 1.1], [1.38, 1.2], [0, 1.2]], 128), 'pedestal')
  b.add(b.torus(1.27, 0.012), 'glow', { p: [0, 1.1, 0], r: [Math.PI / 2, 0, 0] })
  b.add(b.torus(1.44, 0.01), 'glow', { p: [0, 0.1, 0], r: [Math.PI / 2, 0, 0] })
}

function workbench(scene, mat) {
  const g = new THREE.Group()
  scene.add(g)
  const b = builder(g, mat)
  const paints = [0xa100ff, 0xd8661e, 0x2f4a6b, 0xc8cbd2, 0x6e1414, 0x2c4d4a, 0xb8862f, 0x1a1a1a]
  paints.forEach((c, i) => {
    const x = -2.6 + (i % 4) * 0.5 + (i > 3 ? 0.25 : 0)
    const z = 0.9 + (i > 3 ? 0.55 : 0)
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.42, 32), new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.3 }))
    pot.position.set(x, 0.21, z); pot.castShadow = pot.receiveShadow = true; g.add(pot)
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.12, 32), new THREE.MeshStandardMaterial({ color: c, roughness: 0.45 }))
    cap.position.set(x, 0.48, z); cap.castShadow = true; g.add(cap)
  })
  const brush = (x, z, rot, len, tip) => {
    const bg = new THREE.Group()
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, len, 16), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 }))
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0xbfc3c8, roughness: 0.2, metalness: 1 }))
    f.position.y = len / 2 + 0.11
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 16), new THREE.MeshStandardMaterial({ color: tip, roughness: 0.8 }))
    t.position.y = len / 2 + 0.31
    bg.add(h, f, t)
    bg.traverse((o) => { o.castShadow = true })
    bg.rotation.set(Math.PI / 2, 0, rot)
    bg.position.set(x, 0.05, z)
    g.add(bg)
  }
  brush(1.6, 1.2, 0.5, 1.6, 0xa100ff)
  brush(1.9, 1.0, 0.65, 1.4, 0x222222)
  brush(2.2, 1.35, 0.4, 1.5, 0xd8661e)
  const palette = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.04, 64), new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.5 }))
  palette.position.set(2.2, 0.02, -0.2); palette.receiveShadow = true; g.add(palette)
  paints.slice(0, 5).forEach((c, i) => {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: c, roughness: 0.25 }))
    const a = (i / 5) * Math.PI * 2
    d.position.set(2.2 + Math.cos(a) * 0.4, 0.04, -0.2 + Math.sin(a) * 0.4); d.scale.y = 0.3; g.add(d)
  })
  // painting handle / grip
  b.add(b.cyl(0.42, 0.38, 0.9, 48), 'pedestal', { p: [0, 0.45, 0] })
  b.add(b.cyl(0.6, 0.6, 0.08, 48), 'pedestal', { p: [0, 0.94, 0] })
  void mat
}

window.renderShot = async function renderShot(spec) {
  const W = spec.width, H = spec.height
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.setPixelRatio(1)
  renderer.setSize(W, H)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = spec.exposure ?? 1.0
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  document.body.innerHTML = ''
  document.body.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x08080c)
  scene.fog = new THREE.Fog(0x08080c, spec.fogNear ?? 9, spec.fogFar ?? 22)
  const pm = new THREE.PMREMGenerator(renderer)
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = spec.envIntensity ?? 0.1

  // backdrop glow
  const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 22), new THREE.MeshBasicMaterial({ map: glowTexture(spec.glow ?? '#34095c'), toneMapped: false, fog: false }))
  back.position.set(spec.glowX ?? 0, 5, -9)
  scene.add(back)

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: spec.bench ? 0x15151b : 0x0b0b10, roughness: 0.35, metalness: 0.3 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const focus = V(...(spec.target ?? [0, 3, 0]))
  const spot = (color, intensity, pos, angle = 0.5, shadow = false) => {
    const l = new THREE.SpotLight(color, intensity, 0, angle, 0.7, 1.6)
    l.position.set(...pos)
    l.target.position.copy(focus)
    l.castShadow = shadow
    if (shadow) { l.shadow.mapSize.set(2048, 2048); l.shadow.bias = -0.0004; l.shadow.radius = 6 }
    scene.add(l, l.target)
    return l
  }
  spot(0xfff4ea, spec.key ?? 60, spec.keyPos ?? [-3.5, 7, 6], 0.55, true)
  spot(0xa100ff, spec.rim ?? 160, [-5, 5.5, -4], 0.6)
  spot(0xc000ff, (spec.rim ?? 160) * 0.8, [5, 5, -4], 0.6)
  spot(0xb9c2ff, spec.fill ?? 8, [5, 3, 6], 0.7)
  scene.add(new THREE.HemisphereLight(0x8890ff, 0x050508, 0.12))

  for (const item of spec.busts) {
    const holder = new THREE.Group()
    holder.position.set(item.x ?? 0, 0, item.z ?? 0)
    holder.rotation.y = item.rotY ?? 0
    holder.scale.setScalar(item.scale ?? 1)
    scene.add(holder)
    const mat = materialFactory(item.paint ?? 'unpainted')
    let baseY = 0
    if (item.pedestal !== false && !spec.bench) { pedestal(holder, mat); baseY = 1.2 + 0.52 }
    if (spec.bench) baseY = 0.98 + 0.52
    const bust = new THREE.Group()
    bust.position.y = baseY
    holder.add(bust)
    MODELS[item.model](builder(bust, mat))
  }
  if (spec.bench) workbench(scene, materialFactory('unpainted'))

  const camera = new THREE.PerspectiveCamera(spec.fov ?? 30, W / H, 0.1, 100)
  camera.position.set(...spec.camera)
  camera.lookAt(focus)

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), spec.bloom ?? 0.55, 0.5, 0.82))
  composer.addPass(new OutputPass())
  composer.render()
  const url = renderer.domElement.toDataURL('image/webp', 0.88)
  renderer.dispose()
  return url
}
window.sceneReady = true
