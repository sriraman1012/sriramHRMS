import { ChevronLeft, ChevronRight } from './icons.jsx'

export default function Pagination({ total, page, pageSize, onPage, onPageSize }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500 dark:text-slate-400 px-1">
      <span className="font-bold">Rows per page</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSize(Number(e.target.value))}
        className="rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-slate-700 dark:text-slate-200 px-2 py-1 outline-none"
      >
        {[5, 10, 25, 50].map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      <span className="ml-auto">{from}–{to} of {total}</span>
      <button className="btn3d" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <span className="btn3d-top"><ChevronLeft /></span>
        <span className="btn3d-bottom" />
        <span className="btn3d-base" />
      </button>
      <span className="font-bold text-slate-700 dark:text-slate-200">{page} / {pageCount}</span>
      <button className="btn3d" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
        <span className="btn3d-top"><ChevronRight /></span>
        <span className="btn3d-bottom" />
        <span className="btn3d-base" />
      </button>
    </div>
  )
}
