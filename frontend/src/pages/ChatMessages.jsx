import { useEffect, useRef, useState } from 'react'
import {
  getContacts, getConversation, sendMessage, heartbeat, getChatProfile, updateChatProfile,
  editMessage, deleteMessage, clearConversation, purgeConversation, setNickname, getStorage, reactToMessage,
} from '../api/chat.js'
import { Search, Send, Paperclip, Reply, Forward, Smile, Dots, Copy, Pencil, Trash, ChevronLeft, Star, Pin, Mic, Gear, BarChart } from '../components/icons.jsx'
import SearchBox from '../components/SearchBox.jsx'
import SendButton from '../components/SendButton.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import BreakButton from '../components/BreakButton.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getChatMaxMb } from '../prefs.js'

const EMOJIS = ['😀', '😂', '😊', '😍', '😘', '😎', '🤩', '🥳', '😉', '🙂', '😢', '😭', '😡', '🤔', '😴', '👍', '👎', '🙏', '👏', '💪', '🙌', '👌', '✅', '❌', '🔥', '✨', '🎉', '❤️', '💯', '⭐', '🌟', '☀️', '🌙', '☕', '🍕', '🎂', '🎁', '📎', '📷', '📞', '💬', '⏰', '🚀', '💰', '📊', '🏆', '🌈', '⚡']

