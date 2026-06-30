import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Mic, Clock, Brain, BarChart3, FileVideo, Lock, LogOut, Sun, Moon, Sparkles, X } from 'lucide-react';
import { useTheme } from '@/App';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const { user, signOut } = useSupabaseAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Live Capture', icon: Mic, path: '/dashboard/live' },
    { label: 'History', icon: Clock, path: '/dashboard/history' },
    { label: 'AI Search', icon: Brain, path: '/dashboard/search' },
    { label: 'Analytics', icon: BarChart3, path: '/dashboard/analytics' },
    { label: 'Session Analyzer', icon: FileVideo, path: '/analyzer' },
  ];

  const actionItems = [
    { label: 'Share Summary', icon: Lock, path: '/pricing', color: '#3b82f6' },
    { label: 'Mark Attendance', icon: Lock, path: '/pricing', color: '#10b981' },
    { label: 'Chrome Extension', icon: Lock, path: '/pricing', color: '#ef4444' },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    if (isMobile && onClose) onClose();
  };

  const mobileStyle: React.CSSProperties = isMobile ? {
    position: 'fixed',
    left: 0,
    top: 0,
    zIndex: 50,
    transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.28s ease',
    boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
  } : {};

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        className="glass-sidebar"
        style={{
          width: 256,
          display: 'flex',
          flexDirection: 'column',
          padding: 20,
          height: '100vh',
          ...mobileStyle,
        }}
      >
        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: 'linear-gradient(135deg, #00f0ff, #8b5cf6)' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 700, color: '#00f0ff' }}>MI</span>
          {/* Close button — mobile only */}
          {isMobile && (
            <button
              onClick={onClose}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} color={dark ? '#94a3b8' : '#6b7280'} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '12px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 500,
                background: location.pathname === item.path
                  ? (dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')
                  : 'transparent',
                color: dark ? '#94a3b8' : '#6b7280',
              }}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}

          {actionItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '12px 16px', borderRadius: 12,
                border: `1px solid ${item.color}33`, cursor: 'pointer',
                fontSize: 14, fontWeight: 500,
                background: `${item.color}0D`, color: item.color, marginTop: '8px',
              }}
            >
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)', color: '#00f0ff', fontWeight: 700 }}>
              {user
                ? (user.user_metadata?.full_name
                    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')
                    : (user.email ? user.email.charAt(0) : 'G')
                  ).toUpperCase()
                : 'G'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: dark ? '#f1f5f9' : '#0f172a' }}>
                {user?.user_metadata?.full_name || user?.email || 'Guest'}
              </span>
              <span style={{ fontSize: 12, color: dark ? '#94a3b8' : '#6b7280' }}>
                {user ? 'Signed in' : 'Not signed in'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div style={{ marginTop: 'auto', borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={toggle}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, background: 'transparent', color: dark ? '#94a3b8' : '#6b7280' }}
          >
            {dark ? <Sun size={16} color="#ffb300" /> : <Moon size={16} />} {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={async () => { if (user) { await signOut(); navigate('/login') } else { navigate('/login') } }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, background: 'transparent', color: '#ef4444' }}
          >
            <LogOut size={16} /> {user ? 'Sign Out' : 'Back to Login'}
          </button>
        </div>
      </aside>
    </>
  );
}
