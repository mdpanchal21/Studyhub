import api from './api'

export const videoAPI = {
  getActive: (roomId) => api.get(`/rooms/${roomId}/video/active`),
  start: (roomId) => api.post(`/rooms/${roomId}/video/start`),
  end: (roomId) => api.post(`/rooms/${roomId}/video/end`),
}
