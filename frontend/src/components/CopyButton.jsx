// Copy-to-clipboard icon button (Uiverse by Galahhad) with a "Copy" → "Copied!" tooltip + checkmark.
// Pass `getText` (a function returning the string to copy) or `text`.
export default function CopyButton({ getText, text = '', initial = 'Copy', done = 'Copied!', className = '' }) {
  const onClick = async () => {
    const t = (typeof getText === 'function' ? getText() : text) || ''
    try {
      await navigator.clipboard.writeText(t)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select()
      try { document.execCommand('copy') } catch { /* noop */ }
      document.body.removeChild(ta)
    }
  }
  return (
    <button type="button" className={`copy ${className}`} onClick={onClick} aria-label={initial}>
      <span className="tooltip" data-text-initial={initial} data-text-end={done} />
      <svg className="clipboard" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 6.35 6.35" fill="currentColor">
        <path d="M2.43.265c-.3 0-.548.236-.573.53h-.328a.74.74 0 0 0-.735.734v3.822a.74.74 0 0 0 .735.734H4.82a.74.74 0 0 0 .735-.734V1.529a.74.74 0 0 0-.735-.734h-.328a.58.58 0 0 0-.573-.53zm0 .529h1.49c.032 0 .049.017.049.049v.431c0 .032-.017.049-.049.049H2.43c-.032 0-.05-.017-.05-.049V.843c0-.032.018-.05.05-.05zm-.901.53h.328c.026.292.274.528.573.528h1.49a.58.58 0 0 0 .573-.529h.328a.2.2 0 0 1 .206.206v3.822a.2.2 0 0 1-.206.205H1.53a.2.2 0 0 1-.206-.205V1.529a.2.2 0 0 1 .206-.206z" />
      </svg>
      <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.55 18.2 3.65 12.3l1.4-1.4 4.5 4.5 9-9 1.4 1.4z" />
      </svg>
    </button>
  )
}
