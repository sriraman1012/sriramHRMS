import { useState } from 'react'
import BreakZone from './BreakZone.jsx'

// Uiverse "play now" styled button that opens the Break Zone (relax + offline games).
export default function BreakButton({ label = 'Break', className = '' }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`break-btn ${className}`} title="Take a relax break">
        <span className="play">{label}</span>
        <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
          <path d="M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" />
        </svg>
        <span className="now">Now</span>
      </button>
      {open && <BreakZone onClose={() => setOpen(false)} />}
    </>
  )
}
