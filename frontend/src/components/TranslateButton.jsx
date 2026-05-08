import { useState } from 'react'
import { translateText } from '../api/translate'

const LANG_NAMES = {
    ru: 'Русский',
    en: 'English',
    kk: 'Қазақша',
}

const LANG_FLAGS = {
    ru: '🇷🇺',
    en: '🇺🇸',
    kk: '🇰🇿',
}

export default function TranslateButton({ text, isMine }) {
    const [translated, setTranslated] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showPicker, setShowPicker] = useState(false)
    const [detectedLang, setDetectedLang] = useState(null)
    const [targetLang, setTargetLang] = useState(null)

    const handleTranslate = async (lang) => {
        setShowPicker(false)
        setLoading(true)
        setTranslated(null)
        try {
            const res = await translateText(text, lang)
            setTranslated(res.data.translated)
            setDetectedLang(res.data.detectedLang)
            setTargetLang(lang)
        } catch (err) {
            // Показываем точную ошибку
            const errMsg = err.response?.data?.message || err.message || 'Ошибка перевода'
            console.error('Translation error:', errMsg)
            setTranslated('❌ ' + errMsg)
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setTranslated(null)
        setDetectedLang(null)
        setTargetLang(null)
        setShowPicker(false)
    }

    return (
        <div style={styles.wrapper}>
            {/* Кнопка перевода */}
            {!translated && (
                <div style={styles.btnRow}>
                    <button
                        style={{
                            ...styles.translateBtn,
                            opacity: loading ? 0.6 : 1,
                        }}
                        onClick={() => !loading && setShowPicker(!showPicker)}
                        disabled={loading}
                        title="Перевести"
                    >
                        {loading ? '⟳' : '🌐'}
                        <span style={styles.btnLabel}>
                            {loading ? 'Перевод...' : 'Перевести'}
                        </span>
                    </button>

                    {/* Выбор языка */}
                    {showPicker && (
                        <div style={{
                            ...styles.picker,
                            right: isMine ? 0 : 'auto',
                            left: isMine ? 'auto' : 0,
                        }}>
                            {Object.entries(LANG_NAMES).map(([code, name]) => (
                                <button
                                    key={code}
                                    style={styles.langBtn}
                                    onClick={() => handleTranslate(code)}
                                >
                                    <span>{LANG_FLAGS[code]}</span>
                                    <span>{name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Результат перевода */}
            {translated && (
                <div style={{
                    ...styles.result,
                    background: isMine
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(124,106,247,0.1)',
                    borderLeft: isMine
                        ? '2px solid rgba(255,255,255,0.3)'
                        : '2px solid #7c6af7',
                }}>
                    {/* Мета */}
                    <div style={styles.resultMeta}>
                        <span style={styles.metaText}>
                            {LANG_FLAGS[detectedLang] || '🌐'}
                            {' '}{LANG_NAMES[detectedLang] || detectedLang}
                            {' → '}
                            {LANG_FLAGS[targetLang]}
                            {' '}{LANG_NAMES[targetLang]}
                        </span>
                        <button style={styles.closeBtn} onClick={handleClose}>✕</button>
                    </div>

                    {/* Переведённый текст */}
                    <div style={styles.translatedText}>{translated}</div>

                    {/* Перевести на другой язык */}
                    <button
                        style={styles.retranslateBtn}
                        onClick={() => {
                            setTranslated(null)
                            setShowPicker(true)
                        }}
                    >
                        Другой язык
                    </button>
                </div>
            )}
        </div>
    )
}

const styles = {
    wrapper: {
        marginTop: '4px',
        position: 'relative',
    },
    btnRow: {
        position: 'relative',
        display: 'inline-block',
    },
    translateBtn: {
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.45)',
        cursor: 'pointer',
        fontSize: '12px',
        padding: '2px 6px',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'color 0.15s',
    },
    btnLabel: {
        fontSize: '11px',
    },
    picker: {
        position: 'absolute',
        bottom: '24px',
        background: '#1e1e3a',
        border: '1px solid #3d3d6e',
        borderRadius: '10px',
        padding: '4px',
        zIndex: 100,
        minWidth: '140px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
    },
    langBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        background: 'transparent',
        border: 'none',
        color: '#fff',
        padding: '8px 12px',
        fontSize: '13px',
        cursor: 'pointer',
        borderRadius: '7px',
        textAlign: 'left',
    },
    result: {
        borderRadius: '8px',
        padding: '8px 10px',
        marginTop: '4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    resultMeta: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metaText: {
        fontSize: '11px',
        color: 'rgba(255,255,255,0.5)',
    },
    closeBtn: {
        background: 'transparent',
        border: 'none',
        color: 'rgba(255,255,255,0.4)',
        cursor: 'pointer',
        fontSize: '11px',
        padding: '0 2px',
    },
    translatedText: {
        fontSize: '14px',
        color: '#fff',
        lineHeight: '1.5',
    },
    retranslateBtn: {
        background: 'transparent',
        border: 'none',
        color: '#7c6af7',
        fontSize: '11px',
        cursor: 'pointer',
        padding: 0,
        textAlign: 'left',
    },
}