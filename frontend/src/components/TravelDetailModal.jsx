import { useEffect, useState } from 'react'
import { getTravelAdvance } from '../api/travel.js'
import { X } from './icons.jsx'
import Loader from './Loader.jsx'

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
const money = (n) => `₹${num(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmt = (d) => (d ? String(d).slice(0, 10) : '')
const EXPENSES = [['busTicket', 'Bus Ticket'], ['trainTicket', 'Train Ticket'], ['flightTicket', 'Flight Ticket'], ['bikeExpense', 'Bike'], ['taxi', 'Taxi'], ['hotelBill', 'Hotel / Room'], ['foodBill', 'Food / Mess'], ['otherExpense', 'Other']]
const STATUS_CLS = {
  Approved: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
}

// Full detail view of one Travel Allowance record, including clickable supporting documents.
export default function TravelDetailModal({ travelId, onClose }) {
  const [d, setD] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    getTravelAdvance(travelId).then(setD).catch(() => setD(null)).finally(() => setLoading(false))
  }, [travelId])

  let docs = []
  try { docs = d?.documentsJson ? JSON.parse(d.documentsJson) : [] } catch { docs = [] }
  const Row = ({ label, children, strong }) => (
    <div className="flex justify-between gap-4 py-1.5 border-b border-slate-100 dark:border-white/5">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={strong ? 'font-bold tabular-nums' : 'font-medium text-right'}>{children}</span>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#161925] max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <h3 className="text-lg font-bold flex items-center gap-2">🧳 Travel Allowance — Detail</h3>
          <button onClick={onClose} title="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto p-5 text-sm">
          {loading ? <div className="py-10 flex justify-center"><Loader size="2.6em" /></div>
            : !d ? <div className="py-10 text-center text-slate-400">Could not load the record.</div>
              : (
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400 mb-1">Trip</div>
                    <Row label="Employee">{d.employeeName} <span className="text-slate-400 font-normal">({d.employeeCode})</span></Row>
                    <Row label="Department">{d.departmentName || '—'}</Row>
                    <Row label="Client">{d.clientName}</Row>
                    <Row label="Location">{d.clientLocation}</Row>
                    <Row label="Travel">{fmt(d.travelStartDate)} → {fmt(d.travelEndDate)}</Row>
                    <Row label="Onsite Days">{d.onsiteDays}</Row>
                    <Row label="Status">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_CLS[d.approvalStatus] || STATUS_CLS.Pending}`}>{d.approvalStatus}</span>
                      {d.approvedBy && <span className="text-[11px] text-slate-400 ml-1">by {d.approvedBy}</span>}
                    </Row>
                    {d.remarks && <Row label="Remarks">{d.remarks}</Row>}
                  </div>
                  <div>
                    <div className="text-[11px] uppercase font-bold text-slate-400 mb-1">Amounts</div>
                    <Row label="Advance Issued" strong>{money(d.advanceAmount)}</Row>
                    {EXPENSES.map(([k, l]) => num(d[k]) > 0 && <Row key={k} label={l}>{money(d[k])}</Row>)}
                    <Row label="Total Expense" strong>{money(d.totalExpense)}</Row>
                    <div className={`flex justify-between gap-4 py-2 mt-1 rounded-lg px-2 ${num(d.balanceAmount) < 0 ? 'bg-red-50 dark:bg-red-500/10' : 'bg-green-50 dark:bg-green-500/10'}`}>
                      <span className="font-bold">Balance ({num(d.balanceAmount) < 0 ? 'Reimburse' : 'Return'})</span>
                      <span className={`font-bold tabular-nums ${num(d.balanceAmount) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{money(d.balanceAmount)}</span>
                    </div>
                  </div>

                  {/* Supporting documents */}
                  <div className="sm:col-span-2 mt-2">
                    <div className="text-[11px] uppercase font-bold text-slate-400 mb-2">Supporting Documents {docs.length ? `(${docs.length})` : ''}</div>
                    {docs.length === 0 ? <div className="text-slate-400">No documents attached.</div> : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {docs.map((doc, i) => {
                          const isImg = (doc.fileType || '').startsWith('image/') || (doc.fileData || '').startsWith('data:image/')
                          return (
                            <a key={i} href={doc.fileData} target="_blank" rel="noreferrer" title={`Open ${doc.fileName}`}
                              className="block rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden hover:border-blue-400 hover:shadow transition">
                              {isImg
                                ? <img src={doc.fileData} alt={doc.fileName} className="w-full h-24 object-cover bg-slate-100 dark:bg-white/5" />
                                : <div className="w-full h-24 flex items-center justify-center bg-slate-100 dark:bg-white/5 text-4xl">📄</div>}
                              <div className="px-2 py-1 text-[11px] truncate text-blue-600 dark:text-blue-400">{doc.fileName}</div>
                            </a>
                          )
                        })}
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400 mt-2">Tap a document to open it in a new tab.</p>
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
  )
}