// Chat-only wallpaper/theme presets — LIGHT colours only.
const THEMES = [
  { key: 'default', name: 'Default', bg: '#eef1f6' },
  { key: 'paper', name: 'Paper', bg: '#f6f5f1' },
  { key: 'mint', name: 'Mint', bg: 'linear-gradient(135deg,#e2f6ee,#cbecdf)' },
  { key: 'sky', name: 'Sky', bg: 'linear-gradient(135deg,#e6f1fd,#d2e5fb)' },
  { key: 'lavender', name: 'Lavender', bg: 'linear-gradient(135deg,#efe9fb,#e2d8f7)' },
  { key: 'peach', name: 'Peach', bg: 'linear-gradient(135deg,#ffeede,#ffe1d0)' },
  { key: 'rose', name: 'Rose', bg: 'linear-gradient(135deg,#fde8ee,#fbd6e1)' },
  { key: 'lemon', name: 'Lemon', bg: 'linear-gradient(135deg,#fbf6da,#f6efc2)' },
  { key: 'aqua', name: 'Aqua', bg: 'linear-gradient(135deg,#e2f7fa,#cbeef3)' },
]
const loadChatTheme = () => localStorage.getItem('att_chat_theme') || 'default'
const loadWallpaper = () => localStorage.getItem('att_chat_wallpaper') || null
const loadBright = () => localStorage.getItem('att_chat_bright') || 'light'
const SCRIM = { light: 'rgba(0,0,0,0)', medium: 'rgba(15,23,42,0.22)', dark: 'rgba(10,14,25,0.55)' }
const msgBgStyle = (themeKey, wallpaper, bright = 'light') => {
  const scrim = SCRIM[bright] || SCRIM.light
  const overlay = `linear-gradient(${scrim},${scrim})`
  if (themeKey === 'custom' && wallpaper) return { backgroundImage: `${overlay}, url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }
  const base = (THEMES.find((t) => t.key === themeKey) || THEMES[0]).bg
  return { background: `${overlay}, ${base}` }
}

// Per-user local prefs (pins / starred) stored in this browser.
const readSet = (k) => { try { return new Set(JSON.parse(localStorage.getItem(k) || '[]')) } catch { return new Set() } }
const writeSet = (k, s) => localStorage.setItem(k, JSON.stringify([...s]))
const readMap = (k) => { try { return JSON.parse(localStorage.getItem(k) || '{}') } catch { return {} } }
const writeMap = (k, m) => localStorage.setItem(k, JSON.stringify(m))
const isAudio = (m) => m.fileType?.startsWith('audio/') || m.fileData?.startsWith('data:audio/')
const toDate = (iso) => (iso ? new Date(/Z|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + 'Z') : null)
const fmtTime = (iso) => { const d = toDate(iso); return d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '' }
const fmtDay = (iso) => { const d = toDate(iso); if (!d) return ''; const t = new Date(); const y = new Date(t); y.setDate(t.getDate() - 1)
  if (d.toDateString() === t.toDateString()) return 'Today'
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
const lastSeen = (c) => c?.isOnline ? 'online' : (c?.lastSeen ? `last seen ${fmtDay(c.lastSeen)} at ${fmtTime(c.lastSeen)}` : 'offline')
const nameOf = (c) => c?.nickname || c?.username || ''
const fmtBytes = (b) => { b = Number(b) || 0; if (b < 1024) return `${b} B`; if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`; return `${(b / 1048576).toFixed(1)} MB` }
const isImg = (m) => m.fileType?.startsWith('image/') || m.fileData?.startsWith('data:image/')

// Render text with clickable links.
function Linkify({ text, mine }) {
  if (!text) return null
  const parts = String(text).split(/(https?:\/\/[^\s]+|www\.[^\s]+)/g)
  return parts.map((p, i) => {
    if (/^(https?:\/\/|www\.)/.test(p)) {
      const href = p.startsWith('http') ? p : `https://${p}`
      return <a key={i} href={href} target="_blank" rel="noreferrer" className={`underline ${mine ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>{p}</a>
    }
    return <span key={i}>{p}</span>
  })
}

function Avatar({ src, name, size = 42, online }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div style={{ width: size, height: size }} className="rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white font-bold flex items-center justify-center overflow-hidden">
        {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : (name || '?').charAt(0).toUpperCase()}
      </div>
      {online !== undefined && <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#161925] ${online ? 'bg-green-500' : 'bg-slate-400'}`} />}
    </div>
  )
}

function Ticks({ m }) {
  if (!m.mine) return null
  if (m.readAt) return <span className="text-sky-300 text-[11px] ml-1">✓✓</span>
  if (m.deliveredAt) return <span className="text-slate-300 text-[11px] ml-1">✓✓</span>
  return <span className="text-slate-300 text-[11px] ml-1">✓</span>
}

export default function ChatMessages() {
  const { auth } = useAuth()
  // The "delete for everyone" (both-sides purge) is limited to the Admin group.
  const isAdmin = String(auth?.groupName || '').trim().toLowerCase() === 'admin'
  const [contacts, setContacts] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [attach, setAttach] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [editing, setEditing] = useState(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [menuMsg, setMenuMsg] = useState(null)
  const [reactMsg, setReactMsg] = useState(null) // message whose reaction bar is open
  const [forwardMsg, setForwardMsg] = useState(null) // message being forwarded
  const [headerMenu, setHeaderMenu] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [nickOpen, setNickOpen] = useState(false)
  const [storage, setStorage] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [chatTheme, setChatTheme] = useState(loadChatTheme())
  const [wallpaper, setWallpaper] = useState(loadWallpaper())
  const [bright, setBright] = useState(loadBright())
  const [dragOver, setDragOver] = useState(false)
  const [recSecs, setRecSecs] = useState(0)
  const recTimerRef = useRef(null)
  const [search, setSearch] = useState('')
  const [convSearch, setConvSearch] = useState('')
  const [convSearchOpen, setConvSearchOpen] = useState(false)
  const [pins, setPins] = useState(() => readSet('att_chat_pins'))
  const [autoErase, setAutoErase] = useState(() => readSet('att_chat_autoerase'))
  const autoEraseRef = useRef(autoErase)
  const [pinnedMsgs, setPinnedMsgs] = useState(() => readMap('att_chat_pinmsg'))
  const [stars, setStars] = useState(() => readMap('att_chat_stars'))
  const [starredOpen, setStarredOpen] = useState(false)
  const [contactProfile, setContactProfile] = useState(null)
  const [recording, setRecording] = useState(false)
  const recRef = useRef(null)
  const chunksRef = useRef([])
  // Generic in-app confirm for delete/clear/purge actions (replaces fragile window.confirm).
  // Value: { title, message, confirmLabel, danger, run }
  const [confirmAction, setConfirmAction] = useState(null)

  const togglePinChat = (id) => setPins((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); writeSet('att_chat_pins', s); return s })
  const toggleAutoErase = (id) => setAutoErase((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); writeSet('att_chat_autoerase', s); return s })
  const togglePinMsg = (m) => setPinnedMsgs((prev) => { const map = { ...prev }; const cur = map[selected.userId]; if (cur?.messageId === m.messageId) delete map[selected.userId]; else map[selected.userId] = { messageId: m.messageId, text: m.body || m.fileName || 'Attachment' }; writeMap('att_chat_pinmsg', map); return map })
  const toggleStar = (m) => setStars((prev) => { const map = { ...prev }; if (map[m.messageId]) delete map[m.messageId]; else map[m.messageId] = { messageId: m.messageId, text: m.body || m.fileName || 'Attachment', at: m.sentAt, mine: m.mine, contactId: selected.userId, contactName: nameOf(contacts.find((c) => c.userId === selected.userId) || selected) }; writeMap('att_chat_stars', map); return map })

  const applyTheme = (key, wp) => {
    setChatTheme(key); localStorage.setItem('att_chat_theme', key)
    if (wp !== undefined) { setWallpaper(wp); if (wp) localStorage.setItem('att_chat_wallpaper', wp); else localStorage.removeItem('att_chat_wallpaper') }
  }
  const applyBright = (b) => { setBright(b); localStorage.setItem('att_chat_bright', b) }
  const bgStyle = msgBgStyle(chatTheme, wallpaper, bright)
  const darkChat = bright === 'dark'
  const selectedRef = useRef(null)
  const fileRef = useRef(null)
  const endRef = useRef(null)
  const composerRef = useRef(null)
  const resetComposerHeight = () => { if (composerRef.current) composerRef.current.style.height = 'auto' }

  const loadContacts = () => getContacts().then(setContacts).catch(() => {})
  const loadProfile = () => getChatProfile().then(setProfile).catch(() => {})
  const loadConversation = (id) => getConversation(id).then((m) => { if (selectedRef.current === id) setMessages(m) }).catch(() => {})

  useEffect(() => {
    loadProfile(); loadContacts(); heartbeat().catch(() => {})
    const hb = setInterval(() => heartbeat().catch(() => {}), 20000)
    const cp = setInterval(loadContacts, 5000)
    return () => { clearInterval(hb); clearInterval(cp) }
  }, [])

  // Browsers throttle timers in background tabs, so poll results go stale. When the tab becomes
  // visible / regains focus, refresh immediately so updates show without a full page reload.
  useEffect(() => {
    const refreshNow = () => {
      if (document.visibilityState !== 'visible') return
      loadContacts()
      if (selectedRef.current) loadConversation(selectedRef.current)
      heartbeat().catch(() => {})
    }
    document.addEventListener('visibilitychange', refreshNow)
    window.addEventListener('focus', refreshNow)
    return () => { document.removeEventListener('visibilitychange', refreshNow); window.removeEventListener('focus', refreshNow) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { autoEraseRef.current = autoErase }, [autoErase])

  useEffect(() => {
    if (!selected) return
    selectedRef.current = selected.userId
    loadConversation(selected.userId)
    const cv = setInterval(() => loadConversation(selected.userId), 3000)
    const leavingId = selected.userId
    return () => {
      clearInterval(cv)
      // Auto-erase this chat on close (leaving / switching / unmount) if enabled.
      if (autoEraseRef.current.has(leavingId)) clearConversation(leavingId).then(loadContacts).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages.length])

  const openChat = (c) => { setSelected(c); setMessages([]); setReplyTo(null); setEditing(null); setText(''); setContacts((cs) => cs.map((x) => x.userId === c.userId ? { ...x, unread: 0 } : x)) }

  const readFile = (file) => {
    const maxMb = getChatMaxMb()
    if (file.size > maxMb * 1024 * 1024) {
      window.alert(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). The limit is ${maxMb} MB.\nAn admin can change it in Settings → Chat File Size.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAttach({ fileData: reader.result, fileName: file.name, fileType: file.type })
    reader.readAsDataURL(file)
  }
  const onAttach = (e) => { const file = e.target.files?.[0]; if (file) readFile(file); e.target.value = '' }
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer?.files?.[0]; if (file && selected) readFile(file) }

  const send = async () => {
    if (!selected) return
    const body = text.trim()
    if (editing) {
      if (!body) return
      setText(''); resetComposerHeight(); const eid = editing.messageId; setEditing(null)
      try { await editMessage(eid, body); await loadConversation(selected.userId) } catch { /* noop */ }
      return
    }
    if (!body && !attach) return
    const payload = { receiverId: selected.userId, body: body || null, fileData: attach?.fileData || null, fileName: attach?.fileName || null, fileType: attach?.fileType || null, replyToId: replyTo?.messageId || null }
    setText(''); resetComposerHeight(); setAttach(null); setReplyTo(null); setEmojiOpen(false)
    try { await sendMessage(payload); await loadConversation(selected.userId); loadContacts() } catch { /* noop */ }
  }

  const doDelete = (m) => { setMenuMsg(null); setConfirmAction({ title: '🗑️ Delete message?', message: 'Delete this message?', confirmLabel: 'Delete', danger: true, run: async () => { try { await deleteMessage(m.messageId); await loadConversation(selected.userId); loadContacts() } catch { /* noop */ } } }) }
  const doCopy = (m) => { setMenuMsg(null); navigator.clipboard?.writeText(m.body || '').catch(() => {}) }
  const doReply = (m) => { setMenuMsg(null); setEditing(null); setReplyTo(m) }
  const doForward = (m) => { setMenuMsg(null); setForwardMsg(m) }
  // Quick reaction: tap an emoji to attach it as a reaction badge on that message (toggle).
  const reactTo = async (m, emoji) => {
    if (!selected) return
    setReactMsg(null)
    try { await reactToMessage(m.messageId, emoji); await loadConversation(selected.userId) } catch { /* noop */ }
  }
  const doEdit = (m) => { setMenuMsg(null); setReplyTo(null); setEditing(m); setText(m.body || '') }
  const clearChat = () => { setHeaderMenu(false); setConfirmAction({ title: '🧹 Clear chat?', message: `Clear the entire chat with ${nameOf(selected)}?`, confirmLabel: 'Clear', danger: true, run: async () => { try { await clearConversation(selected.userId); setMessages([]); loadContacts() } catch { /* noop */ } } }) }
  const openStorage = () => getStorage().then(setStorage).catch(() => setStorage([]))

  // Voice message: tap mic to start (locked), then Send or Cancel.
  const cancelRef = useRef(false)
  const startRec = async () => {
    if (!selected || recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []; cancelRef.current = false
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        if (cancelRef.current || !chunksRef.current.length) return
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onload = async () => {
          try { await sendMessage({ receiverId: selected.userId, fileData: reader.result, fileName: 'voice-message.webm', fileType: 'audio/webm', replyToId: replyTo?.messageId || null }); setReplyTo(null); await loadConversation(selected.userId); loadContacts() } catch { /* noop */ }
        }
        reader.readAsDataURL(blob)
      }
      mr.start(); recRef.current = mr; setRecording(true); setRecSecs(0)
      recTimerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000)
    } catch { window.alert('Microphone not available or permission denied.') }
  }
  const stopRecInternal = () => { clearInterval(recTimerRef.current); if (recRef.current && recording) { try { recRef.current.stop() } catch { /* noop */ } } setRecording(false) }
  const sendRec = () => { cancelRef.current = false; stopRecInternal() }
  const cancelRec = () => { cancelRef.current = true; stopRecInternal() }
  const fmtSecs = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const filtered = contacts
    .filter((c) => !search.trim() || `${nameOf(c)} ${c.userCode || ''}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (pins.has(b.userId) ? 1 : 0) - (pins.has(a.userId) ? 1 : 0)) // pinned first (stable)
  const totalUnread = contacts.reduce((a, c) => a + (c.unread || 0), 0)
  const selContact = contacts.find((c) => c.userId === selected?.userId) || selected
  const cq = convSearch.trim().toLowerCase()
  const shownMessages = cq ? messages.filter((m) => (m.body || '').toLowerCase().includes(cq)) : messages
  const pinnedMsg = selected ? pinnedMsgs[selected.userId] : null
  let lastDay = null

  return (
    <div className="w-full h-[calc(100dvh-3.5rem)] flex overflow-hidden bg-white dark:bg-[#161925]">
      {/* Left panel — full width on mobile, fixed rail on desktop; hides when a chat is open on mobile */}
      <div className={`w-full md:w-72 shrink-0 border-r border-white/10 bg-[#0f1420] text-slate-100 flex-col ${selected ? 'hidden md:flex' : 'flex'}`}>
        <div className="h-16 px-3 flex items-center gap-2 border-b border-white/10 bg-[#1e2235]">
          <button onClick={() => setProfileOpen(true)} title="Edit profile" className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar src={profile?.profilePic} name={profile?.username} size={40} online />
            <div className="min-w-0 text-left">
              <div className="font-bold text-sm truncate">{profile?.username || '…'}</div>
              <div className="text-[11px] text-slate-400 truncate">{profile?.about || 'Tap to set your status'}</div>
            </div>
          </button>
          <button onClick={() => setStarredOpen(true)} title="Starred messages" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-amber-400 hover:bg-white/10"><Star size={17} /></button>
          <button onClick={() => setSettingsOpen(true)} title="Chat settings & themes" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"><Gear size={17} /></button>
          <button onClick={openStorage} title="Storage usage" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"><BarChart size={17} /></button>
        </div>
        <div className="p-2 bg-[#0f1420]">
          <SearchBox value={search} onChange={setSearch} placeholder="Search chats…" dark />
        </div>
        <div className="flex-1 overflow-y-auto bg-[#0f1420]">
          {filtered.length === 0 ? <div className="px-4 py-8 text-center text-sm text-slate-500">No users.</div>
            : filtered.map((c) => (
              <div key={c.userId} className={`group/row w-full flex items-center gap-3 px-3 py-2.5 border-b border-white/5 ${selected?.userId === c.userId ? 'bg-blue-500/15' : 'hover:bg-white/5'}`}>
                <button onClick={() => setContactProfile(c)} title="View profile"><Avatar src={c.profilePic} name={nameOf(c)} size={44} online={c.isOnline} /></button>
                <button onClick={() => openChat(c)} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    {pins.has(c.userId) && <Pin size={12} />}
                    <span className="font-bold text-sm truncate flex-1">{nameOf(c)}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{c.lastAt ? fmtTime(c.lastAt) : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[12px] text-slate-300 truncate flex-1">{c.lastMessage || (c.isOnline ? 'online' : 'Say hi 👋')}</span>
                    {c.unread > 0 && <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center">{c.unread}</span>}
                  </div>
                </button>
                <button onClick={() => togglePinChat(c.userId)} title={pins.has(c.userId) ? 'Unpin chat' : 'Pin chat'}
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover/row:opacity-100 ${pins.has(c.userId) ? 'opacity-100 text-blue-400' : 'text-slate-400'} hover:bg-white/10`}><Pin size={14} /></button>
              </div>
            ))}
        </div>
      </div>

      {/* Right panel — hidden on mobile until a chat is opened */}
      <div className={`flex-1 flex-col min-w-0 relative ${selected ? 'flex' : 'hidden md:flex'}`}
        onDragOver={(e) => { if (selected) { e.preventDefault(); setDragOver(true) } }}
        onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(false) }}
        onDrop={onDrop}>
        {dragOver && selected && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-blue-500/20 border-4 border-dashed border-blue-500 rounded-xl pointer-events-none">
            <div className="text-blue-700 dark:text-blue-300 font-bold text-lg flex items-center gap-2"><Paperclip size={22} /> Drop file to send</div>
          </div>
        )}
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-300 gap-2" style={bgStyle}>
            <div className="text-5xl">💬</div>
            <div className="font-bold">Unipro Chat</div>
            <div className="text-sm">Select a chat to start messaging{totalUnread > 0 ? ` · ${totalUnread} unread` : ''}.</div>
            <div className="mt-5"><BreakButton label="Take a break" /></div>
          </div>
        ) : (
          <>
            <div className="h-16 px-2 flex items-center gap-1 border-b border-white/10 bg-[#1e2235] text-slate-100 relative">
              <button onClick={() => setSelected(null)} title="Back to chats" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"><ChevronLeft size={20} /></button>
              <button onClick={() => setContactProfile(selContact)} title="View profile" className="flex items-center gap-3 min-w-0 flex-1 text-left">
                <Avatar src={selContact.profilePic} name={nameOf(selContact)} size={40} online={selContact.isOnline} />
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{nameOf(selContact)}</div>
                  <div className="text-[11px] text-slate-400 truncate">{lastSeen(selContact)}</div>
                </div>
              </button>
              <button onClick={() => { setConvSearchOpen((o) => !o); setConvSearch('') }} title="Search in chat" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"><Search size={18} /></button>
              <button onClick={() => setHeaderMenu((o) => !o)} className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"><Dots size={18} /></button>
              {headerMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setHeaderMenu(false)} />
                  <div className="absolute right-3 top-14 z-50 w-44 rounded-xl border border-white/15 bg-[#1e2235] text-slate-100 shadow-xl py-1 text-sm">
                    <button onClick={() => { setHeaderMenu(false); togglePinChat(selected.userId) }} className="w-full text-left px-4 py-2 hover:bg-white/10 font-bold">{pins.has(selected.userId) ? 'Unpin chat' : 'Pin chat'}</button>
                    <button onClick={() => { setHeaderMenu(false); toggleAutoErase(selected.userId) }} className="w-full text-left px-4 py-2 hover:bg-white/10 font-bold">{autoErase.has(selected.userId) ? '✓ Auto-erase on close' : 'Auto-erase on close'}</button>
                    <button onClick={() => { setHeaderMenu(false); setNickOpen(true) }} className="w-full text-left px-4 py-2 hover:bg-white/10 font-bold">Set nickname</button>
                    <button onClick={() => { setHeaderMenu(false); setContactProfile(selContact) }} className="w-full text-left px-4 py-2 hover:bg-white/10 font-bold">View profile</button>
                    <button onClick={clearChat} className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 font-bold">Clear chat</button>
                  </div>
                </>
              )}
            </div>
            {convSearchOpen && (
              <div className="px-3 py-2 border-b border-white/10 bg-[#1e2235] text-slate-100 flex items-center gap-2">
                <span className="text-slate-400"><Search size={14} /></span>
                <input autoFocus value={convSearch} onChange={(e) => setConvSearch(e.target.value)} placeholder="Search messages…" className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 outline-none" />
                <span className="text-[11px] text-slate-400">{cq ? `${shownMessages.length} found` : ''}</span>
                <button onClick={() => { setConvSearchOpen(false); setConvSearch('') }} className="text-slate-400 font-bold px-1">×</button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 relative" style={bgStyle}>
              {pinnedMsg && (
                <div className="sticky top-0 z-10 -mt-1 mb-2 flex items-center gap-2 bg-white/90 dark:bg-[#1e2235]/90 backdrop-blur border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs shadow-sm">
                  <span className="text-blue-500"><Pin size={13} /></span>
                  <div className="min-w-0 flex-1"><div className="font-bold text-slate-500 dark:text-slate-400 text-[10px]">Pinned</div><div className="truncate">{pinnedMsg.text}</div></div>
                  <button onClick={() => togglePinMsg({ messageId: pinnedMsg.messageId })} className="text-red-500 font-bold px-1">×</button>
                </div>
              )}
              {shownMessages.map((m) => {
                const day = fmtDay(m.sentAt); const showDay = !cq && day !== lastDay; lastDay = day
                const canEdit = m.mine && !m.isDeleted && !m.fileData
                const starred = !!stars[m.messageId]
                return (
                  <div key={m.messageId}>
                    {showDay && <div className="text-center my-2"><span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-white/10 px-2 py-0.5 rounded-full">{day}</span></div>}
                    <div className={`group flex items-center gap-1 ${m.mine ? 'justify-end' : 'justify-start'} ${m.reactions ? 'mb-3' : ''}`}>
                      {m.mine && !m.isDeleted && <button type="button" title="React" onClick={() => setReactMsg(reactMsg === m.messageId ? null : m.messageId)} className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-sm text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">🙂</button>}
                      {m.mine && !m.isDeleted && <MsgMenu open={menuMsg === m.messageId} starred={starred} onToggle={() => setMenuMsg(menuMsg === m.messageId ? null : m.messageId)} onReply={() => doReply(m)} onForward={() => doForward(m)} onCopy={() => doCopy(m)} onStar={() => { setMenuMsg(null); toggleStar(m) }} onPin={() => { setMenuMsg(null); togglePinMsg(m) }} onEdit={canEdit ? () => doEdit(m) : null} onDelete={() => doDelete(m)} />}
                      <div className={`relative max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${m.mine ? 'bg-blue-600 text-white rounded-br-sm' : darkChat ? 'bg-[#243244] text-slate-100 rounded-bl-sm' : 'bg-white dark:bg-[#1e2235] text-slate-800 dark:text-slate-100 rounded-bl-sm'}`}>
                        {m.isDeleted ? (
                          <div className="text-sm italic opacity-70">🚫 This message was deleted</div>
                        ) : (
                          <>
                            {m.replyBody && (
                              <div className={`text-[11px] rounded-lg px-2 py-1 mb-1 border-l-2 ${m.mine ? 'bg-white/15 border-white/60' : 'bg-black/5 dark:bg-white/10 border-blue-500'}`}>
                                <div className="font-bold">{m.replyMine ? 'You' : nameOf(selContact)}</div>
                                <div className="truncate opacity-80">{m.replyBody}</div>
                              </div>
                            )}
                            {m.fileData && (isAudio(m)
                              ? <audio controls src={m.fileData} className="max-w-[220px] mb-1" />
                              : isImg(m)
                                ? <a href={m.fileData} target="_blank" rel="noreferrer"><img src={m.fileData} alt={m.fileName} className="rounded-lg max-w-[240px] max-h-[240px] object-cover mb-1" /></a>
                                : <a href={m.fileData} download={m.fileName} className={`flex items-center gap-2 mb-1 underline text-sm ${m.mine ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}><Paperclip size={14} /> {m.fileName}</a>)}
                            {m.body && <div className="text-sm whitespace-pre-wrap break-words"><Linkify text={m.body} mine={m.mine} /></div>}
                            <div className={`text-[10px] mt-0.5 flex items-center justify-end gap-1 ${m.mine ? 'text-blue-100' : 'text-slate-400'}`}>
                              {starred && <span title="Starred" className="text-amber-400"><Star size={11} filled /></span>}
                              {m.editedAt && <span className="italic">edited</span>}
                              {fmtTime(m.sentAt)}<Ticks m={m} />
                            </div>
                          </>
                        )}
                        {/* Reaction badge attached to the bubble */}
                        {m.reactions && (
                          <div className={`absolute -bottom-3 ${m.mine ? 'right-1' : 'left-1'} px-1.5 py-0.5 rounded-full bg-white dark:bg-[#2a2f42] border border-slate-200 dark:border-white/10 shadow text-xs leading-none`}>{m.reactions}</div>
                        )}
                        {/* Reaction picker bar (opens above the message) */}
                        {reactMsg === m.messageId && !m.isDeleted && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setReactMsg(null)} />
                            <div className={`absolute z-50 bottom-full mb-2 ${m.mine ? 'right-0' : 'left-0'} flex items-center gap-1 p-1.5 rounded-full bg-[#e8e4df] dark:bg-[#191818] shadow-xl`}>
                              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((em) => (
                                <button key={em} type="button" onClick={() => reactTo(m, em)}
                                  className="w-8 h-8 rounded-full hover:bg-white dark:hover:bg-[#232323] text-lg leading-none transition-transform hover:scale-125">{em}</button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      {!m.mine && !m.isDeleted && <MsgMenu open={menuMsg === m.messageId} starred={starred} onToggle={() => setMenuMsg(menuMsg === m.messageId ? null : m.messageId)} onReply={() => doReply(m)} onForward={() => doForward(m)} onCopy={() => doCopy(m)} onStar={() => { setMenuMsg(null); toggleStar(m) }} onPin={() => { setMenuMsg(null); togglePinMsg(m) }} onEdit={null} onDelete={null} left />}
                      {!m.mine && !m.isDeleted && <button type="button" title="React" onClick={() => setReactMsg(reactMsg === m.messageId ? null : m.messageId)} className="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-sm text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">🙂</button>}
                    </div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <div className="p-3 border-t border-white/10 bg-[#1e2235] text-slate-100 relative">
              {(replyTo || editing) && (
                <div className="mb-2 flex items-center gap-2 text-xs bg-[#161925] border-l-2 border-blue-500 rounded-lg px-3 py-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-blue-400">{editing ? 'Editing message' : `Replying to ${replyTo.mine ? 'yourself' : nameOf(selContact)}`}</div>
                    <div className="truncate text-slate-400">{(editing || replyTo).body || (editing || replyTo).fileName || 'Attachment'}</div>
                  </div>
                  <button onClick={() => { setReplyTo(null); setEditing(null); setText('') }} className="text-red-500 font-bold px-1">×</button>
                </div>
              )}
              {attach && !editing && (
                <div className="mb-2 flex items-center gap-2 text-xs bg-[#161925] border border-white/10 rounded-lg px-2 py-1 w-fit">
                  <Paperclip size={13} /> <span className="font-bold truncate max-w-[200px]">{attach.fileName}</span>
                  <button onClick={() => setAttach(null)} className="text-red-500 font-bold px-1">×</button>
                </div>
              )}
              {emojiOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setEmojiOpen(false)} />
                  <div className="absolute bottom-16 left-3 z-50 w-72 max-h-48 overflow-y-auto rounded-xl border border-white/15 bg-[#1e2235] shadow-xl p-2 grid grid-cols-8 gap-1">
                    {EMOJIS.map((e) => <button key={e} onClick={() => setText((t) => t + e)} className="text-xl hover:bg-white/10 rounded">{e}</button>)}
                  </div>
                </>
              )}
              {recording ? (
                <div className="flex items-center gap-3">
                  <button onClick={cancelRec} title="Cancel" className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash size={20} /></button>
                  <span className="flex items-center gap-2 text-sm font-bold text-red-500 shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />{fmtSecs(recSecs)}</span>
                  <div className="flex-1 flex items-center gap-0.5 h-8 overflow-hidden">
                    {Array.from({ length: 44 }).map((_, i) => (
                      <span key={i} className="w-1 rounded bg-red-400/70 animate-pulse" style={{ height: `${25 + Math.abs(Math.sin(i * 1.3)) * 65}%`, animationDelay: `${(i % 12) * 70}ms` }} />
                    ))}
                  </div>
                  <button onClick={sendRec} title="Send voice message" className="w-11 h-11 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"><Send size={20} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setEmojiOpen((o) => !o)} title="Emoji" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"><Smile size={18} /></button>
                  {!editing && (
                    <>
                      <button onClick={() => fileRef.current?.click()} title="Attach" className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"><Paperclip size={18} /></button>
                      <input ref={fileRef} type="file" onChange={onAttach} className="hidden" />
                    </>
                  )}
                  <textarea
                    ref={composerRef}
                    rows={1}
                    value={text}
                    onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px` }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                    placeholder={editing ? 'Edit message…' : 'Type a message…  (Shift+Enter = new line)'}
                    className="flex-1 resize-none max-h-[120px] rounded-2xl border border-white/15 bg-[#0d0f18] text-slate-100 placeholder-slate-400 px-4 py-2 text-sm leading-5 outline-none focus:border-blue-500" />
                  {!editing && (
                    <button onClick={startRec} title="Record a voice message" className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10"><Mic size={19} /></button>
                  )}
                  <SendButton onClick={send} label={editing ? 'Save' : 'Send'} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {profileOpen && profile && <ProfileModal profile={profile} onClose={() => setProfileOpen(false)} onSaved={(p) => { setProfile(p); setProfileOpen(false); loadContacts() }} />}
      {nickOpen && selected && <NickModal contact={selContact} onClose={() => setNickOpen(false)} onSaved={() => { setNickOpen(false); loadContacts() }} />}
      {storage !== null && <StorageModal list={storage} isAdmin={isAdmin} onClose={() => setStorage(null)}
        onClear={(uid) => setConfirmAction({ title: '🧹 Clear chat?', message: 'Clear this chat from YOUR side only? The other person keeps their copy.', confirmLabel: 'Clear', danger: true, run: async () => { try { await clearConversation(uid); if (selected?.userId === uid) setMessages([]); loadContacts(); openStorage() } catch { /* noop */ } } })}
        onPurge={(uid) => setConfirmAction({ title: '🗑️ Delete chat for everyone?', message: 'Delete this chat for EVERYONE and free the storage? This removes the messages for both users and cannot be undone.', confirmLabel: 'Delete', danger: true, run: async () => { try { await purgeConversation(uid); if (selected?.userId === uid) setMessages([]); loadContacts(); openStorage() } catch { /* noop */ } } })} />}
      {settingsOpen && <ChatSettingsModal theme={chatTheme} wallpaper={wallpaper} bright={bright} onApply={applyTheme} onBright={applyBright} onClose={() => setSettingsOpen(false)} />}
      {contactProfile && <ContactProfileModal c={contactProfile} pinned={pins.has(contactProfile.userId)}
        onMessage={() => { openChat(contactProfile); setContactProfile(null) }}
        onPin={() => togglePinChat(contactProfile.userId)}
        onNickname={() => { setSelected(contactProfile); setContactProfile(null); setNickOpen(true) }}
        onClose={() => setContactProfile(null)} />}
      {starredOpen && <StarredModal stars={stars} onClose={() => setStarredOpen(false)} onUnstar={(id) => setStars((prev) => { const m = { ...prev }; delete m[id]; writeMap('att_chat_stars', m); return m })} />}
      {forwardMsg && <ForwardModal message={forwardMsg} contacts={contacts}
        onClose={() => setForwardMsg(null)}
        onDone={(ids) => { setForwardMsg(null); loadContacts(); if (selectedRef.current && ids.includes(selectedRef.current)) loadConversation(selectedRef.current) }} />}
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.confirmLabel}
        danger={confirmAction?.danger}
        onConfirm={() => { const a = confirmAction; setConfirmAction(null); a?.run() }}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  )
}

function ContactProfileModal({ c, pinned, onMessage, onPin, onNickname, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center pt-6 pb-4">
          <button onClick={onClose} className="absolute top-2 right-3 text-white/90 text-xl font-bold">×</button>
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white/40 bg-white/20 flex items-center justify-center text-white text-4xl font-bold">
            {c.profilePic ? <img src={c.profilePic} alt="" className="w-full h-full object-cover" /> : (c.nickname || c.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="mt-2 text-white font-bold text-lg">{c.nickname || c.username}</div>
          <div className="text-white/80 text-xs">{c.isOnline ? 'online' : (c.lastSeen ? `last seen ${fmtDay(c.lastSeen)} ${fmtTime(c.lastSeen)}` : 'offline')}</div>
        </div>
        <div className="p-4 space-y-2 text-sm">
          <div><div className="text-[11px] font-bold uppercase text-slate-400">Username</div><div className="font-bold">{c.username} <span className="font-normal text-slate-400">({c.userCode})</span></div></div>
          {c.about && <div><div className="text-[11px] font-bold uppercase text-slate-400">About</div><div>{c.about}</div></div>}
          {c.nickname && <div><div className="text-[11px] font-bold uppercase text-slate-400">Nickname</div><div>{c.nickname}</div></div>}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <button onClick={onMessage} className="py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">💬 Message</button>
            <button onClick={onPin} className="py-2 rounded-lg border border-slate-300 dark:border-white/15 text-xs font-bold">{pinned ? '📌 Unpin' : '📌 Pin'}</button>
            <button onClick={onNickname} className="py-2 rounded-lg border border-slate-300 dark:border-white/15 text-xs font-bold">✏️ Nick</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Forward a message to one or more other contacts.
function ForwardModal({ message, contacts, onClose, onDone }) {
  const [sel, setSel] = useState(() => new Set())
  const [q, setQ] = useState('')
  const [sending, setSending] = useState(false)
  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const preview = message.body || (message.fileName ? `📎 ${message.fileName}` : (isImg(message) ? '📷 Photo' : 'Attachment'))
  const list = contacts.filter((c) => !q.trim() || `${nameOf(c)} ${c.userCode || ''}`.toLowerCase().includes(q.trim().toLowerCase()))
  const forward = async () => {
    if (!sel.size || sending) return
    setSending(true)
    try {
      for (const id of sel) {
        await sendMessage({ receiverId: id, body: message.body || null, fileData: message.fileData || null, fileName: message.fileName || null, fileType: message.fileType || null })
      }
      onDone([...sel])
    } catch { setSending(false) }
  }
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold flex items-center gap-2"><Forward size={18} /> Forward to…</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-lg font-bold">×</button>
        </div>
        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10">
          <div className="text-[11px] font-bold uppercase text-slate-400 mb-1">Message</div>
          <div className="text-sm text-slate-600 dark:text-slate-300 truncate">{preview}</div>
        </div>
        <div className="px-5 pt-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts…"
            className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-3 py-2 text-sm outline-none focus:border-blue-500" />
        </div>
        <div className="overflow-y-auto px-2 py-2 flex-1">
          {list.length === 0 ? <div className="px-3 py-8 text-center text-slate-400 text-sm">No contacts.</div>
            : list.map((c) => (
              <button key={c.userId} onClick={() => toggle(c.userId)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${sel.has(c.userId) ? 'bg-blue-50 dark:bg-blue-500/10' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}>
                <Avatar src={c.profilePic} name={c.username} size={36} />
                <div className="min-w-0 flex-1"><div className="font-bold text-sm truncate">{nameOf(c)}</div><div className="text-[11px] text-slate-400 truncate">{c.userCode}</div></div>
                <span className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center text-[11px] ${sel.has(c.userId) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-white/20'}`}>{sel.has(c.userId) ? '✓' : ''}</span>
              </button>
            ))}
        </div>
        <div className="flex justify-between items-center gap-2 px-5 py-3 border-t border-slate-200 dark:border-white/10">
          <span className="text-xs text-slate-400">{sel.size} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
            <button onClick={forward} disabled={!sel.size || sending} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">{sending ? 'Forwarding…' : 'Forward'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StarredModal({ stars, onClose, onUnstar }) {
  const all = Object.values(stars)
  // Group user-wise (by contact).
  const groups = {}
  for (const s of all) { const k = s.contactName || 'Unknown'; (groups[k] = groups[k] || []).push(s) }
  const keys = Object.keys(groups).sort()
  keys.forEach((k) => groups[k].sort((a, b) => (toDate(b.at)?.getTime() || 0) - (toDate(a.at)?.getTime() || 0)))
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold flex items-center gap-2 text-amber-500"><Star size={18} filled /> <span className="text-slate-800 dark:text-slate-100">Starred Messages</span> <span className="text-sm font-normal text-slate-400">({all.length})</span></h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-lg font-bold">×</button>
        </div>
        <div className="overflow-y-auto">
          {all.length === 0 ? <div className="px-5 py-10 text-center text-slate-400 text-sm">No starred messages yet.</div>
            : keys.map((k) => (
              <div key={k}>
                <div className="px-5 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 bg-slate-50 dark:bg-white/5">{k} <span className="text-slate-400">({groups[k].length})</span></div>
                {groups[k].map((s) => (
                  <div key={s.messageId} className="px-5 py-3 flex items-start gap-3 border-t border-slate-100 dark:border-white/5">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{s.mine ? 'You' : s.contactName} · {fmtDay(s.at)} {fmtTime(s.at)}</div>
                      <div className="text-sm break-words">{s.text}</div>
                    </div>
                    <button onClick={() => onUnstar(s.messageId)} title="Unstar" className="shrink-0 text-amber-500"><Star size={16} filled /></button>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

function ChatSettingsModal({ theme, wallpaper, bright, onApply, onBright, onClose }) {
  const picRef = useRef(null)
  const onPic = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => onApply('custom', r.result); r.readAsDataURL(f); e.target.value = '' }
  const swatchStyle = (t) => (t.bg.startsWith('linear') ? { backgroundImage: t.bg } : { background: t.bg })
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold">Chat Settings</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-lg font-bold">×</button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Applies to the chat screen only (this browser).</p>

        {/* Brightness */}
        <div className="mb-4">
          <div className="text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">Brightness</div>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
            {['light', 'medium', 'dark'].map((b) => (
              <button key={b} onClick={() => onBright(b)}
                className={`px-4 py-1.5 text-sm font-bold capitalize ${bright === b ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}>{b}</button>
            ))}
          </div>
        </div>

        <div className="text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1.5">Wallpaper</div>
        <div className="grid grid-cols-4 gap-3">
          {THEMES.map((t) => (
            <button key={t.key} onClick={() => onApply(t.key, null)} title={t.name} className="flex flex-col items-center gap-1">
              <span className={`w-full h-14 rounded-lg border-2 ${theme === t.key ? 'border-blue-500' : 'border-slate-200 dark:border-white/10'}`} style={swatchStyle(t)} />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{t.name}</span>
            </button>
          ))}
          {/* Custom photo tile */}
          <button onClick={() => picRef.current?.click()} title="Custom photo" className="flex flex-col items-center gap-1">
            <span className={`w-full h-14 rounded-lg border-2 flex items-center justify-center overflow-hidden ${theme === 'custom' ? 'border-blue-500' : 'border-dashed border-slate-300 dark:border-white/20'}`}
              style={theme === 'custom' && wallpaper ? { backgroundImage: `url(${wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
              {!(theme === 'custom' && wallpaper) && <span className="text-lg">📷</span>}
            </span>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">Photo</span>
          </button>
          <input ref={picRef} type="file" accept="image/*" onChange={onPic} className="hidden" />
        </div>

        <div className="flex justify-between items-center mt-5">
          <button onClick={() => onApply('default', null)} className="text-sm font-bold text-slate-500 dark:text-slate-400">Reset to default</button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold">Done</button>
        </div>
      </div>
    </div>
  )
}

function MsgMenu({ open, starred, onToggle, onReply, onForward, onCopy, onStar, onPin, onEdit, onDelete, left }) {
  return (
    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={onToggle} className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-300/50 dark:hover:bg-white/10"><Dots size={14} /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className={`absolute z-50 ${left ? 'left-0' : 'right-0'} mt-1 w-36 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#1e2235] shadow-xl py-1 text-sm`}>
            <button onClick={onReply} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5"><Reply size={14} /> Reply</button>
            <button onClick={onForward} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5"><Forward size={14} /> Forward</button>
            <button onClick={onCopy} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5"><Copy size={14} /> Copy</button>
            <button onClick={onStar} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5"><Star size={14} filled={starred} /> {starred ? 'Unstar' : 'Star'}</button>
            <button onClick={onPin} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5"><Pin size={14} /> Pin</button>
            {onEdit && <button onClick={onEdit} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-white/5"><Pencil size={14} /> Edit</button>}
            {onDelete && <button onClick={onDelete} className="w-full flex items-center gap-2 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash size={14} /> Delete</button>}
          </div>
        </>
      )}
    </div>
  )
}

function ProfileModal({ profile, onClose, onSaved }) {
  const [about, setAbout] = useState(profile.about || '')
  const [pic, setPic] = useState(profile.profilePic || null)
  const [saving, setSaving] = useState(false)
  const picRef = useRef(null)
  const onPic = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setPic(r.result); r.readAsDataURL(f); e.target.value = '' }
  const save = async () => { setSaving(true); try { await updateChatProfile({ about: about.trim() || null, profilePic: pic }); onSaved({ ...profile, about: about.trim(), profilePic: pic }) } finally { setSaving(false) } }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">My Profile</h3>
          <button onClick={onClose} title="Close" className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 text-lg font-bold">×</button>
        </div>
        <div className="flex flex-col items-center gap-3">
          <Avatar src={pic} name={profile.username} size={96} />
          <button onClick={() => picRef.current?.click()} className="text-sm font-bold text-blue-600 dark:text-blue-400">Change photo</button>
          {pic && <button onClick={() => setPic(null)} className="text-xs font-bold text-red-500">Remove photo</button>}
          <input ref={picRef} type="file" accept="image/*" onChange={onPic} className="hidden" />
        </div>
        <div className="mt-4"><label className="block text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1">Name</label>
          <div className="text-sm font-bold">{profile.username} <span className="text-xs font-normal text-slate-400">({profile.userCode})</span></div></div>
        <div className="mt-3"><label className="block text-[12px] font-bold text-slate-600 dark:text-slate-300 mb-1">About / Status</label>
          <input value={about} onChange={(e) => setAbout(e.target.value)} maxLength={200} placeholder="e.g. Available"
            className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-3 py-2 text-sm outline-none focus:border-blue-500" /></div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

function NickModal({ contact, onClose, onSaved }) {
  const [nick, setNick] = useState(contact.nickname || '')
  const [saving, setSaving] = useState(false)
  const save = async () => { setSaving(true); try { await setNickname(contact.userId, nick.trim() || null); onSaved() } finally { setSaving(false) } }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold">Nickname</h3>
          <button onClick={onClose} title="Close" className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 text-lg font-bold">×</button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">A private name for <b>{contact.username}</b> — only you see it.</p>
        <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={60} autoFocus placeholder={contact.username}
          className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] px-3 py-2 text-sm outline-none focus:border-blue-500" />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-sm font-bold text-slate-600 dark:text-slate-300">Cancel</button>
          <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

function StorageModal({ list, isAdmin, onClose, onClear, onPurge }) {
  const total = list.reduce((a, r) => a + (Number(r.bytes) || 0), 0)
  const totalMsgs = list.reduce((a, r) => a + (r.messages || 0), 0)
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold flex items-center gap-2"><BarChart size={18} /> Chat Storage</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 text-lg font-bold">×</button>
        </div>
        <div className="px-5 py-3 border-b border-slate-100 dark:border-white/10 text-sm font-bold">Total: {fmtBytes(total)} · {totalMsgs} messages</div>
        <div className="overflow-y-auto">
          {list.length === 0 ? <div className="px-5 py-10 text-center text-slate-400 text-sm">No chat data yet.</div>
            : list.map((r) => (
              <div key={r.userId} className="px-5 py-3 flex items-center gap-3 border-t border-slate-100 dark:border-white/5">
                <div className="flex-1 min-w-0"><div className="font-bold text-sm truncate">{r.username}</div><div className="text-[11px] text-slate-400">{r.messages} messages</div></div>
                <div className="font-bold text-sm text-blue-600 dark:text-blue-400 shrink-0">{fmtBytes(r.bytes)}</div>
                {/* Clear from my side only — available to every user */}
                <button onClick={() => onClear(r.userId)} title="Clear from my side only"
                  className="shrink-0 px-2 h-8 flex items-center rounded-lg text-[12px] font-bold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5">Clear</button>
                {/* Delete for everyone (frees storage) — Admin group only */}
                {isAdmin && (
                  <button onClick={() => onPurge(r.userId)} title="Delete for everyone (admin only)"
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash size={15} /></button>
                )}
              </div>
            ))}
        </div>
        <div className="px-5 py-3 border-t border-slate-100 dark:border-white/10 text-[11px] text-slate-400">
          <b>Clear</b> removes the chat from your side only. {isAdmin
            ? <>The <span className="text-red-500 font-bold">🗑 delete</span> removes it for both users and frees storage (admin only).</>
            : 'Only an Admin can delete a chat for everyone and free the stored space.'}
        </div>
      </div>
    </div>
  )
}
