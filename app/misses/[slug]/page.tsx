import { notFound } from 'next/navigation'
import { COURSE_BASE, COURSE_TITLE, TEACHER_SHORT, courseMode, isCleared } from '../course'
import { hasPaidAccess } from '../access'
import PaidGate from '../PaidGate'
import { findEpisode } from '../episodes'
import Inline from '../Inline'
import PreviewBanner from '../PreviewBanner'
import EpisodeTutor from './EpisodeTutor'
import { personaOpener } from '../system-prompt'
import type { Citation } from '../types'
import type { Exhibit } from '../../shared/types'

export const dynamic = 'force-dynamic'

const BARRY_ARTICLE = 'https://diddja.com/a/'

export default async function EpisodePage({ params, searchParams }: { params: { slug: string }; searchParams: { preview?: string } }) {
  const mode = courseMode()
  if (mode === 'off') notFound()
  const ep = findEpisode(params.slug, mode)
  if (!ep) notFound()

  // Paid lessons open to enrolled learners only. In preview mode a reviewer can read past the gate.
  const href = `${COURSE_BASE}/${ep.slug}`
  const reviewing = mode === 'preview' && searchParams.preview === '1'
  const locked = ep.access === 'paid' && !reviewing && !(await hasPaidAccess())
  if (locked) {
    return (
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 80px' }}>
        {mode === 'preview' && <PreviewBanner />}
        <a href={COURSE_BASE} style={{ fontSize: 13, color: '#8a8f98', textDecoration: 'none' }}>← {COURSE_TITLE}</a>
        <EpisodeHeading number={ep.number} title={ep.title} draft={!isCleared(ep.clearance)} />
        <p style={para}><Inline text={ep.summary} /></p>
        <PaidGate next={href} previewHref={mode === 'preview' ? `${href}?preview=1` : undefined} />
      </main>
    )
  }

  // The persona's exhibit panel reuses the shared ExhibitPanel, so the exhibits go over in its shape.
  const exhibitData: Record<string, Exhibit> = Object.fromEntries(ep.exhibits.map(x => [x.key, {
    title: `${x.label}: ${x.title}`,
    session: `E${ep.number}`,
    content: [plain(x.setup), '', ...x.quotes.map(plain), ...(x.followup ? ['', plain(x.followup.lead), ...x.followup.quotes.map(plain)] : []), '', `**Question for you**`, plain(x.question)].join('\n'),
  }]))

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 80px' }}>
      {mode === 'preview' && <PreviewBanner />}
      <a href={COURSE_BASE} style={{ fontSize: 13, color: '#8a8f98', textDecoration: 'none' }}>← {COURSE_TITLE}</a>

      <EpisodeHeading number={ep.number} title={ep.title} draft={!isCleared(ep.clearance)} />

      <section style={prose}>
        {ep.intro.map((p, i) => <p key={i} style={para}><Inline text={p} /></p>)}
      </section>

      {ep.exhibits.map(x => (
        <section key={x.key} style={{ margin: '40px 0 0' }}>
          <h2 style={h2}><span style={{ color: '#8a8f98', fontWeight: 500 }}>{x.label} —</span> {x.title}</h2>
          <div style={{ background: '#13151b', border: '1px solid #2a2d36', borderRadius: 8, padding: '16px 18px' }}>
            <p style={{ ...para, fontSize: 14, fontStyle: 'italic', color: '#8a8f98' }}><Inline text={x.setup} /></p>
            <Quotes quotes={x.quotes} citation={x.citation} />
            {x.followup && (
              <>
                <p style={{ ...para, fontSize: 14, marginTop: 16 }}><Inline text={x.followup.lead} /></p>
                <Quotes quotes={x.followup.quotes} citation={x.followup.citation} />
              </>
            )}
          </div>
          <div style={{ borderLeft: '3px solid #c97d3c', padding: '10px 14px', marginTop: 14, background: '#1a1c23', borderRadius: '0 6px 6px 0' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#c97d3c', letterSpacing: '0.05em', marginBottom: 4 }}>QUESTION FOR YOU</div>
            <p style={{ ...para, margin: 0, color: '#c8ccd4' }}><Inline text={x.question} /></p>
          </div>
        </section>
      ))}

      <section style={{ margin: '48px 0 0' }}>
        <h2 style={h2}>Naming it</h2>
        <div style={prose}>
          <p style={para}><Inline text={ep.naming.intro} /></p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, margin: '4px 0 16px' }}>
            {ep.naming.points.map((pt, i) => (
              <li key={i} style={{ ...para, margin: 0, paddingLeft: 14, borderLeft: '2px solid #2a2d36' }}>
                <strong style={{ color: '#e0e3ea', fontWeight: 600 }}>{pt.label}</strong> <Inline text={pt.text} />
              </li>
            ))}
          </ul>
          <p style={para}><strong style={{ color: '#e0e3ea' }}>The habit:</strong> <Inline text={ep.naming.habit} /></p>
        </div>
      </section>

      <section style={{ margin: '48px 0 0' }}>
        <h2 style={h2}>Your turn</h2>
        <div style={prose}>
          <p style={para}><Inline text={ep.exercise.intro} /></p>
          <ol style={{ paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8, margin: '0 0 12px' }}>
            {ep.exercise.items.map((q, i) => <li key={i} style={{ ...para, margin: 0 }}><Inline text={q} /></li>)}
          </ol>
          {ep.exercise.note && <p style={{ ...para, fontSize: 13, color: '#6b7280' }}><em>{ep.exercise.note}</em></p>}
        </div>
        {ep.persona?.enabled && (
          <EpisodeTutor slug={ep.slug} personaName={TEACHER_SHORT} opener={personaOpener(ep)} exhibitData={exhibitData} />
        )}
      </section>

      <footer style={{ margin: '56px 0 0', paddingTop: 16, borderTop: '1px solid #1a1c23', fontSize: 12, lineHeight: 1.6, color: '#6b7280' }}>
        <p style={{ margin: 0 }}><em>{ep.close}</em></p>
      </footer>
    </main>
  )
}

