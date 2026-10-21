import { NextRequest, NextResponse } from 'next/server'
import { FREE_TURNS_PER_DAY, courseMode } from '../../../misses/course'
import { findEpisode } from '../../../misses/episodes'
import { PERSONA_FALLBACK, missesSystemPrompt } from '../../../misses/system-prompt'
import { hasPaidAccess } from '../../../misses/access'
import { freeTurnsLeft, refundFreeTurn, takeFreeTurn, utcDay, visitorBucket } from '@/lib/db/free-turns'
import { bannedIn } from '@/lib/vocabulary.mjs'

// The persona for "Barry's Greatest Misses". Unlike /api/chat, the client sends only the episode
// slug and the conversation: the system prompt, the model and the token budget are set here, and
// every turn is counted against the free daily cap before the model is called. No checkout here:
// paid episodes need an enrollment (D-117 §3a), and the cap holds for everyone until a price is struck.

const COURSE = 'misses'
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 700
const MAX_MESSAGES = 16
const MAX_CHARS = 2000

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

function salt(): string | null {
  return process.env.MISSES_TURN_SALT || process.env.NEXTAUTH_SECRET || null
}

// A paid episode's teacher answers enrolled learners only, as its page does. Preview deploys skip
// the enrollment check so reviewers can try it; the free-turn cap still applies there.
async function episodeFor(slug: unknown) {
  const mode = courseMode()
  if (mode === 'off' || typeof slug !== 'string') return null
  const ep = findEpisode(slug, mode)
  if (!ep?.persona?.enabled) return null
  if (ep.access === 'paid' && mode !== 'preview' && !(await hasPaidAccess())) return null
  return ep
}

export async function GET(req: NextRequest) {
  const ep = await episodeFor(req.nextUrl.searchParams.get('episode'))
  if (!ep) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const s = salt()
  if (!s) return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  const day = utcDay()
  try {
    const left = await freeTurnsLeft(COURSE, visitorBucket(clientIp(req), day, s), day, FREE_TURNS_PER_DAY)
    return NextResponse.json({ remaining_turns: left, free_total: FREE_TURNS_PER_DAY })
  } catch {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const ep = await episodeFor(body?.episode)
  if (!ep) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const messages = Array.isArray(body?.messages) ? body.messages.slice(-MAX_MESSAGES) : []
  const valid = messages.length > 0
    && messages.every((m: any) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.length > 0 && m.content.length <= MAX_CHARS)
    && messages[messages.length - 1].role === 'user'
  if (!valid) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  // The API wants the conversation to open on a user turn, and the persona's opener comes first.
  if (messages[0].role === 'assistant') messages.unshift({ role: 'user', content: "I've read the episode. Let's do the practice questions." })

  const apiKey = process.env.ANTHROPIC_API_KEY
  const s = salt()
  if (!apiKey || !s) return NextResponse.json({ error: 'Unavailable' }, { status: 503 })

  // Reserve the turn first, so concurrent requests cannot overspend the cap. Fail closed.
  const day = utcDay()
  const bucket = visitorBucket(clientIp(req), day, s)
  let remaining: number | null
  try {
    remaining = await takeFreeTurn(COURSE, bucket, day, FREE_TURNS_PER_DAY)
  } catch {
    return NextResponse.json({ error: 'Unavailable' }, { status: 503 })
  }
  if (remaining === null) {
    return NextResponse.json({ error: 'Free turns used for today', remaining_turns: 0 }, { status: 429 })
  }

  const system = missesSystemPrompt(ep)
  try {
    let reply = await complete(apiKey, system, messages)
    // D-58: the persona's words are checked against the same list as the episode data. One retry
    // with the hits named, then a fixed line rather than a reply that uses them.
    let hits = bannedIn(reply)
    if (hits.length) {
      reply = await complete(apiKey, `${system}\n\nYour last draft used words this course does not use (${hits.join(', ')}). Write the reply again without them.`, messages)
      hits = bannedIn(reply)
      if (hits.length) reply = PERSONA_FALLBACK
    }
    return NextResponse.json({ reply, remaining_turns: remaining })
  } catch {
    await refundFreeTurn(COURSE, bucket, day).catch(() => {})
    return NextResponse.json({ error: 'Model call failed', remaining_turns: remaining + 1 }, { status: 502 })
  }
}

async function complete(apiKey: string, system: string, messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, system, messages }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.error?.message || 'API request failed')
  return data.content?.[0]?.text || ''
}
