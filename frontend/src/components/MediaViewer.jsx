import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Download, Forward, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

export default function MediaViewer({ media, blobUrl, onClose, onForward }) {
    const [zoom, setZoom] = useState(1)
    const [rotate, setRotate] = useState(0)
    const [dragging, setDragging] = useState(false)
    const [pos, setPos] = useState({ x: 0, y: 0 })
    const [dragStart, setDragStart] = useState(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true))
        const onKey = (e) => {
            if (e.key === 'Escape') handleClose()
            if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 4))
            if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.25))
            if (e.key === 'r' || e.key === 'R') setRotate(r => (r + 90) % 360)
        }
        window.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [])

    const handleClose = () => {
        setVisible(false)
        setTimeout(onClose, 180)
    }

    const handleForwardClick = (e) => {
        e.stopPropagation()
        setVisible(false)
        setTimeout(() => {
            onClose()
            if (onForward) onForward()
        }, 150)
    }

    const handleDownload = () => {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = media.fileName || 'photo'
        a.click()
    }

    const handleWheel = (e) => {
        e.preventDefault()
        if (e.deltaY < 0) setZoom(z => Math.min(z + 0.15, 4))
        else setZoom(z => {
            const next = Math.max(z - 0.15, 0.25)
            if (next <= 1) setPos({ x: 0, y: 0 })
            return next
        })
    }

    const handleMouseDown = (e) => {
        if (zoom <= 1) return
        e.preventDefault()
        setDragging(true)
        setDragStart({ x: e.clientX - pos.x, y: e.clientY - pos.y })
    }

    const handleMouseMove = (e) => {
        if (!dragging || !dragStart) return
        setPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }

    const handleMouseUp = () => { setDragging(false); setDragStart(null) }

    const handleReset = () => { setZoom(1); setRotate(0); setPos({ x: 0, y: 0 }) }

    if (!media) return null

    const content = (
        <div
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 99999,
                background: 'rgba(0,0,0,0.97)',
                display: 'flex',
                flexDirection: 'column',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.18s ease',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* ── Top bar ── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    height: '56px',
                    background: 'rgba(255,255,255,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                    flexShrink: 0,
                    gap: '12px',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* File info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden', flex: 1 }}>
                    <span style={{
                        color: '#fff', fontSize: '14px', fontWeight: '600',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        letterSpacing: '-0.01em',
                    }}>
                        {media.fileName || 'Photo'}
                    </span>
                    {media.fileSize && (
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>
                            {media.fileSize < 1024 * 1024
                                ? `${(media.fileSize / 1024).toFixed(0)} KB`
                                : `${(media.fileSize / (1024 * 1024)).toFixed(1)} MB`}
                        </span>
                    )}
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {/* Zoom group */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '2px',
                        background: 'rgba(255,255,255,0.07)',
                        borderRadius: '10px', padding: '3px',
                    }}>
                        <Btn icon={<ZoomOut size={15} />} onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} title="Zoom out (–)" />
                        <span style={{
                            color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '600',
                            minWidth: '38px', textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                        }}>
                            {Math.round(zoom * 100)}%
                        </span>
                        <Btn icon={<ZoomIn size={15} />} onClick={() => setZoom(z => Math.min(z + 0.25, 4))} title="Zoom in (+)" />
                        <Btn icon={<RotateCcw size={15} />} onClick={() => setRotate(r => (r + 90) % 360)} title="Rotate (R)" />
                    </div>

                    <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

                    <Btn
                        icon={<Forward size={17} />}
                        onClick={handleForwardClick}
                        title="Forward"
                        color="#818cf8"
                        hoverBg="rgba(99,102,241,0.2)"
                    />
                    <Btn
                        icon={<Download size={17} />}
                        onClick={handleDownload}
                        title="Download"
                    />

                    <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

                    <Btn
                        icon={<X size={17} />}
                        onClick={handleClose}
                        title="Close (Esc)"
                        color="#f87171"
                        hoverBg="rgba(239,68,68,0.2)"
                    />
                </div>
            </div>

            {/* ── Image area ── */}
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default',
                    padding: '24px',
                }}
                onClick={handleClose}
                onWheel={handleWheel}
            >
                <div
                    style={{
                        transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom}) rotate(${rotate}deg)`,
                        transition: dragging ? 'none' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transformOrigin: 'center',
                        userSelect: 'none',
                        lineHeight: 0,
                    }}
                    onClick={e => e.stopPropagation()}
                    onMouseDown={handleMouseDown}
                >
                    <img
                        src={blobUrl}
                        alt={media.fileName || 'photo'}
                        draggable={false}
                        style={{
                            display: 'block',
                            maxWidth: 'calc(100vw - 80px)',
                            maxHeight: 'calc(100vh - 130px)',
                            width: 'auto',
                            height: 'auto',
                            objectFit: 'contain',
                            borderRadius: '6px',
                            boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
                            pointerEvents: 'none',
                            userSelect: 'none',
                        }}
                    />
                </div>
            </div>

            {/* ── Bottom hint ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '16px', height: '36px',
                background: 'rgba(255,255,255,0.02)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                flexShrink: 0,
            }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.03em' }}>
                    Scroll to zoom · Drag to pan · R to rotate · Esc to close
                </span>
                {(zoom !== 1 || rotate !== 0) && (
                    <button
                        style={{
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px', padding: '3px 10px',
                            color: 'rgba(255,255,255,0.5)', fontSize: '11px',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                        onClick={handleReset}
                    >
                        Reset
                    </button>
                )}
            </div>
        </div>
    )

    // createPortal — рендерим прямо в document.body поверх всего
    return createPortal(content, document.body)
}

function Btn({ icon, onClick, title, color = 'rgba(255,255,255,0.8)', hoverBg = 'rgba(255,255,255,0.1)' }) {
    const [hov, setHov] = useState(false)
    return (
        <button
            style={{
                background: hov ? hoverBg : 'transparent',
                border: 'none',
                color: hov ? color : 'rgba(255,255,255,0.5)',
                padding: '7px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s, color 0.15s',
            }}
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            title={title}
        >
            {icon}
        </button>
    )
}