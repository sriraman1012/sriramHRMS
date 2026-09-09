import MasterCrud from '../../components/MasterCrud.jsx'
import { getAddons, saveAddon, setAddonActive, deleteAddon } from '../../api/masters.js'

export default function AddonMaster() {
  return (
    <MasterCrud
      title="Add-on"
      idKey="addonId"
      moduleKey="addon-master"
      statusKey="isActive"
      api={{ list: getAddons, save: saveAddon, setActive: setAddonActive, remove: deleteAddon }}
      columns={[
        { key: 'addonName', label: 'Add-on Name' },
        { key: 'displayOrder', label: 'Order', render: (r) => (r.displayOrder ?? '—') },
      ]}
      searchText={(r) => `${r.addonName}`}
      emptyForm={{ addonName: '', displayOrder: '', isActive: true }}
      fields={[
        { name: 'addonName', label: 'Add-on Name', required: true, full: true },
        { name: 'displayOrder', label: 'Display Order', type: 'number' },
        { name: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Active' },
      ]}
      fromRow={(r) => ({ addonName: r.addonName, displayOrder: r.displayOrder ?? '', isActive: r.isActive })}
      toPayload={(f) => ({
        addonName: f.addonName.trim(),
        displayOrder: f.displayOrder === '' || f.displayOrder === null ? 0 : Number(f.displayOrder),
        isActive: f.isActive,
      })}
    />
  )
}
