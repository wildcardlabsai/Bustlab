// LOCAL TEST DOUBLE — NOT FOR PRODUCTION.
// A small HTTP server that speaks the subset of the Supabase REST (PostgREST), Auth
// and Storage APIs used by the BUSTLAB frontend, backed by a real PostgreSQL database
// with our migrations applied. Every request runs inside a transaction as the caller's
// Postgres role (anon / authenticated) with their JWT claims set, so the real Row Level
// Security policies decide what is allowed — exactly as on Supabase.
//
//   DATABASE_URL=postgres://postgres@127.0.0.1:54322/bustlab_e2e node tests/e2e/local-supabase.mjs
import http from 'node:http'
import crypto from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import pg from 'pg'

const PORT = Number(process.env.PORT || 54321)
const SECRET = process.env.JWT_SECRET || 'local-e2e-secret-at-least-32-characters-long'
const FILES = resolve(process.env.STORAGE_DIR || './.e2e-storage')
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

/* ------------------------------------------------------------------ JWT */
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
export function signJwt(payload) {
  const h = b64({ alg: 'HS256', typ: 'JWT' }), p = b64(payload)
  return `${h}.${p}.${crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')}`
}
function verifyJwt(token) {
  const [h, p, s] = (token || '').split('.')
  if (!s) return null
  const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url')
  if (s.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) return null
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString())
  if (claims.exp && claims.exp < Date.now() / 1000) return null
  return claims
}
export const ANON_KEY = signJwt({ role: 'anon', iss: 'local', exp: 4102444800 })

/* -------------------------------------------------------------- helpers */
const IDENT = /^[a-z_][a-z0-9_]*$/
const q = (id) => {
  if (!IDENT.test(id)) throw httpError(400, 'PGRST100', `Invalid identifier: ${id}`)
  return `"${id}"`
}
function httpError(status, code, message) {
  return Object.assign(new Error(message), { status, code })
}
const RELATIONS = { products: { collections: 'category_id' }, gallery_images: { collections: 'collection_id' } }

function splitTop(s) {
  const out = []; let depth = 0, cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ',' && depth === 0) { out.push(cur); cur = '' } else cur += ch
  }
  if (cur) out.push(cur)
  return out.map((x) => x.trim()).filter(Boolean)
}

function buildSelect(table, select = '*') {
  return splitTop(select).map((item) => {
    if (item === '*') return 't.*'
    const m = item.match(/^(?:([a-z_]+):)?([a-z_]+)\((.*)\)$/)
    if (m) {
      const [, alias, rel, inner] = m
      const fk = RELATIONS[table]?.[rel]
      if (!fk) throw httpError(400, 'PGRST200', `No relationship ${table} -> ${rel}`)
      const cols = splitTop(inner).map((c) => (c === '*' ? 'r.*' : `r.${q(c)}`)).join(', ')
      return `(select row_to_json(x) from (select ${cols} from public.${q(rel)} r where r.id = t.${q(fk)}) x) as ${q(alias || rel)}`
    }
    return `t.${q(item)}`
  }).join(', ')
}

function buildWhere(params, values) {
  const clauses = []
  for (const [key, raw] of params) {
    if (['select', 'order', 'limit', 'offset', 'columns', 'on_conflict'].includes(key)) continue
    const m = raw.match(/^(eq|neq|is|in|gt|lt|gte|lte)\.(.*)$/s)
    if (!m) throw httpError(400, 'PGRST100', `Unsupported filter ${key}=${raw}`)
    const [, op, val] = m
    const col = `t.${q(key)}`
    if (op === 'is') clauses.push(`${col} is ${val === 'null' ? 'null' : val === 'true' ? 'true' : 'false'}`)
    else if (op === 'in') {
      const list = val.replace(/^\(|\)$/g, '').split(',').map((v) => v.replace(/^"|"$/g, ''))
      values.push(list); clauses.push(`${col}::text = any($${values.length})`)
    } else {
      const sql = { eq: '=', neq: '<>', gt: '>', lt: '<', gte: '>=', lte: '<=' }[op]
      values.push(val); clauses.push(`${col}::text ${sql} $${values.length}`)
    }
  }
  return clauses.length ? ` where ${clauses.join(' and ')}` : ''
}

