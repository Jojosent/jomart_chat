import { useState, useEffect, useRef } from 'react'
import { searchUsers } from '../api/user'
import { getOrCreatePrivate } from '../api/chat'
import { Search, MessageSquare, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function SearchPanel({ onChatOpen, onClose }) {
    const { t } = useTranslation()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState(null)
    const inputRef = useRef()

    useEffect(() => { inputRef.current?.focus() }, [])
    useEffect(() => {
        if (query.trim().length < 2) { setResults([]); setSelected(null); return }
        const t = setTimeout(() => doSearch(query), 400)
        return () => clearTimeout(t)
    }, [query])

    const doSearch = async (q) => {
        setLoading(true)
        try { const res = await searchUsers(q); setResults(res.data) }
        catch { setResults([]) }
        finally { setLoading(false) }
    }

    const handleOpenChat = async (user) => {
        try {
            const res = await getOrCreatePrivate(user.id)
            onChatOpen(res.data); onClose()
        } catch (e) { console.error(e) }
    }

    return (
        <div style={sp.wrap}>
            {/* Search input */}
            <div style={sp.inputRow}>
                <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                <input
                    ref={inputRef}
                    style={sp.input}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t('chat.searchPlaceholder')}
                />
                {query && (
                    <button style={sp.clearBtn} onClick={() => setQuery('')}>
                        <X size={13} />
                    </button>
                )}
            </div>

            {/* Results */}
            <div style={sp.results}>
                {loading && (
                    <div style={sp.state}>
                        <div style={sp.spinner} />
                        <span style={sp.stateText}>{t('common.searching')}</span>
                    </div>
                )}
                {!loading && query.length === 0 && (
                    <div style={sp.state}>
                        <div style={sp.stateIconWrap}>
                            <Search size={18} color="var(--text-muted)" />
                        </div>
                        <p style={sp.stateTitle}>{t('chat.findPeople')}</p>
                        <p style={sp.stateHint}>{t('chat.minChars')}</p>
                    </div>
                )}
                {!loading && query.length >= 2 && results.length === 0 && (
                    <div style={sp.state}>
                        <div style={sp.stateIconWrap}>
                            <Search size={18} color="var(--text-muted)" />
                        </div>
                        <p style={sp.stateTitle}>{t('common.noResults')}</p>
                        <p style={sp.stateHint}>{t('common.tryDifferent')}</p>
                    </div>
                )}

                {results.map(user => (
                    <div key={user.id} style={sp.userRow}>
                        {/* Avatar */}
                        <div style={sp.avatarWrap}>
                            {user.avatarUrl
                                ? <img src={user.avatarUrl} style={sp.avatar} alt="" />
                                : <div style={sp.avatarPh}>{user.fullName?.charAt(0)}</div>
                            }
                            <div style={{
                                ...sp.statusDot,
                                background: user.status === 'ONLINE' ? 'var(--online)' : 'var(--offline)',
                                boxShadow: user.status === 'ONLINE' ? '0 0 6px var(--online)' : 'none',
                            }} />
                        </div>

                        {/* Info */}
                        <div style={sp.userInfo}>
                            <span style={sp.userName}>{user.fullName}</span>
                            <span style={sp.userHandle}>@{user.username}</span>
                            {user.bio && <span style={sp.userBio}>{user.bio}</span>}
                        </div>

                        {/* Message btn */}
                        <button style={sp.msgBtn} onClick={() => handleOpenChat(user)}>
                            <MessageSquare size={14} />
                            {t('chat.sendMessage')}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

const sp = {
    wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
    inputRow: {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-tertiary)',
    },
    input: {
        flex: 1, background: 'transparent', border: 'none',
        color: 'var(--text-primary)', fontSize: '13px',
        outline: 'none', fontFamily: 'inherit',
    },
    clearBtn: {
        background: 'transparent', border: 'none',
        color: 'var(--text-muted)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', padding: '2px',
    },
    results: { flex: 1, overflowY: 'auto' },
    state: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px', gap: '8px',
    },
    spinner: {
        width: '20px', height: '20px',
        border: '2px solid var(--border)',
        borderTop: '2px solid var(--accent)',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    },
    stateText: { fontSize: '13px', color: 'var(--text-muted)' },
    stateIconWrap: {
        width: '44px', height: '44px', borderRadius: '12px',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px',
    },
    stateTitle: { fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' },
    stateHint: { fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' },
    userRow: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '11px 14px', borderBottom: '1px solid var(--border)',
        transition: 'background 0.12s',
    },
    avatarWrap: { position: 'relative', flexShrink: 0 },
    avatar: { width: '42px', height: '42px', borderRadius: '13px', objectFit: 'cover' },
    avatarPh: {
        width: '42px', height: '42px', borderRadius: '13px',
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: '700', color: '#fff',
    },
    statusDot: {
        position: 'absolute', bottom: '0px', right: '0px',
        width: '10px', height: '10px', borderRadius: '50%',
        border: '2px solid var(--bg-secondary)',
    },
    userInfo: {
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: '2px',
    },
    userName: {
        fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
    },
    userHandle: { fontSize: '12px', color: 'var(--accent-light)' },
    userBio: {
        fontSize: '12px', color: 'var(--text-muted)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    msgBtn: {
        display: 'flex', alignItems: 'center', gap: '5px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-bg-hover)',
        borderRadius: '8px', padding: '7px 12px',
        fontSize: '12px', fontWeight: '600',
        color: 'var(--accent)', cursor: 'pointer',
        fontFamily: 'inherit', flexShrink: 0,
        transition: 'background 0.15s',
    },
}

