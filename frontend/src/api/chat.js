import api from './client'

export const getContacts = () => api.get('/chat/contacts').then((r) => r.data)
export const getConversation = (otherId) => api.get(`/chat/conversation/${otherId}`).then((r) => r.data)
export const sendMessage = (payload) => api.post('/chat/send', payload).then((r) => r.data)
export const markRead = (otherId) => api.post(`/chat/read/${otherId}`).then((r) => r.data)
export const heartbeat = () => api.post('/chat/heartbeat').then((r) => r.data)
export const getChatProfile = () => api.get('/chat/profile').then((r) => r.data)
export const updateChatProfile = (payload) => api.post('/chat/profile', payload).then((r) => r.data)
export const editMessage = (messageId, body) => api.post('/chat/edit', { messageId, body }).then((r) => r.data)
export const deleteMessage = (messageId) => api.delete(`/chat/message/${messageId}`).then((r) => r.data)
export const clearConversation = (otherId) => api.delete(`/chat/conversation/${otherId}`).then((r) => r.data)
export const purgeConversation = (otherId) => api.delete(`/chat/conversation/${otherId}/purge`).then((r) => r.data)
export const setNickname = (otherId, nickname) => api.post('/chat/nickname', { otherId, nickname }).then((r) => r.data)
export const getStorage = () => api.get('/chat/storage').then((r) => r.data)
export const reactToMessage = (messageId, emoji) => api.post('/chat/react', { messageId, emoji }).then((r) => r.data)
export const getChatDeleteLog = (from, to) =>
  api.get('/chat/delete-log', { params: { from: from || undefined, to: to || undefined } }).then((r) => r.data)
