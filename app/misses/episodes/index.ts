import type { Episode } from '../types'
import { courseMode, episodeVisible, type CourseMode } from '../course'
import e1 from './e1.json'

// One line per episode file. A new episode is a new JSON file plus its line here;
// test/misses-course.test.mjs fails if a file in this folder is not listed.
export const EPISODES: Episode[] = [
  e1 as Episode,
].sort((a, b) => a.number - b.number)

export function visibleEpisodes(mode: CourseMode = courseMode()): Episode[] {
  return EPISODES.filter(e => episodeVisible(e.clearance, mode))
}

export function findEpisode(slug: string, mode: CourseMode = courseMode()): Episode | null {
  return visibleEpisodes(mode).find(e => e.slug === slug) ?? null
}
