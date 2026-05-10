import { useState } from 'react'
import { translateText } from '../api/translate'
import { Globe, X, RotateCcw, Loader } from 'lucide-react'

const LANGS = {
    ru: { label: 'RU', full: 'Russian' },
    en: { label: 'EN', full: 'English' },
    kk: { label: 'KZ', full: 'Kazakh' },
}

export default function TranslateButton({ text, isMine }) {
    const [step, setStep] = useState('idle') // idle | pick | loading | done | error
    const [translated, setTranslated] = useState('')
    const [detectedLang, setDetectedLang] = useState('')
    const [targetLang, setTargetLang] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const handleTranslate = async (lang) => {
        setStep('loading')
        try {
            const res = await translateText(text, lang)
            setTranslated(res.data.translated)
            setDetectedLang(res.data.detectedLang)
            setTargetLang(lang)
            setStep('done')
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Error')
            setStep('error')
        }
    }

    const reset = () => setStep('idle')

    const textColor = isMine ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)'
    const dividerColor = isMine ? 'rgba(255,255,255,0.12)' : 'var(--border)'

    // ── idle: просто кнопка ──────────────────────────────────
    if (step === 'idle') return (
        <button
            style={{ ...s.btn, color: textColor }}
            onClick={() => setStep('pick')}
        >
            <Globe size={11} />
            Translate
        </button>
    )

    // ── pick: три кнопки языка в ряд ────────────────────────
    if (step === 'pick') return (
        <div style={s.pickRow}>
            {Object.entries(LANGS).map(([code, { label }]) => (
                <button
                    key={code}
                    style={{ ...s.langBtn, color: textColor, borderColor: dividerColor }}
                    onClick={() => handleTranslate(code)}
                >
                    {label}
                </button>
            ))}
            <button style={{ ...s.iconBtn, color: textColor }} onClick={reset}>
                <X size={12} />
            </button>
        </div>
    )

    // ── loading ──────────────────────────────────────────────
    if (step === 'loading') return (
        <div style={{ ...s.btn, color: textColor, cursor: 'default' }}>
            <Loader size={11} style={{ animation: 'spin 0.8s linear infinite' }} />
            Translating...
        </div>
    )

    // ── error ────────────────────────────────────────────────
    if (step === 'error') return (
        <div style={s.pickRow}>
            <span style={{ ...s.btn, color: 'var(--error)', cursor: 'default' }}>{errorMsg}</span>
            <button style={{ ...s.iconBtn, color: textColor }} onClick={reset}>
                <X size={12} />
            </button>
        </div>
    )

    // ── done: результат ──────────────────────────────────────
    if (step === 'done') return (
        <div style={{ marginTop: '8px' }}>
            <div style={{ ...s.divider, background: dividerColor }} />
            <div style={s.resultHeader}>
                <span style={{ ...s.meta, color: textColor }}>
                    {LANGS[detectedLang]?.label ?? detectedLang}
                    {' → '}
                    {LANGS[targetLang]?.label ?? targetLang}
                </span>
                <div style={{ display: 'flex', gap: '2px' }}>
                    <button
                        style={{ ...s.iconBtn, color: textColor }}
                        onClick={() => setStep('pick')}
                        title="Change language"
                    >
                        <RotateCcw size={11} />
                    </button>
                    <button style={{ ...s.iconBtn, color: textColor }} onClick={reset}>
                        <X size={11} />
                    </button>
                </div>
            </div>
            <p style={{
                ...s.resultText,
                color: isMine ? 'rgba(255,255,255,0.88)' : 'var(--text-primary)',
            }}>
                {translated}
            </p>
        </div>
    )

    return null
}

const s = {
    btn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'transparent',
        border: 'none',
        padding: '3px 0',
        fontSize: '11px',
        fontWeight: '500',
        cursor: 'pointer',
        fontFamily: 'inherit',
        marginTop: '5px',
    },
    pickRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        marginTop: '6px',
        flexWrap: 'wrap',
    },
    langBtn: {
        background: 'transparent',
        border: '1px solid',
        borderRadius: '6px',
        padding: '3px 9px',
        fontSize: '11px',
        fontWeight: '700',
        cursor: 'pointer',
        fontFamily: 'inherit',
        letterSpacing: '0.04em',
        transition: 'opacity 0.12s',
    },
    iconBtn: {
        background: 'transparent',
        border: 'none',
        padding: '3px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        borderRadius: '4px',
    },
    divider: {
        height: '1px',
        borderRadius: '1px',
        marginBottom: '6px',
    },
    resultHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '4px',
    },
    meta: {
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
    },
    resultText: {
        fontSize: '13px',
        lineHeight: '1.55',
        fontStyle: 'italic',
        margin: 0,
    },
}