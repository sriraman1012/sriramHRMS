import MasterCrud from '../../components/MasterCrud.jsx'
import { getHolidays, saveHoliday, deleteHoliday } from '../../api/masters.js'

const TYPES = ['Public', 'Optional', 'Company', 'Restricted']
const fmt = (d) => (d ? String(d).slice(0, 10) : '—')

export default function Holiday() {
  return (
    <MasterCrud
      title="Holiday"
      idKey="holidayId"
      moduleKey="holiday"
      api={{ list: getHolidays, save: saveHoliday, remove: deleteHoliday }}
      columns={[
        { key: 'holidayDate', label: 'Date', render: (r) => fmt(r.holidayDate) },
        { key: 'holidayName', label: 'Name' },
        { key: 'holidayType', label: 'Type', render: (r) => r.holidayType || '—' },
      ]}
      searchText={(r) => `${fmt(r.holidayDate)} ${r.holidayName} ${r.holidayType || ''}`}
      emptyForm={{ holidayDate: '', holidayName: '', holidayType: '' }}
      fields={[
        { name: 'holidayDate', label: 'Holiday Date', type: 'date', required: true },
        { name: 'holidayType', label: 'Type', type: 'select', options: TYPES.map((t) => ({ value: t, label: t })) },
        { name: 'holidayName', label: 'Holiday Name', required: true, full: true },
      ]}
      fromRow={(r) => ({ holidayDate: fmt(r.holidayDate), holidayName: r.holidayName, holidayType: r.holidayType || '' })}
      toPayload={(f) => ({
        holidayDate: f.holidayDate,
        holidayName: f.holidayName.trim(),
        holidayType: f.holidayType || null,
      })}
    />
  )
}
