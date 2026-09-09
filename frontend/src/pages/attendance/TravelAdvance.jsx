import { useEffect, useState } from 'react'
import { useRights } from '../../context/RightsContext.jsx'
import { getTravelAdvances, getTravelAdvance, saveTravelAdvance, setTravelStatus, deleteTravelAdvance } from '../../api/travel.js'
import { getEmployees, getDepartments } from '../../api/masters.js'
import { Pencil, Plus, Search, Check, Ban, Paperclip, X, Eye } from '../../components/icons.jsx'
import Loader from '../../components/Loader.jsx'
import Pagination from '../../components/Pagination.jsx'
import DateRangeFilter from '../../components/DateRangeFilter.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import DeleteButton from '../../components/DeleteButton.jsx'
import EditButton from '../../components/EditButton.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import TravelDetailModal from '../../components/TravelDetailModal.jsx'

const now = new Date()
const pad = (n) => String(n).padStart(2, '0')
const isoToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
const fmt = (d) => (d ? String(d).slice(0, 10) : '')
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const money = (n) => `₹${num(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const daysBetween = (a, b) => { if (!a || !b) return ''; const d = Math.round((new Date(b) - new Date(a)) / 86400000) + 1; return d > 0 ? d : '' }

const inputCls = 'w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-slate-900 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-blue-500'
const labelCls = 'block text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1'

const EXPENSES = [
  { k: 'busTicket', label: 'Bus Ticket' },
  { k: 'trainTicket', label: 'Train Ticket' },
  { k: 'flightTicket', label: 'Flight Ticket' },
  { k: 'bikeExpense', label: 'Bike' },
  { k: 'taxi', label: 'Taxi' },
  { k: 'hotelBill', label: 'Hotel / Room Bill' },
  { k: 'foodBill', label: 'Food / Mess Bill' },
  { k: 'otherExpense', label: 'Other Expenses' },
]
const emptyForm = {
  travelId: null, employeeId: '', clientName: '', clientLocation: '',
  travelStartDate: isoToday, travelEndDate: isoToday, onsiteDays: 1,
  advanceAmount: '', busTicket: '', trainTicket: '', flightTicket: '', bikeExpense: '', taxi: '', hotelBill: '', foodBill: '', otherExpense: '',
  remarks: '', documents: [],
}
// Per-column search accessors.
const COL_TEXT = {
  employee: (r) => `${r.employeeName || ''} ${r.employeeCode || ''}`,
  client: (r) => r.clientName || '',
  location: (r) => r.clientLocation || '',
  status: (r) => r.approvalStatus || '',
}

const STATUS_CLS = {
  Approved: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
}
const Status = ({ s }) => <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_CLS[s] || STATUS_CLS.Pending}`}>{s}</span>

