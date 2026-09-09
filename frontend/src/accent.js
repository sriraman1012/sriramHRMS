// Runtime accent-colour theming. The whole app's "blue" utilities read CSS
// variables (--accent-50 … --accent-900); here we generate a full scale from a
// single base colour and write those variables onto :root.

const KEY = 'att_accent'
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
const mix = (c, target, f) => clamp(c * (1 - f) + target * f)

const hexToRgb = (hex) => {
  const h = String(hex || '').replace('#', '')
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Treat the chosen colour as the "600" shade and build 50…900 around it.
function scaleFrom(hex) {
  const [r, g, b] = hexToRgb(hex || '#2563eb')
  const lighter = (f) => `${mix(r, 255, f)} ${mix(g, 255, f)} ${mix(b, 255, f)}`
  const darker = (f) => `${mix(r, 0, f)} ${mix(g, 0, f)} ${mix(b, 0, f)}`
  return {
    50: lighter(0.95), 100: lighter(0.85), 200: lighter(0.7), 300: lighter(0.5),
    400: lighter(0.3), 500: lighter(0.12), 600: `${r} ${g} ${b}`,
    700: darker(0.15), 800: darker(0.3), 900: darker(0.45),
  }
}

// Preset accent colours (the "multi colour" options).
export const PRESETS = [
  { key: 'blue', label: 'Blue', hex: '#2563eb' },
  { key: 'emerald', label: 'Green', hex: '#059669' },
  { key: 'violet', label: 'Violet', hex: '#7c3aed' },
  { key: 'rose', label: 'Rose', hex: '#e11d48' },
  { key: 'amber', label: 'Amber', hex: '#d97706' },
  { key: 'teal', label: 'Teal', hex: '#0d9488' },
  { key: 'cyan', label: 'Cyan', hex: '#0891b2' },
  { key: 'pink', label: 'Pink', hex: '#db2777' },
  { key: 'slate', label: 'Graphite', hex: '#475569' },
]

export function getAccent() {
  return localStorage.getItem(KEY) || '#2563eb'
}

export function applyAccent(hex) {
  const s = scaleFrom(hex || '#2563eb')
  const root = document.documentElement
  for (const k of Object.keys(s)) root.style.setProperty(`--accent-${k}`, s[k])
}

export function saveAccent(hex) {
  localStorage.setItem(KEY, hex)
  applyAccent(hex)
}
