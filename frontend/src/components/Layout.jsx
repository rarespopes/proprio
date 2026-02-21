import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api'

const nav = [
  { to: '/',            icon: '◈', label: 'Dashboard'   },
  { to: '/income',      icon: '↑', label: 'Income'       },
  { to: '/expenses',    icon: '↓', label: 'Expenses'     },
  { to: '/commitments', icon: '⬡', label: 'Commitments' },
  { to: '/goals',       icon: '◎', label: 'Goals'        },
]

export default function Layout() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.me().then(setUser).catch(() => {
      localStorage.removeItem('token')
      navigate('/login')
    })
  }, [])

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 220, background: 'var(--ink)', display: 'flex',
        flexDirection: 'column', flexShrink: 0, padding: '32px 0',
      }}>
        <div style={{ padding: '0 28px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: 'white', fontWeight: 500, letterSpacing: '0.02em' }}>Proprio</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Personal Finance</div>
        </div>

        <nav style={{ flex: 1, padding: '0 12px' }}>
          {nav.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', borderRadius: 'var(--radius-sm)',
              marginBottom: 2, fontSize: 13.5, fontWeight: 400,
              color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
              background: isActive ? 'rgba(193,125,60,0.2)' : 'transparent',
              transition: 'all 0.15s', textDecoration: 'none',
            })}>
              <span style={{ width: 18, textAlign: 'center', fontSize: 15 }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '20px 28px 0', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), #8b4513)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: 'white', fontWeight: 600, flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Personal account</div>
          </div>
          <button onClick={logout} title="Sign out" style={{
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
            fontSize: 16, cursor: 'pointer', padding: 4,
          }}>⎋</button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto', background: 'var(--cream)' }}>
        <Outlet context={{ user }} />
      </main>
    </div>
  )
}
