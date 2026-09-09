import { useEffect, useMemo, useState } from 'react'
import { useRights } from '../../context/RightsContext.jsx'
import { getImplItems, getAddons, getImplTests } from '../../api/masters.js'
import { getImplementations, getImplementation, saveImplementation, deleteImplementation } from '../../api/implementation.js'
import { Save, Refresh, Clipboard, Plus, Search, Upload, X } from '../../components/icons.jsx'
import DeleteButton from '../../components/DeleteButton.jsx'
import TickBox from '../../components/TickBox.jsx'
import Loader from '../../components/Loader.jsx'

// The task list is managed in Masters → Implementation Checklist. These are only a
// FALLBACK used if the master API is unavailable, so the form is never empty.
const FALLBACK_ITEMS = [
  { taskName: 'SQL Installation', forSingle: true, forMultiple: true },
  { taskName: 'SSMS', forSingle: true, forMultiple: true },
  { taskName: 'IIS Installation', forSingle: true, forMultiple: true },
  { taskName: 'Windows Features', forSingle: true, forMultiple: true },
  { taskName: 'Database Restore', forSingle: true, forMultiple: true },
  { taskName: 'Crystal Reports Tools', forSingle: true, forMultiple: true },
  { taskName: 'Build Hosting and Checking', forSingle: true, forMultiple: true },
  { taskName: 'API Hosting and Checking', forSingle: true, forMultiple: true },
  { taskName: 'Web Config / API URL', forSingle: true, forMultiple: true },
  { taskName: 'Billing Installation / Config Checking', forSingle: true, forMultiple: true },
  { taskName: 'Offline Installation / Online Mode', forSingle: true, forMultiple: true },
  { taskName: 'Static IP / Port Opening', forSingle: true, forMultiple: true },
  { taskName: 'Barcode EXE / PRN Design', forSingle: true, forMultiple: true },
  { taskName: 'Sync Installation and Checking', forSingle: false, forMultiple: true },
].map((it, i) => ({ ...it, displayOrder: i + 1 }))

const ADDONS = ['Unibolt', 'Flitpos', 'COCKPIT', 'E-invoice', 'E-way']
const STATUSES = ['Pending', 'In Progress', 'Completed']

const STATUS_CLS = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  Completed: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
}

// Process-testing statuses (a superset of the checklist statuses).
const TEST_STATUSES = ['Pending', 'In Progress', 'Completed', 'Failed', 'Not Applicable']
const TEST_STATUS_CLS = {
  ...STATUS_CLS,
  Failed: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  'Not Applicable': 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-white/10 dark:text-slate-400 dark:border-white/15',
}
const TEST_GROUPS = ['Backoffice', 'POS']

// Searchable columns for the summary list (key + label + text accessor).
const COLS = [
  { key: 'clientName', label: 'Client Name', text: (r) => r.clientName || '' },
  { key: 'phone', label: 'Phone', text: (r) => r.phone || '' },
  { key: 'responsiblePerson', label: 'Responsible', text: (r) => r.responsiblePerson || '' },
  { key: 'locationType', label: 'Location', text: (r) => (r.locationType === 'multiple' ? 'Multiple' : 'Single') },
]

const card = 'rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] shadow-sm'
const inputCls = 'w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-3 py-2 text-sm outline-none focus:border-blue-500'
const labelCls = 'text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1 block'
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

// ======================= Container: switches list <-> form =======================
export default function ImplementationChecklist() {
  const [mode, setMode] = useState('list') // 'list' | 'form'
  const [editId, setEditId] = useState(null)

  if (mode === 'form') {
    return <ImplementationForm implId={editId} onBack={() => setMode('list')} />
  }
  return (
    <ImplementationList
      onNew={() => { setEditId(null); setMode('form') }}
      onOpen={(id) => { setEditId(id); setMode('form') }}
    />
  )
}

