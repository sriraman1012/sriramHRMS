import { X } from './icons.jsx'

// In-app confirmation dialog — replaces the fragile window.confirm (which browsers can suppress).
// Props: open, title, message, confirmLabel, danger (red vs blue), onConfirm, onClose.
export default function ConfirmDialog({ open, title = 'Are you sure?', message, confirmLabel = 'Delete', danger = true, onConfirm, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-base font-bold flex items-center gap-2">{title}</h3>
          <button type="button" onClick={onClose} title="Close" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-lg text-white text-sm font-bold ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
