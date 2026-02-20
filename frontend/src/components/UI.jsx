import { useState } from 'react'

export function Card({ children, style }) {
  return (
    <div style={{
      background: 'white', borderRadius: 'var(--radius)', padding: 24,
      boxShadow: 'var(--shadow)', border: '1px solid rgba(0,0,0,0.04)',
      ...style
    }}>
      {children}
    </div>
  )
}

export function Btn({ children, variant = 'primary', style, ...props }) {
  const base = {
    padding: '9px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
    fontSize: 13, fontWeight: 500, transition: 'all 0.15s', ...style
  }
  const variants = {
    primary: { background: 'var(--accent)', color: 'white' },
    outline: { background: 'transparent', color: 'var(--ink-soft)', border: '1px solid var(--stone-dark)' },
    danger:  { background: 'var(--danger-pale)', color: 'var(--danger)', border: '1px solid transparent' },
  }
  return <button style={{ ...base, ...variants[variant] }} {...props}>{children}</button>
}

export function Input({ label, ...props }) {
  return (
    <div>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-soft)', marginBottom: 6, display: 'block', letterSpacing: '0.03em' }}>{label}</label>}
      <input style={{
        width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
        border: '1.5px solid var(--stone-dark)', background: 'white',
        fontSize: 14, color: 'var(--ink)', outline: 'none',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
      onBlur={e => e.target.style.borderColor = 'var(--stone-dark)'}
      {...props} />
    </div>
  )
}

export function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-soft)', marginBottom: 6, display: 'block', letterSpacing: '0.03em' }}>{label}</label>}
      <select style={{
        width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
        border: '1.5px solid var(--stone-dark)', background: 'white',
        fontSize: 14, color: 'var(--ink)', outline: 'none', appearance: 'none',
      }} {...props}>{children}</select>
    </div>
  )
}

export function Progress({ value, color = 'var(--accent)' }) {
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div style={{ background: 'var(--stone)', borderRadius: 100, height: 7, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 100, background: color, width: `${pct}%`, transition: 'width 0.6s cubic-bezier(.22,.68,0,1.2)' }} />
    </div>
  )
}

export function Badge({ children, color = 'amber' }) {
  const colors = {
    amber: { background: 'var(--accent-pale)', color: 'var(--accent)' },
    green: { background: 'var(--positive-pale)', color: 'var(--positive)' },
    red:   { background: 'var(--danger-pale)', color: 'var(--danger)' },
    stone: { background: 'var(--stone)', color: 'var(--ink-muted)' },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
      borderRadius: 50, fontSize: 11, fontWeight: 500, ...colors[color]
    }}>{children}</span>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,23,20,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fade-up" style={{
        background: 'var(--cream)', borderRadius: 'var(--radius)', padding: 32,
        width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--ink-faint)', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{
      padding: '28px 32px 0', display: 'flex',
      alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24,
    }}>
      <div>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>}
    </div>
  )
}

export function EmptyState({ icon, message }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--ink-muted)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{message}</div>
    </div>
  )
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '2.5px solid var(--stone-dark)',
        borderTopColor: 'var(--accent)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
