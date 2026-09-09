import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getHome, getAttendanceTrend } from '../api/dashboard.js'
import { getDepartments, getHolidays } from '../api/masters.js'
import { Calendar, ChevronLeft, ChevronRight, Refresh, Check, Ban, Users, CalendarDays, Gift, MapPin } from '../components/icons.jsx'
import { useRights } from '../context/RightsContext.jsx'
import SingleDatePicker from '../components/SingleDatePicker.jsx'
import PurpleButton from '../components/PurpleButton.jsx'
import Loader from '../components/Loader.jsx'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const now = new Date()
const isoToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
const fmt = (n) => Math.round((Number(n) || 0) * 10) / 10 // trim to 1 decimal

const selectCls =
  'rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-sm px-3 py-2 outline-none'
// Compact icon-pill filter styles
const pillCls =
  'inline-flex items-center gap-1.5 h-9 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-2'
const pillInput = 'bg-transparent text-xs font-bold outline-none cursor-pointer'

export default function Home({ onNavigate }) {
  const { auth } = useAuth()
  const { can } = useRights()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [date, setDate] = useState('') // '' = auto snapshot day; else a specific picked date
  const [departmentId, setDepartmentId] = useState('')
  const [departments, setDepartments] = useState([])
  const [holidays, setHolidays] = useState([])
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [absentOpen, setAbsentOpen] = useState(false)
  const [totalOpen, setTotalOpen] = useState(false)
  const [onsiteOpen, setOnsiteOpen] = useState(false)
  const [animKey, setAnimKey] = useState(0) // bumped on each dashboard load so the box "jumble" entrance replays
  const [trend, setTrend] = useState([])
  const [trendLoading, setTrendLoading] = useState(true)
  const [trendMode, setTrendMode] = useState('date') // 'date' | 'month' | 'year'
  const [chartYear, setChartYear] = useState(now.getFullYear())
  const [chartMonth, setChartMonth] = useState(now.getMonth() + 1)

  useEffect(() => {
    getDepartments().then(setDepartments).catch(() => {})
    getHolidays().then(setHolidays).catch(() => {})
  }, [])

  useEffect(() => {
    setTrendLoading(true)
    getAttendanceTrend(trendMode, chartYear, chartMonth, departmentId)
      .then((rows) => setTrend(Array.isArray(rows) ? rows : []))
      .catch(() => setTrend([]))
      .finally(() => setTrendLoading(false))
  }, [trendMode, chartYear, chartMonth, departmentId])

  useEffect(() => {
    setLoading(true)
    setError('')
    // When a specific date is picked it drives the snapshot day; otherwise use today.
    getHome(year, month, departmentId, date || isoToday)
      .then((d) => { setData(d); setAnimKey((k) => k + 1) })
      .catch(() => setError('Failed to load dashboard. Is the API running / are you logged in?'))
      .finally(() => setLoading(false))
  }, [year, month, departmentId, date])

  const monthLabel = `${MONTHS[month - 1]} ${year}`
  // Dark-styled dropdowns for the trend chart (on the always-dark card).
  const chartSel = 'h-9 rounded-lg border border-white/15 bg-[#1e2235] text-slate-100 text-xs font-bold px-2 outline-none cursor-pointer'
  const chartYearOpts = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 5 + i)
  const s = data?.summary
  const daysInMonth = new Date(year, month, 0).getDate()
  const weekends = Math.max(0, daysInMonth - (s?.workingDays || 0)) // days in month − working days
  const holidaysThisMonth = holidays.filter((h) => {
    const d = new Date(`${String(h.holidayDate).slice(0, 10)}T00:00:00`)
    return d.getFullYear() === year && d.getMonth() + 1 === month
  }).length
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1
  // Picking a date syncs the month/year to it so the snapshot lines up server-side.
  const pickDate = (val) => {
    setDate(val)
    if (val) { const d = new Date(`${val}T00:00:00`); setYear(d.getFullYear()); setMonth(d.getMonth() + 1) }
  }
  const resetFilters = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); setDate(''); setDepartmentId('') }
  const setThisMonth = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); setDate('') }
  const stepMonth = (delta) => {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear()); setMonth(d.getMonth() + 1); setDate('')
  }
  const refDate = s?.refDate ? new Date(s.refDate) : null
  const refValid = refDate && refDate.getFullYear() > 2000 // guard against un-migrated SP (returns year 1 / null)
  const snapLabel = date
    ? (date === isoToday ? 'Today' : new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }))
    : isCurrent
      ? 'Today'
      : refValid
        ? refDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : monthLabel

  return (
    <div className="w-full space-y-5">
      {/* Header + filters */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Welcome, {auth.displayName || auth.username}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick shortcut to Attendance Entry — glossy purple 3D CTA (Uiverse marcelodolza) */}
          {can('att-entry', 'view') && (
            <span className="mr-1 shrink-0">
              <PurpleButton className="pbtn-sm" label="Attendance" onClick={() => onNavigate?.('att-entry')} title="Go to Attendance Entry" />
            </span>
          )}
          {/* Date-wise calendar picker (drives the snapshot day + its month) */}
          <SingleDatePicker value={date} onChange={pickDate} todayIso={isoToday} />
          {/* Department */}
          <span className={pillCls} title="Department">
            <span className="text-sm">🏢</span>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={`${pillInput} max-w-[150px]`}>
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
            </select>
          </span>
          <button onClick={resetFilters} title="Refresh / reset filters" className="refresh-btn">
            <Refresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-12"><Loader label="Loading dashboard…" /></div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400 font-bold mt-6 text-center">{error}</div>
      ) : (
        <>
          {/* Snapshot activity */}
          <div className="flex items-center gap-2">
            <span className="w-1 h-5 rounded bg-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {snapLabel === 'Today' ? "Today's Activity" : `Snapshot · ${snapLabel} ${year}`}
            </h2>
          </div>
          <div key={`snap-${animKey}`} className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Slide directions (per request): Present+Onsite → from left, Absent+Total → from top, Working+Holiday → from right */}
            <StatCard label={`Present · ${snapLabel}`} value={s.presentToday} sub={`of ${s.totalEmployees} employees`} icon={<Check size={22} />} tile="bg-gradient-to-br from-green-400 to-emerald-600" accent="#10b981" entrance={{ dir: 'left', delay: 0 }} />
            <StatCard label={`Onsite · ${snapLabel}`} value={s.onsiteToday || 0} sub="click for onsite list" icon={<MapPin size={22} />} tile="bg-gradient-to-br from-teal-400 to-cyan-600" accent="#14b8a6" onClick={() => setOnsiteOpen(true)} entrance={{ dir: 'left', delay: 0.1 }} />
            <StatCard label={`Absent / Permission · ${snapLabel}`} value={`${s.absentLeaveToday} / ${s.permissionToday || 0}`} sub="click to view list" icon={<Ban size={22} />} tile="bg-gradient-to-br from-red-400 to-rose-600" accent="#f43f5e" onClick={() => setAbsentOpen(true)} entrance={{ dir: 'up', delay: 0.2 }} />
            <StatCard label="Total Employees" value={s.totalEmployees} sub="click for department breakup" icon={<Users size={22} />} tile="bg-gradient-to-br from-indigo-400 to-blue-600" accent="#3b82f6" onClick={() => setTotalOpen(true)} entrance={{ dir: 'up', delay: 0.3 }} />
            <StatCard label={`Working / Weekends (${MONTHS[month - 1]})`} value={`${s.workingDays} / ${weekends}`} sub="working days / weekends" icon={<CalendarDays size={22} />} tile="bg-gradient-to-br from-amber-400 to-orange-500" accent="#f59e0b" entrance={{ dir: 'right', delay: 0.4 }} />
            <StatCard label={`Holidays (${MONTHS[month - 1]})`} value={holidaysThisMonth} sub="view holiday list →" icon={<Gift size={22} />} tile="bg-gradient-to-br from-pink-400 to-fuchsia-600" accent="#d946ef" onClick={() => onNavigate?.('holiday')} entrance={{ dir: 'right', delay: 0.5 }} />
          </div>

          {/* Department-wise present + leave pies */}
          <div key={`pies-${animKey}`} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <PieCard accent="#10b981" title={`Department-wise Present — ${snapLabel}`} entrance={{ dir: 'left', delay: 0.6 }}>
              <DonutChart
                data={(data.departmentPresent || []).map((d, i) => ({ name: d.departmentName, value: d.presentCount, color: PIE_COLORS[i % PIE_COLORS.length] }))}
                centerLabel="Present"
                emptyText={`No one is marked present on ${snapLabel}.`}
              />
            </PieCard>
            <PieCard accent="#f59e0b" title={`Department-wise Leave — ${snapLabel}`} entrance={{ dir: 'up', delay: 0.7 }}>
              <DonutChart
                data={(data.departmentPresent || []).map((d, i) => ({ name: d.departmentName, value: d.leaveCount, color: PIE_COLORS[i % PIE_COLORS.length] }))}
                centerLabel="On Leave"
                emptyText={`No absences or leaves on ${snapLabel}.`}
              />
            </PieCard>
            <PieCard accent="#14b8a6" title={`Department-wise Permission — ${snapLabel}`} entrance={{ dir: 'right', delay: 0.8 }}>
              <DonutChart
                data={(data.departmentPresent || []).map((d, i) => ({ name: d.departmentName, value: d.permissionCount, color: PIE_COLORS[i % PIE_COLORS.length] }))}
                centerLabel="Permission"
                emptyText={`No hourly permissions on ${snapLabel}.`}
              />
            </PieCard>
          </div>

          {/* Present vs Absent trend */}
          <PieCard accent="#3b82f6"
            title={`Present vs Absent — ${trendMode === 'date' ? `${MONTHS[chartMonth - 1]} ${chartYear}` : trendMode === 'month' ? `Year ${chartYear}` : 'Year-wise'}`}
            entrance={{ dir: 'left', delay: 0.9 }}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3 -mt-1">
              <div className="flex items-center gap-3 text-[12px] font-bold">
                <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3.5 h-1 rounded bg-[#10b981] inline-block" /> Present</span>
                <span className="flex items-center gap-1.5 text-slate-300"><span className="w-3.5 h-1 rounded bg-[#f43f5e] inline-block" /> Absent</span>
              </div>
              <div className="flex items-center flex-wrap gap-2">
                <select value={trendMode} onChange={(e) => setTrendMode(e.target.value)} className={chartSel} title="View by">
                  <option value="date">Date (days)</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
                {trendMode === 'date' && (
                  <select value={chartMonth} onChange={(e) => setChartMonth(Number(e.target.value))} className={chartSel} title="Month">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                )}
                {trendMode !== 'year' && (
                  <select value={chartYear} onChange={(e) => setChartYear(Number(e.target.value))} className={chartSel} title="Year">
                    {chartYearOpts.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                )}
              </div>
            </div>
            {trendLoading ? <div className="py-10 flex justify-center"><Loader size="2.4em" /></div> : (
              <LineChart
                data={trend}
                yName="No. of Employees"
                xName={trendMode === 'date' ? `Day of ${MONTHS[chartMonth - 1]}` : trendMode === 'month' ? `Month · ${chartYear}` : 'Year'}
                pointLabel={(d) => trendMode === 'date' ? `${MONTHS[chartMonth - 1]} ${d.bucketLabel}, ${chartYear}` : trendMode === 'month' ? `${d.bucketLabel} ${chartYear}` : `Year ${d.bucketLabel}`}
              />
            )}
          </PieCard>
        </>
      )}

      {absentOpen && (
        <AbsentLeaveModal list={data?.absentLeave || []} permissions={data?.permissionToday || []} label={snapLabel} onClose={() => setAbsentOpen(false)} />
      )}
      {totalOpen && (
        <TotalEmployeesModal list={data?.departmentPresent || []} onClose={() => setTotalOpen(false)} />
      )}
      {onsiteOpen && (
        <OnsiteModal list={data?.onsite || []} label={snapLabel} onClose={() => setOnsiteOpen(false)} />
      )}
    </div>
  )
}

