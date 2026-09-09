import { useState } from 'react'
import MasterCrud from '../../components/MasterCrud.jsx'
import {
  getImplItems, saveImplItem, setImplItemActive, deleteImplItem,
  getAddons, saveAddon, setAddonActive, deleteAddon,
  getImplTests, saveImplTest, setImplTestActive, deleteImplTest,
} from '../../api/masters.js'

// Small green/grey Yes-No pill for the location-type columns.
const YesNo = (on) => (
  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold ${on ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>
    {on ? 'Yes' : '—'}
  </span>
)

// ---- Tab 1: checklist tasks ----
function ChecklistTasksTab() {
  return (
    <MasterCrud
      title="Checklist Task"
      idKey="itemId"
      moduleKey="impl-master"
      statusKey="isActive"
      api={{ list: getImplItems, save: saveImplItem, setActive: setImplItemActive, remove: deleteImplItem }}
      columns={[
        { key: 'taskName', label: 'Task' },
        { key: 'forSingle', label: 'Single Location', render: (r) => YesNo(r.forSingle), filterText: (r) => (r.forSingle ? 'Yes' : 'No') },
        { key: 'forMultiple', label: 'Multiple Location', render: (r) => YesNo(r.forMultiple), filterText: (r) => (r.forMultiple ? 'Yes' : 'No') },
        { key: 'displayOrder', label: 'Order', render: (r) => (r.displayOrder ?? '—') },
      ]}
      searchText={(r) => `${r.taskName}`}
      emptyForm={{ taskName: '', forSingle: true, forMultiple: true, displayOrder: '', isActive: true }}
      fields={[
        { name: 'taskName', label: 'Task Name', required: true, full: true },
        { name: 'forSingle', label: 'Single Location', type: 'checkbox', checkboxLabel: 'Show for Single Location' },
        { name: 'forMultiple', label: 'Multiple Location', type: 'checkbox', checkboxLabel: 'Show for Multiple Location' },
        { name: 'displayOrder', label: 'Display Order', type: 'number' },
        { name: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Active' },
      ]}
      fromRow={(r) => ({
        taskName: r.taskName, forSingle: r.forSingle, forMultiple: r.forMultiple,
        displayOrder: r.displayOrder ?? '', isActive: r.isActive,
      })}
      toPayload={(f) => ({
        taskName: f.taskName.trim(),
        forSingle: !!f.forSingle,
        forMultiple: !!f.forMultiple,
        displayOrder: f.displayOrder === '' || f.displayOrder === null ? 0 : Number(f.displayOrder),
        isActive: f.isActive,
      })}
    />
  )
}

// ---- Tab 2: add-ons ----
function AddonsTab() {
  return (
    <MasterCrud
      title="Add-on"
      idKey="addonId"
      moduleKey="impl-master"
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

// ---- Tab 3: process testing items ----
function TestingTab() {
  return (
    <MasterCrud
      title="Test Item"
      idKey="testId"
      moduleKey="impl-master"
      statusKey="isActive"
      api={{ list: getImplTests, save: saveImplTest, setActive: setImplTestActive, remove: deleteImplTest }}
      columns={[
        { key: 'testName', label: 'Test' },
        { key: 'testGroup', label: 'Group' },
        { key: 'displayOrder', label: 'Order', render: (r) => (r.displayOrder ?? '—') },
      ]}
      searchText={(r) => `${r.testName} ${r.testGroup}`}
      emptyForm={{ testName: '', testGroup: 'Backoffice', displayOrder: '', isActive: true }}
      fields={[
        { name: 'testName', label: 'Test Name', required: true, full: true },
        { name: 'testGroup', label: 'Group', type: 'select', required: true, options: [{ value: 'Backoffice', label: 'Backoffice' }, { value: 'POS', label: 'POS' }] },
        { name: 'displayOrder', label: 'Display Order', type: 'number' },
        { name: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Active' },
      ]}
      fromRow={(r) => ({ testName: r.testName, testGroup: r.testGroup, displayOrder: r.displayOrder ?? '', isActive: r.isActive })}
      toPayload={(f) => ({
        testName: f.testName.trim(),
        testGroup: f.testGroup === 'POS' ? 'POS' : 'Backoffice',
        displayOrder: f.displayOrder === '' || f.displayOrder === null ? 0 : Number(f.displayOrder),
        isActive: f.isActive,
      })}
    />
  )
}

const TABS = [
  { key: 'tasks', label: 'Checklist Tasks' },
  { key: 'addons', label: 'Add-ons' },
  { key: 'testing', label: 'Process Testing' },
]

export default function ImplChecklistMaster() {
  const [tab, setTab] = useState('tasks')
  return (
    <div className="w-full space-y-4">
      <h1 className="text-xl font-bold">Implementation Checklist</h1>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-bold -mb-px border-b-2 transition-colors ${tab === t.key ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'tasks' ? <ChecklistTasksTab /> : tab === 'addons' ? <AddonsTab /> : <TestingTab />}
    </div>
  )
}
