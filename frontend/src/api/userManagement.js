import api from './client'

// ---- Modules ----
export const getModules = () => api.get('/modules').then((r) => r.data)

// ---- User Groups ----
export const getGroups = () => api.get('/usergroups').then((r) => r.data)
export const saveGroup = (payload) => api.post('/usergroups', payload).then((r) => r.data)
export const deleteGroup = (id) => api.delete(`/usergroups/${id}`).then((r) => r.data)

// ---- User Rights (matrix) ----
export const getRights = (groupId) => api.get(`/userrights/${groupId}`).then((r) => r.data)
export const saveRights = (payload) => api.post('/userrights', payload).then((r) => r.data)

// Effective rights of the logged-in user (module code -> flags). Admin => all.
export const getMyRights = () => api.get('/userrights/mine').then((r) => r.data)

// ---- Users ----
export const getUsers = () => api.get('/users').then((r) => r.data)
export const getUser = (id) => api.get(`/users/${id}`).then((r) => r.data)
export const addUser = (payload) => api.post('/users', payload).then((r) => r.data)
export const updateUser = (id, payload) => api.put(`/users/${id}`, payload).then((r) => r.data)
export const setUserActive = (id, isActive) =>
  api.patch(`/users/${id}/active`, { isActive }).then((r) => r.data)
export const deleteUser = (id) => api.delete(`/users/${id}`).then((r) => r.data)
