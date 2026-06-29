import { useTheme } from '@/App'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Globe, Shield, Mic } from 'lucide-react'
// removed unused auth hook; Sidebar handles auth actions
import Sidebar from '@/components/dashboard/Sidebar'


export default function ExtensionGuide() {
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const steps = [
    { num: '1', title: 'Download the Extension', desc: 'Click the button below to download the extension pack.' },
    { num: '2', title: 'Unzip the Folder', desc: 'Right-click the downloaded .zip file → Extract All → Choose a location you\'ll remember.' },
    { num: '3', title: 'Open Chrome Extensions', desc: 'Type chrome://extensions in your address bar and press Enter.' },
    { num: '4', title: 'Enable Developer Mode', desc: 'Toggle the "Developer mode" switch in the top-right corner.' },
    { num: '5', title: 'Load the Extension', desc: 'Click "Load unpacked" → Navigate to the extracted folder → Select the folder that contains manifest.json → Click Open.' },
    { num: '6', title: 'Pin the Extension', desc: 'Click the puzzle icon in Chrome toolbar → Find "Meeting Intelligence Capture" → Click the pin icon.' },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />

      <main style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 700, margin: '0 auto' }}>

        <button
          onClick={() => navigate('/dashboard')}
          className="glass-card"
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', marginBottom: 24 }}
        >
          <ArrowLeft size={18} color={dark ? '#cbd5e1' : '#4b5563'} />
        </button>

        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          <span style={{ color: '#00f0ff' }}>Chrome Extension Setup</span>
        </h1>
        <p style={{ fontSize: 14, color: dark ? '#64748b' : '#9ca3af', marginBottom: 32 }}>
          Capture audio directly from Zoom, Google Meet & Teams — no microphone routing needed.
        </p>

      {/* Download button */}
      <a
        href="/mi-chrome-extension.zip"
        download="mi-chrome-extension.zip"
        className="neon-btn"
        style={{ textDecoration: 'none', width: '100%', padding: '16px 24px', fontSize: 16, marginBottom: 32 }}
      >
        <Download size={20} />
        Download Extension Pack (.zip)
      </a>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {steps.map(({ num, title, desc }) => (
          <div key={num} className="glass-card" style={{ padding: 20, display: 'flex', gap: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
              color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 14,
            }}>
              {num}
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: dark ? '#f1f5f9' : '#111827', margin: '0 0 4px' }}>{title}</h3>
              <p style={{ fontSize: 13, color: dark ? '#94a3b8' : '#6b7280', lineHeight: 1.5, margin: 0 }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="glass-card" style={{ padding: 24, marginTop: 32 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: dark ? '#f1f5f9' : '#111827', marginBottom: 16 }}>
          How It Works
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: Globe, text: 'Open any Zoom, Google Meet, or Teams call in Chrome', color: '#00f0ff' },
            { icon: Mic, text: 'Click the MI extension icon → Start Recording', color: '#8b5cf6' },
            { icon: Shield, text: 'Audio is captured directly from the tab — crystal clear, no echo', color: '#39ff14' },
          ].map(({ icon: Icon, text, color }, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon size={16} color={color} />
              <span style={{ fontSize: 13, color: dark ? '#cbd5e1' : '#4b5563' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
      </main>
    </div>
  )
}