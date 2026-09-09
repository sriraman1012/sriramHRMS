import { useState } from 'react'
import { FONTS, getSavedFont, saveFont } from '../fonts.js'
import { getAnim, saveAnim, getStyleMode, saveStyleMode, getCritters, saveCritters, getEagles, saveEagles, getAutoDark, saveAutoDark, isNightNow, getCardDepth, saveCardDepth, getBoxAnim, saveBoxAnim, getChatMaxMb, saveChatMaxMb, getCardCorner, saveCardCorner, getInputStyle, saveInputStyle, getToggleStyle, saveToggleStyle, getLoginStyle, saveLoginStyle, getSidebarGlow, saveSidebarGlow, getColorMode, getEditStyle, saveEditStyle } from '../prefs.js'
import Toggle from '../components/Toggle.jsx'
import EditButton from '../components/EditButton.jsx'
import { downloadManual } from '../userManual.js'
import { PRESETS as ACCENTS, getAccent, saveAccent } from '../accent.js'

// Small reusable pieces
function Card({ title, desc, children }) {
  return (
    <div className="break-inside-avoid mb-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161925] p-3.5">
      <div className="font-bold text-[13px]">{title}</div>
      {desc && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 mb-2.5">{desc}</p>}
      {children}
    </div>
  )
}
function Seg({ options, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
      {options.map((o, i) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs font-bold ${i ? 'border-l border-slate-200 dark:border-white/10' : ''} ${value === o.value ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// One row inside the combined Preferences box: label/hint on the left, control on the right.
function PrefRow({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <div className="text-[13px] font-bold">{label}</div>
        {hint && <div className="text-[10px] text-slate-500 dark:text-slate-400">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function Settings({ theme, toggleTheme, setThemeMode }) {
  const [selected, setSelected] = useState(getSavedFont())
  const [anim, setAnim] = useState(getAnim())
  const [styleMode, setStyleMode] = useState(getStyleMode())
  const [critters, setCritters] = useState(getCritters())
  const [eagles, setEagles] = useState(getEagles())
  const [autoDark, setAutoDark] = useState(getAutoDark())
  const [cardDepth, setCardDepth] = useState(getCardDepth())
  const [cardCorner, setCardCorner] = useState(getCardCorner())
  const [boxAnim, setBoxAnim] = useState(getBoxAnim())
  const [chatMb, setChatMb] = useState(getChatMaxMb())
  const [chatMbMsg, setChatMbMsg] = useState('')
  const [accent, setAccent] = useState(getAccent())
  const [inputStyle, setInputStyle] = useState(getInputStyle())
  const [toggleStyle, setToggleStyle] = useState(getToggleStyle())
  const [loginStyle, setLoginStyle] = useState(getLoginStyle())
  const [sidebarGlow, setSidebarGlow] = useState(getSidebarGlow())
  const [demoToggle, setDemoToggle] = useState(true)
  const [colorMode, setColorMode] = useState(getColorMode())
  const [editStyle, setEditStyle] = useState(getEditStyle())
  const pickAccent = (hex) => { setAccent(hex); saveAccent(hex) }
  const pickFont = (v) => { setSelected(v); saveFont(v) }
  const setTheme = (t) => { if (t !== theme) toggleTheme() }
  const pickMode = (m) => { setColorMode(m); setThemeMode ? setThemeMode(m) : setTheme(m) }
  const onOff = [{ value: true, label: 'On' }, { value: false, label: 'Off' }]

  return (
    <div className="w-full">
      <h1 className="text-lg font-bold mb-3">Settings</h1>

      {/* Two-column masonry — everything on one page */}
      <div className="columns-1 lg:columns-2 gap-3">
        <Card title="Application Font" desc="Font for this browser. Click a box to apply.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {FONTS.map((f) => (
              <button key={f.value} onClick={() => pickFont(f.value)} style={{ fontFamily: f.stack }}
                className={`px-2 py-1.5 rounded-lg border text-xs text-center truncate ${selected === f.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 font-bold text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                {f.label.replace(' (default)', '')}
              </button>
            ))}
          </div>
        </Card>

        <Card title="Preferences" desc="Appearance & interface options.">
          <div className="divide-y divide-slate-100 dark:divide-white/5 -mt-1">
            <PrefRow label="Colour" hint="Light · Dark · Use my Windows (system) mode">
              <Seg value={colorMode} onChange={pickMode}
                options={[{ value: 'light', label: '☀ Light' }, { value: 'dark', label: '☾ Dark' }, { value: 'system', label: '🖥 System' }]} />
            </PrefRow>
            <PrefRow label="Auto Dark (Evening)" hint="Dark at 6 PM → Light at 6 AM">
              <Seg value={autoDark} onChange={(v) => { setAutoDark(v); saveAutoDark(v); setTheme(v ? (isNightNow() ? 'dark' : 'light') : 'light') }} options={onOff} />
            </PrefRow>
            <PrefRow label="Animations" hint="Icon & card animations">
              <Seg value={anim} onChange={(v) => { setAnim(v); saveAnim(v) }} options={onOff} />
            </PrefRow>
            <PrefRow label="Dashboard Entrance" hint="Boxes fly into place on open">
              <Seg value={boxAnim} onChange={(v) => { setBoxAnim(v); saveBoxAnim(v) }} options={onOff} />
            </PrefRow>
            <PrefRow label="Notification Critters" hint="Blossoms & animals in the 🔔 popup">
              <Seg value={critters} onChange={(v) => { setCritters(v); saveCritters(v) }} options={onOff} />
            </PrefRow>
            <PrefRow label="Login Page Eagles" hint="Flying eagles on the login page">
              <Seg value={eagles} onChange={(v) => { setEagles(v); saveEagles(v) }} options={onOff} />
            </PrefRow>
            <PrefRow label="User Manual" hint="Full project guide — Save as PDF">
              <button onClick={downloadManual} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">⬇ Download</button>
            </PrefRow>
          </div>
        </Card>

        <Card title="Dashboard Card Depth" desc="3D depth of the dashboard boxes (accent thickness + shadow) and corner shape. Live preview →">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 w-12">Depth</span>
                <Seg value={cardDepth} onChange={(v) => { setCardDepth(v); saveCardDepth(v) }}
                  options={[{ value: 'flat', label: 'Flat' }, { value: 'light', label: 'Light' }, { value: 'medium', label: 'Medium' }, { value: 'deep', label: 'Deep' }]} />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 w-12">Corners</span>
                <Seg value={cardCorner} onChange={(v) => { setCardCorner(v); saveCardCorner(v) }}
                  options={[{ value: 'sharp', label: '▢ Sharp' }, { value: 'curved', label: '▢ Curved' }]} />
              </div>
            </div>
            {/* Live preview — reflects depth + corners via the same CSS variables */}
            <div className="relative overflow-hidden rounded-[var(--card-radius)] border-2 border-black bg-[#161c2b] p-3 w-28 shadow-[var(--card-shadow)]">
              <span className="absolute inset-0 pointer-events-none rounded-[var(--card-radius)]"
                style={{ borderStyle: 'solid', borderColor: 'transparent', borderTopColor: '#10b981', borderRightColor: '#10b981', borderTopWidth: 'var(--card-accent)', borderRightWidth: 'var(--card-accent)' }} />
              <div className="text-xl font-bold text-slate-100">5</div>
              <div className="text-[9px] uppercase tracking-wide text-slate-400">Preview</div>
            </div>
          </div>
        </Card>

        <Card title="Display Style" desc="Default · Modern 3D · Glass · Crystal. Applies app-wide.">
          <Seg value={styleMode} onChange={(v) => { setStyleMode(v); saveStyleMode(v) }}
            options={[{ value: 'default', label: '▢ Default' }, { value: 'modern', label: '◈ Modern' }, { value: 'glass', label: '🪟 Glass' }, { value: 'crystal', label: '💎 Crystal' }]} />
        </Card>

        <Card title="Input Field Style" desc="Default inputs, or a dark neumorphic look with a yellow/orange glow on focus. Applies app-wide. Click the sample below to preview the focus glow.">
          <div className="space-y-2.5">
            <Seg value={inputStyle} onChange={(v) => { setInputStyle(v); saveInputStyle(v) }}
              options={[{ value: 'default', label: '▢ Default' }, { value: 'neu', label: '✦ Neumorphic' }]} />
            <input type="text" placeholder="Sample input — click to focus"
              className="w-full rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-sm px-3 py-2 outline-none focus:border-blue-500" />
          </div>
        </Card>

        <Card title="Login Page Style" desc="The sign-in screen look. Default is the standard card; Neumorphic is the dark form with icon fields. Takes effect next time you're on the login page (e.g. after Sign Out).">
          <Seg value={loginStyle} onChange={(v) => { setLoginStyle(v); saveLoginStyle(v) }}
            options={[{ value: 'default', label: '▢ Default' }, { value: 'neu', label: '✦ Neumorphic' }]} />
        </Card>

        <Card title="Sidebar Glow" desc="Show a green glow light on the outer edge of the sidebar when you move the mouse over it. Default is the plain sidebar. Hover the preview →">
          <div className="flex items-center gap-4 flex-wrap">
            <Seg value={sidebarGlow} onChange={(v) => { setSidebarGlow(v); saveSidebarGlow(v) }}
              options={[{ value: 'off', label: '▢ Off (default)' }, { value: 'on', label: '✨ Glow' }]} />
            <div className="flex flex-col items-center gap-1">
              <div className={`glow-demo ${sidebarGlow === 'on' ? 'glow-demo--on' : ''} w-14 h-24 rounded-lg bg-[#0f1420] border border-white/10 p-2 flex flex-col gap-1.5`}>
                <div className="h-2 rounded bg-blue-600" />
                <div className="h-1.5 rounded bg-white/20" />
                <div className="h-1.5 rounded bg-white/20" />
                <div className="h-1.5 rounded bg-white/20 w-3/4" />
                <div className="h-1.5 rounded bg-white/20 w-2/3" />
              </div>
              <span className="text-[10px] text-slate-400">preview</span>
            </div>
          </div>
        </Card>

        <Card title="Edit Button Style" desc="Default is a small pencil icon; Purple is an animated slide-pencil button. Applies to Edit buttons app-wide. Sample →">
          <div className="flex items-center gap-4 flex-wrap">
            <Seg value={editStyle} onChange={(v) => { setEditStyle(v); saveEditStyle(v) }}
              options={[{ value: 'default', label: '✏ Default' }, { value: 'purple', label: '✦ Purple' }]} />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Sample</span>
              <EditButton onClick={() => {}} />
            </div>
          </div>
        </Card>

        <Card title="Toggle Switch Style" desc="Default dark switch, or a green switch with check/cross icons. Applies to every on/off switch app-wide. Try the sample →">
          <div className="flex items-center gap-4 flex-wrap">
            <Seg value={toggleStyle} onChange={(v) => { setToggleStyle(v); saveToggleStyle(v) }}
              options={[{ value: 'default', label: '▢ Default' }, { value: 'green', label: '✔ Green' }]} />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Sample</span>
              <Toggle checked={demoToggle} onChange={setDemoToggle} />
            </div>
          </div>
        </Card>

        <Card title="Accent Colour" desc="The highlight colour used app-wide (buttons, links, selections). Pick a preset or choose your own.">
          <div className="flex flex-wrap items-center gap-2">
            {ACCENTS.map((p) => (
              <button key={p.key} onClick={() => pickAccent(p.hex)} title={p.label} style={{ background: p.hex }}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${accent.toLowerCase() === p.hex.toLowerCase() ? 'border-slate-800 dark:border-white ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-[#161925]' : 'border-white/40'}`} />
            ))}
            <label className="ml-1 inline-flex items-center gap-1.5 cursor-pointer" title="Choose your own colour">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Custom</span>
              <input type="color" value={accent} onChange={(e) => pickAccent(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border border-slate-300 dark:border-white/15 bg-transparent p-0.5" />
            </label>
          </div>
        </Card>

        <Card title="Chat File Size" desc="Maximum size for a single chat attachment.">
          <div className="flex items-center gap-2">
            <input type="number" min="1" max="500" value={chatMb} onChange={(e) => setChatMb(e.target.value)}
              className="w-20 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-[#1e2235] text-sm px-3 py-1.5 outline-none focus:border-blue-500" />
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">MB</span>
            <button onClick={() => { saveChatMaxMb(chatMb); setChatMb(getChatMaxMb()); setChatMbMsg('Saved.'); setTimeout(() => setChatMbMsg(''), 2000) }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">Save</button>
            {chatMbMsg && <span className="text-green-600 dark:text-green-400 text-xs font-bold">{chatMbMsg}</span>}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Default 25 MB. Increase here if you need to share larger files.</p>
        </Card>

      </div>
    </div>
  )
}
