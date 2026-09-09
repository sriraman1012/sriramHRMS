import { useEffect, useState } from 'react'
import { getUsers, getUser, addUser, updateUser, getGroups, deleteUser } from '../../api/userManagement.js'
import { Pencil, Plus, Search, Trash, X } from '../../components/icons.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import DeleteButton from '../../components/DeleteButton.jsx'
import EditButton from '../../components/EditButton.jsx'
import Loader from '../../components/Loader.jsx'
import PasswordInput from '../../components/PasswordInput.jsx'
import Pagination from '../../components/Pagination.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import Toggle from '../../components/Toggle.jsx'
import { usePagedList } from '../../components/usePagedList.js'

const inputCls =
  'w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-slate-900 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-blue-500'
const labelCls = 'block text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1'

const emptyForm = {
  userId: null, username: '', password: '', confirm: '',
  email: '', mobile: '', address1: '', address2: '', designation: '',
  groupId: '', isActive: true,
}
const matchUser = (u, q) =>
  `${u.userCode || ''} ${u.username} ${u.email || ''} ${u.mobile || ''} ${u.designation || ''} ${u.groupName || ''}`
    .toLowerCase()
    .includes(q)

// Per-column search config (order matches the table body).
const COLS = [
  { key: 'userCode', label: 'Code', get: (u) => u.userCode || '' },
  { key: 'username', label: 'Username', get: (u) => u.username || '' },
  { key: 'groupName', label: 'Group', get: (u) => u.groupName || '' },
  { key: 'email', label: 'Email', get: (u) => u.email || '' },
  { key: 'mobile', label: 'Mobile', get: (u) => u.mobile || '' },
  { key: 'designation', label: 'Designation', get: (u) => u.designation || '' },
]

