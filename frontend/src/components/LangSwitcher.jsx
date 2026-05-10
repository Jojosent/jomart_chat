import { useTranslation } from 'react-i18next'

export function LangSwitcher() {
    const { i18n } = useTranslation()
    const langs = [
        { code: 'ru', label: 'RU' },
        { code: 'en', label: 'EN' },
        { code: 'kk', label: 'KZ' },
    ]
    const handle = (code) => { i18n.changeLanguage(code); localStorage.setItem('lang', code) }

    return (
        <div style={ls.wrap}>
            {langs.map(l => {
                const active = i18n.language === l.code
                return (
                    <button
                        key={l.code}
                        style={{
                            ...ls.btn,
                            background: active ? 'var(--accent)' : 'transparent',
                            color: active ? '#fff' : 'var(--text-muted)',
                            fontWeight: active ? '700' : '500',
                            boxShadow: active ? 'var(--shadow-xs)' : 'none',
                        }}
                        onClick={() => handle(l.code)}
                    >
                        {l.label}
                    </button>
                )
            })}
        </div>
    )
}

const ls = {
    wrap: {
        display: 'flex', flex: 1,
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: '8px', padding: '3px', gap: '2px',
    },
    btn: {
        flex: 1, border: 'none', borderRadius: '6px',
        padding: '4px 0', fontSize: '11px',
        cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: 'inherit', letterSpacing: '0.04em',
    },
}

