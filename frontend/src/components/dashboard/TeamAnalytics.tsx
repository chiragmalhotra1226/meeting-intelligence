import { useTheme } from '@/App'
import {
  TrendingUp, TrendingDown, Minus, Users, Zap, Brain,
  AlertTriangle, ThumbsUp, Coffee, BarChart3, Activity,
} from 'lucide-react'

function StatCard({ icon: Icon, label, value, subtitle, color, dark }: any) {
  return (
    <div className="glass-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}15`,
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: dark ? '#64748b' : '#9ca3af' }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: dark ? '#f1f5f9' : '#111827' }}>
        {value}
      </p>
      {subtitle && (
        <p style={{ fontSize: 12, color: dark ? '#64748b' : '#9ca3af', marginTop: 4 }}>{subtitle}</p>
      )}
    </div>
  )
}

function MiniBar({ value, max, color, dark }: { value: number; max: number; color: string; dark?: boolean }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ height: 8, width: '100%', borderRadius: 4, background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 4, width: `${pct}%`,
        background: color, boxShadow: `0 0 8px ${color}44`,
        transition: 'width 0.8s ease',
      }} />
    </div>
  )
}

function safeDate(d: string): string {
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString()
  } catch {
    return '—'
  }
}

export default function TeamAnalytics({ token, meetings }: { token: string; meetings: any[] }) {
  const { dark } = useTheme()

  const analyzedMeetings = meetings.filter(m => m.status === 'analyzed')
  const totalMeetings = meetings.length
  const analyzedCount = analyzedMeetings.length

  const engagementScores = analyzedMeetings
    .map(m => m.coaching?.engagement_score)
    .filter((s): s is number => typeof s === 'number' && s > 0)
  const avgEngagement = engagementScores.length
    ? Math.round(engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length)
    : 0

  const monologueScores = analyzedMeetings
    .map(m => m.coaching?.monologue_percentage)
    .filter((s): s is number => typeof s === 'number' && s > 0)
  const avgMonologue = monologueScores.length
    ? Math.round(monologueScores.reduce((a, b) => a + b, 0) / monologueScores.length)
    : 0

  const now = Date.now()
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
  const thisWeekCount = meetings.filter(m => {
    try { return new Date(m.created_at).getTime() > oneWeekAgo } catch { return false }
  }).length

  const talkBalance = avgMonologue > 60 ? 'Imbalanced' : avgMonologue > 45 ? 'Moderate' : 'Balanced'
  const talkBalanceColor = avgMonologue > 60 ? '#ef4444' : avgMonologue > 45 ? '#ffb300' : '#39ff14'

  const fatigueRisk = thisWeekCount > 10 ? 'High' : thisWeekCount > 5 ? 'Medium' : 'Low'
  const fatigueColor = fatigueRisk === 'High' ? '#ef4444' : fatigueRisk === 'Medium' ? '#ffb300' : '#39ff14'

  const recentEngagement = engagementScores.slice(0, 3)
  const olderEngagement = engagementScores.slice(3, 6)
  const recentAvg = recentEngagement.length ? recentEngagement.reduce((a, b) => a + b, 0) / recentEngagement.length : 0
  const olderAvg = olderEngagement.length ? olderEngagement.reduce((a, b) => a + b, 0) / olderEngagement.length : 0
  const trendDirection = recentAvg > olderAvg + 5 ? 'improving' : recentAvg < olderAvg - 5 ? 'declining' : 'stable'
  const TrendIcon = trendDirection === 'improving' ? TrendingUp : trendDirection === 'declining' ? TrendingDown : Minus
  const trendColor = trendDirection === 'improving' ? '#39ff14' : trendDirection === 'declining' ? '#ef4444' : '#ffb300'

  // Max score for bar height calculation
  const maxScore = Math.max(...engagementScores, 100)
  const BAR_MAX_HEIGHT = 100 // pixels

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 700, color: '#00f0ff' }}>
        Team Analytics
      </h1>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <StatCard icon={BarChart3} label="Total Meetings" value={totalMeetings} subtitle={`${analyzedCount} analyzed`} color="#00f0ff" dark={dark} />
        <StatCard icon={Zap} label="Avg Engagement" value={`${avgEngagement}%`} subtitle={`Trend: ${trendDirection}`} color="#8b5cf6" dark={dark} />
        <StatCard icon={Users} label="Talk Balance" value={talkBalance} subtitle={`Host: ${avgMonologue}%`} color={talkBalanceColor} dark={dark} />
        <StatCard icon={Coffee} label="Fatigue Risk" value={fatigueRisk} subtitle={`${thisWeekCount} this week`} color={fatigueColor} dark={dark} />
      </div>

      {/* Engagement Trend */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Activity size={16} color={trendColor} />
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: dark ? '#f1f5f9' : '#111827' }}>
            Engagement Trend
          </h2>
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: `${trendColor}15`, color: trendColor,
          }}>
            <TrendIcon size={14} />
            {trendDirection}
          </div>
        </div>

        {engagementScores.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: BAR_MAX_HEIGHT + 30, padding: '0 4px' }}>
            {engagementScores.slice(0, 10).reverse().map((score, i) => {
              const barHeight = Math.max((score / maxScore) * BAR_MAX_HEIGHT, 6)
              const isRecent = i >= engagementScores.length - 3
              const barColor = isRecent ? '#00f0ff' : '#8b5cf6'
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: barColor }}>{score}%</span>
                  <div style={{
                    width: '100%', maxWidth: 44,
                    height: barHeight,
                    borderRadius: '6px 6px 2px 2px',
                    background: `linear-gradient(180deg, ${barColor} 0%, ${barColor}33 100%)`,
                    boxShadow: `0 0 10px ${barColor}44`,
                    transition: 'height 0.6s ease',
                  }} />
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 30, color: dark ? '#475569' : '#d1d5db', fontSize: 13 }}>
            Record more meetings to see engagement trends
          </div>
        )}
      </div>

      {/* Recent Meeting Scores */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: dark ? '#f1f5f9' : '#111827', marginBottom: 16 }}>
          Recent Meeting Scores
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {analyzedMeetings.slice(0, 5).map(m => {
            const eng = m.coaching?.engagement_score || 0
            const mono = m.coaching?.monologue_percentage || 0
            return (
              <div key={m.id}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: dark ? '#e2e8f0' : '#1f2937' }}>{m.title}</span>
                  <span style={{ fontSize: 12, color: dark ? '#64748b' : '#9ca3af' }}>
                    {safeDate(m.created_at)}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: dark ? '#64748b' : '#9ca3af' }}>Engagement</span>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: '#00f0ff' }}>{eng}%</span>
                    </div>
                    <MiniBar value={eng} max={100} color="#00f0ff" dark={dark} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: dark ? '#64748b' : '#9ca3af' }}>Monologue</span>
                      <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: mono > 60 ? '#ef4444' : mono > 0 ? '#ffb300' : (dark ? '#475569' : '#d1d5db') }}>{mono}%</span>
                    </div>
                    <MiniBar value={mono} max={100} color={mono > 60 ? '#ef4444' : mono > 0 ? '#ffb300' : (dark ? '#333' : '#e5e7eb')} dark={dark} />
                  </div>
                </div>
              </div>
            )
          })}
          {analyzedMeetings.length === 0 && (
            <p style={{ textAlign: 'center', padding: 20, color: dark ? '#475569' : '#d1d5db', fontSize: 13 }}>
              No analyzed meetings yet. Complete a recording session to see analytics.
            </p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Brain size={16} color="#8b5cf6" />
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: dark ? '#f1f5f9' : '#111827' }}>
            AI Recommendations
          </h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {avgMonologue > 55 && (
            <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 10, background: 'rgba(255,183,0,0.05)' }}>
              <AlertTriangle size={16} color="#ffb300" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: dark ? '#cbd5e1' : '#4b5563', lineHeight: 1.6, margin: 0 }}>
                Your average monologue percentage is {avgMonologue}%. Try asking open-ended questions earlier in meetings.
              </p>
            </div>
          )}
          {thisWeekCount > 7 && (
            <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.05)' }}>
              <Coffee size={16} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: dark ? '#cbd5e1' : '#4b5563', lineHeight: 1.6, margin: 0 }}>
                You've had {thisWeekCount} meetings this week. Consider consolidating recurring syncs.
              </p>
            </div>
          )}
          {avgEngagement > 70 && (
            <div style={{ display: 'flex', gap: 12, padding: 14, borderRadius: 10, background: 'rgba(57,255,20,0.05)' }}>
              <ThumbsUp size={16} color="#39ff14" style={{ marginTop: 2, flexShrink: 0 }} />
              <p style={{ fontSize: 13, color: dark ? '#cbd5e1' : '#4b5563', lineHeight: 1.6, margin: 0 }}>
                Great engagement scores! Your meetings are productive with an average of {avgEngagement}%.
              </p>
            </div>
          )}
          {avgEngagement === 0 && avgMonologue === 0 && (
            <p style={{ textAlign: 'center', padding: 16, color: dark ? '#475569' : '#d1d5db', fontSize: 13 }}>
              Complete your first meeting analysis to get personalized recommendations.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}