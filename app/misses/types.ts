import type { Clearance } from './course'

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

export interface Episode {
  id: string
  slug: string
  number: number
  title: string
  summary: string
  clearance: Clearance & { note?: string }
  source: { draft: string; archive: string }
  intro: string[]
  exhibits: EpisodeExhibit[]
  naming: { intro: string; points: { label: string; text: string }[]; habit: string }
  exercise: { intro: string; note?: string; items: string[] }
  close: string
  persona?: { enabled: boolean; brief: string }
  vocabularyExceptions?: VocabularyException[]
}
