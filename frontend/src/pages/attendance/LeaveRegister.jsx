import { useEffect, useState } from 'react'
import { useRights } from '../../context/RightsContext.jsx'
import { getLeaves, getLeave, saveLeave, deleteLeave } from '../../api/leave.js'
import { getEmployees, getLeaveTypes, getDepartments } from '../../api/masters.js'
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

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-slate-900 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-blue-500'
const labelCls = 'block text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1'
const fmt = (d) => (d ? String(d).slice(0, 10) : '')

const emptyForm = { leaveId: null, employeeId: '', leaveTypeId: '', fromDate: '', toDate: '', reason: '', remarks: '' }

export default function LeaveRegister() {
  const { can } = useRights()
  const canAdd = can('leave-register', 'add')
  const canEdit = can('leave-register', 'edit')
  const canDelete = can('leave-register', 'delete')
  const [rows, setRows] = useState([])
  const [employees, setEmployees] = useState([])
  const [leaveTypes, setLeaveTypes] = useState([])
  const [range, setRange] = useState(() => {
    const p = new Date(now.getFullYear(), now.getMonth() - 1, 1) // previous month start
    return {
      from: `${p.getFullYear()}-${pad(p.getMonth() + 1)}-01`,
      to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    }
  })
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [empDept, setEmpDept] = useState({})
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
    leaveType: (r) => r.leaveTypeName || '',
    from: (r) => fmt(r.fromDate),
    to: (r) => fmt(r.toDate),
    reason: (r) => r.reason || '',
    remarks: (r) => r.remarks || '',
  }

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await getLeaves())
    } catch {
      setError('Failed to load leaves. Is the API running / are you logged in?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    getEmployees().then((e) => {
      setEmployees(e.filter((x) => x.isActive))
      const m = {}; e.forEach((x) => { m[x.employeeId] = x.departmentId }); setEmpDept(m)
    }).catch(() => {})
    getLeaveTypes().then((t) => setLeaveTypes(t.filter((x) => x.isActive))).catch(() => {})
    getDepartments().then(setDepartments).catch(() => {})
  }, [])

  const flash = (m) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 3000)
  }

  const openAdd = () => {
    setForm({ ...emptyForm, fromDate: isoToday, toDate: isoToday, employeeId: employees[0]?.employeeId ? String(employees[0].employeeId) : '' })
    setModalOpen(true)
  }

  const openEdit = async (id) => {
    const l = await getLeave(id)
    setForm({
      leaveId: l.leaveId,
      employeeId: String(l.employeeId),
      leaveTypeId: l.leaveTypeId ? String(l.leaveTypeId) : '',
      fromDate: fmt(l.fromDate),
      toDate: fmt(l.toDate),
      reason: l.reason || '',
      remarks: l.remarks || '',
    })
    setModalOpen(true)
  }

  // Actual delete — runs after the in-app confirm dialog (no fragile window.confirm).
  const doDelete = async (row) => {
    setConfirmDel(null)
    setError('')
    try {
      await deleteLeave(row.leaveId)
      flash('Leave deleted.')
      load()
    } catch (e) {
      setError(
        e.response?.status === 403 ? 'You do not have permission to delete leaves.'
          : e.response?.status === 401 ? 'Your session expired. Please sign in again.'
            : e.response?.data?.message || 'Could not delete the leave. Is the API running?'
      )
    }
  }

  const q = query.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    // leave overlaps the selected date range
    const from = fmt(r.fromDate), to = fmt(r.toDate)
    if (!(from <= range.to && to >= range.from)) return false
    if (departmentId && String(empDept[r.employeeId]) !== String(departmentId)) return false
    if (q && !`${r.employeeCode} ${r.employeeName} ${r.leaveTypeName || ''} ${r.reason || ''}`.toLowerCase().includes(q)) return false
    for (const k of Object.keys(colFilters)) {
      const f = (colFilters[k] || '').trim().toLowerCase()
      if (f && !colText[k](r).toLowerCase().includes(f)) return false
    }
    return true
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageRows = filtered.slice(offset, offset + pageSize)

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold">🏖️ Leave Register</h1>
        <SearchBox value={query} onChange={setQuery} placeholder="Search leaves…" className="ml-auto" />
        <DateRangeFilter from={range.from} to={range.to} onChange={setRange} departments={departments} departmentId={departmentId} setDepartmentId={setDepartmentId} />
        {canAdd && (
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">
            <Plus /> Register Leave
          </button>
        )}
      </div>

      {(msg || error) && (
        <div className={`text-sm font-bold ${error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{error || msg}</div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide align-top">
              <th className="text-left px-3 py-2.5 font-bold w-12">S.No</th>
              {[
                { key: 'employee', label: 'Employee' },
                { key: 'leaveType', label: 'Leave Type' },
                { key: 'from', label: 'From' },
                { key: 'to', label: 'To' },
                { key: 'reason', label: 'Reason' },
                { key: 'remarks', label: 'Remarks' },
              ].map((c) => (
                <th key={c.key} className="text-left px-3 py-2.5 font-bold">
                  <div className="flex items-center gap-1">
                    <span>{c.label}</span>
                    <button onClick={() => setOpenCol(openCol === c.key ? null : c.key)} title={`Search ${c.label}`}
                      className={`p-0.5 rounded ${colFilters[c.key] ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                      <Search size={12} />
                    </button>
                  </div>
                  {openCol === c.key && (
                    <div className="relative mt-1">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={11} /></span>
                      <input autoFocus value={colFilters[c.key] || ''} onChange={(e) => setColFilter(c.key, e.target.value)} placeholder="Search"
                        className="w-full min-w-[80px] pl-6 pr-2 py-1 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f18] text-[12px] normal-case font-normal outline-none focus:border-blue-500" />
                    </div>
                  )}
                </th>
              ))}
              <th className="text-center px-3 py-2.5 font-bold w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">No leaves registered.</td></tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={r.leaveId} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                  <td className="px-3 py-2 font-bold">{r.employeeName}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.leaveTypeName || '—'}</td>
                  <td className="px-3 py-2">{fmt(r.fromDate)}</td>
                  <td className="px-3 py-2">{fmt(r.toDate)}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.reason || '—'}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.remarks || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && (
                        <EditButton onClick={() => openEdit(r.leaveId)} />
                      )}
                      {canDelete && (
                        <DeleteButton onClick={() => setConfirmDel(r)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      )}

      {confirmDel && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-bold flex items-center gap-2">🗑️ Delete leave?</h3>
              <button type="button" onClick={() => setConfirmDel(null)} title="Close" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              This removes <b>{confirmDel.employeeName}</b>'s leave ({fmt(confirmDel.fromDate)} → {fmt(confirmDel.toDate)}) and clears the attendance marks it created. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
              <button onClick={() => doDelete(confirmDel)} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <LeaveModal
          form={form}
          setForm={setForm}
          employees={employees}
          leaveTypes={leaveTypes}
          todayIso={isoToday}
          onClose={() => setModalOpen(false)}
          onSaved={(m, sFrom, sTo) => {
            setModalOpen(false); flash(m)
            // Ensure the just-saved leave (even if future-dated) falls inside the visible range.
            if (sFrom && sTo) setRange((r) => ({ from: sFrom < r.from ? sFrom : r.from, to: sTo > r.to ? sTo : r.to }))
            setPage(1)
            load()
          }}
        />
      )}
    </div>
  )
}

