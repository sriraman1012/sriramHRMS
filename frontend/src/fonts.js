// Browser-only font preference (saved in localStorage, applied to <body>).
export const FONTS = [
  { value: 'system', label: 'System Font (default)', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { value: 'segoe', label: 'Segoe UI', stack: "'Segoe UI', Tahoma, Geneva, sans-serif" },
  { value: 'serif-times', label: 'Times New Roman', stack: "'Times New Roman', Times, serif" },
  { value: 'georgia', label: 'Georgia', stack: "Georgia, 'Times New Roman', serif" },
  { value: 'arial', label: 'Arial', stack: "Arial, Helvetica, sans-serif" },
  { value: 'mono', label: 'Monospace', stack: "'Consolas', 'Courier New', monospace" },
]

const KEY = 'att_font'

export function getSavedFont() {
  return localStorage.getItem(KEY) || 'system'
}

export function stackFor(value) {
  return (FONTS.find((f) => f.value === value) || FONTS[0]).stack
}

export function applyFont(value) {
  document.body.style.fontFamily = stackFor(value)
}

export function saveFont(value) {
  localStorage.setItem(KEY, value)
  applyFont(value)
}
