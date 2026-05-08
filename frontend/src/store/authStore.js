import { create } from 'zustand'

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    accessToken: localStorage.getItem('accessToken') || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),

    setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('user', JSON.stringify(user))
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, accessToken, isAuthenticated: true })
    },

    logout: () => {
        localStorage.clear()
        set({ user: null, accessToken: null, isAuthenticated: false })
    },

    updateUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user))
        set({ user })
    },
}))

export default useAuthStore