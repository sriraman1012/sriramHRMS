// UI preferences stored in this browser (localStorage).

const ANIM_KEY = 'att_anim'
const STYLE_KEY = 'att_style'
const CRITTER_KEY = 'att_critters'
const EAGLE_KEY = 'att_eagles'
const AUTODARK_KEY = 'att_autodark'
const CARDDEPTH_KEY = 'att_carddepth'
const CARDCORNER_KEY = 'att_cardcorner'
const BOXANIM_KEY = 'att_boxanim'
const CHATMAXMB_KEY = 'att_chat_maxmb'

// Animations default ON; only an explicit 'off' disables them.
export function getAnim() {
  return localStorage.getItem(ANIM_KEY) !== 'off'
}

export function applyAnim(on) {
  document.documentElement.dataset.anim = on ? 'on' : 'off'
}

export function saveAnim(on) {
  localStorage.setItem(ANIM_KEY, on ? 'on' : 'off')
  applyAnim(on)
}

// Visual style mode: 'default' (flat/soft), 'modern' (3D), 'glass' (glassmorphism), 'crystal' (clean frosted glass).
const STYLE_MODES = ['default', 'modern', 'glass', 'crystal']
const normStyle = (m) => (STYLE_MODES.includes(m) ? m : 'default')

export function getStyleMode() {
  return normStyle(localStorage.getItem(STYLE_KEY))
}

export function applyStyleMode(mode) {
  document.documentElement.dataset.style = normStyle(mode)
}

export function saveStyleMode(mode) {
  localStorage.setItem(STYLE_KEY, normStyle(mode))
  applyStyleMode(mode)
}

// Notification critters + blossoms. Default OFF; only explicit 'on' enables.
export function getCritters() {
  return localStorage.getItem(CRITTER_KEY) === 'on'
}

export function saveCritters(on) {
  localStorage.setItem(CRITTER_KEY, on ? 'on' : 'off')
}

// Login-page flying eagles. Default OFF; only explicit 'on' enables.
export function getEagles() {
  return localStorage.getItem(EAGLE_KEY) === 'on'
}

export function applyEagles(on) {
  document.documentElement.dataset.eagles = on ? 'on' : 'off'
}

export function saveEagles(on) {
  localStorage.setItem(EAGLE_KEY, on ? 'on' : 'off')
  applyEagles(on)
}

// Colour mode: 'light' | 'dark' | 'system' (follow the OS / "Use my Windows mode").
const COLORMODE_KEY = 'att_colormode'
export function getColorMode() {
  const v = localStorage.getItem(COLORMODE_KEY)
  if (v === 'light' || v === 'dark' || v === 'system') return v
  return localStorage.getItem('att_theme') === 'dark' ? 'dark' : 'light' // fall back to the old saved theme
}
export function saveColorMode(v) {
  localStorage.setItem(COLORMODE_KEY, (v === 'dark' || v === 'system') ? v : 'light')
}
export function systemPrefersDark() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Auto dark mode in the evening. Default ON. When enabled the theme switches to
// dark at 18:00 (6 PM) and back to light at 06:00 (6 AM).
export function getAutoDark() {
  return localStorage.getItem(AUTODARK_KEY) !== 'off'
}

export function saveAutoDark(on) {
  localStorage.setItem(AUTODARK_KEY, on ? 'on' : 'off')
}

// True when the current local time is in the "evening/night" window (6 PM–6 AM).
export function isNightNow() {
  const h = new Date().getHours()
  return h >= 18 || h < 6
}

// Dashboard card 3D depth: 'flat' | 'light' | 'medium' | 'deep'. Default 'light'.
const DEPTHS = ['flat', 'light', 'medium', 'deep']
export function getCardDepth() {
  const v = localStorage.getItem(CARDDEPTH_KEY)
  return DEPTHS.includes(v) ? v : 'light'
}
export function applyCardDepth(v) {
  document.documentElement.dataset.carddepth = DEPTHS.includes(v) ? v : 'light'
}
export function saveCardDepth(v) {
  localStorage.setItem(CARDDEPTH_KEY, DEPTHS.includes(v) ? v : 'light')
  applyCardDepth(v)
}

// Dashboard card corners: 'sharp' (square) or 'curved'. Default 'curved'.
export function getCardCorner() {
  return localStorage.getItem(CARDCORNER_KEY) === 'sharp' ? 'sharp' : 'curved'
}
export function applyCardCorner(v) {
  document.documentElement.style.setProperty('--card-radius', v === 'curved' ? '0.9rem' : '0px')
}
export function saveCardCorner(v) {
  localStorage.setItem(CARDCORNER_KEY, v === 'curved' ? 'curved' : 'sharp')
  applyCardCorner(v)
}

