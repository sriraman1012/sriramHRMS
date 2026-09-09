import { useState } from 'react'
import { Eye, EyeOff } from './icons.jsx'

const cls =
  'w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-slate-900 dark:text-slate-100 text-sm pl-3 pr-10 py-2 outline-none focus:border-blue-500'

// Password field with its own show/hide eye toggle.
export default function PasswordInput({ value, onChange, placeholder = '', autoComplete = 'new-password' }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cls}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        title={show ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5"
      >
        {show ? <EyeOff /> : <Eye />}
      </button>
    </div>
  )
}