function buildOrder(order) {
  if (!order) return ''
  return ' order by ' + order.split(',').map((part) => {
    const [col, dir = 'asc', nulls] = part.split('.')
    return `t.${q(col)} ${dir === 'desc' ? 'desc' : 'asc'}${nulls === 'nullsfirst' ? ' nulls first' : nulls === 'nullslast' ? ' nulls last' : ''}`
  }).join(', ')
}

async function asRole(claims, fn) {
  const client = await pool.connect()
  try {
    await client.query('begin')
    const role = ['anon', 'authenticated', 'service_role'].includes(claims?.role) ? claims.role : 'anon'
    await client.query(`set local role ${role}`)
    await client.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify(claims || { role: 'anon' })])
    const result = await fn(client)
    await client.query('commit')
    return result
  } catch (e) {
    await client.query('rollback').catch(() => {})
    throw e
  } finally {
    client.release()
  }
}

function pgToHttp(e) {
  if (e.status) return e
  const map = { '42501': 403, '23505': 409, '23514': 400, '23503': 409, 'P0001': 400, '22P02': 400, '42703': 400 }
  return Object.assign(new Error(e.message), { status: map[e.code] || 500, code: e.code, details: e.detail ?? null, hint: e.hint ?? null })
}

const readBody = (req) => new Promise((res, rej) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => res(Buffer.concat(c))); req.on('error', rej) })

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  res.end(body === undefined ? '' : typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body))
}

