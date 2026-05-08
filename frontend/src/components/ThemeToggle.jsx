import useThemeStore from '../store/themeStore'

export default function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore()
    const isDark = theme === 'dark'

    return (
        <button
            style={{
                ...styles.toggle,
                background: isDark ? '#2a2a45' : '#e8e8f8',
            }}
            onClick={toggleTheme}
            title={isDark ? 'Switch to light' : 'Switch to dark'}
        >
            <div style={{
                ...styles.thumb,
                transform: isDark ? 'translateX(0px)' : 'translateX(20px)',
                background: isDark ? '#7c6af7' : '#6c5ce7',
            }}>
                <span style={styles.icon}>{isDark ? '🌙' : '☀️'}</span>
            </div>
        </button>
    )
}

const styles = {
    toggle: {
        width: '48px',
        height: '26px',
        borderRadius: '13px',
        border: 'none',
        cursor: 'pointer',
        padding: '3px',
        position: 'relative',
        transition: 'background 0.3s ease',
        flexShrink: 0,
    },
    thumb: {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.3s ease, background 0.3s ease',
        fontSize: '11px',
    },
    icon: {
        lineHeight: 1,
    },
}