export default function TravelAdvance() {
  const { can } = useRights()
  const canAdd = can('travel-advance', 'add')
  const canEdit = can('travel-advance', 'edit')
  const canDelete = can('travel-advance', 'delete')

  const [range, setRange] = useState(() => {
    // Wide window (±6 months) so future-dated travel advances are visible by default.
    const p = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const e = new Date(now.getFullYear(), now.getMonth() + 7, 0)
    return { from: `${p.getFullYear()}-${pad(p.getMonth() + 1)}-01`, to: `${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}` }
  })
  const [departmentId, setDepartmentId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [departments, setDepartments] = useState([])
  const [employees, setEmployees] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [confirmDel, setConfirmDel] = useState(null)
  const [viewId, setViewId] = useState(null)
  const [query, setQuery] = useState('')
  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const load = async () => {
    setLoading(true); setError('')
    try { setRows(await getTravelAdvances(range.from, range.to, departmentId, statusFilter)) }
    catch { setError('Failed to load. Did you run 33_travel_advance.sql and restart the API?') }
    finally { setLoading(false) }
  }
  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {})
    getEmployees().then((e) => setEmployees(e.filter((x) => x.isActive))).catch(() => {})
  }, [])
  useEffect(() => { load() }, [range, departmentId, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }
  const openAdd = () => { setForm({ ...emptyForm, employeeId: employees[0]?.employeeId ? String(employees[0].employeeId) : '' }); setModalOpen(true) }
  const openEdit = async (r) => {
    try {
      const d = await getTravelAdvance(r.travelId)
      let docs = []
      try { docs = d.documentsJson ? JSON.parse(d.documentsJson) : [] } catch { docs = [] }
      setForm({
        travelId: d.travelId, employeeId: String(d.employeeId), clientName: d.clientName || '', clientLocation: d.clientLocation || '',
        travelStartDate: fmt(d.travelStartDate), travelEndDate: fmt(d.travelEndDate), onsiteDays: d.onsiteDays,
        advanceAmount: d.advanceAmount, busTicket: d.busTicket, trainTicket: d.trainTicket, flightTicket: d.flightTicket,
        bikeExpense: d.bikeExpense, taxi: d.taxi, hotelBill: d.hotelBill, foodBill: d.foodBill, otherExpense: d.otherExpense,
        remarks: d.remarks || '', documents: docs,
      })
      setModalOpen(true)
    } catch { setError('Could not open the record.') }
  }
  const changeStatus = async (r, status) => {
    setError('')
    try { await setTravelStatus(r.travelId, status); flash(`Marked ${status}.`); load() }
    catch (e) { setError(e.response?.status === 403 ? 'You do not have permission to approve/reject.' : 'Could not update the status.') }
  }
  const doDelete = async (r) => {
    setConfirmDel(null); setError('')
    try { await deleteTravelAdvance(r.travelId); flash('Deleted.'); load() }
    catch (e) { setError(e.response?.data?.message || 'Could not delete.') }
  }

  const setColFilter = (k, v) => setColFilters((p) => ({ ...p, [k]: v }))
  const gq = query.trim().toLowerCase()
  const filtered = rows.filter((r) => {
    if (gq && !`${r.employeeName} ${r.employeeCode} ${r.clientName} ${r.clientLocation}`.toLowerCase().includes(gq)) return false
    for (const k of Object.keys(colFilters)) {
      const f = (colFilters[k] || '').trim().toLowerCase()
      if (f && !COL_TEXT[k](r).toLowerCase().includes(f)) return false
    }
    return true
  })
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageRows = filtered.slice(offset, offset + pageSize)
  const totAdvance = filtered.reduce((a, r) => a + num(r.advanceAmount), 0)
  const totExpense = filtered.reduce((a, r) => a + num(r.totalExpense), 0)

  const searchTh = (key, label, align = 'left') => (
    <th className={`px-3 py-2.5 font-bold align-top ${align === 'left' ? 'text-left' : 'text-center'}`}>
      <div className={`flex items-center gap-1 ${align === 'left' ? 'justify-start' : 'justify-center'}`}>
        <span>{label}</span>
        <button onClick={() => setOpenCol(openCol === key ? null : key)} title={`Search ${label}`}
          className={`p-0.5 rounded ${colFilters[key] ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}><Search size={12} /></button>
      </div>
      {openCol === key && (
        <div className="relative mt-1">
          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={11} /></span>
          <input autoFocus value={colFilters[key] || ''} onChange={(e) => setColFilter(key, e.target.value)} placeholder="Search"
            className="w-full min-w-[80px] pl-6 pr-2 py-1 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f18] text-[12px] normal-case font-normal outline-none focus:border-blue-500" />
        </div>
      )}
    </th>
  )

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold">🧳 Travel Allowance</h1>
        <SearchBox value={query} onChange={setQuery} placeholder="Search…" className="ml-auto" />
        {canAdd && (
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"><Plus /> New Advance</button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-xs font-bold px-2 outline-none">
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <DateRangeFilter from={range.from} to={range.to} onChange={setRange} departments={departments} departmentId={departmentId} setDepartmentId={setDepartmentId} />
      </div>

      {(msg || error) && <div className={`text-sm font-bold ${error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{error || msg}</div>}

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide align-top">
              <th className="text-left px-3 py-2.5 font-bold w-12">S.No</th>
              {searchTh('employee', 'Employee')}
              {searchTh('client', 'Client')}
              {searchTh('location', 'Location')}
              <th className="text-left px-3 py-2.5 font-bold">Travel</th>
              <th className="text-center px-3 py-2.5 font-bold">Days</th>
              <th className="text-right px-3 py-2.5 font-bold">Advance</th>
              <th className="text-right px-3 py-2.5 font-bold">Expense</th>
              <th className="text-right px-3 py-2.5 font-bold">Balance</th>
              {searchTh('status', 'Status', 'center')}
              <th className="text-center px-3 py-2.5 font-bold w-40">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={11} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
              : filtered.length === 0 ? <tr><td colSpan={11} className="px-4 py-6 text-center text-slate-400">No travel advances.</td></tr>
                : pageRows.map((r, i) => (
                  <tr key={r.travelId} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                    <td className="px-3 py-2 font-bold">{r.employeeName} {r.hasDocs && <span title="Has documents" className="text-slate-400"><Paperclip size={12} /></span>}</td>
                    <td className="px-3 py-2">{r.clientName}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.clientLocation}</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmt(r.travelStartDate)} → {fmt(r.travelEndDate)}</td>
                    <td className="px-3 py-2 text-center">{r.onsiteDays}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(r.advanceAmount)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(r.totalExpense)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-bold ${num(r.balanceAmount) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} title={num(r.balanceAmount) < 0 ? 'Office reimburses' : 'Employee returns'}>{money(r.balanceAmount)}</td>
                    <td className="px-3 py-2 text-center"><Status s={r.approvalStatus} /></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setViewId(r.travelId)} title="View details & documents" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"><Eye size={16} /></button>
                        {canEdit && r.approvalStatus !== 'Approved' && (
                          <button onClick={() => changeStatus(r, 'Approved')} title="Approve" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"><Check size={16} /></button>
                        )}
                        {canEdit && r.approvalStatus !== 'Rejected' && (
                          <button onClick={() => changeStatus(r, 'Rejected')} title="Reject" className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"><Ban size={16} /></button>
                        )}
                        {canEdit && <EditButton onClick={() => openEdit(r)} />}
                        {canDelete && <DeleteButton onClick={() => setConfirmDel(r)} />}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot><tr className="border-t-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e2235] font-bold">
              <td className="px-3 py-2.5" colSpan={6}>Total ({filtered.length})</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{money(totAdvance)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{money(totExpense)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{money(totAdvance - totExpense)}</td>
              <td colSpan={2} />
            </tr></tfoot>
          )}
        </table>
      </div>

      {filtered.length > 0 && <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />}

      {confirmDel && (
        <ConfirmDialog open title="🗑️ Delete travel allowance?" confirmLabel="Delete"
          message={<>Delete <b>{confirmDel.employeeName}</b>'s travel allowance for <b>{confirmDel.clientName}</b>? This cannot be undone.</>}
          onConfirm={() => doDelete(confirmDel)} onClose={() => setConfirmDel(null)} />
      )}

      {viewId && <TravelDetailModal travelId={viewId} onClose={() => setViewId(null)} />}

      {modalOpen && <TravelModal form={form} setForm={setForm} employees={employees} onClose={() => setModalOpen(false)}
        onSaved={(m, sFrom, sTo) => {
          setModalOpen(false); flash(m)
          // Keep the just-saved record visible even if its travel date is outside the current filter.
          if (sFrom && sTo) setRange((r) => ({ from: sFrom < r.from ? sFrom : r.from, to: sTo > r.to ? sTo : r.to }))
          setPage(1)
          load()
        }} />}
    </div>
  )
}

function TravelModal({ form, setForm, employees, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = !!form.travelId
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setExpense = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const total = EXPENSES.reduce((a, e) => a + num(form[e.k]), 0)
  const balance = num(form.advanceAmount) - total

  const setDates = ({ from, to }) => setForm((f) => ({ ...f, travelStartDate: from, travelEndDate: to, onsiteDays: daysBetween(from, to) || f.onsiteDays }))

  const onFiles = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { setErr(`${file.name} is over 5 MB.`); return }
      const r = new FileReader()
      r.onload = () => setForm((f) => ({ ...f, documents: [...f.documents, { fileName: file.name, fileType: file.type, fileData: r.result }] }))
      r.readAsDataURL(file)
    })
    e.target.value = ''
  }
  const removeDoc = (i) => setForm((f) => ({ ...f, documents: f.documents.filter((_, idx) => idx !== i) }))

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!form.employeeId) return setErr('Please select an employee.')
    if (!form.clientName.trim()) return setErr('Client name is required.')
    if (!form.clientLocation.trim()) return setErr('Client location is required.')
    if (!form.travelStartDate || !form.travelEndDate) return setErr('Travel start and end dates are required.')
    if (form.travelEndDate < form.travelStartDate) return setErr('End date cannot be before start date.')
    setSaving(true)
    try {
      await saveTravelAdvance({
        travelId: form.travelId,
        employeeId: Number(form.employeeId),
        clientName: form.clientName.trim(), clientLocation: form.clientLocation.trim(),
        travelStartDate: form.travelStartDate, travelEndDate: form.travelEndDate,
        onsiteDays: Number(form.onsiteDays) || 0,
        advanceAmount: num(form.advanceAmount),
        busTicket: num(form.busTicket), trainTicket: num(form.trainTicket), flightTicket: num(form.flightTicket),
        bikeExpense: num(form.bikeExpense), taxi: num(form.taxi), hotelBill: num(form.hotelBill), foodBill: num(form.foodBill), otherExpense: num(form.otherExpense),
        remarks: form.remarks.trim() || null,
        documentsJson: form.documents.length ? JSON.stringify(form.documents) : null,
      })
      onSaved(isEdit ? 'Travel allowance updated.' : 'Travel allowance saved.', form.travelStartDate, form.travelEndDate)
    } catch (e2) { setErr(e2.response?.data?.message || 'Could not save.') } finally { setSaving(false) }
  }

  const numInput = (k, label) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input type="number" min="0" step="0.01" className={inputCls} value={form[k]} onChange={(e) => setExpense(k, e.target.value)} placeholder="0.00" />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold">{isEdit ? 'Edit Travel Allowance' : 'New Travel Allowance'}</h3>
          <button type="button" onClick={onClose} title="Close" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><label className={labelCls}>Employee *</label>
            <select className={inputCls} value={form.employeeId} onChange={(e) => set('employeeId', e.target.value)}>
              <option value="">-- select --</option>
              {employees.map((e) => <option key={e.employeeId} value={e.employeeId}>{e.name} ({e.employeeCode})</option>)}
            </select>
          </div>
          <div><label className={labelCls}>Client Name *</label><input className={inputCls} value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="Client / company" /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Client Location *</label><input className={inputCls} value={form.clientLocation} onChange={(e) => set('clientLocation', e.target.value)} placeholder="City / place of visit" /></div>

          <div>
            <label className={labelCls}>Travel Dates (Start → End) *</label>
            <DateRangeFilter compact from={form.travelStartDate} to={form.travelEndDate} onChange={setDates} />
          </div>
          <div><label className={labelCls}>Onsite Days *</label><input type="number" min="0" className={inputCls} value={form.onsiteDays} onChange={(e) => set('onsiteDays', e.target.value)} /></div>
          <div><label className={labelCls}>Advance Amount Issued *</label><input type="number" min="0" step="0.01" className={inputCls} value={form.advanceAmount} onChange={(e) => set('advanceAmount', e.target.value)} placeholder="0.00" /></div>

          <div className="sm:col-span-2 mt-1">
            <div className="text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-2">Expense Breakdown</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {EXPENSES.map((e) => <div key={e.k}>{numInput(e.k, e.label)}</div>)}
            </div>
          </div>

          {/* Totals */}
          <div className="sm:col-span-2 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e2235] p-3">
              <div className="text-[11px] uppercase font-bold text-slate-400">Total Expense</div>
              <div className="text-lg font-bold">{money(total)}</div>
            </div>
            <div className={`rounded-lg border p-3 ${balance < 0 ? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10' : 'border-green-300 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10'}`}>
              <div className="text-[11px] uppercase font-bold text-slate-400">Balance ({balance < 0 ? 'Reimburse to employee' : 'Employee returns'})</div>
              <div className={`text-lg font-bold ${balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{money(balance)}</div>
            </div>
          </div>

          {/* Documents */}
          <div className="sm:col-span-2">
            <label className={labelCls}>Supporting Documents (optional)</label>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="upload-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="currentColor" aria-hidden="true"><path d="M144 480C64.5 480 0 415.5 0 336c0-62.8 40.2-116.2 96.2-135.9c-.1-2.7-.2-5.4-.2-8.1c0-88.4 71.6-160 160-160c59.3 0 111 32.2 138.7 80.2C409.9 102 428.3 96 448 96c53 0 96 43 96 96c0 12.2-2.3 23.8-6.4 34.6C596 238.4 640 290.1 640 352c0 70.7-57.3 128-128 128H144zm79-217l80-80c9.4-9.4 24.6-9.4 33.9 0l80 80c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-39-39V392c0 13.3-10.7 24-24 24s-24-10.7-24-24V257.9l-39 39c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9z" /></svg>
                Attach File
                <input type="file" accept="image/*,application/pdf" multiple onChange={onFiles} className="hidden" />
              </label>
              {form.documents.map((d, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-bold">
                  <a href={d.fileData} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline max-w-[160px] truncate">{d.fileName}</a>
                  <button type="button" onClick={() => removeDoc(i)} className="text-red-500 hover:text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2"><label className={labelCls}>Remarks</label><textarea rows={2} className={inputCls} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="Additional comments…" /></div>

          {err && <div className="sm:col-span-2 text-red-600 dark:text-red-400 text-sm font-bold">{err}</div>}
          <div className="sm:col-span-2 flex justify-end gap-2 mt-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
            <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">{saving ? 'Saving…' : isEdit ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
