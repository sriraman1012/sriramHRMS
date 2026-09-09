import api from './client'

// New Client Implementation records
export const getImplementations = () => api.get('/implementation').then((r) => r.data)
export const getImplementation = (id) => api.get(`/implementation/${id}`).then((r) => r.data)
export const saveImplementation = (p) => api.post('/implementation', p).then((r) => r.data)
export const deleteImplementation = (id) => api.delete(`/implementation/${id}`).then((r) => r.data)
