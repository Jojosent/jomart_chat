// frontend/src/components/MediaMessage.jsx
import { useState, useEffect, useRef } from 'react'
import { getMediaBlobUrl } from '../api/media'
import { FileText, Download, Play, Loader, AlertCircle, X, ZoomIn } from 'lucide-react'

export default function MediaMessage({ media, isMine }) {
    const [blobUrl,  setBlobUrl]  = useState(null)
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState(false)
    const [lightbox, setLightbox] = useState(false)
    const [imgHover, setImgHover] = useState(false)
    const blobRef = useRef(null)

    useEffect(() => {
        let alive = true
        const load = async () => {
            try {
                const url = await getMediaBlobUrl(media.viewUrl)
                if (!alive) { URL.revokeObjectURL(url); return }
                blobRef.current = url
                setBlobUrl(url)
            } catch {
                if (alive) setError(true)
            } finally {
                if (alive) setLoading(false)
            }
        }
        load()
        return () => {
            alive = false
            if (blobRef.current) URL.revokeObjectURL(blobRef.current)
        }
    }, [media.viewUrl])

    // Закрытие лайтбокса по Escape
    useEffect(() => {
        if (!lightbox) return
        const handler = (e) => { if (e.key === 'Escape') setLightbox(false) }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [lightbox])

    const dimColor  = isMine ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)'
    const nameColor = isMine ? '#fff' : 'var(--text-primary)'

    // ── PHOTO ────────────────────────────────────────────────────
    if (media.mediaType === 'PHOTO') {
        return (
            <>
                <div
                    style={{
                        ...mm.photoWrap,
                        cursor: blobUrl ? 'pointer' : 'default',
                    }}
                    onClick={() => blobUrl && setLightbox(true)}
                    onMouseEnter={() => setImgHover(true)}
                    onMouseLeave={() => setImgHover(false)}
                >
                    {loading && (
                        <div style={mm.placeholder}>
                            <Loader size={22} color="var(--accent)"
                                style={{ animation: 'spin 0.8s linear infinite' }} />
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                Loading...
                            </span>
                        </div>
                    )}
                    {error && (
                        <div style={mm.placeholder}>
                            <AlertCircle size={22} color="var(--error)" />
                            <span style={{ fontSize: 12, color: 'var(--error)' }}>
                                Failed to load
                            </span>
                        </div>
                    )}
                    {blobUrl && (
                        <>
                            <img
                                src={blobUrl}
                                alt={media.fileName}
                                style={mm.photo}
                            />
                            {/* Hover-оверлей с иконкой зума */}
                            <div style={{
                                ...mm.photoOverlay,
                                opacity: imgHover ? 1 : 0,
                            }}>
                                <div style={mm.zoomIcon}>
                                    <ZoomIn size={18} color="#fff" />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Лайтбокс */}
                {lightbox && (
                    <div
                        style={mm.lightbox}
                        onClick={() => setLightbox(false)}
                    >
                        {/* Крестик */}
                        <button
                            style={mm.lightboxClose}
                            onClick={() => setLightbox(false)}
                        >
                            <X size={18} />
                        </button>

                        {/* Имя файла */}
                        <div style={mm.lightboxFileName}>
                            {media.fileName}
                        </div>

                        {/* Изображение */}
                        <img
                            src={blobUrl}
                            alt={media.fileName}
                            style={mm.lightboxImg}
                            onClick={e => e.stopPropagation()}
                        />

                        {/* Скачать */}
                        <a
                            href={blobUrl}
                            download={media.fileName}
                            style={mm.lightboxDownload}
                            onClick={e => e.stopPropagation()}
                        >
                            <Download size={15} />
                            Save photo
                        </a>
                    </div>
                )}
            </>
        )
    }

    // ── VIDEO ────────────────────────────────────────────────────
    if (media.mediaType === 'VIDEO') {
        return (
            <div style={mm.videoWrap}>
                {loading && (
                    <div style={{ ...mm.placeholder, height: 160,
                        background: 'var(--bg-elevated)',
                        borderRadius: 10 }}>
                        <Loader size={22} color="var(--accent)"
                            style={{ animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ color: dimColor, fontSize: 12 }}>
                            Loading video...
                        </span>
                    </div>
                )}
                {error && (
                    <div style={{ ...mm.placeholder, height: 120,
                        background: 'var(--bg-elevated)',
                        borderRadius: 10 }}>
                        <AlertCircle size={22} color="var(--error)" />
                        <span style={{ fontSize: 12, color: 'var(--error)' }}>
                            Failed to load
                        </span>
                    </div>
                )}
                {blobUrl && (
                    <video
                        src={blobUrl}
                        controls
                        style={mm.video}
                        preload="metadata"
                    />
                )}
                <div style={mm.fileFooter}>
                    <Play size={12} color={dimColor} />
                    <span style={{ ...mm.fileName, color: nameColor }}>
                        {media.fileName}
                    </span>
                    <span style={{ ...mm.fileSize, color: dimColor }}>
                        {formatSize(media.fileSize)}
                    </span>
                </div>
            </div>
        )
    }

    // ── DOCUMENT ─────────────────────────────────────────────────
    return (
        <div style={{
            ...mm.docWrap,
            background: isMine
                ? 'rgba(255,255,255,0.1)'
                : 'var(--bg-elevated)',
            border: isMine
                ? '1px solid rgba(255,255,255,0.15)'
                : '1px solid var(--border)',
        }}>
            <div style={{
                ...mm.docIcon,
                background: isMine
                    ? 'rgba(255,255,255,0.15)' : 'var(--accent-bg)',
                color: isMine ? '#fff' : 'var(--accent)',
            }}>
                <FileText size={20} />
            </div>

            <div style={mm.docInfo}>
                <span style={{ ...mm.fileName, color: nameColor }}>
                    {media.fileName}
                </span>
                <span style={{ ...mm.fileSize, color: dimColor }}>
                    {formatSize(media.fileSize)}
                    {media.mimeType && (
                        <> · {media.mimeType.split('/')[1]?.toUpperCase()}</>
                    )}
                </span>
            </div>

            {loading && (
                <Loader size={16} color={dimColor}
                    style={{ animation: 'spin 0.8s linear infinite',
                        flexShrink: 0 }} />
            )}

            {blobUrl && !loading && (
                <a
                    href={blobUrl}
                    download={media.fileName}
                    style={{
                        ...mm.docDownload,
                        background: isMine
                            ? 'rgba(255,255,255,0.15)' : 'var(--accent-bg)',
                        color: isMine ? '#fff' : 'var(--accent)',
                        border: isMine
                            ? '1px solid rgba(255,255,255,0.2)'
                            : '1px solid var(--accent-bg-hover)',
                    }}
                    title="Download"
                >
                    <Download size={15} />
                </a>
            )}
        </div>
    )
}

function formatSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024)    return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
}

