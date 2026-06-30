import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTheme } from '@/App'
import { Sun, Moon, Mic, Brain, BarChart3 } from 'lucide-react'

export default function Login() {
  const { user, loading, signInWithGoogle } = useSupabaseAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const features = [
    { icon: Mic, label: 'Live transcription via Web Speech API', color: '#00f0ff' },
    { icon: Brain, label: 'Cross-meeting semantic search', color: '#8b5cf6' },
    { icon: BarChart3, label: 'AI coaching & action item extraction', color: '#ff00e5' },
  ]

  return (
    <div
      className="page-enter"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '1rem',
        position: 'relative',
      }}
    >
      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: 'fixed',
          right: 24,
          top: 24,
          zIndex: 50,
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          border: 'none',
          cursor: 'pointer',
        }}
        className="glass-card"
      >
        {dark ? <Sun size={18} color="#ffb300" /> : <Moon size={18} color="#8b5cf6" />}
      </button>

      {/* Login Card */}
      <div
        className="glass-card glow-border animate-slide-up"
        style={{ width: '100%', maxWidth: 440, padding: '2.5rem' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            className="animate-float"
            style={{
              margin: '0 auto 1rem',
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #00f0ff 0%, #8b5cf6 100%)',
              boxShadow: '0 0 30px rgba(0,240,255,0.4)',
            }}
          >
            <Brain size={32} color="#fff" />
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            <span className="text-gradient">Meeting Intelligence</span>
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: dark ? '#94a3b8' : '#6b7280' }}>
            Edge-powered workspace companion
          </p>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '2rem' }}>
          {features.map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 14,
                background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                color: dark ? '#cbd5e1' : '#374151',
              }}
            >
              <Icon size={16} color={color} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Auth Button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="neon-btn"
          style={{ width: '100%', fontSize: 16, padding: '14px 24px' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        {/* Dev mode bypass */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            width: '100%',
            marginTop: 12,
            padding: '10px 24px',
            borderRadius: 12,
            border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            background: 'transparent',
            color: dark ? '#94a3b8' : '#6b7280',
            fontSize: 14,
            cursor: 'pointer',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#00f0ff')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}
        >
          Enter Demo Mode →
        </button>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: dark ? '#4b5563' : '#9ca3af' }}>
          Zero infrastructure cost transcription. All processing on your device.
        </p>
      </div>
    </div>
  )
}