// Single-page "Expense Reimbursement Form" (UNIPRO format) for Travel Allowance.
// One A4 page per travel record, with the company logo + header matching the
// printed template. Filled from each record's expense breakdown.

const pad = (n) => String(n).padStart(2, '0')
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const dmy = (d) => {
  if (!d) return ''
  const x = new Date(String(d).slice(0, 10) + 'T00:00:00')
  if (isNaN(x)) return ''
  return `${pad(x.getDate())}-${MON[x.getMonth()]}-${String(x.getFullYear()).slice(2)}`
}
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const amt = (v) => { const n = num(v); return Number.isInteger(n) ? String(n) : n.toFixed(2) }
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// Expense categories → one line item each (the app stores category totals).
const CATS = [
  { k: 'busTicket', desc: 'Bus Ticket', cat: 'Travel By Bus' },
  { k: 'trainTicket', desc: 'Train Ticket', cat: 'Travel By Train' },
  { k: 'flightTicket', desc: 'Flight Ticket', cat: 'Travel By Flight' },
  { k: 'bikeExpense', desc: 'Bike', cat: 'Travel By Bike' },
  { k: 'taxi', desc: 'Taxi / Auto', cat: 'Travel By Auto' },
  { k: 'hotelBill', desc: 'Hotel / Stay', cat: 'Accommodation' },
  { k: 'foodBill', desc: 'Food', cat: 'Food' },
  { k: 'otherExpense', desc: 'Other Expense', cat: 'Other' },
]
const MIN_ROWS = 11 // keep a consistent form height (still fits one page)

function formHtml(r, logoUrl) {
  const items = CATS.filter((c) => num(r[c.k]) !== 0)
    .map((c) => ({ date: dmy(r.travelStartDate), desc: c.desc, cat: c.cat, cost: num(r[c.k]) }))
  const totalExpense = num(r.totalExpense) || items.reduce((a, b) => a + b.cost, 0)
  const advance = num(r.advanceAmount)
  const reimb = totalExpense - advance
  const blanks = Math.max(0, MIN_ROWS - items.length)

  const itemRows =
    items.map((it) => `<tr><td class="c">${it.date}</td><td>${esc(it.desc)}</td><td class="c">${esc(it.cat)}</td><td class="r">${amt(it.cost)}</td></tr>`).join('') +
    Array.from({ length: blanks }).map(() => '<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>').join('')

  const days = num(r.onsiteDays)
  return `
  <div class="sheet"><div class="form">
    <div class="hdr">
      <img class="logo" src="${logoUrl}" alt="logo" />
      <div class="co">
        <div class="co-name">UNIPRO TECH SOLUTIONS (P) LTD</div>
        <div class="co-addr">KNR Building, Plot No: 23&amp;35B, Sriram Nagar, 2nd Street, Mugalivakkam Road, Porur - 600119</div>
      </div>
    </div>
    <div class="title">Expense Reimbursement Form</div>

    <table class="details">
      <colgroup><col style="width:14%"><col style="width:22%"><col style="width:16%"><col style="width:12%"><col style="width:12%"><col style="width:24%"></colgroup>
      <tr>
        <td class="lbl">Name :</td><td>${esc(r.employeeName)}</td>
        <th>Clients</th><td class="x"></td>
        <th colspan="2">Expense Period</th>
      </tr>
      <tr>
        <td class="lbl">Emp Id:</td><td>${esc(r.employeeCode)}</td>
        <td class="client" colspan="2" rowspan="3">${esc(r.clientName)}${r.clientLocation ? `<div class="loc">${esc(r.clientLocation)}</div>` : ''}</td>
        <td class="lbl">From</td><td>${dmy(r.travelStartDate)}</td>
      </tr>
      <tr>
        <td class="lbl">Designation:</td><td>${esc(r.designation || '')}</td>
        <td class="lbl">To</td><td>${dmy(r.travelEndDate)}</td>
      </tr>
      <tr>
        <td class="lbl">Reporting:</td><td>${esc(r.reporting || '')}</td>
        <td class="lbl">Total</td><td>${days} day${days === 1 ? '' : 's'}</td>
      </tr>
    </table>

    <table class="items">
      <colgroup><col style="width:16%"><col style="width:48%"><col style="width:22%"><col style="width:14%"></colgroup>
      <thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Cost</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table class="totals">
      <colgroup><col style="width:64%"><col style="width:22%"><col style="width:14%"></colgroup>
      <tr><td class="rem" rowspan="3"><b>Remarks</b><div class="remtext">${esc(r.remarks || '')}</div></td>
          <td class="tl">Total Expense</td><td class="r">${amt(totalExpense)}</td></tr>
      <tr><td class="tl">Less Advance (-)</td><td class="r">${amt(advance)}</td></tr>
      <tr><td class="tl"><b>Total Reimbursement</b></td><td class="r"><b>${amt(reimb)}</b></td></tr>
    </table>

    <table class="sign">
      <tr><td>Validated by Name &amp; Signature</td><td>Approved by Name &amp; Signature</td></tr>
    </table>
    <div class="acct-bar">Accounts Team Use Only</div>
    <table class="acct">
      <tr><td>Processed by :</td><td>Date :</td><td>Mode :</td><td>Refrence ID :</td></tr>
    </table>
  </div></div>`
}

