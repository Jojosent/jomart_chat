import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    getGroup, updateGroup, uploadGroupAvatar,
    addMember, removeMember, transferAdmin,
    leaveGroup, deleteGroup
} from '../api/group'
import { searchUsers } from '../api/user'
import useAuthStore from '../store/authStore'

export default function GroupSettingsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const me = useAuthStore((s) => s.user)
    const fileRef = useRef()

    const [group, setGroup] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [editMode, setEditMode] = useState(false)
    const [form, setForm] = useState({ name: '', description: '' })
    const [avatarLoading, setAvatarLoading] = useState(false)

    // Поиск для добавления участников
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])

    // Модалки подтверждения
    const [confirmLeave, setConfirmLeave] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [transferTo, setTransferTo] = useState(null)

    const isAdmin = group?.admin?.id === me?.id

    useEffect(() => { fetchGroup() }, [id])

    useEffect(() => {
        if (searchQuery.trim().length < 2) { setSearchResults([]); return }
        const t = setTimeout(async () => {
            try {
                const res = await searchUsers(searchQuery)
                // Убираем уже участников
                const memberIds = group?.members?.map(m => m.id) || []
                setSearchResults(res.data.filter(u => !memberIds.includes(u.id)))
            } catch { setSearchResults([]) }
        }, 400)
        return () => clearTimeout(t)
    }, [searchQuery, group])

    const fetchGroup = async () => {
        try {
            const res = await getGroup(id)
            setGroup(res.data)
            setForm({ name: res.data.name, description: res.data.description || '' })
        } catch {
            setError('Failed to load group')
        } finally {
            setLoading(false)
        }
    }

    const showSuccess = (msg) => {
        setSuccess(msg)
        setTimeout(() => setSuccess(''), 3000)
    }

    // ── Сохранить изменения ──────────────────────────────────────
    const handleSave = async () => {
        setSaving(true); setError('')
        try {
            const res = await updateGroup(id, form)
            setGroup(res.data)
            setEditMode(false)
            showSuccess('Group updated!')
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed')
        } finally { setSaving(false) }
    }

    // ── Аватар ───────────────────────────────────────────────────
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setAvatarLoading(true)
        try {
            const res = await uploadGroupAvatar(id, file)
            setGroup(res.data)
            showSuccess('Avatar updated!')
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed')
        } finally { setAvatarLoading(false) }
    }

    // ── Добавить участника ───────────────────────────────────────
    const handleAddMember = async (user) => {
        try {
            const res = await addMember(id, user.id)
            setGroup(res.data)
            setSearchQuery('')
            setSearchResults([])
            showSuccess(`${user.fullName} added!`)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add member')
        }
    }

    // ── Удалить участника ────────────────────────────────────────
    const handleRemoveMember = async (userId, userName) => {
        try {
            const res = await removeMember(id, userId)
            setGroup(res.data)
            showSuccess(`${userName} removed`)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove member')
        }
    }

    // ── Передать права ───────────────────────────────────────────
    const handleTransferAdmin = async () => {
        if (!transferTo) return
        try {
            const res = await transferAdmin(id, transferTo.id)
            setGroup(res.data)
            setTransferTo(null)
            showSuccess(`Admin rights transferred to ${transferTo.fullName}`)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to transfer admin')
        }
    }

    // ── Выйти ────────────────────────────────────────────────────
    const handleLeave = async () => {
        try {
            await leaveGroup(id)
            navigate('/chat')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to leave group')
            setConfirmLeave(false)
        }
    }

    // ── Удалить группу ───────────────────────────────────────────
    const handleDelete = async () => {
        try {
            await deleteGroup(id)
            navigate('/chat')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete group')
            setConfirmDelete(false)
        }
    }

    if (loading) return (
        <div style={styles.loadingPage}>
            <div style={styles.spinner}>⟳</div>
        </div>
    )

    const avatarLetter = group?.name?.charAt(0)?.toUpperCase() || 'G'

    return (
        <div style={styles.page}>

            {/* Хедер */}
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate('/chat')}>
                    ← Назад
                </button>
                <span style={styles.headerTitle}>Настройки группы</span>
                <div style={{ width: '60px' }} />
            </div>

            <div style={styles.container}>

                {/* Уведомления */}
                {error && <div style={styles.error}>{error}</div>}
                {success && <div style={styles.successMsg}>{success}</div>}

                {/* Аватар группы */}
                <div style={styles.avatarSection}>
                    <div style={styles.avatarWrapper}>
                        {group?.avatarUrl ? (
                            <img src={group.avatarUrl} style={styles.avatarImg} alt="" />
                        ) : (
                            <div style={styles.avatarPlaceholder}>{avatarLetter}</div>
                        )}
                        {avatarLoading && <div style={styles.avatarOverlay}>⟳</div>}
                    </div>

                    {isAdmin && (
                        <>
                            <button
                                style={styles.avatarBtn}
                                onClick={() => fileRef.current.click()}
                                disabled={avatarLoading}
                            >
                                📷 Изменить фото группы
                            </button>
                            <input
                                ref={fileRef} type="file" accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleAvatarChange}
                            />
                        </>
                    )}

                    <h2 style={styles.groupName}>{group?.name}</h2>
                    <p style={styles.memberCount}>{group?.memberCount} участников</p>
                    {isAdmin && (
                        <div style={styles.adminBadge}>👑 Вы администратор</div>
                    )}
                </div>

                {/* Инфо о группе */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardTitle}>📋 Информация</span>
                        {isAdmin && !editMode && (
                            <button style={styles.editBtn} onClick={() => setEditMode(true)}>
                                ✏️ Изменить
                            </button>
                        )}
                        {editMode && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button style={styles.cancelBtn} onClick={() => setEditMode(false)}>
                                    Отмена
                                </button>
                                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                    {saving ? '...' : '✓ Сохранить'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={styles.fields}>
                        <div style={styles.field}>
                            <label style={styles.fieldLabel}>Название</label>
                            {editMode ? (
                                <input
                                    style={styles.input}
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    maxLength={50}
                                />
                            ) : (
                                <span style={styles.fieldValue}>{group?.name}</span>
                            )}
                        </div>

                        <div style={styles.field}>
                            <label style={styles.fieldLabel}>Описание</label>
                            {editMode ? (
                                <textarea
                                    style={styles.textarea}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    maxLength={200}
                                    rows={3}
                                />
                            ) : (
                                <span style={styles.fieldValue}>
                                    {group?.description || <em style={styles.empty}>Нет описания</em>}
                                </span>
                            )}
                        </div>

                        <div style={styles.field}>
                            <label style={styles.fieldLabel}>Администратор</label>
                            <div style={styles.adminRow}>
                                {group?.admin?.avatarUrl ? (
                                    <img src={group.admin.avatarUrl} style={styles.miniAvatar} alt="" />
                                ) : (
                                    <div style={styles.miniAvatarPlaceholder}>
                                        {group?.admin?.fullName?.charAt(0)}
                                    </div>
                                )}
                                <span style={styles.fieldValue}>{group?.admin?.fullName}</span>
                                <span style={styles.crownBadge}>👑</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Участники */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardTitle}>
                            👥 Участники ({group?.memberCount})
                        </span>
                    </div>

                    {/* Добавить участника (только админ) */}
                    {isAdmin && (
                        <div style={styles.addMemberSection}>
                            <input
                                style={styles.searchInput}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Найти и добавить участника..."
                            />
                            {searchResults.length > 0 && (
                                <div style={styles.searchDropdown}>
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            style={styles.searchRow}
                                            onClick={() => handleAddMember(user)}
                                        >
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} style={styles.miniAvatar} alt="" />
                                            ) : (
                                                <div style={styles.miniAvatarPlaceholder}>
                                                    {user.fullName?.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div style={styles.searchName}>{user.fullName}</div>
                                                <div style={styles.searchHandle}>@{user.username}</div>
                                            </div>
                                            <span style={styles.addIcon}>+</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Список участников */}
                    <div style={styles.memberList}>
                        {group?.members?.map(member => {
                            const isMe = member.id === me?.id
                            const isMemberAdmin = member.id === group?.admin?.id

                            return (
                                <div key={member.id} style={styles.memberRow}>
                                    {/* Аватар */}
                                    {member.avatarUrl ? (
                                        <img src={member.avatarUrl} style={styles.memberAvatar} alt="" />
                                    ) : (
                                        <div style={styles.memberAvatarPlaceholder}>
                                            {member.fullName?.charAt(0)}
                                        </div>
                                    )}

                                    {/* Инфо */}
                                    <div style={styles.memberInfo}>
                                        <div style={styles.memberName}>
                                            {member.fullName}
                                            {isMe && <span style={styles.youBadge}>Вы</span>}
                                            {isMemberAdmin && <span style={styles.adminIcon}>👑</span>}
                                        </div>
                                        <div style={styles.memberHandle}>@{member.username}</div>
                                    </div>

                                    {/* Действия (только для админа, не для себя и не для другого админа) */}
                                    {isAdmin && !isMe && !isMemberAdmin && (
                                        <div style={styles.memberActions}>
                                            <button
                                                style={styles.transferBtn}
                                                onClick={() => setTransferTo(member)}
                                                title="Передать права"
                                            >
                                                👑
                                            </button>
                                            <button
                                                style={styles.kickBtn}
                                                onClick={() => handleRemoveMember(member.id, member.fullName)}
                                                title="Удалить из группы"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Опасная зона */}
                <div style={styles.dangerCard}>
                    <div style={styles.cardTitle}>⚠️ Опасная зона</div>
                    <div style={styles.dangerActions}>
                        {!isAdmin && (
                            <button
                                style={styles.leaveBtn}
                                onClick={() => setConfirmLeave(true)}
                            >
                                🚪 Покинуть группу
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                style={styles.deleteBtn}
                                onClick={() => setConfirmDelete(true)}
                            >
                                🗑 Удалить группу
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Модалка: передать права */}
            {transferTo && (
                <div style={styles.overlay}>
                    <div style={styles.confirmModal}>
                        <div style={styles.confirmTitle}>Передать права администратора?</div>
                        <p style={styles.confirmText}>
                            <strong>{transferTo.fullName}</strong> станет новым администратором.
                            Вы потеряете права управления группой.
                        </p>
                        <div style={styles.confirmActions}>
                            <button style={styles.cancelBtn} onClick={() => setTransferTo(null)}>
                                Отмена
                            </button>
                            <button style={styles.confirmBtn} onClick={handleTransferAdmin}>
                                Передать
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка: выйти */}
            {confirmLeave && (
                <div style={styles.overlay}>
                    <div style={styles.confirmModal}>
                        <div style={styles.confirmTitle}>Покинуть группу?</div>
                        <p style={styles.confirmText}>
                            Вы покинете группу <strong>{group?.name}</strong>.
                            Вас можно будет снова добавить.
                        </p>
                        <div style={styles.confirmActions}>
                            <button style={styles.cancelBtn} onClick={() => setConfirmLeave(false)}>
                                Отмена
                            </button>
                            <button style={styles.dangerConfirmBtn} onClick={handleLeave}>
                                Покинуть
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка: удалить группу */}
            {confirmDelete && (
                <div style={styles.overlay}>
                    <div style={styles.confirmModal}>
                        <div style={styles.confirmTitle}>Удалить группу?</div>
                        <p style={styles.confirmText}>
                            Группа <strong>{group?.name}</strong> и все её сообщения
                            будут удалены навсегда. Это действие нельзя отменить.
                        </p>
                        <div style={styles.confirmActions}>
                            <button style={styles.cancelBtn} onClick={() => setConfirmDelete(false)}>
                                Отмена
                            </button>
                            <button style={styles.dangerConfirmBtn} onClick={handleDelete}>
                                Удалить навсегда
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const styles = {
    page: {
        minHeight: '100vh',
        background: '#0f0f1a',
        fontFamily: "'Segoe UI', sans-serif",
        color: '#fff',
    },
    loadingPage: {
        minHeight: '100vh', background: '#0f0f1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    spinner: { fontSize: '40px', color: '#7c6af7' },
    header: {
        background: '#1a1a2e',
        borderBottom: '1px solid #2d2d4e',
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10,
    },
    headerTitle: { fontSize: '18px', fontWeight: '700' },
    backBtn: {
        background: 'transparent', border: 'none',
        color: '#7c6af7', fontSize: '15px',
        cursor: 'pointer', fontWeight: '600',
    },
    container: {
        maxWidth: '600px', margin: '0 auto',
        padding: '24px 16px',
        display: 'flex', flexDirection: 'column', gap: '20px',
    },

    // Avatar
    avatarSection: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '12px',
    },
    avatarWrapper: { position: 'relative', width: '110px', height: '110px' },
    avatarImg: {
        width: '110px', height: '110px',
        borderRadius: '50%', objectFit: 'cover',
        border: '3px solid #7c6af7',
    },
    avatarPlaceholder: {
        width: '110px', height: '110px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '42px', fontWeight: '800', color: '#fff',
        border: '3px solid #7c6af7',
    },
    avatarOverlay: {
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', color: '#fff',
    },
    avatarBtn: {
        background: '#2d2d4e', border: '1px solid #3d3d6e',
        color: '#fff', borderRadius: '8px',
        padding: '8px 14px', fontSize: '13px', cursor: 'pointer',
    },
    groupName: {
        fontSize: '24px', fontWeight: '800',
        margin: '4px 0 0', color: '#fff', textAlign: 'center',
    },
    memberCount: { color: '#888', fontSize: '14px', margin: 0 },
    adminBadge: {
        background: '#2d2a1a', border: '1px solid #f59e0b',
        color: '#f59e0b', borderRadius: '20px',
        padding: '4px 14px', fontSize: '13px', fontWeight: '600',
    },

    // Card
    card: {
        background: '#1a1a2e', border: '1px solid #2d2d4e',
        borderRadius: '16px', padding: '20px',
    },
    cardHeader: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '16px',
    },
    cardTitle: { fontSize: '16px', fontWeight: '700', color: '#fff' },
    editBtn: {
        background: '#2d2d4e', border: '1px solid #3d3d6e',
        color: '#a78bfa', borderRadius: '8px',
        padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
    },
    saveBtn: {
        background: '#7c6af7', border: 'none',
        color: '#fff', borderRadius: '8px',
        padding: '6px 14px', fontSize: '13px',
        cursor: 'pointer', fontWeight: '700',
    },
    cancelBtn: {
        background: 'transparent', border: '1px solid #3d3d6e',
        color: '#888', borderRadius: '8px',
        padding: '6px 14px', fontSize: '13px', cursor: 'pointer',
    },

    // Fields
    fields: { display: 'flex', flexDirection: 'column', gap: '16px' },
    field: {
        display: 'flex', flexDirection: 'column', gap: '6px',
        borderBottom: '1px solid #2d2d4e', paddingBottom: '16px',
    },
    fieldLabel: {
        fontSize: '12px', color: '#888',
        fontWeight: '600', textTransform: 'uppercase',
    },
    fieldValue: { fontSize: '15px', color: '#e2e8f0' },
    empty: { color: '#555', fontStyle: 'italic' },
    input: {
        background: '#0f0f1a', border: '1px solid #3d3d6e',
        borderRadius: '8px', padding: '10px 14px',
        color: '#fff', fontSize: '15px', outline: 'none',
    },
    textarea: {
        background: '#0f0f1a', border: '1px solid #3d3d6e',
        borderRadius: '8px', padding: '10px 14px',
        color: '#fff', fontSize: '15px', outline: 'none',
        resize: 'vertical', fontFamily: "'Segoe UI', sans-serif",
    },
    adminRow: { display: 'flex', alignItems: 'center', gap: '10px' },
    miniAvatar: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' },
    miniAvatarPlaceholder: {
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '800', color: '#fff',
    },
    crownBadge: { marginLeft: 'auto', fontSize: '18px' },

    // Members
    addMemberSection: {
        marginBottom: '16px', position: 'relative',
    },
    searchInput: {
        width: '100%', boxSizing: 'border-box',
        background: '#0f0f1a', border: '1px solid #3d3d6e',
        borderRadius: '10px', padding: '10px 14px',
        color: '#fff', fontSize: '14px', outline: 'none',
    },
    searchDropdown: {
        position: 'absolute', top: '48px', left: 0, right: 0,
        background: '#1e1e3a', border: '1px solid #3d3d6e',
        borderRadius: '10px', zIndex: 50,
        maxHeight: '200px', overflowY: 'auto',
    },
    searchRow: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', cursor: 'pointer',
        borderBottom: '1px solid #2d2d4e',
    },
    searchName: { fontSize: '14px', fontWeight: '600', color: '#fff' },
    searchHandle: { fontSize: '12px', color: '#666' },
    addIcon: {
        marginLeft: 'auto', color: '#7c6af7',
        fontSize: '20px', fontWeight: '700',
    },
    memberList: { display: 'flex', flexDirection: 'column', gap: '4px' },
    memberRow: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 8px', borderRadius: '10px',
    },
    memberAvatar: { width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' },
    memberAvatarPlaceholder: {
        width: '42px', height: '42px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', fontWeight: '800', color: '#fff',
    },
    memberInfo: { flex: 1 },
    memberName: {
        fontSize: '15px', fontWeight: '600', color: '#fff',
        display: 'flex', alignItems: 'center', gap: '6px',
    },
    memberHandle: { fontSize: '13px', color: '#666' },
    youBadge: {
        background: '#2d2d4e', color: '#a78bfa',
        fontSize: '11px', padding: '2px 8px',
        borderRadius: '10px', fontWeight: '600',
    },
    adminIcon: { fontSize: '16px' },
    memberActions: { display: 'flex', gap: '6px' },
    transferBtn: {
        background: '#2d2a1a', border: '1px solid #f59e0b',
        color: '#f59e0b', borderRadius: '8px',
        width: '32px', height: '32px',
        cursor: 'pointer', fontSize: '14px',
    },
    kickBtn: {
        background: '#2d1a1a', border: '1px solid #f87171',
        color: '#f87171', borderRadius: '8px',
        width: '32px', height: '32px',
        cursor: 'pointer', fontSize: '13px',
    },

    // Danger zone
    dangerCard: {
        background: '#1a1a2e', border: '1px solid #f87171',
        borderRadius: '16px', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '16px',
    },
    dangerActions: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    leaveBtn: {
        background: '#2d1a1a', border: '1px solid #f87171',
        color: '#f87171', borderRadius: '10px',
        padding: '12px 20px', fontSize: '14px',
        cursor: 'pointer', fontWeight: '600',
    },
    deleteBtn: {
        background: '#2d1a1a', border: '1px solid #f87171',
        color: '#f87171', borderRadius: '10px',
        padding: '12px 20px', fontSize: '14px',
        cursor: 'pointer', fontWeight: '600',
    },

    // Notifications
    error: {
        background: '#2d1a1a', border: '1px solid #f87171',
        color: '#f87171', borderRadius: '8px',
        padding: '10px 14px', fontSize: '13px',
    },
    successMsg: {
        background: '#1a2e1a', border: '1px solid #4ade80',
        color: '#4ade80', borderRadius: '8px',
        padding: '10px 14px', fontSize: '13px',
    },

    // Confirm modals
    overlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
    },
    confirmModal: {
        background: '#1a1a2e', border: '1px solid #2d2d4e',
        borderRadius: '16px', padding: '28px 32px',
        width: '100%', maxWidth: '400px',
    },
    confirmTitle: {
        fontSize: '18px', fontWeight: '700',
        color: '#fff', marginBottom: '12px',
    },
    confirmText: {
        color: '#888', fontSize: '14px',
        lineHeight: '1.6', marginBottom: '24px',
    },
    confirmActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    confirmBtn: {
        background: '#7c6af7', border: 'none',
        color: '#fff', borderRadius: '8px',
        padding: '10px 20px', fontSize: '14px',
        cursor: 'pointer', fontWeight: '700',
    },
    dangerConfirmBtn: {
        background: '#f87171', border: 'none',
        color: '#fff', borderRadius: '8px',
        padding: '10px 20px', fontSize: '14px',
        cursor: 'pointer', fontWeight: '700',
    },
}