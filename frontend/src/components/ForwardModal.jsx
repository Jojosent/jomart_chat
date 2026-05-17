import { useState, useEffect } from 'react'
import { X, Search, Users, User, Send, Check } from 'lucide-react'
import { getMyChats, forwardMessage } from '../api/chat'
import useAuthStore from '../store/authStore'
import { useTranslation } from 'react-i18next'

export default function ForwardModal({ messageId, onClose, onForwarded }) {
    const { t } = useTranslation()
    const [chats, setChats] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [forwarding, setForwarding] = useState(null)
    const [done, setDone] = useState(null)
    const me = useAuthStore(s => s.user)

    useEffect(() => {
        getMyChats()
            .then(res => setChats(res.data))
            .finally(() => setLoading(false))
    }, [])

    const handleForward = async (chatId) => {
        if (forwarding) return
        setForwarding(chatId)
        try {
            const res = await forwardMessage(messageId, chatId)
            setDone(chatId)
            if (onForwarded) onForwarded(res.data)  // ← передаём msg
            setTimeout(onClose, 800)
        } catch (err) {
            console.error('Forward failed:', err)
            setForwarding(null)
        }
    }

    const filteredChats = chats.filter(c => {
        const name = c.type === 'GROUP'
            ? c.name
            : c.members?.find(m => m.id !== me?.id)?.fullName
        return name?.toLowerCase().includes(search.toLowerCase())
    })

    const getChatName = (chat) => {
        if (chat.type === 'GROUP') return chat.name || 'Group'
        return chat.members?.find(m => m.id !== me?.id)?.fullName || 'Unknown'
    }

    const getChatAvatar = (chat) => {
        if (chat.type === 'GROUP') return chat.avatarUrl
        return chat.members?.find(m => m.id !== me?.id)?.avatarUrl
    }

    return (
        <div style={f.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={f.modal}>
                <div style={f.header}>
                    <h3 style={f.title}>{t('common.forward', 'Forward message')}</h3>
                    <button style={f.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div style={f.searchWrap}>
                    <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <input
                        style={f.searchInput}
                        placeholder={t('chat.searchOrFind')}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoFocus
                    />
                    {search && (
                        <button style={f.clearBtn} onClick={() => setSearch('')}>
                            <X size={12} />
                        </button>
                    )}
                </div>

                <div style={f.list}>
                    {loading ? (
                        <div style={f.center}><div style={f.spinner} /></div>
                    ) : filteredChats.length === 0 ? (
                        <div style={f.center}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                {t('common.noResults')}
                            </span>
                        </div>
                    ) : (
                        filteredChats.map(chat => {
                            const isForwarding = forwarding === chat.id
                            const isDone = done === chat.id
                            return (
                                <button
                                    key={chat.id}
                                    style={{
                                        ...f.item,
                                        background: isDone
                                            ? 'var(--success-bg)'
                                            : isForwarding
                                                ? 'var(--accent-bg)'
                                                : 'transparent',
                                        opacity: forwarding && !isForwarding && !isDone ? 0.45 : 1,
                                    }}
                                    onClick={() => handleForward(chat.id)}
                                    disabled={!!forwarding}
                                >
                                    <div style={f.avatarWrap}>
                                        {getChatAvatar(chat) ? (
                                            <img src={getChatAvatar(chat)} style={f.avatar} alt="" />
                                        ) : (
                                            <div style={{
                                                ...f.avatarPlaceholder,
                                                background: chat.type === 'GROUP'
                                                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                                    : 'linear-gradient(135deg,#6366f1,#06b6d4)',
                                            }}>
                                                {chat.type === 'GROUP'
                                                    ? <Users size={15} color="#fff" />
                                                    : <User size={15} color="#fff" />
                                                }
                                            </div>
                                        )}
                                    </div>
                                    <span style={f.name}>{getChatName(chat)}</span>
                                    {isDone ? (
                                        <Check size={16} color="var(--success)" />
                                    ) : isForwarding ? (
                                        <div style={f.miniSpinner} />
                                    ) : (
                                        <Send size={15} color="var(--text-muted)" />
                                    )}
                                </button>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

const f = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 2000,
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.15s ease',
    },
    modal: {
        background: 'var(--bg-secondary)', width: '100%', maxWidth: '380px',
        borderRadius: '20px', display: 'flex', flexDirection: 'column',
        maxHeight: '75vh', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
        animation: 'fadeUp 0.18s ease',
    },
    header: {
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
    },
    title: { fontSize: '15px', fontWeight: '700', margin: 0, letterSpacing: '-0.02em' },
    closeBtn: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '6px', cursor: 'pointer',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
    },
    searchWrap: {
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--bg-tertiary)', flexShrink: 0,
    },
    searchInput: {
        flex: 1, background: 'transparent',
        border: 'none', color: 'var(--text-primary)',
        fontSize: '13px', outline: 'none', fontFamily: 'inherit',
    },
    clearBtn: {
        background: 'transparent', border: 'none',
        color: 'var(--text-muted)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0,
    },
    list: { flex: 1, overflowY: 'auto', padding: '6px' },
    item: {
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 12px', border: 'none',
        borderRadius: '12px', cursor: 'pointer', transition: 'background 0.15s',
        textAlign: 'left', fontFamily: 'inherit',
    },
    avatarWrap: { flexShrink: 0 },
    avatar: { width: '38px', height: '38px', borderRadius: '11px', objectFit: 'cover' },
    avatarPlaceholder: {
        width: '38px', height: '38px', borderRadius: '11px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    name: {
        flex: 1, fontSize: '14px', fontWeight: '600',
        color: 'var(--text-primary)', letterSpacing: '-0.01em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    center: {
        padding: '40px', display: 'flex',
        justifyContent: 'center', alignItems: 'center',
    },
    spinner: {
        width: 20, height: 20,
        border: '2px solid var(--border)',
        borderTop: '2px solid var(--accent)',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    },
    miniSpinner: {
        width: 14, height: 14, flexShrink: 0,
        border: '2px solid var(--border)',
        borderTop: '2px solid var(--accent)',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    },
}