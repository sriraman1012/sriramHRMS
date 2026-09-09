import { useEffect, useRef, useState } from 'react'
import { FileText, Menu, Trash, X } from './icons.jsx'

const KEY = 'att_notes_v2'
const OLD_KEY = 'att_notepad' // migrate the old single plain-text note

// Windows Sticky-Notes style colours (light note bg + a slightly stronger top bar).
const COLORS = [
  { key: 'yellow', bg: '#fef9c3', bar: '#fde047', text: '#3f3f0a' },
  { key: 'green', bg: '#dcfce7', bar: '#86efac', text: '#0b3d1e' },
  { key: 'pink', bg: '#fce7f3', bar: '#f9a8d4', text: '#500724' },
  { key: 'purple', bg: '#ede9fe', bar: '#c4b5fd', text: '#2e1065' },
  { key: 'blue', bg: '#dbeafe', bar: '#93c5fd', text: '#0c2a52' },
  { key: 'gray', bg: '#f1f5f9', bar: '#cbd5e1', text: '#0f172a' },
  { key: 'dark', bg: '#374151', bar: '#4b5563', text: '#f8fafc' },
]
const colorOf = (k) => COLORS.find((c) => c.key === k) || COLORS[0]
const uid = () => `${Date.now().toString(36)}${Math.floor(performance.now())}`

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { const d = JSON.parse(raw); if (Array.isArray(d.notes) && d.notes.length) return d }
  } catch { /* ignore */ }
  const old = localStorage.getItem(OLD_KEY)
  const first = { id: uid(), color: 'yellow', html: old ? old.replace(/\n/g, '<br>') : '' }
  return { notes: [first], current: first.id }
}
const previewOf = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim()

