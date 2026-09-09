import api from './client'

// ---- Department ----
export const getDepartments = () => api.get('/department').then((r) => r.data)
export const saveDepartment = (p) => api.post('/department', p).then((r) => r.data)
export const setDepartmentActive = (id, isActive) => api.patch(`/department/${id}/active`, { isActive }).then((r) => r.data)
export const deleteDepartment = (id) => api.delete(`/department/${id}`).then((r) => r.data)

// ---- Designation ----
export const getDesignations = () => api.get('/designation').then((r) => r.data)
export const saveDesignation = (p) => api.post('/designation', p).then((r) => r.data)
export const setDesignationActive = (id, isActive) => api.patch(`/designation/${id}/active`, { isActive }).then((r) => r.data)
export const deleteDesignation = (id) => api.delete(`/designation/${id}`).then((r) => r.data)

// ---- Employee ----
export const getEmployees = () => api.get('/employee').then((r) => r.data)
export const getEmployee = (id) => api.get(`/employee/${id}`).then((r) => r.data)
export const saveEmployee = (p) => api.post('/employee', p).then((r) => r.data)
export const setEmployeeActive = (id, isActive) => api.patch(`/employee/${id}/active`, { isActive }).then((r) => r.data)
export const deleteEmployee = (id) => api.delete(`/employee/${id}`).then((r) => r.data)

// ---- Holiday ----
export const getHolidays = () => api.get('/holiday').then((r) => r.data)
export const saveHoliday = (p) => api.post('/holiday', p).then((r) => r.data)
export const deleteHoliday = (id) => api.delete(`/holiday/${id}`).then((r) => r.data)

// ---- Leave Type ----
export const getLeaveTypes = () => api.get('/leavetype').then((r) => r.data)
export const saveLeaveType = (p) => api.post('/leavetype', p).then((r) => r.data)
export const setLeaveTypeActive = (id, isActive) => api.patch(`/leavetype/${id}/active`, { isActive }).then((r) => r.data)
export const deleteLeaveType = (id) => api.delete(`/leavetype/${id}`).then((r) => r.data)

// Implementation Checklist master
export const getImplItems = () => api.get('/implchecklist').then((r) => r.data)
export const saveImplItem = (p) => api.post('/implchecklist', p).then((r) => r.data)
export const setImplItemActive = (id, isActive) => api.patch(`/implchecklist/${id}/active`, { isActive }).then((r) => r.data)
export const deleteImplItem = (id) => api.delete(`/implchecklist/${id}`).then((r) => r.data)

// Add-ons master
export const getAddons = () => api.get('/addon').then((r) => r.data)
export const saveAddon = (p) => api.post('/addon', p).then((r) => r.data)
export const setAddonActive = (id, isActive) => api.patch(`/addon/${id}/active`, { isActive }).then((r) => r.data)
export const deleteAddon = (id) => api.delete(`/addon/${id}`).then((r) => r.data)

// Process Testing master
export const getImplTests = () => api.get('/impltest').then((r) => r.data)
export const saveImplTest = (p) => api.post('/impltest', p).then((r) => r.data)
export const setImplTestActive = (id, isActive) => api.patch(`/impltest/${id}/active`, { isActive }).then((r) => r.data)
export const deleteImplTest = (id) => api.delete(`/impltest/${id}`).then((r) => r.data)

// ---- Happy Hours ----
export const getHappyHours = () => api.get('/happyhours').then((r) => r.data)
export const saveHappyHour = (p) => api.post('/happyhours', p).then((r) => r.data)
export const setHappyHourActive = (id, isActive) => api.patch(`/happyhours/${id}/active`, { isActive }).then((r) => r.data)
export const deleteHappyHour = (id) => api.delete(`/happyhours/${id}`).then((r) => r.data)

// ---- Office ----
export const getOffices = () => api.get('/office').then((r) => r.data)
export const getOffice = (id) => api.get(`/office/${id}`).then((r) => r.data)
export const saveOffice = (p) => api.post('/office', p).then((r) => r.data)
export const setOfficeActive = (id, isActive) => api.patch(`/office/${id}/active`, { isActive }).then((r) => r.data)
export const deleteOffice = (id) => api.delete(`/office/${id}`).then((r) => r.data)
