import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/App'
import { Check, Sparkles, ArrowRight } from 'lucide-react'

export default function PricingPage() {
  const navigate = useNavigate()
  const { dark } = useTheme()

  const tiers = [
    {
      name: "Developer",
      price: "$19", // 👈 Updated
      period: "per month", // 👈 Updated
      desc: "Perfect for indie hackers, builders, and testing out browser transcripts.",
      features: [
        "Live Transcription via Web Speech API",
        "Up to 300 minutes per month",
        "Local memory caching",
        "Standard PII scrubbing basic layer",
        "Community support matrix"
      ],
      cta: "Buy Now",
      popular: false,
      accent: "#00f0ff"
    },
    {
      name: "Professional",
      price: "$49", // 👈 Updated
      period: "per month", // 👈 Updated
      desc: "Deep historical cross-meeting vectorized memory for power users and squads.",
      features: [
        "Everything in Developer tier",
        "Unlimited transcription audio streams",
        "Full Cross-Meeting Vector Semantic Search",
        "Advanced Executive Summary Generation",
        "Contextual Jira/Markdown Action Item Boards",
        "Priority live matrix engine pipelines"
      ],
      cta: "Go Pro",
      popular: true,
      accent: "#8b5cf6"
    },
    {
      name: "Enterprise",
      price: "Get a Quote", // 👈 Updated
      period: "tailored scaling",
      desc: "Dedicated instances, custom PII regulatory scrubbing filters, and SLA support.",
      features: [
        "Everything in Professional tier",
        "Self-hosted secure cloud cloud options",
        "Automated custom PII sanitizer dictionary",
        "Dedicated token/vector storage pipelines",
        "Custom LLM fine-tuning weights integration",
        "24/7 dedicated support team access"
      ],
      cta: "Get a Quote",
      popular: false,
      accent: "#ff00e5"
    }
  ]

  const bgColor = dark ? '#0a0a12' : '#f8fafc'
  const textColor = dark ? '#f1f5f9' : '#0f172a'
  const subTextColor = dark ? '#94a3b8' : '#475569'
  const borderColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
  const cardBg = dark ? 'rgba(255,255,255,0.02)' : '#ffffff'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: bgColor,
      color: textColor,
      fontFamily: "'Inter', sans-serif",
      padding: '80px 8% 120px 8%',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      {/* Visual background enhancements matching branding themes */}
      {dark && (
        <>
          <div style={{ position: 'absolute', top: '-10%', right: '10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,240,255,0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        </>
      )}

      {/* Header Context */}
      <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px auto' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: 'transparent', border: 'none', color: '#00f0ff', fontSize: '14px', 
            fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '24px'
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '16px' }}>
          Predictable Pricing for <br />
          <span style={{ background: 'linear-gradient(90deg, #00f0ff, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Unbounded Intelligence
          </span>
        </h1>
        <p style={{ fontSize: '16px', color: subTextColor, lineHeight: 1.6 }}>
          All processing scales dynamically with no hidden metrics. Pick a layer that matches your data pipeline capacity requirements.
        </p>
      </div>

      {/* Tiers Layout Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
        alignItems: 'start'
      }}>
        {tiers.map((t, idx) => (
          <div 
            key={idx}
            style={{
              background: cardBg,
              border: t.popular ? `2px solid #8b5cf6` : `1px solid ${borderColor}`,
              borderRadius: '24px',
              padding: '40px 32px',
              position: 'relative',
              boxShadow: t.popular ? '0 0 40px rgba(139,92,246,0.15)' : 'none',
              transition: 'transform 0.2s ease'
            }}
          >
            {t.popular && (
              <div style={{
                position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)', color: '#fff',
                padding: '4px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4
              }}>
                <Sparkles size={12} /> Most Popular
              </div>
            )}

            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
              {t.name}
            </h3>
            <p style={{ fontSize: '14px', color: subTextColor, minHeight: '44px', lineHeight: 1.5, marginBottom: '24px' }}>
              {t.desc}
            </p>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: '32px' }}>
              <span style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-1px' }}>{t.price}</span>
              <span style={{ fontSize: '14px', color: subTextColor }}>/ {t.period}</span>
            </div>

            <button 
            onClick={() => navigate('/contact')} // 👈 Make sure this points to /contact
            style={{
                width: '100%', padding: '14px', borderRadius: '14px', fontSize: '15px', fontWeight: 600,
                cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: t.popular ? 'linear-gradient(135deg, #00f0ff, #8b5cf6)' : (dark ? 'rgba(255,255,255,0.04)' : '#0f172a'),
                color: '#fff', transition: 'opacity 0.2s'
            }}
            >
            {t.cta} <ArrowRight size={16} />
            </button>

            <div style={{ width: '100%', height: '1px', backgroundColor: borderColor, margin: '32px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {t.features.map((f, fIdx) => (
                <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: dark ? 'rgba(0,240,255,0.1)' : 'rgba(0,240,255,0.06)', marginTop: '2px', flexShrink: 0
                  }}>
                    <Check size={12} color={t.accent} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '14px', color: dark ? '#cbd5e1' : '#334155', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}