import api from './auth'

export const getMyChats         = ()           => api.get('/chats')
export const getOrCreatePrivate = (userId)     => api.post(`/chats/private/${userId}`)
export const getChatMessages    = (chatId)     => api.get(`/chats/${chatId}/messages`)
export const deleteMessage      = (messageId)  => api.delete(`/chats/messages/${messageId}`)