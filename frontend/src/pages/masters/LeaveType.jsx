import MasterCrud from '../../components/MasterCrud.jsx'
import { getLeaveTypes, saveLeaveType, setLeaveTypeActive, deleteLeaveType } from '../../api/masters.js'

export default function LeaveType() {
  return (
    <MasterCrud
      title="Leave Type"
      idKey="leaveTypeId"
      moduleKey="leavetype"
      statusKey="isActive"
      api={{ list: getLeaveTypes, save: saveLeaveType, setActive: setLeaveTypeActive, remove: deleteLeaveType }}
      columns={[
        { key: 'leaveTypeCode', label: 'Code' },
        { key: 'leaveName', label: 'Leave Name' },
        { key: 'maxDays', label: 'Max Days', render: (r) => (r.maxDays ?? '—') },
        { key: 'isPaid', label: 'Paid?', render: (r) => (r.isPaid ? 'Paid' : 'Unpaid'), filterText: (r) => (r.isPaid ? 'Paid' : 'Unpaid') },
      ]}
      searchText={(r) => `${r.leaveTypeCode} ${r.leaveName}`}
      emptyForm={{ leaveTypeCode: '', leaveName: '', maxDays: '', isPaid: 'true', isActive: true }}
      fields={[
        { name: 'leaveTypeCode', label: 'Leave Type Code', required: true },
        { name: 'leaveName', label: 'Leave Name', required: true },
        { name: 'maxDays', label: 'Max Days', type: 'number' },
        { name: 'isPaid', label: 'Paid / Unpaid', type: 'select', options: [{ value: 'true', label: 'Paid' }, { value: 'false', label: 'Unpaid' }] },
        { name: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Active' },
      ]}
      fromRow={(r) => ({
        leaveTypeCode: r.leaveTypeCode, leaveName: r.leaveName,
        maxDays: r.maxDays ?? '', isPaid: String(r.isPaid), isActive: r.isActive,
      })}
      toPayload={(f) => ({
        leaveTypeCode: f.leaveTypeCode.trim(),
        leaveName: f.leaveName.trim(),
        maxDays: f.maxDays === '' || f.maxDays === null ? null : Number(f.maxDays),
        isPaid: f.isPaid === 'true' || f.isPaid === true,
        isActive: f.isActive,
      })}
    />
  )
}