function LeaveModal({ form, setForm, employees, leaveTypes, todayIso, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = !!form.leaveId
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!form.employeeId) return setErr('Please select an employee.')
    if (!form.fromDate || !form.toDate) return setErr('From and To dates are required.')
    if (form.toDate < form.fromDate) return setErr('To Date cannot be before From Date.')

    setSaving(true)
    try {
      const res = await saveLeave({
        leaveId: form.leaveId,
        employeeId: Number(form.employeeId),
        leaveTypeId: form.leaveTypeId ? Number(form.leaveTypeId) : null,
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason.trim() || null,
        remarks: form.remarks.trim() || null,
      })
      onSaved(res.message || 'Leave registered.', form.fromDate, form.toDate)
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not register the leave.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold">{isEdit ? 'Edit Leave' : 'Register Leave'}</h3>
          <button type="button" onClick={onClose} title="Close" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>Employee *</label>
            <select className={inputCls} value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)}>
              <option value="">-- select --</option>
              {employees.map((e) => <option key={e.employeeId} value={e.employeeId}>{e.name} ({e.employeeCode})</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Leave Type</label>
            <select className={inputCls} value={form.leaveTypeId} onChange={(e) => set('leaveTypeId', e.target.value)}>
              <option value="">-- none --</option>
              {leaveTypes.map((t) => <option key={t.leaveTypeId} value={t.leaveTypeId}>{t.leaveName}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Leave Dates (From → To) *</label>
            <DateRangeFilter compact from={form.fromDate} to={form.toDate}
              onChange={({ from, to }) => setForm((f) => ({ ...f, fromDate: from, toDate: to }))} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Reason</label>
            <input className={inputCls} value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="e.g. Personal / Medical" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Remarks</label>
            <textarea rows={2} className={inputCls} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
          </div>

          {err && <div className="sm:col-span-2 text-red-600 dark:text-red-400 text-sm font-bold">{err}</div>}

          <div className="sm:col-span-2 flex justify-end gap-2 mt-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
            <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">
              {saving ? 'Saving…' : isEdit ? 'Update Leave' : 'Register Leave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
