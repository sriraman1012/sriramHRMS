// Animated send button (Uiverse by marcelodolza): paper-plane lands on load, letters wave on
// hover, and on click the plane takes off while a "Sent" checkmark state appears.
// Props: onClick, disabled, label (default "Send"), className.
function PlaneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function Letters({ text }) {
  return (
    <p>
      {text.split('').map((ch, i) => (
        <span key={i} style={{ '--i': i }}>{ch === ' ' ? ' ' : ch}</span>
      ))}
    </p>
  )
}

export default function SendButton({ onClick, disabled = false, label = 'Send', className = '' }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`sendfx ${className}`}>
      <div className="outline" />
      <div className="state state--default">
        <div className="icon"><PlaneIcon /></div>
        <Letters text={label} />
      </div>
      <div className="state state--sent">
        <div className="icon"><CheckIcon /></div>
        <Letters text="Sent" />
      </div>
    </button>
  )
}
