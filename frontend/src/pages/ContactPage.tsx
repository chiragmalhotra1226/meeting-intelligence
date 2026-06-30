import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/App'

export default function ContactPage() {
  const navigate = useNavigate()
  const { dark } = useTheme()
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    state: '',
    nationality: '',
    companyName: '',     // 🚀 Added
    teamSize: '',        // 🚀 Added
    primaryUseCase: ''   // 🚀 Added
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validation check for all required inputs
    if (
      formData.name && formData.phone && formData.city && formData.state && 
      formData.nationality && formData.companyName && formData.teamSize && formData.primaryUseCase
    ) {
      setSubmitted(true)
    }
  }

  const bgColor = dark ? '#0a0a12' : '#f8fafc'
  const textColor = dark ? '#f1f5f9' : '#0f172a'
  const cardBg = dark ? 'rgba(255,255,255,0.03)' : '#ffffff'
  const inputBg = dark ? 'rgba(255,255,255,0.05)' : '#ffffff'
  const borderColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'
  const labelColor = dark ? '#94a3b8' : '#475569'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: bgColor,
      color: textColor,
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div className="contact-card" style={{
        background: cardBg,
        border: `1px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        {!submitted ? (
          <>
            <h2 style={{ fontFamily: "'Syne', sans-serif", marginBottom: '8px', fontSize: '24px', fontWeight: 700 }}>
              Complete Registration
            </h2>
            <p style={{ fontSize: '14px', color: labelColor, marginBottom: '28px' }}>
              Provide your details below to finalize your access setup.
            </p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              {/* Row 1: Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Full Name</label>
                <input 
                  type="text" required value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: textColor, outline: 'none' }}
                />
              </div>

              {/* Row 2: Company Name & Phone */}
              <div className="mobile-stack" style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Company Name</label>
                  <input 
                    type="text" required value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: textColor, outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Phone Number</label>
                  <input 
                    type="tel" required value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: textColor, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Row 3: Team Size & Use Case (Dropdowns) */}
              <div className="mobile-stack" style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Expected Workspace Size</label>
                  <select 
                    required value={formData.teamSize}
                    onChange={e => setFormData({...formData, teamSize: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: textColor, outline: 'none' }}
                  >
                    <option value="" disabled style={{ backgroundColor: bgColor }}>Select size...</option>
                    <option value="1" style={{ backgroundColor: bgColor }}>Just me (1)</option>
                    <option value="2-10" style={{ backgroundColor: bgColor }}>2 - 10 members</option>
                    <option value="11-50" style={{ backgroundColor: bgColor }}>11 - 50 members</option>
                    <option value="51+" style={{ backgroundColor: bgColor }}>Enterprise (51+)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Primary Use Case</label>
                  <select 
                    required value={formData.primaryUseCase}
                    onChange={e => setFormData({...formData, primaryUseCase: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: textColor, outline: 'none' }}
                  >
                    <option value="" disabled style={{ backgroundColor: bgColor }}>Select core focus...</option>
                    <option value="Engineering / Agile" style={{ backgroundColor: bgColor }}>Engineering / Development</option>
                    <option value="Executive Summaries" style={{ backgroundColor: bgColor }}>Executive Governance</option>
                    <option value="Legal PII Scrubbing" style={{ backgroundColor: bgColor }}>Data Compliance / Legal</option>
                    <option value="General Consulting" style={{ backgroundColor: bgColor }}>Consultancy Operations</option>
                  </select>
                </div>
              </div>

              {/* Row 4: City & State */}
              <div className="mobile-stack" style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>City</label>
                  <input 
                    type="text" required value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: textColor, outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>State</label>
                  <input 
                    type="text" required value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: textColor, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Row 5: Nationality */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Nationality</label>
                <input 
                  type="text" required value={formData.nationality}
                  onChange={e => setFormData({...formData, nationality: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: `1px solid ${borderColor}`, backgroundColor: inputBg, color: textColor, outline: 'none' }}
                />
              </div>

              <button 
                type="submit"
                style={{
                  width: '100%', padding: '14px', borderRadius: '8px', background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)',
                  color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '12px', fontSize: '15px'
                }}
              >
                Submit Request
              </button>
            </form>
          </>
        ) : (
          <div style={{ padding: '20px 0' }}>
            
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '22px', marginBottom: '12px', fontWeight: 700 }}>Our team will reach out to you shortly.</h3>
            
            <button 
              onClick={() => navigate('/')}
              style={{
                padding: '10px 20px', borderRadius: '8px', background: 'rgba(0,240,255,0.1)', 
                color: '#00f0ff', border: '1px solid rgba(0,240,255,0.2)', fontWeight: 500, cursor: 'pointer'
              }}
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}