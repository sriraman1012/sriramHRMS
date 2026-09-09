import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useRights } from '../context/RightsContext.jsx'
import {
  ChevronDown, ChevronLeft, ChevronRight, Menu, Logout,
  Home as HomeIcon, Shield, Users as UsersIcon, Key, User, Grid, Building, Tag, Sun, MapPin,
  CalendarDays, Clipboard, Umbrella, Wallet, BarChart, PieChart, FileText, Gear, Chat,
} from '../components/icons.jsx'
import Notepad from '../components/Notepad.jsx'
import DailyMotivation from '../components/DailyMotivation.jsx'
import SpecialDay from '../components/SpecialDay.jsx'
import ChatBell from '../components/ChatBell.jsx'
import BreakButton from '../components/BreakButton.jsx'
import PurpleButton from '../components/PurpleButton.jsx'
import HelpBot from '../components/HelpBot.jsx'
import WelcomeToast from '../components/WelcomeToast.jsx'
import HappyHourReminder from '../components/HappyHourReminder.jsx'
import UserGroups from './usermgmt/UserGroups.jsx'
import UserRights from './usermgmt/UserRights.jsx'
import Users from './usermgmt/Users.jsx'
import Employee from './masters/Employee.jsx'
import Department from './masters/Department.jsx'
import Designation from './masters/Designation.jsx'
import Holiday from './masters/Holiday.jsx'
import LeaveType from './masters/LeaveType.jsx'
import Office from './masters/Office.jsx'
import WeeklyOff from './masters/WeeklyOff.jsx'
import ImplChecklistMaster from './masters/ImplChecklistMaster.jsx'
import AttendanceEntry from './attendance/AttendanceEntry.jsx'
import LeaveRegister from './attendance/LeaveRegister.jsx'
import BalanceCarryForward from './attendance/BalanceCarryForward.jsx'
import HourlyPermission from './attendance/HourlyPermission.jsx'
import HappyHours from './attendance/HappyHours.jsx'
import TravelAdvance from './attendance/TravelAdvance.jsx'
import ImplementationChecklist from './implementation/ImplementationChecklist.jsx'
import EmployeeSummaryReport from './reports/EmployeeSummaryReport.jsx'
import AttendanceDetailReport from './reports/AttendanceDetailReport.jsx'
import LeaveReport from './reports/LeaveReport.jsx'
import PermissionReport from './reports/PermissionReport.jsx'
import OnsiteReport from './reports/OnsiteReport.jsx'
import HappyHoursReport from './reports/HappyHoursReport.jsx'
import ChatDeleteLogReport from './reports/ChatDeleteLogReport.jsx'
import TravelAllowanceReport from './reports/TravelAllowanceReport.jsx'
import Home from './Home.jsx'
import ChatMessages from './ChatMessages.jsx'
import Settings from './Settings.jsx'

