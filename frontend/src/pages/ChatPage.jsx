import { useState, useEffect, useRef, useCallback } from 'react'
import { getMyChats, getOrCreatePrivate, getChatMessages, deleteMessage } from '../api/chat'
import { uploadMedia } from '../api/media'
import useWebSocket from '../hooks/useWebSocket'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import CreateGroupModal from '../components/CreateGroupModal'
import MessageTicks from '../components/MessageTicks'
import { NotificationPanel } from '../components/NotificationPanel'
import useNotifications from '../hooks/useNotifications'
import { SearchPanel } from '../components/SearchPanel'
import TranslateButton from '../components/TranslateButton'
import { LangSwitcher } from '../components/LangSwitcher'
import { ThemeToggle } from '../components/ThemeToggle'
import AttachmentPicker from '../components/AttachmentPicker'
import StickerPicker from '../components/StickerPicker'
import MediaMessage from '../components/MediaMessage'
import UploadProgress from '../components/UploadProgress'
import ForwardModal from '../components/ForwardModal'
import CameraModal from '../components/CameraModal'

import {
    Search, Bell, Bot, Users, User, Plus,
    Settings, Circle, Trash2, Forward,
    MessageSquare, X, ChevronRight,
    Paperclip, Smile, Send,
} from 'lucide-react'

