import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Input, Select, PageHeader, Modal, Spinner, EmptyState, Badge } from '../components/UI'

const CATEGORIES = ['Food & Dining', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Education', 'Shopping', 'Personal', 'Other']
function today() { return new Date().toISOString().split('T')[0] }
const emptyForm = { description: '', amount: '', category: 'Food & Dining', date: today(), notes: '', commitment_id: '' }

export default function Expenses() {
  const [expenses, setExpenses]     = useState([])
  const [commitments, setCommitments] = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(false)
  const [form, setForm]             = useState(emptyForm)
  const [editing, setEditing]       = useState(null)
  const [filterCat, setFilterCat]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  async function load() {
    const [e, c] = await Promise.all([
      api.getExpenses(filterCat ? { category: filterCat } : {}),
      api.getCommitments()
    ])
    setExpenses(e); setCommitments(c)
  }
  useEffect(() => { load().finally(() => setLoading(false)) }, [filterCat])

  function openNew() { setForm(emptyForm); setEditing(null); setError(''); setModal(true) }
  function openEdit(e) {
    setForm({ description: e.description, amount: String(e.amount), category: e.category, date: e.date, notes: e.notes || '', commitment_id: e.commitment_id || '' })
    setEditing(e.id); setError(''); setModal(true)
  }

  async function save() {
    if (!form.description || !form.amount) return setError('Description and amount are required')
    setSaving(true); setError('')
    try {
      const payload = { ...form, amount: parseFloat(form.amount), commitment_id: form.commitment_id ? parseInt(form.commitment_id) : null }
      editing ? await api.updateExpense(editing, payload) : await api.createExpense(payload)
      setModal(false); await load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this expense?')) return
    await api.deleteExpense(id); await load()
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  if (loading) return <Spinner />

  return (
    <div className="fade-up" style={{ padding: '0 0 40px' }}>
      <PageHeader title="Expenses" subtitle={`${expenses.length} transactions`}>
        <Btn variant="primary" onClick={openNew}>+ Add Expense</Btn>
      </PageHeader>

      <div style={{ padding: '0 32px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {['', ...CATEGORIES].map(cat => (
            <button key={cat || 'all'} onClick={() => setFilterCat(cat)} style={{
              padding: '4px 12px', borderRadius: 50, fontSize: 12, fontWeight: 500,
              border: '1px solid var(--stone-dark)', cursor: 'pointer', transition: 'all 0.12s',
              background: filterCat === cat ? 'var(--ink)' : 'white',
              color: filterCat === cat ? 'white' : 'var(--ink-soft)',
            }}>{cat || 'All'}</button>
          ))}
        </div>

        <Card>
          {expenses.length === 0
            ? <EmptyState icon="↓" message="No expenses yet. Add your first one!" />
            : expenses.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 12px', borderRadius: 'var(--radius-sm)', transition: 'background 0.12s', cursor: 'pointer' }}
                onMouseEnter={ev => ev.currentTarget.style.background = 'var(--stone)'}
                onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                onClick={() => openEdit(e)}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                  {catIcon(e.category)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{e.description}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-muted)', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>{e.date}</span><span>·</span><span>{e.category}</span>
                    {e.commitment_name && <><span>·</span><Badge color="amber">{e.commitment_name}</Badge></>}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--danger)' }}>−€{e.amount.toFixed(2)}</div>
                <button onClick={ev => { ev.stopPropagation(); del(e.id) }}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', fontSize: 16, padding: '0 4px', cursor: 'pointer' }}
                  onMouseEnter={ev => ev.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={ev => ev.currentTarget.style.color = 'var(--ink-faint)'}>×</button>
              </div>
            ))
          }
        </Card>
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Expense' : 'Add Expense'} onClose={() => setModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Description" placeholder="e.g. Lidl groceries" value={form.description} onChange={set('description')} autoFocus />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Amount (€)" type="number" step="0.01" placeholder="0.00" value={form.amount} onChange={set('amount')} />
              <Input label="Date" type="date" value={form.date} onChange={set('date')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="Category" value={form.category} onChange={set('category')}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </Select>
              <Select label="Commitment" value={form.commitment_id} onChange={set('commitment_id')}>
                <option value="">— None —</option>
                {commitments.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </Select>
            </div>
            <Input label="Notes (optional)" placeholder="Any extra detail…" value={form.notes} onChange={set('notes')} />
          </div>
          {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-pale)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
            <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Add Expense'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
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
