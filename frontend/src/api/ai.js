import api from './auth'

export const sendAiMessage = (message) =>
    api.post('/ai/chat', { message })

export const getAiHistory = () =>
    api.get('/ai/history')

export const clearAiHistory = () =>
    api.delete('/ai/history')