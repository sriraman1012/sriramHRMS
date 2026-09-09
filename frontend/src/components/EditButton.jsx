import { useEffect, useState } from 'react'
import { getEditStyle } from '../prefs.js'
import { Pencil } from './icons.jsx'

// Edit button with two selectable looks (chosen in Settings, applied live):
//  - 'default': small pencil icon button
//  - 'purple' : Uiverse slide-pencil "Edit" button
// Same API everywhere: onClick, disabled, title, className.
export default function EditButton({ onClick, disabled = false, title = 'Edit', className = '' }) {
  const [style, setStyle] = useState(getEditStyle())
  useEffect(() => {
    const h = () => setStyle(getEditStyle())
    window.addEventListener('editstyle', h)
    return () => window.removeEventListener('editstyle', h)
  }, [])

  if (style === 'purple') {
    return (
      <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title} className={`edit-btn ${className}`}>
        Edit
        <svg className="edit-svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zm-71.6-71.6l62.1 62.1-62.1-62.1zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0z" />
        </svg>
      </button>
    )
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 ${className}`}>
      <Pencil />
    </button>
  )
}
