import { useState, useEffect } from 'react'
import { createGroup } from '../api/group'
import { searchUsers } from '../api/user'
import { X, Users, Search, Check, ArrowRight } from 'lucide-react'


export default function CreateGroupModal({ onClose, onCreate }) {
    const [step, setStep] = useState('info')  // 'info' | 'members'
    const [name, setName] = useState('')
    const [description, setDesc] = useState('')
    const [search, setSearch] = useState('')
    const [results, setResults] = useState([])
    const [selected, setSelected] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (search.trim().length < 2) { setResults([]); return }
        const timer = setTimeout(async () => {
            try {
                const res = await searchUsers(search)
                setResults(res.data)
            } catch { setResults([]) }
        }, 400)
        return () => clearTimeout(timer)
    }, [search])

    const toggleMember = (user) => {
        setSelected(prev =>
            prev.find(u => u.id === user.id)
                ? prev.filter(u => u.id !== user.id)
                : [...prev, user]
        )
    }

    const handleCreate = async () => {
        if (!name.trim()) { setError('Enter group name'); return }
        setLoading(true); setError('')
        try {
            const res = await createGroup({
                name,
                description,
                memberIds: selected.map(u => u.id)
            })
            onCreate(res.data)
            onClose()
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create group')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={styles.modal}>

                {/* Хедер */}
                <div style={styles.header}>
                    <span style={styles.title}>
                        {step === 'info' ? '👥 Новая группа' : '➕ Добавить участников'}
                    </span>
                    <button style={styles.closeBtn} onClick={onClose}><X size={14} /></button>
                </div>

                {error && <div style={styles.error}>{error}</div>}

                {/* Шаг 1 — Info */}
                {step === 'info' && (
                    <div style={styles.body}>
                        <div style={styles.field}>
                            <label style={styles.label}>Название группы *</label>
                            <input
                                style={styles.input}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Например: Наша команда"
                                maxLength={50}
                            />
                            <span style={styles.counter}>{name.length}/50</span>
                        </div>

                        <div style={styles.field}>
                            <label style={styles.label}>Описание</label>
                            <textarea
                                style={styles.textarea}
                                value={description}
                                onChange={e => setDesc(e.target.value)}
                                placeholder="О чём эта группа?"
                                maxLength={200}
                                rows={3}
                            />
                            <span style={styles.counter}>{description.length}/200</span>
                        </div>

                        <button
                            style={{ ...styles.btn, opacity: name.trim() ? 1 : 0.5 }}
                            onClick={() => name.trim() && setStep('members')}
                        >
                            Далее →
                        </button>
                    </div>
                )}

                {/* Шаг 2 — Members */}
                {step === 'members' && (
                    <div style={styles.body}>
                        {/* Выбранные участники */}
                        {selected.length > 0 && (
                            <div style={styles.selectedList}>
                                {selected.map(u => (
                                    <div key={u.id} style={styles.selectedChip}>
                                        <span>{u.fullName}</span>
                                        <button
                                            style={styles.chipRemove}
                                            onClick={() => toggleMember(u)}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Поиск */}
                        <input
                            style={styles.input}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Найти пользователя..."
                        />

                        {/* Результаты */}
                        <div style={styles.searchResults}>
                            {results.map(user => {
                                const isSelected = selected.find(u => u.id === user.id)
                                return (
                                    <div
                                        key={user.id}
                                        style={{
                                            ...styles.userRow,
                                            background: isSelected ? '#2d2d4e' : 'transparent'
                                        }}
                                        onClick={() => toggleMember(user)}
                                    >
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} style={styles.avatar} alt="" />
                                        ) : (
                                            <div style={styles.avatarPlaceholder}>
                                                {user.fullName?.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div style={styles.userName}>{user.fullName}</div>
                                            <div style={styles.userHandle}>@{user.username}</div>
                                        </div>
                                        <div style={styles.checkbox}>
                                            {isSelected ? '✓' : ''}
                                        </div>
                                    </div>
                                )
                            })}
                            {search.length >= 2 && results.length === 0 && (
                                <div style={styles.noResults}>Пользователи не найдены</div>
                            )}
                        </div>

                        <div style={styles.footer}>
                            <button style={styles.backBtn} onClick={() => setStep('info')}>
                                ← Назад
                            </button>
                            <button
                                style={styles.btn}
                                onClick={handleCreate}
                                disabled={loading}
                            >
                                {loading ? 'Создание...' : `✓ Создать (${selected.length} уч.)`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

const styles = {
    overlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        background: '#1a1a2e',
        border: '1px solid #2d2d4e',
        borderRadius: '20px',
        width: '100%', maxWidth: '460px',
        maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', sans-serif",
    },
    header: {
        padding: '20px 24px',
        borderBottom: '1px solid #2d2d4e',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    title: { fontSize: '18px', fontWeight: '700', color: '#fff' },
    closeBtn: {
        background: '#2d2d4e', border: 'none',
        color: '#888', borderRadius: '8px',
        width: '32px', height: '32px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '14px',
    },
    body: {
        padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: '14px',
        overflowY: 'auto', flex: 1,
    },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '12px', color: '#888', fontWeight: '600', textTransform: 'uppercase' },
    input: {
        background: '#0f0f1a', border: '1px solid #3d3d6e',
        borderRadius: '10px', padding: '12px 16px',
        color: '#fff', fontSize: '15px', outline: 'none',
    },
    textarea: {
        background: '#0f0f1a', border: '1px solid #3d3d6e',
        borderRadius: '10px', padding: '12px 16px',
        color: '#fff', fontSize: '15px', outline: 'none',
        resize: 'vertical', fontFamily: "'Segoe UI', sans-serif",
    },
    counter: { fontSize: '11px', color: '#555', textAlign: 'right' },
    btn: {
        background: '#7c6af7', border: 'none', color: '#fff',
        borderRadius: '10px', padding: '13px',
        fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    },
    backBtn: {
        background: 'transparent', border: '1px solid #3d3d6e',
        color: '#888', borderRadius: '10px', padding: '13px 20px',
        fontSize: '15px', cursor: 'pointer',
    },
    selectedList: {
        display: 'flex', flexWrap: 'wrap', gap: '8px',
    },
    selectedChip: {
        background: '#2d2d4e', border: '1px solid #7c6af7',
        borderRadius: '20px', padding: '4px 10px 4px 12px',
        display: 'flex', alignItems: 'center', gap: '6px',
        color: '#a78bfa', fontSize: '13px',
    },
    chipRemove: {
        background: 'transparent', border: 'none',
        color: '#7c6af7', cursor: 'pointer', fontSize: '12px', padding: 0,
    },
    searchResults: { display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '260px', overflowY: 'auto' },
    userRow: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 12px', borderRadius: '10px',
        cursor: 'pointer',
    },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' },
    avatarPlaceholder: {
        width: '40px', height: '40px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: '800', color: '#fff',
    },
    userName: { fontSize: '14px', fontWeight: '600', color: '#fff' },
    userHandle: { fontSize: '12px', color: '#666' },
    checkbox: {
        marginLeft: 'auto', width: '22px', height: '22px',
        borderRadius: '50%', border: '2px solid #7c6af7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#7c6af7', fontWeight: '700', fontSize: '13px',
    },
    noResults: { color: '#555', fontSize: '14px', textAlign: 'center', padding: '20px' },
    footer: { display: 'flex', gap: '10px' },
    error: {
        background: '#2d1a1a', border: '1px solid #f87171',
        color: '#f87171', borderRadius: '8px',
        padding: '10px 14px', fontSize: '13px', margin: '0 24px',
    },
}