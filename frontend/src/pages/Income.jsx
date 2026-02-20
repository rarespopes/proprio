import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Input, Select, PageHeader, Modal, Spinner, EmptyState, Badge } from '../components/UI'

const SOURCES = ['Salary', 'Freelance', 'Rental', 'Investment', 'Gift', 'Other']
const sourceColors = { Salary: 'green', Freelance: 'amber', Rental: 'amber', Investment: 'green', Gift: 'stone', Other: 'stone' }
const sourceIcons  = { Salary: '💼', Freelance: '🧑‍💻', Rental: '🏠', Investment: '📈', Gift: '🎁', Other: '💰' }

function today() { return new Date().toISOString().split('T')[0] }
const emptyForm = { amount: '', source: 'Salary', description: '', date: today() }

export default function Income() {
  const [items, setItems]       = useState([])
  const [goals, setGoals]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState(emptyForm)
  const [allocations, setAllocs] = useState([])   // [{goal_id, amount, note}]
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function load() {
    const [inc, g] = await Promise.all([api.getIncome(), api.getGoals()])
    setItems(inc); setGoals(g)
  }
  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  function openNew() {
    setForm(emptyForm); setAllocs([]); setEditing(null); setError(''); setModal(true)
  }
  function openEdit(item) {
    setForm({ amount: String(item.amount), source: item.source, description: item.description, date: item.date })
    setAllocs([]); setEditing(item.id); setError(''); setModal(true)
  }

  // Allocation helpers
  function addAlloc() {
    if (goals.length === 0) return
    setAllocs(a => [...a, { goal_id: goals[0].id, amount: '', note: '' }])
  }
  function setAlloc(i, k, v) {
    setAllocs(a => a.map((x, idx) => idx === i ? { ...x, [k]: v } : x))
  }
  function removeAlloc(i) { setAllocs(a => a.filter((_, idx) => idx !== i)) }

  const totalAllocated = allocations.reduce((s, a) => s + (parseFloat(a.amount) || 0), 0)
  const remaining = (parseFloat(form.amount) || 0) - totalAllocated

  async function save() {
    if (!form.description || !form.amount) return setError('Description and amount are required')
    if (remaining < 0) return setError('Allocations exceed income amount')
    setSaving(true); setError('')
    try {
      if (editing) {
        await api.updateIncome(editing, {
          amount: parseFloat(form.amount),
          source: form.source,
          description: form.description,
          date: form.date,
        })
      } else {
        await api.createIncome({
          amount: parseFloat(form.amount),
          source: form.source,
          description: form.description,
          date: form.date,
          allocations: allocations
            .filter(a => a.amount > 0)
            .map(a => ({ goal_id: parseInt(a.goal_id), amount: parseFloat(a.amount), note: a.note }))
        })
      }
      setModal(false); await load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this income entry?')) return
    await api.deleteIncome(id); await load()
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Monthly totals
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthTotal = items.filter(i => i.date.startsWith(month)).reduce((s, i) => s + i.amount, 0)
  const allTotal   = items.reduce((s, i) => s + i.amount, 0)

  if (loading) return <Spinner />

  return (
    <div className="fade-up" style={{ padding: '0 0 40px' }}>
      <PageHeader title="Income" subtitle={`${items.length} entries logged`}>
        <Btn variant="primary" onClick={openNew}>+ Log Income</Btn>
      </PageHeader>

      <div style={{ padding: '0 32px' }}>
        {/* Summary row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <Card>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: 8, fontWeight: 500 }}>This Month</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: 'var(--positive)' }}>+€{monthTotal.toFixed(2)}</div>
          </Card>
          <Card>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-muted)', marginBottom: 8, fontWeight: 500 }}>All Time</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: 'var(--ink)' }}>€{allTotal.toFixed(2)}</div>
          </Card>
        </div>

        <Card>
          {items.length === 0
            ? <EmptyState icon="↑" message="No income logged yet. Add your first entry!" />
            : items.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 12px', borderRadius: 'var(--radius-sm)',
                transition: 'background 0.12s', cursor: 'pointer',
              }}
              onMouseEnter={ev => ev.currentTarget.style.background = 'var(--stone)'}
              onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
              onClick={() => openEdit(item)}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--positive-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {sourceIcons[item.source] || '💰'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{item.description}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>{item.date}</span>
                    <span>·</span>
                    <Badge color={sourceColors[item.source] || 'stone'}>{item.source}</Badge>
                    {item.allocations?.length > 0 && (
                      <><span>·</span><span style={{ color: 'var(--accent)' }}>→ {item.allocations.length} goal{item.allocations.length > 1 ? 's' : ''}</span></>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--positive)' }}>+€{item.amount.toFixed(2)}</div>
                <button onClick={ev => { ev.stopPropagation(); del(item.id) }}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 16, padding: '0 4px', cursor: 'pointer' }}
                  onMouseEnter={ev => ev.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={ev => ev.currentTarget.style.color = 'var(--ink-faint)'}>×</button>
              </div>
            ))
          }
        </Card>
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Income' : 'Log Income'} onClose={() => setModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Description" placeholder="e.g. February salary" value={form.description} onChange={set('description')} autoFocus />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Amount (€)" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} />
              <Input label="Date" type="date" value={form.date} onChange={set('date')} />
            </div>
            <Select label="Source" value={form.source} onChange={set('source')}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </Select>

            {/* Goal allocations — only for new entries */}
            {!editing && goals.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-soft)', letterSpacing: '0.03em' }}>
                    Allocate to Goals <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <button onClick={addAlloc} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>+ Add</button>
                </div>

                {allocations.map((a, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 24px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <select value={a.goal_id} onChange={e => setAlloc(i, 'goal_id', e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--stone-dark)', fontSize: 13, background: 'white', outline: 'none' }}>
                      {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <input type="number" placeholder="€0" value={a.amount} onChange={e => setAlloc(i, 'amount', e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--stone-dark)', fontSize: 13, outline: 'none' }} />
                    <button onClick={() => removeAlloc(i)} style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                ))}

                {allocations.length > 0 && (
                  <div style={{ fontSize: 12, color: remaining < 0 ? 'var(--danger)' : 'var(--ink-muted)', marginTop: 4 }}>
                    Remaining after allocation: <strong>€{remaining.toFixed(2)}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-pale)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
            <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Log Income'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