export default function Users() {
  const [users, setUsers] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [confirmDel, setConfirmDel] = useState(null) // user row pending delete-confirmation
  const [colFilters, setColFilters] = useState({})
  const [openCol, setOpenCol] = useState(null)
  const setColFilter = (k, v) => setColFilters((p) => ({ ...p, [k]: v }))

  // Apply per-column filters first, then the global search + pager.
  const active = COLS.filter((c) => (colFilters[c.key] || '').trim())
  const colFiltered = active.length
    ? users.filter((u) => active.every((c) => c.get(u).toLowerCase().includes(colFilters[c.key].trim().toLowerCase())))
    : users

  const { query, setQuery, page, setPage, pageSize, setPageSize, total, paged, offset } =
    usePagedList(colFiltered, matchUser)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setUsers(await getUsers())
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    getGroups().then(setGroups).catch(() => {})
  }, [])

  const flash = (m) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 2500)
  }

  const openAdd = () => {
    setForm({ ...emptyForm, groupId: groups[0]?.groupId ? String(groups[0].groupId) : '' })
    setModalOpen(true)
  }

  // Actual delete — runs after the in-app confirm dialog (no fragile window.confirm).
  const doDeleteUser = async (u) => {
    setConfirmDel(null)
    setError('')
    try { await deleteUser(u.userId); flash('User deleted.'); load() }
    catch (e) { setError(e?.response?.data?.message || 'Could not delete the user.') }
  }

  const openEdit = async (id) => {
    const u = await getUser(id)
    setForm({
      userId: u.userId, username: u.username, password: '', confirm: '',
      email: u.email || '', mobile: u.mobile || '', address1: u.address1 || '',
      address2: u.address2 || '', designation: u.designation || '',
      groupId: u.groupId ? String(u.groupId) : '', isActive: u.isActive,
    })
    setModalOpen(true)
  }

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold">Users</h1>
        <SearchBox value={query} onChange={setQuery} placeholder="Search users…" className="ml-auto" />
        <button onClick={openAdd} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">
          <Plus /> Add User
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
              <th className="text-left px-4 py-2.5 font-bold w-14">S.No</th>
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
              <th className="text-center px-4 py-2.5 font-bold">Status</th>
              <th className="text-center px-4 py-2.5 font-bold w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">No users found.</td></tr>
            ) : (
              paged.map((u, i) => (
                <tr key={u.userId} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{u.userCode}</td>
                  <td className="px-4 py-2.5 font-bold">{u.username}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{u.groupName || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{u.email || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{u.mobile || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{u.designation || '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center">
                      <Toggle readOnly checked={!!u.isActive} title={`${u.isActive ? 'Active' : 'Inactive'} — open Edit to change`} />
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <EditButton onClick={() => openEdit(u.userId)} />
                      <DeleteButton onClick={() => setConfirmDel(u)} />
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
        <UserModal
          form={form}
          setForm={setForm}
          groups={groups}
          onClose={() => setModalOpen(false)}
          onSaved={(m) => { setModalOpen(false); flash(m); load() }}
        />
      )}

      <ConfirmDialog
        open={!!confirmDel}
        title="🗑️ Delete user?"
        message={<>Delete <b>{confirmDel?.username}</b>? This cannot be undone.</>}
        confirmLabel="Delete"
        danger
        onConfirm={() => doDeleteUser(confirmDel)}
        onClose={() => setConfirmDel(null)}
      />
    </div>
  )
}

function UserModal({ form, setForm, groups, onClose, onSaved }) {
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const isEdit = !!form.userId
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!form.username.trim()) return setErr('Username is required.')
    if (!form.groupId) return setErr('Please select a user group.')
    if (!isEdit && !form.password) return setErr('Password is required.')
    if (form.password && form.password !== form.confirm) return setErr('Passwords do not match.')

    const payload = {
      username: form.username.trim(),
      email: form.email.trim() || null,
      mobile: form.mobile.trim() || null,
      address1: form.address1.trim() || null,
      address2: form.address2.trim() || null,
      designation: form.designation.trim() || null,
      groupId: Number(form.groupId),
      isActive: form.isActive,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await updateUser(form.userId, { ...payload, password: form.password || null })
        onSaved('User updated.')
      } else {
        const res = await addUser({ ...payload, password: form.password })
        onSaved(`User added (${res.userCode}).`)
      }
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not save the user.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold">
            {isEdit ? 'Edit User' : 'Add User'}
            <span className="ml-2 text-xs font-normal text-slate-400">(code auto-assigned)</span>
          </h3>
          <button type="button" onClick={onClose} title="Close"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Username *</label>
            <input className={inputCls} value={form.username} onChange={(e) => set('username', e.target.value)} autoComplete="off" />
          </div>
          <div>
            <label className={labelCls}>User Group *</label>
            <select className={inputCls} value={form.groupId} onChange={(e) => set('groupId', e.target.value)}>
              <option value="">-- select --</option>
              {groups.map((g) => (<option key={g.groupId} value={g.groupId}>{g.groupName}</option>))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Password {isEdit ? '(blank = keep)' : '*'}</label>
            <PasswordInput value={form.password} onChange={(e) => set('password', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Confirm Password</label>
            <PasswordInput value={form.confirm} onChange={(e) => set('confirm', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Mobile</label>
            <input className={inputCls} value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Address 1</label>
            <input className={inputCls} value={form.address1} onChange={(e) => set('address1', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Address 2</label>
            <input className={inputCls} value={form.address2} onChange={(e) => set('address2', e.target.value)} />
          </div>

          <div>
            <label className={labelCls}>Designation</label>
            <input className={inputCls} value={form.designation} onChange={(e) => set('designation', e.target.value)} />
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-2.5">
              <Toggle checked={!!form.isActive} onChange={(v) => set('isActive', v)} />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Active</span>
            </div>
          </div>

          {err && <div className="sm:col-span-2 text-red-600 dark:text-red-400 text-sm font-bold">{err}</div>}

          <div className="sm:col-span-2 flex justify-end gap-2 mt-2 pt-3 border-t border-slate-200 dark:border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
            <button disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">
              {saving ? 'Saving…' : isEdit ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
