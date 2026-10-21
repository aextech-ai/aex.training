import { Fragment } from 'react'

// Renders the three inline marks an episode file may use (**strong**, *em*, `code`) as React
// nodes. No HTML is passed through, so episode text can never inject markup.
const MARK = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g

export default function Inline({ text }: { text: string }) {
  const parts = text.split(MARK)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <strong key={i} style={{ color: '#e0e3ea', fontWeight: 600 }}>{p.slice(2, -2)}</strong>
        if (p.startsWith('`') && p.endsWith('`') && p.length > 2) return <code key={i} style={{ background: '#161820', padding: '1px 5px', borderRadius: 3, fontSize: '0.9em', wordBreak: 'break-all' }}>{p.slice(1, -1)}</code>
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}
