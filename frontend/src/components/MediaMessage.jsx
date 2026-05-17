import { useState, useEffect } from 'react'
import { Download, FileText, Film, Image } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MediaViewer from './MediaViewer'

function useAuthBlob(url) {
    const [blobUrl, setBlobUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!url) return
        let objectUrl = null
        let cancelled = false
        const token = localStorage.getItem('accessToken')

        fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.blob()
            })
            .then(blob => {
                if (cancelled) return
                objectUrl = URL.createObjectURL(blob)
                setBlobUrl(objectUrl)
            })
            .catch(err => {
                if (!cancelled) {
                    console.error('Media load error:', err)
                    setError(true)
                }
            })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => {
            cancelled = true
            if (objectUrl) URL.revokeObjectURL(objectUrl)
        }
    }, [url])

    return { blobUrl, loading, error }
}

export default function MediaMessage({ media, isMine, onForward }) {
    const { t } = useTranslation()
    const { blobUrl, loading, error } = useAuthBlob(media?.viewUrl)
    const [showViewer, setShowViewer] = useState(false)

    const textColor = isMine ? 'rgba(255,255,255,0.9)' : 'var(--text-primary)'
    const mutedColor = isMine ? 'rgba(255,255,255,0.55)' : 'var(--text-muted)'
    const bgColor = isMine ? 'rgba(255,255,255,0.12)' : 'var(--bg-elevated)'
    const borderColor = isMine ? 'rgba(255,255,255,0.15)' : 'var(--border)'

    if (!media) return null

    const formatSize = (bytes) => {
        if (!bytes) return ''
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    // ── PHOTO ──────────────────────────────────────────────────────
    if (media.mediaType === 'PHOTO') {
        return (
            <>
                <div
                    style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        maxWidth: '280px',
                        minWidth: '120px',
                        minHeight: '80px',
                        background: 'var(--bg-elevated)',
                        position: 'relative',
                        cursor: blobUrl ? 'pointer' : 'default',
                    }}
                    onClick={() => blobUrl && setShowViewer(true)}
                >
                    {loading && (
                        <div style={{
                            width: '240px', height: '160px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'var(--bg-elevated)',
                        }}>
                            <div style={{
                                width: 20, height: 20,
                                border: '2px solid var(--border)',
                                borderTop: '2px solid var(--accent)',
                                borderRadius: '50%',
                                animation: 'spin 0.7s linear infinite',
                            }} />
                        </div>
                    )}
                    {error && (
                        <div style={{
                            width: '240px', height: '120px',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            gap: '8px', background: 'var(--bg-elevated)',
                            color: 'var(--text-muted)', fontSize: '13px',
                        }}>
                            <Image size={24} />
                            <span>{t('common.error')}</span>
                        </div>
                    )}
                    {blobUrl && (
                        <img
                            src={blobUrl}
                            alt={media.fileName || 'photo'}
                            style={{
                                display: 'block',
                                width: '100%',
                                maxWidth: '280px',
                                borderRadius: '12px',
                            }}
                        />
                    )}
                </div>

                {/* Viewer рендерим ВНЕ bubble — в портале через state */}
                {showViewer && (
                    <MediaViewer
                        media={media}
                        blobUrl={blobUrl}
                        onClose={() => setShowViewer(false)}
                        onForward={() => {
                            // Сначала закрываем viewer, потом открываем ForwardModal
                            setShowViewer(false)
                            // onForward вызовет setForwardMsgId в ChatPage
                            if (onForward) onForward()
                        }}
                    />
                )}
            </>
        )
    }

    // ── VIDEO ──────────────────────────────────────────────────────
    if (media.mediaType === 'VIDEO') {
        return (
            <div style={{ borderRadius: '12px', overflow: 'hidden', maxWidth: '300px' }}>
                {loading && (
                    <div style={{
                        width: '280px', height: '160px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--bg-elevated)',
                    }}>
                        <div style={{
                            width: 20, height: 20,
                            border: '2px solid var(--border)',
                            borderTop: '2px solid var(--accent)',
                            borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite',
                        }} />
                    </div>
                )}
                {error && (
                    <div style={{
                        width: '280px', height: '120px',
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: '8px', background: 'var(--bg-elevated)',
                        color: 'var(--text-muted)', fontSize: '13px',
                    }}>
                        <Film size={24} />
                        <span>{t('common.error')}</span>
                    </div>
                )}
                {blobUrl && (
                    <video
                        src={blobUrl}
                        controls
                        style={{
                            display: 'block',
                            width: '100%',
                            maxWidth: '300px',
                            borderRadius: '12px',
                        }}
                    />
                )}
            </div>
        )
    }

    // ── DOCUMENT / FILE ────────────────────────────────────────────
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '12px', padding: '10px 14px',
            minWidth: '200px', maxWidth: '280px',
        }}>
            <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: isMine ? 'rgba(255,255,255,0.15)' : 'var(--accent-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
            }}>
                <FileText size={18} color={isMine ? '#fff' : 'var(--accent)'} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '13px', fontWeight: '600', color: textColor,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {media.fileName || t('common.type')}
                </div>
                <div style={{ fontSize: '11px', color: mutedColor, marginTop: '2px' }}>
                    {formatSize(media.fileSize)}
                </div>
            </div>
            {blobUrl && (
                <a
                    href={blobUrl}
                    download={media.fileName || 'file'}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: isMine ? 'rgba(255,255,255,0.15)' : 'var(--accent-bg)',
                        flexShrink: 0, color: isMine ? '#fff' : 'var(--accent)',
                        textDecoration: 'none',
                    }}
                >
                    <Download size={14} />
                </a>
            )}
            {loading && (
                <div style={{
                    width: 16, height: 16,
                    border: '2px solid var(--border)',
                    borderTop: `2px solid ${isMine ? '#fff' : 'var(--accent)'}`,
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    flexShrink: 0,
                }} />
            )}
        </div>
    )
}