// Neumorphic tick checkbox (Uiverse.io by chase2k25) — shows an X when unchecked,
// a green tick when checked. Styles are scoped under `.tickbox` in index.css.
export default function TickBox({ checked = false, onChange, title, disabled = false }) {
  return (
    <label className={`tickbox-container ${disabled ? 'opacity-50 pointer-events-none' : ''}`} title={title}>
      <input type="checkbox" className="tickbox-input" checked={checked} disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)} />
      <span className="tickbox">
        <span className="tickbox-line tickbox-line1" />
        <span className="tickbox-line tickbox-line2" />
      </span>
    </label>
  )
}
