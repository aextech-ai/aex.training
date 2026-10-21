import type { Episode, EpisodeListing } from '../types'
import { courseMode, episodeVisible, type CourseMode } from '../course'
import e0 from './e0.json'
import e1 from './e1.json'

// One line per episode file. A new episode is a new JSON file plus its line here;
// test/misses-course.test.mjs fails if a file in this folder is not listed. Free or paid is the
// file's `access` field; a `placeholder` file is listed as "coming" and has no page.
export const EPISODES: EpisodeListing[] = [
  e0 as EpisodeListing,
  e1 as Episode,
].sort((a, b) => a.number - b.number)

export function visibleEpisodes(mode: CourseMode = courseMode()): EpisodeListing[] {
  return EPISODES.filter(e => episodeVisible(e.clearance, mode))
}

export function findEpisode(slug: string, mode: CourseMode = courseMode()): Episode | null {
  const e = visibleEpisodes(mode).find(x => x.slug === slug)
  return e && !e.placeholder ? (e as Episode) : null
}
