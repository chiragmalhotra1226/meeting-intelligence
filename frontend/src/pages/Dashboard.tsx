import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { useTheme } from '@/App'
import { Lock, Menu } from 'lucide-react'
import {
  Brain, ArrowLeft, FileText,
  Activity, BarChart3,
} from 'lucide-react'
import HarvesterConsole from '@/components/dashboard/HarvesterConsole'
import BrainChat from '@/components/dashboard/BrainChat'
import TeamAnalytics from '@/components/dashboard/TeamAnalytics'
import CoachingReport from '@/components/analyzer/CoachingReport'
import { apiFetch } from '@/lib/utils'
import Sidebar from '@/components/dashboard/Sidebar'


type Tab = 'record' | 'history' | 'brain' | 'analytics'

export default function Dashboard() {
  const { session } = useSupabaseAuth()
  const { dark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState<Tab>('record')
  const [meetings, setMeetings] = useState<any[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)
  const [, setLoadingMeetings] = useState(true)
  const [viewMode, setViewMode] = useState<'live' | 'archive'>('live')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const token = session?.access_token || 'demo-token'

  const fetchMeetings = () => {
    if (!token || token === 'demo-token') return
    apiFetch('/api/meetings/list', {}, token)
      .then(data => setMeetings(data || []))
      .catch(() => setMeetings([]))
      .finally(() => setLoadingMeetings(false))
  }

  useEffect(() => {
    if (token && token !== 'demo-token') fetchMeetings()
    else setLoadingMeetings(false)
  }, [token])

  useEffect(() => {
    // sync tab with route subpath
    const p = location.pathname
    if (p.startsWith('/dashboard/history')) {
      handleTabChange('history')
      setViewMode('archive')
    } else if (p.startsWith('/dashboard/search')) {
      handleTabChange('brain')
    } else if (p.startsWith('/dashboard/analytics')) {
      handleTabChange('analytics')
    } else {
      // default /dashboard or /dashboard/live
      handleTabChange('record')
      setViewMode('live')
    }
  }, [location.pathname])

  useEffect(() => {
    // when switching to archive view with no selected meeting, open a demo session
    if (viewMode === 'archive' && !selectedMeeting) {
      setSelectedMeeting(DEMO_SESSIONS[0])
    }
  }, [viewMode, selectedMeeting])

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab)
    if (newTab === 'record') {
      setViewMode('live')
      setSelectedMeeting(null)
    }
  }

  const DEMO_SESSIONS = [
  {
    id: '1',
    title: 'Q3 Product Roadmap Sync',
    date: 'Today',
    duration: '45 min',
    preview: 'Discussed the integration of the new AI search pipeline and timeline for Q4 deployment...',
    summary: 'The team successfully aligned on the vector search implementation strategy. The new pipeline is expected to reduce latency by 40%.',
    type: 'standard',
    status: 'analyzed',
    topic_timeline: [{ topic_label: 'Product Infrastructure' }],
    action_items: ['Update vector index', 'Finalize Q4 roadmap'],
    coaching: { engagement_score: 85 }
  },
  {
    id: '2',
    title: 'Design System Audit',
    date: 'Yesterday',
    duration: '30 min',
    preview: 'Reviewed color palette consistency across the main landing page and dashboard.',
    summary: 'Identified inconsistencies in the primary brand color usage. Proposed a unified CSS variable strategy.',
    type: 'standard',
    status: 'analyzed',
    topic_timeline: [{ topic_label: 'Design System' }],
    action_items: ['Consolidate CSS variables'],
    coaching: { engagement_score: 92 }
  },
  {
    id: '3',
    title: 'Customer Success: Alpha Corp',
    date: 'Last Week',
    duration: '60 min',
    preview: 'Walked the client through the dashboard setup and API keys...',
    summary: 'Alpha Corp confirmed they are ready to proceed with the API integration pending final documentation.',
    type: 'standard',
    status: 'analyzed',
    topic_timeline: [{ topic_label: 'Client Integration' }],
    action_items: ['Send documentation', 'Schedule follow-up'],
    coaching: { engagement_score: 78 }
  }
];
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main Workspace ─────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 24, backgroundColor: dark ? '#06060c' : '#f8fafc' }}>

        {/* Hamburger — mobile only */}
        <button
          onClick={() => setSidebarOpen(true)}
          style={{
            display: 'none',
            position: 'fixed', top: 16, left: 16, zIndex: 30,
            background: dark ? 'rgba(255,255,255,0.08)' : '#ffffff',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: 10, padding: '8px 10px', cursor: 'pointer',
          }}
          className="mobile-menu-btn"
        >
          <Menu size={20} color={dark ? '#94a3b8' : '#334155'} />
        </button>

        {/* ── LIVE / ARCHIVE CAPTURE ───────────────────── */}
        {tab === 'record' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: '#00f0ff' }}>
                {viewMode === 'live' ? 'Live Capture Workspace' : `📂 ${selectedMeeting?.title || 'Meeting Archive'}`}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={(e) => {
    e.stopPropagation(); // Prevents the parent from opening the file modal
    navigate('/pricing');}}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                    borderRadius: 10, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    background: dark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                    color: dark ? '#cbd5e1' : '#334155', cursor: 'pointer', fontWeight: 500, fontSize: 13,
                    transition: 'all 0.2s'
                  }}
                >
                  <Lock size={14} color="#ef4444" /> Browse Files
                </button>

                {viewMode === 'archive' && (
                  <button
                    onClick={() => { setViewMode('live'); setSelectedMeeting(null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                      borderRadius: 10, border: 'none', background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                      color: dark ? '#cbd5e1' : '#334155', cursor: 'pointer', fontWeight: 500, fontSize: 13,
                    }}
                  >
                    <ArrowLeft size={16} /> Back to Live Capture
                  </button>
                )}
              </div>
            </div>

            {/* Live mode: show recorder */}
            {viewMode === 'live' ? (
              <HarvesterConsole
                token={token}
                onSessionComplete={(meeting: any) => {
                  setSelectedMeeting(meeting)
                  fetchMeetings()
                }}
              />
            ) : (
              /* Archive mode: show AI summary panel */
              <div style={{
                background: dark ? 'rgba(255,255,255,0.01)' : '#ffffff',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
                padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#8b5cf6' }}>
                  <Brain size={20} />
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 600, margin: 0 }}>
                    Executive Summary
                  </h2>
                </div>
                <p style={{
                  margin: 0, fontSize: 14, lineHeight: 1.7,
                  color: dark ? '#cbd5e1' : '#4b5563', whiteSpace: 'pre-wrap',
                }}>
                  {selectedMeeting?.summary || 'No summary available for this meeting.'}
                </p>

                {/* Metadata cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 12 }}>
                  <div style={{ padding: 16, background: 'rgba(0,240,255,0.02)', borderRadius: 12, border: '1px solid rgba(0,240,255,0.1)' }}>
                    <div style={{ fontSize: 12, color: '#00f0ff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={14} /> Primary Topic
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, color: dark ? '#e2e8f0' : '#1f2937' }}>
                      {selectedMeeting?.topic_timeline?.[0]?.topic_label || 'General Discussion'}
                    </div>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(139,92,246,0.02)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.1)' }}>
                    <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} /> Action Items
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, color: dark ? '#e2e8f0' : '#1f2937' }}>
                      {selectedMeeting?.action_items?.length || 0} tasks tracked
                    </div>
                  </div>
                  <div style={{ padding: 16, background: 'rgba(57,255,20,0.02)', borderRadius: 12, border: '1px solid rgba(57,255,20,0.1)' }}>
                    <div style={{ fontSize: 12, color: '#39ff14', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BarChart3 size={14} /> Engagement
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginTop: 4, color: dark ? '#e2e8f0' : '#1f2937' }}>
                      {selectedMeeting?.coaching?.engagement_score || '—'}%
                    </div>
                  </div>
                </div>

                {/* Speakers */}
                {selectedMeeting?.speakers && selectedMeeting.speakers.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: dark ? '#94a3b8' : '#6b7280', marginBottom: 8 }}>
                      Identified Speakers
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {selectedMeeting.speakers.map((s: any, i: number) => (
                        <div key={i} style={{
                          display: 'flex', alignItems: 'center', gap: 12, borderRadius: 12,
                          padding: 12, background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700,
                          }}>{String(i + 1)}</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: dark ? '#e2e8f0' : '#1f2937' }}>{s.name || s.inferred_identity || 'Speaker'}</p>
                            <p style={{ margin: 0, fontSize: 12, color: dark ? '#64748b' : '#9ca3af' }}>{s.role || s.linguistic_markers || ''}</p>
                          </div>
                          <span style={{ fontSize: 12, color: '#39ff14' }}>{s.confidence ? `${(s.confidence * 100).toFixed(0)}%` : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <CoachingReport coaching={selectedMeeting?.coaching} />

              </div>
            )}

          </div>
        )}
        {/* ── HISTORY ─────────────────────── */}
        {tab === 'history' && (
          <div className="animate-slide-up">
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#00f0ff' }}>
              Meeting History
            </h1>
            <p style={{ marginTop: 0, marginBottom: 24, fontSize: 14, lineHeight: 1.7, color: dark ? '#94a3b8' : '#64748b' }}>
              Browse your saved sessions and archived summaries here. Click any meeting card to load its analysis, topics, action items, and coaching insights.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {(meetings && meetings.length ? meetings : DEMO_SESSIONS).map((m: any) => (
                <div key={m.id} className="glass-card" style={{ padding: 16, cursor: 'pointer' }} onClick={() => { setSelectedMeeting(m); setViewMode('archive');setTab('record'); }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{m.title}</h3>
                      <p style={{ margin: 0, fontSize: 13, color: dark ? '#94a3b8' : '#6b7280' }}>{m.date} • {m.duration}</p>
                    </div>
                    <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 700 }}>{m.type === 'demo' ? 'Demo' : ''}</div>
                  </div>
                  <p style={{ marginTop: 8, fontSize: 13, color: dark ? '#cbd5e1' : '#475569' }}>{m.preview}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI SEARCH ──────────────────────── */}
        {tab === 'brain' && (
          <div className="animate-slide-up">
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#00f0ff' }}>
              Cross-Meeting Brain
            </h1>
            <BrainChat token={token} />
          </div>
        )}

        {/* ── ANALYTICS ──────────────────────── */}
        {tab === 'analytics' && (
          <div className="animate-slide-up">
            <TeamAnalytics token={token} meetings={meetings && meetings.length ? meetings : DEMO_SESSIONS} />
          </div>
        )}
      </main>
    </div>
  )
}