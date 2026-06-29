import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileVideo, Loader2, CheckCircle2 } from 'lucide-react'
import { useTheme } from '@/App'

interface Props { token: string; onAnalysisComplete: (result: any) => void }

export default function MediaVault({ token, onAnalysisComplete }: Props) {
  const navigate = useNavigate()
  const { dark } = useTheme()
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done'>('idle')

  const processFile = async (f: File) => {
    setFile(f)
    setStatus('uploading')

    // Simulate upload delay
    await new Promise(r => setTimeout(r, 2000))
    setStatus('analyzing')

    // Simulate analysis
    await new Promise(r => setTimeout(r, 1500))

    onAnalysisComplete({
      executive_summary: `Analysis of "${f.name}": Connect your FastAPI backend with Groq/Gemini API keys to get real AI analysis including speaker diarization, topic extraction, and coaching metrics.`,
      inferred_speakers: [
        { speaker_id: 'SPEAKER_A', inferred_identity: 'Speaker A (Presenter)', linguistic_markers: 'Leads discussion, introduces topics', confidence_score: 0.92 },
        { speaker_id: 'SPEAKER_B', inferred_identity: 'Speaker B (Participant)', linguistic_markers: 'Asks questions, provides feedback', confidence_score: 0.85 },
      ],
      conductor_coaching: { engagement_score: 78, monologue_percentage: 62, strengths: ['Clear topic transitions', 'Good use of examples'], improvement_areas: ['Allow more time for questions', 'Reduce monologue segments'] },
    })
    setStatus('done')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }, [])

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="glass-card"
      style={{
        padding: 32, transition: 'all 0.3s',
        boxShadow: dragging ? '0 0 30px rgba(0,240,255,0.3), inset 0 0 30px rgba(0,240,255,0.05)' : undefined,
        borderColor: dragging ? '#00f0ff' : undefined,
      }}
    >
      {status === 'idle' && (
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0', cursor: 'pointer' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,240,255,0.1)', transition: 'transform 0.2s',
            transform: dragging ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
          }}>
            <Upload size={28} color="#00f0ff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, color: dark ? '#e2e8f0' : '#1f2937' }}>Drop your recording here</p>
            <p style={{ marginTop: 4, fontSize: 14, color: dark ? '#64748b' : '#9ca3af' }}>MP4, M4A, WAV, MP3 — up to 500MB</p>
          </div>
          <input type="file" accept="audio/*,video/*" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} style={{ display: 'none' }} />
          <button type="button" onClick={() => navigate('/pricing')} className="neon-btn" style={{ marginTop: 8, fontSize: 14, border: 'none', cursor: 'pointer' }}>Browse Files</button>
        </label>
      )}

      {status === 'uploading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
          <FileVideo size={28} color="#00f0ff" />
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, color: dark ? '#e2e8f0' : '#1f2937' }}>{file?.name}</p>
          <div style={{ width: '100%', maxWidth: 280 }}>
            <div style={{ height: 8, width: '100%', borderRadius: 999, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div className="animate-slide-up" style={{ height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #00f0ff, #8b5cf6)', animation: 'grow 2s ease-out forwards' }} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: dark ? '#64748b' : '#9ca3af' }}>Uploading to secure storage…</p>
          <style>{`@keyframes grow { from { width: 0%; } to { width: 100%; } }`}</style>
        </div>
      )}

      {status === 'analyzing' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
          <Loader2 size={28} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, color: dark ? '#e2e8f0' : '#1f2937' }}>Analyzing…</p>
          <p style={{ fontSize: 12, color: dark ? '#64748b' : '#9ca3af' }}>Running speaker diarization & intelligence extraction</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {status === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '32px 0' }}>
          <CheckCircle2 size={28} color="#39ff14" />
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, color: dark ? '#e2e8f0' : '#1f2937' }}>Analysis Complete</p>
          <button onClick={() => { setStatus('idle'); setFile(null) }} style={{ fontSize: 14, color: '#00f0ff', background: 'none', border: 'none', cursor: 'pointer' }}>Upload another</button>
        </div>
      )}
    </div>
  )
}