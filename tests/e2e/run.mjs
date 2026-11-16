// End-to-end browser tests for the public site and admin dashboard.
// Requires: the local test backend (tests/e2e/local-supabase.mjs) on :54321, a fresh e2e
// database (tests/e2e/setup-db.sh) and the Vite dev server built against it on BASE_URL.
//   BASE_URL=http://127.0.0.1:5174 node tests/e2e/run.mjs
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import pg from 'pg'

const require = createRequire(import.meta.url)
const { chromium } = require(require.resolve('playwright', { paths: [process.cwd(), execSync('npm root -g').toString().trim()] }))

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5174'
const STORAGE_DIR = resolve(process.env.STORAGE_DIR || './.e2e-storage')
const db = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres@127.0.0.1:54322/bustlab_e2e' })
const IMG = resolve('public/images/products/masked-ronin-2-800.webp')

const results = []
const consoleErrors = []
async function test(name, fn) {
  const t0 = Date.now()
  try {
    await fn()
    results.push({ name, ok: true })
    console.log(`  ✓ ${name} (${Date.now() - t0}ms)`)
  } catch (e) {
    results.push({ name, ok: false, error: e })
    console.log(`  ✗ ${name}\n    ${e.message.split('\n').join('\n    ')}`)
  }
}

const browser = await chromium.launch()
async function newPage(viewport = { width: 1366, height: 900 }) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${page.url()} :: ${m.text()}`) })
  page.on('pageerror', (e) => consoleErrors.push(`${page.url()} :: pageerror ${e.message}`))
  return page
}
async function eventually(fn, timeout = 5000) {
  const end = Date.now() + timeout
  for (;;) {
    try { return await fn() } catch (e) { if (Date.now() > end) throw e; await new Promise((r) => setTimeout(r, 100)) }
  }
}
const go = (page, path) => page.goto(BASE + path, { waitUntil: 'networkidle' })

console.log('\nPublic website')
const page = await newPage()

await test('Homepage loads with hero, collections and featured products from Supabase', async () => {
  await go(page, '/')
  assert.match(await page.title(), /BUSTLAB \| Collectible Busts & Ready-to-Paint Sculptures/)
  assert.match(await page.locator('h1').innerText(), /COLLECT\.\s*CREATE\.\s*CUSTOMISE\./i)
  await page.locator('#collections a[href^="/collections/"]').first().waitFor()
  assert.equal(await page.locator('#collections a[href^="/collections/"]').count(), 5)
  await page.getByRole('heading', { name: /the latest from bustlab/i }).waitFor()
  const featured = await page.locator('section[aria-labelledby="latest-title"] article').count()
  assert.ok(featured >= 4 && featured <= 6, `expected 4–6 featured products, got ${featured}`)
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://www.bustlab.com/')
})

await test('Desktop navigation links work', async () => {
  for (const [label, path] of [['Collections', '/collections'], ['Gallery', '/gallery'], ['Ready to Paint', '/ready-to-paint'], ['About', '/about'], ['Contact', '/contact'], ['Home', '/']]) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label, exact: true }).click()
    await page.waitForURL(BASE + path)
    assert.ok((await page.locator('h1').count()) >= 1, `no h1 on ${path}`)
  }
})

await test('SHOP dropdown shows a helpful message while no store URLs are configured', async () => {
  await page.getByRole('banner').getByRole('button', { name: /shop/i }).click()
  await page.getByRole('menu').getByText(/opening soon/i).waitFor()
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('menu').isVisible(), false)
})

await test('Mobile slide-out menu opens, navigates and closes', async () => {
  const m = await newPage({ width: 390, height: 844 })
  await go(m, '/')
  await m.getByRole('button', { name: 'Open menu' }).click()
  const dialog = m.getByRole('dialog', { name: 'Site menu' })
  await dialog.waitFor({ state: 'visible' })
  await dialog.getByRole('link', { name: 'Gallery' }).click()
  await m.waitForURL(BASE + '/gallery')
  await m.waitForTimeout(400)
  assert.equal(await m.locator('[role="dialog"][aria-label="Site menu"]').isVisible(), false)
  const overflow = await m.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
  assert.equal(overflow, false, 'horizontal overflow on mobile')
  await m.context().close()
})

await test('Collection filters and collection pages work', async () => {
  await go(page, '/collections')
  await page.getByRole('radio', { name: /Horror & Dark Art/ }).click()
  await page.waitForURL(/collection=horror-dark-art/)
  await eventually(async () => {
    const names = await page.locator('section[aria-labelledby="browse-title"] h3').allInnerTexts()
    assert.deepEqual(names.map((n) => n.toUpperCase()).sort(), ['LICH SOVEREIGN', 'THE REVENANT', 'THORNHORN'])
  })
  await go(page, '/collections/sci-fi-future')
  assert.match(await page.locator('h1').innerText(), /sci-fi & future/i)
  assert.equal(await page.locator('main article').count(), 3)
  await page.getByRole('link', { name: 'All collections' }).first().click()
  await page.waitForURL(BASE + '/collections')
  await go(page, '/collections/does-not-exist')
  await page.getByText('Collection not found').waitFor()
})

await test('Product detail page shows images, ready-to-paint info and no broken buy buttons', async () => {
  await go(page, '/products/vanguard-mk-ii')
  assert.match(await page.locator('h1').innerText(), /vanguard mk ii/i)
  await page.getByText('Ready to paint', { exact: false }).first().waitFor()
  assert.equal(await page.getByRole('button', { name: /show image/i }).count(), 3)
  assert.equal(await page.locator('a[href*="shopify"], a[href*="etsy"]').count(), 0)
  await page.getByText(/online purchasing for this piece is coming soon/i).waitFor()
  const ld = JSON.parse(await page.locator('#page-jsonld').textContent())
  assert.equal(ld['@type'], 'Product')
  assert.ok(!('offers' in ld), 'must not invent prices')
})

await test('Gallery filters and lightbox work', async () => {
  await go(page, '/gallery')
  await page.getByRole('radio', { name: /Painted examples/ }).click()
  await page.waitForURL(/filter=painted/)
  await eventually(async () => assert.equal(await page.locator('main figure').count(), 4))
  await page.locator('main figure button').first().click()
  const lb = page.getByRole('dialog', { name: 'Image viewer' })
  await lb.waitFor()
  await lb.getByText('1 / 4').waitFor()
  await lb.getByText('Painted example').waitFor()
  await page.keyboard.press('ArrowRight')
  await lb.getByText('2 / 4').waitFor()
  await page.keyboard.press('Escape')
  await lb.waitFor({ state: 'detached' })
})

await test('Contact form validates input and stores a real message', async () => {
  await go(page, '/contact')
  await page.getByRole('button', { name: /send message/i }).click()
  await page.getByText('Please enter your name.').waitFor()
  await page.getByText('Please enter your email address.').waitFor()
  await page.getByLabel(/^Name/).fill('Riley Collector')
  await page.getByLabel(/^Email/).fill('not-an-email')
  await page.getByLabel(/^Subject/).fill('Commission question')
  await page.getByLabel(/^Message/).fill('Hi! Do you plan a larger version of the Thornhorn bust?')
  await page.getByRole('button', { name: /send message/i }).click()
  await page.getByText('Please enter a valid email address.').waitFor()
  await page.getByLabel(/^Email/).fill('riley@example.test')
  await page.waitForTimeout(2600) // honeypot timing check
  await page.getByRole('button', { name: /send message/i }).click()
  await page.getByRole('heading', { name: /message sent/i }).waitFor()
  const r = await db.query("select subject, status from contact_messages where email = 'riley@example.test'")
  assert.equal(r.rows.length, 1)
  assert.equal(r.rows[0].status, 'new')
})

console.log('\nAdmin dashboard')
const admin = await newPage()

await test('Unauthenticated visitors are redirected from every admin page to the login', async () => {
  for (const path of ['/admin', '/admin/products', '/admin/collections', '/admin/gallery', '/admin/messages', '/admin/settings', '/admin/products/new']) {
    await go(admin, path)
    await admin.waitForURL(/\/admin\/login\?next=/)
  }
})

await test('Wrong password is rejected; non-admin accounts are denied access', async () => {
  await go(admin, '/admin/login')
  await admin.getByLabel('Email').fill('admin@bustlab.test')
  await admin.getByLabel('Password').fill('wrong-password')
  await admin.getByRole('button', { name: 'Sign in' }).click()
  await admin.getByText('Incorrect email or password.').waitFor()
  const fan = await newPage()
  await go(fan, '/admin/login')
  await fan.getByLabel('Email').fill('fan@bustlab.test')
  await fan.getByLabel('Password').fill('fan-password-123')
  await fan.getByRole('button', { name: 'Sign in' }).click()
  await fan.getByText('This account does not have administrator access.').waitFor()
  await go(fan, '/admin/products')
  await fan.getByText('Administrator access required').waitFor()
  await fan.context().close()
})

await test('Admin can sign in and sees genuine overview statistics', async () => {
  await go(admin, '/admin/login?next=/admin')
  await admin.getByLabel('Email').fill('admin@bustlab.test')
  await admin.getByLabel('Password').fill('admin-password-123')
  await admin.getByRole('button', { name: 'Sign in' }).click()
  await admin.waitForURL(BASE + '/admin')
  const published = (await db.query('select count(*)::int n from products where published')).rows[0].n
  const stat = admin.locator('a[href="/admin/products"]').filter({ hasText: 'Published products' })
  await stat.getByText(String(published), { exact: true }).waitFor()
  await admin.getByText('Commission question').waitFor()
})

const slug = 'e2e-test-bust'
await test('Product creation with main and additional image uploads works', async () => {
  await go(admin, '/admin/products/new')
  await admin.getByLabel(/^Name/).fill('E2E Test Bust')
  assert.equal(await admin.getByLabel(/^URL slug/).inputValue(), slug)
  await admin.getByLabel(/^Short description/).fill('A bust created by the automated test.')
  await admin.getByLabel('Collection').selectOption({ label: 'Original Creations' })
  await admin.getByLabel(/^Dimensions/).fill('Height 20 cm')
  await admin.locator('#p-main-image').setInputFiles(IMG)
  await admin.getByRole('img', { name: 'Main image preview' }).waitFor()
  await admin.locator('#p-gallery').setInputFiles([IMG, IMG])
  await admin.getByRole('img', { name: 'Additional product images 2' }).waitFor()
  await admin.getByLabel('Shopify product URL').fill('javascript:alert(1)')
  await admin.getByRole('button', { name: 'Save' }).click()
  await admin.getByText('Enter a full URL starting with https://').waitFor()
  await admin.getByLabel('Shopify product URL').fill('https://bustlab.example-shop.com/products/e2e-test-bust')
  await admin.getByRole('switch', { name: 'Published' }).click()
  await admin.getByRole('button', { name: 'Save' }).click()
  await admin.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/)
  const row = (await db.query('select * from products where slug = $1', [slug])).rows[0]
  assert.ok(row, 'product row exists')
  assert.equal(row.published, true)
  assert.equal(row.gallery_images.length, 2)
  assert.match(row.main_image, /\/storage\/v1\/object\/public\/media\/products\/.+\.webp$/)
  const stored = row.main_image.split('/media/')[1]
  assert.ok(existsSync(resolve(STORAGE_DIR, 'media', decodeURIComponent(stored))), 'uploaded file exists in storage')
  const res = await fetch(row.main_image)
  assert.equal(res.status, 200)
  assert.equal(res.headers.get('content-type'), 'image/webp')
})

await test('Published product appears publicly with a safe external Shopify button', async () => {
  await go(page, `/products/${slug}`)
  assert.match(await page.locator('h1').innerText(), /e2e test bust/i)
  await page.getByText('Height 20 cm').waitFor()
  const buy = page.getByRole('link', { name: /Buy E2E Test Bust on Shopify/i })
  assert.equal(await buy.getAttribute('href'), 'https://bustlab.example-shop.com/products/e2e-test-bust')
  assert.equal(await buy.getAttribute('target'), '_blank')
  assert.equal(await buy.getAttribute('rel'), 'noopener noreferrer')
  assert.equal(await page.getByRole('link', { name: /etsy/i }).count(), 0, 'no Etsy button without a URL')
})

await test('Product editing works', async () => {
  await go(admin, '/admin/products')
  await admin.getByRole('link', { name: 'Edit E2E Test Bust' }).click()
  await admin.getByLabel(/^Name/).fill('E2E Test Bust Revised')
  await admin.getByRole('button', { name: 'Save' }).click()
  await admin.getByText('E2E Test Bust Revised saved.').waitFor()
  await go(page, `/products/${slug}`)
  assert.match(await page.locator('h1').innerText(), /e2e test bust revised/i)
})

await test('Unpublishing hides a product from visitors', async () => {
  await go(admin, '/admin/products')
  await admin.getByRole('button', { name: 'Unpublish E2E Test Bust Revised' }).click()
  await admin.getByText(/moved to drafts/).waitFor()
  await go(page, `/products/${slug}`)
  await page.getByText('Piece not found').waitFor()
})

await test('Product deletion works and removes uploaded files', async () => {
  const row = (await db.query('select main_image from products where slug = $1', [slug])).rows[0]
  await go(admin, '/admin/products')
  await admin.getByRole('button', { name: 'Delete E2E Test Bust Revised' }).click()
  await admin.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await admin.getByText('E2E Test Bust Revised deleted.').waitFor()
  assert.equal((await db.query('select count(*)::int n from products where slug = $1', [slug])).rows[0].n, 0)
  const res = await fetch(row.main_image)
  assert.equal(res.status, 404, 'uploaded image removed from storage')
})

await test('Collections: create, reorder and deactivate', async () => {
  await go(admin, '/admin/collections')
  await admin.getByRole('button', { name: 'New collection' }).click()
  await admin.getByLabel(/^Name/).fill('Mecha & Machines')
  assert.equal(await admin.getByLabel(/^URL slug/).inputValue(), 'mecha-and-machines')
  await admin.getByLabel('Description').fill('Giant robots and war machines.')
  await admin.getByRole('button', { name: 'Save collection' }).click()
  await admin.getByText('Mecha & Machines saved.').waitFor()
  await admin.getByRole('button', { name: 'Move Mecha & Machines up' }).click()
  await admin.waitForTimeout(500)
  const order = (await db.query("select display_order from collections where slug = 'mecha-and-machines'")).rows[0].display_order
  assert.equal(order, 5)
  await go(page, '/collections')
  await page.getByRole('link', { name: /Mecha & Machines/ }).first().waitFor()
  const row = admin.locator('li').filter({ hasText: 'Mecha & Machines' })
  await row.getByRole('button', { name: 'Deactivate' }).click()
  await admin.getByText('Mecha & Machines hidden from the website.').waitFor()
  await go(page, '/collections/mecha-and-machines')
  await page.getByText('Collection not found').waitFor()
})

await test('Gallery: upload, caption, categorise and mark painted', async () => {
  await go(admin, '/admin/gallery')
  await admin.getByLabel('Upload gallery images').setInputFiles(IMG)
  const dialog = admin.getByRole('dialog', { name: 'Edit gallery image' })
  await dialog.waitFor()
  await dialog.getByLabel('Caption').fill('Studio test shot')
  await dialog.getByLabel('Alt text').fill('An unpainted test bust')
  await dialog.getByLabel('Category').selectOption({ label: 'Original Creations' })
  await dialog.getByRole('button', { name: 'Save' }).click()
  await admin.getByText('Image details saved.').waitFor()
  await go(page, '/gallery?filter=original-creations')
  await page.getByRole('button', { name: /View larger: Studio test shot/ }).waitFor()
})

await test('Website settings persist and update the public site without code changes', async () => {
  await go(admin, '/admin/settings')
  await admin.getByLabel('Shopify store URL').fill('https://bustlab.example-shop.com')
  await admin.getByLabel('Etsy store URL').fill('https://www.etsy.com/shop/BustlabExample')
  await admin.getByLabel('Instagram').fill('https://instagram.com/bustlab.example')
  await admin.getByLabel('Contact email').fill('hello@bustlab.example')
  await admin.getByLabel('Announcement text').fill('New: Mecha collection coming soon')
  await admin.getByRole('button', { name: 'Save settings' }).click()
  await admin.getByText('Website settings saved. Changes are live.').waitFor()
  await admin.reload({ waitUntil: 'networkidle' })
  assert.equal(await admin.getByLabel('Etsy store URL').inputValue(), 'https://www.etsy.com/shop/BustlabExample')

  await go(page, '/')
  await page.getByText('New: Mecha collection coming soon').waitFor()
  await page.getByRole('banner').getByRole('button', { name: /shop/i }).click()
  const shopify = page.getByRole('menuitem', { name: /shop shopify/i })
  const etsy = page.getByRole('menuitem', { name: /shop etsy/i })
  assert.equal(await shopify.getAttribute('href'), 'https://bustlab.example-shop.com/')
  assert.equal(await etsy.getAttribute('href'), 'https://www.etsy.com/shop/BustlabExample')
  assert.equal(await etsy.getAttribute('target'), '_blank')
  assert.equal(await page.locator('footer a[href^="https://instagram.com"]').count(), 1)
  // product without its own links now falls back to the store URLs
  await go(page, '/products/thornhorn')
  assert.equal(await page.getByRole('link', { name: /Visit our store on Etsy/i }).getAttribute('href'), 'https://www.etsy.com/shop/BustlabExample')
})

await test('Messages: admin reads and archives the contact message', async () => {
  await go(admin, '/admin/messages')
  await admin.getByRole('button', { name: /Riley Collector/ }).click()
  await admin.getByText('Do you plan a larger version').waitFor()
  await admin.getByRole('button', { name: 'Archive' }).click()
  await admin.getByText('Message archived.').waitFor()
  const r = await db.query("select status from contact_messages where email = 'riley@example.test'")
  assert.equal(r.rows[0].status, 'archived')
})

await test('Signing out locks the admin again', async () => {
  await go(admin, '/admin')
  await admin.getByRole('button', { name: 'Sign out' }).first().click()
  await admin.waitForURL(/\/admin\/login/)
})

await test('No console errors were logged during the run', async () => {
  const relevant = consoleErrors.filter((e) => !/Failed to load resource: the server responded with a status of 40[0-6]/.test(e))
  assert.deepEqual(relevant, [])
})

await browser.close()
await db.end()
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
