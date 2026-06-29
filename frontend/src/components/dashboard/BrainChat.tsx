import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '@/lib/utils'
import { Send, Brain, User, Loader2 } from 'lucide-react'
import { useTheme } from '@/App'

interface Message { role: 'user' | 'assistant'; content: string; sources?: any[] }

export default function BrainChat({ token }: { token: string }) {
  const { dark } = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const q = input.trim()
    if (!q || loading) return
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setInput('')
    setLoading(true)

    try {
      const res = await apiFetch('/api/meetings/rag-query', {
        method: 'POST',
        body: JSON.stringify({ query: q }),
      }, token)
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer, sources: res.sources }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Select a plan to unlock this feature and enable AI-powered search across your meetings.',
      }])
    } finally { setLoading(false) }
  }

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 600 }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
            <Brain size={40} color="#8b5cf6" style={{ opacity: 0.4, marginBottom: 16 }} />
            <p style={{ fontSize: 14, color: dark ? '#64748b' : '#9ca3af' }}>Ask anything across all your past meetings.</p>
            <p style={{ marginTop: 4, fontSize: 12, color: dark ? '#475569' : '#d1d5db' }}>e.g. "What did we decide about the database migration?"</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Brain size={14} color="#8b5cf6" />
              </div>
            )}
            <div style={{
              maxWidth: '80%', borderRadius: 16, padding: '12px 16px', fontSize: 14,
              background: msg.role === 'user'
                ? 'rgba(0,240,255,0.1)'
                : (dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'),
              color: dark ? '#e2e8f0' : '#1f2937',
            }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ marginTop: 8, borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, paddingTop: 8 }}>
                  <p style={{ fontSize: 11, color: dark ? '#64748b' : '#9ca3af', marginBottom: 4 }}>Sources:</p>
                  {msg.sources.map((s: any, j: number) => (
                    <p key={j} style={{ fontSize: 11, color: 'rgba(0,240,255,0.7)' }}>
                      Meeting {s.meeting_id?.slice(0, 8)}… ({(s.similarity * 100).toFixed(0)}%)
                    </p>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,240,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={14} color="#00f0ff" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 12 }}>Searching your meetings…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask across your meetings…"
          className="glass-input"
          style={{ flex: 1 }}
        />
        <button onClick={send} disabled={loading || !input.trim()} className="neon-btn" style={{ padding: '12px 16px' }}>
          <Send size={16} />
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}