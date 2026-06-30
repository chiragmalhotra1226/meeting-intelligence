import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useTheme } from '@/App'
import { ArrowLeft, Menu } from 'lucide-react'
import MediaVault from '@/components/analyzer/MediaVault'
import CoachingReport from '@/components/analyzer/CoachingReport'
import Sidebar from '@/components/dashboard/Sidebar'

export default function SessionAnalyzer() {
  const { session } = useSupabaseAuth()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const token = session?.access_token || 'demo-token'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: dark ? '#0f172a' : '#f8fafc' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>

        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{ background: dark ? 'rgba(15,23,42,0.9)' : 'rgba(248,250,252,0.9)' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            <Menu size={22} color={dark ? '#94a3b8' : '#334155'} />
          </button>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#00f0ff' }}>Session Analyzer</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 24 }}>
          <button onClick={() => navigate('/dashboard')} className="glass-card" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={18} color={dark ? '#cbd5e1' : '#4b5563'} />
          </button>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700 }}>
            <span style={{ color: dark ? '#f1f5f9' : '#111827' }}>Session Analyzer</span>
          </h1>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, padding: '0 24px 24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          {analysisResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Executive Summary */}
              <div className="glass-card" style={{ padding: 24 }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Executive Summary</h2>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: dark ? '#cbd5e1' : '#4b5563' }}>
                  {analysisResult.executive_summary || "No summary available for this session."}
                </p>
              </div>

              {/* Coaching Metrics */}
              <CoachingReport coaching={analysisResult.conductor_coaching} />

              {/* Transcription */}
              <div className="glass-card" style={{ padding: 24 }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Meeting Transcript</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {analysisResult.transcription?.length > 0 ? (
                    analysisResult.transcription.map((line: any, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 12 }}>
                        <span style={{ color: '#00f0ff', fontSize: 13, fontFamily: 'monospace' }}>[{line.time || '0:00'}]</span>
                        <span style={{ fontWeight: 600, fontSize: 14, color: dark ? '#e2e8f0' : '#374151' }}>{line.speaker}:</span>
                        <span style={{ fontSize: 14, color: dark ? '#94a3b8' : '#6b7280' }}>{line.text}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ fontSize: 14, color: '#64748b' }}>No transcription data found.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <MediaVault token={token} onAnalysisComplete={setAnalysisResult} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}