// Present-Onsite employees on the reference day — two columns: employee · place.
function OnsiteModal({ list, label, onClose }) {
  const rows = list || []
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold">📍 Employees Onsite — {label} <span className="text-sm font-normal text-slate-400">({rows.length})</span></h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-lg font-bold">×</button>
        </div>
        <div className="overflow-y-auto">
          {rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">No one is marked Present Onsite on {label}.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700 text-slate-100 text-[12px] uppercase tracking-wide">
                  <th className="text-left px-5 py-2.5 font-bold">Employee</th>
                  <th className="text-left px-5 py-2.5 font-bold">Onsite Place</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-2.5 font-bold">{r.name}<span className="ml-2 text-xs font-normal text-slate-400">{r.departmentName || ''}</span></td>
                    <td className="px-5 py-2.5 text-teal-700 dark:text-teal-300 font-bold">{r.place || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const STATUS = {
  A: { label: 'Absent', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
  L: { label: 'Leave', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  HD: { label: 'Half Day', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
}

function AbsentLeaveModal({ list, permissions = [], label, onClose }) {
  const fmtT = (t) => (t ? String(t).slice(0, 5) : '')
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold">🚫 Absent / Permission — {label} <span className="text-sm font-normal text-slate-400">({list.length}/{permissions.length})</span></h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-lg font-bold">×</button>
        </div>
        <div className="overflow-y-auto">
          {/* Absent / Leave */}
          <div className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Absent / Leave ({list.length})</div>
          {list.length === 0 ? (
            <div className="px-5 py-4 text-sm text-slate-400">No absences or leaves on {label}.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {list.map((r, i) => (
                  <tr key={`a${r.employeeCode}_${i}`} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-2 text-slate-400 w-10">{i + 1}</td>
                    <td className="px-3 py-2"><div className="font-bold">{r.name}</div><div className="text-[11px] font-mono text-slate-400">{r.employeeCode}</div></td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.departmentName || '—'}</td>
                    <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS[r.statusCode]?.cls || 'bg-slate-200 text-slate-600'}`}>{STATUS[r.statusCode]?.label || r.statusCode}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Hourly Permission */}
          <div className="px-5 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 border-t border-slate-100 dark:border-white/10 mt-2">⏱️ Hourly Permission ({permissions.length})</div>
          {permissions.length === 0 ? (
            <div className="px-5 py-4 text-sm text-slate-400">No hourly permissions on {label}.</div>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {permissions.map((r, i) => (
                  <tr key={`p${r.employeeCode}_${i}`} className="border-t border-slate-100 dark:border-white/5">
                    <td className="px-5 py-2 text-slate-400 w-10">{i + 1}</td>
                    <td className="px-3 py-2"><div className="font-bold">{r.name}</div><div className="text-[11px] font-mono text-slate-400">{r.employeeCode}</div></td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{fmtT(r.fromTime)}–{fmtT(r.toTime)} <span className="text-blue-500 font-bold">({r.hours}h)</span></td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// Fixed-order categorical palette (validated). Assign by department index, never cycled beyond 8.
const PIE_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
const R = 15.915494 // circle circumference ≈ 100

function DonutChart({ data, centerLabel = 'PRESENT', emptyText = 'No data.' }) {
  const rows = (data || []).filter((d) => d.value > 0)
  const total = rows.reduce((a, d) => a + d.value, 0)

  if (total === 0) {
    return <div className="py-8 text-center text-sm text-slate-400">{emptyText}</div>
  }

  let acc = 0
  const segs = rows.map((d) => {
    const pct = (d.value / total) * 100
    const seg = { name: d.name, count: d.value, pct, color: d.color, offset: 25 - acc }
    acc += pct
    return seg
  })

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 42 42" className="w-32 h-32 shrink-0" role="img" aria-label={`Department-wise ${centerLabel.toLowerCase()} today`}>
        <circle cx="21" cy="21" r={R} fill="none" stroke="currentColor" strokeWidth="5" className="text-white/10" />
        {segs.map((s, i) => (
          <circle key={i} cx="21" cy="21" r={R} fill="none" stroke={s.color} strokeWidth="5"
            strokeDasharray={`${s.pct} ${100 - s.pct}`} strokeDashoffset={s.offset}>
            <title>{`${s.name}: ${s.count} (${Math.round(s.pct)}%)`}</title>
          </circle>
        ))}
        <text x="21" y="20.5" textAnchor="middle" className="fill-slate-100" style={{ fontSize: 6, fontWeight: 700 }}>{total}</text>
        <text x="21" y="25" textAnchor="middle" className="fill-slate-400" style={{ fontSize: 2.4 }}>{centerLabel}</text>
      </svg>

      <div className="flex-1 w-full space-y-1">
        {segs.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px]">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="font-bold text-slate-200 truncate">{s.name}</span>
            <span className="ml-auto text-slate-400 tabular-nums">{s.count} · {Math.round(s.pct)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Lightweight hand-rolled SVG line chart (no chart library — offline-safe). Two series: present & absent.
// Custom hover tooltip + labelled X/Y axes.
function LineChart({ data, xName = '', yName = '', pointLabel }) {
  const rows = data || []
  const [hover, setHover] = useState(null)
  if (!rows.length) return <div className="py-10 text-center text-sm text-slate-400">No attendance data for this range.</div>
  const W = 760, H = 210, padL = 54, padR = 16, padT = 12, padB = 44
  const n = rows.length
  const maxRaw = Math.max(1, ...rows.map((d) => Math.max(d.present || 0, d.absent || 0)))
  const niceMax = (v) => { const pow = Math.pow(10, Math.floor(Math.log10(v))); const f = v / pow; const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10; return nf * pow }
  const yMax = niceMax(maxRaw)
  const plotW = W - padL - padR, plotH = H - padT - padB
  const X = (i) => padL + (n === 1 ? plotW / 2 : (i * plotW) / (n - 1))
  const Y = (v) => padT + plotH * (1 - (v || 0) / yMax)
  const path = (key) => rows.map((d, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(d[key]).toFixed(1)}`).join(' ')
  const ticks = 4
  const gridVals = Array.from({ length: ticks + 1 }, (_, i) => (yMax / ticks) * i)
  const step = Math.max(1, Math.ceil(n / 13)) // avoid crowding x labels (e.g. 31 days)
  const bandW = plotW / Math.max(1, n)
  const hv = hover != null ? rows[hover] : null
  const cy = hover != null ? Y(Math.max(hv.present || 0, hv.absent || 0)) : 0

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[300px]" role="img" aria-label="Present vs Absent trend" onMouseLeave={() => setHover(null)}>
        {/* horizontal grid + y-axis tick labels */}
        {gridVals.map((v, i) => (
          <g key={`g${i}`}>
            <line x1={padL} y1={Y(v)} x2={W - padR} y2={Y(v)} stroke="currentColor" className="text-white/10" strokeWidth="1" />
            <text x={padL - 8} y={Y(v) + 3} textAnchor="end" className="fill-slate-400" style={{ fontSize: 10 }}>{Math.round(v)}</text>
          </g>
        ))}
        {/* y-axis name (rotated) */}
        <text x={16} y={padT + plotH / 2} transform={`rotate(-90 16 ${padT + plotH / 2})`} textAnchor="middle" className="fill-slate-300" style={{ fontSize: 11, fontWeight: 700 }}>{yName}</text>
        {/* x-axis tick labels */}
        {rows.map((d, i) => ((i % step === 0 || i === n - 1) ? (
          <text key={`x${i}`} x={X(i)} y={padT + plotH + 16} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 10 }}>{d.bucketLabel}</text>
        ) : null))}
        {/* x-axis name */}
        <text x={padL + plotW / 2} y={H - 8} textAnchor="middle" className="fill-slate-300" style={{ fontSize: 11, fontWeight: 700 }}>{xName}</text>
        {/* hover guide line */}
        {hv && <line x1={X(hover)} y1={padT} x2={X(hover)} y2={padT + plotH} stroke="currentColor" className="text-white/25" strokeWidth="1" strokeDasharray="3 3" />}
        {/* series lines */}
        <path d={path('absent')} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={path('present')} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* points (enlarged on hover) */}
        {rows.map((d, i) => (
          <g key={`pt${i}`}>
            <circle cx={X(i)} cy={Y(d.absent)} r={hover === i ? 4 : 2.6} fill="#f43f5e" stroke="#161c2b" strokeWidth={hover === i ? 1.5 : 0} />
            <circle cx={X(i)} cy={Y(d.present)} r={hover === i ? 4 : 2.6} fill="#10b981" stroke="#161c2b" strokeWidth={hover === i ? 1.5 : 0} />
          </g>
        ))}
        {/* transparent hover bands (on top) to capture the mouse */}
        {rows.map((d, i) => (
          <rect key={`b${i}`} x={X(i) - bandW / 2} y={padT} width={bandW} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
      </svg>

      {/* Modern custom tooltip */}
      {hv && (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full"
          style={{ left: `${(X(hover) / W) * 100}%`, top: `${(cy / H) * 100}%`, marginTop: -10 }}>
          <div className="rounded-xl border border-white/15 bg-[#0d0f18]/95 px-3 py-2 shadow-2xl min-w-[150px]">
            <div className="text-[12px] font-bold text-slate-100 mb-1.5">{pointLabel ? pointLabel(hv) : hv.bucketLabel}</div>
            <div className="flex items-center justify-between gap-5 text-[12px] leading-5">
              <span className="flex items-center gap-1.5 text-slate-300"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" /> Present</span>
              <span className="font-bold text-[#34d399]">{hv.present}</span>
            </div>
            <div className="flex items-center justify-between gap-5 text-[12px] leading-5">
              <span className="flex items-center gap-1.5 text-slate-300"><span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" /> Absent</span>
              <span className="font-bold text-[#fb7185]">{hv.absent}</span>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between gap-5 text-[11px]">
              <span className="text-slate-400">Total marked</span>
              <span className="font-bold text-slate-100">{(hv.present || 0) + (hv.absent || 0)}</span>
            </div>
          </div>
          {/* little pointer */}
          <div className="w-2 h-2 rotate-45 bg-[#0d0f18] border-r border-b border-white/15 mx-auto -mt-1" />
        </div>
      )}
    </div>
  )
}

function TotalEmployeesModal({ list, onClose }) {
  const rows = (list || []).filter((d) => d.employeeCount > 0)
  const total = rows.reduce((a, d) => a + (d.employeeCount || 0), 0)
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold">👥 Employees by Department <span className="text-sm font-normal text-slate-400">({total})</span></h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-lg font-bold">×</button>
        </div>
        <div className="overflow-y-auto">
          {rows.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">No employees.</div>
          ) : rows.map((d, i) => (
            <div key={d.departmentName} className="px-5 py-3 flex items-center gap-3 border-t border-slate-100 dark:border-white/5">
              <span className="w-6 text-slate-400 text-sm">{i + 1}</span>
              <span className="flex-1 font-bold text-sm">{d.departmentName}</span>
              <span className="shrink-0 min-w-[28px] text-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 text-sm font-bold">{d.employeeCount}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t-2 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#1e2235] flex items-center justify-between font-bold text-sm">
          <span>Total</span><span className="text-blue-600 dark:text-blue-400">{total}</span>
        </div>
      </div>
    </div>
  )
}

// Pie-chart card in the same 3D-box style as the stat cards (top + right accent lines).
function PieCard({ accent, title, children, entrance }) {
  return (
    <div style={entrance ? { animationDelay: `${entrance.delay}s` } : undefined}
      className={`dash-glow relative overflow-hidden rounded-[var(--card-radius)] border-2 border-black bg-[#161c2b] text-slate-100 p-4 shadow-[var(--card-shadow)] ${entrance ? `box-from-${entrance.dir}` : ''}`}>
      <span className="absolute inset-0 pointer-events-none rounded-[var(--card-radius)]"
        style={{ borderStyle: 'solid', borderColor: 'transparent', borderTopColor: accent, borderRightColor: accent, borderTopWidth: 'var(--card-accent)', borderRightWidth: 'var(--card-accent)' }} />
      <div className="font-bold text-sm mb-3">{title}</div>
      {children}
    </div>
  )
}

function StatCard({ label, value, sub, icon, tile, accent, onClick, entrance }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      title={onClick ? 'Click to view the list' : undefined}
      style={entrance ? { animationDelay: `${entrance.delay}s` } : undefined}
      className={`dash-glow stat-card hover-pop relative overflow-hidden rounded-[var(--card-radius)] border-2 border-black bg-[#161c2b] px-4 py-3 flex items-center justify-between shadow-[var(--card-shadow)] ${entrance ? `box-from-${entrance.dir}` : ''} ${onClick ? 'cursor-pointer transition-all duration-150 hover:scale-[1.03] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(0,0,0,0.55)]' : ''}`}
    >
      {/* Colored accent frame (top + right) — follows the card's corner radius */}
      <span className="absolute inset-0 pointer-events-none rounded-[var(--card-radius)]"
        style={{ borderStyle: 'solid', borderColor: 'transparent', borderTopColor: accent || '#64748b', borderRightColor: accent || '#64748b', borderTopWidth: 'var(--card-accent)', borderRightWidth: 'var(--card-accent)' }} />
      <div className="min-w-0">
        <div className="text-2xl font-bold text-slate-100 leading-tight">{value}</div>
        <div className="text-[11px] uppercase tracking-wide text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
      </div>
      <div className={`stat-icon w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-lg ${tile || 'bg-slate-400'}`}>
        {icon}
      </div>
    </div>
  )
}
