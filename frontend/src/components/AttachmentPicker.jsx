import { useRef, useEffect } from 'react'
import { Image, FileText, Camera, X } from 'lucide-react'

const OPTIONS = [
    {
        key: 'PHOTO',
        label: 'Photo or Video',
        icon: <Image size={20} />,
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.12)',
        border: 'rgba(99,102,241,0.25)',
        accept: 'image/*,video/*',
    },
    {
        key: 'DOCUMENT',
        label: 'Document',
        icon: <FileText size={20} />,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.12)',
        border: 'rgba(16,185,129,0.25)',
        accept: '*/*',
    },
    {
        key: 'CAMERA',
        label: 'Camera',
        icon: <Camera size={20} />,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        border: 'rgba(245,158,11,0.25)',
        accept: 'image/*',
        capture: 'environment',
    },
]

export default function AttachmentPicker({ onSelect, onClose }) {
    const refs = {
        PHOTO: useRef(),
        DOCUMENT: useRef(),
        CAMERA: useRef(),
    }
    const wrapRef = useRef()

    // Закрываем по клику вне
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [onClose])

    const handleOptionClick = (opt) => {
        refs[opt.key].current.click()
    }

    const handleFileChange = (e, opt) => {
        const file = e.target.files?.[0]
        if (!file) return
        // CAMERA → тип PHOTO
        const mediaType = opt.key === 'CAMERA' ? 'PHOTO' : opt.key
        onSelect(file, mediaType)
        onClose()
        e.target.value = ''
    }

    return (
        <div ref={wrapRef} style={ap.wrap}>
            {/* Стрелка вниз */}
            <div style={ap.arrow} />

            {OPTIONS.map((opt, i) => (
                <div key={opt.key}>
                    <button
                        style={ap.option}
                        onClick={() => handleOptionClick(opt)}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = opt.bg
                            e.currentTarget.style.borderColor = opt.border
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.borderColor = 'transparent'
                        }}
                    >
                        <div style={{ ...ap.iconWrap, background: opt.bg, border: `1px solid ${opt.border}`, color: opt.color }}>
                            {opt.icon}
                        </div>
                        <span style={ap.label}>{opt.label}</span>
                    </button>

                    {i < OPTIONS.length - 1 && <div style={ap.divider} />}

                    {/* Скрытый input */}
                    <input
                        ref={refs[opt.key]}
                        type="file"
                        accept={opt.accept}
                        capture={opt.capture}
                        style={{ display: 'none' }}
                        onChange={e => handleFileChange(e, opt)}
                    />
                </div>
            ))}
        </div>
    )
}

const ap = {
    wrap: {
        position: 'absolute',
        bottom: 'calc(100% + 12px)',
        left: 0,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '8px',
        width: '220px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 200,
        animation: 'fadeUp 0.15s ease',
    },
    arrow: {
        position: 'absolute',
        bottom: '-7px',
        left: '20px',
        width: '12px',
        height: '12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderTop: 'none',
        borderLeft: 'none',
        transform: 'rotate(45deg)',
    },
    option: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        background: 'transparent',
        border: '1px solid transparent',
        borderRadius: '10px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.15s, border-color 0.15s',
        textAlign: 'left',
    },
    iconWrap: {
        width: '38px',
        height: '38px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
    },
    divider: {
        height: '1px',
        background: 'var(--border)',
        margin: '4px 0',
    },
}