import { useState, useEffect } from 'react'
import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications'
import { acceptInvite, declineInvite } from '../api/group'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, MessageSquare, Users, DoorOpen, Crown, CheckCheck, X, Check, X as XIcon } from 'lucide-react'

export function NotificationPanel({ onClose, onCountChange }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchNotifications()
        if (Notification.permission === 'default') Notification.requestPermission()
    }, [])

    const fetchNotifications = async () => {
        try { const res = await getNotifications(); setNotifications(res.data) }
        finally { setLoading(false) }
    }

    const handleRead = async (n) => {
        if (!n.read && n.type !== 'GROUP_INVITE') {
            await markAsRead(n.id)
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
            if (onCountChange) onCountChange()
        }

        if (n.type === 'GROUP_INVITE' && n.status === 'PENDING') {
            // Не закрываем панель, даем пользователю нажать принять/отклонить
            return
        }

        if (n.referenceType === 'CHAT') navigate('/chat')
        else if (n.referenceType === 'GROUP') navigate(`/groups/${n.referenceId}/settings`)
        onClose()
    }

    const handleAccept = async (e, n) => {
        e.stopPropagation()
        try {
            await acceptInvite(n.referenceId)
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, status: 'ACCEPTED', read: true } : x))
            if (onCountChange) onCountChange()
            navigate('/chat')
            onClose()
        } catch (err) {
            console.error(err)
        }
    }

    const handleDecline = async (e, n) => {
        e.stopPropagation()
        try {
            await declineInvite(n.referenceId)
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, status: 'DECLINED', read: true } : x))
            if (onCountChange) onCountChange()
        } catch (err) {
            console.error(err)
        }
    }

    const handleReadAll = async () => {
        await markAllAsRead()
        setNotifications(prev => prev.map(x => ({ ...x, read: true })))
        if (onCountChange) onCountChange()
    }

    const typeIcon = (type) => {
        const props = { size: 14 }
        switch (type) {
            case 'NEW_MESSAGE': return <MessageSquare {...props} />
            case 'GROUP_INVITE': return <Users {...props} />
            case 'GROUP_REMOVED': return <DoorOpen {...props} />
            case 'ADMIN_TRANSFERRED': return <Crown {...props} />
            default: return <Bell {...props} />
        }
    }

    const typeColor = (type) => {
        switch (type) {
            case 'NEW_MESSAGE': return '#6366f1'
            case 'GROUP_INVITE': return '#10b981'
            case 'GROUP_REMOVED': return '#ef4444'
            case 'ADMIN_TRANSFERRED': return '#f59e0b'
            default: return '#6366f1'
        }
    }

    const timeAgo = (d) => {
        const diff = Date.now() - new Date(d).getTime()
        const m = Math.floor(diff / 60000)
        if (m < 1) return t('notifications.justNow')
        if (m < 60) return `${m}${t('notifications.minutesAgo')}`
        const h = Math.floor(m / 60)
        if (h < 24) return `${h}${t('notifications.hoursAgo')}`
        return `${Math.floor(h / 24)}${t('notifications.daysAgo')}`
    }

    const unread = notifications.filter(n => !n.read)

    return (
        <>
            {/* Backdrop — закрывает по клику вне */}
            <div style={np.backdrop} onClick={onClose} />

            {/* Panel — фиксированный, всегда в видимой зоне */}
            <div style={np.panel}>
                {/* Header */}
                <div style={np.header}>
                    <div style={np.headerLeft}>
                        <span style={np.title}>{t('notifications.title')}</span>
                        {unread.length > 0 && (
                            <span style={np.badge}>{unread.length}</span>
                        )}
                    </div>
                    <div style={np.headerRight}>
                        {unread.length > 0 && (
                            <button style={np.readAllBtn} onClick={handleReadAll}>
                                <CheckCheck size={13} />
                                {t('notifications.readAll')}
                            </button>
                        )}
                        <button style={np.closeBtn} onClick={onClose}>
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div style={np.list}>
                    {loading ? (
                        <div style={np.empty}>
                            <div style={np.emptySpinner} />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div style={np.empty}>
                            <div style={np.emptyIconWrap}>
                                <Bell size={20} color="var(--text-muted)" />
                            </div>
                            <p style={np.emptyTitle}>{t('notifications.empty')}</p>
                            <p style={np.emptyHint}>{t('notifications.allCaughtUp')}</p>
                        </div>
                    ) : (
                        notifications.map(n => {
                            const color = typeColor(n.type)
                            return (
                                <div
                                    key={n.id}
                                    style={{
                                        ...np.item,
                                        background: n.read ? 'transparent' : 'var(--bg-glass)',
                                    }}
                                    onClick={() => handleRead(n)}
                                >
                                    <div style={{
                                        ...np.iconWrap,
                                        background: `${color}18`,
                                        border: `1px solid ${color}30`,
                                        color,
                                    }}>
                                        {n.sender?.avatarUrl
                                            ? <img src={n.sender.avatarUrl} style={np.senderAvatar} alt="" />
                                            : typeIcon(n.type)
                                        }
                                    </div>

                                    <div style={np.content}>
                                        <div style={np.itemHeader}>
                                            <span style={np.itemTitle}>{n.title}</span>
                                            {!n.read && <div style={{ ...np.unreadDot, background: color }} />}
                                        </div>
                                        <p style={np.itemBody}>{n.body}</p>

                                        {n.type === 'GROUP_INVITE' && n.status === 'PENDING' && (
                                            <div style={np.actions}>
                                                <button style={np.acceptBtn} onClick={(e) => handleAccept(e, n)}>
                                                    <Check size={12} /> {t('notifications.accept')}
                                                </button>
                                                <button style={np.declineBtn} onClick={(e) => handleDecline(e, n)}>
                                                    <XIcon size={12} /> {t('notifications.decline')}
                                                </button>
                                            </div>
                                        )}
                                        {n.type === 'GROUP_INVITE' && n.status !== 'PENDING' && (
                                            <span style={{
                                                ...np.statusLabel,
                                                color: n.status === 'ACCEPTED' ? '#10b981' : '#ef4444'
                                            }}>
                                                {n.status === 'ACCEPTED' ? t('notifications.accepted') : t('notifications.declined')}
                                            </span>
                                        )}

                                        <span style={np.itemTime}>{timeAgo(n.createdAt)}</span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </>
    )
}

const np = {
    /* Прозрачный backdrop на весь экран */
    backdrop: {
        position: 'fixed',
        inset: 0,
        zIndex: 199,
    },

    /* Панель — fixed, привязана к левому краю sidebar */
    panel: {
        position: 'fixed',
        top: '56px',            // высота header
        left: '300px',          // ширина sidebar
        width: '340px',
        maxHeight: 'calc(100vh - 72px)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 200,
        fontFamily: "'Inter', sans-serif",
        animation: 'fadeUp 0.15s ease',
    },

    header: {
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '6px' },
    title: {
        fontSize: '14px', fontWeight: '700',
        color: 'var(--text-primary)', letterSpacing: '-0.02em',
    },
    badge: {
        background: 'var(--accent)', color: '#fff',
        borderRadius: '999px', padding: '1px 7px',
        fontSize: '11px', fontWeight: '700',
    },
    readAllBtn: {
        display: 'flex', alignItems: 'center', gap: '5px',
        background: 'transparent', border: 'none',
        color: 'var(--accent)', fontSize: '12px',
        fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
    },
    closeBtn: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '7px', padding: '5px', cursor: 'pointer',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
    },

    list: { overflowY: 'auto', flex: 1 },

    empty: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', gap: '8px',
    },
    emptySpinner: {
        width: '20px', height: '20px',
        border: '2px solid var(--border)',
        borderTop: '2px solid var(--accent)',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    },
    emptyIconWrap: {
        width: '44px', height: '44px', borderRadius: '12px',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '4px',
    },
    emptyTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' },
    emptyHint: { fontSize: '12px', color: 'var(--text-muted)' },

    item: {
        display: 'flex', gap: '12px', padding: '12px 16px',
        cursor: 'pointer', borderBottom: '1px solid var(--border)',
        transition: 'background 0.12s',
    },
    iconWrap: {
        width: '36px', height: '36px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden',
    },
    senderAvatar: { width: '100%', height: '100%', objectFit: 'cover' },
    content: { flex: 1, minWidth: 0 },
    itemHeader: {
        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px',
    },
    itemTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' },
    unreadDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
    itemBody: {
        fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        marginBottom: '4px', margin: 0,
    },
    itemTime: { fontSize: '11px', color: 'var(--text-muted)' },

    actions: {
        display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '4px',
    },
    acceptBtn: {
        background: '#10b981', color: '#fff', border: 'none',
        borderRadius: '6px', padding: '4px 10px', fontSize: '11px',
        fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
    },
    declineBtn: {
        background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '4px 10px', fontSize: '11px',
        fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
    },
    statusLabel: {
        fontSize: '11px', fontWeight: '600', display: 'block', marginTop: '4px', marginBottom: '4px',
    },
}