/* ----------------------------------------------------------------- REST */
async function rest(req, res, url, claims) {
  const [, , , table, fn] = url.pathname.split('/') // /rest/v1/<table> or /rest/v1/rpc/<fn>
  if (table === 'rpc') {
    const out = await asRole(claims, (c) => c.query(`select public.${q(fn)}() as v`))
    return send(res, 200, JSON.stringify(out.rows[0].v))
  }
  q(table)
  const prefer = req.headers.prefer || ''
  const wantsObject = (req.headers.accept || '').includes('vnd.pgrst.object')
  const representation = prefer.includes('return=representation')
  const params = [...url.searchParams.entries()]
  const values = []
  const where = buildWhere(params, values)
  const selectCols = buildSelect(table, url.searchParams.get('select') || '*')

  const respondRows = (rows, status = 200, extra = {}) => {
    if (wantsObject) {
      if (rows.length !== 1) return send(res, 406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${rows.length} rows`, hint: null })
      return send(res, status, rows[0], extra)
    }
    return send(res, status, rows, extra)
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    const limit = url.searchParams.get('limit')
    const sql = `select ${selectCols} from public.${q(table)} t${where}${buildOrder(url.searchParams.get('order'))}${limit ? ` limit ${Number(limit)}` : ''}`
    const countSql = prefer.includes('count=exact') ? `select count(*)::int as n from public.${q(table)} t${where}` : null
    const { rows, count } = await asRole(claims, async (c) => ({
      rows: (await c.query(sql, values)).rows,
      count: countSql ? (await c.query(countSql, values)).rows[0].n : null,
    }))
    const range = { 'Content-Range': `${rows.length ? `0-${rows.length - 1}` : '*'}/${count ?? '*'}` }
    if (req.method === 'HEAD') return send(res, 200, undefined, range)
    return respondRows(rows, 200, range)
  }

  const body = JSON.parse((await readBody(req)).toString() || 'null')
  if (req.method === 'POST') {
    const rows = Array.isArray(body) ? body : [body]
    const cols = Object.keys(rows[0] || {}).map(q)
    const sql = `insert into public.${q(table)} (${cols.join(', ')}) select ${cols.join(', ')} from json_populate_recordset(null::public.${q(table)}, $1)${representation ? ` returning ${selectCols.replaceAll('t.', `public.${q(table)}.`)}` : ''}`
    const out = await asRole(claims, (c) => c.query(sql, [JSON.stringify(rows)]))
    return representation ? respondRows(out.rows, 201) : send(res, 201)
  }
  if (req.method === 'PATCH') {
    const cols = Object.keys(body).map(q)
    values.push(JSON.stringify(body))
    const sql = `update public.${q(table)} t set (${cols.join(', ')}) = (select ${cols.join(', ')} from json_populate_record(null::public.${q(table)}, $${values.length}))${where}${representation ? ` returning ${selectCols}` : ''}`
    const out = await asRole(claims, (c) => c.query(sql, values))
    return representation ? respondRows(out.rows) : send(res, 204)
  }
  if (req.method === 'DELETE') {
    const sql = `delete from public.${q(table)} t${where}${representation ? ` returning ${selectCols}` : ''}`
    const out = await asRole(claims, (c) => c.query(sql, values))
    return representation ? respondRows(out.rows) : send(res, 204)
  }
  throw httpError(405, 'PGRST000', 'Method not allowed')
}

/* ----------------------------------------------------------------- Auth */
async function issueSession(user) {
  const now = Math.floor(Date.now() / 1000)
  const access_token = signJwt({ sub: user.id, email: user.email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600 })
  const refresh_token = crypto.randomBytes(24).toString('hex')
  await pool.query('insert into auth.refresh_tokens_e2e (token, user_id) values ($1, $2)', [refresh_token, user.id])
  return {
    access_token, token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, refresh_token,
    user: { id: user.id, aud: 'authenticated', role: 'authenticated', email: user.email, app_metadata: { provider: 'email' }, user_metadata: {}, created_at: user.created_at },
  }
}

async function auth(req, res, url, claims) {
  const path = url.pathname.replace('/auth/v1', '')
  if (path === '/token' && req.method === 'POST') {
    const body = JSON.parse((await readBody(req)).toString() || '{}')
    let user
    if (url.searchParams.get('grant_type') === 'password') {
      const r = await pool.query(`select id, email, created_at from auth.users where lower(email) = lower($1) and encrypted_password = extensions.crypt($2, encrypted_password)`, [body.email || '', body.password || ''])
      user = r.rows[0]
      if (!user) return send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials', error: 'invalid_grant', error_description: 'Invalid login credentials' })
    } else {
      const r = await pool.query(`delete from auth.refresh_tokens_e2e t using auth.users u where t.token = $1 and u.id = t.user_id returning u.id, u.email, u.created_at`, [body.refresh_token || ''])
      user = r.rows[0]
      if (!user) return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid Refresh Token' })
    }
    return send(res, 200, await issueSession(user))
  }
  if (path === '/user' && req.method === 'GET') {
    if (!claims?.sub) return send(res, 401, { msg: 'Invalid JWT' })
    const r = await pool.query('select id, email, created_at from auth.users where id = $1', [claims.sub])
    if (!r.rows[0]) return send(res, 401, { msg: 'User not found' })
    return send(res, 200, { ...r.rows[0], aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} })
  }
  if (path === '/logout') return send(res, 204)
  if (path === '/recover') return send(res, 200, {})
  if (path === '/settings') return send(res, 200, { external: { email: true }, disable_signup: true })
  return send(res, 404, { msg: `Unsupported auth endpoint ${path}` })
}

/* -------------------------------------------------------------- Storage */
async function storage(req, res, url, claims) {
  const parts = url.pathname.replace('/storage/v1/object/', '').split('/')
  if (parts[0] === 'public' && (req.method === 'GET' || req.method === 'HEAD')) {
    const [, bucket, ...rest] = parts
    const name = rest.map(decodeURIComponent).join('/')
    const b = await pool.query('select public from storage.buckets where id = $1', [bucket])
    if (!b.rows[0]?.public) return send(res, 404, { message: 'Bucket not found' })
    const o = await pool.query('select metadata from storage.objects where bucket_id = $1 and name = $2', [bucket, name])
    if (!o.rows[0]) return send(res, 404, { message: 'Object not found' })
    const data = await readFile(join(FILES, bucket, name))
    return send(res, 200, data, { 'Content-Type': o.rows[0].metadata?.mimetype || 'application/octet-stream', 'Cache-Control': 'public, max-age=3600' })
  }
  const [bucket, ...rest] = parts
  const name = rest.map(decodeURIComponent).join('/')
  if (req.method === 'POST' && name) {
    const data = await readBody(req)
    const mimetype = (req.headers['content-type'] || '').split(';')[0]
    const b = (await pool.query('select * from storage.buckets where id = $1', [bucket])).rows[0]
    if (!b) return send(res, 404, { statusCode: '404', error: 'Bucket not found', message: 'Bucket not found' })
    if (b.allowed_mime_types && !b.allowed_mime_types.includes(mimetype)) return send(res, 415, { statusCode: '415', error: 'invalid_mime_type', message: `mime type ${mimetype} is not supported` })
    if (b.file_size_limit && data.length > Number(b.file_size_limit)) return send(res, 413, { statusCode: '413', error: 'Payload too large', message: 'The object exceeded the maximum allowed size' })
    try {
      const row = await asRole(claims, (c) => c.query('insert into storage.objects (bucket_id, name, owner, metadata) values ($1, $2, $3, $4) returning id', [bucket, name, claims?.sub ?? null, { mimetype, size: data.length }]))
      const path = join(FILES, bucket, name)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, data)
      return send(res, 200, { Key: `${bucket}/${name}`, Id: row.rows[0].id })
    } catch (e) {
      if (e.code === '42501') return send(res, 403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' })
      throw e
    }
  }
  if (req.method === 'DELETE' && !name) {
    const { prefixes = [] } = JSON.parse((await readBody(req)).toString() || '{}')
    const out = await asRole(claims, (c) => c.query('delete from storage.objects where bucket_id = $1 and name = any($2) returning name', [bucket, prefixes]))
    await Promise.all(out.rows.map((r) => rm(join(FILES, bucket, r.name), { force: true })))
    return send(res, 200, out.rows.map((r) => ({ name: r.name, bucket_id: bucket })))
  }
  return send(res, 404, { message: 'Unsupported storage endpoint' })
}

/* --------------------------------------------------------------- server */
export function createServer() {
  return http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,HEAD,OPTIONS,PUT')
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Location')
    if (req.method === 'OPTIONS') return send(res, 204)
    const url = new URL(req.url, `http://${req.headers.host}`)
    const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.headers.apikey
    const claims = verifyJwt(bearer)
    if (bearer && !claims && !url.pathname.startsWith('/storage/v1/object/public')) return send(res, 401, { code: 'PGRST301', message: 'JWT invalid or expired' })
    try {
      if (url.pathname.startsWith('/rest/v1/')) return await rest(req, res, url, claims)
      if (url.pathname.startsWith('/auth/v1/')) return await auth(req, res, url, claims)
      if (url.pathname.startsWith('/storage/v1/object/')) return await storage(req, res, url, claims)
      send(res, 404, { message: 'Not found' })
    } catch (e) {
      const err = pgToHttp(e)
      if (err.status >= 500) console.error(e)
      send(res, err.status, { code: err.code ?? null, message: err.message, details: err.details ?? null, hint: err.hint ?? null })
    }
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(PORT, '127.0.0.1', () => console.log(`local supabase test double on http://127.0.0.1:${PORT}\nANON_KEY=${ANON_KEY}`))
}
