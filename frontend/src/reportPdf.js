// Reusable "Export PDF" for reports: opens a clean print window and triggers the
// browser's print dialog (users pick "Save as PDF"). No external library needed.

const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

// Render one table's HTML (thead/tbody/tfoot).
function tableHtml({ head, body, foot, aligns }) {
  const al = (i) => aligns?.[i] || 'left'
  const headHtml = `<tr>${head.map((h, i) => `<th style="text-align:${al(i)}">${esc(h)}</th>`).join('')}</tr>`
  const bodyHtml = body.map((row) => `<tr>${row.map((c, i) => `<td style="text-align:${al(i)}">${esc(c)}</td>`).join('')}</tr>`).join('')
  const footHtml = foot ? `<tfoot><tr>${foot.map((c, i) => `<td style="text-align:${al(i)}">${esc(c)}</td>`).join('')}</tr></tfoot>` : ''
  return `<table><thead>${headHtml}</thead><tbody>${bodyHtml}</tbody>${footHtml}</table>`
}

// head: [labels]; aligns: optional ['left'|'center'|'right'] per column
// body: [[cells]]; foot: optional [cells] rendered as a bold totals row
// sections: optional extra tables — each { heading, head, body, foot, aligns } starts on a new page
export function exportReportPdf({ title, subtitle, head, body, foot, aligns, sections }) {
  const mainTable = tableHtml({ head, body, foot, aligns })
  const sectionsHtml = (sections || [])
    .map((s) => `<h2 class="sec">${esc(s.heading || '')}</h2>${tableHtml(s)}`)
    .join('')

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; color: #1e293b; margin: 0; padding: 24px; }
  .brand { font-size: 12px; font-weight: 800; letter-spacing: .08em; color: #2563eb; text-transform: uppercase; }
  h1 { font-size: 20px; margin: 2px 0 2px; }
  .sub { color: #64748b; font-size: 13px; margin: 0 0 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #334155; color: #fff; text-align: left; padding: 7px 9px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; }
  tbody td { padding: 6px 9px; border-bottom: 1px solid #e2e8f0; }
  tbody tr:nth-child(even) td { background: #f8fafc; }
  tfoot td { padding: 8px 9px; font-weight: 800; border-top: 2px solid #cbd5e1; background: #f1f5f9; }
  .foot { margin-top: 18px; color: #94a3b8; font-size: 11px; }
  h2.sec { page-break-before: always; font-size: 16px; margin: 0 0 8px; color: #1d4ed8; }
  @media print { body { padding: 0; } thead { display: table-header-group; } }
</style></head><body>
  <div class="brand">Unipro Attendance</div>
  <h1>${esc(title)}</h1>
  ${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ''}
  ${mainTable}
  ${sectionsHtml}
  <div class="foot">Generated from Unipro Attendance Management System — Print / Save as PDF (Ctrl/Cmd + P).</div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) { alert('Please allow pop-ups to export the PDF.'); return }
  w.document.open()
  w.document.write(html)
  w.document.close()
}
