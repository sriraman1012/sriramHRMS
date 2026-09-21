import api from './client'

// Encrypt / Decrypt tool (legacy ERP-compatible TripleDES)
export const encryptValue = (value) => api.post('/encrypt/encrypt', { value }).then((r) => r.data)
export const decryptValue = (value) => api.post('/encrypt/decrypt', { value }).then((r) => r.data)
