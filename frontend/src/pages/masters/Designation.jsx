import MasterCrud from '../../components/MasterCrud.jsx'
import { getDesignations, saveDesignation, setDesignationActive, deleteDesignation } from '../../api/masters.js'

export default function Designation() {
  return (
    <MasterCrud
      title="Designation"
      idKey="designationId"
      moduleKey="designation"
      statusKey="isActive"
      api={{ list: getDesignations, save: saveDesignation, setActive: setDesignationActive, remove: deleteDesignation }}
      columns={[
        { key: 'designationCode', label: 'Code' },
        { key: 'designationName', label: 'Name' },
      ]}
      searchText={(r) => `${r.designationCode} ${r.designationName}`}
      emptyForm={{ designationCode: '', designationName: '', isActive: true }}
      fields={[
        { name: 'designationCode', label: 'Designation Code', required: true },
        { name: 'designationName', label: 'Designation Name', required: true },
        { name: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Active' },
      ]}
      fromRow={(r) => ({ designationCode: r.designationCode, designationName: r.designationName, isActive: r.isActive })}
      toPayload={(f) => ({
        designationCode: f.designationCode.trim(),
        designationName: f.designationName.trim(),
        isActive: f.isActive,
      })}
    />
  )
}
