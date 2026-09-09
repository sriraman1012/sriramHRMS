import MasterCrud from '../../components/MasterCrud.jsx'
import { getOffices, getOffice, saveOffice, setOfficeActive, deleteOffice } from '../../api/masters.js'

export default function Office() {
  return (
    <MasterCrud
      title="Office"
      idKey="officeId"
      moduleKey="office"
      statusKey="isActive"
      api={{ list: getOffices, getById: getOffice, save: saveOffice, setActive: setOfficeActive, remove: deleteOffice }}
      columns={[
        { key: 'officeCode', label: 'Code' },
        { key: 'locationName', label: 'Location' },
        { key: 'address', label: 'Address', render: (r) => r.address || '—' },
        { key: 'hasPhoto', label: 'Photo', render: (r) => (r.hasPhoto ? '📷' : '—'), searchable: false },
      ]}
      searchText={(r) => `${r.officeCode} ${r.locationName} ${r.address || ''}`}
      emptyForm={{ officeCode: '', locationName: '', address: '', photoBase64: null, photoName: '', isActive: true }}
      fields={[
        { name: 'officeCode', label: 'Office Code', required: true },
        { name: 'locationName', label: 'Location Name', required: true },
        { name: 'address', label: 'Address', type: 'textarea', full: true },
        { name: 'photoBase64', label: 'Photo', type: 'image', nameField: 'photoName', full: true },
        { name: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Active' },
      ]}
      fromRow={(r) => ({
        officeCode: r.officeCode, locationName: r.locationName, address: r.address || '',
        photoBase64: r.photoBase64 || null, photoName: r.photoName || '', isActive: r.isActive,
      })}
      toPayload={(f) => ({
        officeCode: f.officeCode.trim(),
        locationName: f.locationName.trim(),
        address: (f.address || '').trim() || null,
        photoBase64: f.photoBase64 || null,
        photoName: f.photoName || null,
        isActive: f.isActive,
      })}
    />
  )
}
