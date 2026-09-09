import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash, Upload, X } from './icons.jsx'
import Pagination from './Pagination.jsx'
import DeleteButton from './DeleteButton.jsx'
import EditButton from './EditButton.jsx'
import Loader from './Loader.jsx'
import SearchBox from './SearchBox.jsx'
import SingleDatePicker from './SingleDatePicker.jsx'

const mcPad = (n) => String(n).padStart(2, '0')
const MC_TODAY = (() => { const d = new Date(); return `${d.getFullYear()}-${mcPad(d.getMonth() + 1)}-${mcPad(d.getDate())}` })()
import Toggle from './Toggle.jsx'
import { usePagedList } from './usePagedList.js'
import { useRights } from '../context/RightsContext.jsx'

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-slate-900 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-blue-500'
const labelCls = 'block text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1'

/*
  Generic master screen: list + search + pagination + add/edit popup.
  Props:
    title, idKey, statusKey?
    api: { list, save, getById?, setActive?, remove? }
    columns: [{ key, label, render?(row), searchable?, filterText?(row) }]  // per-column search on by default; searchable:false to hide the icon
    searchText: (row) => string
    fields: [{ name, label, type?, required?, options?, checkboxLabel?, nameField?, full?, rows? }]
    emptyForm, fromRow(rowOrDetail) => form, toPayload(form) => payload
*/
export default function MasterCrud({
  title, idKey, statusKey, moduleKey,
  api, columns, searchText, fields, emptyForm, fromRow, toPayload,
  formCols = 2, formWide = false, // 3-column / wider popup for big forms
}) {
  const { can } = useRights()
  // If no moduleKey is supplied, don't gate (backward compatible).
  const allow = (action) => !moduleKey || can(moduleKey, action)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [confirmDel, setConfirmDel] = useState(null) // row pending delete-confirmation

  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const setColFilter = (key, val) => setColFilters((prev) => ({ ...prev, [key]: val }))
  const colText = (c, row) => (c.filterText ? c.filterText(row) : String(row[c.key] ?? ''))

  // Apply per-column filters first, then hand the survivors to the global search + pager.
  const colFiltered = useMemo(() => {
    const active = columns.filter((c) => c.searchable !== false && (colFilters[c.key] || '').trim())
    if (!active.length) return rows
    return rows.filter((row) =>
      active.every((c) => colText(c, row).toLowerCase().includes(colFilters[c.key].trim().toLowerCase())),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, colFilters])

  const matches = (row, q) => searchText(row).toLowerCase().includes(q)
  const { query, setQuery, page, setPage, pageSize, setPageSize, total, paged, offset } =
    usePagedList(colFiltered, matches)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setRows(await api.list())
    } catch {
      setError('Failed to load. Is the API running / are you logged in?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flash = (m) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 2500)
  }

  const openAdd = () => {
    setForm({ ...emptyForm, [idKey]: null })
    setModalOpen(true)
  }

  const openEdit = async (row) => {
    const detail = api.getById ? await api.getById(row[idKey]) : row
    setForm({ ...fromRow(detail), [idKey]: row[idKey] })
    setModalOpen(true)
  }

  // Actual delete — runs after the in-app confirm dialog (no fragile window.confirm).
  const doDelete = async (row) => {
    setConfirmDel(null)
    setError('')
    try {
      await api.remove(row[idKey])
      flash(`${title} deleted.`)
      load()
    } catch (e) {
      // 409 Conflict from the API carries the "already mapped…" message.
      const m = e?.response?.data?.message || `Could not delete the ${title.toLowerCase()}.`
      setError(m)
    }
  }

  const colCount = 1 + columns.length + (statusKey ? 1 : 0) + 1

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold">{title}</h1>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder={`Search ${title.toLowerCase()}…`}
          className="ml-auto"
        />
        {allow('add') && (
          <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">
            <Plus /> Add {title}
          </button>
        )}
      </div>

      {(msg || error) && (
        <div className={`text-sm font-bold ${error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
          {error || msg}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide align-top">
              <th className="text-left px-4 py-2.5 font-bold w-14">S.No</th>
              {columns.map((c) => (
                <th key={c.key} className="text-left px-4 py-2.5 font-bold">
                  <div className="flex items-center gap-1">
                    <span>{c.label}</span>
                    {c.searchable !== false && (
                      <button onClick={() => setOpenCol(openCol === c.key ? null : c.key)} title={`Search ${c.label}`}
                        className={`p-0.5 rounded ${colFilters[c.key] ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
                        <Search size={12} />
                      </button>
                    )}
                  </div>
                  {c.searchable !== false && openCol === c.key && (
                    <div className="relative mt-1">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={11} /></span>
                      <input autoFocus value={colFilters[c.key] || ''} onChange={(e) => setColFilter(c.key, e.target.value)} placeholder="Search"
                        className="w-full min-w-[80px] pl-6 pr-2 py-1 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f18] text-[12px] normal-case font-normal outline-none focus:border-blue-500" />
                    </div>
                  )}
                </th>
              ))}
              {statusKey && <th className="text-center px-4 py-2.5 font-bold">Status</th>}
              <th className="text-center px-4 py-2.5 font-bold w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colCount} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={colCount} className="px-4 py-6 text-center text-slate-400">No records found.</td></tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row[idKey]} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-2.5">
                      {c.render ? c.render(row) : (row[c.key] ?? '—')}
                    </td>
                  ))}
                  {statusKey && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center">
                        <Toggle readOnly checked={!!row[statusKey]} title={`${row[statusKey] ? 'Active' : 'Inactive'} — open Edit to change`} />
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      {allow('edit') && (
                        <EditButton onClick={() => openEdit(row)} />
                      )}
                      {api.remove && allow('delete') && (
                        <DeleteButton onClick={() => setConfirmDel(row)} />
                      )}
                      {!allow('edit') && !(api.remove && allow('delete')) && <span className="text-slate-400 text-xs">—</span>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={total} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />

      {confirmDel && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setConfirmDel(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-base font-bold flex items-center gap-2">🗑️ Delete {title.toLowerCase()}?</h3>
              <button type="button" onClick={() => setConfirmDel(null)} title="Close" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Delete <b>{String(confirmDel[columns[0]?.key] ?? '')}</b>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDel(null)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
              <button onClick={() => doDelete(confirmDel)} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <FormModal
          title={title}
          idKey={idKey}
          fields={fields}
          form={form}
          setForm={setForm}
          toPayload={toPayload}
          save={api.save}
          cols={formCols}
          wide={formWide}
          onClose={() => setModalOpen(false)}
          onSaved={(m) => { setModalOpen(false); flash(m); load() }}
        />
      )}
    </div>
  )
}

