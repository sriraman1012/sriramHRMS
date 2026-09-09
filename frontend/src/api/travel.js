import api from './client'

export const getTravelAdvances = (from, to, departmentId, status) =>
  api.get('/traveladvance', { params: { from: from || undefined, to: to || undefined, departmentId: departmentId || undefined, status: status || undefined } }).then((r) => r.data)
export const getTravelAdvance = (id) => api.get(`/traveladvance/${id}`).then((r) => r.data)
export const saveTravelAdvance = (payload) => api.post('/traveladvance', payload).then((r) => r.data)
export const setTravelStatus = (id, status) => api.post(`/traveladvance/${id}/status`, { status }).then((r) => r.data)
export const deleteTravelAdvance = (id) => api.delete(`/traveladvance/${id}`).then((r) => r.data)
