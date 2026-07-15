import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.startsWith('/auth/')
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token')
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
}

export const roomAPI = {
  create: (data) => api.post('/rooms', data),
  getAll: (params) => api.get('/rooms', { params }),
  getOne: (id) => api.get(`/rooms/${id}`),
  getByCode: (inviteCode) => api.get(`/rooms/by-code/${inviteCode}`),
  getHistory: (params) => api.get('/rooms/history', { params }),
  join: (inviteCode) => api.post('/rooms/join', { inviteCode }),
  requestJoin: (inviteCode) => api.post('/rooms/request-join', { inviteCode }),
  leave: (id) => api.post(`/rooms/${id}/leave`),
  delete: (id) => api.delete(`/rooms/${id}`),
  deactivate: (id) => api.post(`/rooms/${id}/deactivate`),
  getPendingRequests: (id) => api.get(`/rooms/${id}/requests`),
  acceptRequest: (id, userId) => api.post(`/rooms/${id}/requests/${userId}/accept`),
  declineRequest: (id, userId) => api.post(`/rooms/${id}/requests/${userId}/decline`),
  kickMember: (id, userId) => api.post(`/rooms/${id}/members/${userId}/kick`),
}

export const messageAPI = {
  get: (roomId, params) => api.get(`/messages/${roomId}`, { params }),
  send: (roomId, data) => api.post(`/messages/${roomId}`, data),
  delete: (roomId, id) => api.delete(`/messages/${roomId}/${id}`),
}

export const doubtAPI = {
  get: (roomId, params) => api.get(`/doubts/${roomId}`, { params }),
  create: (roomId, data) => api.post(`/doubts/${roomId}`, data),
  resolve: (id) => api.patch(`/doubts/${id}/resolve`),
  retry: (id) => api.post(`/doubts/${id}/retry`),
}

export const flashcardAPI = {
  get: (roomId, params) => api.get(`/flashcards/${roomId}`, { params }),
  create: (roomId, data) => api.post(`/flashcards/${roomId}`, data),
  generate: (roomId, topic) => api.post(`/flashcards/${roomId}/generate`, { topic }),
  delete: (id) => api.delete(`/flashcards/${id}`),
}

export const sessionAPI = {
  start: (roomId) => api.post(`/sessions/${roomId}/start`),
  end: (id) => api.patch(`/sessions/${id}/end`),
  getAll: (params) => api.get('/sessions', { params }),
}

export const notificationAPI = {
  get: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

export const aiAPI = {
  ask: (question) => api.post('/ai/ask', { question }),
  explainDoubt: (id) => api.post(`/ai/explain/${id}`),
  quiz: (topic, count = 5, roomId, topics) => api.post('/ai/quiz', { topic, count, roomId, topics }),
}

export const quizAPI = {
  save: (data) => api.post('/quizzes', data),
  list: (params) => api.get('/quizzes', { params }),
  getOne: (id) => api.get(`/quizzes/${id}`),
}

export const roadmapAPI = {
  list: (params) => api.get('/roadmaps', { params }),
  getLatest: () => api.get('/roadmaps/latest'),
  getOne: (id) => api.get(`/roadmaps/${id}`),
  create: (data) => api.post('/roadmaps', data),
}

export const roomSessionAPI = {
  getActive: (roomId) => api.get(`/rooms/${roomId}/active-session`),
  start: (roomId, topic) => api.post(`/rooms/${roomId}/sessions/start`, { topic }),
  join: (roomId) => api.post(`/rooms/${roomId}/sessions/join`),
  leave: (roomId) => api.post(`/rooms/${roomId}/sessions/leave`),
  end: (roomId) => api.post(`/rooms/${roomId}/sessions/end`),
}

export default api
