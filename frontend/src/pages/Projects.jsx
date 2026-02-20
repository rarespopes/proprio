import { useEffect, useState } from 'react'
import { api } from '../api'
import { Card, Btn, Input, PageHeader, Modal, Spinner, EmptyState, Progress } from '../components/UI'

const ICONS = ['📁', '🏠', '💼', '✈️', '🎓', '🚗', '🏋️', '🎯', '💡', '🛠️']
const emptyForm = { name: '', icon: '📁', budget: '', period: '' }

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const p = await api.getProjects(); setProjects(p)
  }
  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  function openNew() { setForm(emptyForm); setEditing(null); setError(''); setModal(true) }
  function openEdit(p) {
    setForm({ name: p.name, icon: p.icon, budget: String(p.budget), period: p.period })
    setEditing(p.id); setError(''); setModal(true)
  }

  async function save() {
    if (!form.name) return setError('Project name is required')
    setSaving(true); setError('')
    try {
      const payload = { ...form, budget: parseFloat(form.budget) || 0 }
      editing ? await api.updateProject(editing, payload) : await api.createProject(payload)
      setModal(false); await load()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  async function del(id) {
    if (!confirm('Delete this project? Expenses will keep their data.')) return
    await api.deleteProject(id); await load()
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  if (loading) return <Spinner />

  return (
    <div className="fade-up" style={{ padding: '0 0 40px' }}>
      <PageHeader title="Projects" subtitle="Group and budget your expenses by context">
        <Btn variant="primary" onClick={openNew}>+ New Project</Btn>
      </PageHeader>

      <div style={{ padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {projects.length === 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Card><EmptyState icon="❑" message="No projects yet. Create one to start grouping expenses." /></Card>
            </div>
          )}
          {projects.map(p => {
            const pct = p.budget > 0 ? Math.min((p.spent / p.budget) * 100, 100) : 0
            const over = p.budget > 0 && p.spent > p.budget
            const remaining = p.budget - p.spent
            return (
              <Card key={p.id} style={{ cursor: 'pointer' }} onClick={() => openEdit(p)}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{p.icon}</div>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                {p.period && <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 8 }}>{p.period}</div>}
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26 }}>€{p.spent.toFixed(2)}</div>
                {p.budget > 0 && (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 10 }}>of €{p.budget.toFixed(2)} budget</div>
                    <Progress value={pct} color={over ? 'var(--danger)' : pct > 80 ? 'var(--accent)' : 'var(--positive)'} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7 }}>
                      <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{pct.toFixed(0)}% used</span>
                      <span style={{ fontSize: 11, color: over ? 'var(--danger)' : 'var(--positive)', fontWeight: 500 }}>
                        {over ? `Over by €${Math.abs(remaining).toFixed(2)}` : `€${remaining.toFixed(2)} left`}
                      </span>
                    </div>
                  </>
                )}
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={ev => { ev.stopPropagation(); del(p.id) }} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--ink-faint)', cursor: 'pointer' }}
                    onMouseEnter={ev => ev.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={ev => ev.currentTarget.style.color = 'var(--ink-faint)'}>Delete</button>
                </div>
              </Card>
            )
          })}
          {/* New project ghost card */}
          <div onClick={openNew} style={{
            border: '2px dashed var(--stone-dark)', borderRadius: 'var(--radius)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: 160, cursor: 'pointer', gap: 8, transition: 'border-color 0.15s',
          }}
          onMouseEnter={ev => ev.currentTarget.style.borderColor = 'var(--accent)'}
          onMouseLeave={ev => ev.currentTarget.style.borderColor = 'var(--stone-dark)'}>
            <div style={{ fontSize: 24, color: 'var(--ink-faint)' }}>+</div>
            <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>New Project</div>
          </div>
        </div>
      </div>

      {modal && (
        <Modal title={editing ? 'Edit Project' : 'New Project'} onClose={() => setModal(false)}>
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
            <Input label="Project Name" placeholder="e.g. Home Budget" value={form.name} onChange={set('name')} autoFocus />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Budget (€)" type="number" placeholder="0.00" value={form.budget} onChange={set('budget')} />
              <Input label="Period" placeholder="Feb 2026" value={form.period} onChange={set('period')} />
            </div>
          </div>
          {error && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--danger)', background: 'var(--danger-pale)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
            <Btn variant="outline" onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : editing ? 'Update' : 'Create Project'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
