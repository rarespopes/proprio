import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Input, PageHeader, Modal, Spinner, EmptyState, Progress } from '../components/UI'

const ICONS = ['📁', '🏠', '💡', '💧', '📱', '🚗', '🏥', '📺', '🛡️', '🏦', '📦', '🔧']
const emptyForm = { name: '', icon: '🏠', monthly_budget: '' }

export default function Commitments() {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(false)
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function load() { const c = await api.getCommitments(); setItems(c) }
  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  function openNew() { setForm(emptyForm); setEditing(null); setError(''); setModal(true) }
  function openEdit(c) {
    setForm({ name: c.name, icon: c.icon, monthly_budget: String(c.monthly_budget) })
    setEditing(c.id); setError(''); setModal(true)
  }

  async function save() {
    if (!form.name) return setError('Name is required')
    setSaving(true); setError('')
    try {
      const payload = { name: form.name, icon: form.icon, monthly_budget: parseFloat(form.monthly_budget) || 0 }
      editing ? await api.updateCommitment(editing, payload) : await api.createCommitment(payload)
      setModal(false); await load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this commitment? Linked expenses will be unlinked.')) return
    await api.deleteCommitment(id); await load()
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const totalBudget = items.reduce((s, c) => s + c.monthly_budget, 0)
  const totalSpent  = items.reduce((s, c) => s + c.spent_this_month, 0)

  if (loading) return <Spinner />

  return (
    <div className="fade-up" style={{ padding: '0 0 40px' }}>
      <PageHeader title="Commitments" subtitle="Fixed monthly expenses — always accounted for">
        <Btn variant="primary" onClick={openNew}>+ New Commitment</Btn>
      </PageHeader>

      <div style={{ padding: '0 32px' }}>
        {items.length > 0 && (
          <Card style={{ marginBottom: 24, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: 4, fontWeight: 500 }}>Total Monthly Committed</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}>€{totalBudget.toFixed(2)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: 4, fontWeight: 500 }}>Spent This Month</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: totalSpent > totalBudget ? 'var(--danger)' : 'var(--positive)' }}>€{totalSpent.toFixed(2)}</div>
              </div>
            </div>
            <Progress value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}
              color={totalSpent > totalBudget ? 'var(--danger)' : 'var(--positive)'} />
          </Card>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {items.length === 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Card><EmptyState icon="⬡" message="No commitments yet. Add your fixed monthly costs — rent, utilities, subscriptions." /></Card>
            </div>
          )}

          {items.map(c => {
            const pct = c.monthly_budget > 0 ? Math.min((c.spent_this_month / c.monthly_budget) * 100, 100) : 0
            const over = c.monthly_budget > 0 && c.spent_this_month > c.monthly_budget
            return (
              <Card key={c.id}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 26 }}>{c.icon}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {over && <span style={{ fontSize: 11, background: 'var(--danger-pale)', color: 'var(--danger)', padding: '2px 8px', borderRadius: 50, fontWeight: 500 }}>Over</span>}
                    <button
                      onClick={() => openEdit(c)}
                      style={{ padding: '4px 12px', borderRadius: 50, fontSize: 12, fontWeight: 500, background: 'var(--stone)', border: '1px solid var(--stone-dark)', color: 'var(--ink-soft)', cursor: 'pointer', transition: 'all 0.12s' }}
                      onMouseEnter={ev => { ev.currentTarget.style.background = 'var(--ink)'; ev.currentTarget.style.color = 'white' }}
                      onMouseLeave={ev => { ev.currentTarget.style.background = 'var(--stone)'; ev.currentTarget.style.color = 'var(--ink-soft)' }}
                    >Edit</button>
                    <button
                      onClick={() => del(c.id)}
                      style={{ padding: '4px 12px', borderRadius: 50, fontSize: 12, fontWeight: 500, background: 'transparent', border: '1px solid var(--stone-dark)', color: 'var(--ink-faint)', cursor: 'pointer', transition: 'all 0.12s' }}
                      onMouseEnter={ev => { ev.currentTarget.style.background = 'var(--danger-pale)'; ev.currentTarget.style.color = 'var(--danger)'; ev.currentTarget.style.borderColor = 'var(--danger)' }}
                      onMouseLeave={ev => { ev.currentTarget.style.background = 'transparent'; ev.currentTarget.style.color = 'var(--ink-faint)'; ev.currentTarget.style.borderColor = 'var(--stone-dark)' }}
                    >Delete</button>
                  </div>
                </div>

                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 12 }}>€{c.monthly_budget.toFixed(2)} / month</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, marginBottom: 4 }}>€{c.spent_this_month.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 10 }}>spent this month</div>
                <Progress value={pct} color={over ? 'var(--danger)' : pct > 80 ? 'var(--accent)' : 'var(--positive)'} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{pct.toFixed(0)}%</span>
                  <span style={{ fontSize: 11, color: over ? 'var(--danger)' : 'var(--positive)', fontWeight: 500 }}>
                    {over ? `€${(c.spent_this_month - c.monthly_budget).toFixed(2)} over` : `€${(c.monthly_budget - c.spent_this_month).toFixed(2)} left`}
                  </span>
                </div>
              </Card>
            )
          })}

          {/* Ghost card */}
          <div onClick={openNew} style={{
            border: '2px dashed var(--stone-dark)', borderRadius: 'var(--radius)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 180, cursor: 'pointer', gap: 8,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={ev => ev.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={ev => ev.currentTarget.style.borderColor = 'var(--stone-dark)'}>
            <div style={{ fontSize: 24, color: 'var(--ink-faint)' }}>+</div>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>New Commitment</div>
          </div>
        </div>
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Commitment' : 'New Commitment'} onClose={() => setModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-soft)', marginBottom: 8, display: 'block', letterSpacing: '0.03em' }}>Icon</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {ICONS.map(ic => (
                  <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))} style={{
                    width: 38, height: 38, borderRadius: 'var(--radius-sm)', fontSize: 18,
                    border: form.icon === ic ? '2px solid var(--accent)' : '1.5px solid var(--stone-dark)',
                    background: form.icon === ic ? 'var(--accent-pale)' : 'white', cursor: 'pointer',
                  }}>{ic}</button>
                ))}
              </div>
            </div>
            <Input label="Name" placeholder="e.g. Rent, Netflix, Electricity" value={form.name} onChange={set('name')} autoFocus />
            <Input label="Monthly Budget (€)" type="number" placeholder="0.00" value={form.monthly_budget} onChange={set('monthly_budget')} />
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', background: 'var(--stone)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
              💡 Tag your expenses with this commitment to track spending against it each month.
            </div>
          </div>
          {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-pale)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
            <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
