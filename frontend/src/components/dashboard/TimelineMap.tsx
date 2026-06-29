import { formatTime } from '@/lib/utils'
import { useTheme } from '@/App'

const COLORS = [
  { bg: '#00f0ff', label: '#00f0ff' },
  { bg: '#ff00e5', label: '#ff00e5' },
  { bg: '#8b5cf6', label: '#8b5cf6' },
  { bg: '#39ff14', label: '#39ff14' },
  { bg: '#ffb300', label: '#ffb300' },
]

interface TimelineEntry { start_time: number; end_time: number; topic_label: string }

export default function TimelineMap({ timeline }: { timeline: TimelineEntry[] }) {
  const { dark } = useTheme()
  if (!timeline.length) return null
  const total = Math.max(...timeline.map(t => t.end_time), 1)

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: dark ? '#f1f5f9' : '#111827', marginBottom: 16 }}>
        Topic Timeline
      </h2>

      {/* Bar */}
      <div style={{ display: 'flex', height: 40, width: '100%', overflow: 'hidden', borderRadius: 12 }}>
        {timeline.map((entry, i) => {
          const width = ((entry.end_time - entry.start_time) / total) * 100
          const color = COLORS[i % COLORS.length]
          return (
            <div
              key={i}
              style={{
                width: `${width}%`, background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'filter 0.2s', opacity: 0.85,
              }}
              title={entry.topic_label}
              onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.3)')}
              onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
            >
              {width > 15 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.3)', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.topic_label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {timeline.map((entry, i) => {
          const color = COLORS[i % COLORS.length]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: color.bg }} />
              <span style={{ color: dark ? '#cbd5e1' : '#4b5563' }}>
                {formatTime(entry.start_time)}–{formatTime(entry.end_time)}
              </span>
              <span style={{ fontWeight: 600, color: color.label }}>{entry.topic_label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}