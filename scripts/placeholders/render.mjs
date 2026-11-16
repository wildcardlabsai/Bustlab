// Renders BUSTLAB placeholder imagery (original 3D bust designs) to public/images.
// Usage: node scripts/placeholders/render.mjs [filterSubstring]
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
const require = createRequire(import.meta.url)
const { chromium } = require(require.resolve('playwright', { paths: [process.cwd(), execSync('npm root -g').toString().trim()] }))
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { shots } from './shots.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = join(root, 'public/images')
const filter = process.argv[2]

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage()
page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()) })
page.on('pageerror', (e) => console.error('[pageerror]', e.message))
await page.route('http://render.local/**', async (route) => {
  const url = new URL(route.request().url())
  let file
  if (url.pathname === '/') {
    return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><body style="margin:0;background:#000"><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><script type="module" src="/scene.js"></script></body></html>` })
  }
  if (url.pathname === '/scene.js') file = join(root, 'scripts/placeholders/scene.js')
  else file = join(root, 'node_modules', url.pathname)
  route.fulfill({ contentType: 'application/javascript', body: await readFile(file, 'utf8') })
})
await page.goto('http://render.local/')
await page.waitForFunction(() => window.sceneReady === true)

for (const shot of shots) {
  if (filter && !shot.name.includes(filter)) continue
  const sizes = shot.sizes ?? [shot.spec.width]
  for (const w of sizes) {
    const scale = w / shot.spec.width
    const spec = { ...shot.spec, width: Math.round(shot.spec.width * scale), height: Math.round(shot.spec.height * scale) }
    const t0 = Date.now()
    const dataUrl = await page.evaluate((s) => window.renderShot(s), spec)
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
    const name = sizes.length > 1 ? `${shot.name}-${w}.webp` : `${shot.name}.webp`
    const out = join(outDir, name)
    await mkdir(dirname(out), { recursive: true })
    await writeFile(out, buf)
    console.log(`${name}  ${(buf.length / 1024).toFixed(0)}KB  ${Date.now() - t0}ms`)
  }
}
await browser.close()
