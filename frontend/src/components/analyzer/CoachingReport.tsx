import { TrendingUp, MessageSquare, Target, Lightbulb } from 'lucide-react'
import { useTheme } from '@/App'

interface CoachingData {
  engagement_score?: number
  monologue_percentage?: number
  action_clarity?: number
  strengths?: string[]
  improvement_areas?: string[]
}

function MetricBar({ label, value, max, color, icon: Icon }: {
  label: string; value: number; max: number; color: string; icon: any
}) {
  const { dark } = useTheme()
  // Ensure value is a number to prevent NaN
  const safeValue = isNaN(value) || value === undefined ? 0 : value
  const pct = Math.min((safeValue / max) * 100, 100)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={14} color={color} />
          <span style={{ fontSize: 14, fontWeight: 500, color: dark ? '#cbd5e1' : '#374151' }}>{label}</span>
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: dark ? '#e2e8f0' : '#1f2937' }}>
          {safeValue.toFixed(0)}%
        </span>
      </div>
      <div style={{ height: 10, width: '100%', borderRadius: 999, background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999, width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, transparent 250%)`,
          boxShadow: `0 0 12px ${color}66`,
          transition: 'width 1s ease-out',
        }} />
      </div>
    </div>
  )
}

export default function CoachingReport({ coaching }: { coaching?: CoachingData }) {
  const { dark } = useTheme()
  
  // Provide fallback structure if coaching is empty
  const data = coaching || {
    engagement_score: 0,
    monologue_percentage: 0,
    action_clarity: 0,
    strengths: [],
    improvement_areas: []
  }

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: dark ? '#f1f5f9' : '#111827', marginBottom: 20 }}>
        Conductor EQ Report
      </h2>

      <MetricBar label="Engagement Score" value={data.engagement_score || 0} max={100} color="#00f0ff" icon={TrendingUp} />
      <MetricBar label="Monologue Index" value={data.monologue_percentage || 0} max={100} color="#ff00e5" icon={MessageSquare} />
      <MetricBar label="Action Clarity" value={data.action_clarity || 0} max={100} color="#39ff14" icon={Target} />

      {data.strengths && data.strengths.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: dark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
            <Lightbulb size={14} color="#39ff14" /> Strengths
          </h3>
          {data.strengths.map((s, i) => (
            <p key={i} style={{ fontSize: 14, color: dark ? '#94a3b8' : '#6b7280', paddingLeft: 24, marginBottom: 4 }}>• {s}</p>
          ))}
        </div>
      )}

      {data.improvement_areas && data.improvement_areas.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: dark ? '#cbd5e1' : '#374151', marginBottom: 8 }}>
            <Target size={14} color="#ffb300" /> Areas to Improve
          </h3>
          {data.improvement_areas.map((s, i) => (
            <p key={i} style={{ fontSize: 14, color: dark ? '#94a3b8' : '#6b7280', paddingLeft: 24, marginBottom: 4 }}>• {s}</p>
          ))}
        </div>
      )}
    </div>
  )
}