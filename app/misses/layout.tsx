import type { Metadata } from 'next'
import { COURSE_TITLE } from './course'

// Unlisted: never indexed, whatever the mode. Listing the course is the founder's call and a
// separate change (nav link, sitemap, and dropping this robots line).
export const metadata: Metadata = {
  title: `${COURSE_TITLE} — aex.training`,
  robots: { index: false, follow: false, nocache: true },
}

export default function MissesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#c8ccd4', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <header style={{ padding: '12px 20px', borderBottom: '1px solid #1a1c23', fontSize: 13, color: '#8a8f98', fontWeight: 500, letterSpacing: '0.02em' }}>
        <a href="/" style={{ color: '#8a8f98', textDecoration: 'none' }}>aex.training</a>
      </header>
      {children}
    </div>
  )
}
