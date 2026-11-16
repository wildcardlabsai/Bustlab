// Shot list for placeholder imagery. All designs are original BUSTLAB placeholder sculpts.
const P = (model, extra = {}) => ({ model, ...extra })

export const PRODUCTS = [
  ['vanguard-mk-ii', 'vanguard'], ['nova-unit-07', 'android'], ['abyss-diver', 'diver'],
  ['iron-warden', 'warden'], ['tuskborn-warchief', 'warchief'],
  ['thornhorn', 'thornhorn'], ['the-revenant', 'revenant'], ['lich-sovereign', 'lich'],
  ['aegis-paragon', 'paragon'], ['masked-ronin', 'ronin'],
]

const productShots = ([slug, model]) => [
  { name: `products/${slug}-1`, sizes: [800, 1600], spec: { width: 1600, height: 2000, busts: [P(model, { rotY: -0.35 })], camera: [1.9, 3.9, 8.6], target: [0, 2.75, 0] } },
  { name: `products/${slug}-2`, sizes: [800, 1600], spec: { width: 1600, height: 2000, busts: [P(model, { rotY: 1.0 })], camera: [-1.4, 4.1, 8.2], target: [0, 2.85, 0], glowX: -3 } },
  { name: `products/${slug}-3`, sizes: [800, 1600], spec: { width: 1600, height: 2000, busts: [P(model, { rotY: -0.15 })], camera: [0.7, 3.9, 4.4], target: [0, 3.4, 0], key: 50 } },
]

const cover = (name, model, glow, rotY = -0.3) => ({
  name: `collections/${name}`, sizes: [600, 1200],
  spec: { width: 1200, height: 1500, busts: [P(model, { rotY })], camera: [1.4, 3.6, 7.4], target: [0, 3.0, 0], glow },
})

const step = (name, paint) => ({
  name: `ready-to-paint/${name}`, sizes: [600, 1200],
  spec: {
    width: 1200, height: 1500, busts: [P('vanguard', { rotY: -0.4, paint })], camera: [1.6, 3.7, 6.6], target: [0, 3.05, 0],
    ...(paint === 'unpainted' ? {} : { bloom: 0.18, rim: 70, key: 80, envIntensity: 0.35 }),
  },
})

const painted = (name, model, paint) => ({
  name: `painted/${name}`, sizes: [800, 1600],
  spec: { width: 1600, height: 2000, busts: [P(model, { rotY: -0.35, paint })], camera: [1.9, 3.9, 8.6], target: [0, 2.75, 0], bloom: 0.18, rim: 70, key: 80, envIntensity: 0.35 },
})

export const shots = [
  {
    name: 'hero/hero', sizes: [1200, 2400],
    spec: {
      width: 2400, height: 1350, fov: 28,
      busts: [P('thornhorn', { x: 0.6, z: -1.6, rotY: 0.1 }), P('vanguard', { x: 3.7, z: 0.6, rotY: -0.45 }), P('warden', { x: 6.9, z: -1.8, rotY: -0.7 })],
      camera: [1.2, 4.3, 12.8], target: [1.6, 2.9, -0.4], glow: '#3c0a6c', glowX: 5, fogFar: 32, key: 75, keyPos: [-1, 7, 7],
    },
  },
  {
    name: 'about/lineup', sizes: [1000, 2000],
    spec: {
      width: 2000, height: 1000, fov: 26,
      busts: ['lich', 'diver', 'ronin', 'warchief', 'android'].map((m, i) => P(m, { x: (i - 2) * 3.1, z: -Math.abs(i - 2) * 0.8, rotY: -(i - 2) * 0.18 })),
      camera: [0, 4.4, 17], target: [0, 2.7, -0.6], fogFar: 34,
    },
  },
  {
    name: 'og/og-image',
    spec: {
      width: 1200, height: 630, fov: 28,
      busts: [P('revenant', { x: -3.1, z: -1.4, rotY: 0.35 }), P('vanguard', { x: 0.2, z: 0.4, rotY: -0.25 }), P('diver', { x: 3.3, z: -1.6, rotY: -0.5 })],
      camera: [0.6, 4.2, 12.5], target: [0.2, 2.9, -0.4], glow: '#3c0a6c', fogFar: 30,
    },
  },
  cover('sci-fi-future', 'vanguard', '#2a0b5c'),
  cover('gaming-fantasy', 'warchief', '#3a0a55', -0.4),
  cover('horror-dark-art', 'thornhorn', '#3d0838'),
  cover('heroes-legends', 'paragon', '#2c0d60', -0.45),
  cover('original-creations', 'ronin', '#360a5c'),
  step('step-1-unpainted', 'unpainted'),
  step('step-2-primed', 'primed'),
  step('step-3-basecoat', 'basecoat'),
  step('step-4-finished', 'vanguard'),
  painted('vanguard-painted', 'vanguard', 'vanguard'),
  painted('thornhorn-painted', 'thornhorn', 'thornhorn'),
  painted('diver-painted', 'diver', 'diver'),
  painted('warden-painted', 'warden', 'warden'),
  {
    name: 'ready-to-paint/workbench', sizes: [1000, 2000],
    spec: { width: 2000, height: 1250, bench: true, fov: 32, busts: [P('vanguard', { rotY: -0.3, paint: 'primed', pedestal: false })], camera: [0.4, 5.6, 9.5], target: [0, 2.2, 0.4], key: 90, fogFar: 30 },
  },
  ...PRODUCTS.flatMap(productShots),
]