export default function ChatPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const me = useAuthStore((s) => s.user)

    // ── UI state ─────────────────────────────────────────────────
    const [searchMode, setSearchMode] = useState(false)
    const [chats, setChats] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [typingUsers, setTypingUsers] = useState({})
    const [loading, setLoading] = useState(true)
    const [hoveredChat, setHoveredChat] = useState(null)
    const [hoveredMsg, setHoveredMsg] = useState(null)
    const [showCreateGroup, setShowCreateGroup] = useState(false)
    const [showNotifications, setShowNotifications] = useState(false)

    // Modals for Forward & Camera
    const [forwardMsgId, setForwardMsgId] = useState(null)
    const [showCamera, setShowCamera] = useState(false)

    // ── Attachment / Sticker state ───────────────────────────────
    const [showAttachment, setShowAttachment] = useState(false)
    const [showSticker, setShowSticker] = useState(false)
    const [uploadingFile, setUploadingFile] = useState(null)   // { name, progress }

    // ── Refs ─────────────────────────────────────────────────────
    const activeChatRef = useRef(null)
    const messagesEndRef = useRef(null)
    const scrollFlagRef = useRef('smooth') // 'auto' (instant) or 'smooth'
    const typingTimerRef = useRef(null)
    const inputRef = useRef(null)
    const attachBtnRef = useRef(null)
    const stickerBtnRef = useRef(null)

    const {
        unreadCount, addNotification, fetchUnreadCount, resetUnread,
    } = useNotifications()

    // ── Profanity ────────────────────────────────────────────────
    const FRONT_BAD_WORDS = [
        'блять', 'блядь', 'ёбаный', 'ебаный', 'пиздец', 'хуй', 'сука', 'мудак',
        'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy'
    ]
    const hasProfanity = (text) => {
        const lower = text.toLowerCase()
        return FRONT_BAD_WORDS.some(w => lower.includes(w))
    }

    // ── WebSocket ────────────────────────────────────────────────
    const { connected, sendMessage, markRead, sendTyping } = useWebSocket(
        // onMessage
        (msg) => {
            setMessages(prev => {
                // Дедупликация по реальному id (уже есть в списке)
                if (prev.find(m => m.id === msg.id)) return prev

                if (msg.senderId === me?.id) {
                    // Для медиа — ищем temp-медиа заглушку по chatId
                    if (msg.media) {
                        const hasTempMedia = prev.some(
                            m => m.temp && m.chatId === msg.chatId && m.media
                        )
                        if (hasTempMedia) {
                            const idx = [...prev].reverse().findIndex(
                                m => m.temp && m.chatId === msg.chatId && m.media
                            )
                            return prev.map((m, i) =>
                                i === prev.length - 1 - idx ? msg : m
                            )
                        }
                    } else {
                        // Для текстовых — ищем temp без медиа
                        const hasTempText = prev.some(
                            m => m.temp && m.chatId === msg.chatId && !m.media
                        )
                        if (hasTempText) {
                            const idx = [...prev].reverse().findIndex(
                                m => m.temp && m.chatId === msg.chatId && !m.media
                            )
                            return prev.map((m, i) =>
                                i === prev.length - 1 - idx ? msg : m
                            )
                        }
                    }
                }
                return [...prev, msg]
            })
            setChats(prev => prev.map(c =>
                c.id === msg.chatId ? { ...c, lastMessage: msg } : c
            ))
            if (msg.chatId === activeChatRef.current?.id &&
                msg.senderId !== me?.id) {

                markRead(msg.chatId)
            }
        },
        // onDelivered
        (msg) => {
            setMessages(prev => prev.map(m =>
                m.id === msg.id ? { ...m, status: 'DELIVERED' } : m
            ))
        },
        // onReadStatus
        (data) => {
            setMessages(prev => prev.map(m =>
                data.messageIds?.includes(m.id) ? { ...m, status: 'READ' } : m
            ))
        },
        // onTyping
        (data) => {
            if (data.chatId === activeChat?.id) {
                setTypingUsers(prev => ({ ...prev, [data.username]: data.typing }))
            }
        },
        // onNotification
        (notification) => { addNotification(notification) },
        // onDelete
        (deletedMsg) => {
            setMessages(prev => prev.map(m =>
                m.id === deletedMsg.id ? { ...m, ...deletedMsg } : m
            ))
            setChats(prev => prev.map(c =>
                c.id === deletedMsg.chatId ? { ...c, lastMessage: deletedMsg } : c
            ))
        }
    )

    // ── Effects ──────────────────────────────────────────────────
    useEffect(() => { fetchChats() }, [])
    useEffect(() => { activeChatRef.current = activeChat }, [activeChat])
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: scrollFlagRef.current })
        // После прокрутки возвращаем smooth для новых сообщений
        scrollFlagRef.current = 'smooth'
    }, [messages])
    useEffect(() => {
        if (activeChat) {
            scrollFlagRef.current = 'auto' // Мгновенно вниз при смене чата
            fetchMessages(activeChat.id)
            markRead(activeChat.id)
        }
    }, [activeChat])

    // Закрываем пикеры при клике вне
    useEffect(() => {
        const handler = (e) => {
            if (attachBtnRef.current?.contains(e.target)) return
            if (stickerBtnRef.current?.contains(e.target)) return
            // Закроем если клик вне самих попапов
            // (AttachmentPicker и StickerPicker сами обрабатывают onClose)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    // ── Data fetching ────────────────────────────────────────────
    const fetchChats = async () => {
        try {
            const res = await getMyChats()
            setChats(res.data)
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async (chatId) => {
        const res = await getChatMessages(chatId)
        setMessages(res.data)
    }

    // ── Send text ────────────────────────────────────────────────
    const handleSend = () => {
        if (!input.trim() || !activeChat) return
        const content = input.trim()
        setInput('')
        const tempMsg = {
            id: Date.now(),
            chatId: activeChat.id,
            senderId: me?.id,
            senderName: me?.fullName,
            senderAvatar: me?.avatarUrl,
            content,
            status: 'SENT',
            edited: false,
            deleted: false,
            createdAt: new Date().toISOString(),
            temp: true,
        }
        setMessages(prev => [...prev, tempMsg])
        sendTyping(activeChat?.id, false)
        sendMessage(activeChat.id, content)
        inputRef.current?.focus()
    }

    // ── Send sticker ─────────────────────────────────────────────
    const handleStickerSelect = (emoji) => {
        if (!activeChat) return
        setShowSticker(false)
        const tempMsg = {
            id: Date.now(),
            chatId: activeChat.id,
            senderId: me?.id,
            senderName: me?.fullName,
            senderAvatar: me?.avatarUrl,
            content: emoji,
            status: 'SENT',
            edited: false,
            deleted: false,
            createdAt: new Date().toISOString(),
            temp: true,
        }
        setMessages(prev => [...prev, tempMsg])
        sendMessage(activeChat.id, emoji)
    }

    // ── Upload media ─────────────────────────────────────────────
    const handleMediaSelect = async (file, mediaType) => {
        if (!activeChat) return
        setShowAttachment(false)

        // Temp-заглушка — показываем сразу, пока идёт загрузка
        const tempId = `temp-media-${Date.now()}`
        const tempMsg = {
            id: tempId,
            chatId: activeChat.id,
            senderId: me?.id,
            senderName: me?.fullName,
            senderAvatar: me?.avatarUrl,
            content: '[MEDIA]',
            status: 'SENT',
            edited: false,
            deleted: false,
            createdAt: new Date().toISOString(),
            temp: true,
            media: {
                mediaType,
                fileName: file.name,
                fileSize: file.size,
                viewUrl: null,
            },
        }
        setMessages(prev => [...prev, tempMsg])
        setUploadingFile({ name: file.name, progress: 0 })

        try {
            const res = await uploadMedia(
                activeChat.id,
                file,
                mediaType,
                (pct) => setUploadingFile(prev => ({ ...prev, progress: pct }))
            )
            const msg = res.data

            // Заменяем temp на реальное сообщение.
            // Если WebSocket уже успел доставить его — просто убираем temp,
            // дедупликация в onMessage не даст добавить дубликат.
            setMessages(prev => {
                if (prev.find(m => m.id === msg.id)) {
                    return prev.filter(m => m.id !== tempId)
                }
                return prev.map(m => m.id === tempId ? msg : m)
            })
            setChats(prev => prev.map(c =>
                c.id === activeChat.id ? { ...c, lastMessage: msg } : c
            ))
        } catch (err) {
            console.error('Upload failed:', err)
            // Убираем заглушку при ошибке
            setMessages(prev => prev.filter(m => m.id !== tempId))
        } finally {
            setUploadingFile(null)
        }
    }

    // ── Delete message ───────────────────────────────────────────
    const handleDeleteMsg = async (msgId) => {
        try {
            await deleteMessage(msgId)
            // UI обновится через WebSocket, но можно и сразу для скорости:
            setMessages(prev => prev.map(m =>
                m.id === msgId
                    ? { ...m, deleted: true, content: t('chat.deleted') }
                    : m
            ))
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    // ── Keyboard ─────────────────────────────────────────────────
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        } else {
            sendTyping(activeChat?.id, true)
            clearTimeout(typingTimerRef.current)
            typingTimerRef.current = setTimeout(
                () => sendTyping(activeChat?.id, false), 2000
            )
        }
    }

    // ── Helpers ──────────────────────────────────────────────────
    const getChatName = (chat) => {
        if (chat.type === 'GROUP') return chat.name || 'Group'
        const other = chat.members?.find(m => m.id !== me?.id)
        return other?.fullName || 'Unknown'
    }
    const getChatAvatar = (chat) => {
        if (chat.type === 'GROUP') return chat.avatarUrl || null
        return chat.members?.find(m => m.id !== me?.id)?.avatarUrl
    }
    const getChatStatus = (chat) => {
        if (chat.type === 'GROUP') return null
        return chat.members?.find(m => m.id !== me?.id)?.status
    }
    const isTyping = Object.values(typingUsers).some(Boolean)

    const formatTime = (dateStr) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        const now = new Date()
        if (d.toDateString() === now.toDateString())
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    // Превью последнего сообщения в сайдбаре
    const getPreviewText = (chat) => {
        const lm = chat.lastMessage
        if (!lm) return 'No messages yet'
        if (lm.deleted) return 'Message deleted'
        if (lm.media) return `📎 ${lm.media.fileName || lm.media.mediaType}`
        return lm.content
    }

    // ── Определяем — стикер или текст ────────────────────────────
    const isStickerMsg = (content) => {
        if (!content || content === '[MEDIA]') return false
        // Проверяем что строка состоит только из эмодзи (1–3 символа)
        const emojiRe = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F){1,3}$/u
        return emojiRe.test(content.trim())
    }

    return (
        <div style={s.page}>

            {/* ══════════════ SIDEBAR ══════════════ */}
            <aside style={s.sidebar}>

                {/* Top bar */}
                <div style={s.topBar}>
                    {!searchMode ? (
                        <>
                            <div style={s.logoWrap}>
                                <div style={s.logoIcon}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                        <path
                                            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                            fill="#6366f1"
                                        />
                                    </svg>
                                </div>
                                <span style={s.logoText}>JoChat</span>
                            </div>

                            <div style={s.topActions}>
                                <ThemeToggle />

                                {/* Notifications */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        style={{
                                            ...s.iconBtn,
                                            background: showNotifications
                                                ? 'var(--accent-bg)' : 'transparent',
                                            color: showNotifications
                                                ? 'var(--accent)' : 'var(--text-secondary)',
                                        }}
                                        onClick={() => {
                                            setShowNotifications(!showNotifications)
                                            if (!showNotifications) resetUnread()
                                        }}
                                    >
                                        <Bell size={17} />
                                        {unreadCount > 0 && (
                                            <span style={s.notifBadge}>
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    {showNotifications && (
                                        <NotificationPanel
                                            onClose={() => setShowNotifications(false)}
                                            onCountChange={fetchUnreadCount}
                                        />
                                    )}
                                </div>

                                <button style={s.iconBtn}
                                    onClick={() => navigate('/ai')}>
                                    <Bot size={17} />
                                </button>
                                <button style={s.iconBtn}
                                    onClick={() => setShowCreateGroup(true)}>
                                    <Users size={17} />
                                </button>
                                <button style={s.iconBtn}
                                    onClick={() => navigate('/profile')}>
                                    <User size={17} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={s.searchTopBar}>
                            <button style={s.backBtn} onClick={() => setSearchMode(false)}>
                                <X size={16} />
                            </button>
                            <span style={s.searchTopTitle}>{t('chat.findPeople')}</span>
                        </div>
                    )}
                </div>

                {/* Lang + Status */}
                {!searchMode && (
                    <div style={s.metaRow}>
                        <LangSwitcher />
                        <div style={{
                            ...s.connPill,
                            background: connected ? 'var(--success-bg)' : 'var(--error-bg)',
                            color: connected ? 'var(--success)' : 'var(--error)',
                            borderColor: connected
                                ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                        }}>
                            <Circle size={6} fill="currentColor" />
                            {connected ? t('common.live') : t('common.reconnecting')}
                        </div>
                    </div>
                )}

                {/* Search bar */}
                {!searchMode && (
                    <div style={s.searchBarWrap}>
                        <button style={s.searchBar}
                            onClick={() => setSearchMode(true)}>
                            <Search size={14} color="var(--text-muted)" />
                            <span style={s.searchPlaceholder}>
                                {t('chat.searchOrFind')}
                            </span>
                        </button>
                        <button style={s.newChatBtn}
                            onClick={() => setShowCreateGroup(true)}>
                            <Plus size={15} />
                        </button>
                    </div>
                )}

                {/* Chat list / Search panel */}
                <div style={s.listWrap}>
                    {searchMode ? (
                        <SearchPanel
                            onChatOpen={(chat) => {
                                setActiveChat(chat)
                                setSearchMode(false)
                                setChats(prev =>
                                    prev.find(c => c.id === chat.id)
                                        ? prev : [chat, ...prev]
                                )
                            }}
                            onClose={() => setSearchMode(false)}
                        />
                    ) : (
                        <>
                            <div style={s.sectionLabel}>
                                <span>{t('chat.messages')}</span>
                                <span style={s.sectionCount}>{chats.length}</span>
                            </div>

                            {loading ? (
                                <div style={{
                                    display: 'flex', flexDirection: 'column',
                                    gap: '4px', padding: '0 8px'
                                }}>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={`skeleton-${i}`} style={s.skeletonItem}>
                                            <div style={s.skeletonAvatar} />
                                            <div style={{
                                                flex: 1, display: 'flex',
                                                flexDirection: 'column', gap: '6px'
                                            }}>
                                                <div style={{ ...s.skeletonLine, width: '60%' }} />
                                                <div style={{
                                                    ...s.skeletonLine,
                                                    width: '85%', height: '10px'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : chats.length === 0 ? (
                                <div style={s.emptyState}>
                                    <div style={s.emptyIcon}>
                                        <MessageSquare size={24}
                                            color="var(--text-muted)" />
                                    </div>
                                    <p style={s.emptyTitle}>{t('chat.noConversations')}</p>
                                    <p style={s.emptyHint}>
                                        {t('chat.searchSomeone')}
                                    </p>
                                </div>
                            ) : (
                                <div style={s.chatList}>
                                    {chats.map(chat => {
                                        const name = getChatName(chat)
                                        const avatar = getChatAvatar(chat)
                                        const status = getChatStatus(chat)
                                        const isActive = activeChat?.id === chat.id
                                        const isHov = hoveredChat === chat.id
                                        const isGroup = chat.type === 'GROUP'
                                        const preview = getPreviewText(chat)

                                        return (
                                            <div
                                                key={chat.id}
                                                style={{
                                                    ...s.chatItem,
                                                    background: isActive
                                                        ? 'var(--accent-bg)'
                                                        : isHov
                                                            ? 'var(--bg-hover)'
                                                            : 'transparent',
                                                    borderColor: isActive
                                                        ? 'var(--accent-bg-hover)'
                                                        : 'transparent',
                                                }}
                                                onClick={() => setActiveChat(chat)}
                                                onMouseEnter={() => setHoveredChat(chat.id)}
                                                onMouseLeave={() => setHoveredChat(null)}
                                            >
                                                <div style={s.avatarWrap}>
                                                    {avatar ? (
                                                        <img src={avatar} alt=""
                                                            style={s.chatAvatar} />
                                                    ) : (
                                                        <div style={{
                                                            ...s.chatAvatarPlaceholder,
                                                            background: isGroup
                                                                ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                                                : 'linear-gradient(135deg,#6366f1,#06b6d4)',
                                                        }}>
                                                            {isGroup
                                                                ? <Users size={16} color="#fff" />
                                                                : <span style={s.avatarLetter}>
                                                                    {name.charAt(0).toUpperCase()}
                                                                </span>
                                                            }
                                                        </div>
                                                    )}
                                                    {status === 'ONLINE' && (
                                                        <div style={s.onlineDot} />
                                                    )}
                                                </div>

                                                <div style={s.chatInfo}>
                                                    <div style={s.chatTopRow}>
                                                        <span style={{
                                                            ...s.chatName,
                                                            color: isActive
                                                                ? 'var(--accent-light)'
                                                                : 'var(--text-primary)',
                                                        }}>
                                                            {name}
                                                        </span>
                                                        <span style={s.chatTime}>
                                                            {chat.lastMessage
                                                                ? formatTime(chat.lastMessage.createdAt)
                                                                : ''}
                                                        </span>
                                                    </div>
                                                    <div style={s.chatBottomRow}>
                                                        <span style={{
                                                            ...s.chatPreview,
                                                            fontStyle: chat.lastMessage?.deleted
                                                                ? 'italic' : 'normal',
                                                            color: chat.unreadCount > 0
                                                                ? 'var(--text-secondary)'
                                                                : 'var(--text-muted)',
                                                        }}>
                                                            {preview}
                                                        </span>
                                                        {chat.unreadCount > 0 && (
                                                            <span style={s.unreadBadge}>
                                                                {chat.unreadCount > 99
                                                                    ? '99+' : chat.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Bottom nav */}
                {!searchMode && (
                    <div style={s.bottomNav}>
                        <button style={s.navBtn} onClick={() => navigate('/profile')}>
                            {me?.avatarUrl ? (
                                <img src={me.avatarUrl} alt="" style={s.navAvatar} />
                            ) : (
                                <div style={s.navAvatarPlaceholder}>
                                    {me?.fullName?.charAt(0)?.toUpperCase()}
                                </div>
                            )}
                            <div style={s.navInfo}>
                                <span style={s.navName}>{me?.fullName}</span>
                                <span style={s.navHandle}>@{me?.username}</span>
                            </div>
                            <ChevronRight size={14} color="var(--text-muted)" />
                        </button>
                    </div>
                )}
            </aside>

            {/* ══════════════ CHAT AREA ══════════════ */}
            <div style={s.chatArea}>
                {!activeChat ? (
                    <div style={s.noChatSelected}>
                        <div style={s.noChatIconWrap}>
                            <MessageSquare size={32} color="var(--text-muted)"
                                strokeWidth={1.5} />
                        </div>
                        <p style={s.noChatTitle}>{t('chat.selectConversation')}</p>
                        <p style={s.noChatSub}>
                            {t('chat.orSearchMessage')}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── Chat header ── */}
                        <div style={s.chatHeader}>
                            <div style={s.chatHeaderLeft}>
                                {getChatAvatar(activeChat) ? (
                                    <img src={getChatAvatar(activeChat)}
                                        style={s.headerAvatar} alt="" />
                                ) : (
                                    <div style={{
                                        ...s.headerAvatarPlaceholder,
                                        background: activeChat.type === 'GROUP'
                                            ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                            : 'linear-gradient(135deg,#6366f1,#06b6d4)',
                                    }}>
                                        {activeChat.type === 'GROUP'
                                            ? <Users size={15} color="#fff" />
                                            : <span style={{
                                                fontSize: 14, fontWeight: 700,
                                                color: '#fff'
                                            }}>
                                                {getChatName(activeChat).charAt(0)}
                                            </span>
                                        }
                                    </div>
                                )}
                                <div>
                                    <div style={s.headerName}>
                                        {getChatName(activeChat)}
                                    </div>
                                    <div style={s.headerSub}>
                                        {isTyping
                                            ? <span style={{ color: 'var(--accent-light)' }}>
                                                {t('chat.typing')}
                                            </span>
                                            : getChatStatus(activeChat) === 'ONLINE'
                                                ? <span style={{ color: 'var(--success)' }}>
                                                    {t('common.online')}
                                                </span>
                                                : <span>{t('common.offline')}</span>
                                        }
                                    </div>
                                </div>
                            </div>
                            {activeChat?.type === 'GROUP' && (
                                <button
                                    style={s.headerActionBtn}
                                    onClick={() => navigate(
                                        `/groups/${activeChat.id}/settings`
                                    )}
                                >
                                    <Settings size={16} />
                                </button>
                            )}
                        </div>

                        {/* ── Messages ── */}
                        <div style={s.messages}>
                            {messages.map(msg => {
                                const isMine = msg.senderId === me?.id
                                const isSticker = isStickerMsg(msg.content)
                                const isHov = hoveredMsg === msg.id

                                return (
                                    <div
                                        key={msg.id}
                                        style={{
                                            ...s.messageRow,
                                            justifyContent: isMine
                                                ? 'flex-end' : 'flex-start',
                                        }}
                                        onMouseEnter={() => setHoveredMsg(msg.id)}
                                        onMouseLeave={() => setHoveredMsg(null)}
                                    >
                                        {/* Avatar собеседника */}
                                        {!isMine && (
                                            <div style={s.msgAvatar}>
                                                {msg.senderAvatar
                                                    ? <img src={msg.senderAvatar}
                                                        style={s.msgAvatarImg} alt="" />
                                                    : <div style={s.msgAvatarPlaceholder}>
                                                        {msg.senderName?.charAt(0)}
                                                    </div>
                                                }
                                            </div>
                                        )}

                                        {/* Кнопки действий при hover — Forward и Delete */}
                                        {isHov && !msg.deleted && (
                                            <div style={s.msgHoverActions}>
                                                <button
                                                    style={s.forwardHoverBtn}
                                                    onClick={() => setForwardMsgId(msg.id)}
                                                    title={t('common.forward')}
                                                >
                                                    <Forward size={13} />
                                                </button>
                                                {isMine && (
                                                    <button
                                                        style={s.deleteHoverBtn}
                                                        onClick={() => handleDeleteMsg(msg.id)}
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {/* ── Стикер (большой эмодзи без bubble) ── */}
                                        {isSticker ? (
                                            <div style={s.stickerMsg}>
                                                <span style={s.stickerEmoji}>
                                                    {msg.content}
                                                </span>
                                                <span style={{
                                                    ...s.stickerTime,
                                                    textAlign: isMine ? 'right' : 'left',
                                                }}>
                                                    {new Date(msg.createdAt)
                                                        .toLocaleTimeString([],
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                    {isMine && (
                                                        <span style={{ marginLeft: 4 }}>
                                                            <MessageTicks
                                                                status={msg.status} />
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        ) : (
                                            /* ── Обычный bubble (текст / медиа) ── */
                                            <div style={{
                                                ...s.bubble,
                                                background: msg.media
                                                    ? 'transparent'
                                                    : isMine
                                                        ? 'var(--bubble-mine)'
                                                        : 'var(--bubble-other)',
                                                borderRadius: isMine
                                                    ? '16px 16px 4px 16px'
                                                    : '16px 16px 16px 4px',
                                                border: msg.media
                                                    ? 'none'
                                                    : isMine
                                                        ? 'none'
                                                        : '1px solid var(--border)',
                                                padding: msg.media ? '0' : '10px 14px',
                                                opacity: msg.temp ? 0.7 : 1,
                                            }}>
                                                {/* Имя отправителя в группе */}
                                                {!isMine &&
                                                    activeChat.type === 'GROUP' &&
                                                    !msg.media && (
                                                        <div style={s.bubbleSender}>
                                                            {msg.senderName}
                                                        </div>
                                                    )}

                                                {/* Медиа или текст */}
                                                {msg.media ? (
                                                    <MediaMessage
                                                        media={msg.media}
                                                        isMine={isMine}
                                                        onForward={() => setForwardMsgId(msg.id)}
                                                    />
                                                ) : (
                                                    <>
                                                        <div style={{
                                                            ...s.bubbleText,
                                                            color: isMine
                                                                ? '#fff'
                                                                : 'var(--text-primary)',
                                                            fontStyle: msg.deleted
                                                                ? 'italic' : 'normal',
                                                            opacity: msg.deleted ? 0.6 : 1,
                                                        }}>
                                                            {msg.content}
                                                        </div>

                                                        {/* Перевод */}
                                                        {!isMine && !msg.deleted && (
                                                            <TranslateButton
                                                                text={msg.content}
                                                                isMine={false}
                                                            />
                                                        )}
                                                    </>
                                                )}

                                                {/* Мета: время + тики */}
                                                {!msg.media && (
                                                    <div style={s.bubbleMeta}>
                                                        <span style={{
                                                            ...s.bubbleTime,
                                                            color: isMine
                                                                ? 'rgba(255,255,255,0.5)'
                                                                : 'var(--text-muted)',
                                                        }}>
                                                            {new Date(msg.createdAt)
                                                                .toLocaleTimeString([],
                                                                    {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                        </span>
                                                        {isMine && (
                                                            <MessageTicks
                                                                status={msg.status} />
                                                        )}
                                                    </div>
                                                )}

                                                {/* Мета под медиа */}
                                                {msg.media && (
                                                    <div style={{
                                                        ...s.mediaMeta,
                                                        justifyContent: isMine
                                                            ? 'flex-end' : 'flex-start',
                                                    }}>
                                                        <span style={{
                                                            fontSize: 11,
                                                            color: 'var(--text-muted)',
                                                            fontVariantNumeric: 'tabular-nums',
                                                        }}>
                                                            {new Date(msg.createdAt)
                                                                .toLocaleTimeString([],
                                                                    {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                        </span>
                                                        {isMine && (
                                                            <MessageTicks
                                                                status={msg.status} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {/* Прогресс загрузки */}
                            {uploadingFile && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end', paddingRight: 8
                                }}>
                                    <UploadProgress
                                        fileName={uploadingFile.name}
                                        progress={uploadingFile.progress}
                                    />
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Input area ── */}
                        <div style={s.inputArea}>

                            {/* Кнопка вложения */}
                            <div style={{ position: 'relative' }} ref={attachBtnRef}>
                                <button
                                    style={{
                                        ...s.toolBtn,
                                        color: showAttachment
                                            ? 'var(--accent)' : 'var(--text-muted)',
                                        background: showAttachment
                                            ? 'var(--accent-bg)' : 'transparent',
                                    }}
                                    onClick={() => {
                                        setShowAttachment(p => !p)
                                        setShowSticker(false)
                                    }}
                                    title={t('chat.attachFile')}
                                >
                                    <Paperclip size={18} />
                                </button>

                                {showAttachment && (
                                    <AttachmentPicker
                                        onSelect={handleMediaSelect}
                                        onClose={() => setShowAttachment(false)}
                                        onCameraOpen={() => setShowCamera(true)}
                                    />
                                )}
                            </div>

                            {/* Поле ввода */}
                            <div style={s.inputWrap}>
                                <textarea
                                    ref={inputRef}
                                    style={s.messageInput}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t('chat.typeMessage')}
                                    rows={1}
                                />
                                {hasProfanity(input) && (
                                    <div style={s.profanityWarn}>
                                        {t('chat.profanityWarn')}
                                    </div>
                                )}
                            </div>

                            {/* Кнопка стикеров */}
                            <div style={{ position: 'relative' }} ref={stickerBtnRef}>
                                <button
                                    style={{
                                        ...s.toolBtn,
                                        color: showSticker
                                            ? 'var(--accent)' : 'var(--text-muted)',
                                        background: showSticker
                                            ? 'var(--accent-bg)' : 'transparent',
                                    }}
                                    onClick={() => {
                                        setShowSticker(p => !p)
                                        setShowAttachment(false)
                                    }}
                                    title={t('chat.stickers')}
                                >
                                    <Smile size={18} />
                                </button>

                                {showSticker && (
                                    <StickerPicker
                                        onSelect={handleStickerSelect}
                                        onClose={() => setShowSticker(false)}
                                    />
                                )}
                            </div>

                            {/* Кнопка отправки */}
                            <button
                                style={{
                                    ...s.sendBtn,
                                    opacity: input.trim() ? 1 : 0.35,
                                    boxShadow: input.trim()
                                        ? 'var(--shadow-accent)' : 'none',
                                }}
                                onClick={handleSend}
                                disabled={!input.trim()}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Модал создания группы */}
            {showCreateGroup && (
                <CreateGroupModal
                    onClose={() => setShowCreateGroup(false)}
                    onCreate={() => {
                        fetchChats()
                        setShowCreateGroup(false)
                    }}
                />
            )}

            {/* Forward Modal */}
            {forwardMsgId && (
                <ForwardModal
                    messageId={forwardMsgId}
                    onClose={() => setForwardMsgId(null)}
                    onForwarded={(msg) => {
                        if (!msg) return
                        // Обновляем lastMessage в сайдбаре для целевого чата
                        setChats(prev => prev.map(c =>
                            c.id === msg.chatId ? { ...c, lastMessage: msg } : c
                        ))
                        // Добавляем в messages ТОЛЬКО если находимся в том же чате
                        if (msg.chatId === activeChatRef.current?.id) {
                            setMessages(prev =>
                                prev.find(m => m.id === msg.id) ? prev : [...prev, msg]
                            )
                        }
                    }}
                />
            )}

            {/* Camera Modal */}
            {showCamera && (
                <CameraModal
                    onClose={() => setShowCamera(false)}
                    onCapture={(file) => handleMediaSelect(file, 'PHOTO')}
                />
            )}
        </div>
    )
}

/* ─────────────────────── Styles ─────────────────────── */
const s = {
    page: {
        display: 'flex', height: '100vh',
        background: 'var(--bg-primary)',
        fontFamily: "'Inter', sans-serif",
        color: 'var(--text-primary)', overflow: 'hidden',
    },
    msgHoverActions: {
        display: 'flex',
        gap: '4px',
        alignSelf: 'center',
        flexShrink: 0,
        animation: 'fadeIn 0.1s ease',
    },
    forwardHoverBtn: {
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-bg-hover)',
        borderRadius: '8px', padding: '6px',
        color: 'var(--accent)', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        transition: 'opacity 0.15s',
    },
    /* Sidebar */
    sidebar: {
        width: '300px', minWidth: '300px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
    },
    topBar: {
        padding: '14px 16px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        minHeight: '56px', gap: '8px',
    },
    logoWrap: {
        display: 'flex', alignItems: 'center',
        gap: '9px', flexShrink: 0,
    },
    logoIcon: {
        width: '28px', height: '28px', borderRadius: '8px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-bg-hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    logoText: {
        fontSize: '15px', fontWeight: '700',
        color: 'var(--text-primary)', letterSpacing: '-0.03em',
    },
    topActions: { display: 'flex', alignItems: 'center', gap: '2px' },
    iconBtn: {
        background: 'transparent', border: 'none',
        borderRadius: '8px', padding: '7px',
        cursor: 'pointer', color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', transition: 'background 0.15s, color 0.15s',
        flexShrink: 0,
    },
    notifBadge: {
        position: 'absolute', top: '2px', right: '2px',
        background: 'var(--error)', color: '#fff',
        borderRadius: '999px', padding: '1px 4px',
        fontSize: '9px', fontWeight: '700',
        lineHeight: '1.4', minWidth: '14px', textAlign: 'center',
    },
    searchTopBar: {
        display: 'flex', alignItems: 'center', gap: '12px', flex: 1,
    },
    backBtn: {
        background: 'var(--bg-hover)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '6px', cursor: 'pointer',
        color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center',
    },
    searchTopTitle: {
        fontSize: '15px', fontWeight: '600',
        color: 'var(--text-primary)', letterSpacing: '-0.02em',
    },
    metaRow: {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderBottom: '1px solid var(--border)',
    },
    connPill: {
        display: 'flex', alignItems: 'center', gap: '5px',
        padding: '3px 9px', borderRadius: '999px',
        fontSize: '11px', fontWeight: '600',
        border: '1px solid', whiteSpace: 'nowrap', flexShrink: 0,
    },
    searchBarWrap: {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 12px', borderBottom: '1px solid var(--border)',
    },
    searchBar: {
        flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '8px 12px',
        cursor: 'text', textAlign: 'left',
    },
    searchPlaceholder: { fontSize: '13px', color: 'var(--text-muted)' },
    newChatBtn: {
        background: 'var(--accent-bg)', border: '1px solid var(--accent-bg-hover)',
        borderRadius: '10px', padding: '8px', cursor: 'pointer',
        color: 'var(--accent)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
    },
    listWrap: {
        flex: 1, overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
    },
    sectionLabel: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px 6px',
        fontSize: '11px', fontWeight: '600',
        color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
    },
    sectionCount: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '999px', padding: '1px 7px',
        fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)',
    },
    skeletonItem: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 8px', borderRadius: '12px',
    },
    skeletonAvatar: {
        width: '44px', height: '44px', borderRadius: '14px',
        background: 'var(--bg-elevated)', flexShrink: 0,
        backgroundImage: 'linear-gradient(90deg,var(--bg-elevated) 25%,'
            + 'var(--bg-hover) 50%,var(--bg-elevated) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
    },
    skeletonLine: {
        height: '12px', borderRadius: '6px',
        backgroundImage: 'linear-gradient(90deg,var(--bg-elevated) 25%,'
            + 'var(--bg-hover) 50%,var(--bg-elevated) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
    },
    emptyState: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '10px', padding: '48px 24px', flex: 1,
    },
    emptyIcon: {
        width: '48px', height: '48px', borderRadius: '14px',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '4px',
    },
    emptyTitle: {
        fontSize: '14px', fontWeight: '600',
        color: 'var(--text-secondary)'
    },
    emptyHint: {
        fontSize: '13px', color: 'var(--text-muted)',
        textAlign: 'center'
    },
    chatList: {
        display: 'flex', flexDirection: 'column',
        gap: '2px', padding: '4px 8px',
    },
    chatItem: {
        display: 'flex', alignItems: 'center', gap: '11px',
        padding: '9px 10px', borderRadius: '12px',
        cursor: 'pointer', border: '1px solid transparent',
        transition: 'background 0.12s, border-color 0.12s',
    },
    avatarWrap: { position: 'relative', flexShrink: 0 },
    chatAvatar: {
        width: '44px', height: '44px',
        borderRadius: '14px', objectFit: 'cover'
    },
    chatAvatarPlaceholder: {
        width: '44px', height: '44px', borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    avatarLetter: {
        fontSize: '16px', fontWeight: '700',
        color: '#fff', letterSpacing: '-0.02em'
    },
    onlineDot: {
        position: 'absolute', bottom: '1px', right: '1px',
        width: '10px', height: '10px', borderRadius: '50%',
        background: 'var(--success)',
        border: '2px solid var(--bg-secondary)',
        boxShadow: '0 0 6px var(--success)',
    },
    chatInfo: {
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: '3px',
    },
    chatTopRow: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '8px',
    },
    chatName: {
        fontSize: '14px', fontWeight: '600', letterSpacing: '-0.01em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        transition: 'color 0.12s',
    },
    chatTime: {
        fontSize: '11px', color: 'var(--text-muted)',
        flexShrink: 0, fontVariantNumeric: 'tabular-nums',
    },
    chatBottomRow: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: '8px',
    },
    chatPreview: {
        fontSize: '13px', whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis',
        flex: 1, minWidth: 0,
    },
    unreadBadge: {
        background: 'var(--accent)', color: '#fff',
        borderRadius: '999px', padding: '2px 7px',
        fontSize: '10px', fontWeight: '700',
        flexShrink: 0, minWidth: '18px', textAlign: 'center',
    },
    bottomNav: { borderTop: '1px solid var(--border)', padding: '10px 12px' },
    navBtn: {
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--bg-glass)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '10px 12px', cursor: 'pointer',
    },
    navAvatar: {
        width: '34px', height: '34px', borderRadius: '10px',
        objectFit: 'cover', flexShrink: 0
    },
    navAvatarPlaceholder: {
        width: '34px', height: '34px', borderRadius: '10px',
        background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '700', color: '#fff', flexShrink: 0,
    },
    navInfo: {
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: '2px', textAlign: 'left', minWidth: 0,
    },
    navName: {
        fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    navHandle: { fontSize: '11px', color: 'var(--text-muted)' },

    /* Chat area */
    chatArea: {
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: 'var(--bg-primary)',
    },
    noChatSelected: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '12px',
    },
    noChatIconWrap: {
        width: '64px', height: '64px', borderRadius: '20px',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '4px',
    },
    noChatTitle: {
        fontSize: '16px', fontWeight: '600',
        color: 'var(--text-secondary)', letterSpacing: '-0.02em'
    },
    noChatSub: { fontSize: '13px', color: 'var(--text-muted)' },

    chatHeader: {
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    chatHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    headerAvatar: {
        width: '38px', height: '38px',
        borderRadius: '12px', objectFit: 'cover'
    },
    headerAvatarPlaceholder: {
        width: '38px', height: '38px', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    headerName: {
        fontSize: '15px', fontWeight: '600',
        color: 'var(--text-primary)', letterSpacing: '-0.02em'
    },
    headerSub: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' },
    headerActionBtn: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '8px', cursor: 'pointer',
        color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center',
    },

    messages: {
        flex: 1, overflowY: 'auto', padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: '6px',
    },
    messageRow: {
        display: 'flex', alignItems: 'flex-end', gap: '8px',
        animation: 'fadeUp 0.15s ease forwards',
    },
    msgAvatar: { flexShrink: 0 },
    msgAvatarImg: {
        width: '28px', height: '28px',
        borderRadius: '8px', objectFit: 'cover'
    },
    msgAvatarPlaceholder: {
        width: '28px', height: '28px', borderRadius: '8px',
        background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: '700', color: '#fff',
    },

    /* Кнопка удаления при hover */
    deleteHoverBtn: {
        background: 'var(--error-bg)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '8px', padding: '6px',
        color: 'var(--error)', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        alignSelf: 'center', flexShrink: 0,
        transition: 'opacity 0.15s',
        animation: 'fadeIn 0.1s ease',
    },

    bubble: {
        maxWidth: '62%', fontSize: '14px',
        lineHeight: '1.55', wordBreak: 'break-word',
        boxShadow: 'var(--shadow-xs)',
    },
    bubbleSender: {
        fontSize: '11px', fontWeight: '700',
        color: 'var(--accent-light)',
        marginBottom: '4px', letterSpacing: '-0.01em',
    },
    bubbleText: { fontWeight: '400' },
    bubbleMeta: {
        display: 'flex', alignItems: 'center',
        gap: '5px', justifyContent: 'flex-end', marginTop: '5px',
    },
    bubbleTime: {
        fontSize: '11px', fontVariantNumeric: 'tabular-nums',
    },
    mediaMeta: {
        display: 'flex', alignItems: 'center',
        gap: '5px', marginTop: '4px',
    },

    /* Стикер */
    stickerMsg: {
        display: 'flex', flexDirection: 'column', gap: '2px',
    },
    stickerEmoji: {
        fontSize: '48px', lineHeight: 1,
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
        cursor: 'default', userSelect: 'none',
        transition: 'transform 0.1s',
    },
    stickerTime: {
        fontSize: '11px', color: 'var(--text-muted)',
        fontVariantNumeric: 'tabular-nums',
        display: 'flex', alignItems: 'center', gap: '4px',
    },

    /* Input area */
    inputArea: {
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', gap: '8px', alignItems: 'flex-end',
    },
    toolBtn: {
        border: 'none', borderRadius: '10px',
        width: '40px', height: '40px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.15s, color 0.15s',
    },
    inputWrap: {
        flex: 1, display: 'flex', flexDirection: 'column', gap: '6px',
    },
    messageInput: {
        width: '100%', background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: '12px', padding: '11px 16px',
        color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
        resize: 'none', fontFamily: "'Inter', sans-serif",
        maxHeight: '120px', lineHeight: '1.5',
        transition: 'border-color 0.15s',
    },
    profanityWarn: {
        fontSize: '11px', color: 'var(--warning)',
        padding: '4px 10px', background: 'var(--warning-bg)',
        borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)',
    },
    sendBtn: {
        background: 'var(--accent)', border: 'none',
        borderRadius: '12px', width: '44px', height: '44px',
        color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'opacity 0.15s, transform 0.1s',
    },
}