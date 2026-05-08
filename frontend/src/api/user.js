import api from './auth'

export const getMyProfile = () => api.get('/users/me')
export const updateProfile = (data) => api.put('/users/me', data)
export const getUserByUsername = (username) => api.get(`/users/${username}`)
export const getUserById = (id) => api.get(`/users/id/${id}`)
export const searchUsers = (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`)

export const uploadAvatar = (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

export const deleteAvatar = () => api.delete('/users/me/avatar')