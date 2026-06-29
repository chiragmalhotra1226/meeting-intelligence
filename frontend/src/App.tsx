import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import Login from '@/pages/Login'
import LandingPage from './pages/LandingPage'
import Dashboard from '@/pages/Dashboard'
import SessionAnalyzer from '@/pages/SessionAnalyzer'
import PricingPage from './pages/PricingPage' 
import ContactPage from './pages/ContactPage'// 👈 ADDED: Import pricing route tier 

// ── Theme Context ───────────────────────────────────────────
interface ThemeCtx { dark: boolean; toggle: () => void }
const ThemeContext = createContext<ThemeCtx>({ dark: false, toggle: () => {} })
export const useTheme = () => useContext(ThemeContext)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('mi-theme') === 'dark' } catch { return false }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('mi-theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ── Background Blobs ────────────────────────────────────────
function Blobs() {
  return (
    <>
      <div className="bg-blob" style={{ width: 600, height: 600, top: -100, right: -200, background: 'radial-gradient(circle, #00f0ff 0%, transparent 70%)' }} />
      <div className="bg-blob" style={{ width: 500, height: 500, bottom: -100, left: -150, background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
      <div className="bg-blob" style={{ width: 400, height: 400, top: '40%', left: '50%', background: 'radial-gradient(circle, #ff00e5 0%, transparent 70%)' }} />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Blobs />
        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<PricingPage />} /> {/* 👈 ADDED: Explicit route context to register pricing component layout */}
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/contact" element={<ContactPage />} /> {/* 👈 ADDED */}
            <Route path="/analyzer" element={<SessionAnalyzer />} />
            <Route path="/analyzer/:id" element={<SessionAnalyzer />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}