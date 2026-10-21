// lib/vocabulary.mjs: a verbatim copy of BarryDiddja pipeline-src/box/lib/vocabulary.js at 2e1a4b1
// (the D-58 / Addendum 5 / D-102 §6 word list). Do not edit here: change it in BarryDiddja and
// re-copy. test/vocabulary-sync.test.mjs pins the copy's body hash so drift is a visible change.

// lib/vocabulary.js — the words Barry does not use (D-58, Addendum 5, D-102 §6), in ONE list
// (board job 1c14e497, K11). Before this file the list lived in lib/tweets.js only, and the
// edition had none: on 2026-10-15 a headline said "The Fade I've Carried Since September", the
// slug carried it, and the tweet engine then held the drafts that linked it.
//
// Three readers, one list:
//   - lib/tweets.js lints every draft and its link against it (rule 3);
//   - lib/prose-lint.js gates the edition: a hit in a fresh headline, subhead or ticker line is a
//     REVISE flag in run-edition.js and, if it survives the loop, the compiler drops that unit;
//     a hit in a body paragraph is a warning;
//   - prompts/barry.md carries the list in words ("## Words You Don't Use"), and
//     test/prose-lint.test.mjs fails when a label here is missing there.
//
// ALLOW is checked BEFORE BANNED (Syndikos S2 §2b): a phrase on it is blanked out, so "draft pick"
// and "edge rusher" pass while "pick" and "edge" stay banned. Failing closed is the default; an
// over-block costs a draft or one revision, a miss costs D-58.

const OPERATORS = [
  'DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'ESPN\\s*Bet', 'Fanatics', 'bet365', 'PrizePicks',
  'Underdog\\s+(?:Fantasy|Sports)', 'BetRivers', 'Hard\\s*Rock\\s*Bet', 'Bovada', 'Fliff',
];

// [label, regex]. The label is what a failure prints and what barry.md must name.
// `odds` is banned only as a line (a price), not as Barry's word for his own probability
// ("my own odds said 151"). `edge` is banned as a noun too ("compare", not "edge").
export const BANNED = Object.freeze([
  ['pick', /\bpicks?\b/i], ['lock', /\blocks?\b/i],
  // Bet sizing ("2 units", "a unit play"); a lone "unit" is a team's group or an F1 power unit.
  ['units', /\b\d+(?:\.\d+)?\s*-?\s*units?\b|\bunits?\s+(?:play|plays|bet|bets|wager)\b|\bunits\b/i],
  ['bet', /\b(?:bets?|betting|bettors?)\b/i], ['wager', /\bwager(?:s|ed|ing)?\b/i],
  ['spread', /\bspreads?\b/i], ['ATS', /\bATS\b/], ['parlay', /\bparlays?\b/i],
  ['fade', /\bfad(?:e|es|ed|ing)\b/i], ['hammer', /\bhammer(?:s|ed|ing)?\b/i],
  ['sharp', /\bsharps?\b/i], ['square', /\bsquares?\b/i], ['edge', /\bedges?\b/i],
  ['ROI', /\bROI\b/i], ['profit', /\bprofit(?:s|able)?\b/i], ['guaranteed', /\bguarantee(?:d|s)?\b/i],
  ['over/under', /\bover\s*\/\s*under\b/i], ['o/u', /\bo\s*\/\s*u\b/i], ['+EV', /\+\s*EV\b|\bEV\+/i],
  ['value play', /\bvalue\s+plays?\b/i],
  ['odds (as a line)', /(?<![\w.])[+-]\d{3,4}\b|\b\d+\s*(?:\/|-|to)\s*\d+\s+odds\b|\bodds\s+(?:of|at|on)\s+[+-]?\d|\bat\s+\d+\/\d+\b/i],
  ['line move', /\bline\s+mov(?:e|es|ed|ing|ement)\b/i],
  // ── Syndikos S2 §2a / §7 item 2 (2026-10-17) ──
  // "Bears -3.5", "Bears +3": a signed point line. A signed differential or rating is a stat.
  // A line is at most 24 points; "Bears +47" is a season point differential, and "90'+3'" is
  // stoppage time.
  ['point line', /(?<![\w.+'-])[+-](?:1\d|2[0-4]|\d)(?:\.5)?(?![\d.%'])(?!\s*(?:[a-z]+\s+)?(?:differential|difference|margin|rating|plus\/minus)\b)/i],
  // A half-point threshold is a book's total. A half-point STAT is not ("7.5 sacks" is a real
  // NFL count, half sacks are credited), so only a threshold reading is banned: over/under/
  // fewer than/more than/at least ... N.5. See the PR on why this is narrower than S2's "any".
  ['half-point threshold', /\b(?:over|under|fewer\s+than|more\s+than|less\s+than|at\s+least|at\s+most)\s+\d+\.5\b(?!\s*(?:weeks?|days?|months?|years?|seconds?|minutes?|hours?)\b)/i],
  ['o8.5 / u8.5', /\b[ou]\d+(?:\.\d)?\b/],
  ['the line', /\bthe\s+line\b/i],
  ['the over / the under', /\bthe\s+(?:over|under)\b(?=\s*(?:[.,;:!?)]|$|\s+(?:hits?|hit|cashe[sd]|is|was|on|in|for)\b))/i],
  ['moneyline', /\bmoney\s*lines?\b/i], ['ML', /\bML\b/],
  ['juice', /\bjuice\b/i], ['vig', /\bvig(?:orish)?\b/i], ['bankroll', /\bbankroll\w*/i],
  ['best/free/my play', /\b(?:best|free|top|my)\s+plays?\b(?!\s+of\s+the\b)/i],
  // "cover(s)" in the betting sense: covering a number. Barry "covers" a story and a safety
  // "covers" the slot; neither is banned (archive 2026-10-17: 16 such body hits, none betting).
  ['cover', /\bcover(?:s|ed|ing)?\s+(?:the\s+)?(?:number|spread|line|total|[+-]?\d+(?:\.5)?\b)/i],
  ['prop', /\bprops?\b/i], ['tout', /\btouts?\b/i], ['backer', /\bbackers?\b/i],
  ['sportsbook', /\bsports?\s*books?\b/i],
  // "book(s)" as a noun for a bookmaker: "the books", "books have/moved/opened". Record and
  // history books are on ALLOW.
  ['book (a bookmaker)', /\b(?:the|offshore|every|most)\s+books\b|\bbooks\s+(?:have|had|are|opened|moved|make|made|priced)\b|\bbookies?\b|\bbookmakers?\b/i],
  ['gambling', /\bgambl\w*/i],
  ['DM me', /\bDM\s+me\b/i],
  ['sportsbook or app names (DraftKings, FanDuel, BetMGM, Caesars, PrizePicks...)', new RegExp(`\\b(?:${OPERATORS.join('|')})\\b`, 'i')],
  ['Kalshi / Polymarket', /\b(?:kalshi|polymarket)\b/i],
  ['prices in cents', /\d+\s*(?:¢|cents?\b)/i],
  ['priced', /\bpric(?:ed|ing)\s+in\b|\bpriced\b|\bthe\s+market\s+has\b/i],
]);

