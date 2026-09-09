// Uiverse.io by marcelodolza — glossy purple 3D CTA, scoped under `.pbtn`.
// Used for the Dashboard "Attendance Entry" quick shortcut. Styles live in index.css
// (all classes/keyframes are prefixed `pbtn-` so the generic names don't collide).

function Chars({ text }) {
  const parts = text.split('')
  return (
    <span className="pbtn-char state-1">
      {parts.map((ch, i) => {
        const c = ch === ' ' ? ' ' : ch
        return (
          <span key={i} data-label={c} style={{ '--i': i + 1 }}>{c}</span>
        )
      })}
    </span>
  )
}

export default function PurpleButton({ label = 'Attendance Entry', onClick, title, className = '' }) {
  return (
    <button type="button" className={`pbtn ${className}`} onClick={onClick} title={title || label}>
      <div className="pbtn-bg" />
      <div className="pbtn-wrap">
        <div className="pbtn-outline" />
        <div className="pbtn-content">
          <Chars text={label} />
          <div className="pbtn-icon"><div /></div>
        </div>
      </div>
      <svg className="pbtn-path" preserveAspectRatio="none" viewBox="0 0 220 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="214" height="74" rx="17" stroke="white" strokeWidth="2.5" />
      </svg>
      <svg className="pbtn-splash" viewBox="0 0 220 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 60 C 90 20, 130 20, 170 60" strokeWidth="2" />
      </svg>
    </button>
  )
}