function FormModal({ title, idKey, fields, form, setForm, toPayload, save, cols = 2, wide = false, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = !!form[idKey]
  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    for (const f of fields) {
      if (f.required && f.type !== 'checkbox') {
        const v = form[f.name]
        if (v === undefined || v === null || String(v).trim() === '') {
          return setErr(`${f.label} is required.`)
        }
      }
    }
    setSaving(true)
    try {
      const payload = { [idKey]: form[idKey] ?? null, ...toPayload(form) }
      await save(payload)
      onSaved(isEdit ? `${title} updated.` : `${title} added.`)
    } catch (e2) {
      setErr(e2.response?.data?.message || `Could not save the ${title.toLowerCase()}.`)
    } finally {
      setSaving(false)
    }
  }

  const gridCols = cols === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
  const spanAll = cols === 3 ? 'sm:col-span-3' : 'sm:col-span-2'
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-5 max-h-[92vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-base font-bold">{isEdit ? `Edit ${title}` : `Add ${title}`}</h3>
          <button type="button" onClick={onClose} title="Close"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-slate-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className={`grid grid-cols-1 ${gridCols} gap-x-3 gap-y-2.5`}>
          {fields.map((f) => (
            <div key={f.name} className={f.full ? spanAll : ''}>
              {f.type !== 'checkbox' && (
                <label className={labelCls}>{f.label}{f.required ? ' *' : ''}</label>
              )}
              <Field f={f} value={form[f.name]} setField={setField} />
            </div>
          ))}

          {err && <div className={`${spanAll} text-red-600 dark:text-red-400 text-sm font-bold`}>{err}</div>}

          <div className={`${spanAll} flex justify-end gap-2 mt-1 pt-3 border-t border-slate-200 dark:border-white/10`}>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
            <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">
              {saving ? 'Saving…' : isEdit ? `Update` : `Add ${title}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ f, value, setField }) {
  if (f.type === 'checkbox') {
    return (
      <div className="flex items-center gap-2.5 mt-6">
        <Toggle checked={!!value} onChange={(v) => setField(f.name, v)} />
        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{f.checkboxLabel || f.label}</span>
      </div>
    )
  }
  if (f.type === 'textarea') {
    return (
      <textarea rows={f.rows || 3} className={inputCls} value={value ?? ''} onChange={(e) => setField(f.name, e.target.value)} />
    )
  }
  if (f.type === 'select') {
    return (
      <select className={inputCls} value={value ?? ''} onChange={(e) => setField(f.name, e.target.value)}>
        <option value="">-- select --</option>
        {(f.options || []).map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    )
  }
  if (f.type === 'calendar') {
    return (
      <SingleDatePicker value={value || ''} onChange={(iso) => setField(f.name, iso)} todayIso={MC_TODAY} />
    )
  }
  if (f.type === 'image') {
    const onFile = (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        setField(f.name, reader.result)
        if (f.nameField) setField(f.nameField, file.name)
      }
      reader.readAsDataURL(file)
    }
    return (
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] overflow-hidden flex items-center justify-center text-slate-400 text-xs">
          {value ? <img src={value} alt="preview" className="w-full h-full object-cover" /> : 'No photo'}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300 w-fit">
            <Upload /> Choose image
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
          {value && (
            <button type="button" onClick={() => { setField(f.name, null); if (f.nameField) setField(f.nameField, null) }}
              className="text-xs font-bold text-red-600 dark:text-red-400 w-fit">Remove photo</button>
          )}
        </div>
      </div>
    )
  }
  // text / email / number / date / tel
  return (
    <input type={f.type || 'text'} className={inputCls} value={value ?? ''} onChange={(e) => setField(f.name, e.target.value)} />
  )
}
