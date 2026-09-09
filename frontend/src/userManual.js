// Full project user manual — downloadable from Settings and referenced by the help bot.

export const MANUAL_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unipro Attendance — User Manual</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1e293b; max-width: 900px; margin: 0 auto; padding: 32px 24px 64px; line-height: 1.55; }
  h1 { font-size: 30px; margin: 0 0 4px; }
  .sub { color: #64748b; margin: 0 0 24px; }
  h2 { font-size: 20px; margin: 28px 0 8px; border-bottom: 2px solid #2563eb; padding-bottom: 4px; color: #1d4ed8; }
  h3 { font-size: 15px; margin: 16px 0 4px; color: #0f172a; }
  p, li { font-size: 14px; }
  ul { margin: 4px 0 10px; padding-left: 20px; }
  code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
  .toc { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin: 12px 0 24px; }
  .toc a { color: #2563eb; text-decoration: none; font-weight: 600; font-size: 13px; }
  .tip { background: #eff6ff; border-left: 4px solid #2563eb; padding: 8px 12px; border-radius: 6px; margin: 8px 0; font-size: 13px; }
  .nav { display: inline-block; background: #fef9c3; border: 1px solid #fde047; color: #854d0e; font-weight: 700; font-size: 12px; padding: 3px 9px; border-radius: 6px; margin: 4px 0; }
  .foot { margin-top: 40px; color: #94a3b8; font-size: 12px; text-align: center; }
  @media print { body { padding: 0; } h2 { break-after: avoid; } }
</style></head><body>

<h1>Unipro Attendance Management System</h1>
<p class="sub">Complete User Manual &nbsp;·&nbsp; Print this page to PDF from your browser (Ctrl/Cmd&nbsp;+&nbsp;P) if you need a PDF copy.</p>

<div class="toc"><b>Contents</b><br>
<a href="#login">1. Login</a> · <a href="#dash">2. Dashboard</a> · <a href="#um">3. User Management</a> ·
<a href="#masters">4. Masters</a> · <a href="#att">5. Attendance</a> · <a href="#reports">6. Reports</a> ·
<a href="#chat">7. Chat Messages</a> · <a href="#settings">8. Settings</a> · <a href="#break">9. Break Zone (Relax &amp; Games)</a> · <a href="#bot">10. Help Bot</a></div>
<p class="tip">🧭 <b>How to read the navigation:</b> each feature below shows its path from the app, e.g. <span class="nav">Home → Top bar → BREAK ▶</span> means: start at Home, look at the Top bar, click the BREAK button.</p>

<h2 id="login">1. Login</h2>
<ul>
<li>Open the app and sign in with your <b>User ID</b> and <b>Password</b>. Use the eye icon to reveal the password.</li>
<li>Only active users can sign in. Contact an administrator if your account is inactive.</li>
</ul>

<h2 id="dash">2. Dashboard (Home)</h2>
<ul>
<li><b>Filters:</b> pick a Month, Year, Date, or Department (compact icon pills). Use <b>◀ / 📅 / ▶</b> to move between months, or the reset button. A specific <b>Date</b> shows that day's snapshot.</li>
<li><b>Stat cards:</b> Present, <b>Absent / Permission</b> (shows <code>absent / permission</code>, e.g. 1/1 — click it to view the two lists), Total Employees, Working / Weekends, and Holidays (click to open the Holiday master).</li>
<li><b>Pie charts:</b> Department-wise Present, Leave, and Permission for the selected day.</li>
<li><b>Present vs Absent trend</b> line chart — <span class="nav">Home → "Present vs Absent" card</span>. Use the <b>View by</b> dropdown (Date / Month / Year) with the Month / Year pickers; hover any point for the exact Present / Absent counts.</li>
<li><b>Dark / light mode</b> — <span class="nav">Top bar → round toggle button</span> (or Settings → Appearance).</li>
<li><b>Quick "Attendance" button</b> — <span class="nav">Dashboard → start of the filter row</span>. A one-click purple shortcut to Attendance Entry. When you open any other module it moves up to the <b>Top bar</b> (left of BREAK), so it's reachable from anywhere.</li>
<li><b>Slide-show &amp; hover glow</b> — the boxes <b>slide in</b> from different sides on each load; <b>hover</b> a box for a rotating colour border (its thickness follows the <b>Card Depth</b> setting). Turn the slide-in on/off under <b>Settings → Animations</b>.</li>
<li><b>Calendar &amp; Events</b> widget (bottom-left): shows today's special day / next upcoming event; open it for a monthly calendar where you can add personal <b>notes / events</b> per date.</li>
</ul>

<h2 id="um">3. User Management</h2>
<h3>User Groups</h3>
<ul><li>Create groups (e.g. Admin, HR). Toggle <b>Active/Inactive</b> in the list. Delete is blocked if users are mapped to the group.</li></ul>
<h3>User Rights</h3>
<ul><li>Per group, toggle <b>View / Add / Edit / Delete / Export</b> for each module, or <b>Full Control</b>. Click <b>Save Rights</b>.</li></ul>
<h3>Users</h3>
<ul><li>Add a user — the code is auto-generated (e.g. UNI0001). Set username, password + confirm, group, email, mobile, address, designation. Status uses an ON/OFF toggle. You cannot delete the account you are logged in with.</li></ul>

<h2 id="masters">4. Masters</h2>
<ul>
<li><b>Employee, Department, Designation, Holiday, Leave Type, Office.</b></li>
<li>Click <b>Add</b> to open a popup form. Codes are entered manually. Edit / Delete from the action icons.</li>
<li><b>Status</b> is an ON/OFF toggle (read-only in the list — change it inside the Edit popup).</li>
<li><b>Delete</b> is allowed only when the record is not mapped; otherwise a message like "already mapped to employees" appears.</li>
<li>Every column has a <b>🔍 search</b>; there is also a global search, plus pagination.</li>
</ul>

<h2 id="att">5. Attendance</h2>
<h3>Attendance Entry</h3>
<ul>
<li>Choose Month / Year / Department. Set the month's <b>Working Days</b> (or accept the auto value).</li>
<li>Click a code (<b>P</b> Present, <b>PO</b> Present Onsite, <b>A</b> Absent, <b>L</b> Leave, <b>HD</b> Half Day, <b>H</b> Holiday, <b>WO</b> Weekly Off), then click the day cells for each employee. The selected code is highlighted.</li>
<li>Use <b>Auto Fill</b> (weekends→WO, holidays→H), <b>Copy Previous Month</b>, <b>Import/Export Excel</b>. Click <b>Save</b> to persist.</li>
<li>Use <b>◀ / ▶</b> (top-left) to jump to the previous / next month.</li>
<li><b>Sidebar auto-collapses</b> when you open Attendance Entry (like Chat) to give the grid more room — click the <b>☰</b> menu button to expand it again.</li>
<li><b>Hover tips:</b> hover a <b>PO</b> cell to see the customer / onsite place; hover a <b>Holiday</b> date (amber column) to see the holiday name.</li>
</ul>
<h3>Present Onsite (PO)</h3>
<ul>
<li>Mark an employee working at a customer site: select the <b>PO · Present Onsite</b> code, then click the day cell — a popup asks for the <b>customer / onsite place</b>. Type it and click <b>Set Onsite</b>, then <b>Save</b>.</li>
<li>PO counts exactly like Present in working-day / balance calculations. Hover a PO cell to see the place.</li>
<li>The <b>Dashboard</b> shows an <b>Onsite</b> box (click it for the list of who is where). <b>Reports → Onsite Report</b> lists all onsite entries by date range with Export Excel / PDF.</li>
</ul>
<h3>Happy Hours</h3>
<ul>
<li><b>Attendance → Happy Hours → Add Happy Hours.</b> Enter <b>Title</b>, pick the <b>Day</b>, <b>Start</b> &amp; <b>End</b> time, and the <b>Location Address</b>; set <b>Active</b>. Save.</li>
<li>Example: <i>Saturday Happy Hours · Saturday · 4:00 PM–6:00 PM · Turf, Go Art, Mugalivakkam, Chennai – 600125 · Active</i>.</li>
<li>List &amp; export them under <b>Reports → Happy Hours Report</b>.</li>
</ul>
<h3>Leave Register</h3>
<ul><li>Register a leave (employee, type, from/to dates, reason). It auto-marks attendance as Leave; deleting it restores the previous status.</li></ul>
<h3>Hourly Permission</h3>
<ul><li>Log short permissions (employee, date, from/to time, reason). Hours are computed automatically.</li></ul>
<h3>Balance Carry Forward</h3>
<ul><li>Auto-computes each employee's carry-forward (Gross Working Days − Working Days). Enter a manual <b>Deduction</b> + Remarks and <b>Save</b>.</li></ul>
<h3>Travel Allowance</h3>
<p class="nav">Attendance → Travel Allowance</p>
<ul>
<li>Record a travel advance: employee, client, location, travel <b>Start → End</b> dates (Onsite Days auto-calculated), and the <b>Advance Amount</b> issued.</li>
<li>Enter the <b>Expense Breakdown</b> (Bus, Train, Flight, <b>Bike</b>, Taxi, Hotel, Food, Other) — <b>Total Expense</b> and <b>Balance</b> auto-compute (Balance <b>+</b> = employee returns the remaining, <b>−</b> = office reimburses the extra).</li>
<li>Optionally <b>upload supporting bills</b> (PDF / image). A manager <b>Approves ✓ / Rejects ⊘</b> the settlement from the list. Click <b>👁 View</b> to see the full details and <b>open the attached documents</b>.</li>
<li>Per-column search, status &amp; date-range filters. See also <b>Reports → Travel Allowance Report</b>.</li>
</ul>

<h2 id="reports">6. Reports</h2>
<ul>
<li><b>Employee Summary</b> — leave days, sick leave, working days, totals.</li>
<li><b>Attendance Detail</b> — two views: <b>Summary Breakup</b> (per-employee totals) and <b>Date-wise</b> (day grid).</li>
<li><b>Leave Report</b> and <b>Permission Report</b> — filtered lists with totals.</li>
<li><b>Onsite Report</b> — Present-Onsite entries with the customer/place, by date range.</li>
<li><b>Happy Hours Report</b> — all happy-hours entries (title, day, time, location, status).</li>
<li><b>Chat Delete Log</b> — <span class="nav">Reports → Chat Delete Log</span>. An audit of every chat deletion (message deleted / chat cleared / chat purged) with who did it, when, the participants, and the detail. Filter by date and Export Excel / PDF.</li>
<li><b>Travel Allowance Report</b> — <span class="nav">Reports → Travel Allowance Report</span>. All travel allowances with advance / expense / balance / status; per-column search. Click <b>👁 View</b> to open the details and the attached PDFs. Export Excel / PDF.</li>
<li>Reports have Month / Year (or date-range) &amp; Department filters, search (heading), per-column search, pagination, and <b>Export Excel + PDF</b>.</li>
</ul>

<h2 id="chat">7. Chat Messages</h2>
<ul>
<li>1-to-1 internal chat with online status, double ticks (sent / delivered / read), and unread badges (also a 💬 icon in the top bar).</li>
<li>Send text, <b>emoji</b>, files (drag &amp; drop supported), and <b>voice messages</b> (tap the mic).</li>
<li>Message actions: <b>Reply, Forward, Copy, Star, Pin, Edit, Delete</b>. Star and pin are private to you.</li>
<li><b>Forward a message</b> — <span class="nav">Chat → hover a message → ⋮ → Forward</span> → tick one or more contacts → Forward.</li>
<li>Chat header ⋮: <b>Pin chat, Auto-erase on close, Set nickname, View profile, Clear chat</b>.</li>
<li>⚙️ Chat Settings: light wallpaper/themes, brightness (Light/Medium/Dark), custom photo. 📊 Storage manager (clear per user). ⭐ Starred messages.</li>
<li>Edit your profile picture + About from the top-left avatar.</li>
</ul>

<h2 id="settings">8. Settings</h2>
<p class="nav">Sidebar → Settings</p>
<ul>
<li><b>Application Font</b>, <b>Appearance</b> (light/dark), <b>Display Style</b> (Default / Modern 3D / Glass / Crystal), <b>Weekly Off Days</b>, <b>Animations</b>, <b>Notification Critters</b>, <b>Login Page Eagles</b>.</li>
<li><b>Login Page Style</b> (Default / Neumorphic), <b>Input Field Style</b>, <b>Toggle Switch Style</b> (Default / Green), and <b>Sidebar Glow</b> — each with a <b>live preview</b>. Also <b>Accent Colour</b> and <b>Dashboard Card Depth</b>.</li>
<li><b>User Manual</b> — download this guide.</li>
</ul>

<h2 id="break">9. Break Zone (Relax &amp; Games)</h2>
<p class="nav">Home → Top bar → BREAK ▶</p><span style="font-size:12px;color:#64748b">(also: Chat Messages → "Take a break")</span>
<ul>
<li>Click the yellow <b>BREAK ▶</b> button, then confirm <b>"Yes, let's relax"</b>.</li>
<li>Set your break length — <b>default 10 minutes</b>, editable (±, quick 5/10/15/30, or type any 1–180).</li>
<li>Pick an offline game: <b>Snake, Ping Ball, Brick Breaker, Space Jump, Memory Match, Tic-Tac-Toe</b> (arrow keys / mouse / spacebar).</li>
<li>The session timer runs in the header; in the <b>last minute</b> a countdown appears in the corner and the Break Zone <b>closes automatically</b> when time is up.</li>
</ul>

<h2 id="bot">10. Help Bot (Unibot)</h2>
<ul><li>The floating ✨ assistant button (bottom-right, on the Home dashboard) answers questions — tap a suggestion or type your own (e.g. "who is on leave today", "how to enter attendance", "how to take a break", "quick-open attendance entry", "onsite / holiday hover info", "what is chat delete log", "do you want user manual").</li>
<li><b>Responsive:</b> on a phone the assistant opens as a full-width bottom sheet; on a tablet / PC it's a floating card in the corner.</li></ul>

<div class="tip">Tip: To keep a PDF, open this file and use your browser's <b>Print → Save as PDF</b>.</div>
<p class="foot">Unipro Attendance Management System — User Manual</p>
</body></html>`

export const MANUAL_ANSWER = '📖 Yes! Go to Settings → User Manual and click "Download PDF" — the manual opens and the print dialog appears; choose "Save as PDF".'

// Opens the manual in a new window and triggers the print dialog → Save as PDF.
export function downloadManual() {
  const w = window.open('', '_blank', 'width=920,height=760')
  if (!w) { window.alert('Please allow pop-ups so the manual can open for PDF download.'); return }
  w.document.open()
  w.document.write(MANUAL_HTML)
  w.document.close()
  w.focus()
  setTimeout(() => { try { w.print() } catch { /* user can print manually */ } }, 500)
}
