import { useState, useEffect } from 'react'
import api from '../api/auth'
import { useTranslation } from 'react-i18next'
import {
    Search, Trash2, X, MessageSquare, Image, FileText, Film,
    ChevronDown, ChevronUp, ShieldAlert, Eye, Filter,
    Hash, Calendar, User as UserIcon, Users, Clock,
    Download, AlertTriangle, RefreshCw
} from 'lucide-react'

export default function AdminMessagesTab() {
    const { t } = useTranslation()
    const [chats, setChats] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState('ALL')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortDir, setSortDir] = useState('desc')
    const [selectedChat, setSelectedChat] = useState(null)
    const [chatMessages, setChatMessages] = useState([])
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)
    const [stats, setStats] = useState(null)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true); setError('')
        try {
            const [chatsRes, usersRes] = await Promise.all([
                api.get('/admin/chats'),
                api.get('/admin/users'),
            ])
            setChats(chatsRes.data)
            // Считаем статистику
            const allChats = chatsRes.data
            setStats({
                totalChats: allChats.length,
                privateChats: allChats.filter(c => c.type === 'PRIVATE').length,
                groupChats: allChats.filter(c => c.type === 'GROUP').length,
                totalMessages: allChats.reduce((acc, c) => acc + (c.messageCount || 0), 0),
            })
        } catch (err) {
            setError(t('admin.loadChatsError', 'Failed to load chats. Make sure the /admin/chats endpoint exists.'))
        } finally {
            setLoading(false)
        }
    }

    const fetchChatMessages = async (chatId) => {
        setMessagesLoading(true)
        setChatMessages([])
        try {
            const res = await api.get(`/admin/chats/${chatId}/messages`)
            setChatMessages(res.data)
        } catch {
            setChatMessages([])
        } finally {
            setMessagesLoading(false)
        }
    }

    const handleSelectChat = (chat) => {
        if (selectedChat?.id === chat.id) {
            setSelectedChat(null)
            setChatMessages([])
            return
        }
        setSelectedChat(chat)
        fetchChatMessages(chat.id)
    }

    const handleDeleteMessage = async (messageId) => {
        setActionLoading(messageId + '_delete')
        try {
            await api.delete(`/admin/messages/${messageId}`)
            setChatMessages(prev => prev.map(m =>
                m.id === messageId ? { ...m, deleted: true, content: t('chat.deleted') } : m
            ))
            setConfirmDelete(null)
        } catch {
            setError(t('admin.deleteMessageError', 'Failed to delete message'))
        } finally {
            setActionLoading(null)
        }
    }

    const handleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortBy(col); setSortDir('desc') }
    }

    const filtered = chats
        .filter(c => {
            const q = search.toLowerCase()
            const matchSearch = !q
                || c.name?.toLowerCase().includes(q)
                || c.members?.some(m => m.fullName?.toLowerCase().includes(q))
            const matchType = filterType === 'ALL' || c.type === filterType
            return matchSearch && matchType
        })
        .sort((a, b) => {
            let av = a[sortBy] ?? '', bv = b[sortBy] ?? ''
            if (typeof av === 'string') av = av.toLowerCase()
            if (typeof bv === 'string') bv = bv.toLowerCase()
            if (av < bv) return sortDir === 'asc' ? -1 : 1
            if (av > bv) return sortDir === 'asc' ? 1 : -1
            return 0
        })

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <ChevronDown size={12} style={{ opacity: 0.3 }} />
        return sortDir === 'asc'
            ? <ChevronUp size={12} style={{ color: '#10b981' }} />
            : <ChevronDown size={12} style={{ color: '#10b981' }} />
    }

    const getMediaIcon = (msg) => {
        if (!msg.media) return null
        const type = msg.media.mediaType
        if (type === 'PHOTO') return <Image size={13} color="#6366f1" />
        if (type === 'VIDEO') return <Film size={13} color="#f59e0b" />
        return <FileText size={13} color="#10b981" />
    }

    const formatTime = (d) => d ? new Date(d).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '—'

    // If the admin endpoint doesn't exist yet, show a helpful message
    if (error && chats.length === 0 && !loading) {
        return <EndpointMissingState onRefresh={fetchData} error={error} />
    }

    if (loading) return (
        <div style={m.center}>
            <div style={m.spinner} />
            <span style={m.loadingText}>{t('admin.loadingChats', 'Loading chats...')}</span>
        </div>
    )

    return (
        <div style={m.wrap}>
            {error && (
                <div style={m.errorBox}>
                    <ShieldAlert size={16} />{error}
                    <button style={m.errorClose} onClick={() => setError('')}><X size={14} /></button>
                </div>
            )}

            {/* Summary cards */}
            {stats && (
                <div style={m.summaryRow}>
                    <StatCard icon={<MessageSquare size={16} />} label={t('admin.totalChats', 'Total Chats')} value={stats.totalChats} color="#10b981" bg="rgba(16,185,129,0.12)" border="rgba(16,185,129,0.25)" />
                    <StatCard icon={<UserIcon size={16} />} label={t('admin.privateChats', 'Private Chats')} value={stats.privateChats} color="#6366f1" bg="rgba(99,102,241,0.12)" border="rgba(99,102,241,0.25)" />
                    <StatCard icon={<Users size={16} />} label={t('admin.groupChats', 'Group Chats')} value={stats.groupChats} color="#f59e0b" bg="rgba(245,158,11,0.12)" border="rgba(245,158,11,0.25)" />
                    <StatCard icon={<Hash size={16} />} label={t('admin.totalMessages')} value={stats.totalMessages} color="#ec4899" bg="rgba(236,72,153,0.12)" border="rgba(236,72,153,0.25)" />
                </div>
            )}

            {/* Toolbar */}
            <div style={m.toolbar}>
                <div style={m.searchWrap}>
                    <Search size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                    <input
                        style={m.searchInput}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('chat.searchPlaceholder')}
                    />
                    {search && <button style={m.clearBtn} onClick={() => setSearch('')}><X size={12} /></button>}
                </div>

                <select style={m.select} value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="ALL">{t('admin.allTypes', 'All Types')}</option>
                    <option value="PRIVATE">{t('admin.privateType', 'Private')}</option>
                    <option value="GROUP">{t('admin.groupType', 'Group')}</option>
                </select>

                <div style={m.countBadge}>{filtered.length} / {chats.length} {t('admin.chats', 'chats')}</div>
            </div>

            {/* Table + Message panel */}
            <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
                {/* Chat table */}
                <div style={m.tableWrap}>
                    <table style={m.table}>
                        <thead>
                            <tr>
                                {[
                                    { col: 'type', label: t('common.type', 'Type') },
                                    { col: 'name', label: t('chat.title') },
                                    { col: null, label: t('group.members') },
                                    { col: 'messageCount', label: t('admin.messages') },
                                    { col: 'createdAt', label: t('admin.created', 'Created') },
                                    { col: null, label: t('common.actions', 'Actions') },
                                ].map(({ col, label }) => (
                                    <th
                                        key={label}
                                        style={{ ...m.th, cursor: col ? 'pointer' : 'default' }}
                                        onClick={() => col && handleSort(col)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {label}
                                            {col && <SortIcon col={col} />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={m.emptyCell}>
                                        <MessageSquare size={20} style={{ opacity: 0.3 }} />
                                        <span>{t('chat.notFound')}</span>
                                    </td>
                                </tr>
                            ) : filtered.map(chat => {
                                const isSelected = selectedChat?.id === chat.id
                                const isGroup = chat.type === 'GROUP'
                                const memberNames = chat.members?.slice(0, 2).map(m => m.fullName).join(', ')
                                const extraMembers = (chat.members?.length || 0) - 2

                                return (
                                    <tr
                                        key={chat.id}
                                        style={{
                                            ...m.tr,
                                            background: isSelected ? 'rgba(16,185,129,0.06)' : 'transparent',
                                            borderLeft: isSelected ? '2px solid #10b981' : '2px solid transparent',
                                        }}
                                        onClick={() => handleSelectChat(chat)}
                                    >
                                        {/* Type */}
                                        <td style={m.td}>
                                            <span style={{
                                                ...m.typeBadge,
                                                background: isGroup ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                                                color: isGroup ? '#f59e0b' : '#818cf8',
                                                border: `1px solid ${isGroup ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.25)'}`,
                                            }}>
                                                {isGroup ? <Users size={10} /> : <UserIcon size={10} />}
                                                {isGroup ? t('admin.groupType', 'Group') : t('admin.privateType', 'Private')}
                                            </span>
                                        </td>
                                        {/* Chat name */}
                                        <td style={m.td}>
                                            <div style={m.chatCell}>
                                                {chat.avatarUrl ? (
                                                    <img src={chat.avatarUrl} style={m.chatAvatar} alt="" />
                                                ) : (
                                                    <div style={{
                                                        ...m.chatAvatarPh,
                                                        background: isGroup
                                                            ? 'linear-gradient(135deg,#f59e0b,#f97316)'
                                                            : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                                    }}>
                                                        {isGroup ? <Users size={14} color="#fff" /> : <UserIcon size={14} color="#fff" />}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={m.chatName}>
                                                        {chat.name || (chat.members?.map(m => m.fullName).join(' & ')) || `Chat #${chat.id}`}
                                                    </div>
                                                    <div style={m.chatId}>ID: {chat.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Members */}
                                        <td style={m.td}>
                                            <span style={m.membersText}>
                                                {memberNames}
                                                {extraMembers > 0 && ` +${extraMembers}`}
                                            </span>
                                        </td>
                                        {/* Message count */}
                                        <td style={m.td}>
                                            <span style={m.msgCount}>{chat.messageCount ?? '—'}</span>
                                        </td>
                                        {/* Created */}
                                        <td style={m.td}>
                                            <span style={m.dateText}>
                                                {chat.createdAt ? new Date(chat.createdAt).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                }) : '—'}
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td style={m.td} onClick={e => e.stopPropagation()}>
                                            <button
                                                style={m.viewBtn}
                                                onClick={() => handleSelectChat(chat)}
                                                title={t('admin.viewMessages')}
                                            >
                                                <Eye size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Message detail panel */}
                {selectedChat && (
                    <div style={m.msgPanel}>
                        <div style={m.msgPanelHeader}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={m.msgPanelTitle}>
                                    {selectedChat.name || selectedChat.members?.map(u => u.fullName).join(' & ') || `Chat #${selectedChat.id}`}
                                </div>
                                <div style={m.msgPanelSub}>
                                    {chatMessages.length} {t('admin.messages').toLowerCase()}
                                </div>
                            </div>
                            <button style={m.msgPanelClose} onClick={() => { setSelectedChat(null); setChatMessages([]) }}>
                                <X size={14} />
                            </button>
                        </div>

                        <div style={m.msgList}>
                            {messagesLoading ? (
                                <div style={m.msgCenter}>
                                    <div style={m.miniSpinner} />
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div style={m.msgCenter}>
                                    <MessageSquare size={20} style={{ opacity: 0.2 }} />
                                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 8 }}>{t('admin.noMessages')}</span>
                                </div>
                            ) : (
                                chatMessages.map(msg => (
                                    <div key={msg.id} style={{
                                        ...m.msgItem,
                                        opacity: msg.deleted ? 0.5 : 1,
                                        background: msg.deleted ? 'rgba(239,68,68,0.05)' : 'transparent',
                                    }}>
                                        <div style={m.msgAvatar}>
                                            {msg.senderAvatar ? (
                                                <img src={msg.senderAvatar} style={m.msgAvatarImg} alt="" />
                                            ) : (
                                                <div style={m.msgAvatarPh}>
                                                    {msg.senderName?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div style={m.msgBody}>
                                            <div style={m.msgMeta}>
                                                <span style={m.msgSender}>{msg.senderName}</span>
                                                <span style={m.msgTime}>{formatTime(msg.createdAt)}</span>
                                            </div>
                                            <div style={m.msgContent}>
                                                {msg.media && (
                                                    <span style={m.mediaTag}>
                                                        {getMediaIcon(msg)}
                                                        {msg.media.mediaType}
                                                    </span>
                                                )}
                                                {msg.deleted
                                                    ? <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.3)' }}>{t('chat.deleted')}</span>
                                                    : <span style={{ color: 'rgba(255,255,255,0.7)', wordBreak: 'break-word' }}>{msg.content}</span>
                                                }
                                            </div>
                                        </div>
                                        {!msg.deleted && (
                                            <button
                                                style={m.msgDeleteBtn}
                                                onClick={() => setConfirmDelete(msg)}
                                                title={t('admin.deleteMessage')}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm delete message modal */}
            {confirmDelete && (
                <div style={m.overlay}>
                    <div style={m.modal}>
                        <div style={m.modalIcon}>
                            <Trash2 size={22} color="#ef4444" />
                        </div>
                        <h3 style={m.modalTitle}>{t('admin.deleteMessage')}?</h3>
                        <p style={m.modalBody}>
                            {t('admin.confirmDeleteMessage')} ({confirmDelete.senderName})
                        </p>
                        <div style={m.modalActions}>
                            <button style={m.modalCancel} onClick={() => setConfirmDelete(null)}>{t('common.cancel')}</button>
                            <button
                                style={m.modalDelete}
                                onClick={() => handleDeleteMessage(confirmDelete.id)}
                                disabled={!!actionLoading}
                            >
                                {actionLoading ? <div style={m.miniSpinner} /> : <Trash2 size={14} />}
                                {t('common.delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Endpoint missing state ───────────────────────────────────
function EndpointMissingState({ onRefresh, error }) {
    const { t } = useTranslation()
    return (
        <div style={m.endpointMissing}>
            <div style={m.endpointIcon}>
                <AlertTriangle size={32} color="#f59e0b" />
            </div>
            <h3 style={m.endpointTitle}>{t('admin.endpointRequired', 'Backend Endpoint Required')}</h3>
            <p style={m.endpointDesc}>
                {t('admin.endpointDesc', 'This tab needs additional backend endpoints to work. Add these to your')} <code style={m.code}>AdminController.java</code>:
            </p>
            <div style={m.codeBlock}>
                <pre style={m.pre}>{`// GET /api/admin/chats — all chats with stats
@GetMapping("/chats")
public ResponseEntity<List<ChatDto>> getAllChats() {
    return ResponseEntity.ok(chatService.getAllChats());
}

// GET /api/admin/chats/{id}/messages
@GetMapping("/chats/{id}/messages")
public ResponseEntity<List<MessageDto>> getChatMessages(
        @PathVariable Long id) {
    return ResponseEntity.ok(
        chatService.getChatMessages(id));
}

// DELETE /api/admin/messages/{id}
@DeleteMapping("/messages/{id}")
public ResponseEntity<?> deleteMessage(@PathVariable Long id) {
    messageService.adminDeleteMessage(id);
    return ResponseEntity.ok(Map.of("message", "Deleted"));
}`}</pre>
            </div>
            <button style={m.retryBtn} onClick={onRefresh}>
                <RefreshCw size={14} /> {t('admin.retryAfterAdding', 'Retry after adding endpoints')}
            </button>
            <p style={m.endpointNote}>Error: {error}</p>
        </div>
    )
}

function StatCard({ icon, label, value, color, bg, border }) {
    return (
        <div style={{ ...m.statCard, borderColor: border }}>
            <div style={{ ...m.statIcon, background: bg, border: `1px solid ${border}`, color }}>
                {icon}
            </div>
            <div style={{ ...m.statValue, color }}>{value}</div>
            <div style={m.statLabel}>{label}</div>
        </div>
    )
}

const m = {
    wrap: {
        display: 'flex', flexDirection: 'column', gap: '16px', height: '100%',
    },
    center: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '12px', height: '300px',
    },
    spinner: {
        width: '24px', height: '24px',
        border: '2px solid rgba(255,255,255,0.08)',
        borderTop: '2px solid #10b981',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    },
    miniSpinner: {
        width: '12px', height: '12px',
        border: '2px solid rgba(255,255,255,0.2)',
        borderTop: '2px solid currentColor',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
    },
    loadingText: { fontSize: '13px', color: 'rgba(255,255,255,0.3)' },
    errorBox: {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '10px', padding: '11px 14px',
        fontSize: '13px', color: '#f87171', fontWeight: '500',
    },
    errorClose: {
        marginLeft: 'auto', background: 'transparent', border: 'none',
        color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center',
    },
    summaryRow: {
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
    },
    statCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid',
        borderRadius: '14px', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '6px',
        animation: 'fadeUp 0.25s ease forwards',
    },
    statIcon: {
        width: '36px', height: '36px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '4px',
    },
    statValue: {
        fontSize: '28px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: 1,
    },
    statLabel: {
        fontSize: '11px', color: 'rgba(255,255,255,0.35)',
        fontWeight: '600', letterSpacing: '-0.01em',
    },
    toolbar: {
        display: 'flex', alignItems: 'center', gap: '12px',
    },
    searchWrap: {
        flex: 1,
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', padding: '9px 12px',
    },
    searchInput: {
        flex: 1, background: 'transparent', border: 'none',
        color: '#f1f1f8', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
    },
    clearBtn: {
        background: 'transparent', border: 'none',
        color: 'rgba(255,255,255,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center',
    },
    select: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', padding: '9px 12px',
        color: 'rgba(255,255,255,0.7)', fontSize: '12px',
        fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
    },
    countBadge: {
        fontSize: '11px', fontWeight: '700',
        color: 'rgba(255,255,255,0.3)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '999px', padding: '4px 10px', whiteSpace: 'nowrap',
    },
    tableWrap: {
        flex: 1,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px', overflow: 'auto',
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    th: {
        padding: '12px 16px', textAlign: 'left',
        fontSize: '11px', fontWeight: '700',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        whiteSpace: 'nowrap', userSelect: 'none',
        background: 'rgba(255,255,255,0.02)',
    },
    tr: {
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer', transition: 'background 0.1s',
    },
    td: { padding: '12px 16px', verticalAlign: 'middle' },
    emptyCell: {
        padding: '48px', textAlign: 'center',
        color: 'rgba(255,255,255,0.25)', fontSize: '13px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    },
    typeBadge: {
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        borderRadius: '999px', padding: '3px 9px',
        fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em',
    },
    chatCell: { display: 'flex', alignItems: 'center', gap: '10px' },
    chatAvatar: { width: '34px', height: '34px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 },
    chatAvatarPh: {
        width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    chatName: { fontSize: '13px', fontWeight: '600', color: '#f1f1f8', letterSpacing: '-0.01em' },
    chatId: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '1px' },
    membersText: { fontSize: '12px', color: 'rgba(255,255,255,0.45)' },
    msgCount: { fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
    dateText: { fontSize: '11px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' },
    viewBtn: {
        background: 'rgba(16,185,129,0.08)',
        border: '1px solid rgba(16,185,129,0.15)',
        borderRadius: '7px', padding: '6px',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        color: '#10b981', transition: 'opacity 0.15s',
    },
    // Message panel
    msgPanel: {
        width: '320px', minWidth: '320px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeUp 0.15s ease',
        overflow: 'hidden',
    },
    msgPanelHeader: {
        display: 'flex', alignItems: 'center',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        gap: '10px', flexShrink: 0,
    },
    msgPanelTitle: {
        fontSize: '13px', fontWeight: '700', color: '#f1f1f8',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    msgPanelSub: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' },
    msgPanelClose: {
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '7px', padding: '5px', cursor: 'pointer',
        color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', flexShrink: 0,
    },
    msgList: { flex: 1, overflowY: 'auto', padding: '8px' },
    msgCenter: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: '200px', gap: '8px',
    },
    msgItem: {
        display: 'flex', gap: '8px', alignItems: 'flex-start',
        padding: '8px', borderRadius: '10px', marginBottom: '2px',
        transition: 'background 0.1s',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    },
    msgAvatar: { flexShrink: 0 },
    msgAvatarImg: { width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover' },
    msgAvatarPh: {
        width: '28px', height: '28px', borderRadius: '8px',
        background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: '700', color: '#fff',
    },
    msgBody: { flex: 1, minWidth: 0 },
    msgMeta: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' },
    msgSender: { fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
    msgTime: { fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' },
    msgContent: {
        fontSize: '12px', lineHeight: '1.4',
        display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap',
    },
    mediaTag: {
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: '4px', padding: '1px 6px',
        fontSize: '10px', fontWeight: '600', color: '#818cf8',
    },
    msgDeleteBtn: {
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: '6px', padding: '4px',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        color: '#f87171', flexShrink: 0, opacity: 0,
        transition: 'opacity 0.15s',
    },
    // Modal
    overlay: {
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease',
    },
    modal: {
        background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '380px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        animation: 'fadeUp 0.15s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    modalIcon: {
        width: '52px', height: '52px', borderRadius: '16px',
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
    },
    modalTitle: { fontSize: '18px', fontWeight: '700', color: '#f1f1f8', letterSpacing: '-0.02em', marginBottom: '8px', textAlign: 'center' },
    modalBody: { fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', textAlign: 'center', marginBottom: '24px' },
    modalActions: { display: 'flex', gap: '10px', width: '100%' },
    modalCancel: {
        flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', padding: '11px', fontSize: '13px', fontWeight: '600',
        color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontFamily: 'inherit',
    },
    modalDelete: {
        flex: 1, background: '#ef4444', border: 'none', borderRadius: '10px', padding: '11px',
        fontSize: '13px', fontWeight: '600', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    },
    // Endpoint missing
    endpointMissing: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 32px', textAlign: 'center', maxWidth: '640px', margin: '0 auto',
    },
    endpointIcon: {
        width: '64px', height: '64px', borderRadius: '20px',
        background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
    },
    endpointTitle: { fontSize: '18px', fontWeight: '700', color: '#f1f1f8', marginBottom: '10px' },
    endpointDesc: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', marginBottom: '20px' },
    codeBlock: {
        width: '100%', background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px', padding: '16px',
        textAlign: 'left', marginBottom: '20px',
        maxHeight: '280px', overflowY: 'auto',
    },
    pre: {
        fontSize: '11px', color: 'rgba(255,255,255,0.6)',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap',
    },
    code: {
        background: 'rgba(99,102,241,0.15)', color: '#818cf8',
        borderRadius: '4px', padding: '1px 6px', fontSize: '12px',
        fontFamily: "'JetBrains Mono', monospace",
    },
    retryBtn: {
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: '10px', padding: '10px 20px',
        color: '#f59e0b', fontSize: '13px', fontWeight: '600',
        cursor: 'pointer', fontFamily: 'inherit', marginBottom: '12px',
    },
    endpointNote: { fontSize: '11px', color: 'rgba(255,255,255,0.2)' },
}