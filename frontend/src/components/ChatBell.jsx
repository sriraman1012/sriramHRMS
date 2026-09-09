import { useEffect, useState } from 'react'
import { getContacts } from '../api/chat.js'
import { Chat } from './icons.jsx'

// Round chat icon in the header with a pending (unread) message count.
export default function ChatBell({ onOpen }) {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let alive = true
    const poll = () => getContacts()
      .then((cs) => { if (alive) setUnread((cs || []).reduce((a, c) => a + (c.unread || 0), 0)) })
      .catch(() => {})
    poll()
    const id = setInterval(poll, 10000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return (
    <button
      onClick={onOpen}
      title={unread ? `${unread} unread message${unread === 1 ? '' : 's'}` : 'Chat Messages'}
      className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/15 text-slate-200 hover:bg-white/15"
    >
      <Chat size={17} />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center border border-white dark:border-[#161925]">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  )
}
