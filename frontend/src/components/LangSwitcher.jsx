import { useTranslation } from 'react-i18next'

export default function LangSwitcher() {
    const { i18n } = useTranslation()

    const langs = [
        { code: 'ru', label: 'RU' },
        { code: 'en', label: 'EN' },
        { code: 'kk', label: 'KZ' },
    ]

    const handleChange = (code) => {
        i18n.changeLanguage(code)
        localStorage.setItem('lang', code)
    }

    return (
        <div style={styles.container}>
            {langs.map(lang => (
                <button
                    key={lang.code}
                    style={{
                        ...styles.btn,
                        background: i18n.language === lang.code ? '#7c6af7' : 'transparent',
                        color: i18n.language === lang.code ? '#fff' : '#666',
                        fontWeight: i18n.language === lang.code ? '700' : '400',
                    }}
                    onClick={() => handleChange(lang.code)}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    )
}

const styles = {
    container: {
        display: 'flex',
        background: '#1e1e38',
        border: '1px solid #2d2d4e',
        borderRadius: '6px',
        overflow: 'hidden',
        width: '100%',
    },
    btn: {
        flex: 1,
        border: 'none',
        padding: '4px 0',
        fontSize: '11px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: "'Segoe UI', sans-serif",
        letterSpacing: '0.3px',
    },
}