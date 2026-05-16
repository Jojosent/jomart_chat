import { X, Download, Forward, ChevronLeft, ChevronRight } from 'lucide-react'

import { useState } from 'react'

export default function MediaViewer({ media, blobUrl, onClose, onForward }) {
    const [hovBtn, setHovBtn] = useState(null) // 'forward', 'download', 'close'

    if (!media) return null

    const handleDownload = () => {
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = media.fileName || 'photo'
        a.click()
    }

    return (
        <div style={v.overlay} onClick={onClose}>
            <div style={v.topBar} onClick={e => e.stopPropagation()}>
                <div style={v.info}>
                    <span style={v.fileName}>{media.fileName}</span>
                </div>
                <div style={v.actions}>
                    <button
                        style={{ ...v.iconBtn, background: hovBtn === 'forward' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                        onClick={onForward}
                        onMouseEnter={() => setHovBtn('forward')}
                        onMouseLeave={() => setHovBtn(null)}
                        title="Forward"
                    >
                        <Forward size={20} />
                    </button>
                    <button
                        style={{ ...v.iconBtn, background: hovBtn === 'download' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                        onClick={handleDownload}
                        onMouseEnter={() => setHovBtn('download')}
                        onMouseLeave={() => setHovBtn(null)}
                        title="Download"
                    >
                        <Download size={20} />
                    </button>
                    <button
                        style={{
                            ...v.iconBtn,
                            marginLeft: '8px',
                            background: hovBtn === 'close' ? 'rgba(255,255,255,0.1)' : 'transparent'
                        }}
                        onClick={onClose}
                        onMouseEnter={() => setHovBtn('close')}
                        onMouseLeave={() => setHovBtn(null)}
                        title="Close"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div style={v.content} onClick={e => e.stopPropagation()}>
                <img src={blobUrl} style={v.image} alt="" />
            </div>
        </div>
    )
}

const v = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.95)', display: 'flex',
        flexDirection: 'column', zIndex: 3000,
        backdropFilter: 'blur(10px)',
    },
    topBar: {
        padding: '12px 20px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.4)',
    },
    info: { display: 'flex', flexDirection: 'column' },
    fileName: { color: '#fff', fontSize: '15px', fontWeight: '600' },
    actions: { display: 'flex', alignItems: 'center', gap: '4px' },
    iconBtn: {
        background: 'transparent', border: 'none', color: '#fff',
        padding: '10px', borderRadius: '10px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
    },
    content: {
        flex: 1, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '40px', overflow: 'hidden',
    },
    image: {
        maxWidth: '100%', maxHeight: '100%',
        objectFit: 'contain', borderRadius: '4px',
        boxShadow: '0 0 40px rgba(0,0,0,0.5)',
    },
}