// Grouped navigation tree.
const NAV = [
  { key: 'home', label: 'Home', icon: HomeIcon },
  {
    group: 'usermgmt', label: 'User Management', icon: Shield,
    children: [
      { key: 'groups', label: 'User Groups', icon: UsersIcon },
      { key: 'rights', label: 'User Rights', icon: Key },
      { key: 'users', label: 'Users', icon: User },
    ],
  },
  {
    group: 'masters', label: 'Masters', icon: Grid,
    children: [
      { key: 'employee', label: 'Employee', icon: User },
      { key: 'department', label: 'Department', icon: Building },
      { key: 'designation', label: 'Designation', icon: Tag },
      { key: 'holiday', label: 'Holiday', icon: CalendarDays },
      { key: 'leavetype', label: 'Leave Type', icon: Sun },
      { key: 'office', label: 'Office', icon: MapPin },
      { key: 'weekly-off', label: 'Weekly Off', icon: CalendarDays },
      { key: 'impl-master', label: 'Implementation Checklist', icon: Clipboard },
    ],
  },
  { key: 'chat', label: 'Chat Messages', icon: Chat },
  {
    group: 'attendance', label: 'Attendance', icon: CalendarDays,
    children: [
      { key: 'att-entry', label: 'Attendance Entry', icon: Clipboard },
      { key: 'leave-register', label: 'Leave Register', icon: Umbrella },
      { key: 'hourly-permission', label: 'Hourly Permission', icon: CalendarDays },
      { key: 'balance-cf', label: 'Balance Carry Forward', icon: Wallet },
      { key: 'travel-advance', label: 'Travel Allowance', icon: MapPin },
      { key: 'happy-hours', label: 'Happy Hours', icon: Sun },
    ],
  },
  { key: 'implementation', label: 'Implementation', icon: Clipboard },
  {
    group: 'reports', label: 'Reports', icon: BarChart,
    children: [
      { key: 'rpt-summary', label: 'Employee Summary', icon: PieChart },
      { key: 'rpt-detail', label: 'Attendance Detail', icon: FileText },
      { key: 'rpt-leave', label: 'Leave Report', icon: Umbrella },
      { key: 'rpt-permission', label: 'Permission Report', icon: CalendarDays },
      { key: 'rpt-onsite', label: 'Onsite Report', icon: MapPin },
      { key: 'rpt-happy-hours', label: 'Happy Hours Report', icon: Sun },
      { key: 'rpt-chat-delete', label: 'Chat Delete Log', icon: Chat },
      { key: 'rpt-travel-allowance', label: 'Travel Allowance Report', icon: MapPin },
    ],
  },
  { key: 'settings', label: 'Settings', icon: Gear },
]

const PAGES = {
  'att-entry': AttendanceEntry,
  'leave-register': LeaveRegister,
  'hourly-permission': HourlyPermission,
  'balance-cf': BalanceCarryForward,
  'happy-hours': HappyHours,
  'travel-advance': TravelAdvance,
  implementation: ImplementationChecklist,
  'rpt-summary': EmployeeSummaryReport,
  'rpt-detail': AttendanceDetailReport,
  'rpt-leave': LeaveReport,
  'rpt-permission': PermissionReport,
  'rpt-onsite': OnsiteReport,
  'rpt-happy-hours': HappyHoursReport,
  'rpt-chat-delete': ChatDeleteLogReport,
  'rpt-travel-allowance': TravelAllowanceReport,
  employee: Employee, department: Department, designation: Designation,
  holiday: Holiday, leavetype: LeaveType, office: Office, 'weekly-off': WeeklyOff,
  'impl-master': ImplChecklistMaster,
  groups: UserGroups, rights: UserRights, users: Users,
}