// ======================= Summary list =======================
function ImplementationList({ onNew, onOpen }) {
  const { can } = useRights()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [delRow, setDelRow] = useState(null)
  const [msg, setMsg] = useState('')
  const [colFilters, setColFilters] = useState({}) // per-column search text
  const [openCol, setOpenCol] = useState(null)     // which column's search box is open
  const setColFilter = (key, val) => setColFilters((prev) => ({ ...prev, [key]: val }))

  const load = () => {
    setRows(null); setError('')
    getImplementations().then((r) => setRows(r || [])).catch(() => setError('Failed to load. Is the API running / are you logged in?'))
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let out = rows || []
    // Per-column filters
    for (const c of COLS) {
      const val = (colFilters[c.key] || '').trim().toLowerCase()
      if (val) out = out.filter((r) => c.text(r).toLowerCase().includes(val))
    }
    // Global search across the text columns
    const t = q.trim().toLowerCase()
    if (t) out = out.filter((r) => COLS.map((c) => c.text(r)).join(' ').toLowerCase().includes(t))
    return out
  }, [rows, q, colFilters])

  const doDelete = async (row) => {
    setDelRow(null)
    try {
      await deleteImplementation(row.implId)
      setMsg('Implementation deleted.'); setTimeout(() => setMsg(''), 2500)
      load()
    } catch { setError('Could not delete this record.') }
  }

  return (
    <div className="w-full space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0"><Clipboard size={18} /></span>
        <div>
          <h1 className="text-xl font-bold leading-tight">New Client Implementation</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Saved client implementations — click a client to open</p>
        </div>
        <div className="ml-auto relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={14} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client…"
            className="h-9 pl-8 pr-3 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-sm outline-none focus:border-blue-500" />
        </div>
        {can('implementation', 'add') && (
          <button onClick={onNew} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">
            <Plus /> New Client
          </button>
        )}
      </div>

      {(msg || error) && <div className={`text-sm font-bold ${error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{error || msg}</div>}

      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide align-top">
              <th className="text-left px-4 py-2.5 font-bold w-12">#</th>
              {COLS.map((c) => (
                <th key={c.key} className="text-left px-4 py-2.5 font-bold">
                  <div className="flex items-center gap-1">
                    <span>{c.label}</span>
                    <button onClick={() => setOpenCol(openCol === c.key ? null : c.key)} title={`Search ${c.label}`}
                      className={`p-0.5 rounded ${colFilters[c.key] ? 'text-blue-300' : 'text-slate-300 hover:text-white'}`}>
                      <Search size={12} />
                    </button>
                  </div>
                  {openCol === c.key && (
                    <div className="relative mt-1">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={11} /></span>
                      <input autoFocus value={colFilters[c.key] || ''} onChange={(e) => setColFilter(c.key, e.target.value)} placeholder="Search"
                        className="w-full min-w-[80px] pl-6 pr-2 py-1 rounded border border-white/20 bg-white dark:bg-[#0d0f18] text-slate-800 dark:text-slate-100 text-[12px] normal-case font-normal outline-none focus:border-blue-500" />
                    </div>
                  )}
                </th>
              ))}
              <th className="text-left px-4 py-2.5 font-bold w-40">Completion</th>
              <th className="text-left px-4 py-2.5 font-bold">Saved</th>
              <th className="text-center px-4 py-2.5 font-bold w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr><td colSpan={8} className="px-4 py-8"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No implementations yet. Click <b>New Client</b> to add one.</td></tr>
            ) : filtered.map((r, i) => (
              <tr key={r.implId} onClick={() => onOpen(r.implId)}
                className="border-t border-slate-100 dark:border-white/5 hover:bg-blue-50/60 dark:hover:bg-blue-500/10 cursor-pointer">
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{i + 1}</td>
                <td className="px-4 py-2.5 font-bold text-blue-700 dark:text-blue-300">
                  {r.clientName}{r.hasDocs && <span title="Has PDF / document attachments"> 📎</span>}
                </td>
                <td className="px-4 py-2.5">{r.phone || '—'}</td>
                <td className="px-4 py-2.5">{r.responsiblePerson || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300 capitalize">
                    {r.locationType === 'multiple' ? 'Multiple' : 'Single'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden min-w-[60px]">
                      <div className="h-full bg-green-500" style={{ width: `${r.completionPercent || 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{r.completionPercent || 0}%</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{fmtDate(r.savedAt)}</td>
                <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => onOpen(r.implId)} title="Open" className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline">Open</button>
                    {can('implementation', 'delete') && <DeleteButton onClick={() => setDelRow(r)} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {delRow && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setDelRow(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-2">🗑️ Delete implementation?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Delete <b>{delRow.clientName}</b>? This cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDelRow(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
              <button onClick={() => doDelete(delRow)} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ======================= Editor form (new or existing) =======================
function ImplementationForm({ implId, onBack }) {
  const { can } = useRights()
  const canSave = can('implementation', 'add') || can('implementation', 'edit')

  const [client, setClient] = useState({ name: '', address: '', phone: '', responsible: '' })
  const [locationType, setLocationType] = useState('single')
  const [master, setMaster] = useState(null) // active task definitions from the master
  const [items, setItems] = useState({}) // { [task]: { status, remarks } }
  const [addonList, setAddonList] = useState(ADDONS) // add-on names from the master (fallback = ADDONS)
  const [addons, setAddons] = useState({})
  const [docs, setDocs] = useState([]) // [{ fileName, fileType, fileData(base64) }]
  const [testMaster, setTestMaster] = useState(null) // testing item definitions from the master
  const [testing, setTesting] = useState({}) // { [testName]: { status, remarks } }
  const [flash, setFlash] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingRec, setLoadingRec] = useState(!!implId)

  // Load task definitions from the master (active only); fall back if unavailable.
  useEffect(() => {
    let alive = true
    getImplItems()
      .then((rows) => {
        const active = (rows || []).filter((r) => r.isActive)
        if (alive) setMaster(active.length ? active : FALLBACK_ITEMS)
      })
      .catch(() => { if (alive) setMaster(FALLBACK_ITEMS) })
    return () => { alive = false }
  }, [])

  // Load add-on names from Masters → Add-ons (active only); fall back to the built-in list.
  useEffect(() => {
    let alive = true
    getAddons()
      .then((rows) => {
        const names = (rows || []).filter((r) => r.isActive).map((r) => r.addonName)
        if (alive && names.length) setAddonList(names)
      })
      .catch(() => { /* keep fallback */ })
    return () => { alive = false }
  }, [])

  // Load process-testing items from Masters (active only).
  useEffect(() => {
    let alive = true
    getImplTests()
      .then((rows) => { if (alive) setTestMaster((rows || []).filter((r) => r.isActive)) })
      .catch(() => { if (alive) setTestMaster([]) })
    return () => { alive = false }
  }, [])

  // Seed a per-test entry for every testing item (keep any already-entered values).
  useEffect(() => {
    if (!testMaster) return
    setTesting((prev) => {
      const next = { ...prev }
      for (const t of testMaster) if (!next[t.testName]) next[t.testName] = { status: 'Pending', remarks: '' }
      return next
    })
  }, [testMaster])

  // Seed a per-task entry for every master task (keep any already-entered values).
  useEffect(() => {
    if (!master) return
    setItems((prev) => {
      const next = { ...prev }
      for (const it of master) if (!next[it.taskName]) next[it.taskName] = { status: 'Pending', remarks: '' }
      return next
    })
  }, [master])

  // When opening an existing record, load and overlay its saved values once the master is ready.
  useEffect(() => {
    if (!implId || !master) return
    let alive = true
    setLoadingRec(true)
    getImplementation(implId)
      .then((rec) => {
        if (!alive || !rec) return
        setClient({ name: rec.clientName || '', address: rec.address || '', phone: rec.phone || '', responsible: rec.responsiblePerson || '' })
        setLocationType(rec.locationType === 'multiple' ? 'multiple' : 'single')
        setAddons(Object.fromEntries((rec.addons || []).map((a) => [a, true])))
        setDocs(rec.docs || [])
        setItems((prev) => {
          const next = { ...prev }
          for (const t of rec.tasks || []) next[t.taskName] = { status: t.status || 'Pending', remarks: t.remarks || '' }
          return next
        })
        setTesting((prev) => {
          const next = { ...prev }
          for (const t of rec.testing || []) next[t.testName] = { status: t.status || 'Pending', remarks: t.remarks || '' }
          return next
        })
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingRec(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [implId, master])

  const visibleItems = useMemo(() => {
    const list = (master || []).filter((it) => (locationType === 'multiple' ? it.forMultiple : it.forSingle))
    return [...list].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
  }, [master, locationType])
  const tasks = useMemo(() => visibleItems.map((it) => it.taskName), [visibleItems])
  // Show master add-ons plus any already-selected add-on not currently in the master (so old records stay intact).
  const addonOptions = useMemo(
    () => Array.from(new Set([...addonList, ...Object.keys(addons).filter((k) => addons[k])])),
    [addonList, addons]
  )

  const setItem = (task, patch) => setItems((m) => ({ ...m, [task]: { ...m[task], ...patch } }))
  const toggleDone = (task) => setItem(task, { status: items[task]?.status === 'Completed' ? 'Pending' : 'Completed' })
  const toggleAddon = (name) => setAddons((a) => ({ ...a, [name]: !a[name] }))
  const setTest = (name, patch) => setTesting((m) => ({ ...m, [name]: { ...m[name], ...patch } }))

  // Testing items grouped by Backoffice / POS, ordered by DisplayOrder.
  const testsByGroup = useMemo(() => {
    const list = [...(testMaster || [])].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    const out = {}
    for (const g of TEST_GROUPS) out[g] = list.filter((t) => (t.testGroup || 'Backoffice') === g)
    return out
  }, [testMaster])

  // Read chosen files (PDF/image) into base64 data URIs and append to docs.
  const onFiles = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => setDocs((d) => [...d, { fileName: file.name, fileType: file.type, fileData: reader.result }])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }
  const removeDoc = (i) => setDocs((d) => d.filter((_, idx) => idx !== i))

  const completed = tasks.filter((t) => items[t]?.status === 'Completed').length
  const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000) }

  const reset = () => {
    setClient({ name: '', address: '', phone: '', responsible: '' })
    setLocationType('single')
    const blank = {}
    for (const it of master || []) blank[it.taskName] = { status: 'Pending', remarks: '' }
    setItems(blank)
    const blankTest = {}
    for (const t of testMaster || []) blankTest[t.testName] = { status: 'Pending', remarks: '' }
    setTesting(blankTest)
    setAddons({})
    setDocs([])
    showFlash('Form cleared.')
  }

  const save = async () => {
    if (!client.name.trim()) { showFlash('Please enter the client name.'); return }
    setSaving(true)
    const payload = {
      implId: implId || null,
      clientName: client.name.trim(),
      address: client.address,
      phone: client.phone,
      responsiblePerson: client.responsible,
      locationType,
      addons: addonOptions.filter((a) => addons[a]),
      docs,
      testing: (testMaster || []).map((t, i) => ({
        testName: t.testName,
        group: t.testGroup || 'Backoffice',
        status: testing[t.testName]?.status || 'Pending',
        remarks: testing[t.testName]?.remarks || '',
        sortOrder: t.displayOrder || i + 1,
      })),
      completionPercent: pct,
      tasks: visibleItems.map((it, i) => ({
        taskName: it.taskName,
        status: items[it.taskName]?.status || 'Pending',
        remarks: items[it.taskName]?.remarks || '',
        sortOrder: i + 1,
      })),
    }
    try {
      await saveImplementation(payload)
      onBack()
    } catch (e) {
      showFlash(e?.response?.data?.message || 'Could not save. Check your rights / the API.')
      setSaving(false)
    }
  }

  return (
    <div className="w-full space-y-5 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0"><Clipboard size={18} /></span>
        <div>
          <h1 className="text-xl font-bold leading-tight">{implId ? 'Edit Implementation' : 'New Client Implementation'}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Installation checklist &amp; add-ons</p>
        </div>
      </div>

      {flash && <div className="rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 text-green-700 dark:text-green-300 text-sm font-bold px-3 py-2">{flash}</div>}

      {loadingRec ? (
        <div className="flex justify-center py-12"><Loader label="Loading…" /></div>
      ) : (
        <>
          {/* 1) Client details */}
          <div className={`${card} p-4 sm:p-5`}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Client Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Client Name</label>
                <input className={inputCls} value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} placeholder="Client / company name" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} placeholder="Contact number" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Address</label>
                <textarea rows={2} className={inputCls} value={client.address} onChange={(e) => setClient({ ...client, address: e.target.value })} placeholder="Full site address" />
              </div>
              <div>
                <label className={labelCls}>Responsible Person</label>
                <input className={inputCls} value={client.responsible} onChange={(e) => setClient({ ...client, responsible: e.target.value })} placeholder="Who owns this implementation" />
              </div>
              <div>
                <label className={labelCls}>Location Type</label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {[{ v: 'single', l: 'Single Location' }, { v: 'multiple', l: 'Multiple Location' }].map((o) => (
                    <button key={o.v} type="button" onClick={() => setLocationType(o.v)}
                      className={`inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-bold transition-colors ${locationType === o.v ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full border-2 ${locationType === o.v ? 'border-white bg-white/30' : 'border-slate-400'}`} />
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2) Implementation checklist */}
          <div className={`${card} overflow-hidden`}>
            <div className="flex items-center justify-between gap-3 flex-wrap px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-white/10">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Implementation Checklist</h2>
              <div className="flex items-center gap-2 min-w-[180px]">
                <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{completed}/{tasks.length} · {pct}%</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                    <th className="px-3 py-2 w-12 text-center">#</th>
                    <th className="px-3 py-2 w-14 text-center">Done</th>
                    <th className="px-3 py-2">Task</th>
                    <th className="px-3 py-2 w-40">Status</th>
                    <th className="px-3 py-2 w-72">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {master === null ? (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">Loading checklist…</td></tr>
                  ) : visibleItems.length === 0 ? (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-400">No checklist tasks. Add some in Masters → Implementation Checklist.</td></tr>
                  ) : visibleItems.map((defn, i) => {
                    const task = defn.taskName
                    const it = items[task] || { status: 'Pending', remarks: '' }
                    const done = it.status === 'Completed'
                    const isSync = defn.forSingle === false
                    return (
                      <tr key={task} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                        <td className="px-3 py-2 text-center text-slate-400 font-bold">{i + 1}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex justify-center">
                            <TickBox checked={done} onChange={() => toggleDone(task)} title={done ? 'Completed' : 'Mark completed'} />
                          </div>
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200">
                          {task}{isSync && <span className="text-blue-500" title="Multiple-location only"> *</span>}
                        </td>
                        <td className="px-3 py-2">
                          <select value={it.status} onChange={(e) => setItem(task, { status: e.target.value })}
                            className={`w-full rounded-lg border px-2 py-1.5 text-xs font-bold outline-none cursor-pointer ${STATUS_CLS[it.status]}`}>
                            {STATUSES.map((s) => <option key={s} value={s} className="bg-white dark:bg-[#1e2235] text-slate-700 dark:text-slate-200">{s}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input value={it.remarks} onChange={(e) => setItem(task, { remarks: e.target.value })} placeholder="Optional remarks"
                            className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-2 py-1.5 text-xs outline-none focus:border-blue-500" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {visibleItems.some((it) => it.forSingle === false) && (
              <p className="px-4 sm:px-5 py-2 text-[11px] text-slate-400 dark:text-slate-500">* Task required for multiple-location implementations.</p>
            )}
          </div>

          {/* 3) Add-ons */}
          <div className={`${card} p-4 sm:p-5`}>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Add-ons</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {addonOptions.map((name) => {
                const on = !!addons[name]
                return (
                  <div key={name} role="button" onClick={() => toggleAddon(name)}
                    className={`inline-flex items-center gap-2.5 h-12 px-3 rounded-lg border cursor-pointer select-none text-sm font-bold transition-colors ${on ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                    <TickBox checked={on} />
                    {name}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4) Process testing (Backoffice / POS) */}
          {(testMaster === null || (testMaster && testMaster.length > 0)) && (
            <div className={`${card} overflow-hidden`}>
              <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-white/10">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Process Testing</h2>
              </div>
              {testMaster === null ? (
                <p className="px-4 sm:px-5 py-6 text-center text-slate-400">Loading testing items…</p>
              ) : (
                TEST_GROUPS.map((group) => {
                  const list = testsByGroup[group] || []
                  if (!list.length) return null
                  return (
                    <div key={group}>
                      <div className="px-4 sm:px-5 py-2 bg-slate-50 dark:bg-white/[0.03] text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                        {group} Testing
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[640px]">
                          <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                              <th className="px-3 py-2 w-12 text-center">#</th>
                              <th className="px-3 py-2">Process / Test</th>
                              <th className="px-3 py-2 w-44">Status</th>
                              <th className="px-3 py-2 w-72">Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list.map((defn, i) => {
                              const name = defn.testName
                              const it = testing[name] || { status: 'Pending', remarks: '' }
                              return (
                                <tr key={name} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                                  <td className="px-3 py-2 text-center text-slate-400 font-bold">{i + 1}</td>
                                  <td className="px-3 py-2 font-bold text-slate-700 dark:text-slate-200">{name}</td>
                                  <td className="px-3 py-2">
                                    <select value={it.status} onChange={(e) => setTest(name, { status: e.target.value })}
                                      className={`w-full rounded-lg border px-2 py-1.5 text-xs font-bold outline-none cursor-pointer ${TEST_STATUS_CLS[it.status] || ''}`}>
                                      {TEST_STATUSES.map((s) => <option key={s} value={s} className="bg-white dark:bg-[#1e2235] text-slate-700 dark:text-slate-200">{s}</option>)}
                                    </select>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input value={it.remarks} onChange={(e) => setTest(name, { remarks: e.target.value })} placeholder="Optional remarks"
                                      className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-2 py-1.5 text-xs outline-none focus:border-blue-500" />
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* 5) Supporting documents (PDF / image) */}
          <div className={`${card} p-4 sm:p-5`}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Supporting Documents</h2>
              <label className="upload-btn cursor-pointer">
                <Upload /> Attach File
                <input type="file" accept="application/pdf,image/*" multiple onChange={onFiles} className="hidden" />
              </label>
            </div>
            {docs.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">No documents attached. Attach PDF or image bills / approvals.</p>
            ) : (
              <ul className="space-y-1.5">
                {docs.map((d, i) => {
                  const isPdf = (d.fileType || '').includes('pdf') || (d.fileData || '').startsWith('data:application/pdf')
                  return (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span>{isPdf ? '📄' : '🖼️'}</span>
                      <a href={d.fileData} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline max-w-[280px] truncate" title={`Open ${d.fileName}`}>{d.fileName}</a>
                      <button type="button" onClick={() => removeDoc(i)} title="Remove" className="ml-1 text-slate-400 hover:text-red-500"><X size={14} /></button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pb-2">
            <button type="button" onClick={reset} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-300 dark:border-white/15 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-white/5">
              <Refresh size={16} /> Clear
            </button>
            <button type="button" onClick={save} disabled={!canSave || saving} title={canSave ? 'Save' : 'You do not have rights to save'}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold">
              <Save size={16} /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
