import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../api'
import { Input, Btn } from '../components/UI'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const data = await api.login(form)
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
        width: '100%', maxWidth: 420, background: 'var(--cream)',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 8px 48px rgba(26,23,20,0.14)',
      }}>
        <div style={{ background: 'var(--ink)', padding: '40px 40px 32px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: 'white', fontWeight: 400, letterSpacing: '0.02em' }}>Ledger</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>Personal finance, thoughtfully tracked.</p>
        </div>

        <form onSubmit={submit} style={{ padding: '32px 40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required />
          </div>

          {error && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-pale)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

          <Btn type="submit" style={{ width: '100%', padding: 13, fontSize: 14, marginTop: 22 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </Btn>

          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'var(--ink-muted)' }}>
            No account yet?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 500 }}>Create one →</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
