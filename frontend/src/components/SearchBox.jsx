import { Search, X } from './icons.jsx'

// Dark/light search box (Uiverse "cresvin" style): search icon · expanding input · clear (X).
// Props: value, onChange(newValue), placeholder, className (extra width/positioning e.g. "ml-auto"),
//        dark (force the dark palette regardless of theme — for always-dark surfaces like the chat rail).
export default function SearchBox({ value, onChange, placeholder = 'Search…', className = '', dark = false }) {
  const box = dark
    ? 'bg-zinc-800 border-zinc-700 text-white'
    : 'bg-slate-50 dark:bg-zinc-800 border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-white'
  const muted = dark ? 'text-zinc-400' : 'text-slate-400 dark:text-zinc-400'
  const clearHover = dark ? 'hover:text-white' : 'hover:text-slate-600 dark:hover:text-white'
  const ph = dark ? 'placeholder:text-zinc-400' : 'placeholder:text-slate-400 dark:placeholder:text-zinc-400'

  return (
    <div className={`flex items-center rounded-md border shadow-sm text-sm ${box} ${className}`}>
      <div className={`w-9 grid place-content-center ${muted}`}>
        <Search size={16} />
      </div>
      <input
        type="text"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`sb-input bg-transparent py-1.5 outline-none ${ph} w-28 focus:w-52 transition-all`}
      />
      <button
        type="button"
        aria-label="Clear search"
        title="Clear"
        onClick={() => onChange('')}
        className={`w-9 grid place-content-center ${muted} ${clearHover} ${value ? '' : 'invisible'}`}
      >
        <X size={16} />
      </button>
    </div>
  )
}