const CSS = `
  * { box-sizing: border-box; }
  /* margin:0 removes the browser's auto print header/footer (title + URL + date).
     Page margins are applied as padding on each .sheet instead. */
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; }
  .sheet { page-break-after: always; padding: 12mm; }
  .sheet:last-child { page-break-after: auto; }
  .form { border: 1.6px solid #000; }
  .hdr { display: flex; align-items: center; gap: 12px; padding: 6px 12px; border-bottom: 1.6px solid #000; }
  .logo { width: 48px; height: 48px; object-fit: contain; }
  .co { flex: 1; text-align: center; }
  .co-name { font-size: 19px; font-weight: bold; letter-spacing: .3px; }
  .co-addr { font-size: 9px; font-weight: bold; margin-top: 2px; }
  .title { text-align: center; font-weight: bold; font-size: 12px; padding: 4px; border-bottom: 1.6px solid #000; }
  table { border-collapse: collapse; width: 100%; font-size: 10px; }
  .details td, .details th { border: 1px solid #000; padding: 3px 6px; height: 20px; vertical-align: middle; }
  .details th { background: #eee; text-align: center; }
  .details .lbl { font-weight: bold; background: #f7f7f7; white-space: nowrap; }
  .details .client { text-align: center; font-weight: bold; }
  .details .loc { font-weight: normal; font-size: 8px; margin-top: 2px; }
  .items th { border: 1px solid #000; background: #eee; padding: 3px; }
  .items td { border: 1px solid #000; padding: 2px 6px; height: 17px; }
  .items .c { text-align: center; }
  .items .r { text-align: right; }
  .totals td { border: 1px solid #000; padding: 3px 6px; }
  .totals .tl { font-weight: bold; }
  .totals .r { text-align: right; }
  .totals .rem { vertical-align: top; }
  .totals .remtext { font-weight: normal; min-height: 34px; white-space: pre-wrap; }
  .sign td { border: 1px solid #000; height: 42px; vertical-align: bottom; padding: 3px 8px; width: 50%; }
  .acct-bar { text-align: center; font-weight: bold; border: 1px solid #000; border-top: none; padding: 3px; background: #eee; }
  .acct td { border: 1px solid #000; padding: 7px 6px; width: 25%; }
`

// records: one record object, or an array of them (one page each).
export function exportReimbursementForms(records, opts = {}) {
  const list = Array.isArray(records) ? records : [records]
  if (!list.length) { window.alert('Nothing to export.'); return }
  const logoUrl = opts.logoUrl || `${window.location.origin}/logo.png`
  const sheets = list.map((r) => formHtml(r, logoUrl)).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Expense Reimbursement Form</title><style>${CSS}</style></head>
    <body>${sheets}<script>window.onload=function(){setTimeout(function(){window.print();},350);};<\/script></body></html>`
  const w = window.open('', '_blank')
  if (!w) { window.alert('Please allow pop-ups so the form can open for printing / PDF.'); return }
  w.document.open(); w.document.write(html); w.document.close(); w.focus()
}
