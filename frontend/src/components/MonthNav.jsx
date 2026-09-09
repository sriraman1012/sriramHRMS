import { ChevronLeft, ChevronRight } from './icons.jsx'

// Prev / Next month navigation (3D buttons). Wraps year on Dec↔Jan.
// Props: year, month (1-12), onChange(newYear, newMonth).
export default function MonthNav({ year, month, onChange }) {
  const step = (n) => {
    const d = new Date(year, month - 1 + n, 1)
    onChange(d.getFullYear(), d.getMonth() + 1)
  }
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" onClick={() => step(-1)} title="Previous month" aria-label="Previous month" className="btn3d">
        <span className="btn3d-top"><ChevronLeft /></span>
        <span className="btn3d-bottom" />
        <span className="btn3d-base" />
      </button>
      <button type="button" onClick={() => step(1)} title="Next month" aria-label="Next month" className="btn3d">
        <span className="btn3d-top"><ChevronRight /></span>
        <span className="btn3d-bottom" />
        <span className="btn3d-base" />
      </button>
    </div>
  )
}
