import { useEffect, useState } from 'react'
import { getGroups, saveGroup, deleteGroup } from '../../api/userManagement.js'
import { Pencil, Plus, Search, Trash, X } from '../../components/icons.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DeleteButton from '../../components/DeleteButton.jsx'
import EditButton from '../../components/EditButton.jsx'
import Loader from '../../components/Loader.jsx'
import Pagination from '../../components/Pagination.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import Toggle from '../../components/Toggle.jsx'
import { usePagedList } from '../../components/usePagedList.js'

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-slate-900 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-blue-500'
const labelCls = 'block text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1'

const emptyForm = { groupId: null, groupName: '', description: '', isActive: true }
const matchGroup = (g, q) => `${g.groupName} ${g.description || ''}`.toLowerCase().includes(q)

const COLS = [
  { key: 'groupName', label: 'Group Name', get: (g) => g.groupName || '' },
  { key: 'description', label: 'Description', get: (g) => g.description || '' },
]

export default function UserGroups() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [confirmDel, setConfirmDel] = useState(null) // group row pending delete-confirmation
  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const setColFilter = (k, v) => setColFilters((p) => ({ ...p, [k]: v }))

  const active = COLS.filter((c) => (colFilters[c.key] || '').trim())
  const colFiltered = active.length
    ? groups.filter((g) => active.every((c) => c.get(g).toLowerCase().includes(colFilters[c.key].trim().toLowerCase())))
    : groups

  const { query, setQuery, page, setPage, pageSize, setPageSize, total, paged, offset } =
    usePagedList(colFiltered, matchGroup)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setGroups(await getGroups())
    } catch {
      setError('Failed to load groups. Is the API running / are you logged in?')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const flash = (m) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 2500)
  }

  const openAdd = () => {
    setForm(emptyForm)
    setModalOpen(true)
  }
  const openEdit = (g) => {
    setForm({ groupId: g.groupId, groupName: g.groupName, description: g.description || '', isActive: g.isActive })
    setModalOpen(true)
  }

  // Actual delete — runs after the in-app confirm dialog (no fragile window.confirm).
  const doDeleteGroup = async (g) => {
    setConfirmDel(null)
    setError('')
    try { await deleteGroup(g.groupId); flash('Group deleted.'); load() }
    catch (e) { setError(e?.response?.data?.message || 'Could not delete the group.') }
  }

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold">User Groups</h1>
        <SearchBox value={query} onChange={setQuery} placeholder="Search groups…" className="ml-auto" />
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">
          <Plus /> Add Group
        </button>
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
              <th className="text-left px-4 py-2.5 font-bold w-16">S.No</th>
              {COLS.map((c) => (
                <th key={c.key} className="text-left px-4 py-2.5 font-bold">
                  <div className="flex items-center gap-1">
                    <span>{c.label}</span>
                    <button onClick={() => setOpenCol(openCol === c.key ? null : c.key)} title={`Search ${c.label}`}
                      className={`p-0.5 rounded ${colFilters[c.key] ? 'text-blue-300' : 'text-slate-300 hover:text-white'}`}><Search size={12} /></button>
                  </div>
                  {openCol === c.key && (
                    <div className="relative mt-1">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Search size={11} /></span>
                      <input autoFocus value={colFilters[c.key] || ''} onChange={(e) => setColFilter(c.key, e.target.value)} placeholder="Search"
                        className="w-full min-w-[90px] pl-6 pr-2 py-1 rounded border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0d0f18] text-[12px] normal-case font-normal text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500" />
                    </div>
                  )}
                </th>
              ))}
              <th className="text-left px-4 py-2.5 font-bold">Status</th>
              <th className="text-center px-4 py-2.5 font-bold w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No groups found.</td></tr>
            ) : (
              paged.map((g, i) => (
                <tr key={g.groupId} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                  <td className="px-4 py-2.5 font-bold">{g.groupName}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{g.description || '—'}</td>
                  <td className="px-4 py-2.5">
                    <Toggle readOnly checked={!!g.isActive} title={`${g.isActive ? 'Active' : 'Inactive'} — open Edit to change`} />
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <EditButton onClick={() => openEdit(g)} />
                      <DeleteButton onClick={() => setConfirmDel(g)} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={total} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />

      {modalOpen && (
        <GroupModal
          form={form}
          setForm={setForm}
          onClose={() => setModalOpen(false)}
          onSaved={(m) => { setModalOpen(false); flash(m); load() }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDel}
        title="🗑️ Delete group?"
        message={<>Delete <b>{confirmDel?.groupName}</b>? This cannot be undone.</>}
        confirmLabel="Delete"
        danger
        onConfirm={() => doDeleteGroup(confirmDel)}
        onClose={() => setConfirmDel(null)}
      />
    </div>
  )
}

function GroupModal({ form, setForm, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = !!form.groupId
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!form.groupName.trim()) return setErr('Group name is required.')
    setSaving(true)
    try {
      await saveGroup({
        groupId: form.groupId,
        groupName: form.groupName.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
      })
      onSaved(isEdit ? 'Group updated.' : 'Group added.')
    } catch {
      setErr('Could not save the group.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold">{isEdit ? 'Edit Group' : 'Add Group'}</h3>
          <button type="button" onClick={onClose} title="Close"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className={labelCls}>Group Name *</label>
            <input className={inputCls} value={form.groupName} onChange={(e) => set('groupName', e.target.value)} placeholder="e.g. HR Team" autoFocus />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex items-center gap-2.5">
            <Toggle checked={!!form.isActive} onChange={(v) => set('isActive', v)} />
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Active</span>
          </div>
          {err && <div className="text-red-600 dark:text-red-400 text-sm font-bold">{err}</div>}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
            <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">
              {saving ? 'Saving…' : isEdit ? 'Update' : 'Add Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
