import api from './auth'

// Загрузить медиафайл
export const uploadMedia = (chatId, file, mediaType, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chatId', chatId)
    formData.append('mediaType', mediaType)

    return api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
            if (onProgress && e.total) {
                onProgress(Math.round((e.loaded * 100) / e.total))
            }
        },
    })
}


// Получить blob URL для просмотра (дешифровка на бэкенде)
export const getMediaBlobUrl = async (viewUrl) => {
    const res = await api.get(viewUrl, { responseType: 'blob' })
    return URL.createObjectURL(res.data)
}