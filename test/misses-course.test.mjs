// The course route's gates: the flag, unlisted, free, and the data-file contract.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { CHECKOUT_ENABLED, COURSE_BASE, courseMode, episodeVisible, FREE_TURNS_PER_DAY, TEACHER_TITLE } from '../app/misses/course.ts'

const ROOT = join(import.meta.dirname, '..')
const COURSE_DIR = join(ROOT, 'app', COURSE_BASE.slice(1))
const API_DIR = join(ROOT, 'app', 'api', 'misses')
const EPISODES_DIR = join(COURSE_DIR, 'episodes')

function files(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : [p]
  })
}

test('the flag is off in production unless set, and on preview deploys and in dev it previews', () => {
  assert.equal(courseMode({}), 'off')
  assert.equal(courseMode({ NODE_ENV: 'production' }), 'off')
  assert.equal(courseMode({ VERCEL_ENV: 'production', NODE_ENV: 'production' }), 'off')
  assert.equal(courseMode({ VERCEL_ENV: 'preview' }), 'preview')
  assert.equal(courseMode({ NODE_ENV: 'development' }), 'preview')
  assert.equal(courseMode({ MISSES_COURSE: 'off', VERCEL_ENV: 'preview' }), 'off')
  assert.equal(courseMode({ MISSES_COURSE: 'on' }), 'on')
  assert.equal(courseMode({ MISSES_COURSE: 'yes' }), 'off')
})

test('an episode shows when live only once Syndikos has cleared it', () => {
  const draft = { syndikos: null, founder: null }
  const cleared = { syndikos: 'S4 ref', founder: null }
  assert.equal(episodeVisible(draft, 'off'), false)
  assert.equal(episodeVisible(cleared, 'off'), false)
  assert.equal(episodeVisible(draft, 'preview'), true)
  assert.equal(episodeVisible(draft, 'on'), false)
  assert.equal(episodeVisible(cleared, 'on'), true)
})

test('COURSE_BASE matches the route folder', () => {
  assert.match(COURSE_BASE, /^\/[a-z0-9-]+$/)
  assert.ok(existsSync(join(COURSE_DIR, 'page.tsx')), `app${COURSE_BASE}/page.tsx is missing: move the folder with the constant`)
})

test('unlisted: nothing outside the course links to it, there is no sitemap entry, and it is noindex', () => {
  const linking = files(join(ROOT, 'app'))
    .filter(p => !p.startsWith(COURSE_DIR) && !p.startsWith(API_DIR) && /\.(tsx?|jsx?|json|xml|txt)$/.test(p))
    .filter(p => readFileSync(p, 'utf8').includes(`'${COURSE_BASE}`) || readFileSync(p, 'utf8').includes(`"${COURSE_BASE}`) || readFileSync(p, 'utf8').includes(`${COURSE_BASE}/`))
    .map(p => relative(ROOT, p))
  assert.deepEqual(linking, [], 'files outside the course that mention its path')
  for (const f of ['app/sitemap.ts', 'app/sitemap.js', 'app/sitemap.xml', 'public/sitemap.xml', 'app/robots.ts', 'public/robots.txt']) {
    const p = join(ROOT, f)
    if (existsSync(p)) assert.ok(!readFileSync(p, 'utf8').includes(COURSE_BASE), `${f} mentions ${COURSE_BASE}`)
  }
  assert.match(readFileSync(join(COURSE_DIR, 'layout.tsx'), 'utf8'), /robots:\s*\{\s*index:\s*false/)
})

test('checkout is hard-disabled and no price appears anywhere in the course', () => {
  assert.equal(CHECKOUT_ENABLED, false)
  for (const p of [...files(COURSE_DIR), ...files(API_DIR)]) {
    const text = readFileSync(p, 'utf8')
    assert.doesNotMatch(text, /from\s+['"][^'"]*stripe|\/api\/stripe|\/pricing/i, relative(ROOT, p))
    if (!p.endsWith('.png')) assert.doesNotMatch(text, /\$\s?\d/, `${relative(ROOT, p)} carries a price`)
  }
})

test('the teacher title lives in one place', () => {
  assert.ok(TEACHER_TITLE)
  const elsewhere = files(ROOT).filter(p => !p.includes('node_modules') && !p.includes('.next') && !p.includes('.git') && /\.(tsx?|json|mjs)$/.test(p))
    .filter(p => !p.endsWith(join('misses', 'course.ts')) && readFileSync(p, 'utf8').includes(TEACHER_TITLE))
    .map(p => relative(ROOT, p))
  assert.deepEqual(elsewhere, [], 'TEACHER_TITLE is hard-coded outside course.ts')
})

test('free turns are capped from day one, at the chat’s number', () => {
  assert.equal(FREE_TURNS_PER_DAY, 3)
  const route = readFileSync(join(API_DIR, 'chat', 'route.ts'), 'utf8')
  assert.match(route, /takeFreeTurn\(/)
  assert.doesNotMatch(route, /body\??\.system|body\??\.model/, 'the client must not choose the prompt or model')
})

test('every episode file is registered, and the data holds together', () => {
  const index = readFileSync(join(EPISODES_DIR, 'index.ts'), 'utf8')
  const eps = readdirSync(EPISODES_DIR).filter(f => f.endsWith('.json')).map(f => {
    assert.match(index, new RegExp(`from '\\./${f.replace('.', '\\.')}'`), `${f} is not imported in episodes/index.ts`)
    return JSON.parse(readFileSync(join(EPISODES_DIR, f), 'utf8'))
  })
  const slugs = eps.map(e => e.slug)
  assert.equal(new Set(slugs).size, slugs.length, 'duplicate slugs')
  assert.equal(new Set(eps.map(e => e.number)).size, eps.length, 'duplicate episode numbers')
  assert.ok(eps.some(e => e.access === 'free'), 'there is no free unit (D-117 §3a: free intro first)')
  for (const e of eps) {
    assert.match(e.slug, /^[a-z0-9-]+$/)
    assert.ok(e.access === 'free' || e.access === 'paid', `${e.id}: access must be "free" or "paid"`)
    assert.ok('syndikos' in e.clearance && 'founder' in e.clearance, `${e.id} needs clearance.syndikos and clearance.founder`)
    if (e.placeholder) continue
    assert.ok(e.exhibits.length > 0 && e.naming && e.exercise.items.length > 0 && e.close, `${e.id} is missing a section`)
    const keys = e.exhibits.map(x => x.key)
    assert.equal(new Set(keys).size, keys.length, `${e.id}: duplicate exhibit keys`)
    for (const k of keys) assert.match(k, /^\w+$/, `${e.id}: exhibit key ${k} must match [SHOW_ARTIFACT:\\w+]`)
    if (e.persona?.enabled) assert.ok(e.persona.brief, `${e.id}: persona enabled without a brief`)
  }
})

test('lib/vocabulary.mjs is still the BarryDiddja list it says it is', () => {
  const body = readFileSync(join(ROOT, 'lib', 'vocabulary.mjs'), 'utf8').split('\n').slice(4).join('\n')
  // sha256 of BarryDiddja pipeline-src/box/lib/vocabulary.js at 2e1a4b1. Re-copy, then update both.
  assert.equal(createHash('sha256').update(body).digest('hex'), 'c8f0cc65a9d6aa85fa2c09717481f4b2df577ee99ef75c3c8e2621f69db4a101')
})