export default function Notepad() {
  const [open, setOpen] = useState(false)
  const [store, setStore] = useState(load)
  const [menuOpen, setMenuOpen] = useState(false)
  const [view, setView] = useState('editor') // editor | list
  const editorRef = useRef(null)
  const fileRef = useRef(null)

  const notes = store.notes
  const current = notes.find((n) => n.id === store.current) || notes[0]
  const col = colorOf(current.color)
  const anyNote = notes.some((n) => previewOf(n.html))

  // Persist on every change.
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(store)) } catch { /* ignore */ } }, [store])

  // Load the current note's HTML into the editor when it opens or the note switches.
  useEffect(() => {
    if (open && view === 'editor' && editorRef.current) editorRef.current.innerHTML = current.html || ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, view, store.current])

  const patchCurrent = (patch) => setStore((s) => ({ ...s, notes: s.notes.map((n) => (n.id === s.current ? { ...n, ...patch } : n)) }))
  const saveHtml = () => { if (editorRef.current) patchCurrent({ html: editorRef.current.innerHTML }) }

  const exec = (cmd, val = null) => { editorRef.current?.focus(); document.execCommand(cmd, false, val); saveHtml() }
  const onImage = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => { editorRef.current?.focus(); document.execCommand('insertImage', false, r.result); saveHtml() }
    r.readAsDataURL(f); e.target.value = ''
  }

  const addNote = () => {
    const n = { id: uid(), color: current.color, html: '' }
    setStore((s) => ({ notes: [n, ...s.notes], current: n.id }))
    setView('editor'); setMenuOpen(false)
  }
  const deleteNote = () => {
    setStore((s) => {
      const rest = s.notes.filter((n) => n.id !== s.current)
      if (!rest.length) { const n = { id: uid(), color: 'yellow', html: '' }; return { notes: [n], current: n.id } }
      return { notes: rest, current: rest[0].id }
    })
    setMenuOpen(false); setView('editor')
  }

  const TB = ({ cmd, val, label, children }) => (
    <button type="button" title={label} onMouseDown={(e) => e.preventDefault()} onClick={() => exec(cmd, val)}
      className="w-8 h-8 flex items-center justify-center rounded hover:bg-black/10 text-[15px]" style={{ color: col.text }}>
      {children}
    </button>
  )

  return (
    <div className="relative">
      <button onClick={() => { setOpen((o) => !o); setView('editor'); setMenuOpen(false) }} title="Sticky Notes"
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/15 text-slate-200 hover:bg-white/15">
        <FileText size={17} />
        {anyNote && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white dark:border-[#161925]" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setMenuOpen(false) }} />
          <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden border border-black/10"
            style={{ background: col.bg, color: col.text }}>
            {/* Top bar */}
            <div className="relative flex items-center gap-1 px-2 py-1.5" style={{ background: col.bar }}>
              <button type="button" onClick={() => setMenuOpen((o) => !o)} title="Menu"
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-black/10" style={{ color: col.text }}><Menu size={16} /></button>
              <span className="text-xs font-bold ml-1 flex items-center gap-1"><FileText size={13} /> Sticky Note</span>
              <button type="button" onClick={() => setOpen(false)} title="Close"
                className="ml-auto w-8 h-8 flex items-center justify-center rounded hover:bg-black/10" style={{ color: col.text }}><X size={16} /></button>

              {/* Menu dropdown: colours + Notes list + Delete */}
              {menuOpen && (
                <div className="absolute left-0 top-full mt-0.5 w-64 rounded-b-lg bg-white text-slate-800 shadow-xl border border-black/10 z-10">
                  <div className="flex gap-1 p-2">
                    {COLORS.map((c) => (
                      <button key={c.key} type="button" title={c.key} onClick={() => { patchCurrent({ color: c.key }); setMenuOpen(false) }}
                        className="w-7 h-7 rounded-md border border-black/10 flex items-center justify-center" style={{ background: c.bar }}>
                        {current.color === c.key && <span style={{ color: c.text }}>✓</span>}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => { setView(view === 'list' ? 'editor' : 'list'); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 border-t border-black/10"><Menu size={15} /> Notes list</button>
                  <button type="button" onClick={deleteNote}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-black/10"><Trash size={15} /> Delete note</button>
                </div>
              )}
            </div>

            {view === 'list' ? (
              /* Notes list */
              <div className="max-h-72 overflow-y-auto bg-white text-slate-800">
                <div className="flex items-center justify-between px-3 py-2 border-b border-black/10">
                  <span className="text-sm font-bold">Notes list</span>
                  <button type="button" onClick={addNote} className="text-xs font-bold text-blue-600 hover:underline">+ New note</button>
                </div>
                {notes.map((n) => {
                  const nc = colorOf(n.color); const p = previewOf(n.html)
                  return (
                    <button key={n.id} type="button" onClick={() => { setStore((s) => ({ ...s, current: n.id })); setView('editor') }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 border-b border-black/5 ${n.id === current.id ? 'bg-slate-100' : ''}`}>
                      <span className="w-3.5 h-3.5 rounded-sm shrink-0 border border-black/10" style={{ background: nc.bar }} />
                      <span className="text-sm truncate flex-1">{p || <span className="text-slate-400 italic">Empty note</span>}</span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <>
                {/* Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={saveHtml}
                  data-ph="Take a note…"
                  className="notepad-editor min-h-[180px] max-h-[46vh] overflow-y-auto px-4 py-3 text-sm outline-none"
                  style={{ color: col.text }}
                />
                {/* Formatting toolbar */}
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-t" style={{ background: col.bar, borderColor: 'rgba(0,0,0,0.1)' }}>
                  <TB cmd="bold" label="Bold"><b>B</b></TB>
                  <TB cmd="italic" label="Italic"><i>I</i></TB>
                  <TB cmd="underline" label="Underline"><u>U</u></TB>
                  <TB cmd="strikeThrough" label="Strikethrough"><span style={{ textDecoration: 'line-through' }}>ab</span></TB>
                  <TB cmd="insertUnorderedList" label="Bullet list">≣</TB>
                  <button type="button" title="Image" onMouseDown={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-black/10 text-[15px]" style={{ color: col.text }}>🖼</button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onImage} className="hidden" />
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
