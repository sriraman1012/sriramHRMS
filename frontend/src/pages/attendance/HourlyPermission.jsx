import { useEffect, useState } from 'react'
import { useRights } from '../../context/RightsContext.jsx'
import { getPermissions, savePermission, deletePermission } from '../../api/attendance.js'
import { getEmployees, getDepartments } from '../../api/masters.js'
import { Pencil, Plus, Search, Trash, X } from '../../components/icons.jsx'
import DeleteButton from '../../components/DeleteButton.jsx'
import EditButton from '../../components/EditButton.jsx'
import Loader from '../../components/Loader.jsx'
import Pagination from '../../components/Pagination.jsx'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import SingleDatePicker from '../../components/SingleDatePicker.jsx'

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const isoToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
const selectCls = 'rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-sm px-3 py-2 outline-none'
const inputCls = 'w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-slate-900 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-blue-500'
const labelCls = 'block text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1'
const fmtDate = (d) => (d ? String(d).slice(0, 10) : '')
const fmtTime = (t) => (t ? String(t).slice(0, 5) : '') // "HH:mm:ss" -> "HH:mm"

const emptyForm = { permissionId: null, employeeId: '', permDate: '', fromTime: '', toTime: '', reason: '', remarks: '' }

export default function HourlyPermission() {
  const { can } = useRights()
  const canAdd = can('hourly-permission', 'add')
  const canEdit = can('hourly-permission', 'edit')
  const canDelete = can('hourly-permission', 'delete')
  const [range, setRange] = useState(() => {
    const p = new Date(now.getFullYear(), now.getMonth() - 1, 1) // previous month start
    return {
      from: `${p.getFullYear()}-${pad(p.getMonth() + 1)}-01`,
      to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    }
  })
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [confirmDel, setConfirmDel] = useState(null) // row pending delete-confirmation
  const [query, setQuery] = useState('')
  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const setColFilter = (k, v) => setColFilters((p) => ({ ...p, [k]: v }))
  const colText = {
    employee: (r) => `${r.employeeName} ${r.employeeCode}`,
    department: (r) => r.departmentName || '',
    date: (r) => fmtDate(r.permDate),
    from: (r) => fmtTime(r.fromTime),
    to: (r) => fmtTime(r.toTime),
    hours: (r) => String(r.hours),
    reason: (r) => r.reason || '',
    remarks: (r) => r.remarks || '',
  }

  const load = async () => {
    setLoading(true); setError('')
    // Load all permissions for the (optional) department; the date range is applied client-side.
    try { setRows(await getPermissions(null, null, departmentId)) }
    catch { setError('Failed to load. Is the API running / are you logged in?') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {})
    getEmployees().then((e) => setEmployees(e.filter((x) => x.isActive))).catch(() => {})
  }, [])
  useEffect(() => { load() }, [departmentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }
  const openAdd = () => { setForm({ ...emptyForm, permDate: isoToday, employeeId: employees[0]?.employeeId ? String(employees[0].employeeId) : '' }); setModalOpen(true) }
  const openEdit = (r) => { setForm({ permissionId: r.permissionId, employeeId: String(r.employeeId), permDate: fmtDate(r.permDate), fromTime: fmtTime(r.fromTime), toTime: fmtTime(r.toTime), reason: r.reason || '', remarks: r.remarks || '' }); setModalOpen(true) }
  const doDelete = async (r) => {
    setConfirmDel(null); setError('')
    try { await deletePermission(r.permissionId); flash('Permission deleted.'); load() }
    catch (e) {
      setError(
        e.response?.status === 403 ? 'You do not have permission to delete permissions.'
          : e.response?.status === 401 ? 'Your session expired. Please sign in again.'
            : e.response?.data?.message || 'Could not delete the permission. Is the API running?'
      )
    }
  }

  const gq = query.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    const d = fmtDate(r.permDate)
    if (!(d >= range.from && d <= range.to)) return false
    if (gq && !`${r.employeeName} ${r.employeeCode} ${r.reason || ''}`.toLowerCase().includes(gq)) return false
    for (const k of Object.keys(colFilters)) { const f = (colFilters[k] || '').trim().toLowerCase(); if (f && !colText[k](r).toLowerCase().includes(f)) return false }
    return true
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageRows = filtered.slice(offset, offset + pageSize)
  const totalHours = filtered.reduce((a, r) => a + (Number(r.hours) || 0), 0)

  const COLS = [
    { key: 'employee', label: 'Employee', align: 'left' },
    { key: 'department', label: 'Department', align: 'left' },
    { key: 'date', label: 'Date', align: 'left' },
    { key: 'from', label: 'From', align: 'center' },
    { key: 'to', label: 'To', align: 'center' },
    { key: 'hours', label: 'Hours', align: 'center' },
    { key: 'reason', label: 'Reason', align: 'left' },
    { key: 'remarks', label: 'Remarks', align: 'left' },
  ]

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold flex items-center gap-2">⏱️ Hourly Permission</h1>
        <SearchBox value={query} onChange={setQuery} placeholder="Search…" className="ml-auto" />
        {canAdd && (
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"><Plus /> Add Permission</button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <DateRangeFilter from={range.from} to={range.to} onChange={setRange} departments={departments} departmentId={departmentId} setDepartmentId={setDepartmentId} />
      </div>

      {(msg || error) && <div className={`text-sm font-bold ${error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{error || msg}</div>}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide align-top">
              <th className="text-left px-3 py-2.5 font-bold w-12">S.No</th>
              {COLS.map((c) => (
                <th key={c.key} className={`px-3 py-2.5 font-bold ${c.align === 'left' ? 'text-left' : 'text-center'}`}>
                  <div className={`flex items-center gap-1 ${c.align === 'left' ? 'justify-start' : 'justify-center'}`}>
                    <span>{c.label}</span>
                    <button onClick={() => setOpenCol(openCol === c.key ? null : c.key)} title={`Search ${c.label}`}
                      className={`p-0.5 rounded ${colFilters[c.key] ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><Search size={12} /></button>
                  </div>
                  {openCol === c.key && (
                    <div className="relative mt-1">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={11} /></span>
                      <input autoFocus value={colFilters[c.key] || ''} onChange={(e) => setColFilter(c.key, e.target.value)} placeholder="Search"
                        className="w-full min-w-[70px] pl-6 pr-2 py-1 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f18] text-[12px] normal-case font-normal outline-none focus:border-blue-500" />
                    </div>
                  )}
                </th>
              ))}
              <th className="text-center px-3 py-2.5 font-bold w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={COLS.length + 2} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
              : filtered.length === 0 ? <tr><td colSpan={COLS.length + 2} className="px-4 py-6 text-center text-slate-400">No permissions.</td></tr>
                : pageRows.map((r, i) => (
                  <tr key={r.permissionId} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                    <td className="px-3 py-2 font-bold">{r.employeeName}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.departmentName || '—'}</td>
                    <td className="px-3 py-2">{fmtDate(r.permDate)}</td>
                    <td className="px-3 py-2 text-center">{fmtTime(r.fromTime)}</td>
                    <td className="px-3 py-2 text-center">{fmtTime(r.toTime)}</td>
                    <td className="px-3 py-2 text-center font-bold text-blue-600 dark:text-blue-400">{r.hours}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.reason || '—'}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.remarks || '—'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && (
                          <EditButton onClick={() => openEdit(r)} />
                        )}
                        {canDelete && (
                          <DeleteButton onClick={() => setConfirmDel(r)} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot><tr className="border-t-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e2235] font-bold">
              <td className="px-3 py-2.5" colSpan={6}>Total ({filtered.length})</td>
              <td className="px-3 py-2.5 text-center text-blue-600 dark:text-blue-400">{Math.round(totalHours * 100) / 100} hrs</td>
              <td className="px-3 py-2.5" colSpan={3} />
            </tr></tfoot>
          )}
        </table>
      </div>

      {filtered.length > 0 && <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />}

      {confirmDel && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-bold flex items-center gap-2">🗑️ Delete permission?</h3>
              <button type="button" onClick={() => setConfirmDel(null)} title="Close" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Delete <b>{confirmDel.employeeName}</b>'s permission on {fmtDate(confirmDel.permDate)} ({fmtTime(confirmDel.fromTime)}–{fmtTime(confirmDel.toTime)})? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
              <button onClick={() => doDelete(confirmDel)} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && <PermModal form={form} setForm={setForm} employees={employees} todayIso={isoToday} onClose={() => setModalOpen(false)}
        onSaved={(m, savedDate) => {
          setModalOpen(false); flash(m)
          // Make sure the just-saved date is inside the visible range (e.g. a future-dated permission).
          if (savedDate) setRange((r) => ({ from: savedDate < r.from ? savedDate : r.from, to: savedDate > r.to ? savedDate : r.to }))
          setPage(1)
          load()
        }} />}
    </div>
  )
}

