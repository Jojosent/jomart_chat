import { useState, useRef, useEffect } from 'react'
import { X, Camera, RefreshCw, Check, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function CameraModal({ onClose, onCapture }) {
    const { t } = useTranslation()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [capturedImage, setCapturedImage] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        startCamera()
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    const startCamera = async () => {
        try {
            setLoading(true)
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            })
            setStream(mediaStream)
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
            }
            setLoading(false)
        } catch (err) {
            console.error('Camera error:', err)
            setError(t('camera.error', 'Could not access camera. Please check permissions.'))
            setLoading(false)
        }
    }

    const capture = () => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
            const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
            setCapturedImage({
                blob: URL.createObjectURL(blob),
                file: file
            })
        }, 'image/jpeg', 0.9)
    }

    const retake = () => {
        if (capturedImage) URL.revokeObjectURL(capturedImage.blob)
        setCapturedImage(null)
    }

    const confirm = () => {
        if (capturedImage) {
            onCapture(capturedImage.file)
            onClose()
        }
    }

    return (
        <div style={c.overlay}>
            <div style={c.modal}>
                <div style={c.header}>
                    <h3 style={f.title}>{t('camera.title', 'Camera')}</h3>
                    <button style={f.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div style={c.content}>
                    {!capturedImage ? (
                        <div style={c.previewWrap}>
                            {loading && <div style={c.status}>{t('camera.starting', 'Starting camera...')}</div>}
                            {error && <div style={c.status}>{error}</div>}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                style={{ ...c.video, display: (loading || error) ? 'none' : 'block' }}
                            />
                            {!loading && !error && (
                                <button style={c.captureBtn} onClick={capture}>
                                    <div style={c.captureBtnInner} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={c.previewWrap}>
                            <img src={capturedImage.blob} style={c.video} alt="Captured" />
                            <div style={c.actions}>
                                <button style={c.actionBtn} onClick={retake}>
                                    <Trash2 size={20} />
                                    <span>{t('camera.retake', 'Retake')}</span>
                                </button>
                                <button style={{ ...c.actionBtn, background: 'var(--accent)', color: '#fff' }} onClick={confirm}>
                                    <Check size={20} />
                                    <span>{t('chat.send')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    )
}

const f = {
    title: { fontSize: '17px', fontWeight: '700', margin: 0 },
    closeBtn: {
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
    },
}

const c = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        backdropFilter: 'blur(8px)',
    },
    modal: {
        background: 'var(--bg-secondary)', width: '100%', maxWidth: '500px',
        borderRadius: '24px', display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-2xl)', overflow: 'hidden',
    },
    header: {
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    content: { flex: 1, position: 'relative', background: '#000', minHeight: '300px' },
    previewWrap: {
        width: '100%', height: '100%', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    },
    video: { width: '100%', height: 'auto', maxHeight: '70vh', objectFit: 'contain' },
    status: { color: '#fff', fontSize: '14px', textAlign: 'center', padding: '20px' },
    captureBtn: {
        position: 'absolute', bottom: '24px', width: '64px', height: '64px',
        borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
    },
    captureBtnInner: {
        width: '100%', height: '100%', borderRadius: '50%',
        border: '2px solid #000',
    },
    actions: {
        position: 'absolute', bottom: '0', left: 0, right: 0,
        padding: '24px', display: 'flex', justifyContent: 'center', gap: '16px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.5))',
    },
    actionBtn: {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 20px', borderRadius: '12px', border: 'none',
        background: 'rgba(255,255,255,0.2)', color: '#fff',
        cursor: 'pointer', fontSize: '15px', fontWeight: '600',
        backdropFilter: 'blur(10px)',
    },
}
