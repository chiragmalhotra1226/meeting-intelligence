import { useState, useRef, useEffect } from 'react'
import { useWebSpeech } from '@/hooks/useWebSpeech'
import { apiFetch, formatTime } from '@/lib/utils'
import {
  Mic, Square, Loader2, Wand2, BarChart3, Users, Brain, Hash,
  Gauge, Volume2, Monitor, Headphones, Info, Zap, Clock, Target,
  CheckCircle2, AlertCircle, Radio, Wifi, Shield,
} from 'lucide-react'
import { useTheme } from '@/App'
import { useNavigate } from 'react-router-dom';

interface Props {
  token: string
  onSessionComplete: (meeting: any) => void
}

type CaptureMode = 'microphone' | 'system'

export default function HarvesterConsole({ token, onSessionComplete }: Props) {
  const { dark } = useTheme()
  const [sessionId, setSessionId] = useState('')
  const [title, setTitle] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [captureMode, setCaptureMode] = useState<CaptureMode>('microphone')
  const [showTips, setShowTips] = useState(false)
  const timerRef = useRef<number | null>(null)
  const navigate = useNavigate();

  const speech = useWebSpeech({ sessionId: sessionId || '', token })

  const handleStart = async () => {
    const name = title.trim() || `Meeting ${new Date().toLocaleString()}`
    try {
      const res = await apiFetch('/api/meetings/create', {
        method: 'POST',
        body: JSON.stringify({ title: name }),
      }, token)
      setSessionId(res.session_id)
    } catch {
      setSessionId('demo-' + Date.now())
    }
    setElapsed(0)
    timerRef.current = window.setInterval(() => setElapsed(e => e + 1), 1000)
    setTimeout(() => speech.start(), 300)
  }

  const handleStop = async () => {
    speech.stop()
    if (timerRef.current) clearInterval(timerRef.current)


    // Guard: need at least 30 words for meaningful analysis
    if (speech.wordCount < 30) {
        onSessionComplete({
        id: sessionId, title: title || 'Short Session',
        executive_summary: `Session was too short for analysis (${speech.wordCount} words, ${formatTime(elapsed)}). Record at least 30 seconds of speech for meaningful results.`,
        topic_timeline: [],
        action_items: [],
        })
        setSessionId('')
        return
    }
    setAnalyzing(true)
    try {
      const result = await apiFetch('/api/meetings/analyze', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, transcript: speech.fullText }),
      }, token)
      onSessionComplete({ id: sessionId, title, ...result })
    } catch {
      onSessionComplete({
        id: sessionId, title: title || 'Demo Meeting',
        executive_summary: 'Connect FastAPI backend for real AI analysis.',
        topic_timeline: [{ start_time: 0, end_time: elapsed, topic_label: 'Discussion' }],
        action_items: [],
      })
    } finally {
      setAnalyzing(false)
      setSessionId('')
    }
  }

  // Volume visualization
  const volumeBars = Array.from({ length: 24 }, (_, i) => speech.volumeLevel > (i / 24) * 100)

  // ── PRE-RECORDING STATE ────────────────────────────────────────
  if (!speech.isRecording && !analyzing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Feature cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { icon: Brain, color: '#8b5cf6', title: 'AI Analysis', desc: 'Auto-generates summary, action items, and coaching insights from your conversation' },
            { icon: Users, color: '#ff00e5', title: 'Speaker Detection', desc: 'Pitch analysis flags when a different person is speaking in real-time' },
            { icon: Target, color: '#39ff14', title: 'Action Items', desc: 'Extracts commitments like "I will..." into a Kanban board with Jira/Notion export' },
            { icon: Zap, color: '#ffb300', title: 'Zero-Cost Engine', desc: 'Web Speech API runs 100% on your browser — no transcription servers needed' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="glass-card" style={{ padding: 18 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${color}12`, marginBottom: 12,
              }}>
                <Icon size={18} color={color} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: dark ? '#f1f5f9' : '#111827', margin: '0 0 6px' }}>{title}</h3>
              <p style={{ fontSize: 12, color: dark ? '#64748b' : '#9ca3af', lineHeight: 1.5, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Title + Start (moved below the cards) */}
        <div className="glass-card" style={{ padding: 24 }}>
          <input
            type="text"
            placeholder="Meeting title (optional) — e.g. Sprint Planning, Client Sync"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="glass-input"
            style={{ marginBottom: 16 }}
          />

          {/* Capture mode selector */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {[
              { id: 'microphone' as CaptureMode, icon: Mic, label: 'Microphone', desc: 'Your voice only' },
              { id: 'system' as CaptureMode, icon: Monitor, label: 'System Audio', desc: 'Zoom / Meet / Teams' },
            ].map(({ id, icon: Icon, label, desc }) => (
              <button
  key={id}
  // Change here: If id is 'system', navigate to /pricing. Otherwise, set the mode.
  onClick={() => (id === 'system' ? navigate('/pricing') : setCaptureMode(id))}
  style={{
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    gap: 12,
    padding: '14px 16px', 
    borderRadius: 12, 
    border: 'none', 
    cursor: 'pointer',
    background: captureMode === id
      ? (dark ? 'rgba(0,240,255,0.08)' : 'rgba(0,240,255,0.06)')
      : (dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
    outline: captureMode === id ? '2px solid rgba(0,240,255,0.3)' : '1px solid transparent',
    transition: 'all 0.2s',
  }}
>
  <Icon size={20} color={captureMode === id ? '#00f0ff' : (dark ? '#64748b' : '#9ca3af')} />
  <div style={{ textAlign: 'left' }}>
    <p style={{ fontSize: 14, fontWeight: 600, color: captureMode === id ? '#00f0ff' : (dark ? '#e2e8f0' : '#1f2937'), margin: 0 }}>
      {label}
    </p>
    <p style={{ fontSize: 11, color: dark ? '#64748b' : '#9ca3af', margin: 0 }}>
      {desc}
    </p>
  </div>
</button>
            ))}
          </div>

          <button onClick={handleStart} className="neon-btn" style={{ width: '100%', padding: '16px 24px', fontSize: 16 }}>
            <Mic size={20} />
            Start Recording Session
          </button>
        </div>

        {/* How-to tips removed per UX request */}

        {/* Status indicators */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[
            { icon: Wifi, label: 'Web Speech API', status: 'Ready', color: '#39ff14' },
            { icon: Radio, label: 'Audio Context', status: 'Standby', color: '#ffb300' },
            { icon: Shield, label: 'Privacy', status: 'Local Processing', color: '#00f0ff' },
          ].map(({ icon: Icon, label, status, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
              <Icon size={14} color={color} />
              <span style={{ fontSize: 12, color: dark ? '#64748b' : '#9ca3af' }}>{label}:</span>
              <span style={{ fontSize: 12, fontWeight: 600, color }}>{status}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── RECORDING / ANALYZING STATE ────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Controls */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {analyzing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#8b5cf6' }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14 }}>
                AI is analyzing your transcript…
              </span>
            </div>
          ) : (
            <>
              <button onClick={handleStop} className="neon-btn neon-btn-danger">
                <Square size={16} />
                Stop & Analyze
              </button>

              {/* Timer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ position: 'relative', display: 'flex', width: 12, height: 12 }}>
                  <span style={{
                    position: 'absolute', width: '100%', height: '100%',
                    borderRadius: '50%', backgroundColor: '#f87171', opacity: 0.75,
                    animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite',
                  }} />
                  <span style={{ position: 'relative', width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: dark ? '#f1f5f9' : '#1f2937' }}>
                  {formatTime(elapsed)}
                </span>
              </div>

              {/* Volume bars */}
              <div style={{ display: 'flex', alignItems: 'end', gap: 2, height: 28, marginLeft: 8 }}>
                {volumeBars.map((active, i) => (
                  <div key={i} style={{
                    width: 3, borderRadius: 2,
                    height: active ? Math.max(6, (i + 1) * 1.2) : 3,
                    background: active ? (i > 18 ? '#ef4444' : i > 12 ? '#ffb300' : '#00f0ff') : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                    transition: 'height 0.1s ease',
                  }} />
                ))}
              </div>

              {/* Mode badge */}
              <div style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                background: dark ? 'rgba(0,240,255,0.06)' : 'rgba(0,240,255,0.04)',
                color: '#00f0ff',
              }}>
                {captureMode === 'microphone' ? <Mic size={12} /> : <Monitor size={12} />}
                {captureMode === 'microphone' ? 'Mic' : 'System'}
              </div>
            </>
          )}
        </div>
        {speech.error && <p style={{ marginTop: 12, fontSize: 14, color: '#ef4444' }}>{speech.error}</p>}
      </div>

      {/* Live stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        {[
          { icon: Hash, label: 'Words', value: speech.wordCount, color: '#00f0ff' },
          { icon: Users, label: 'Speaker Shifts', value: speech.speakerChanges, color: '#ff00e5' },
          { icon: Gauge, label: 'Confidence', value: `${(speech.avgConfidence * 100).toFixed(0)}%`, color: '#39ff14' },
          { icon: Clock, label: 'Duration', value: formatTime(elapsed), color: '#8b5cf6' },
          { icon: Volume2, label: 'Volume', value: speech.volumeLevel, color: '#ffb300' },
          { icon: Zap, label: 'Segments', value: speech.transcript.length, color: '#00f0ff' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}12` }}>
              <Icon size={14} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: dark ? '#f1f5f9' : '#111827', margin: 0 }}>{value}</p>
              <p style={{ fontSize: 10, color: dark ? '#64748b' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Live transcript */}
      {(speech.transcript.length > 0 || speech.interimText) && (
        <div className="glass-card" style={{ maxHeight: 400, overflowY: 'auto', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wand2 size={14} color="#00f0ff" />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: dark ? '#64748b' : '#9ca3af' }}>
                Live Transcript
              </span>
            </div>
            <span style={{ fontSize: 12, color: dark ? '#475569' : '#d1d5db' }}>
              {speech.transcript.length} segments · {speech.wordCount} words
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {speech.transcript.map((chunk, i) => {
              const confColor = chunk.confidence > 0.9 ? '#39ff14' : chunk.confidence > 0.7 ? '#ffb300' : '#ef4444'
              const prevChunk = speech.transcript[i - 1]
              const isSpeakerChange = prevChunk && chunk.pitch_delta && chunk.pitch_delta > 15

              return (
                <div key={i}>
                  {isSpeakerChange && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0',
                      padding: '3px 10px', borderRadius: 6,
                      background: dark ? 'rgba(255,0,229,0.06)' : 'rgba(255,0,229,0.04)',
                    }}>
                      <Users size={11} color="#ff00e5" />
                      <span style={{ fontSize: 10, color: '#ff00e5', fontWeight: 600 }}>Speaker change detected</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#00f0ff', fontFamily: 'monospace', whiteSpace: 'nowrap', marginTop: 2, minWidth: 42 }}>
                      [{formatTime(chunk.time_offset)}]
                    </span>
                    <p style={{ fontSize: 14, color: dark ? '#e2e8f0' : '#374151', lineHeight: 1.6, flex: 1, margin: 0 }}>
                      {chunk.text}
                    </p>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                      background: confColor, boxShadow: `0 0 6px ${confColor}66`,
                    }} title={`${(chunk.confidence * 100).toFixed(0)}% confidence`} />
                  </div>
                </div>
              )
            })}
            {speech.interimText && (
              <p style={{ fontSize: 14, color: dark ? '#4b5563' : '#9ca3af', fontStyle: 'italic', paddingLeft: 50, margin: 0 }}>
                {speech.interimText}
              </p>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
      `}</style>
    </div>
  )
}