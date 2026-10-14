import axios from 'axios'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = config.headers.Authorization || window.localStorage.getItem('eventflow-auth-token')
  if (token) config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    if (error.response?.status === 401 && !/\/auth\/(login|register)$/.test(requestUrl)) {
      window.localStorage.removeItem('eventflow-auth-token')
      window.dispatchEvent(new Event('eventhub:unauthorized'))
    }
    const message = error.response?.data?.message || error.message || 'The request could not be completed.'
    return Promise.reject(new Error(message))
  },
)

const apiRequest = async (path, options = {}, token) => {
  const apiPath = path.startsWith('/api') ? path.slice(4) : path
  const headers = { ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`
  let data = options.data
  if (options.body !== undefined) {
    try {
      data = JSON.parse(options.body)
    } catch {
      data = options.body
    }
  }
  const response = await apiClient.request({
    ...options,
    url: apiPath,
    data,
    headers,
  })
  return response.data
}

export const loginUser = async ({ email, password }) =>
  apiRequest('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

export const registerUser = async ({ name, email, password, phone, role }) =>
  apiRequest('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone, role }),
  })

export const fetchCurrentUserProfile = (token) => apiRequest('/api/users/me', {}, token)

export const fetchPublicEvents = () => apiRequest('/api/events')

export const fetchOrganizerEvents = (token) => apiRequest('/api/events/my', {}, token)

export const fetchAdminEvents = (token) => apiRequest('/api/admin/events', {}, token)

export const fetchAdminUsers = (token) => apiRequest('/api/admin/users', {}, token)

export const fetchAdminRegistrations = (token) => apiRequest('/api/admin/registrations', {}, token)

export const fetchMyRegistrations = (token) => apiRequest('/api/registrations/my', {}, token)

export const fetchEventRegistrations = (eventId, token) =>
  apiRequest(`/api/registrations/event/${eventId}`, {}, token)

export const createEvent = (payload, token) =>
  apiRequest(
    '/api/events',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    token,
  )

export const updateEvent = (eventId, payload, token) =>
  apiRequest(
    `/api/events/${eventId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    token,
  )

export const registerForEvent = (eventId, ticketTypeId, quantity, token) =>
  apiRequest(
    `/api/registrations/events/${eventId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketTypeId, quantity }),
    },
    token,
  )

export const checkInRegistration = (ticketCode, eventId, token) =>
  apiRequest(
    '/api/registrations/check-in',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketCode, eventId }),
    },
    token,
  )

export const cancelRegistration = (registrationId, token) =>
  apiRequest(`/api/registrations/${registrationId}`, { method: 'DELETE' }, token)

export const approveEvent = (eventId, token) =>
  apiRequest(`/api/admin/events/${eventId}/approve`, { method: 'PUT' }, token)

export const rejectEvent = (eventId, token) =>
  apiRequest(`/api/admin/events/${eventId}/reject`, { method: 'PUT' }, token)

export const deleteEvent = (eventId, token) =>
  apiRequest(`/api/events/${eventId}`, { method: 'DELETE' }, token)

export const deleteAdminEvent = (eventId, token) =>
  apiRequest(`/api/admin/events/${eventId}`, { method: 'DELETE' }, token)

export const deleteUser = (userId, token) =>
  apiRequest(`/api/admin/users/${userId}`, { method: 'DELETE' }, token)

export const promoteUserToOrganizer = (userId, token) =>
  apiRequest(`/api/admin/users/${userId}/organizer`, { method: 'PUT' }, token)
