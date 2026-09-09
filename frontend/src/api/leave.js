import api from './client'

export const getLeaves = () => api.get('/leave').then((r) => r.data)
export const getLeave = (id) => api.get(`/leave/${id}`).then((r) => r.data)
export const saveLeave = (payload) => api.post('/leave', payload).then((r) => r.data)
export const deleteLeave = (id) => api.delete(`/leave/${id}`).then((r) => r.data)
