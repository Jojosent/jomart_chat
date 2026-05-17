// frontend/src/components/StickerPicker.jsx
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

export default function StickerPicker({ onSelect, onClose }) {
    const { t } = useTranslation()

    const STICKER_CATEGORIES = [
        {
            id: 'faces', label: '😀', title: t('stickers.faces', 'Emotions'),
            stickers: [
                '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎',
                '🤩', '🥳', '😏', '😒', '😔', '😢', '😭', '😤',
                '😡', '🤬', '😱', '😨', '🤯', '🥴', '😴', '🤔',
                '🤗', '😇', '🙃', '😜', '🤪', '🥸', '🤓', '😋',
            ],
        },
        {
            id: 'gestures', label: '👋', title: t('stickers.gestures', 'Gestures'),
            stickers: [
                '👋', '✌️', '🤞', '🤙', '👍', '👎', '👏', '🙌',
                '🤝', '💪', '🫶', '❤️', '🧡', '💛', '💚', '💙',
                '💜', '🖤', '🤍', '💔', '💯', '🔥', '⚡', '✨',
                '🎉', '🎊', '🎁', '🏆', '🥇', '👑', '💎', '🌟',
            ],
        },
        {
            id: 'animals', label: '🐱', title: t('stickers.animals', 'Animals'),
            stickers: [
                '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
                '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦋',
                '🐢', '🦄', '🐉', '🦕', '🦖', '🦀', '🐙', '🦑',
                '🐬', '🦈', '🦜', '🦩', '🦚', '🦉', '🦅', '🐧',
            ],
        },
        {
            id: 'food', label: '🍕', title: t('stickers.food', 'Food'),
            stickers: [
                '🍕', '🍔', '🌮', '🌯', '🍜', '🍣', '🍩', '🎂',
                '🍰', '🍦', '🍫', '🍭', '🧁', '🥐', '🥑', '🍓',
                '🍇', '🍊', '🍋', '🍉', '🍌', '🥝', '🍒', '🍑',
                '☕', '🧋', '🥤', '🍺', '🥂', '🍾', '🍵', '🧃',
            ],
        },
        {
            id: 'travel', label: '✈️', title: t('stickers.travel', 'Travel'),
            stickers: [
                '✈️', '🚀', '🛸', '🚂', '🚗', '🏎️', '🛵', '🚲',
                '⛵', '🚢', '🌍', '🏖️', '🏔️', '🗼', '🏰', '🗽',
                '🌅', '🌄', '🌠', '🌃', '🌆', '🌇', '🎡', '🎢',
                '🎠', '🎪', '🎭', '🎬', '🎮', '🕹️', '🎲', '🎯',
            ],
        },
    ]
    const [activeCategory, setActiveCategory] = useState('faces')
    const [hovered, setHovered] = useState(null)
    const wrapRef = useRef()

    // Закрытие по клику вне
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                onClose()
            }
        }
        // Небольшая задержка — чтобы не закрылось сразу при открытии
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handler)
        }, 50)
        return () => {
            clearTimeout(timer)
            document.removeEventListener('mousedown', handler)
        }
    }, [onClose])

    const currentCat = STICKER_CATEGORIES.find(c => c.id === activeCategory)

    return (
        <div ref={wrapRef} style={sp.wrap}>
            <div style={sp.arrow} />

            <div style={sp.header}>
                <span style={sp.headerTitle}>{currentCat?.title}</span>
            </div>

            <div style={sp.tabs}>
                {STICKER_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        style={{
                            ...sp.tab,
                            background: activeCategory === cat.id
                                ? 'var(--accent-bg)' : 'transparent',
                            border: activeCategory === cat.id
                                ? '1px solid var(--accent-bg-hover)'
                                : '1px solid transparent',
                        }}
                        onClick={() => setActiveCategory(cat.id)}
                        title={cat.title}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div style={sp.grid}>
                {currentCat?.stickers.map((sticker, i) => (
                    <button
                        key={i}
                        style={{
                            ...sp.sticker,
                            background: hovered === `${activeCategory}-${i}`
                                ? 'var(--bg-elevated)' : 'transparent',
                            transform: hovered === `${activeCategory}-${i}`
                                ? 'scale(1.3)' : 'scale(1)',
                        }}
                        onClick={() => { onSelect(sticker); onClose() }}
                        onMouseEnter={() => setHovered(`${activeCategory}-${i}`)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        {sticker}
                    </button>
                ))}
            </div>
        </div>
    )
}

const sp = {
    wrap: {
        position: 'absolute',
        bottom: 'calc(100% + 12px)',
        right: 0,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        width: '300px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 200,
        animation: 'fadeUp 0.15s ease',
        overflow: 'hidden',
    },
    arrow: {
        position: 'absolute',
        bottom: '-7px', right: '20px',
        width: '12px', height: '12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderTop: 'none', borderLeft: 'none',
        transform: 'rotate(45deg)',
        zIndex: 1,
    },
    header: {
        padding: '12px 16px 8px',
        borderBottom: '1px solid var(--border)',
    },
    headerTitle: {
        fontSize: '12px', fontWeight: '700',
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
    },
    tabs: {
        display: 'flex', gap: '4px',
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
    },
    tab: {
        flex: 1, padding: '6px', borderRadius: '8px',
        cursor: 'pointer', fontSize: '18px', lineHeight: 1,
        transition: 'background 0.12s, border-color 0.12s',
        fontFamily: 'inherit',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '2px', padding: '10px 12px',
        maxHeight: '200px', overflowY: 'auto',
    },
    sticker: {
        padding: '6px', borderRadius: '8px',
        border: 'none', cursor: 'pointer',
        fontSize: '20px', lineHeight: 1,
        transition: 'background 0.1s, transform 0.1s',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
}