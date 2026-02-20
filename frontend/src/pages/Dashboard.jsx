import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api'
import { Card, PageHeader, Progress, Spinner } from '../components/UI'

function KPI({ label, value, sub, subColor, dark }) {
  return (
    <Card style={dark ? { background: 'var(--ink)', border: 'none' } : {}}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: dark ? 'rgba(255,255,255,0.4)' : 'var(--ink-muted)', marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 500, color: dark ? 'white' : 'var(--ink)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, marginTop: 6, color: subColor || (dark ? 'rgba(255,255,255,0.4)' : 'var(--ink-muted)') }}>{sub}</div>}
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useOutletContext()
  const [stats, setStats] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = now.toLocaleString('en', { month: 'long', year: 'numeric' })

  useEffect(() => {
    Promise.all([
      api.dashboard(month),
      api.getExpenses({ month }),
    ]).then(([s, e]) => {
      setStats(s); setExpenses(e.slice(0, 6))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  const categories = Object.entries(stats?.by_category || {}).sort((a, b) => b[1] - a[1])
  const catColors = ['var(--accent)', 'var(--positive)', 'var(--ink-muted)', 'var(--ink-faint)']

  return (
    <div className="fade-up" style={{ padding: '0 0 40px' }}>
      <PageHeader
        title={`Good ${greeting()}, ${user?.name?.split(' ')[0] || ''}.`}
        subtitle={`${monthLabel} — your financial overview`}
      />

      <div style={{ padding: '0 32px' }}>

        {/* Total Balance — hero card */}
        <div style={{ marginBottom: 16 }}>
          <Card style={{ background: 'linear-gradient(135deg, var(--ink) 0%, #2c261e 100%)', border: 'none', padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontWeight: 500 }}>Total Balance</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 400, color: 'white', lineHeight: 1 }}>
                  €{stats?.total_balance?.toFixed(2) || '0.00'}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                  All-time income minus all expenses
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', gap: 32 }}>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Total In</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: 'var(--accent-light)' }}>+€{stats?.total_income_all_time?.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Total Out</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: '#e8a0a0' }}>−€{stats?.total_expenses_all_time?.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Monthly KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <KPI label="Income This Month"
            value={`€${stats?.income_this_month?.toFixed(2) || '0.00'}`}
            sub="Logged income"
            subColor="var(--positive)" />
          <KPI label="Expenses This Month"
            value={`€${stats?.expenses_this_month?.toFixed(2) || '0.00'}`}
            sub="Total spending" />
          <KPI label="Funded to Goals"
            value={`€${stats?.goals_funded_this_month?.toFixed(2) || '0.00'}`}
            sub="Allocated this month"
            subColor="var(--accent)" />
          <KPI label="Free Cash"
            value={`€${stats?.free_cash_this_month?.toFixed(2) || '0.00'}`}
            sub="Income − expenses − goals"
            subColor={stats?.free_cash_this_month >= 0 ? 'var(--positive)' : 'var(--danger)'} />
        </div>

        {/* Commitments strip */}
        {stats?.commitments?.length > 0 && (
          <Card style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Commitments This Month</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {stats.commitments.map(c => (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{c.icon} {c.name}</span>
                    <span style={{ fontSize: 12, color: c.pct_used > 100 ? 'var(--danger)' : 'var(--ink-muted)' }}>
                      €{c.spent_this_month.toFixed(0)} / €{c.monthly_budget.toFixed(0)}
                    </span>
                  </div>
                  <Progress
                    value={c.pct_used}
                    color={c.pct_used > 100 ? 'var(--danger)' : c.pct_used > 80 ? 'var(--accent)' : 'var(--positive)'}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>By Category</div>
            {categories.length === 0
              ? <div style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', padding: '20px 0' }}>No expenses this month</div>
              : categories.slice(0, 5).map(([cat, amt], i) => (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: catColors[i] || '#ccc', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{cat}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>€{amt.toFixed(2)}</span>
                  </div>
                  <Progress value={stats.expenses_this_month > 0 ? (amt / stats.expenses_this_month) * 100 : 0} color={catColors[i] || '#ccc'} />
                </div>
              ))
            }
          </Card>

          {/* Recent transactions */}
          <Card>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Recent Transactions</div>
            {expenses.length === 0
              ? <div style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', padding: '20px 0' }}>No transactions yet</div>
              : expenses.map(e => (
                <div key={e.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 10px', borderRadius: 'var(--radius-sm)', transition: 'background 0.12s',
                }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'var(--stone)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {catIcon(e.category)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{e.category}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--danger)', flexShrink: 0 }}>−€{e.amount.toFixed(2)}</div>
                </div>
              ))
            }
          </Card>
        </div>
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
}

function catIcon(cat = '') {
  const c = cat.toLowerCase()
  if (c.includes('food') || c.includes('din') || c.includes('groc')) return '🛒'
  if (c.includes('trans') || c.includes('fuel')) return '🚌'
  if (c.includes('util') || c.includes('elec')) return '⚡'
  if (c.includes('entert') || c.includes('sub')) return '🎬'
  if (c.includes('health') || c.includes('medi')) return '💊'
  if (c.includes('educ')) return '📚'
  return '💳'
}
