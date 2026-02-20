import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Input, PageHeader, Modal, Spinner, EmptyState, Progress, Badge } from '../components/UI'

const emptyForm = { name: '', target: '', saved: '', deadline: '', monthly_target: '' }
function today() { return new Date().toISOString().split('T')[0] }

export default function Goals() {
  const [goals, setGoals]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [allocModal, setAllocModal] = useState(null) // goal object
  const [form, setForm]         = useState(emptyForm)
  const [allocForm, setAllocForm] = useState({ amount: '', date: today(), note: '' })
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function load() { const g = await api.getGoals(); setGoals(g) }
  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  function openNew() { setForm(emptyForm); setEditing(null); setError(''); setModal(true) }
  function openEdit(g) {
    setForm({ name: g.name, target: String(g.target), saved: String(g.saved), deadline: g.deadline || '', monthly_target: String(g.monthly_target || '') })
    setEditing(g.id); setError(''); setModal(true)
  }

  async function save() {
    if (!form.name || !form.target) return setError('Name and target are required')
    setSaving(true); setError('')
    try {
      const payload = { name: form.name, target: parseFloat(form.target), saved: parseFloat(form.saved) || 0, deadline: form.deadline, monthly_target: parseFloat(form.monthly_target) || 0 }
      editing ? await api.updateGoal(editing, payload) : await api.createGoal(payload)
      setModal(false); await load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function saveAlloc() {
    if (!allocForm.amount) return
    setSaving(true)
    try {
      await api.allocateToGoal(allocModal.id, {
        amount: parseFloat(allocForm.amount),
        date: allocForm.date,
        note: allocForm.note,
      })
      setAllocModal(null)
      setAllocForm({ amount: '', date: today(), note: '' })
      await load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this goal?')) return
    await api.deleteGoal(id); await load()
  }

  const set  = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const setA = (k) => (e) => setAllocForm(f => ({ ...f, [k]: e.target.value }))

  function badge(pct) {
    if (pct >= 90) return { color: 'green', label: 'Almost there!' }
    if (pct >= 50) return { color: 'amber', label: 'On track' }
    return { color: 'stone', label: 'In progress' }
  }

  if (loading) return <Spinner />

  const [hero, ...rest] = goals

  return (
    <div className="fade-up" style={{ padding: '0 0 40px' }}>
      <PageHeader title="Goals" subtitle={goals.length > 0 ? `${goals.length} active goal${goals.length !== 1 ? 's' : ''}` : 'Set your first savings goal'}>
        <Btn variant="primary" onClick={openNew}>+ New Goal</Btn>
      </PageHeader>

      <div style={{ padding: '0 32px' }}>
        {goals.length === 0
          ? <Card><EmptyState icon="◎" message="No goals yet. Set one to start working toward something." /></Card>
          : <>
            {/* Hero goal */}
            <div style={{
              background: 'linear-gradient(135deg, var(--ink) 0%, #2c261e 100%)',
              borderRadius: 'var(--radius)', padding: 28, marginBottom: 16,
              boxShadow: 'var(--shadow-md)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Top Priority</div>
                  <div style={{ fontSize: 18, fontWeight: 500, color: 'white' }}>{hero.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Badge color={badge(hero.progress_pct).color}>{badge(hero.progress_pct).label}</Badge>
                  <button onClick={() => { setAllocModal(hero); setError('') }} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(193,125,60,0.25)', border: '1px solid rgba(193,125,60,0.4)', color: 'var(--accent-light)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                    + Fund
                  </button>
                  <button onClick={() => openEdit(hero)} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer' }}>Edit</button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: 'white', lineHeight: 1 }}>€{hero.saved.toFixed(2)}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>saved of €{hero.target.toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: 28 }}>
                  {hero.auto_monthly_target > 0 && (
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Needed / month</div>
                      <div style={{ fontSize: 16, color: 'var(--accent-light)', fontWeight: 500 }}>€{hero.auto_monthly_target.toFixed(2)}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Funded this month</div>
                    <div style={{ fontSize: 16, color: hero.funded_this_month >= hero.auto_monthly_target && hero.auto_monthly_target > 0 ? '#86efac' : 'white', fontWeight: 500 }}>€{hero.funded_this_month.toFixed(2)}</div>
                  </div>
                  {hero.months_remaining && (
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Months left</div>
                      <div style={{ fontSize: 16, color: 'white', fontWeight: 500 }}>{hero.months_remaining}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Overall progress */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 100, background: 'var(--accent)', width: `${hero.progress_pct}%`, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{hero.progress_pct}% complete</span>
                  <span style={{ fontSize: 12, color: 'var(--accent-light)' }}>€{(hero.target - hero.saved).toFixed(2)} remaining</span>
                </div>
              </div>

              {/* Monthly funding progress */}
              {hero.auto_monthly_target > 0 && (
                <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Monthly funding goal</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>€{hero.funded_this_month.toFixed(2)} / €{hero.auto_monthly_target.toFixed(2)}</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 100, background: '#86efac', width: `${Math.min((hero.funded_this_month / hero.auto_monthly_target) * 100, 100)}%`, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Remaining goals */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {rest.map(g => {
                const b = badge(g.progress_pct)
                return (
                  <Card key={g.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{g.name}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Badge color={b.color}>{b.label}</Badge>
                        <button onClick={() => { setAllocModal(g); setError('') }} style={{ padding: '3px 10px', borderRadius: 50, background: 'var(--accent-pale)', border: 'none', color: 'var(--accent)', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>+ Fund</button>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26 }}>€{g.saved.toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 10 }}>of €{g.target.toFixed(2)} target</div>
                    <Progress value={g.progress_pct} color={g.progress_pct >= 90 ? 'var(--positive)' : 'var(--accent)'} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{g.progress_pct}%</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>€{(g.target - g.saved).toFixed(2)} to go</span>
                    </div>

                    {/* Monthly funding mini-bar */}
                    {g.auto_monthly_target > 0 && (
                      <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--stone)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>This month</span>
                          <span style={{ fontSize: 11, color: g.funded_this_month >= g.auto_monthly_target ? 'var(--positive)' : 'var(--ink-muted)', fontWeight: 500 }}>
                            €{g.funded_this_month.toFixed(2)} / €{g.auto_monthly_target.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={(g.funded_this_month / g.auto_monthly_target) * 100} color="var(--positive)" />
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button onClick={() => openEdit(g)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--ink-muted)', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => del(g.id)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--ink-faint)', cursor: 'pointer' }}
                        onMouseEnter={ev => ev.currentTarget.style.color = 'var(--danger)'}
                        onMouseLeave={ev => ev.currentTarget.style.color = 'var(--ink-faint)'}>Delete</button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </>
        }
      </div>

      {/* Edit/Create Goal Modal */}
      {modal && (
        <Modal title={editing ? 'Edit Goal' : 'New Goal'} onClose={() => setModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Goal Name" placeholder="e.g. Emergency Fund" value={form.name} onChange={set('name')} autoFocus />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Target (€)" type="number" placeholder="10000" value={form.target} onChange={set('target')} />
              <Input label="Already Saved (€)" type="number" placeholder="0.00" value={form.saved} onChange={set('saved')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={set('deadline')} />
              <Input label="Monthly Target (€) — manual" type="number" placeholder="auto-calculated" value={form.monthly_target} onChange={set('monthly_target')} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', background: 'var(--stone)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
              💡 Set a deadline and the monthly target will be calculated automatically from the remaining amount.
            </div>
          </div>
          {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-pale)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
            <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create Goal'}</Btn>
          </div>
        </Modal>
      )}

      {/* Fund Goal Modal */}
      {allocModal && (
        <Modal title={`Fund — ${allocModal.name}`} onClose={() => setAllocModal(null)}>
          <div style={{ padding: '12px 16px', background: 'var(--stone)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>Current progress</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24 }}>€{allocModal.saved.toFixed(2)} <span style={{ fontSize: 14, color: 'var(--ink-muted)' }}>of €{allocModal.target.toFixed(2)}</span></div>
            <Progress value={allocModal.progress_pct} color="var(--accent)" />
            {allocModal.auto_monthly_target > 0 && (
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 8 }}>
                Monthly target: <strong>€{allocModal.auto_monthly_target.toFixed(2)}</strong> · Funded this month: <strong style={{ color: 'var(--positive)' }}>€{allocModal.funded_this_month.toFixed(2)}</strong>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Amount to Fund (€)" type="number" step="0.01" placeholder="0.00" value={allocForm.amount} onChange={setA('amount')} autoFocus />
            <Input label="Date" type="date" value={allocForm.date} onChange={setA('date')} />
            <Input label="Note (optional)" placeholder="e.g. Monthly savings transfer" value={allocForm.note} onChange={setA('note')} />
          </div>
          {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-pale)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
            <Btn variant="outline" onClick={() => setAllocModal(null)}>Cancel</Btn>
            <Btn onClick={saveAlloc} disabled={saving}>{saving ? 'Saving…' : 'Fund Goal'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
