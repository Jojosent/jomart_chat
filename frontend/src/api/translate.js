import api from './auth'

export const translateText = (text, targetLang) =>
    api.post('/translate', { text, targetLang })