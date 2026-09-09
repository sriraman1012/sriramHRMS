import { useEffect, useState } from 'react'
import { getGroups, getRights, saveRights } from '../../api/userManagement.js'
import Toggle from '../../components/Toggle.jsx'
import Pagination from '../../components/Pagination.jsx'
import SearchBox from '../../components/SearchBox.jsx'
import Loader from '../../components/Loader.jsx'

const COLS = [
  { key: 'canView', label: 'View' },
  { key: 'canAdd', label: 'Add' },
  { key: 'canEdit', label: 'Edit' },
  { key: 'canDelete', label: 'Delete' },
  { key: 'canExport', label: 'Export' },
]

export default function UserRights() {
  const [groups, setGroups] = useState([])
  const [groupId, setGroupId] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [moduleQuery, setModuleQuery] = useState('')

  useEffect(() => {
    getGroups()
      .then((g) => {
        setGroups(g)
        if (g.length) setGroupId(String(g[0].groupId))
      })
      .catch(() => setError('Failed to load groups.'))
  }, [])

  useEffect(() => {
    if (!groupId) return
    setLoading(true)
    setError('')
    getRights(groupId)
      .then((r) => { setRows(r); setPage(1) })
      .catch(() => setError('Failed to load rights.'))
      .finally(() => setLoading(false))
  }, [groupId])

  const mq = moduleQuery.trim().toLowerCase()
  const filteredRows = mq ? rows.filter((r) => (r.moduleName || '').toLowerCase().includes(mq)) : rows
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize))
  const current = Math.min(page, pageCount)
  const offset = (current - 1) * pageSize
  const pageRows = filteredRows.slice(offset, offset + pageSize)

  const toggle = (moduleId, key) =>
    setRows((rs) => rs.map((r) => (r.moduleId === moduleId ? { ...r, [key]: !r[key] } : r)))

  const setFull = (moduleId, value) =>
    setRows((rs) =>
      rs.map((r) =>
        r.moduleId === moduleId
          ? { ...r, canView: value, canAdd: value, canEdit: value, canDelete: value, canExport: value }
          : r,
      ),
    )

  const isFull = (r) => COLS.every((c) => r[c.key])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      await saveRights({
        groupId: Number(groupId),
        rights: rows.map((r) => ({
          moduleId: r.moduleId,
          canView: r.canView,
          canAdd: r.canAdd,
          canEdit: r.canEdit,
          canDelete: r.canDelete,
          canExport: r.canExport,
        })),
      })
      setMsg('Rights saved.')
      setTimeout(() => setMsg(''), 2500)
    } catch {
      setError('Could not save rights.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full space-y-5">
      <h1 className="text-xl font-bold">User Rights</h1>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Group</label>
        <select
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-slate-900 dark:text-slate-100 text-sm px-3 py-2 outline-none focus:border-blue-500"
        >
          {groups.map((g) => (
            <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
          ))}
        </select>
        <SearchBox value={moduleQuery} onChange={(v) => { setModuleQuery(v); setPage(1) }} placeholder="Search module…" />
        <button
          onClick={save}
          disabled={saving || !rows.length}
          className="ml-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold"
        >
          {saving ? 'Saving…' : 'Save Rights'}
        </button>
        {msg && <span className="text-green-600 dark:text-green-400 text-sm font-bold">{msg}</span>}
        {error && <span className="text-red-600 dark:text-red-400 text-sm font-bold">{error}</span>}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide">
              <th className="text-left px-4 py-2.5 font-bold w-12">S.No</th>
              <th className="text-left px-4 py-2.5 font-bold min-w-[180px]">Module</th>
              {COLS.map((c) => (
                <th key={c.key} className="px-3 py-2.5 font-bold text-center">{c.label}</th>
              ))}
              <th className="px-3 py-2.5 font-bold text-center">Full Control</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-6"><div className="flex justify-center"><Loader size="2.6em" /></div></td></tr>
            ) : filteredRows.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400">No modules.</td></tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={r.moduleId} className="border-t border-slate-100 dark:border-white/5">
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{offset + i + 1}</td>
                  <td className="px-4 py-2.5 font-bold">{r.moduleName}</td>
                  {COLS.map((c) => (
                    <td key={c.key} className="px-3 py-2.5">
                      <div className="flex justify-center">
                        <Toggle size="sm" checked={!!r[c.key]} onChange={() => toggle(r.moduleId, c.key)} title={`${c.label} — ${r[c.key] ? 'ON' : 'OFF'}`} />
                      </div>
                    </td>
                  ))}
                  <td className="px-3 py-2.5">
                    <div className="flex justify-center">
                      <Toggle size="sm" checked={isFull(r)} onChange={(v) => setFull(r.moduleId, v)} title={`Full Control — ${isFull(r) ? 'ON' : 'OFF'}`} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredRows.length > 0 && (
        <Pagination total={filteredRows.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Newly added modules appear here automatically with all boxes unticked.
      </p>
    </div>
  )
}
