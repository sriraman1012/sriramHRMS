import api from './client'

export const getHome = (year, month, departmentId, today) =>
  api
    .get('/dashboard/home', { params: { year, month, departmentId: departmentId || undefined, today } })
    .then((r) => r.data)

// Present vs Absent trend for the line chart. mode = 'date' | 'month' | 'year'.
// In 'date' mode, pass from/to for a custom day-range (else it uses the whole month).
export const getAttendanceTrend = (mode, year, month, departmentId, from, to) =>
  api
    .get('/dashboard/trend', { params: { mode, year, month, departmentId: departmentId || undefined, from: from || undefined, to: to || undefined } })
    .then((r) => r.data)