export default function Dashboard({ theme, toggleTheme, setThemeMode }) {
  const { auth, signOut } = useAuth()
  const { ready: rightsReady, can } = useRights()
  const [view, setView] = useState('home')
  const [history, setHistory] = useState([]) // previous views, for the Back button
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false) // sidebar drawer on phones/tablets
  const [chatExpand, setChatExpand] = useState(false)  // user re-expanded the sidebar while in Chat

  // Track viewport so the sidebar behaves as a rail on desktop but a full
  // drawer on mobile (where collapsing to icons-only would be unusable).
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false))
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Navigate to a view, remembering where we came from.
  const navigate = (key) => {
    setMobileOpen(false) // always close the mobile drawer after choosing a page
    // Auto-collapsing views (Chat, Attendance Entry) always open collapsed; navigating to a new
    // page clears the manual re-expand flag so the next auto-view visit starts collapsed again.
    setChatExpand(false)
    if (key === view) return
    setHistory((h) => [...h, view])
    setView(key)
  }
  const goBack = () => {
    setHistory((h) => {
      if (!h.length) return h
      setView(h[h.length - 1])
      return h.slice(0, -1)
    })
  }
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('att_sidebar') === 'collapsed')
  const [openGroups, setOpenGroups] = useState({}) // groups start collapsed; click to expand

  const toggleSidebar = () => {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('att_sidebar', next ? 'collapsed' : 'expanded')
      return next
    })
  }
  // Accordion: opening a group closes the others; clicking an open group closes it.
  const toggleGroup = (g) => setOpenGroups((o) => (o[g] ? {} : { [g]: true }))

  // "Rail" (icons-only) mode is a desktop-only affordance; on mobile the drawer
  // always shows full labels so it stays usable. Chat Messages and Attendance Entry
  // auto-collapse the sidebar for more room (until the user re-expands with the menu button).
  const inChat = view === 'chat'
  const autoRail = view === 'chat' || view === 'att-entry'
  const rail = (collapsed || (autoRail && !chatExpand)) && !isMobile

  // Only show nav items the user can View; groups with no visible child are hidden.
  const visibleNav = NAV.map((node) => {
    if (node.key) return can(node.key, 'view') ? node : null
    const children = node.children.filter((c) => can(c.key, 'view'))
    return children.length ? { ...node, children } : null
  }).filter(Boolean)

  // If the current page isn't permitted, drop to the first one that is.
  useEffect(() => {
    if (!rightsReady) return
    if (!can(view, 'view')) {
      const first = visibleNav[0]
      const firstKey = first?.key || first?.children?.[0]?.key
      if (firstKey) setView(firstKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightsReady, view])

  const itemBtn = (item, indent) => (
    <button
      key={item.key}
      onClick={() => { navigate(item.key); if (!indent) setOpenGroups({}) }} // clicking a top-level item collapses open sub-menus
      title={rail ? item.label : undefined}
      className={`menu-item w-full flex items-center gap-2.5 py-2 rounded-lg text-sm font-bold transition-colors ${
        rail ? 'justify-center px-0' : indent ? 'px-3 pl-9' : 'px-3'
      } ${
        view === item.key
          ? 'is-active bg-blue-600 text-white'
          : 'text-slate-300 hover:bg-white/10'
      }`}
    >
      <span className="shrink-0 flex items-center justify-center w-5">{item.icon && <item.icon size={17} />}</span>
      {!rail && <span className="truncate">{item.label}</span>}
    </button>
  )

  return (
    <div className="app-shell h-screen bg-slate-100 dark:bg-[#0d0f18] text-slate-900 dark:text-slate-100 flex overflow-hidden">
      {/* Backdrop behind the mobile drawer */}
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar: a static rail/column on desktop, a slide-in drawer on mobile */}
      <aside className={`app-sidebar ${rail ? 'w-16' : 'w-60'} shrink-0 h-screen bg-[#0f1420] text-slate-200 border-r border-white/10 flex flex-col
        fixed md:static inset-y-0 left-0 z-50 transition-transform md:transition-all duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        {/* Brand + collapse/close toggle */}
        <div className="h-14 px-3 flex items-center gap-2 border-b border-white/10">
          {!rail && (
            <div className="leading-tight flex-1 min-w-0">
              <div className="text-sm font-bold truncate text-white">Unipro</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400 truncate">
                Attendance System
              </div>
            </div>
          )}
          <button
            onClick={() => { if (isMobile) { setMobileOpen(false); return } if (autoRail) { setChatExpand((e) => !e); return } toggleSidebar() }}
            title={isMobile ? 'Close menu' : autoRail ? (rail ? 'Expand menu' : 'Collapse menu') : collapsed ? 'Expand menu' : 'Collapse menu'}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-white/15 text-slate-300 hover:bg-white/10"
          >
            <Menu />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {!rightsReady && <div className="px-3 py-2 text-xs text-slate-400">Loading menu…</div>}
          {visibleNav.map((node) => {
            // Standalone item (Home)
            if (node.key) return itemBtn(node, false)

            // Group
            const isOpen = openGroups[node.group]
            const hasActive = node.children.some((c) => c.key === view)

            if (rail) {
              // Rail mode: show child icons directly, with a subtle divider between groups.
              return (
                <div key={node.group} className="pt-1 mt-1 border-t border-white/5 first:border-0 first:mt-0 first:pt-0">
                  {node.children.map((c) => itemBtn(c, false))}
                </div>
              )
            }

            return (
              <div key={node.group}>
                <button
                  onClick={() => toggleGroup(node.group)}
                  className={`menu-item w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    hasActive ? 'text-blue-400' : 'text-slate-300'
                  } hover:bg-white/10`}
                >
                  <span className="shrink-0 flex items-center justify-center w-5">{node.icon && <node.icon size={17} />}</span>
                  <span className="flex-1 text-left truncate">{node.label}</span>
                  <span className="text-slate-400">{isOpen ? <ChevronDown /> : <ChevronRight />}</span>
                </button>
                {isOpen && <div className="mt-1 space-y-1">{node.children.map((c) => itemBtn(c, true))}</div>}
              </div>
            )
          })}
        </nav>

        {/* Today's special day (bottom of sidebar) */}
        <div className="shrink-0 border-t border-white/10 pt-1">
          <SpecialDay collapsed={rail} dark />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="relative z-30 h-14 shrink-0 flex items-center justify-between px-3 sm:px-6 bg-[#0f1420] text-slate-200 border-b border-white/10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile hamburger opens the sidebar drawer */}
            <button
              onClick={() => setMobileOpen(true)}
              title="Menu"
              className="md:hidden w-9 h-9 shrink-0 flex items-center justify-center rounded-lg border border-white/15 text-slate-300 hover:bg-white/10"
            >
              <Menu />
            </button>
            {history.length > 0 && (
              <button onClick={goBack} title="Back" className="sparkle-btn">
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="text-sm font-bold text-slate-400 truncate hidden sm:block">
              Unipro Attendance Management System
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Attendance Entry quick shortcut — moves up to the top bar (left of Break) when a module other than Home is open */}
            {view !== 'home' && can('att-entry', 'view') && (
              <span className="hidden sm:inline-block shrink-0">
                <PurpleButton className="pbtn-sm" label="Attendance" onClick={() => navigate('att-entry')} title="Go to Attendance Entry" />
              </span>
            )}
            <BreakButton className="hidden sm:inline-flex" />
            {/* Neumorphic dark-mode toggle */}
            <label className="neu-toggle" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} aria-label="Toggle dark mode" />
              <span className="button" />
              <span className="label">
                {theme === 'dark'
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>}
              </span>
            </label>
            <ChatBell onOpen={() => { if (view === 'chat') { history.length ? goBack() : navigate('home') } else navigate('chat') }} />
            <div className="hidden sm:block"><DailyMotivation /></div>
            <div className="hidden sm:block"><Notepad /></div>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                title="View your role"
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[13px] text-slate-200 hover:bg-white/15"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                <span className="max-w-[90px] sm:max-w-none truncate">{auth.displayName || auth.username}</span>
                <ChevronDown size={14} />
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#1e2235] shadow-xl z-50 p-4">
                    <div className="text-sm font-bold">{auth.displayName || auth.username}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">@{auth.username}</div>
                    <div className="mt-3 text-[11px] uppercase tracking-wide text-slate-400">Role</div>
                    <div className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {auth.role || '—'}
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={signOut} title="Sign Out" className="sparkle-btn">
              <Logout size={15} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto overflow-x-hidden ${view === 'chat' ? '' : 'p-3 sm:p-4 lg:p-6'}`}>
          {rightsReady && !can(view, 'view') ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center gap-2 text-slate-500 dark:text-slate-400">
              <div className="text-5xl">🔒</div>
              <div className="font-bold text-lg">No access</div>
              <div className="text-sm">You don't have permission to view this page. Contact an administrator.</div>
            </div>
          ) : view === 'home' ? <Home onNavigate={navigate} />
            : view === 'chat' ? <ChatMessages />
            : view === 'settings' ? <Settings theme={theme} toggleTheme={toggleTheme} setThemeMode={setThemeMode} />
            : (() => {
              const Page = PAGES[view]
              return Page ? <Page /> : <Home />
            })()}
        </main>
      </div>

      {/* Floating help assistant — only on the Home dashboard */}
      {view === 'home' && <HelpBot />}
      <WelcomeToast />
      <HappyHourReminder />
    </div>
  )
}
