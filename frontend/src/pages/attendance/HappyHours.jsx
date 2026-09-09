import MasterCrud from '../../components/MasterCrud.jsx'
import { getHappyHours, saveHappyHour, setHappyHourActive, deleteHappyHour } from '../../api/masters.js'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const fmtDate = (d) => (d ? String(d).slice(0, 10) : '')

// "16:00" (24h) -> "4:00 PM"
const to12h = (t) => {
  if (!t) return '—'
  const [h, m] = String(t).split(':')
  let hh = Number(h)
  if (Number.isNaN(hh)) return t
  const ap = hh >= 12 ? 'PM' : 'AM'
  hh = hh % 12 || 12
  return `${hh}:${m ?? '00'} ${ap}`
}

export default function HappyHours() {
  return (
    <MasterCrud
      title="Happy Hours"
      idKey="happyHourId"
      statusKey="isActive"
      moduleKey="happy-hours"
      formCols={2}
      api={{ list: getHappyHours, save: saveHappyHour, setActive: setHappyHourActive, remove: deleteHappyHour }}
      columns={[
        { key: 'title', label: 'Title' },
        { key: 'dayName', label: 'Day', render: (r) => r.dayName || '—' },
        { key: 'eventDate', label: 'Date', render: (r) => fmtDate(r.eventDate) || '—', filterText: (r) => fmtDate(r.eventDate) },
        { key: 'startTime', label: 'Start Time', render: (r) => to12h(r.startTime), filterText: (r) => to12h(r.startTime) },
        { key: 'endTime', label: 'End Time', render: (r) => to12h(r.endTime), filterText: (r) => to12h(r.endTime) },
        { key: 'locationAddress', label: 'Location Address', render: (r) => r.locationAddress || '—' },
      ]}
      searchText={(r) => `${r.title} ${r.dayName || ''} ${fmtDate(r.eventDate)} ${r.locationAddress || ''}`}
      emptyForm={{ title: '', dayName: 'Saturday', eventDate: '', startTime: '16:00', endTime: '18:00', locationAddress: '', isActive: true }}
      fields={[
        { name: 'title', label: 'Title', required: true },
        { name: 'dayName', label: 'Day', type: 'select', options: DAYS.map((d) => ({ value: d, label: d })) },
        { name: 'eventDate', label: 'Date', type: 'calendar' },
        { name: 'startTime', label: 'Start Time', type: 'time' },
        { name: 'endTime', label: 'End Time', type: 'time' },
        { name: 'locationAddress', label: 'Location Address', type: 'textarea', rows: 2, full: true },
        { name: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Active' },
      ]}
      fromRow={(r) => ({
        title: r.title || '', dayName: r.dayName || '', eventDate: fmtDate(r.eventDate), startTime: r.startTime || '', endTime: r.endTime || '',
        locationAddress: r.locationAddress || '', isActive: r.isActive,
      })}
      toPayload={(f) => ({
        title: (f.title || '').trim(),
        dayName: f.dayName || null,
        eventDate: f.eventDate || null,
        startTime: f.startTime || null,
        endTime: f.endTime || null,
        locationAddress: (f.locationAddress || '').trim() || null,
        isActive: f.isActive,
      })}
    />
  )
}
