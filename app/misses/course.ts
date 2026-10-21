// Course config for "Barry's Greatest Misses" (D-117). Kept free of imports so the tests can load
// it directly with node.
//
// The URL lives in two places, and only two: COURSE_BASE below and the folder name under app/.
// To rename the course (Ook owns the name), move app/misses/ and change COURSE_BASE together;
// test/misses-course.test.mjs fails if they disagree.

export const COURSE_BASE = '/misses'
export const COURSE_TITLE = "Barry's Greatest Misses"
export const COURSE_TAGLINE = 'A forecasting course built from one analyst’s published misses, in his own words.'

// Working name for the teacher persona. Ook owns persona names.
export const PERSONA_NAME = 'Clio'

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

export function episodeVisible(c: Clearance, mode: CourseMode): boolean {
  if (mode === 'off') return false
  if (mode === 'preview') return true
  return isCleared(c)
}
