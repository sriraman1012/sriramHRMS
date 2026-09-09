import { createContext, useContext, useEffect, useState } from 'react'
import { getMyRights } from '../api/userManagement.js'

// Provides the logged-in user's effective rights and a can(moduleKey, action)
// helper used to gate the sidebar and action buttons.
const RightsContext = createContext({ ready: false, can: () => false })

const FIELD = { view: 'canView', add: 'canAdd', edit: 'canEdit', delete: 'canDelete', export: 'canExport' }

export function RightsProvider({ children }) {
  const [map, setMap] = useState(null) // null = loading

  useEffect(() => {
    let alive = true
    getMyRights()
      .then((rows) => {
        const m = {}
        // Keys are lower-cased so they always match the lowercase nav keys
        // (SQL Server is case-insensitive, so a module code may come back as
        // "USERS" while the nav key is "users").
        for (const r of rows || []) m[String(r.moduleCode).toLowerCase()] = r
        if (alive) setMap(m)
      })
      .catch(() => { if (alive) setMap({}) }) // on error, deny everything (fail closed)
    return () => { alive = false }
  }, [])

  const can = (key, action = 'view') => {
    if (!map) return false                       // still loading → deny
    const r = map[String(key).toLowerCase()]
    if (!r) return false                         // module not granted
    return !!r[FIELD[action] || 'canView']
  }

  return (
    <RightsContext.Provider value={{ ready: map !== null, can }}>
      {children}
    </RightsContext.Provider>
  )
}

export const useRights = () => useContext(RightsContext)