// Dashboard boxes "jumble into place" entrance animation. Default ON.
export function getBoxAnim() {
  return localStorage.getItem(BOXANIM_KEY) !== 'off'
}
export function applyBoxAnim(on) {
  document.documentElement.dataset.boxanim = on ? 'on' : 'off'
}
export function saveBoxAnim(on) {
  localStorage.setItem(BOXANIM_KEY, on ? 'on' : 'off')
  applyBoxAnim(on)
}

// Input field style: 'default' (the app's normal inputs) or 'neu' (dark neumorphic with a
// yellow/orange focus glow). Default 'default'; the neu look is opt-in from Settings.
const INPUTSTYLE_KEY = 'att_inputstyle'
export function getInputStyle() {
  return localStorage.getItem(INPUTSTYLE_KEY) === 'neu' ? 'neu' : 'default'
}
export function applyInputStyle(v) {
  document.documentElement.dataset.inputstyle = v === 'neu' ? 'neu' : 'default'
}
export function saveInputStyle(v) {
  localStorage.setItem(INPUTSTYLE_KEY, v === 'neu' ? 'neu' : 'default')
  applyInputStyle(v)
}

// Toggle switch style: 'default' (dark neumorphic switch) or 'green' (Galahhad green switch
// with check/cross icons). Default 'default'; opt-in from Settings. A 'togglestyle' window event
// is fired on change so every <Toggle> on screen re-renders live.
const TOGGLESTYLE_KEY = 'att_togglestyle'
export function getToggleStyle() {
  // Green is the default look; only an explicit 'default' choice uses the dark neumorphic switch.
  return localStorage.getItem(TOGGLESTYLE_KEY) === 'default' ? 'default' : 'green'
}
export function applyToggleStyle(v) {
  document.documentElement.dataset.toggle = v === 'green' ? 'green' : 'default'
}
export function saveToggleStyle(v) {
  localStorage.setItem(TOGGLESTYLE_KEY, v === 'green' ? 'green' : 'default')
  applyToggleStyle(v)
  window.dispatchEvent(new Event('togglestyle'))
}

// Login page style: 'default' (the original pink/blue-accent card) or 'neu' (dark neumorphic
// form with icon fields). Default 'default'. Read by the Login page when it renders.
const LOGINSTYLE_KEY = 'att_loginstyle'
export function getLoginStyle() {
  return localStorage.getItem(LOGINSTYLE_KEY) === 'neu' ? 'neu' : 'default'
}
export function saveLoginStyle(v) {
  localStorage.setItem(LOGINSTYLE_KEY, v === 'neu' ? 'neu' : 'default')
}

// Sidebar hover glow (Uiverse by Tiagoadag): green→blue outer glow when the mouse is over the
// sidebar. Default 'off' (the plain sidebar); opt-in from Settings.
const SIDEBARGLOW_KEY = 'att_sidebarglow'
export function getSidebarGlow() {
  return localStorage.getItem(SIDEBARGLOW_KEY) === 'on' ? 'on' : 'off'
}
export function applySidebarGlow(v) {
  document.documentElement.dataset.sidebarglow = v === 'on' ? 'on' : 'off'
}
export function saveSidebarGlow(v) {
  localStorage.setItem(SIDEBARGLOW_KEY, v === 'on' ? 'on' : 'off')
  applySidebarGlow(v)
}

// Edit button style: 'default' (small pencil icon) or 'purple' (Uiverse slide-pencil button).
// Default 'default'; opt-in from Settings. Fires an 'editstyle' event so every <EditButton> updates live.
const EDITSTYLE_KEY = 'att_editstyle'
export function getEditStyle() {
  // Purple is the default look; only an explicit 'default' choice uses the plain pencil icon.
  return localStorage.getItem(EDITSTYLE_KEY) === 'default' ? 'default' : 'purple'
}
export function saveEditStyle(v) {
  localStorage.setItem(EDITSTYLE_KEY, v === 'purple' ? 'purple' : 'default')
  window.dispatchEvent(new Event('editstyle'))
}

// Max chat attachment size in MB. Default 25.
export function getChatMaxMb() {
  const n = parseInt(localStorage.getItem(CHATMAXMB_KEY), 10)
  return Number.isFinite(n) && n > 0 ? n : 25
}
export function saveChatMaxMb(mb) {
  const n = parseInt(mb, 10)
  localStorage.setItem(CHATMAXMB_KEY, String(Number.isFinite(n) && n > 0 ? n : 25))
}
