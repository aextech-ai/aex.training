import { notFound } from 'next/navigation'
import { COURSE_BASE, COURSE_TITLE, COURSE_TAGLINE, courseMode, isCleared } from './course'
import { visibleEpisodes } from './episodes'
import PreviewBanner from './PreviewBanner'

export const dynamic = 'force-dynamic'

export default function MissesIndex() {
  const mode = courseMode()
  if (mode === 'off') notFound()
  const episodes = visibleEpisodes(mode)

  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 16px 80px' }}>
      {mode === 'preview' && <PreviewBanner />}
      <h1 style={{ fontSize: 26, fontWeight: 600, color: '#e0e3ea', margin: '0 0 10px' }}>{COURSE_TITLE}</h1>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: '#8a8f98', margin: '0 0 8px' }}>{COURSE_TAGLINE}</p>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: '#6b7280', margin: '0 0 36px' }}>
        Each episode shows you the exhibit first, asks you a question, and only then names the habit. Free.
      </p>

      {episodes.length === 0 && <p style={{ fontSize: 14, color: '#6b7280' }}>No episodes yet.</p>}

      <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {episodes.map(e => (
          <li key={e.id}>
            <a href={`${COURSE_BASE}/${e.slug}`} style={{ display: 'block', textDecoration: 'none', background: '#13151b', border: '1px solid #2a2d36', borderRadius: 8, padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#c97d3c', letterSpacing: '0.05em' }}>E{e.number}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#e0e3ea' }}>{e.title}</span>
                {!isCleared(e.clearance) && <span style={{ fontSize: 11, color: '#e0a06a', border: '1px solid #5a3d22', borderRadius: 4, padding: '1px 6px' }}>draft · not cleared</span>}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#8a8f98', margin: '6px 0 0' }}>{e.summary}</p>
            </a>
          </li>
        ))}
      </ol>
    </main>
  )
}
