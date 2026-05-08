import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendAiMessage, getAiHistory, clearAiHistory } from '../api/ai'

export default function AiChatPage() {
    const navigate = useNavigate()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [histLoading, setHistLoading] = useState(true)
    const [error, setError] = useState('')
    const messagesEndRef = useRef()

    useEffect(() => { fetchHistory() }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const fetchHistory = async () => {
        try {
            const res = await getAiHistory()
            // Разворачиваем историю в плоский список сообщений
            const flat = []
            res.data.forEach(item => {
                flat.push({ role: 'user', text: item.userMessage, id: item.id + '_u', createdAt: item.createdAt })
                flat.push({ role: 'ai', text: item.aiResponse, id: item.id + '_a', createdAt: item.createdAt })
            })
            setMessages(flat)
        } catch {
            setError('Failed to load history')
        } finally {
            setHistLoading(false)
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return
        const userText = input.trim()
        setInput('')
        setError('')

        // Оптимистично показываем сообщение пользователя
        const tempId = Date.now()
        setMessages(prev => [...prev, {
            role: 'user', text: userText, id: tempId, temp: true
        }])
        setLoading(true)

        try {
            const res = await sendAiMessage(userText)
            // Заменяем temp + добавляем ответ ИИ
            setMessages(prev => [
                ...prev.filter(m => m.id !== tempId),
                {
                    role: 'user', text: res.data.userMessage,
                    id: res.data.id + '_u', createdAt: res.data.createdAt
                },
                {
                    role: 'ai', text: res.data.aiResponse,
                    id: res.data.id + '_a', createdAt: res.data.createdAt
                },
            ])
        } catch (err) {
            setMessages(prev => prev.filter(m => m.id !== tempId))
            setError(err.response?.data?.message || 'Failed to get response')
        } finally {
            setLoading(false)
        }
    }

    const handleClear = async () => {
        try {
            await clearAiHistory()
            setMessages([])
        } catch {
            setError('Failed to clear history')
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Форматируем текст ответа ИИ (markdown-like)
    const formatAiText = (text) => {
        return text
            .split('\n')
            .map((line, i) => {
                // Код
                if (line.startsWith('```') || line.endsWith('```')) {
                    return <div key={i} style={styles.codeLine}>{line.replace(/```/g, '')}</div>
                }
                // Жирный
                const parts = line.split(/(\*\*.*?\*\*)/g)
                return (
                    <div key={i} style={{ minHeight: line ? 'auto' : '8px' }}>
                        {parts.map((part, j) =>
                            part.startsWith('**') && part.endsWith('**')
                                ? <strong key={j}>{part.slice(2, -2)}</strong>
                                : part
                        )}
                    </div>
                )
            })
    }

    const timeStr = (dateStr) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleTimeString('ru-RU', {
            hour: '2-digit', minute: '2-digit'
        })
    }

    return (
        <div style={styles.page}>

            {/* Хедер */}
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate('/chat')}>
                    ← Назад
                </button>

                <div style={styles.headerCenter}>
                    <div style={styles.botAvatar}>🤖</div>
                    <div>
                        <div style={styles.botName}>JoBot</div>
                        <div style={styles.botStatus}>AI Assistant · Gemini</div>
                    </div>
                </div>

                <button style={styles.clearBtn} onClick={handleClear} title="Очистить историю">
                    🗑
                </button>
            </div>

            {/* Сообщения */}
            <div style={styles.messages}>

                {/* Приветствие если нет истории */}
                {!histLoading && messages.length === 0 && (
                    <div style={styles.welcome}>
                        <div style={styles.welcomeBot}>🤖</div>
                        <div style={styles.welcomeTitle}>Привет! Я JoBot</div>
                        <div style={styles.welcomeText}>
                            Ваш ИИ ассистент внутри JoChat.<br />
                            Могу помочь с вопросами, переводом,<br />
                            написанием текстов и многим другим.
                        </div>
                        <div style={styles.suggestions}>
                            {[
                                '💡 Как улучшить продуктивность?',
                                '✍️ Напиши приветственное письмо',
                                '🌐 Переведи текст на английский',
                                '💻 Объясни что такое REST API',
                            ].map((s, i) => (
                                <button
                                    key={i}
                                    style={styles.suggestionBtn}
                                    onClick={() => setInput(s.slice(3))}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {histLoading && (
                    <div style={styles.centerMsg}>Загрузка истории...</div>
                )}

                {/* Список сообщений */}
                {messages.map(msg => {
                    const isUser = msg.role === 'user'
                    return (
                        <div
                            key={msg.id}
                            style={{
                                ...styles.messageRow,
                                justifyContent: isUser ? 'flex-end' : 'flex-start',
                            }}
                        >
                            {/* Аватар ИИ */}
                            {!isUser && (
                                <div style={styles.aiBubbleAvatar}>🤖</div>
                            )}

                            <div style={{
                                ...styles.bubble,
                                background: isUser ? '#7c6af7' : '#1e1e38',
                                borderRadius: isUser
                                    ? '18px 18px 4px 18px'
                                    : '18px 18px 18px 4px',
                                maxWidth: isUser ? '65%' : '75%',
                                opacity: msg.temp ? 0.7 : 1,
                            }}>
                                <div style={styles.bubbleText}>
                                    {isUser ? msg.text : formatAiText(msg.text)}
                                </div>
                                {msg.createdAt && (
                                    <div style={styles.bubbleTime}>{timeStr(msg.createdAt)}</div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {/* Индикатор загрузки */}
                {loading && (
                    <div style={{ ...styles.messageRow, justifyContent: 'flex-start' }}>
                        <div style={styles.aiBubbleAvatar}>🤖</div>
                        <div style={{
                            ...styles.bubble, background: '#1e1e38',
                            borderRadius: '18px 18px 18px 4px'
                        }}>
                            <div style={styles.typingDots}>
                                <span style={styles.dot1} />
                                <span style={styles.dot2} />
                                <span style={styles.dot3} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Ошибка */}
                {error && (
                    <div style={styles.errorMsg}>⚠️ {error}</div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Инпут */}
            <div style={styles.inputArea}>
                <textarea
                    style={styles.input}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Спросите JoBot что-нибудь..."
                    rows={1}
                    disabled={loading}
                />
                <button
                    style={{
                        ...styles.sendBtn,
                        opacity: input.trim() && !loading ? 1 : 0.4,
                        cursor: input.trim() && !loading ? 'pointer' : 'default',
                    }}
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                >
                    ➤
                </button>
            </div>
        </div>
    )
}

const styles = {
    page: {
        display: 'flex', flexDirection: 'column',
        height: '100vh', background: '#0f0f1a',
        fontFamily: "'Segoe UI', sans-serif", color: '#fff',
    },

    // Header
    header: {
        background: '#13132b',
        borderBottom: '1px solid #2d2d4e',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        background: 'transparent', border: 'none',
        color: '#7c6af7', fontSize: '15px',
        cursor: 'pointer', fontWeight: '600',
    },
    headerCenter: {
        display: 'flex', alignItems: 'center', gap: '12px',
    },
    botAvatar: {
        width: '40px', height: '40px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '20px',
    },
    botName: { fontSize: '16px', fontWeight: '700' },
    botStatus: { fontSize: '12px', color: '#4ade80' },
    clearBtn: {
        background: '#2d2d4e', border: 'none',
        borderRadius: '8px', padding: '6px 10px',
        cursor: 'pointer', fontSize: '16px',
    },

    // Messages
    messages: {
        flex: 1, overflowY: 'auto',
        padding: '20px 16px',
        display: 'flex', flexDirection: 'column', gap: '12px',
    },
    centerMsg: {
        textAlign: 'center', color: '#555',
        fontSize: '14px', padding: '40px',
    },

    // Welcome
    welcome: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '12px',
        padding: '40px 20px', textAlign: 'center',
    },
    welcomeBot: { fontSize: '56px' },
    welcomeTitle: { fontSize: '22px', fontWeight: '800', color: '#fff' },
    welcomeText: { color: '#666', fontSize: '14px', lineHeight: '1.7' },
    suggestions: {
        display: 'flex', flexDirection: 'column',
        gap: '8px', width: '100%', maxWidth: '380px',
        marginTop: '8px',
    },
    suggestionBtn: {
        background: '#1e1e38', border: '1px solid #3d3d6e',
        color: '#a78bfa', borderRadius: '10px',
        padding: '10px 16px', fontSize: '13px',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s',
    },

    // Bubbles
    messageRow: {
        display: 'flex', alignItems: 'flex-end', gap: '8px',
    },
    aiBubbleAvatar: {
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '16px',
        flexShrink: 0,
    },
    bubble: {
        padding: '12px 16px',
        fontSize: '15px', lineHeight: '1.6',
        wordBreak: 'break-word',
    },
    bubbleText: { color: '#fff' },
    bubbleTime: {
        fontSize: '11px', color: 'rgba(255,255,255,0.4)',
        marginTop: '6px', textAlign: 'right',
    },
    codeLine: {
        background: '#0f0f1a', borderRadius: '6px',
        padding: '8px 12px', fontSize: '13px',
        fontFamily: 'monospace', color: '#a78bfa',
        margin: '4px 0',
    },

    // Typing dots
    typingDots: {
        display: 'flex', gap: '4px',
        alignItems: 'center', padding: '4px 0',
    },
    dot1: {
        width: '8px', height: '8px', borderRadius: '50%',
        background: '#7c6af7', display: 'inline-block',
        animation: 'bounce 1s infinite',
    },
    dot2: {
        width: '8px', height: '8px', borderRadius: '50%',
        background: '#7c6af7', display: 'inline-block',
        animation: 'bounce 1s infinite 0.2s',
    },
    dot3: {
        width: '8px', height: '8px', borderRadius: '50%',
        background: '#7c6af7', display: 'inline-block',
        animation: 'bounce 1s infinite 0.4s',
    },

    errorMsg: {
        background: '#2d1a1a', border: '1px solid #f87171',
        color: '#f87171', borderRadius: '10px',
        padding: '10px 14px', fontSize: '13px',
        textAlign: 'center',
    },

    // Input
    inputArea: {
        padding: '12px 16px',
        borderTop: '1px solid #2d2d4e',
        background: '#13132b',
        display: 'flex', gap: '10px', alignItems: 'flex-end',
    },
    input: {
        flex: 1, background: '#1e1e38',
        border: '1px solid #3d3d6e', borderRadius: '12px',
        padding: '12px 16px', color: '#fff',
        fontSize: '15px', outline: 'none',
        resize: 'none', fontFamily: "'Segoe UI', sans-serif",
        maxHeight: '120px', lineHeight: '1.5',
    },
    sendBtn: {
        background: '#7c6af7', border: 'none',
        borderRadius: '12px', width: '46px', height: '46px',
        color: '#fff', fontSize: '18px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
    },
}