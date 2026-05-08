import { useState, useEffect, useRef } from 'react'
import { getMyProfile, updateProfile, uploadAvatar, deleteAvatar } from '../api/user'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import PhoneVerification from '../components/PhoneVerification'


export default function ProfilePage() {
    const navigate = useNavigate()
    const updateUser = useAuthStore((s) => s.updateUser)
    const logout = useAuthStore((s) => s.logout)
    const fileRef = useRef()

    const [profile, setProfile] = useState(null)
    const [form, setForm] = useState({
        fullName: '', username: '', bio: '', phone: '', birthDate: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [avatarLoading, setAvatarLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [editMode, setEditMode] = useState(false)

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const res = await getMyProfile()
            setProfile(res.data)
            setForm({
                fullName: res.data.fullName || '',
                username: res.data.username || '',
                bio: res.data.bio || '',
                phone: res.data.phone || '',
                birthDate: res.data.birthDate || ''
            })
        } catch {
            setError('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        setError('')
        setSuccess('')
        try {
            const res = await updateProfile(form)
            setProfile(res.data)
            updateUser(res.data)
            setSuccess('Profile updated successfully!')
            setEditMode(false)
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Update failed')
        } finally {
            setSaving(false)
        }
    }

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setAvatarLoading(true)
        setError('')
        try {
            const res = await uploadAvatar(file)
            setProfile(res.data)
            updateUser(res.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed')
        } finally {
            setAvatarLoading(false)
        }
    }

    const handleDeleteAvatar = async () => {
        setAvatarLoading(true)
        try {
            const res = await deleteAvatar()
            setProfile(res.data)
            updateUser(res.data)
        } catch {
            setError('Failed to delete avatar')
        } finally {
            setAvatarLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    if (loading) return (
        <div style={styles.loadingPage}>
            <div style={styles.spinner}>⟳</div>
        </div>
    )

    const avatarLetter = profile?.fullName?.charAt(0)?.toUpperCase() || '?'

    return (
        <div style={styles.page}>
            {/* Хедер */}
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate('/chat')}>
                    ← Назад
                </button>
                <span style={styles.headerTitle}>Профиль</span>
                <button style={styles.logoutBtn} onClick={handleLogout}>
                    Выйти
                </button>
            </div>

            <div style={styles.container}>
                {/* Аватар */}
                <div style={styles.avatarSection}>
                    <div style={styles.avatarWrapper}>
                        {profile?.avatarUrl ? (
                            <img
                                src={profile.avatarUrl}
                                alt="avatar"
                                style={styles.avatarImg}
                            />
                        ) : (
                            <div style={styles.avatarPlaceholder}>
                                {avatarLetter}
                            </div>
                        )}
                        {avatarLoading && (
                            <div style={styles.avatarOverlay}>⟳</div>
                        )}
                    </div>

                    <div style={styles.avatarActions}>
                        <button
                            style={styles.avatarBtn}
                            onClick={() => fileRef.current.click()}
                            disabled={avatarLoading}
                        >
                            📷 Изменить фото
                        </button>
                        {profile?.avatarUrl && (
                            <button
                                style={styles.avatarBtnDanger}
                                onClick={handleDeleteAvatar}
                                disabled={avatarLoading}
                            >
                                🗑 Удалить
                            </button>
                        )}
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                    />
                </div>

                {/* Имя и статус */}
                <div style={styles.nameSection}>
                    <h2 style={styles.fullName}>{profile?.fullName}</h2>
                    <p style={styles.username}>@{profile?.username}</p>
                    <div style={styles.statusBadge}>
                        <span style={styles.statusDot}></span>
                        Online
                    </div>
                </div>

                {/* Уведомления */}
                {error && <div style={styles.error}>{error}</div>}
                {success && <div style={styles.successMsg}>{success}</div>}

                {/* Карточки инфо / форма */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardTitle}>Информация</span>
                        {!editMode ? (
                            <button style={styles.editBtn} onClick={() => setEditMode(true)}>
                                ✏️ Редактировать
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button style={styles.cancelBtn} onClick={() => setEditMode(false)}>
                                    Отмена
                                </button>
                                <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                    {saving ? 'Сохранение...' : '✓ Сохранить'}
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={styles.fields}>
                        {/* Полное имя */}
                        <div style={styles.field}>
                            <label style={styles.fieldLabel}>👤 Полное имя</label>
                            {editMode ? (
                                <input
                                    style={styles.input}
                                    value={form.fullName}
                                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                    placeholder="Ваше имя"
                                />
                            ) : (
                                <span style={styles.fieldValue}>
                                    {profile?.fullName || <em style={styles.empty}>Не указано</em>}
                                </span>
                            )}
                        </div>

                        {/* Username */}
                        <div style={styles.field}>
                            <label style={styles.fieldLabel}>🔖 Логин</label>
                            {editMode ? (
                                <input
                                    style={styles.input}
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    placeholder="username"
                                />
                            ) : (
                                <span style={styles.fieldValue}>@{profile?.username}</span>
                            )}
                        </div>

                        {/* Email (только чтение) */}
                        <div style={styles.field}>
                            <label style={styles.fieldLabel}>
                                📧 Email
                                {profile?.emailVerified && (
                                    <span style={styles.verified}>✓ Подтверждён</span>
                                )}
                            </label>
                            <span style={styles.fieldValue}>{profile?.email}</span>
                        </div>

                        {/* Телефон */}
                        <div style={styles.field}>
                            <label style={styles.fieldLabel}>
                                📱 Номер телефона
                                {profile?.phoneVerified && (
                                    <span style={styles.verified}>✓ Подтверждён</span>
                                )}
                            </label>
                            {editMode ? (
                                <input
                                    style={styles.input}
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="+7 777 000 00 00"
                                />
                            ) : (
                                <span style={styles.fieldValue}>
                                    {profile?.phone || <em style={styles.empty}>Не указан</em>}
                                </span>
                            )}
                        </div>

                        {/* День рождения */}
                        <div style={styles.field}>
                            <label style={styles.fieldLabel}>🎂 День рождения</label>
                            {editMode ? (
                                <input
                                    style={styles.input}
                                    type="date"
                                    value={form.birthDate}
                                    onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                                />
                            ) : (
                                <span style={styles.fieldValue}>
                                    {profile?.birthDate
                                        ? new Date(profile.birthDate).toLocaleDateString('ru-RU')
                                        : <em style={styles.empty}>Не указан</em>}
                                </span>
                            )}
                        </div>

                        {/* Био */}
                        <div style={styles.field}>
                            <label style={styles.fieldLabel}>💬 Био</label>
                            {editMode ? (
                                <textarea
                                    style={styles.textarea}
                                    value={form.bio}
                                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                                    placeholder="Расскажите о себе..."
                                    maxLength={200}
                                    rows={3}
                                />
                            ) : (
                                <span style={styles.fieldValue}>
                                    {profile?.bio || <em style={styles.empty}>Не указано</em>}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Безопасность */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <span style={styles.cardTitle}>🔐 Безопасность</span>
                    </div>
                    <div style={styles.securityRow}>
                        <span style={styles.fieldLabel}>Email подтверждён</span>
                        <span style={profile?.emailVerified ? styles.yes : styles.no}>
                            {profile?.emailVerified ? '✓ Да' : '✗ Нет'}
                        </span>
                    </div>
                    <div style={styles.securityRow}>
                        <span style={styles.fieldLabel}>Телефон подтверждён</span>
                        <span style={profile?.phoneVerified ? styles.yes : styles.no}>
                            {profile?.phoneVerified ? '✓ Да' : '✗ Нет'}
                        </span>
                    </div>
                </div>

            </div>
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
        minHeight: '100vh',
        background: '#0f0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinner: {
        fontSize: '40px',
        color: '#7c6af7',
        animation: 'spin 1s linear infinite',
    },
    header: {
        background: '#1a1a2e',
        borderBottom: '1px solid #2d2d4e',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#fff',
    },
    backBtn: {
        background: 'transparent',
        border: 'none',
        color: '#7c6af7',
        fontSize: '15px',
        cursor: 'pointer',
        fontWeight: '600',
    },
    logoutBtn: {
        background: '#2d1a1a',
        border: '1px solid #f87171',
        color: '#f87171',
        borderRadius: '8px',
        padding: '6px 14px',
        fontSize: '13px',
        cursor: 'pointer',
        fontWeight: '600',
    },
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    avatarSection: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    avatarWrapper: {
        position: 'relative',
        width: '110px',
        height: '110px',
    },
    avatarImg: {
        width: '110px',
        height: '110px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '3px solid #7c6af7',
    },
    avatarPlaceholder: {
        width: '110px',
        height: '110px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '42px',
        fontWeight: '800',
        color: '#fff',
        border: '3px solid #7c6af7',
    },
    avatarOverlay: {
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: '#fff',
    },
    avatarActions: {
        display: 'flex',
        gap: '10px',
    },
    avatarBtn: {
        background: '#2d2d4e',
        border: '1px solid #3d3d6e',
        color: '#fff',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '13px',
        cursor: 'pointer',
    },
    avatarBtnDanger: {
        background: '#2d1a1a',
        border: '1px solid #f87171',
        color: '#f87171',
        borderRadius: '8px',
        padding: '8px 14px',
        fontSize: '13px',
        cursor: 'pointer',
    },
    nameSection: {
        textAlign: 'center',
    },
    fullName: {
        fontSize: '24px',
        fontWeight: '800',
        margin: '0 0 4px',
        color: '#fff',
    },
    username: {
        color: '#7c6af7',
        fontSize: '15px',
        margin: '0 0 10px',
    },
    statusBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: '#1a2e1a',
        border: '1px solid #4ade80',
        borderRadius: '20px',
        padding: '4px 12px',
        fontSize: '13px',
        color: '#4ade80',
    },
    statusDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#4ade80',
        display: 'inline-block',
    },
    card: {
        background: '#1a1a2e',
        border: '1px solid #2d2d4e',
        borderRadius: '16px',
        padding: '20px',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
    },
    cardTitle: {
        fontSize: '16px',
        fontWeight: '700',
        color: '#fff',
    },
    editBtn: {
        background: '#2d2d4e',
        border: '1px solid #3d3d6e',
        color: '#a78bfa',
        borderRadius: '8px',
        padding: '6px 14px',
        fontSize: '13px',
        cursor: 'pointer',
    },
    saveBtn: {
        background: '#7c6af7',
        border: 'none',
        color: '#fff',
        borderRadius: '8px',
        padding: '6px 14px',
        fontSize: '13px',
        cursor: 'pointer',
        fontWeight: '700',
    },
    cancelBtn: {
        background: 'transparent',
        border: '1px solid #3d3d6e',
        color: '#888',
        borderRadius: '8px',
        padding: '6px 14px',
        fontSize: '13px',
        cursor: 'pointer',
    },
    fields: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        borderBottom: '1px solid #2d2d4e',
        paddingBottom: '16px',
    },
    fieldLabel: {
        fontSize: '12px',
        color: '#888',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    fieldValue: {
        fontSize: '15px',
        color: '#e2e8f0',
    },
    empty: {
        color: '#555',
        fontStyle: 'italic',
    },
    verified: {
        background: '#1a2e1a',
        color: '#4ade80',
        fontSize: '11px',
        padding: '2px 8px',
        borderRadius: '10px',
        fontWeight: '600',
    },
    input: {
        background: '#0f0f1a',
        border: '1px solid #3d3d6e',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#fff',
        fontSize: '15px',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    },
    textarea: {
        background: '#0f0f1a',
        border: '1px solid #3d3d6e',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#fff',
        fontSize: '15px',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        resize: 'vertical',
        fontFamily: "'Segoe UI', sans-serif",
    },
    securityRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid #2d2d4e',
    },
    yes: { color: '#4ade80', fontWeight: '700' },
    no: { color: '#f87171', fontWeight: '700' },
    error: {
        background: '#2d1a1a',
        border: '1px solid #f87171',
        color: '#f87171',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
    },
    successMsg: {
        background: '#1a2e1a',
        border: '1px solid #4ade80',
        color: '#4ade80',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
    },
}