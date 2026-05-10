import { create } from 'zustand'
import { darkTheme, lightTheme } from '../styles/theme'

const applyTheme = (theme) => {
    const root = document.documentElement
    Object.entries(theme).forEach(([key, value]) => {
        root.style.setProperty(key, value)
    })
}

const savedTheme = localStorage.getItem('theme') || 'dark'
applyTheme(savedTheme === 'dark' ? darkTheme : lightTheme)

const useThemeStore = create((set) => ({
    theme: savedTheme,

    toggleTheme: () => set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark'
        localStorage.setItem('theme', next)
        document.body.classList.add('theme-transition')
        applyTheme(next === 'dark' ? darkTheme : lightTheme)
        setTimeout(() => document.body.classList.remove('theme-transition'), 250)
        return { theme: next }
    }),

    setTheme: (theme) => {
        localStorage.setItem('theme', theme)
        applyTheme(theme === 'dark' ? darkTheme : lightTheme)
        set({ theme })
    },
}))

export default useThemeStore