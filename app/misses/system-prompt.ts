import type { Episode } from './types'
import { TEACHER_SHORT, TEACHER_TITLE } from './course'
import teacher from './teacher.json'

// The teacher for "Barry's Greatest Misses": Barry, under TEACHER_TITLE (D-117 §3b), teaching in
// Ariadne's register from his own settled calls. The copy is data (teacher.json) so Syndikos and
// Ook can edit it; this file only assembles it. Built on the server only: the client never sends
// a system prompt to /api/misses/chat.

// Kept here, not in teacher.json, so the D-58 test can scan every string in that file.
const WORDS_NOT_USED = '- You never use these words or anything like them: pick, lock, units, bet, betting, wager, spread, parlay, fade, sharp, square, edge, profit, ROI, guaranteed, odds as a price, the line, moneyline, juice, vig, bankroll, prop, sportsbook, bookmaker, gambling, and no sportsbook or exchange names. Say "forecast", "probability", "call", "question" and "compare". If your own exhibit text uses one of them, describe it instead of repeating it. If a learner uses them, answer in your words.'

function fill(s: string, extra: Record<string, string> = {}): string {
  const vars: Record<string, string> = { TITLE: TEACHER_TITLE, SHORT: TEACHER_SHORT, ...extra }
  return s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m)
}

export function missesSystemPrompt(ep: Episode): string {
  const exhibits = ep.exhibits.map(x => [
    `### ${x.label}: ${x.title} (key: ${x.key})`,
    x.setup,
    ...x.quotes,
    ...(x.followup ? [x.followup.lead, ...x.followup.quotes] : []),
    `Source: your article "${x.citation.title}", ${x.citation.date}`,
    `Question for the learner: ${x.question}`,
  ].join('\n')).join('\n\n')

  return [
    teacher.prompt.map(line => fill(line)).join('\n\n'),
    WORDS_NOT_USED,
    `## This episode: E${ep.number}, "${ep.title}"`,
    ep.summary,
    ep.persona?.brief ? `## Your brief for this episode\n${ep.persona.brief}` : '',
    `## The exhibits (your own published words, verbatim; the only quotes you may use)\n${exhibits}`,
    `## Naming it (the episode's norm)\n${ep.naming.intro}\n${ep.naming.points.map(p => `- ${p.label} ${p.text}`).join('\n')}\nThe habit: ${ep.naming.habit}`,
    `## Your turn (the practice questions)\n${ep.exercise.intro}\n${ep.exercise.items.map((q, i) => `${i + 1}. ${q}`).join('\n')}${ep.exercise.note ? `\n(${ep.exercise.note})` : ''}`,
  ].filter(Boolean).join('\n\n')
}

export function personaOpener(ep: Episode): string {
  return fill(teacher.opener, { EPISODE: ep.title, FIRST: (ep.exercise.items[0] ?? '').replace(/^"|"$/g, '') })
}

export const PERSONA_FALLBACK = fill(teacher.fallback)
