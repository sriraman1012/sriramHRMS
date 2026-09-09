import api from './client'

export const getSheet = (year, month, departmentId) =>
  api.get('/attendance/sheet', { params: { year, month, departmentId: departmentId || undefined } }).then((r) => r.data)

export const saveSheet = (payload) => api.post('/attendance/sheet', payload).then((r) => r.data)

export const copyPrevious = (payload) => api.post('/attendance/copy-previous', payload).then((r) => r.data)

export const getBalanceCf = (year, month) =>
  api.get('/attendance/balance-cf', { params: { year, month } }).then((r) => r.data)
export const saveBalanceCf = (payload) => api.post('/attendance/balance-cf', payload).then((r) => r.data)

export const getOnsite = (from, to, departmentId) =>
  api.get('/attendance/onsite', { params: { from: from || undefined, to: to || undefined, departmentId: departmentId || undefined } }).then((r) => r.data)

export const getPermissions = (year, month, departmentId) =>
  api.get('/attendance/permissions', { params: { year, month, departmentId: departmentId || undefined } }).then((r) => r.data)
export const savePermission = (payload) => api.post('/attendance/permission', payload).then((r) => r.data)
export const deletePermission = (id) => api.delete(`/attendance/permission/${id}`).then((r) => r.data)
