import MasterCrud from '../../components/MasterCrud.jsx'
import { getDepartments, saveDepartment, setDepartmentActive, deleteDepartment } from '../../api/masters.js'

export default function Department() {
  return (
    <MasterCrud
      title="Department"
      idKey="departmentId"
      moduleKey="department"
      statusKey="isActive"
      api={{ list: getDepartments, save: saveDepartment, setActive: setDepartmentActive, remove: deleteDepartment }}
      columns={[
        { key: 'departmentCode', label: 'Code' },
        { key: 'departmentName', label: 'Name' },
        { key: 'head', label: 'Head', render: (r) => r.head || '—' },
      ]}
      searchText={(r) => `${r.departmentCode} ${r.departmentName} ${r.head || ''}`}
      emptyForm={{ departmentCode: '', departmentName: '', head: '', isActive: true }}
      fields={[
        { name: 'departmentCode', label: 'Department Code', required: true },
        { name: 'departmentName', label: 'Department Name', required: true },
        { name: 'head', label: 'Head', full: true },
        { name: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Active' },
      ]}
      fromRow={(r) => ({ departmentCode: r.departmentCode, departmentName: r.departmentName, head: r.head || '', isActive: r.isActive })}
      toPayload={(f) => ({
        departmentCode: f.departmentCode.trim(),
        departmentName: f.departmentName.trim(),
        head: (f.head || '').trim() || null,
        isActive: f.isActive,
      })}
    />
  )
}
