import api from './client'

// Weekly-off rules: { days:[0..6 every week], nth:{ weekday:[occurrences] } }
export const getWeeklyOff = () => api.get('/settings/weekly-off').then((r) => r.data)
export const saveWeeklyOff = (days, nth) => api.post('/settings/weekly-off', { days, nth: nth || {} }).then((r) => r.data)

// Manual working-days override per month
export const getWorkingDays = (year, month) =>
  api.get('/settings/working-days', { params: { year, month } }).then((r) => r.data)
export const saveWorkingDays = (year, month, workingDays) =>
  api.post('/settings/working-days', { year, month, workingDays }).then((r) => r.data)
