import useThemeStore from '../store/themeStore'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore()
    const isDark = theme === 'dark'

    return (
        <button
            style={{
                ...tt.btn,
                background: isDark ? 'var(--bg-elevated)' : 'var(--bg-tertiary)',
                borderColor: 'var(--border)',
            }}
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark
                ? <Moon size={15} color="var(--accent-light)" />
                : <Sun size={15} color="var(--warning)" />
            }
        </button>
    )
}

const tt = {
    btn: {
        width: '32px', height: '32px',
        border: '1px solid',
        borderRadius: '8px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s, border-color 0.2s',
        flexShrink: 0,
    },
}


