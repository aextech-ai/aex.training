'use client'

import { useEffect, useState } from 'react'
import ChatUI from '../../shared/ChatUI'
import ExhibitPanel from '../../shared/ExhibitPanel'
import type { Exhibit, Message } from '../../shared/types'

// The optional persona for an episode, on the Joan pattern: ChatUI plus the shared ExhibitPanel,
// opened by the [SHOW_ARTIFACT:key] tag. Nothing is sent until the learner opens it, and the server
// holds the system prompt and the free-turn count; this component only shows what it is told.

const ARTIFACT_PATTERN = /\[SHOW_ARTIFACT:(\w+)\]/g

interface Props {
  slug: string
  personaName: string
  opener: string
  exhibitData: Record<string, Exhibit>
}

export default function EpisodeTutor({ slug, personaName, opener, exhibitData }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: opener }])
  const [loading, setLoading] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [activeArtifacts, setActiveArtifacts] = useState<string[]>([])
  const [allShownArtifacts, setAllShownArtifacts] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    fetch(`/api/misses/chat?episode=${encodeURIComponent(slug)}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setRemaining(data.remaining_turns))
      .catch(() => setUnavailable(true))
  }, [open, slug])

  const handleSend = async (text: string) => {
    const updated: Message[] = [...messages, { role: 'user', text }]
    setMessages(updated)
    setLoading(true)
    try {
      const res = await fetch('/api/misses/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episode: slug, messages: updated.map(m => ({ role: m.role, content: m.text })) }),
      })
      const data = await res.json().catch(() => ({}))
      if (typeof data.remaining_turns === 'number') setRemaining(data.remaining_turns)
      if (!res.ok) {
        const msg = res.status === 429
          ? "That's today's free turns. The questions are still here; try them on your own, and come back tomorrow to check them with me."
          : 'Something went wrong. Please try again.'
        setMessages(prev => [...prev, { role: 'assistant', text: msg }])
        return
      }
      const raw: string = data.reply || ''
      const keys = Array.from(raw.matchAll(ARTIFACT_PATTERN), m => m[1]).filter(k => exhibitData[k])
      if (keys.length) {
        setActiveArtifacts(keys)
        setAllShownArtifacts(prev => [...prev, ...keys.filter(k => !prev.includes(k))])
      }
      setMessages(prev => [...prev, { role: 'assistant', text: raw.replace(ARTIFACT_PATTERN, '').trimEnd() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={buttonStyle}>
        Work through it with {personaName} →
      </button>
    )
  }

  const capped = remaining === 0
  const footer = (
    <p style={{ fontSize: 12, color: capped ? '#e0a06a' : '#6b7280', margin: 0 }}>
      {unavailable ? `${personaName} isn't available right now. The questions above work on their own.`
        : remaining === null ? 'Free.'
        : `Free · ${remaining} of today's turns left`}
    </p>
  )

  return (
    <div className={`misses-tutor${activeArtifacts.length ? ' with-panel' : ''}`} style={{ marginTop: 20, border: '1px solid #2a2d36', borderRadius: 8, overflow: 'hidden', background: '#0f1117' }}>
      <style>{`
        .misses-tutor .misses-tutor-body { height: 540px; display: flex; }
        .misses-tutor .misses-tutor-panel { display: flex; }
        @media (max-width: 900px) { .misses-tutor .misses-tutor-panel { display: none; } }
        @media (min-width: 901px) { .misses-tutor.with-panel { width: min(1100px, calc(100vw - 32px)); position: relative; left: 50%; transform: translateX(-50%); } }
        @media (max-width: 600px) { .misses-tutor .misses-tutor-body { height: 70vh; } }
      `}</style>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #2a2d36', fontSize: 13, fontWeight: 600, color: '#c8ccd4' }}>{personaName}</div>
      <div className="misses-tutor-body">
        <div style={{ flex: 1, minWidth: 0 }}>
          <ChatUI messages={messages} onSend={capped || unavailable ? () => {} : handleSend} loading={loading || capped || unavailable} footer={footer} />
        </div>
        {activeArtifacts.length > 0 && (
          <div className="misses-tutor-panel">
            <ExhibitPanel
              artifacts={activeArtifacts}
              allShown={allShownArtifacts}
              exhibitData={exhibitData}
              onClose={() => setActiveArtifacts([])}
              onSwitch={key => setActiveArtifacts([key])}
            />
          </div>
        )}
      </div>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  marginTop: 8,
  background: '#1a1c23',
  border: '1px solid #c97d3c',
  borderRadius: 6,
  padding: '10px 18px',
  color: '#c97d3c',
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontWeight: 500,
}
