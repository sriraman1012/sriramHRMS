import { useEffect, useState } from 'react'
import MasterCrud from '../../components/MasterCrud.jsx'
import {
  getEmployees, getEmployee, saveEmployee, setEmployeeActive, deleteEmployee,
  getDepartments, getDesignations,
} from '../../api/masters.js'

const fmt = (d) => (d ? String(d).slice(0, 10) : '')
const opts = (arr) => arr.map((v) => ({ value: v, label: v }))
const GENDERS = ['Male', 'Female', 'Other']
const MARITAL = ['Single', 'Married', 'Divorced', 'Widowed']
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

export default function Employee() {
  const [depts, setDepts] = useState([])
  const [desigs, setDesigs] = useState([])

  useEffect(() => {
    getDepartments().then(setDepts).catch(() => {})
    getDesignations().then(setDesigs).catch(() => {})
  }, [])

  const fields = [
    { name: 'employeeCode', label: 'Employee Code', required: true },
    { name: 'name', label: 'Name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'mobile', label: 'Mobile No', type: 'tel' },
    { name: 'gender', label: 'Gender', type: 'select', options: opts(GENDERS) },
    { name: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
    { name: 'maritalStatus', label: 'Marital Status', type: 'select', options: opts(MARITAL) },
    { name: 'bloodGroup', label: 'Blood Group', type: 'select', options: opts(BLOOD) },
    { name: 'nationality', label: 'Nationality', type: 'text' },
    { name: 'departmentId', label: 'Department', type: 'select', options: depts.map((d) => ({ value: d.departmentId, label: d.departmentName })) },
    { name: 'designationId', label: 'Designation', type: 'select', options: desigs.map((d) => ({ value: d.designationId, label: d.designationName })) },
    { name: 'shift', label: 'Shift (free text)', type: 'text' },
    { name: 'joiningDate', label: 'Joining Date', type: 'date' },
    { name: 'address', label: 'Address', type: 'textarea', rows: 2, full: true },
    { name: 'photo', label: 'Photo', type: 'image', nameField: 'photoName' },
    { name: 'emergencyName', label: 'Emergency Contact Name' },
    { name: 'emergencyNumber', label: 'Emergency Contact Number', type: 'tel' },
    { name: 'emergencyRelation', label: 'Emergency Contact Relation' },
    { name: 'isActive', label: 'Active', type: 'checkbox', checkboxLabel: 'Active' },
  ]

  return (
    <MasterCrud
      title="Employee"
      idKey="employeeId"
      moduleKey="employee"
      statusKey="isActive"
      formCols={3}
      formWide
      api={{ list: getEmployees, getById: getEmployee, save: saveEmployee, setActive: setEmployeeActive, remove: deleteEmployee }}
      columns={[
        { key: 'employeeCode', label: 'Code' },
        { key: 'name', label: 'Name' },
        { key: 'departmentName', label: 'Department', render: (r) => r.departmentName || '—' },
        { key: 'designationName', label: 'Designation', render: (r) => r.designationName || '—' },
        { key: 'shift', label: 'Shift', render: (r) => r.shift || '—' },
        { key: 'joiningDate', label: 'Joining', render: (r) => fmt(r.joiningDate) || '—' },
        { key: 'mobile', label: 'Mobile', render: (r) => r.mobile || '—' },
      ]}
      searchText={(r) => `${r.employeeCode} ${r.name} ${r.email || ''} ${r.mobile || ''} ${r.departmentName || ''} ${r.designationName || ''}`}
      emptyForm={{
        employeeCode: '', name: '', email: '', mobile: '', departmentId: '', designationId: '', shift: '', joiningDate: '', isActive: true,
        gender: '', dateOfBirth: '', maritalStatus: '', bloodGroup: '', nationality: '', address: '', photo: null, photoName: '',
        emergencyName: '', emergencyNumber: '', emergencyRelation: '',
      }}
      fields={fields}
      fromRow={(r) => ({
        employeeCode: r.employeeCode, name: r.name, email: r.email || '', mobile: r.mobile || '',
        departmentId: r.departmentId ? String(r.departmentId) : '',
        designationId: r.designationId ? String(r.designationId) : '',
        shift: r.shift || '', joiningDate: fmt(r.joiningDate), isActive: r.isActive,
        gender: r.gender || '', dateOfBirth: fmt(r.dateOfBirth), maritalStatus: r.maritalStatus || '',
        bloodGroup: r.bloodGroup || '', nationality: r.nationality || '', address: r.address || '',
        photo: r.photo || null, photoName: r.photoName || '',
        emergencyName: r.emergencyName || '', emergencyNumber: r.emergencyNumber || '', emergencyRelation: r.emergencyRelation || '',
      })}
      toPayload={(f) => ({
        employeeCode: f.employeeCode.trim(),
        name: f.name.trim(),
        email: (f.email || '').trim() || null,
        mobile: (f.mobile || '').trim() || null,
        departmentId: f.departmentId ? Number(f.departmentId) : null,
        designationId: f.designationId ? Number(f.designationId) : null,
        shift: (f.shift || '').trim() || null,
        joiningDate: f.joiningDate || null,
        isActive: f.isActive,
        gender: f.gender || null,
        dateOfBirth: f.dateOfBirth || null,
        maritalStatus: f.maritalStatus || null,
        bloodGroup: f.bloodGroup || null,
        nationality: (f.nationality || '').trim() || null,
        address: (f.address || '').trim() || null,
        photo: f.photo || null,
        photoName: f.photoName || null,
        emergencyName: (f.emergencyName || '').trim() || null,
        emergencyNumber: (f.emergencyNumber || '').trim() || null,
        emergencyRelation: (f.emergencyRelation || '').trim() || null,
      })}
    />
  )
}