// Phrases blanked out before BANNED runs (S2 §2b, plus the idioms marked K11 below).
const ORDINAL = String.raw`(?:first|second|third|fourth|fifth|sixth|seventh|\d+(?:st|nd|rd|th))`;
export const ALLOW = Object.freeze([
  /\bdraft\s+picks?\b/gi,
  new RegExp(String.raw`\b${ORDINAL}[-\s]+round(?:er)?\s+picks?\b`, 'gi'),
  /\b(?:no\.?\s*\d+|number\s+(?:one|two|three|\d+)|overall|lottery|compensatory|comp)\s+picks?\b/gi,
  /\btop[-\s](?:three|five|ten|\d+)\s+picks?\b/gi, /\bpick(?:s|ed|ing)?\s+up\b/gi,
  /\bpick[-\s]+six(?:es)?\b/gi, /\bpick[-\s]+and[-\s]+rolls?\b/gi,
  /\bedge\s+rush(?:ers?|ing)?\b/gi,
  /\bmadison\s+square\s+garden\b/gi, /\bthe\s+hammers\b/gi,
  /\b(?:special[-\s]+teams?|offensive|defensive|second|first|power[-\s]?play|penalty[-\s]?kill)\s+units?\b/gi,
  /\bspread\s+offen[cs]e\b/gi, /\blook(?:s|ed|ing)?\s+sharp\b/gi,
  // K11: sports idioms that are not the market.
  /\bon\s+the\s+line\b/gi, /\b(?:cross(?:es|ed|ing)?|over)\s+the\s+line\b/gi, /\bDrew\s+Lock\b/g, /\bdown\s+the\s+line\b/gi, /\bthe\s+line\s+of\s+scrimmage\b/gi,
  /\b(?:(?:for|in|on|off)\s+the|record|history)\s+books?\b/gi, /\bpower[-\s]+units?\b/gi, /\bcaesars\s+superdome\b/gi, /\bprops\s+to\b/gi,
]);

/** The text with every allowed phrase blanked (same length, so offsets survive). */
export function maskAllowed(text) {
  let s = String(text || '');
  for (const re of ALLOW) s = s.replace(re, (m) => ' '.repeat(m.length));
  return s;
}

/** The labels of every banned entry the text hits, after the allow-list. */
export function bannedIn(text) {
  const s = maskAllowed(text);
  return BANNED.filter(([, re]) => re.test(s)).map(([w]) => w);
}

/** The banned words in a slug or link path, read as words (hyphens, slashes and underscores are spaces). */
export function bannedInSlug(path) {
  return bannedIn(String(path || '').replace(/[-/_]+/g, ' '));
}
