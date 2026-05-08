import { useState, useEffect } from 'react'
import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications'
import { useNavigate } from 'react-router-dom'

export default function NotificationPanel({ onClose, onCountChange }) {
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchNotifications()
        // Запрашиваем разрешение на браузерные уведомления
        if (Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    const fetchNotifications = async () => {
        try {
            const res = await getNotifications()
            setNotifications(res.data)
        } finally {
            setLoading(false)
        }
    }

    const handleRead = async (n) => {
        if (!n.read) {
            await markAsRead(n.id)
            setNotifications(prev =>
                prev.map(x => x.id === n.id ? { ...x, read: true } : x)
            )
            if (onCountChange) onCountChange()
        }
        // Навигация по типу
        if (n.referenceType === 'CHAT') {
            navigate('/chat')
        } else if (n.referenceType === 'GROUP') {
            navigate(`/groups/${n.referenceId}/settings`)
        }
        onClose()
    }

    const handleReadAll = async () => {
        await markAllAsRead()
        setNotifications(prev => prev.map(x => ({ ...x, read: true })))
        if (onCountChange) onCountChange()
    }

    const getIcon = (type) => {
        switch (type) {
            case 'NEW_MESSAGE': return '💬'
            case 'GROUP_INVITE': return '👥'
            case 'GROUP_REMOVED': return '🚪'
            case 'ADMIN_TRANSFERRED': return '👑'
            default: return '🔔'
        }
    }

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'только что'
        if (mins < 60) return `${mins} мин назад`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs} ч назад`
        return `${Math.floor(hrs / 24)} дн назад`
    }

    const unread = notifications.filter(n => !n.read)

    return (
        <div style={styles.panel}>
            {/* Хедер */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    <span style={styles.title}>🔔 Уведомления</span>
                    {unread.length > 0 && (
                        <span style={styles.badge}>{unread.length}</span>
                    )}
                </div>
                <div style={styles.headerRight}>
                    {unread.length > 0 && (
                        <button style={styles.readAllBtn} onClick={handleReadAll}>
                            Прочитать все
                        </button>
                    )}
                    <button style={styles.closeBtn} onClick={onClose}>✕</button>
                </div>
            </div>

            {/* Список */}
            <div style={styles.list}>
                {loading ? (
                    <div style={styles.empty}>Загрузка...</div>
                ) : notifications.length === 0 ? (
                    <div style={styles.empty}>
                        <div style={styles.emptyIcon}>🔔</div>
                        <div>Нет уведомлений</div>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            style={{
                                ...styles.item,
                                background: n.read ? 'transparent' : '#1e1e3a',
                                borderLeft: n.read ? '3px solid transparent' : '3px solid #7c6af7',
                            }}
                            onClick={() => handleRead(n)}
                        >
                            {/* Аватар отправителя или иконка */}
                            <div style={styles.iconWrap}>
                                {n.sender?.avatarUrl ? (
                                    <img src={n.sender.avatarUrl} style={styles.senderAvatar} alt="" />
                                ) : (
                                    <div style={styles.typeIcon}>{getIcon(n.type)}</div>
                                )}
                            </div>

                            {/* Контент */}
                            <div style={styles.content}>
                                <div style={styles.itemTitle}>
                                    {n.title}
                                    {!n.read && <span style={styles.dot} />}
                                </div>
                                <div style={styles.itemBody}>{n.body}</div>
                                <div style={styles.itemTime}>{timeAgo(n.createdAt)}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

const styles = {
    panel: {
        position: 'absolute',
        top: '56px',
        right: '8px',
        width: '360px',
        maxHeight: '500px',
        background: '#1a1a2e',
        border: '1px solid #2d2d4e',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 200,
        fontFamily: "'Segoe UI', sans-serif",
    },
    header: {
        padding: '16px 16px 12px',
        borderBottom: '1px solid #2d2d4e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '8px' },
    title: { fontSize: '16px', fontWeight: '700', color: '#fff' },
    badge: {
        background: '#7c6af7',
        color: '#fff',
        borderRadius: '10px',
        padding: '2px 8px',
        fontSize: '12px',
        fontWeight: '700',
    },
    readAllBtn: {
        background: 'transparent',
        border: 'none',
        color: '#7c6af7',
        fontSize: '12px',
        cursor: 'pointer',
        fontWeight: '600',
    },
    closeBtn: {
        background: '#2d2d4e',
        border: 'none',
        color: '#888',
        borderRadius: '6px',
        width: '28px',
        height: '28px',
        cursor: 'pointer',
        fontSize: '12px',
    },
    list: {
        overflowY: 'auto',
        flex: 1,
    },
    empty: {
        padding: '40px 20px',
        textAlign: 'center',
        color: '#555',
        fontSize: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
    },
    emptyIcon: { fontSize: '40px', opacity: 0.3 },
    item: {
        display: 'flex',
        gap: '12px',
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid #2d2d4e',
        transition: 'background 0.15s',
    },
    iconWrap: { flexShrink: 0 },
    senderAvatar: {
        width: '40px', height: '40px',
        borderRadius: '50%', objectFit: 'cover',
    },
    typeIcon: {
        width: '40px', height: '40px',
        borderRadius: '50%',
        background: '#2d2d4e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
    },
    content: { flex: 1, minWidth: 0 },
    itemTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#fff',
        marginBottom: '3px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    dot: {
        width: '8px', height: '8px',
        borderRadius: '50%',
        background: '#7c6af7',
        display: 'inline-block',
        flexShrink: 0,
    },
    itemBody: {
        fontSize: '13px',
        color: '#888',
        marginBottom: '4px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    itemTime: { fontSize: '11px', color: '#555' },
}