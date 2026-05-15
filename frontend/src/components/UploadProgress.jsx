export default function UploadProgress({ fileName, progress }) {
    return (
        <div style={up.wrap}>
            <div style={up.info}>
                <span style={up.name}>{fileName}</span>
                <span style={up.pct}>{progress}%</span>
            </div>
            <div style={up.track}>
                <div style={{ ...up.bar, width: `${progress}%` }} />
            </div>
        </div>
    )
}

const up = {
    wrap: {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '260px',
        animation: 'fadeUp 0.15s ease',
    },
    info: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '160px',
    },
    pct: {
        fontSize: '12px',
        fontWeight: '700',
        color: 'var(--accent)',
        flexShrink: 0,
    },
    track: {
        height: '4px',
        background: 'var(--border)',
        borderRadius: '999px',
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        background: 'linear-gradient(90deg, #6366f1, #818cf8)',
        borderRadius: '999px',
        transition: 'width 0.2s ease',
    },
}