import { useState } from 'react'
import { CheckCircle2, Clock, ArrowRight, Check, Upload, ExternalLink } from 'lucide-react'
import { useTheme } from '@/App'

interface ActionItem {
  task_id?: string
  id?: number
  action_description?: string
  task_description?: string
  assigned_to: string
  implied_deadline?: string
  deadline?: string
  priority?: string
  status?: string
}

const COLUMNS = [
  { key: 'pending', label: 'To Do', color: '#ffb300', icon: Clock },
  { key: 'in_progress', label: 'In Progress', color: '#00f0ff', icon: ArrowRight },
  { key: 'done', label: 'Done', color: '#39ff14', icon: CheckCircle2 },
]

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#ffb300',
  low: '#39ff14',
}

type ExportFormat = 'jira' | 'notion' | 'trello'

function formatExport(task: ActionItem, format: ExportFormat): string {
  const desc = task.action_description || task.task_description || ''
  const dl = task.implied_deadline || task.deadline || 'TBD'
  const assignee = task.assigned_to || 'Unassigned'
  const priority = task.priority || 'medium'

  if (format === 'jira') {
    return `h3. ${desc}\n\n*Assigned to:* ${assignee}\n*Deadline:* ${dl}\n*Priority:* ${priority}\n*Source:* Meeting Intelligence Auto-Extract\n\n{panel:title=Context}\nExtracted from meeting transcript via AI analysis.\n{panel}`
  }
  if (format === 'notion') {
    return `## ${desc}\n\n- **Assigned to:** ${assignee}\n- **Deadline:** ${dl}\n- **Priority:** ${priority}\n- **Source:** Meeting Intelligence\n\n> Extracted from meeting transcript via AI analysis.`
  }
  // trello
  return `${desc}\n\nAssigned: ${assignee}\nDeadline: ${dl}\nPriority: ${priority}\n\n---\nAuto-extracted by Meeting Intelligence`
}

export default function WorkItemsBoard({ items, token }: { items: ActionItem[]; token: string }) {
  const { dark } = useTheme()
  const [tasks, setTasks] = useState<(ActionItem & { status: string })[]>(
    items.map(t => ({ ...t, status: t.status || 'pending' }))
  )
  const [copied, setCopied] = useState<string | null>(null)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null)

  if (!tasks.length) return null

  const moveTask = (idx: number, newStatus: string) => {
    setTasks(prev => prev.map((t, i) => i === idx ? { ...t, status: newStatus } : t))
  }

  const handleExport = (task: ActionItem, format: ExportFormat) => {
    const formatted = formatExport(task, format)
    navigator.clipboard.writeText(formatted)
    const id = task.task_id || task.action_description || task.task_description || ''
    setCopied(`${id}-${format}`)
    setShowExportMenu(null)
    setTimeout(() => setCopied(null), 2500)
  }

  const exportAll = (format: ExportFormat) => {
    const all = tasks.map(t => formatExport(t, format)).join('\n\n---\n\n')
    navigator.clipboard.writeText(all)
    setCopied(`all-${format}`)
    setTimeout(() => setCopied(null), 2500)
  }

  const getDesc = (t: ActionItem) => t.action_description || t.task_description || 'No description'
  const getDl = (t: ActionItem) => t.implied_deadline || t.deadline

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: dark ? '#f1f5f9' : '#111827' }}>
          Action Items
        </h2>

        {/* Bulk export buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['jira', 'notion', 'trello'] as ExportFormat[]).map(fmt => (
            <button
              key={fmt}
              onClick={() => exportAll(fmt)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                background: 'transparent', cursor: 'pointer',
                color: copied === `all-${fmt}` ? '#39ff14' : (dark ? '#94a3b8' : '#6b7280'),
                transition: 'all 0.2s',
              }}
            >
              {copied === `all-${fmt}` ? <Check size={12} /> : <ExternalLink size={12} />}
              {copied === `all-${fmt}` ? 'Copied!' : `Export ${fmt}`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key)
          const Icon = col.icon
          return (
            <div key={col.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Icon size={14} color={dark ? '#64748b' : '#9ca3af'} />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: dark ? '#64748b' : '#9ca3af' }}>
                  {col.label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: dark ? '#475569' : '#d1d5db' }}>{colTasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {colTasks.map((task, i) => {
                  const globalIdx = tasks.indexOf(task)
                  const taskKey = task.task_id || getDesc(task)
                  const priorityColor = PRIORITY_COLORS[task.priority || 'medium'] || '#ffb300'

                  return (
                    <div
                      key={i}
                      style={{
                        borderRadius: 12, borderLeft: `3px solid ${col.color}`,
                        background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
                        padding: 16, position: 'relative',
                      }}
                    >
                      {/* Priority badge */}
                      {task.priority && (
                        <span style={{
                          position: 'absolute', top: 8, right: 8,
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                          padding: '2px 6px', borderRadius: 4,
                          background: `${priorityColor}20`, color: priorityColor,
                        }}>
                          {task.priority}
                        </span>
                      )}

                      <p style={{ fontSize: 14, color: dark ? '#e2e8f0' : '#1f2937', paddingRight: task.priority ? 50 : 0 }}>
                        {getDesc(task)}
                      </p>

                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#8b5cf6' }}>{task.assigned_to}</span>
                        {getDl(task) && (
                          <span style={{ fontSize: 12, color: dark ? '#64748b' : '#9ca3af' }}>
                            {new Date(getDl(task)!).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {col.key !== 'done' && (
                          <button
                            onClick={() => moveTask(globalIdx, col.key === 'pending' ? 'in_progress' : 'done')}
                            style={{ fontSize: 12, color: '#00f0ff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Move →
                          </button>
                        )}

                        {/* Export dropdown */}
                        <div style={{ marginLeft: 'auto', position: 'relative' }}>
                          <button
                            onClick={() => setShowExportMenu(showExportMenu === taskKey ? null : taskKey)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                              color: dark ? '#64748b' : '#9ca3af', background: 'none',
                              border: 'none', cursor: 'pointer', padding: 0,
                            }}
                          >
                            <Upload size={12} /> Export
                          </button>

                          {showExportMenu === taskKey && (
                            <div style={{
                              position: 'absolute', bottom: '100%', right: 0, marginBottom: 4,
                              background: dark ? '#1e1e30' : '#fff',
                              border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                              borderRadius: 8, padding: 4, zIndex: 10, minWidth: 120,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            }}>
                              {(['jira', 'notion', 'trello'] as ExportFormat[]).map(fmt => (
                                <button
                                  key={fmt}
                                  onClick={() => handleExport(task, fmt)}
                                  style={{
                                    display: 'block', width: '100%', textAlign: 'left',
                                    padding: '6px 10px', fontSize: 12, border: 'none',
                                    background: 'transparent', cursor: 'pointer', borderRadius: 4,
                                    color: dark ? '#cbd5e1' : '#374151',
                                  }}
                                  onMouseEnter={e => (e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  {copied === `${taskKey}-${fmt}` ? '✓ Copied!' : `Copy as ${fmt.charAt(0).toUpperCase() + fmt.slice(1)}`}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}