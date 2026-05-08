import { useState, useEffect, useRef } from 'react'
import { getMyChats, getOrCreatePrivate, getChatMessages, deleteMessage } from '../api/chat'
import useWebSocket from '../hooks/useWebSocket'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import CreateGroupModal from '../components/CreateGroupModal'
import MessageTicks from '../components/MessageTicks'
import NotificationPanel from '../components/NotificationPanel'
import useNotifications from '../hooks/useNotifications'
import SearchPanel from '../components/SearchPanel'
import TranslateButton from '../components/TranslateButton'
import LangSwitcher from '../components/LangSwitcher'
import ThemeToggle from '../components/ThemeToggle'


export default function ChatPage() {
    const navigate = useNavigate()
    const me = useAuthStore((s) => s.user)
    const [searchMode, setSearchMode] = useState(false)
    const [chats, setChats] = useState([])
    const [activeChat, setActiveChat] = useState(null)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [typingUsers, setTypingUsers] = useState({})
    const [loading, setLoading] = useState(true)
    const activeChatRef = useRef(null)
    const messagesEndRef = useRef(null)
    const typingTimerRef = useRef(null)
    const [showCreateGroup, setShowCreateGroup] = useState(false)

    const FRONT_BAD_WORDS = [
        'блять', 'блядь', 'ёбаный', 'ебаный', 'пиздец', 'хуй', 'сука', 'мудак',
        'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy'
    ]
    const [showNotifications, setShowNotifications] = useState(false)
    const {
        unreadCount,
        addNotification,
        fetchUnreadCount,
        resetUnread,
    } = useNotifications()

    const hasProfanity = (text) => {
        const lower = text.toLowerCase()
        return FRONT_BAD_WORDS.some(w => lower.includes(w))
    }

    // WebSocket handlers
    const { connected, sendMessage, markRead, sendTyping } = useWebSocket(
        // onMessage
        (msg) => {
            setMessages(prev => {
                // Если это наше сообщение — заменяем temp на реальное
                if (msg.senderId === me?.id) {
                    const hasTemp = prev.some(m => m.temp && m.chatId === msg.chatId)
                    if (hasTemp) {
                        // Заменяем последнее temp сообщение
                        const idx = [...prev].reverse().findIndex(m => m.temp && m.chatId === msg.chatId)
                        const realIdx = prev.length - 1 - idx
                        return prev.map((m, i) => i === realIdx ? msg : m)
                    }
                }
                // Чужое сообщение — просто добавляем если нет дубликата
                if (prev.find(m => m.id === msg.id)) return prev
                return [...prev, msg]
            })

            // Обновляем список чатов (последнее сообщение)
            setChats(prev => prev.map(c =>
                c.id === msg.chatId ? { ...c, lastMessage: msg } : c
            ))

            // Помечаем прочитанным если этот чат активен
            if (msg.chatId === activeChatRef.current?.id && msg.senderId !== me?.id) {
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
        (notification) => {
            addNotification(notification)
        }
    )


    useEffect(() => { fetchChats() }, [])
    useEffect(() => {
        activeChatRef.current = activeChat
    }, [activeChat])
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (activeChat) {
            fetchMessages(activeChat.id)
            markRead(activeChat.id)
        }
    }, [activeChat])

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

    const handleSend = () => {
        if (!input.trim() || !activeChat) return

        const content = input.trim()
        setInput('')

        // ── Оптимистичное обновление ─────────────────────────────────
        // Показываем сообщение СРАЗУ не дожидаясь WebSocket
        const tempMsg = {
            id: Date.now(),           // временный id
            chatId: activeChat.id,
            senderId: me?.id,
            senderName: me?.fullName,
            senderAvatar: me?.avatarUrl,
            content: content,
            status: 'SENT',
            edited: false,
            deleted: false,
            createdAt: new Date().toISOString(),
            temp: true,               // флаг что это временное
        }

        setMessages(prev => [...prev, tempMsg])
        sendTyping(activeChat?.id, false)

        // ── Отправляем через WebSocket ───────────────────────────────
        sendMessage(activeChat.id, content)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        } else {
            sendTyping(activeChat?.id, true)
            clearTimeout(typingTimerRef.current)
            typingTimerRef.current = setTimeout(() => {
                sendTyping(activeChat?.id, false)
            }, 2000)
        }
    }

    const handleDeleteMsg = async (msgId) => {
        await deleteMessage(msgId)
        setMessages(prev => prev.map(m =>
            m.id === msgId ? { ...m, deleted: true, content: 'Сообщение удалено' } : m
        ))
    }

    // Получить имя собеседника в приватном чате
    const getChatName = (chat) => {
        if (chat.type === 'GROUP') {
            return chat.name || chat.groupName || 'Группа'
        }
        const other = chat.members?.find(m => m.id !== me?.id)
        return other?.fullName || 'Неизвестный'
    }
    const getChatAvatar = (chat) => {
        if (chat.type === 'GROUP') return chat.avatarUrl || null
        const other = chat.members?.find(m => m.id !== me?.id)
        return other?.avatarUrl
    }

    const isTyping = Object.values(typingUsers).some(Boolean)

    // Птички статуса
    const renderTicks = (msg) => {
        if (msg.senderId !== me?.id) return null
        if (msg.status === 'READ') return <span style={styles.ticksRead}>✓✓</span>
        if (msg.status === 'DELIVERED') return <span style={styles.ticksGray}>✓✓</span>
        return <span style={styles.ticksGray}>✓</span>
    }

    return (
        <div style={styles.page}>

            {/* ── Sidebar ─────────────────────────────── */}
            <div style={styles.sidebar}>
                {/* Хедер сайдбара */}
                <div style={styles.sidebarHeader}>
                    {!searchMode ? (
                        <>
                            <span style={styles.logo}>JoChat</span>
                            <div style={styles.sidebarActions}>
                                <button style={styles.iconBtn} onClick={() => setSearchMode(true)} title="Поиск">
                                    🔍
                                </button>

                                <div style={{ position: 'relative' }}>
                                    <button
                                        style={styles.iconBtn}
                                        onClick={() => {
                                            setShowNotifications(!showNotifications)
                                            if (!showNotifications) resetUnread()
                                        }}
                                        title="Уведомления"
                                    >
                                        🔔
                                        {unreadCount > 0 && (
                                            <span style={styles.notifBadge}>{unreadCount}</span>
                                        )}
                                    </button>
                                    {showNotifications && (
                                        <NotificationPanel
                                            onClose={() => setShowNotifications(false)}
                                            onCountChange={fetchUnreadCount}
                                        />
                                    )}
                                </div>

                                <button style={styles.iconBtn} onClick={() => navigate('/ai')} title="ИИ">🤖</button>
                                <button style={styles.iconBtn} onClick={() => setShowCreateGroup(true)} title="Группа">👥</button>
                                <button style={styles.iconBtn} onClick={() => navigate('/profile')} title="Профиль">👤</button>
                                <ThemeToggle />
                            </div>
                        </>
                    ) : (
                        <div style={styles.searchHeader}>
                            <button style={styles.backSearchBtn} onClick={() => setSearchMode(false)}>←</button>
                            <span style={styles.searchTitle}>Поиск пользователей</span>
                        </div>
                    )}
                </div>

                {/* Язык — отдельная строка под хедером */}
                {!searchMode && (
                    <div style={styles.langRow}>
                        <LangSwitcher />
                    </div>
                )}

                {/* Статус соединения */}
                <div style={{
                    ...styles.connStatus,
                    background: connected ? '#1a2e1a' : '#2d1a1a',
                    color: connected ? '#4ade80' : '#f87171',
                }}>
                    {connected ? '● Подключено' : '○ Переподключение...'}
                </div>

                {/* Список чатов */}

                {searchMode ? (
                    <SearchPanel
                        onChatOpen={(chat) => {
                            setActiveChat(chat)
                            setSearchMode(false)
                            // Добавляем чат в список если его ещё нет
                            setChats(prev =>
                                prev.find(c => c.id === chat.id) ? prev : [chat, ...prev]
                            )
                        }}
                        onClose={() => setSearchMode(false)}
                    />
                ) : (
                    /* существующий список чатов */
                    <div style={styles.chatList}>
                        {loading ? (
                            <div style={styles.emptyState}>Загрузка...</div>
                        ) : chats.length === 0 ? (
                            <div style={styles.emptyState}>
                                Нет чатов.<br />Найдите пользователя для начала.
                            </div>
                        ) : (
                            chats.map(chat => {
                                const name = getChatName(chat)
                                const avatar = getChatAvatar(chat)
                                const letter = name.charAt(0).toUpperCase()
                                const isActive = activeChat?.id === chat.id

                                return (
                                    <div
                                        key={chat.id}
                                        style={{
                                            ...styles.chatItem,
                                            background: isActive ? '#2d2d4e' : 'transparent',
                                        }}
                                        onClick={() => setActiveChat(chat)}
                                    >
                                        {/* Аватар */}
                                        {avatar ? (
                                            <img src={avatar} alt="" style={styles.chatAvatar} />
                                        ) : (
                                            <div style={styles.chatAvatarPlaceholder}>{letter}</div>
                                        )}

                                        <div style={styles.chatInfo}>
                                            <div style={styles.chatName}>{name}</div>
                                            <div style={styles.chatLastMsg}>
                                                {chat.lastMessage?.deleted
                                                    ? 'Сообщение удалено'
                                                    : chat.lastMessage?.content || 'Нет сообщений'}
                                            </div>
                                        </div>

                                        {chat.unreadCount > 0 && (
                                            <div style={styles.unreadBadge}>{chat.unreadCount}</div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}
            </div>

            {/* ── Чат ─────────────────────────────────── */}
            <div style={styles.chatArea}>
                {!activeChat ? (
                    <div style={styles.noChatSelected}>
                        <div style={styles.noChatIcon}>💬</div>
                        <div style={styles.noChatText}>Выберите чат</div>
                        <div style={styles.noChatSub}>или найдите пользователя для начала переписки</div>
                    </div>
                ) : (
                    <>
                        {/* Хедер чата */}
                        <div style={styles.chatHeader}>
                            {/* Левая часть: Аватар и информация */}
                            <div style={styles.chatHeaderInfo}>
                                {getChatAvatar(activeChat) ? (
                                    <img src={getChatAvatar(activeChat)} style={styles.chatHeaderAvatar} alt="" />
                                ) : (
                                    <div style={styles.chatHeaderAvatarPlaceholder}>
                                        {getChatName(activeChat).charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <div style={styles.chatHeaderName}>{getChatName(activeChat)}</div>
                                    <div style={styles.chatHeaderStatus}>
                                        {isTyping ? (
                                            <span style={{ color: '#7c6af7' }}>печатает...</span>
                                        ) : 'в сети'}
                                    </div>
                                </div>
                            </div>

                            {/* Правая часть: Кнопка настроек группы */}
                            {activeChat?.type === 'GROUP' && (
                                <button
                                    style={styles.settingsBtn}
                                    onClick={() => navigate(`/groups/${activeChat.id}/settings`)}
                                    title="Настройки группы"
                                >
                                    ⚙️
                                </button>
                            )}
                        </div>

                        {/* Сообщения */}
                        <div style={styles.messages}>
                            {messages.map(msg => {
                                const isMine = msg.senderId === me?.id
                                return (
                                    <div
                                        key={msg.id}
                                        style={{
                                            ...styles.messageRow,
                                            justifyContent: isMine ? 'flex-end' : 'flex-start',
                                        }}
                                    >
                                        <div style={{
                                            ...styles.bubble,
                                            background: isMine ? '#7c6af7' : '#1e1e38',
                                            borderRadius: isMine
                                                ? '18px 18px 4px 18px'
                                                : '18px 18px 18px 4px',
                                            opacity: msg.deleted ? 0.5 : 1,
                                        }}>
                                            {/* Имя отправителя в группе */}
                                            {!isMine && activeChat.type === 'GROUP' && (
                                                <div style={styles.bubbleSender}>{msg.senderName}</div>
                                            )}

                                            <div style={styles.bubbleText}>{msg.content}</div>
                                            <div style={{
                                                ...styles.bubble,
                                                background: isMine ? '#7c6af7' : '#1e1e38',
                                                borderRadius: isMine
                                                    ? '18px 18px 4px 18px'
                                                    : '18px 18px 18px 4px',
                                                opacity: msg.deleted ? 0.5 : 1,
                                            }}>
                                                {/* Имя отправителя в группе */}
                                                {!isMine && activeChat.type === 'GROUP' && (
                                                    <div style={styles.bubbleSender}>{msg.senderName}</div>
                                                )}

                                                {/* Текст сообщения */}
                                                <div style={styles.bubbleText}>{msg.content}</div>

                                                {/* ── Кнопка перевода (только чужие сообщения) ── */}
                                                {!isMine && !msg.deleted && (
                                                    <TranslateButton
                                                        text={msg.content}
                                                        isMine={false}
                                                    />
                                                )}

                                                {/* Мета: время + птички + удалить */}
                                                <div style={styles.bubbleMeta}>
                                                    <span style={styles.bubbleTime}>
                                                        {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                    {msg.senderId === me?.id && (
                                                        <MessageTicks status={msg.status} />
                                                    )}
                                                    {isMine && !msg.deleted && (
                                                        <button
                                                            style={styles.deleteBtn}
                                                            onClick={() => handleDeleteMsg(msg.id)}
                                                            title="Удалить"
                                                        >✕</button>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={styles.bubbleMeta}>
                                                <span style={styles.bubbleTime}>
                                                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                                {msg.senderId === me?.id && (
                                                    <MessageTicks status={msg.status} />
                                                )}
                                                {isMine && !msg.deleted && (
                                                    <button
                                                        style={styles.deleteBtn}
                                                        onClick={() => handleDeleteMsg(msg.id)}
                                                        title="Удалить"
                                                    >✕</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Инпут */}
                        {/* Инпут */}
                        <div style={styles.inputArea}>
                            <div style={styles.inputWrapper}>
                                <textarea
                                    style={styles.messageInput}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Напишите сообщение..."
                                    rows={1}
                                />
                                {/* Предупреждение о мате */}
                                {hasProfanity(input) && (
                                    <div style={styles.profanityWarning}>
                                        ⚠️ Сообщение содержит запрещённые слова — они будут заменены на ****
                                    </div>
                                )}
                            </div>
                            <button
                                style={{
                                    ...styles.sendBtn,
                                    opacity: input.trim() ? 1 : 0.5,
                                }}
                                onClick={handleSend}
                                disabled={!input.trim()}
                            >
                                ➤
                            </button>
                        </div>
                    </>
                )}
            </div>
            {showCreateGroup && (
                <CreateGroupModal
                    onClose={() => setShowCreateGroup(false)}
                    onCreate={(group) => {
                        fetchChats()
                        setShowCreateGroup(false)
                    }}
                />
            )}
        </div>
    )
}

const styles = {
    page: {
        display: 'flex', height: '100vh',
        background: 'var(--bg-primary)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: 'var(--text-primary)',
        overflow: 'hidden',
    },
    sidebar: {
        width: '320px', minWidth: '320px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
    },
   sidebarHeader: {
  padding: '10px 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid var(--border)',
  minHeight: '52px',
  gap: '8px',
},

    sidebarActions: {
  display: 'flex',
  alignItems: 'center',
  gap: '1px',
  flexShrink: 0,
},

iconBtn: {
  background: 'transparent',
  border: 'none',
  borderRadius: '7px',
  padding: '5px 6px',
  cursor: 'pointer',
  fontSize: '15px',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  transition: 'background 0.15s',
  flexShrink: 0,
},
logo: {
  fontSize: '18px',
  fontWeight: '900',
  color: 'var(--accent)',
  letterSpacing: '-1px',
  flexShrink: 0,
},
    langRow: {
        padding: '6px 16px',
        borderBottom: '1px solid var(--border)',
    },
    connStatus: {
        padding: '4px 16px',
        fontSize: '11px', fontWeight: '600',
    },
    chatList: {
        flex: 1, overflowY: 'auto', padding: '8px 0',
    },
    emptyState: {
        padding: '40px 20px', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6',
    },
    chatItem: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', cursor: 'pointer',
        borderRadius: '10px', margin: '2px 8px',
        transition: 'background 0.15s',
    },
    chatAvatar: {
        width: '46px', height: '46px',
        borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
    },
    chatAvatarPlaceholder: {
        width: '46px', height: '46px', borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', fontWeight: '800', color: '#fff', flexShrink: 0,
    },
    chatInfo: { flex: 1, minWidth: 0 },
    chatName: {
        fontSize: '15px', fontWeight: '600',
        color: 'var(--text-primary)', marginBottom: '2px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    chatLastMsg: {
        fontSize: '13px', color: 'var(--text-muted)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    unreadBadge: {
        background: 'var(--accent)', color: '#fff',
        borderRadius: '10px', padding: '2px 7px',
        fontSize: '12px', fontWeight: '700', flexShrink: 0,
    },
    chatArea: {
        flex: 1, display: 'flex',
        flexDirection: 'column', overflow: 'hidden',
        background: 'var(--bg-primary)',
    },
    noChatSelected: {
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '12px',
    },
    noChatIcon: { fontSize: '64px', opacity: 0.2 },
    noChatText: { fontSize: '20px', fontWeight: '700', color: 'var(--text-muted)' },
    noChatSub: { fontSize: '14px', color: 'var(--text-muted)' },
    chatHeader: {
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    chatHeaderInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    chatHeaderAvatar: {
        width: '40px', height: '40px',
        borderRadius: '50%', objectFit: 'cover',
    },
    chatHeaderAvatarPlaceholder: {
        width: '40px', height: '40px', borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: '800', color: '#fff',
    },
    chatHeaderName: { fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' },
    chatHeaderStatus: { fontSize: '12px', color: 'var(--success)' },
    settingsBtn: {
        background: 'var(--bg-elevated)', border: 'none',
        borderRadius: '8px', padding: '6px 10px',
        cursor: 'pointer', fontSize: '16px',
    },
    messages: {
        flex: 1, overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: '8px',
    },
    messageRow: {
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease',
    },
    bubble: {
        maxWidth: '65%', padding: '10px 14px',
        fontSize: '15px', lineHeight: '1.5', wordBreak: 'break-word',
        boxShadow: 'var(--shadow-sm)',
    },
    bubbleSender: {
        fontSize: '12px', fontWeight: '700',
        color: 'var(--accent-light)', marginBottom: '4px',
    },
    bubbleText: { color: '#fff' },
    bubbleMeta: {
        display: 'flex', alignItems: 'center',
        gap: '4px', justifyContent: 'flex-end', marginTop: '4px',
    },
    bubbleTime: { fontSize: '11px', color: 'rgba(255,255,255,0.5)' },
    deleteBtn: {
        background: 'transparent', border: 'none',
        color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
        fontSize: '11px', padding: '0 2px',
    },
    inputArea: {
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', gap: '10px', alignItems: 'flex-end',
    },
    inputWrapper: {
        flex: 1, display: 'flex', flexDirection: 'column', gap: '4px',
    },
    messageInput: {
        flex: 1, background: 'var(--bg-elevated)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px', padding: '12px 16px',
        color: 'var(--text-primary)', fontSize: '15px',
        outline: 'none', resize: 'none',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        maxHeight: '120px', lineHeight: '1.5',
        transition: 'border-color 0.2s',
    },
    profanityWarning: {
        background: 'var(--warning-bg)',
        border: '1px solid var(--warning)',
        color: 'var(--warning)', borderRadius: '8px',
        padding: '6px 12px', fontSize: '12px',
    },
    sendBtn: {
        background: 'var(--accent)', border: 'none',
        borderRadius: '12px', width: '46px', height: '46px',
        color: '#fff', fontSize: '18px', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
        transition: 'opacity 0.2s, transform 0.1s',
        boxShadow: 'var(--shadow-sm)',
    },
    notifBadge: {
        position: 'absolute', top: '-4px', right: '-4px',
        background: 'var(--error)', color: '#fff',
        borderRadius: '10px', padding: '1px 5px',
        fontSize: '10px', fontWeight: '700',
        minWidth: '16px', textAlign: 'center',
    },
    searchHeader: {
        display: 'flex', alignItems: 'center', gap: '12px', flex: 1,
    },
    backSearchBtn: {
        background: 'transparent', border: 'none',
        color: 'var(--accent)', fontSize: '20px',
        cursor: 'pointer', padding: '0 4px', lineHeight: 1,
    },
    searchTitle: {
        fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)',
    },
}