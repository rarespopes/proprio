import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { Input, Btn } from '../components/UI'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', monthly_income: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      await api.register({ name: form.name, email: form.email, password: form.password, monthly_income: parseFloat(form.monthly_income) || 0 })
      const data = await api.login({ email: form.email, password: form.password })
      localStorage.setItem('token', data.access_token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#e8e3da', padding: 24,
    }}>
      <div className="fade-up" style={{
        width: '100%', maxWidth: 440, background: 'var(--cream)',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 8px 48px rgba(26,23,20,0.14)',
      }}>
        <div style={{ background: 'var(--ink)', padding: '40px 40px 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: 'white', fontWeight: 400 }}>Proprio</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>Set up your personal finance workspace.</p>
        </div>

        <form onSubmit={submit} style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Your Name" placeholder="Rares" value={form.name} onChange={set('name')} required />
            <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
              <Input label="Confirm" type="password" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
            </div>
            <Input label="Monthly Net Income (€) — optional" type="number" placeholder="3200" value={form.monthly_income} onChange={set('monthly_income')} />
          </div>

          {error && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-pale)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

          <Btn type="submit" style={{ width: '100%', padding: 13, fontSize: 14, marginTop: 22 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </Btn>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--ink-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 500 }}>Sign in →</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
