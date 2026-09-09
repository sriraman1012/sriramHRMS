import { useEffect, useState } from 'react'
import { getWeeklyOff, saveWeeklyOff } from '../../api/settings.js'

const FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function WeeklyOff() {
  const [woDays, setWoDays] = useState([0, 6]) // off every week
  const [woNth, setWoNth] = useState({})        // weekday -> [occurrences off]
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    getWeeklyOff()
      .then((r) => { setWoDays(r.days || []); setWoNth(r.nth || {}) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // A weekday is in "nth" mode as soon as it has a key (even an empty selection).
  const modeOf = (d) => (woDays.includes(d) ? 'every' : (woNth[d] !== undefined ? 'nth' : 'work'))
  const setMode = (d, mode) => {
    setWoDays((prev) => (mode === 'every' ? [...new Set([...prev, d])].sort((a, b) => a - b) : prev.filter((x) => x !== d)))
    setWoNth((prev) => {
      const n = { ...prev }
      if (mode === 'nth') { if (n[d] === undefined) n[d] = [] } else delete n[d]
      return n
    })
  }
  const toggleOcc = (d, occ) => setWoNth((prev) => {
    const list = new Set(prev[d] || [])
    list.has(occ) ? list.delete(occ) : list.add(occ)
    return { ...prev, [d]: [...list].sort((a, b) => a - b) }
  })
  const save = async () => {
    setSaving(true)
    const cleanNth = Object.fromEntries(Object.entries(woNth).filter(([, v]) => Array.isArray(v) && v.length))
    try { await saveWeeklyOff(woDays, cleanNth); setMsg('Saved.'); setTimeout(() => setMsg(''), 2000) }
    catch { setMsg('Could not save.') } finally { setSaving(false) }
  }

  return (
    <div className="w-full space-y-4">
      <h1 className="text-xl font-bold">Weekly Off</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        For each weekday choose <b>Working</b>, <b>Off</b> (every week), or <b>Weeks…</b> (off on specific weeks, e.g. 2nd &amp; 4th Saturday).
        Attendance Auto Fill, working-day counts and reports use these rules automatically.
      </p>

      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] p-4 max-w-xl">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-3">
            <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-2">
            {FULL.map((name, d) => {
              const mode = modeOf(d)
              return (
                <div key={d} className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2 last:border-0 last:pb-0">
                  <span className="w-24 text-sm font-bold">{name}</span>
                  {[{ v: 'work', l: 'Working' }, { v: 'every', l: 'Off' }, { v: 'nth', l: 'Weeks…' }].map((o) => (
                    <button key={o.v} onClick={() => setMode(d, o.v)}
                      className={`px-2.5 py-1 rounded-md border text-xs font-bold ${mode === o.v ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                      {o.l}
                    </button>
                  ))}
                  {mode === 'nth' && (
                    <span className="flex items-center gap-1 ml-1">
                      {[1, 2, 3, 4, 5].map((occ) => (
                        <button key={occ} onClick={() => toggleOcc(d, occ)}
                          className={`w-7 h-7 rounded-md border text-[11px] font-bold ${(woNth[d] || []).includes(occ) ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                          {occ}
                        </button>
                      ))}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <div className="flex items-center gap-2 mt-4">
          <button onClick={save} disabled={saving || loading} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">{saving ? 'Saving…' : 'Save'}</button>
          {msg && <span className="text-green-600 dark:text-green-400 text-sm font-bold">{msg}</span>}
        </div>
      </div>
    </div>
  )
}