const mm = {
    photoWrap: {
        position: 'relative',
        borderRadius: '12px',
        overflow: 'hidden',
        maxWidth: '260px',
        minWidth: '120px',
        minHeight: '80px',
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-sm)',
    },
    placeholder: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '8px', padding: '28px',
        minHeight: '120px',
    },
    photo: {
        display: 'block', width: '100%',
        maxWidth: '260px', maxHeight: '320px',
        objectFit: 'cover',
    },
    photoOverlay: {
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.18s ease',
    },
    zoomIcon: {
        width: '44px', height: '44px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.18)',
        border: '1.5px solid rgba(255,255,255,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
    },

    // Lightbox
    lightbox: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.94)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.15s ease',
        padding: '60px 20px 80px',
    },
    lightboxClose: {
        position: 'fixed', top: '18px', right: '18px',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', borderRadius: '10px',
        width: '40px', height: '40px',
        fontSize: '18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
        zIndex: 2001,
    },
    lightboxFileName: {
        position: 'fixed', top: '20px', left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '13px', fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        maxWidth: '60vw',
        whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis',
        zIndex: 2001,
    },
    lightboxImg: {
        maxWidth: '90vw', maxHeight: '80vh',
        objectFit: 'contain', borderRadius: '10px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
    },
    lightboxDownload: {
        position: 'fixed', bottom: '24px', left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--accent)', color: '#fff',
        borderRadius: '12px', padding: '11px 22px',
        fontSize: '13px', fontWeight: '600',
        textDecoration: 'none',
        display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: 'var(--shadow-accent)',
        whiteSpace: 'nowrap',
        zIndex: 2001,
    },

    // Video
    videoWrap: {
        display: 'flex', flexDirection: 'column',
        gap: '6px', maxWidth: '280px',
    },
    video: {
        width: '100%', maxHeight: '220px',
        borderRadius: '10px', display: 'block',
        background: '#000',
    },
    fileFooter: {
        display: 'flex', alignItems: 'center', gap: '6px',
    },

    // Document
    docWrap: {
        display: 'flex', alignItems: 'center',
        gap: '10px', padding: '11px 13px',
        borderRadius: '12px', maxWidth: '280px',
    },
    docIcon: {
        width: '42px', height: '42px', borderRadius: '11px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    docInfo: {
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: '3px',
    },
    docDownload: {
        width: '36px', height: '36px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textDecoration: 'none', flexShrink: 0,
        transition: 'opacity 0.15s',
    },
    fileName: {
        fontSize: '13px', fontWeight: '600',
        whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis', display: 'block',
        maxWidth: '180px',
    },
    fileSize: { fontSize: '11px', fontWeight: '500' },
}