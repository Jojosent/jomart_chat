import { useState, useEffect, useRef } from 'react'
import { searchUsers } from '../api/user'
import { getOrCreatePrivate } from '../api/chat'

export default function SearchPanel({ onChatOpen, onClose }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState(null)
    const inputRef = useRef()

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        if (query.trim().length < 2) {
            setResults([])
            setSelected(null)
            return
        }
        const timer = setTimeout(() => doSearch(query), 400)
        return () => clearTimeout(timer)
    }, [query])

    const doSearch = async (q) => {
        setLoading(true)
        try {
            const res = await searchUsers(q)
            setResults(res.data)
        } catch {
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChat = async (user) => {
        try {
            const res = await getOrCreatePrivate(user.id)
            onChatOpen(res.data)
            onClose()
        } catch (err) {
            console.error('Failed to open chat:', err)
        }
    }

    const handleSelectUser = (user) => {
        setSelected(selected?.id === user.id ? null : user)
    }

    return (
        <div style={styles.container}>

            {/* Поисковая строка */}
            <div style={styles.searchBar}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                    ref={inputRef}
                    style={styles.input}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Поиск по имени или @username..."
                />
                {query && (
                    <button style={styles.clearBtn} onClick={() => setQuery('')}>
                        ✕
                    </button>
                )}
            </div>

            {/* Результаты */}
            <div style={styles.results}>
                {loading && (
                    <div style={styles.statusMsg}>
                        <span style={styles.loadingDots}>Поиск</span>
                    </div>
                )}

                {!loading && query.length >= 2 && results.length === 0 && (
                    <div style={styles.statusMsg}>
                        <div style={styles.emptyIcon}>👤</div>
                        <div style={styles.emptyText}>Пользователи не найдены</div>
                        <div style={styles.emptyHint}>Попробуйте другой запрос</div>
                    </div>
                )}

                {!loading && query.length < 2 && query.length > 0 && (
                    <div style={styles.statusMsg}>
                        <div style={styles.hintText}>Введите минимум 2 символа</div>
                    </div>
                )}

                {!loading && query.length === 0 && (
                    <div style={styles.statusMsg}>
                        <div style={styles.emptyIcon}>🔍</div>
                        <div style={styles.emptyText}>Найдите пользователей</div>
                        <div style={styles.emptyHint}>Введите имя или @username</div>
                    </div>
                )}

                {/* Список пользователей */}
                {results.map(user => {
                    const isSelected = selected?.id === user.id
                    const letter = user.fullName?.charAt(0)?.toUpperCase() || '?'

                    return (
                        <div key={user.id}>
                            {/* Строка пользователя */}
                            <div
                                style={{
                                    ...styles.userRow,
                                    background: isSelected ? '#1e1e3a' : 'transparent',
                                }}
                                onClick={() => handleSelectUser(user)}
                            >
                                {/* Аватар */}
                                {user.avatarUrl ? (
                                    <img src={user.avatarUrl} style={styles.avatar} alt="" />
                                ) : (
                                    <div style={styles.avatarPlaceholder}>{letter}</div>
                                )}

                                {/* Инфо */}
                                <div style={styles.userInfo}>
                                    <div style={styles.userName}>{user.fullName}</div>
                                    <div style={styles.userMeta}>
                                        <span style={styles.userHandle}>@{user.username}</span>
                                        {user.bio && (
                                            <span style={styles.userBio}> · {user.bio}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Статус онлайн */}
                                <div style={{
                                    ...styles.statusDot,
                                    background: user.status === 'ONLINE' ? '#4ade80' : '#555',
                                }} />
                            </div>

                            {/* Раскрытая карточка */}
                            {isSelected && (
                                <div style={styles.expandedCard}>
                                    <div style={styles.expandedInfo}>
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} style={styles.expandedAvatar} alt="" />
                                        ) : (
                                            <div style={styles.expandedAvatarPlaceholder}>{letter}</div>
                                        )}
                                        <div>
                                            <div style={styles.expandedName}>{user.fullName}</div>
                                            <div style={styles.expandedHandle}>@{user.username}</div>
                                            {user.bio && (
                                                <div style={styles.expandedBio}>{user.bio}</div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={styles.expandedActions}>
                                        <button
                                            style={styles.messageBtn}
                                            onClick={() => handleOpenChat(user)}
                                        >
                                            💬 Написать сообщение
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: "'Segoe UI', sans-serif",
    },
    searchBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        borderBottom: '1px solid #2d2d4e',
        background: '#13132b',
    },
    searchIcon: { fontSize: '16px', flexShrink: 0 },
    input: {
        flex: 1,
        background: 'transparent',
        border: 'none',
        outline: 'none',
        color: '#fff',
        fontSize: '15px',
        fontFamily: "'Segoe UI', sans-serif",
    },
    clearBtn: {
        background: 'transparent',
        border: 'none',
        color: '#555',
        cursor: 'pointer',
        fontSize: '14px',
        padding: '2px 6px',
        borderRadius: '50%',
        flexShrink: 0,
    },
    results: {
        flex: 1,
        overflowY: 'auto',
    },
    statusMsg: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        gap: '10px',
    },
    emptyIcon: { fontSize: '40px', opacity: 0.3 },
    emptyText: { color: '#666', fontSize: '15px', fontWeight: '600' },
    emptyHint: { color: '#444', fontSize: '13px' },
    hintText: { color: '#555', fontSize: '13px' },
    loadingDots: { color: '#7c6af7', fontSize: '14px' },

    userRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid #1e1e38',
        transition: 'background 0.15s',
    },
    avatar: {
        width: '46px', height: '46px',
        borderRadius: '50%', objectFit: 'cover',
        flexShrink: 0,
    },
    avatarPlaceholder: {
        width: '46px', height: '46px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', fontWeight: '800', color: '#fff',
        flexShrink: 0,
    },
    userInfo: { flex: 1, minWidth: 0 },
    userName: {
        fontSize: '15px', fontWeight: '600', color: '#fff',
        marginBottom: '3px',
    },
    userMeta: {
        fontSize: '13px', color: '#666',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    userHandle: { color: '#7c6af7' },
    userBio: { color: '#555' },
    statusDot: {
        width: '10px', height: '10px',
        borderRadius: '50%', flexShrink: 0,
    },

    // Раскрытая карточка
    expandedCard: {
        background: '#16163a',
        borderBottom: '1px solid #2d2d4e',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
    },
    expandedInfo: {
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
    },
    expandedAvatar: {
        width: '56px', height: '56px',
        borderRadius: '50%', objectFit: 'cover',
        border: '2px solid #7c6af7',
    },
    expandedAvatarPlaceholder: {
        width: '56px', height: '56px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', fontWeight: '800', color: '#fff',
        border: '2px solid #7c6af7',
        flexShrink: 0,
    },
    expandedName: {
        fontSize: '17px', fontWeight: '700', color: '#fff',
        marginBottom: '3px',
    },
    expandedHandle: {
        fontSize: '13px', color: '#7c6af7',
        marginBottom: '6px',
    },
    expandedBio: {
        fontSize: '13px', color: '#888',
        lineHeight: '1.5',
    },
    expandedActions: {
        display: 'flex',
        gap: '10px',
    },
    messageBtn: {
        flex: 1,
        background: '#7c6af7',
        border: 'none',
        color: '#fff',
        borderRadius: '10px',
        padding: '12px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
    },
}