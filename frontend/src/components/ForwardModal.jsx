import { useState, useEffect } from 'react'
import { X, Search, Users, User, Send } from 'lucide-react'
import { getMyChats, forwardMessage } from '../api/chat'
import useAuthStore from '../store/authStore'

export default function ForwardModal({ messageId, onClose, onForwarded }) {
    const [chats, setChats] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const me = useAuthStore(s => s.user)

    useEffect(() => {
        getMyChats()
            .then(res => setChats(res.data))
            .finally(() => setLoading(false))
    }, [])

    const handleForward = async (chatId) => {
        try {
            await forwardMessage(messageId, chatId)
            if (onForwarded) onForwarded()
            onClose()
        } catch (err) {
            console.error('Forward failed:', err)
            alert('Failed to forward message')
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
        <div style={f.overlay}>
            <div style={f.modal}>
                <div style={f.header}>
                    <h3 style={f.title}>Forward message</h3>
                    <button style={f.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div style={f.searchWrap}>
                    <Search size={16} style={f.searchIcon} />
                    <input
                        style={f.searchInput}
                        placeholder="Search chats..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div style={f.list}>
                    {loading ? (
                        <div style={f.center}>Loading...</div>
                    ) : filteredChats.length === 0 ? (
                        <div style={f.center}>No chats found</div>
                    ) : (
                        filteredChats.map(chat => (
                            <button
                                key={chat.id}
                                style={f.item}
                                onClick={() => handleForward(chat.id)}
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
                                            {chat.type === 'GROUP' ? <Users size={16} color="#fff" /> : <User size={16} color="#fff" />}
                                        </div>
                                    )}
                                </div>
                                <span style={f.name}>{getChatName(chat)}</span>
                                <Send size={16} style={f.sendIcon} />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

const f = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        backdropFilter: 'blur(4px)',
    },
    modal: {
        background: 'var(--bg-secondary)', width: '100%', maxWidth: '400px',
        borderRadius: '20px', display: 'flex', flexDirection: 'column',
        maxHeight: '80vh', border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xl)', overflow: 'hidden',
    },
    header: {
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    title: { fontSize: '17px', fontWeight: '700', margin: 0 },
    closeBtn: {
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
    },
    searchWrap: {
        padding: '12px 16px', position: 'relative',
        borderBottom: '1px solid var(--border)',
    },
    searchIcon: {
        position: 'absolute', left: '28px', top: '50%',
        transform: 'translateY(-50%)', color: 'var(--text-muted)',
    },
    searchInput: {
        width: '100%', background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)', borderRadius: '10px',
        padding: '10px 12px 10px 38px', color: 'var(--text-primary)',
        fontSize: '14px', outline: 'none',
    },
    list: { flex: 1, overflowY: 'auto', padding: '8px' },
    item: {
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 12px', background: 'transparent', border: 'none',
        borderRadius: '12px', cursor: 'pointer', transition: 'background 0.15s',
        textAlign: 'left',
    },
    avatarWrap: { flexShrink: 0 },
    avatar: { width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' },
    avatarPlaceholder: {
        width: '40px', height: '40px', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    name: { flex: 1, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' },
    sendIcon: { color: 'var(--accent)', opacity: 0.5 },
    center: { padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' },
}
