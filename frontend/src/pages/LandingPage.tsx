import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/App'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'
import { Sparkles, Mic, Brain, ShieldAlert, Zap, ArrowRight, Activity, Sun, Moon, CreditCard, Share2, UserCheck } from 'lucide-react'
export default function LandingPage() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()
  const { user, signOut } = useSupabaseAuth()
  
  // 🎬 Track the exact cinematic animation phases
  // 'center-hero' -> 'center-header' -> 'docked-left'
  const [animationPhase, setAnimationPhase] = useState<'center-hero' | 'center-header' | 'docked-left'>('center-hero')

  useEffect(() => {
    // Phase 1: Wait 600ms centered, then quickly shoot up to the top header center
    const stage1 = setTimeout(() => {
      setAnimationPhase('center-header')
    }, 600)

    // Phase 2: Wait 700ms at the top center, then slide smoothly over to its left home
    const stage2 = setTimeout(() => {
      setAnimationPhase('docked-left')
    }, 1300)

    return () => {
      clearTimeout(stage1)
      clearTimeout(stage2)
    }
  }, [])

  // The entire page context reveals IMMEDIATELY when it hits the top header center!
  const shouldShowContent = animationPhase !== 'center-hero'

  const features = [
    {
      icon: <Mic size={24} color="#00f0ff" />,
      title: "Edge-Powered Capture",
      desc: "Zero-latency live transcript processing straight from your browser stream using high-accuracy speech matrix pipelines."
    },
    {
      icon: <Brain size={24} color="#8b5cf6" />,
      title: "Cross-Meeting Brain",
      desc: "Your entire meeting history gets deeply tokenized and vectorized into cloud storage. Ask your personal AI collective anything."
    },
    {
      icon: <ShieldAlert size={24} color="#ef4444" />,
      title: "Enterprise PII Scrubbing",
      desc: "Our automated data privacy layer sanitizes names, budgets, and keys instantly before any contextual processing occurs."
    },
    {
      icon: <Zap size={24} color="#ffb300" />,
      title: "Instant Action Matrix",
      desc: "No more parsing logs manually. Get contextual action item tracking boards generated immediately upon call wrap-up."
    },
    {
      icon: <Share2 size={24} color="#3b82f6" />,
      title: "Share Summary",
      desc: "Instantly distribute scrubbed executive summaries directly to stakeholders and team channels."
    },
    {
      icon: <UserCheck size={24} color="#10b981" />,
      title: "Mark Attendance",
      desc: "Automatically track speaker participation and log meeting attendance directly from the transcript."
    }
  ]

  // Dynamic colors based on theme context states
  const bgColor = dark ? '#0a0a12' : '#f8fafc'
  const textColor = dark ? '#f1f5f9' : '#0f172a'
  const subTextColor = dark ? '#94a3b8' : '#475569'
  const borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
  const cardBg = dark ? 'rgba(255,255,255,0.01)' : '#ffffff'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: bgColor,
      color: textColor,
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden',
      position: 'relative',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      {/* Background Blobs Only Visible in Dark Mode for aesthetic depth */}
      {dark && (
        <>
          <div style={{
            position: 'absolute', top: '-10%', left: '20%', width: '600px', height: '600px',
            background: 'radial-gradient(circle, rgba(0,240,255,0.07) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute', top: '40%', right: '-10%', width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none'
          }} />
        </>
      )}

      {/* ── HEADER ────────────────────────────────────────── */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 8%', borderBottom: `1px solid ${borderColor}`,
        minHeight: '85px'
      }}>
        {/* ── HEADER LOGO WITH TWO-STAGE ANIMATION EFFECTS ── */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12,
          // Fast, ultra-smooth curve for precise responsive motion
          transition: 'all 0.45s cubic-bezier(0.25, 1, 0.5, 1)', 

          ...(animationPhase === 'center-hero' ? {
              position: 'fixed',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%) scale(2.2)', // Stage 1: Initial large center presence
              zIndex: 999,
          } : animationPhase === 'center-header' ? {
              position: 'fixed',
              top: '42px', 
              left: '50%',
              transform: 'translate(-50%, -50%) scale(1.1)', // Stage 2: Snaps to top header bar but remains centered
              zIndex: 999,
          } : {
              position: 'relative',
              top: '0',
              left: '0',
              transform: 'translate(0, 0) scale(1)', // Final Stage: Docks over smoothly to the left layout grid
              zIndex: 1,
          })
        }}>
          <div style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 12, background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
            boxShadow: '0 0 20px rgba(0,240,255,0.3)'
          }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span style={{ 
            fontFamily: "'Syne', sans-serif", 
            fontSize: 22, 
            fontWeight: 800, 
            letterSpacing: '-0.5px', 
            color: textColor 
          }}>
            Meeting<span style={{ color: '#00f0ff' }}>Intelligence</span>
          </span>
        </div>

        {/* Action Controls Toolbar Row */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 16,
          marginLeft: 'auto', // 👈 FIX: Always forces controls row to dock right, regardless of logo position state
          opacity: shouldShowContent ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: shouldShowContent ? 'auto' : 'none'
        }}>
          <button 
            onClick={toggle}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 8, borderRadius: '50%', color: textColor,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {dark ? <Sun size={20} color="#ffb300" /> : <Moon size={20} color="#475569" />}
          </button>

          {user ? (
            <button 
              onClick={async () => { await signOut(); navigate('/login') }} 
              style={{
                background: 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(139,92,246,0.15))', 
                border: `1px solid ${dark ? 'rgba(0,240,255,0.3)' : 'rgba(0,240,255,0.5)'}`,
                color: '#00f0ff', padding: '8px 20px', borderRadius: '10px', fontSize: '14px',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Sign Out
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')} 
              style={{
                background: dark ? 'rgba(255,255,255,0.03)' : '#0f172a', 
                border: `1px solid ${borderColor}`,
                color: '#fff', padding: '8px 20px', borderRadius: '10px', fontSize: '14px',
                fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────── */}
<section style={{
  display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
  padding: '100px 20px 60px 20px', maxWidth: '900px', margin: '0 auto',
  opacity: shouldShowContent ? 1 : 0,
  transform: shouldShowContent ? 'translateY(0)' : 'translateY(15px)',
  transition: 'opacity 0.4s ease, transform 0.4s ease'
}}>
  

  <h1 style={{
    fontFamily: "'Syne', sans-serif", fontSize: 'clamp(36px, 6vw, 64px)', 
    fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '24px'
  }}>
    Transform Conversations Into <br />
    <span style={{
      background: 'linear-gradient(90deg, #00f0ff, #8b5cf6, #00f0ff)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      backgroundSize: '200% auto', animation: 'shine 4s linear infinite'
    }}>
      Actionable Intelligence
    </span>
  </h1>

  <p style={{
    fontSize: 'clamp(16px, 2.5vw, 19px)', color: subTextColor, lineHeight: 1.6,
    maxWidth: '640px', marginBottom: '40px'
  }}>
    An edge-powered workspace companion designed to scrub PII, extract multi-meeting summaries, map real-time topic timelines, and query your organizational memory instantly.
  </p>

  {/* 👇 Updated "View Plans & Pricing" to be the larger, filled primary button */}
  <button 
    onClick={() => navigate('/pricing')}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      background: '#00f0ff',
      color: '#0f172a', // Dark text for high contrast on cyan background
      border: 'none', 
      padding: '16px 36px', 
      borderRadius: '12px',
      fontSize: '16px', 
      fontWeight: 600, 
      cursor: 'pointer',
      width: '100%',
      maxWidth: '340px', // Matches standard hero action width
      boxShadow: '0 0 30px rgba(0,240,255,0.25)', 
      marginBottom: '16px', 
      transition: 'transform 0.2s, boxShadow 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
  >
    <CreditCard size={18} /> View Plans & Pricing
  </button>

  {/* 👇 Updated "Launch Workspace App" to be the transparent/outlined button */}
  <button 
    onClick={async () => {
      if (user) {
        await signOut()
        navigate('/login')
      } else {
        navigate('/login')
      }
    }}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      background: 'transparent',
      color: dark ? '#cbd5e1' : '#334155', 
      border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
      padding: '12px 36px', 
      borderRadius: '12px',
      fontSize: '15px', 
      fontWeight: 500, 
      cursor: 'pointer',
      width: '100%',
      maxWidth: '340px',
      transition: 'all 0.2s'
    }}
    onMouseEnter={e => e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    {user ? 'Enter Your Workspace' : 'Take a Look'} <ArrowRight size={16} />
  </button>
</section>

      {/* ── FEATURES GRID ────────────────────────────────── */}
      <section style={{ 
        padding: '60px 8% 120px 8%', maxWidth: '1200px', margin: '0 auto',
        opacity: shouldShowContent ? 1 : 0,
        transition: 'opacity 0.4s ease'
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px'
        }}>
          {features.map((f, i) => (
            <div 
              key={i} 
              style={{
                background: cardBg, 
                border: `1px solid ${borderColor}`,
                padding: '32px', borderRadius: '16px', transition: 'all 0.3s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                if (dark) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  e.currentTarget.style.borderColor = 'rgba(0,240,255,0.15)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.background = cardBg
                e.currentTarget.style.borderColor = borderColor
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: dark ? 'rgba(255,255,255,0.03)' : '#f1f5f9', display: 'flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
              }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: '14px', color: subTextColor, lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes shine {
          to { background-position: 200% center; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.8; box-shadow: 0 0 12px rgba(0,240,255,0.2); }
          50% { opacity: 1; box-shadow: 0 0 24px rgba(0,240,255,0.4); }
        }
        .glow-pulse { animation: pulseGlow 3s infinite ease-in-out; }
      `}</style>
    </div>
  )
}