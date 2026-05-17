import { useState, useEffect, useRef } from 'react'
import { getMyProfile, updateProfile, uploadAvatar, deleteAvatar } from '../api/user'
import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LangSwitcher } from '../components/LangSwitcher'


import {
    ArrowLeft, LogOut, Camera, Trash2, Edit3, Check, X,
    Mail, Phone, Calendar, FileText, AtSign, User,
    ShieldCheck, ShieldOff, ChevronRight, Settings
} from 'lucide-react'

export default function ProfilePage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const updateUser = useAuthStore((s) => s.updateUser)
    const logout = useAuthStore((s) => s.logout)
    const fileRef = useRef()

    const [profile, setProfile] = useState(null)
    const [form, setForm] = useState({ fullName: '', username: '', bio: '', phone: '', birthDate: '' })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [avatarLoading, setAvatarLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [editMode, setEditMode] = useState(false)

    useEffect(() => { fetchProfile() }, [])

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
        } catch { setError(t('profile.loadError', 'Failed to load profile')) }
        finally { setLoading(false) }
    }

    const handleSave = async () => {
        setSaving(true); setError(''); setSuccess('')
        try {
            const res = await updateProfile(form)
            setProfile(res.data); updateUser(res.data)
            setSuccess(t('profile.updated')); setEditMode(false)
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'))
        } finally { setSaving(false) }
    }

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]; if (!file) return
        setAvatarLoading(true); setError('')
        try {
            const res = await uploadAvatar(file)
            setProfile(res.data); updateUser(res.data)
        } catch (err) { setError(err.response?.data?.message || t('common.error')) }
        finally { setAvatarLoading(false) }
    }

    const handleDeleteAvatar = async () => {
        setAvatarLoading(true)
        try {
            const res = await deleteAvatar()
            setProfile(res.data); updateUser(res.data)
        } catch { setError(t('profile.removePhotoError', 'Failed to remove photo')) }
        finally { setAvatarLoading(false) }
    }

    const handleLogout = () => { logout(); navigate('/login') }

    if (loading) return (
        <div style={s.loadingPage}>
            <div style={s.spinner} />
        </div>
    )

    const avatarLetter = profile?.fullName?.charAt(0)?.toUpperCase() || '?'

    return (
        <div style={s.page}>
            {/* Header */}
            <header style={s.header}>
                <button style={s.headerBtn} onClick={() => navigate('/chat')}>
                    <ArrowLeft size={16} />
                    <span>{t('common.back')}</span>
                </button>
                <span style={s.headerTitle}>{t('profile.title')}</span>
                <button style={s.logoutBtn} onClick={handleLogout}>
                    <LogOut size={14} />
                    <span>{t('profile.signOut')}</span>
                </button>
            </header>

            <div style={s.pageBody}>
                {/* Toast messages */}
                {error && (
                    <div style={s.toast('error')}>
                        <div style={s.toastDot('error')} />
                        {error}
                    </div>
                )}
                {success && (
                    <div style={s.toast('success')}>
                        <div style={s.toastDot('success')} />
                        {success}
                    </div>
                )}

                {/* Avatar card */}
                <div style={s.avatarCard}>
                    <div style={s.avatarWrap}>
                        {profile?.avatarUrl ? (
                            <img src={profile.avatarUrl} alt="avatar" style={s.avatarImg} />
                        ) : (
                            <div style={s.avatarPlaceholder}>{avatarLetter}</div>
                        )}
                        {avatarLoading && <div style={s.avatarOverlay}><div style={s.spinner} /></div>}
                        <button
                            style={s.cameraBtn}
                            onClick={() => fileRef.current.click()}
                            disabled={avatarLoading}
                        >
                            <Camera size={13} />
                        </button>
                        <input ref={fileRef} type="file" accept="image/*"
                            style={{ display: 'none' }} onChange={handleAvatarChange} />
                    </div>

                    <div style={s.avatarInfo}>
                        <h2 style={s.avatarName}>{profile?.fullName}</h2>
                        <p style={s.avatarHandle}>@{profile?.username}</p>
                        <div style={s.onlinePill}>
                            <div style={s.onlineDot} />
                            {t('common.online')}
                        </div>
                    </div>

                    {profile?.avatarUrl && (
                        <button style={s.removePhotoBtn} onClick={handleDeleteAvatar} disabled={avatarLoading}>
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>

                {/* Info card */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <div style={s.cardTitleRow}>
                            <div style={s.cardIconWrap}>
                                <User size={14} color="var(--accent)" />
                            </div>
                            <span style={s.cardTitle}>{t('profile.personalInfo')}</span>
                        </div>
                        {!editMode ? (
                            <button style={s.editBtn} onClick={() => setEditMode(true)}>
                                <Edit3 size={13} />
                                {t('profile.edit')}
                            </button>
                        ) : (
                            <div style={s.editActions}>
                                <button style={s.cancelBtn} onClick={() => setEditMode(false)}>
                                    <X size={13} />
                                </button>
                                <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                                    {saving ? <div style={{ ...s.spinner, width: 14, height: 14 }} /> : <Check size={13} />}
                                    {saving ? t('profile.saving') : t('profile.save')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={s.fieldList}>
                        <Field
                            t={t}
                            icon={<User size={14} color="var(--text-muted)" />}
                            label={t('profile.fullName')}
                            editMode={editMode}
                            value={profile?.fullName}
                            inputValue={form.fullName}
                            onChange={v => setForm({ ...form, fullName: v })}
                            placeholder={t('profile.fullName')}
                        />
                        <Field
                            t={t}
                            icon={<AtSign size={14} color="var(--text-muted)" />}
                            label={t('profile.username')}
                            editMode={editMode}
                            value={`@${profile?.username}`}
                            inputValue={form.username}
                            onChange={v => setForm({ ...form, username: v })}
                            placeholder={t('profile.username')}
                        />
                        <Field
                            t={t}
                            icon={<Mail size={14} color="var(--text-muted)" />}
                            label={t('profile.email')}
                            editMode={false}
                            value={profile?.email}
                            badge={profile?.emailVerified ? t('profile.verified') : null}
                        />
                        <Field
                            t={t}
                            icon={<Phone size={14} color="var(--text-muted)" />}
                            label={t('profile.phone')}
                            editMode={editMode}
                            value={profile?.phone}
                            inputValue={form.phone}
                            onChange={v => setForm({ ...form, phone: v })}
                            placeholder={t('profile.phonePlaceholder')}
                            type="tel"
                        />
                        <Field
                            t={t}
                            icon={<Calendar size={14} color="var(--text-muted)" />}
                            label={t('profile.birthDate')}
                            editMode={editMode}
                            value={profile?.birthDate
                                ? new Date(profile.birthDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                                : null}
                            inputValue={form.birthDate}
                            onChange={v => setForm({ ...form, birthDate: v })}
                            type="date"
                        />
                        <Field
                            t={t}
                            icon={<FileText size={14} color="var(--text-muted)" />}
                            label={t('profile.bio')}
                            editMode={editMode}
                            value={profile?.bio}
                            inputValue={form.bio}
                            onChange={v => setForm({ ...form, bio: v })}
                            placeholder={t('profile.bioPlaceholder')}
                            multiline
                            last
                        />
                    </div>
                </div>

                {/* Language card */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <div style={s.cardTitleRow}>
                            <div style={s.cardIconWrap}>
                                <Settings size={14} color="var(--accent)" />
                            </div>
                            <span style={s.cardTitle}>{t('lang.select', 'Language')}</span>
                        </div>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                        <LangSwitcher />
                    </div>
                </div>

                {/* Admin card */}
                {profile?.role === 'ADMIN' && (
                    <div style={s.card}>
                        <div style={s.cardHeader}>
                            <div style={s.cardTitleRow}>
                                <div style={s.cardIconWrap}>
                                    <ShieldCheck size={14} color="var(--accent)" />
                                </div>
                                <span style={s.cardTitle}>{t('admin.title', 'Admin Panel')}</span>
                            </div>
                            <button style={s.editBtn} onClick={() => navigate('/admin')}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Security card */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <div style={s.cardTitleRow}>
                            <div style={s.cardIconWrap}>
                                <ShieldCheck size={14} color="var(--accent)" />
                            </div>
                            <span style={s.cardTitle}>{t('profile.security')}</span>
                        </div>
                    </div>
                    <div style={s.securityList}>
                        <SecurityRow
                            t={t}
                            label={t('profile.emailVerified')}
                            verified={profile?.emailVerified}
                        />
                        <SecurityRow
                            t={t}
                            label={t('profile.phoneVerified')}
                            verified={profile?.phoneVerified}
                            last
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Sub-components ── */
function Field({ t, icon, label, editMode, value, inputValue, onChange, placeholder, type = 'text', multiline, badge, last }) {
    return (
        <div style={{
            ...sf.fieldRow,
            borderBottom: last ? 'none' : '1px solid var(--border)',
        }}>
            <div style={sf.fieldIcon}>{icon}</div>
            <div style={sf.fieldBody}>
                <span style={sf.fieldLabel}>{label}</span>
                {editMode ? (
                    multiline ? (
                        <textarea
                            style={sf.textarea}
                            value={inputValue}
                            onChange={e => onChange(e.target.value)}
                            placeholder={placeholder}
                            maxLength={200}
                            rows={3}
                        />
                    ) : (
                        <input
                            style={sf.input}
                            value={inputValue}
                            onChange={e => onChange(e.target.value)}
                            placeholder={placeholder}
                            type={type}
                        />
                    )
                ) : (
                    <span style={sf.fieldValue}>
                        {value || <span style={sf.empty}>{t('profile.notSet')}</span>}
                        {badge && <span style={sf.badge}><ShieldCheck size={10} /> {badge}</span>}
                    </span>
                )}
            </div>
        </div>
    )
}

function SecurityRow({ t, label, verified, last }) {
    return (
        <div style={{
            ...sf.secRow,
            borderBottom: last ? 'none' : '1px solid var(--border)',
        }}>
            <div style={sf.secIcon}>
                {verified
                    ? <ShieldCheck size={15} color="var(--success)" />
                    : <ShieldOff size={15} color="var(--text-muted)" />
                }
            </div>
            <span style={sf.secLabel}>{label}</span>
            <span style={{
                ...sf.secStatus,
                color: verified ? 'var(--success)' : 'var(--text-muted)',
                background: verified ? 'var(--success-bg)' : 'var(--bg-elevated)',
                borderColor: verified ? 'rgba(16,185,129,0.2)' : 'var(--border)',
            }}>
                {verified ? t('profile.verified') : t('profile.notVerified')}
            </span>
        </div>
    )
}

/* ── Styles ── */
const s = {
    page: {
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        fontFamily: "'Inter', sans-serif",
        color: 'var(--text-primary)',
    },
    loadingPage: {
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinner: {
        width: '20px', height: '20px',
        border: '2px solid var(--border)',
        borderTop: '2px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
    },
    header: {
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backdropFilter: 'blur(12px)',
    },
    headerBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'transparent',
        border: 'none',
        color: 'var(--accent)',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: '6px 10px',
        borderRadius: '8px',
        transition: 'background 0.15s',
    },
    headerTitle: {
        fontSize: '15px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
    },
    logoutBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--error-bg)',
        border: '1px solid rgba(239,68,68,0.2)',
        color: 'var(--error)',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'opacity 0.15s',
    },
    pageBody: {
        maxWidth: '560px',
        margin: '0 auto',
        padding: '28px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    toast: (type) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: type === 'error' ? 'var(--error-bg)' : 'var(--success-bg)',
        border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
        borderRadius: '10px',
        padding: '11px 14px',
        fontSize: '13px',
        fontWeight: '500',
        color: type === 'error' ? 'var(--error)' : 'var(--success)',
        animation: 'fadeUp 0.2s ease',
    }),
    toastDot: (type) => ({
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: type === 'error' ? 'var(--error)' : 'var(--success)',
        flexShrink: 0,
    }),

    /* Avatar card */
    avatarCard: {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        position: 'relative',
    },
    avatarWrap: {
        position: 'relative',
        flexShrink: 0,
    },
    avatarImg: {
        width: '80px', height: '80px',
        borderRadius: '20px',
        objectFit: 'cover',
        border: '2px solid var(--border)',
    },
    avatarPlaceholder: {
        width: '80px', height: '80px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        fontWeight: '800',
        color: '#fff',
        letterSpacing: '-0.02em',
    },
    avatarOverlay: {
        position: 'absolute', inset: 0,
        borderRadius: '20px',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraBtn: {
        position: 'absolute',
        bottom: '-6px', right: '-6px',
        width: '26px', height: '26px',
        borderRadius: '8px',
        background: 'var(--accent)',
        border: '2px solid var(--bg-secondary)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'opacity 0.15s',
    },
    avatarInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    avatarName: {
        fontSize: '18px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        letterSpacing: '-0.03em',
    },
    avatarHandle: {
        fontSize: '13px',
        color: 'var(--accent-light)',
        fontWeight: '500',
    },
    onlinePill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--success-bg)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: '999px',
        padding: '3px 10px',
        fontSize: '11px',
        fontWeight: '600',
        color: 'var(--success)',
        width: 'fit-content',
        marginTop: '4px',
    },
    onlineDot: {
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: 'var(--success)',
        boxShadow: '0 0 6px var(--success)',
    },
    removePhotoBtn: {
        position: 'absolute',
        top: '16px', right: '16px',
        background: 'var(--error-bg)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '8px',
        padding: '6px',
        color: 'var(--error)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'opacity 0.15s',
    },

    /* Cards */
    card: {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
    },
    cardTitleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    cardIconWrap: {
        width: '28px', height: '28px',
        borderRadius: '8px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-bg-hover)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
    },
    editBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'background 0.15s',
    },
    editActions: {
        display: 'flex',
        gap: '6px',
        alignItems: 'center',
    },
    cancelBtn: {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '6px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    saveBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'var(--accent)',
        border: 'none',
        borderRadius: '8px',
        padding: '6px 14px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#fff',
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    fieldList: { padding: '4px 0' },
    securityList: { padding: '4px 0' },
}

const sf = {
    fieldRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '14px 20px',
    },
    fieldIcon: {
        marginTop: '2px',
        flexShrink: 0,
    },
    fieldBody: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
    },
    fieldLabel: {
        fontSize: '11px',
        fontWeight: '600',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    },
    fieldValue: {
        fontSize: '14px',
        color: 'var(--text-primary)',
        fontWeight: '400',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
    },
    empty: {
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        fontSize: '13px',
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'var(--success-bg)',
        border: '1px solid rgba(16,185,129,0.2)',
        color: 'var(--success)',
        borderRadius: '999px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: '600',
    },
    input: {
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '9px 12px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        fontFamily: 'inherit',
        width: '100%',
        transition: 'border-color 0.15s',
    },
    textarea: {
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '9px 12px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        fontFamily: 'inherit',
        width: '100%',
        resize: 'vertical',
        lineHeight: '1.5',
        transition: 'border-color 0.15s',
    },
    secRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 20px',
    },
    secIcon: { flexShrink: 0 },
    secLabel: {
        flex: 1,
        fontSize: '14px',
        color: 'var(--text-primary)',
        fontWeight: '500',
    },
    secStatus: {
        fontSize: '11px',
        fontWeight: '600',
        padding: '3px 10px',
        borderRadius: '999px',
        border: '1px solid',
        letterSpacing: '0.02em',
    },
}