import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendAiMessage, getAiHistory, clearAiHistory } from '../api/ai'
import {
    ArrowLeft, Trash2, Send, Bot, Sparkles,
    Code, Globe, PenLine, Lightbulb, RotateCcw
} from 'lucide-react'
import { LangSwitcher } from '../components/LangSwitcher'

const SUGGESTIONS = [
    { icon: <Lightbulb size={14} />, text: 'How to improve productivity?' },
    { icon: <PenLine size={14} />,   text: 'Write a professional introduction' },
    { icon: <Globe size={14} />,     text: 'Translate text to English' },
    { icon: <Code size={14} />,      text: 'Explain what REST API is' },
]

export default function AiChatPage() {
    const navigate = useNavigate()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [histLoading, setHistLoading] = useState(true)
    const [error, setError] = useState('')
    const messagesEndRef = useRef()
    const inputRef = useRef()
    const [showClearConfirm, setShowClearConfirm] = useState(false)

    useEffect(() => { fetchHistory() }, [])
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const fetchHistory = async () => {
        try {
            const res = await getAiHistory()
            const flat = []
            res.data.forEach(item => {
                flat.push({ role: 'user', text: item.userMessage, id: item.id + '_u', createdAt: item.createdAt })
                flat.push({ role: 'ai',   text: item.aiResponse,  id: item.id + '_a', createdAt: item.createdAt })
            })
            setMessages(flat)
        } catch { setError('Failed to load history') }
        finally { setHistLoading(false) }
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return
        const userText = input.trim()
        setInput(''); setError('')
        const tempId = Date.now()
        setMessages(prev => [...prev, { role: 'user', text: userText, id: tempId, temp: true }])
        setLoading(true)
        try {
            const res = await sendAiMessage(userText)
            setMessages(prev => [
                ...prev.filter(m => m.id !== tempId),
                { role: 'user', text: res.data.userMessage, id: res.data.id + '_u', createdAt: res.data.createdAt },
                { role: 'ai',   text: res.data.aiResponse,  id: res.data.id + '_a', createdAt: res.data.createdAt },
            ])
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId))
            setError(err.response?.data?.message || 'Failed to get response')
        } finally { setLoading(false) }
    }

    const handleClear = async () => {
        try { await clearAiHistory(); setMessages([]); setShowClearConfirm(false) }
        catch { setError('Failed to clear history') }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    const formatAiText = (text) => {
        const lines = text.split('\n')
        return lines.map((line, i) => {
            if (line.startsWith('```') || line.endsWith('```')) {
                return <div key={i} style={as.codeLine}>{line.replace(/```/g, '')}</div>
            }
            const parts = line.split(/(\*\*.*?\*\*)/g)
            return (
                <div key={i} style={{ minHeight: line ? 'auto' : '6px' }}>
                    {parts.map((p, j) =>
                        p.startsWith('**') && p.endsWith('**')
                            ? <strong key={j} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>
                            : p
                    )}
                </div>
            )
        })
    }

    const timeStr = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

    return (
        <div style={as.page}>
            {/* Header */}
            <header style={as.header}>
                <button style={as.backBtn} onClick={() => navigate('/chat')}>
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div style={as.headerCenter}>
                    <div style={as.botAvatar}>
                        <Bot size={18} color="#6366f1" />
                    </div>
                    <div>
                        <div style={as.botName}>JoBot</div>
                        <div style={as.botStatus}>
                            <Sparkles size={10} />
                            AI Assistant · Gemini
                        </div>
                    </div>
                </div>

                <button
                    style={as.clearBtn}
                    onClick={() => setShowClearConfirm(true)}
                    title="Clear history"
                    disabled={messages.length === 0}
                >
                    <Trash2 size={15} />
                </button>
            </header>

            {/* Messages */}
            <div style={as.messages}>

                {/* Welcome screen */}
                {!histLoading && messages.length === 0 && (
                    <div style={as.welcome}>
                        <div style={as.welcomeAvatar}>
                            <Bot size={32} color="#6366f1" />
                        </div>
                        <h2 style={as.welcomeTitle}>Hi, I'm JoBot</h2>
                        <p style={as.welcomeSubtitle}>
                            Your AI assistant inside JoChat.<br />
                            Ask me anything — I'm here to help.
                        </p>
                        <div style={as.suggestionGrid}>
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    style={as.suggestionBtn}
                                    onClick={() => { setInput(s.text); inputRef.current?.focus() }}
                                >
                                    <span style={as.suggestionIcon}>{s.icon}</span>
                                    <span style={as.suggestionText}>{s.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {histLoading && (
                    <div style={as.centered}>
                        <div style={as.spinner} />
                        <span style={as.loadingText}>Loading history...</span>
                    </div>
                )}

                {/* Message list */}
                {messages.map(msg => {
                    const isUser = msg.role === 'user'
                    return (
                        <div key={msg.id} style={{
                            ...as.msgRow,
                            justifyContent: isUser ? 'flex-end' : 'flex-start',
                            opacity: msg.temp ? 0.6 : 1,
                        }}>
                            {!isUser && (
                                <div style={as.aiBubbleIcon}>
                                    <Bot size={14} color="#6366f1" />
                                </div>
                            )}
                            <div style={{
                                ...as.bubble,
                                background: isUser ? 'var(--accent)' : 'var(--bg-elevated)',
                                border: isUser ? 'none' : '1px solid var(--border)',
                                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                maxWidth: isUser ? '60%' : '72%',
                                boxShadow: isUser ? 'var(--shadow-accent)' : 'var(--shadow-xs)',
                            }}>
                                <div style={{
                                    ...as.bubbleText,
                                    color: isUser ? '#fff' : 'var(--text-primary)',
                                }}>
                                    {isUser ? msg.text : formatAiText(msg.text)}
                                </div>
                                {msg.createdAt && (
                                    <div style={{
                                        ...as.bubbleTime,
                                        color: isUser ? 'rgba(255,255,255,0.45)' : 'var(--text-muted)',
                                    }}>
                                        {timeStr(msg.createdAt)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {/* Typing indicator */}
                {loading && (
                    <div style={{ ...as.msgRow, justifyContent: 'flex-start' }}>
                        <div style={as.aiBubbleIcon}>
                            <Bot size={14} color="#6366f1" />
                        </div>
                        <div style={{
                            ...as.bubble,
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: '16px 16px 16px 4px',
                        }}>
                            <div style={as.typingDots}>
                                <span style={{ ...as.dot, animationDelay: '0s' }} />
                                <span style={{ ...as.dot, animationDelay: '0.18s' }} />
                                <span style={{ ...as.dot, animationDelay: '0.36s' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={as.errorMsg}>
                        <RotateCcw size={13} />
                        {error}
                        <button style={as.retryBtn} onClick={() => setError('')}>Dismiss</button>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={as.inputArea}>
                <div style={as.inputWrap}>
                    <textarea
                        ref={inputRef}
                        style={as.input}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask JoBot anything..."
                        rows={1}
                        disabled={loading}
                    />
                </div>
                <button
                    style={{
                        ...as.sendBtn,
                        opacity: input.trim() && !loading ? 1 : 0.35,
                        boxShadow: input.trim() && !loading ? 'var(--shadow-accent)' : 'none',
                    }}
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                >
                    <Send size={16} />
                </button>
            </div>

            {/* Clear confirm modal */}
            {showClearConfirm && (
                <div style={as.overlay}>
                    <div style={as.modal}>
                        <h3 style={as.modalTitle}>Clear conversation?</h3>
                        <p style={as.modalBody}>All messages with JoBot will be permanently deleted.</p>
                        <div style={as.modalActions}>
                            <button style={as.modalCancel} onClick={() => setShowClearConfirm(false)}>Cancel</button>
                            <button style={as.modalConfirm} onClick={handleClear}>Clear</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const as = {
    page: {
        display: 'flex', flexDirection: 'column',
        height: '100vh', background: 'var(--bg-primary)',
        fontFamily: "'Inter', sans-serif", color: 'var(--text-primary)',
    },
    header: {
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px', height: '56px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(12px)',
    },
    backBtn: {
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'transparent', border: 'none',
        color: 'var(--accent)', fontSize: '13px', fontWeight: '600',
        cursor: 'pointer', fontFamily: 'inherit',
        padding: '6px 10px', borderRadius: '8px',
    },
    headerCenter: {
        display: 'flex', alignItems: 'center', gap: '12px',
    },
    botAvatar: {
        width: '36px', height: '36px', borderRadius: '12px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-bg-hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    botName: {
        fontSize: '14px', fontWeight: '700',
        color: 'var(--text-primary)', letterSpacing: '-0.02em',
    },
    botStatus: {
        display: 'flex', alignItems: 'center', gap: '4px',
        fontSize: '11px', color: 'var(--accent-light)', fontWeight: '500',
        marginTop: '1px',
    },
    clearBtn: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '7px',
        color: 'var(--text-secondary)', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        transition: 'opacity 0.15s',
    },
    messages: {
        flex: 1, overflowY: 'auto',
        padding: '24px 20px',
        display: 'flex', flexDirection: 'column', gap: '10px',
    },
    centered: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '12px', flex: 1, padding: '60px 0',
    },
    spinner: {
        width: '22px', height: '22px',
        border: '2px solid var(--border)',
        borderTop: '2px solid var(--accent)',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite',
    },
    loadingText: { fontSize: '13px', color: 'var(--text-muted)' },
    welcome: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '14px',
        padding: '40px 20px', textAlign: 'center',
    },
    welcomeAvatar: {
        width: '64px', height: '64px', borderRadius: '20px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-bg-hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '4px',
    },
    welcomeTitle: {
        fontSize: '22px', fontWeight: '700',
        color: 'var(--text-primary)', letterSpacing: '-0.03em',
    },
    welcomeSubtitle: {
        fontSize: '14px', color: 'var(--text-secondary)',
        lineHeight: '1.7', margin: 0,
    },
    suggestionGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        width: '100%', maxWidth: '440px',
        marginTop: '8px',
    },
    suggestionBtn: {
        display: 'flex', alignItems: 'flex-start', gap: '8px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '12px', padding: '12px 14px',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s, border-color 0.15s',
        fontFamily: 'inherit',
    },
    suggestionIcon: {
        color: 'var(--accent)', flexShrink: 0, marginTop: '1px',
    },
    suggestionText: {
        fontSize: '13px', color: 'var(--text-secondary)',
        fontWeight: '500', lineHeight: '1.4',
    },
    msgRow: {
        display: 'flex', alignItems: 'flex-end', gap: '8px',
        animation: 'fadeUp 0.15s ease forwards',
    },
    aiBubbleIcon: {
        width: '28px', height: '28px', borderRadius: '9px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-bg-hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    bubble: {
        padding: '11px 15px',
        fontSize: '14px', lineHeight: '1.6',
        wordBreak: 'break-word',
    },
    bubbleText: { fontWeight: '400' },
    bubbleTime: {
        fontSize: '11px', marginTop: '6px', textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
    },
    codeLine: {
        background: 'var(--bg-primary)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '8px 12px',
        fontSize: '13px',
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--accent-light)',
        margin: '4px 0',
        overflowX: 'auto',
    },
    typingDots: {
        display: 'flex', gap: '5px', alignItems: 'center',
        padding: '4px 2px',
    },
    dot: {
        width: '7px', height: '7px', borderRadius: '50%',
        background: 'var(--accent)', display: 'inline-block',
        animation: 'bounce 1s infinite',
    },
    errorMsg: {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--error-bg)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '10px', padding: '10px 14px',
        fontSize: '13px', color: 'var(--error)', fontWeight: '500',
    },
    retryBtn: {
        marginLeft: 'auto', background: 'transparent', border: 'none',
        color: 'var(--error)', cursor: 'pointer', fontWeight: '700',
        fontSize: '12px', fontFamily: 'inherit', textDecoration: 'underline',
    },
    inputArea: {
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        display: 'flex', gap: '10px', alignItems: 'flex-end',
    },
    inputWrap: { flex: 1 },
    input: {
        width: '100%',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: '12px', padding: '11px 16px',
        color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
        resize: 'none', fontFamily: "'Inter', sans-serif",
        maxHeight: '120px', lineHeight: '1.5',
        transition: 'border-color 0.15s',
    },
    sendBtn: {
        background: 'var(--accent)', border: 'none',
        borderRadius: '12px', width: '44px', height: '44px',
        color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'opacity 0.15s, transform 0.1s',
    },
    overlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, animation: 'fadeIn 0.15s ease',
    },
    modal: {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px', padding: '28px',
        width: '100%', maxWidth: '360px',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeUp 0.15s ease',
    },
    modalTitle: {
        fontSize: '17px', fontWeight: '700',
        color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '8px',
    },
    modalBody: {
        fontSize: '14px', color: 'var(--text-secondary)',
        lineHeight: '1.6', marginBottom: '24px',
    },
    modalActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
    modalCancel: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '8px 18px',
        fontSize: '13px', fontWeight: '600',
        color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
    },
    modalConfirm: {
        background: 'var(--error)', border: 'none',
        borderRadius: '8px', padding: '8px 18px',
        fontSize: '13px', fontWeight: '600',
        color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
    },
}