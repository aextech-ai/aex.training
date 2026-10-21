import type { Access, Clearance } from './course'

// The shape of an episode data file (app/misses/episodes/*.json). Text fields accept three inline
// marks: **strong**, *em* and `code`. Nothing else is interpreted.

export interface Citation {
  title: string
  date: string
  slug: string
}

export interface EpisodeExhibit {
  key: string
  label: string
  title: string
  setup: string
  quotes: string[]
  citation: Citation
  followup?: { lead: string; quotes: string[]; citation: Citation }
  question: string
}

export interface VocabularyException {
  label: string
  where: 'quote'
  reason: string
  cleared: boolean
}

// What the episode list needs. A placeholder file has only this: it shows in the list as
// "coming" and has no page.
export interface EpisodeListing {
  id: string
  slug: string
  number: number
  title: string
  summary: string
  access: Access
  placeholder?: boolean
  clearance: Clearance & { note?: string }
}

export interface Episode extends EpisodeListing {
  source: { draft: string; archive: string }
  intro: string[]
  exhibits: EpisodeExhibit[]
  naming: { intro: string; points: { label: string; text: string }[]; habit: string }
  exercise: { intro: string; note?: string; items: string[] }
  close: string
  persona?: { enabled: boolean; brief: string }
  vocabularyExceptions?: VocabularyException[]
}
