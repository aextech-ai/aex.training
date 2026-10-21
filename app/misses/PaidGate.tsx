import { CHECKOUT_ENABLED, TEACHER_TITLE } from './course'

// The paid-pack gate, on the Joan model: enrolled learners pass, everyone else sees this. Checkout
// is hard-disabled (CHECKOUT_ENABLED is false and there is no price), so the only ways in are an
// enrollment row or an access code at /redeem, both as for Joan.
export default function PaidGate({ next, previewHref }: { next: string; previewHref?: string }) {
  return (
    <div style={{ margin: '32px 0 0', background: '#13151b', border: '1px solid #2a2d36', borderRadius: 8, padding: '20px 18px' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#c97d3c', letterSpacing: '0.05em', marginBottom: 6 }}>PAID PACK</div>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: '#c8ccd4', margin: '0 0 6px' }}>
        This lesson is part of the course pack taught by {TEACHER_TITLE}.
      </p>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: '#8a8f98', margin: '0 0 16px' }}>
        The pack is not on sale yet. The free intro comes first.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button disabled={!CHECKOUT_ENABLED} style={{ background: '#1a1c23', border: '1px solid #2a2d36', borderRadius: 6, padding: '10px 18px', color: '#555', fontSize: 14, fontFamily: 'inherit', cursor: 'default' }}>
          Not on sale yet
        </button>
        <a href={`/login?callbackUrl=${encodeURIComponent(next)}`} style={linkStyle}>Already enrolled? Sign in</a>
        <a href="/redeem" style={linkStyle}>Have an access code?</a>
      </div>
      {previewHref && (
        <p style={{ fontSize: 12, color: '#e0a06a', margin: '16px 0 0' }}>
          Preview only: <a href={previewHref} style={{ color: '#e0a06a' }}>read the lesson behind the gate</a>.
        </p>
      )}
    </div>
  )
}

const linkStyle: React.CSSProperties = { fontSize: 13, color: '#9ba3af' }
