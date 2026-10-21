// The D-58 word list (lib/vocabulary.mjs, copied from BarryDiddja) run over every episode file.
//
// Our own copy (titles, setups, questions, naming, exercise, close, persona brief) must have no
// hits at all. Barry's verbatim quotes may carry a word only when the episode lists it in
// vocabularyExceptions with where: "quote" and a reason. An episode with a Syndikos clearance must
// have every exception cleared too. An exception nothing uses fails, so the list stays honest.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { bannedIn } from '../lib/vocabulary.mjs'

const DIR = join(import.meta.dirname, '..', 'app', 'misses', 'episodes')
// Bookkeeping fields: never rendered and never sent to the model.
const INTERNAL = new Set(['clearance', 'source', 'vocabularyExceptions', 'id', 'slug', 'key'])

const episodes = readdirSync(DIR).filter(f => f.endsWith('.json'))
  .map(f => ({ file: f, ep: JSON.parse(readFileSync(join(DIR, f), 'utf8')) }))

function* strings(node, path, inQuote) {
  if (typeof node === 'string') { yield { path, text: node, inQuote }; return }
  if (Array.isArray(node)) { for (let i = 0; i < node.length; i++) yield* strings(node[i], `${path}[${i}]`, inQuote); return }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (INTERNAL.has(k)) continue
      yield* strings(v, `${path}.${k}`, inQuote || k === 'quotes')
    }
  }
}

test("the teacher's copy uses none of the D-58 words", () => {
  const teacher = JSON.parse(readFileSync(join(DIR, '..', 'teacher.json'), 'utf8'))
  const hits = []
  for (const s of strings(teacher, 'teacher', false)) {
    const h = bannedIn(s.text)
    if (h.length) hits.push(`${s.path}: ${h.join(', ')}`)
  }
  assert.deepEqual(hits, [], `D-58 words in teacher.json:\n${hits.join('\n')}`)
})

test('there is at least one episode file', () => {
  assert.ok(episodes.length > 0)
})

test('the word list still catches what it should', () => {
  assert.ok(bannedIn('not betting advice').includes('bet'))
  assert.ok(bannedIn('find the edge case').includes('edge'))
  assert.deepEqual(bannedIn('Find the word in the resolution rule that decides it.'), [])
})

for (const { file, ep } of episodes) {
  test(`${file}: our own copy uses none of the D-58 words`, () => {
    const hits = []
    for (const s of strings(ep, ep.id, false)) {
      if (s.inQuote) continue
      const h = bannedIn(s.text)
      if (h.length) hits.push(`${s.path}: ${h.join(', ')}`)
    }
    assert.deepEqual(hits, [], `D-58 words in our copy:\n${hits.join('\n')}`)
  })

  test(`${file}: Barry's quotes carry only listed exceptions, and every exception is used`, () => {
    const allowed = new Set((ep.vocabularyExceptions ?? []).filter(x => x.where === 'quote' && x.reason).map(x => x.label))
    const used = new Set()
    const hits = []
    for (const s of strings(ep, ep.id, false)) {
      if (!s.inQuote) continue
      for (const w of bannedIn(s.text)) {
        if (allowed.has(w)) used.add(w)
        else hits.push(`${s.path}: ${w}`)
      }
    }
    assert.deepEqual(hits, [], `unlisted D-58 words in quotes:\n${hits.join('\n')}`)
    assert.deepEqual([...allowed].filter(w => !used.has(w)), [], 'exceptions nothing uses')
  })

  test(`${file}: a cleared episode has every vocabulary exception cleared`, () => {
    if (!ep.clearance?.syndikos) return
    const open = (ep.vocabularyExceptions ?? []).filter(x => !x.cleared).map(x => x.label)
    assert.deepEqual(open, [], 'cleared by Syndikos, but these exceptions are not')
  })
}
