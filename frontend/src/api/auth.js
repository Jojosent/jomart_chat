import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Автоматически добавляем токен в каждый запрос
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Если токен истёк — пробуем refresh
api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true
            try {
                const refreshToken = localStorage.getItem('refreshToken')
                const res = await axios.post('/api/auth/refresh', { refreshToken })
                localStorage.setItem('accessToken', res.data.accessToken)
                original.headers.Authorization = `Bearer ${res.data.accessToken}`
                return api(original)
            } catch {
                localStorage.clear()
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export const registerUser = (data) => api.post('/auth/register', data)
export const verifyOtp = (data) => api.post('/auth/verify-otp', data)
export const resendOtp = (email) => api.post('/auth/resend-otp', { email })
export const loginUser = (data) => api.post('/auth/login', data)
export const refreshToken = (token) => api.post('/auth/refresh', { refreshToken: token })
export const getMe = () => api.get('/auth/me')

export default api