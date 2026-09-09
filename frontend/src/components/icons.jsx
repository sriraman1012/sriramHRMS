// Small inline SVG icons (stroke = currentColor so they inherit text color).
const svg = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function Eye({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOff({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68" />
      <path d="M6.6 6.6A13.1 13.1 0 0 0 2 11s3.5 7 10 7a9 9 0 0 0 5.4-1.6" />
      <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

export function Pencil({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

export function Plus({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function Search({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function Logout({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function Funnel({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  )
}

export function Refresh({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  )
}

export function Calendar({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function ChevronLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function ChevronRight({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function Trash({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  )
}

export function Upload({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

export function ChevronDown({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function Menu({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

export function Save({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

export function Copy({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export function Download({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export function Clipboard({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...svg}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  )
}

export function Star({ size = 16, filled }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg} fill={filled ? 'currentColor' : 'none'}><polygon points="12 2 15.1 8.3 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 8.9 8.3 12 2" /></svg>)
}
export function Pin({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><line x1="12" y1="17" x2="12" y2="22" /><path d="M9 4h6l-1 6 3 3H7l3-3-1-6Z" /></svg>)
}
export function Mic({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><line x1="12" y1="18" x2="12" y2="22" /></svg>)
}
export function Reply({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" /></svg>)
}
export function Forward({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><polyline points="15 17 20 12 15 7" /><path d="M4 18v-2a4 4 0 0 1 4-4h12" /></svg>)
}
export function Smile({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9" y2="9" /><line x1="15" y1="9" x2="15" y2="9" /></svg>)
}
export function Dots({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" /></svg>)
}
export function Send({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>)
}
export function Paperclip({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M21.4 11.05 12.25 20.2a5 5 0 0 1-7.07-7.07l8.49-8.49a3 3 0 1 1 4.24 4.24l-8.49 8.49a1 1 0 0 1-1.41-1.41l7.78-7.78" /></svg>)
}

/* ---- Navigation / module icons ---- */
export function Chat({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M21 11.5a8.5 8.5 0 0 1-11.9 7.8L3 21l1.7-6.1A8.5 8.5 0 1 1 21 11.5Z" /></svg>)
}
export function Home({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /></svg>)
}
export function Shield({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" /></svg>)
}
export function Users({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="8" r="3" /><path d="M22 20v-2a4 4 0 0 0-3-3.85" /><path d="M16 5.13A4 4 0 0 1 16 12.9" /></svg>)
}
export function Key({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 8.3-8.3" /><path d="m16 5 3 3" /><path d="m14 7 2 2" /></svg>)
}
export function User({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></svg>)
}
export function Grid({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>)
}
export function Building({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><rect x="5" y="3" width="14" height="18" rx="1" /><line x1="9" y1="7" x2="9" y2="7" /><line x1="15" y1="7" x2="15" y2="7" /><line x1="9" y1="11" x2="9" y2="11" /><line x1="15" y1="11" x2="15" y2="11" /><path d="M10 21v-4h4v4" /></svg>)
}
export function Tag({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M20 12 12 20l-8-8V4h8l8 8Z" /><circle cx="8" cy="8" r="1.4" /></svg>)
}
export function Sun({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>)
}
export function MapPin({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></svg>)
}
export function CalendarDays({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><line x1="8" y1="14" x2="8" y2="14" /><line x1="12" y1="14" x2="12" y2="14" /><line x1="16" y1="14" x2="16" y2="14" /></svg>)
}
export function Umbrella({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M12 12v7a2 2 0 0 0 4 0" /><path d="M2 12a10 10 0 0 1 20 0Z" /><line x1="12" y1="3" x2="12" y2="4" /></svg>)
}
export function Wallet({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" /><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 13h3" /></svg>)
}
export function BarChart({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><line x1="6" y1="20" x2="6" y2="12" /><line x1="12" y1="20" x2="12" y2="6" /><line x1="18" y1="20" x2="18" y2="14" /></svg>)
}
export function PieChart({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M21.2 15.9A10 10 0 1 1 8.1 2.8" /><path d="M22 12A10 10 0 0 0 12 2v10Z" /></svg>)
}
export function FileText({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" /><polyline points="14 3 14 8 19 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></svg>)
}
export function Gear({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" /></svg>)
}
export function X({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>)
}
export function Check({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><polyline points="20 6 9 17 4 12" /></svg>)
}
export function Ban({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><circle cx="12" cy="12" r="9" /><line x1="5.6" y1="5.6" x2="18.4" y2="18.4" /></svg>)
}
export function Gift({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" /><path d="M12 8S10 3 7.5 4.5 9.5 8 12 8Zm0 0s2-5 4.5-3.5S14.5 8 12 8Z" /></svg>)
}
export function Bell({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" {...svg}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a1.9 1.9 0 0 1-3.4 0" /></svg>)
}
