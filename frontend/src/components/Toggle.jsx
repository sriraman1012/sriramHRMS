import { useEffect, useState } from 'react'
import { getToggleStyle } from '../prefs.js'

// Toggle switch with two selectable looks (chosen in Settings, applied live):
//  - 'default': dark neumorphic switch (sliding knob + red→green indicator ring)
//  - 'green'  : Galahhad green switch with check/cross icons
// Same API everywhere: checked, onChange(newValue), disabled, readOnly, title, size ('sm' | 'md').
export default function Toggle({ checked, onChange, disabled = false, readOnly = false, title, size = 'md' }) {
  const [style, setStyle] = useState(getToggleStyle())
  useEffect(() => {
    const h = () => setStyle(getToggleStyle())
    window.addEventListener('togglestyle', h)
    return () => window.removeEventListener('togglestyle', h)
  }, [])

  const locked = disabled || readOnly
  if (style === 'green') {
    return (
      <GalahhadSwitch checked={checked} onChange={onChange} disabled={disabled} locked={locked} title={title} size={size} />
    )
  }
  return (
    <NeuSwitch checked={checked} onChange={onChange} disabled={disabled} readOnly={readOnly} locked={locked} title={title} size={size} />
  )
}

// --- Green switch (Uiverse by Galahhad) ---
function GalahhadSwitch({ checked, onChange, disabled, locked, title, size }) {
  return (
    <label
      className={`gal-switch ${size === 'sm' ? 'sm' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${locked && !disabled ? 'cursor-default' : ''}`}
      title={title || (checked ? 'ON' : 'OFF')}
    >
      <input type="checkbox" checked={checked} disabled={disabled}
        onChange={(e) => !locked && onChange(e.target.checked)} />
      <span className="slider">
        <span className="circle">
          <svg className="cross" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 365.696 365.696" fill="currentColor">
            <path d="M243.188 182.86 356.32 69.726c12.5-12.5 12.5-32.766 0-45.267L341.238 9.376c-12.5-12.5-32.765-12.5-45.266 0L182.838 122.51 69.704 9.376c-12.5-12.5-32.766-12.5-45.267 0L9.36 24.459c-12.5 12.5-12.5 32.767 0 45.267L122.494 182.86 9.36 295.99c-12.5 12.5-12.5 32.766 0 45.266l15.083 15.083c12.5 12.5 32.766 12.5 45.267 0l113.134-113.133L295.973 356.4c12.5 12.5 32.766 12.5 45.266 0l15.083-15.083c12.5-12.5 12.5-32.766 0-45.266L243.188 182.86z" />
          </svg>
          <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.707 19.121a.997.997 0 0 1-1.414 0l-5.646-5.647a1.5 1.5 0 0 1 0-2.121l.707-.707a1.5 1.5 0 0 1 2.121 0L9 14.171l9.525-9.525a1.5 1.5 0 0 1 2.121 0l.707.707a1.5 1.5 0 0 1 0 2.121L9.707 19.121z" />
          </svg>
        </span>
      </span>
    </label>
  )
}

// --- Default dark neumorphic switch ("switch-button" style) ---
function NeuSwitch({ checked, onChange, disabled, readOnly, locked, title, size }) {
  const S = size === 'sm'
    ? { w: 50, h: 24, pad: 3, knob: 18, ind: 11, indBorder: 2 }
    : { w: 68, h: 32, pad: 4, knob: 24, ind: 15, indBorder: 3 }

  const innerW = S.w - S.pad * 2
  const knobTravel = innerW - S.knob            // knob slides left → right
  const indTravel = -(innerW - S.ind)           // indicator slides right → left

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-readonly={readOnly}
      disabled={disabled}
      title={title || (checked ? 'ON' : 'OFF')}
      onClick={() => !locked && onChange(!checked)}
      className={`relative inline-flex items-center shrink-0 box-border ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
      style={{
        width: S.w,
        height: S.h,
        padding: S.pad,
        borderRadius: 165,
        background: '#252532',
        border: '1px solid #32303e',
        boxShadow: 'inset 0px 5px 10px 0px #16151c, 0px 3px 6px -2px #403f4e',
      }}
    >
      {/* Sliding knob */}
      <span
        className="absolute top-1/2 rounded-full"
        style={{
          width: S.knob,
          height: S.knob,
          left: S.pad,
          zIndex: 2,
          background: 'linear-gradient(#3b3a4e, #272733)',
          boxShadow: 'inset 0px 5px 4px 0px #424151, 0px 4px 15px 0px #0f0e17',
          transform: `translateY(-50%) translateX(${checked ? knobTravel : 0}px)`,
          transition: 'transform 0.3s ease-in',
        }}
      />
      {/* Indicator ring: red (OFF) on the right → green (ON) on the left */}
      <span
        className="absolute top-1/2 rounded-full"
        style={{
          width: S.ind,
          height: S.ind,
          right: S.pad,
          zIndex: 1,
          boxSizing: 'border-box',
          border: `${S.indBorder}px solid ${checked ? '#60d480' : '#ef565f'}`,
          transform: `translateY(-50%) translateX(${checked ? indTravel : 0}px)`,
          transition: 'transform 0.3s ease-in, border-color 0.3s ease',
        }}
      />
    </button>
  )
}
