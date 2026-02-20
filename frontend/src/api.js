const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export const api = {
  // Auth
  register: (body) => req('POST', '/auth/register', body),
  login:    (body) => req('POST', '/auth/login', body),
  me:       ()     => req('GET',  '/auth/me'),

  // Dashboard
  dashboard: (month) => req('GET', `/dashboard${month ? `?month=${month}` : ''}`),

  // Expenses
  getExpenses:   (params) => req('GET', `/expenses${params ? '?' + new URLSearchParams(params) : ''}`),
  createExpense: (body)   => req('POST', '/expenses', body),
  updateExpense: (id, b)  => req('PUT', `/expenses/${id}`, b),
  deleteExpense: (id)     => req('DELETE', `/expenses/${id}`),

  // Commitments
  getCommitments:   ()      => req('GET', '/commitments'),
  createCommitment: (body)  => req('POST', '/commitments', body),
  updateCommitment: (id, b) => req('PUT', `/commitments/${id}`, b),
  deleteCommitment: (id)    => req('DELETE', `/commitments/${id}`),

  // Goals
  getGoals:       ()          => req('GET', '/goals'),
  createGoal:     (body)      => req('POST', '/goals', body),
  updateGoal:     (id, b)     => req('PATCH', `/goals/${id}`, b),
  deleteGoal:     (id)        => req('DELETE', `/goals/${id}`),
  allocateToGoal: (id, body)  => req('POST', `/goals/${id}/allocate`, body),

  // Income
  getIncome:    (params) => req('GET', `/income${params ? '?' + new URLSearchParams(params) : ''}`),
  createIncome: (body)   => req('POST', '/income', body),
  updateIncome: (id, b)  => req('PUT', `/income/${id}`, b),
  deleteIncome: (id)     => req('DELETE', `/income/${id}`),
}