function PermModal({ form, setForm, employees, todayIso, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = !!form.permissionId
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const hours = (() => { if (!form.fromTime || !form.toTime) return null; const [fh, fm] = form.fromTime.split(':').map(Number); const [th, tm] = form.toTime.split(':').map(Number); const mins = (th * 60 + tm) - (fh * 60 + fm); return mins > 0 ? Math.round((mins / 60) * 100) / 100 : null })()

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!form.employeeId) return setErr('Please select an employee.')
    if (!form.permDate) return setErr('Date is required.')
    if (!form.fromTime || !form.toTime) return setErr('From and To time are required.')
    if (form.toTime <= form.fromTime) return setErr('To time must be after From time.')
    setSaving(true)
    try {
      await savePermission({ permissionId: form.permissionId, employeeId: Number(form.employeeId), permDate: form.permDate, fromTime: form.fromTime, toTime: form.toTime, reason: form.reason.trim() || null, remarks: form.remarks.trim() || null })
      onSaved(isEdit ? 'Permission updated.' : 'Permission added.', form.permDate)
    } catch (e2) { setErr(e2.response?.data?.message || 'Could not save the permission.') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold">{isEdit ? 'Edit Permission' : 'Add Hourly Permission'}</h3>
          <button type="button" onClick={onClose} title="Close" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className={labelCls}>Employee *</label>
            <select className={inputCls} value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)}>
              <option value="">-- select --</option>{employees.map((e) => <option key={e.employeeId} value={e.employeeId}>{e.name} ({e.employeeCode})</option>)}</select></div>
          <div><label className={labelCls}>Date *</label><SingleDatePicker value={form.permDate} onChange={(iso) => set('permDate', iso)} todayIso={todayIso} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>From *</label><input type="time" className={inputCls} value={form.fromTime} onChange={(e) => set('fromTime', e.target.value)} /></div>
            <div><label className={labelCls}>To *</label><input type="time" className={inputCls} value={form.toTime} onChange={(e) => set('toTime', e.target.value)} /></div>
          </div>
          <div className="sm:col-span-2 text-sm font-bold text-slate-600 dark:text-slate-300">Duration: {hours != null ? `${hours} hour(s)` : '—'}</div>
          <div className="sm:col-span-2"><label className={labelCls}>Reason</label><input className={inputCls} value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="e.g. Personal / Medical" /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Remarks</label><textarea rows={2} className={inputCls} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} /></div>
          {err && <div className="sm:col-span-2 text-red-600 dark:text-red-400 text-sm font-bold">{err}</div>}
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
            <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">{saving ? 'Saving…' : isEdit ? 'Update' : 'Add Permission'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