function EpisodeHeading({ number, title, draft }: { number: number; title: string; draft: boolean }) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#c97d3c', letterSpacing: '0.06em', margin: '24px 0 6px' }}>
        EPISODE {number}{draft && <span style={{ color: '#e0a06a', fontWeight: 500, marginLeft: 10 }}>draft · not cleared</span>}
      </div>
      <h1 style={{ fontSize: 26, lineHeight: 1.3, fontWeight: 600, color: '#e0e3ea', margin: '0 0 20px' }}>{title}</h1>
    </>
  )
}

function Quotes({ quotes, citation }: { quotes: string[]; citation: Citation }) {
  return (
    <figure style={{ margin: '12px 0 0' }}>
      <blockquote style={{ borderLeft: '2px solid #3a3e4a', paddingLeft: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {quotes.map((q, i) => <p key={i} style={{ ...para, margin: 0, color: '#c8ccd4' }}><Inline text={q} /></p>)}
      </blockquote>
      <figcaption style={{ fontSize: 12, lineHeight: 1.5, color: '#6b7280', marginTop: 8 }}>
        Barry, <a href={`${BARRY_ARTICLE}${citation.slug}/`} rel="noopener" style={{ color: '#8a8f98' }}>&ldquo;{citation.title}&rdquo;</a>, {citation.date}
      </figcaption>
    </figure>
  )
}

// ExhibitPanel renders plain lines, so the inline marks come off.
function plain(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g, (_, a, b, c) => a ?? b ?? c)
}

const prose: React.CSSProperties = { fontSize: 15, lineHeight: 1.75, color: '#a0a4ac' }
const para: React.CSSProperties = { fontSize: 15, lineHeight: 1.75, color: '#a0a4ac', margin: '0 0 14px', overflowWrap: 'anywhere' }
const h2: React.CSSProperties = { fontSize: 18, fontWeight: 600, color: '#e0e3ea', margin: '0 0 12px' }
