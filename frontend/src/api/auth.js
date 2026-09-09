import api from './client'

// Calls POST /api/auth/login and returns { token, expiresAt, username, displayName, role }
export async function login(username, password) {
  const { data } = await api.post('/auth/login', { username, password })
  return data
}

// Change password (verifies the old password server-side against the database).
export async function changePassword(username, oldPassword, newPassword) {
  const { data } = await api.post('/auth/change-password', { username, oldPassword, newPassword })
  return data
}
