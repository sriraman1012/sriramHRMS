import { Calendar, Building } from './icons.jsx'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const now = new Date()
const pillCls = 'inline-flex items-center gap-1.5 h-9 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-2'
const pillInput = 'bg-transparent text-xs font-bold outline-none cursor-pointer'

// Compact icon-pill Month / Year / Department filter.
export default function PeriodFilter({ month, setMonth, year, setYear, departmentId, setDepartmentId, departments = [], onMonth, onYear, onDept, children }) {
  const changeMonth = (v) => { setMonth?.(v); onMonth?.(v) }
  const changeYear = (v) => { setYear?.(v); onYear?.(v) }
  const changeDept = (v) => { setDepartmentId?.(v); onDept?.(v) }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={pillCls} title="Month">
        <span className="text-blue-600 dark:text-blue-400"><Calendar size={14} /></span>
        <select value={month} onChange={(e) => changeMonth(Number(e.target.value))} className={pillInput}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
      </span>
      <span className={pillCls} title="Year">
        <span className="text-blue-600 dark:text-blue-400"><Calendar size={14} /></span>
        <select value={year} onChange={(e) => changeYear(Number(e.target.value))} className={pillInput}>
          {Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i).map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </span>
      <span className={pillCls} title="Department">
        <span className="text-blue-600 dark:text-blue-400"><Building size={14} /></span>
        <select value={departmentId} onChange={(e) => changeDept(e.target.value)} className={`${pillInput} max-w-[150px]`}>
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
        </select>
      </span>
      {children}
    </div>
  )
}
