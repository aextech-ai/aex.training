// Course config for "Barry's Greatest Misses" (D-117). Kept free of imports so the tests can load
// it directly with node.
//
// The URL lives in two places, and only two: COURSE_BASE below and the folder name under app/.
// To rename the course (Ook owns the name), move app/misses/ and change COURSE_BASE together;
// test/misses-course.test.mjs fails if they disagree.

export const COURSE_BASE = '/misses'
export const COURSE_TITLE = "Barry's Greatest Misses"
export const COURSE_TAGLINE = 'A forecasting course built from one analyst’s published misses, in his own words.'

// The teacher (D-117 §3b, Office #866): Barry teaches. Ook rules the title, and Syndikos checks it
// implies no real academic credential, so it lives here and nowhere else.
export const TEACHER_TITLE = 'Assistant Professor Barry Diddja'
export const TEACHER_SHORT = 'Barry'

// The paid pack (D-117 §3a): one free unit, then a pack, on the Ariadne → Joan model. Access is
// the `access` field of each episode file. Enrollment is the enrollments row for this course id,
// as for Joan. Checkout stays off until Emporion proposes a price and the founder ratifies it
// (D-62); there is deliberately no price anywhere in the course.
export const COURSE_ID = 'misses'
export const CHECKOUT_ENABLED = false as const

// Free persona turns per visitor per UTC day. The number matches the Barry chat's free tier
// (FREE_TURNS = 3 in BarryDiddja edge/chat/chat-worker.js); note that the chat's 3 are per browser
// for good, and these reset daily, as the R3 job asked.
export const FREE_TURNS_PER_DAY = 3

// off:     every course URL is a 404 and the persona endpoint refuses. The production default.
// preview: every episode shows, uncleared ones under a draft banner. The default on Vercel
//          preview deploys and in `next dev`.
// on:      only episodes with a Syndikos clearance show. Turning this on is the founder's call.
// None of the three adds a nav link or a sitemap entry; listing the course is a separate change.
export type CourseMode = 'off' | 'preview' | 'on'

export function courseMode(env: Record<string, string | undefined> = process.env): CourseMode {
  const v = env.MISSES_COURSE
  if (v === 'off' || v === 'preview' || v === 'on') return v
  if (env.VERCEL_ENV === 'preview' || env.NODE_ENV === 'development') return 'preview'
  return 'off'
}

export interface Clearance {
  syndikos: string | null
  founder: string | null
}

export function isCleared(c: Clearance): boolean {
  return !!c.syndikos
}

export type Access = 'free' | 'paid'

export function episodeVisible(c: Clearance, mode: CourseMode): boolean {
  if (mode === 'off') return false
  if (mode === 'preview') return true
  return isCleared(c)
}
