import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    getGroup, updateGroup, uploadGroupAvatar,
    addMember, removeMember, transferAdmin,
    leaveGroup, deleteGroup
} from '../api/group'
import { searchUsers } from '../api/user'
import useAuthStore from '../store/authStore'
import {
    ArrowLeft, Camera, Edit3, Check, X,
    Users, Crown, UserMinus, LogOut, Trash2,
    Search, ShieldAlert, ChevronRight, UserPlus
} from 'lucide-react'
import { LangSwitcher } from '../components/LangSwitcher'
import { useTranslation } from 'react-i18next'

export default function GroupSettingsPage() {
    const { t } = useTranslation()
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
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
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
        } catch { setError(t('group.loadError', 'Failed to load group')) }
        finally { setLoading(false) }
    }

    const flash = (msg, type = 'success') => {
        if (type === 'success') { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
        else setError(msg)
    }

    const handleSave = async () => {
        setSaving(true); setError('')
        try {
            const res = await updateGroup(id, form)
            setGroup(res.data); setEditMode(false); flash(t('group.updated'))
        } catch (err) { flash(err.response?.data?.message || t('common.error'), 'error') }
        finally { setSaving(false) }
    }

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]; if (!file) return
        setAvatarLoading(true)
        try {
            const res = await uploadGroupAvatar(id, file)
            setGroup(res.data); flash(t('group.avatarUpdated'))
        } catch (err) { flash(err.response?.data?.message || t('common.error'), 'error') }
        finally { setAvatarLoading(false) }
    }

    const handleAddMember = async (user) => {
        try {
            const res = await addMember(id, user.id)
            setGroup(res.data); setSearchQuery(''); setSearchResults([])
            flash(`${user.fullName} ${t('group.added')}`)
        } catch (err) { flash(err.response?.data?.message || t('common.error'), 'error') }
    }

    const handleRemoveMember = async (userId, name) => {
        try {
            const res = await removeMember(id, userId)
            setGroup(res.data); flash(`${name} ${t('group.removed')}`)
        } catch (err) { flash(err.response?.data?.message || t('common.error'), 'error') }
    }

    const handleTransferAdmin = async () => {
        if (!transferTo) return
        try {
            const res = await transferAdmin(id, transferTo.id)
            setGroup(res.data); setTransferTo(null)
            flash(`${t('group.adminTransferred')} ${transferTo.fullName}`)
        } catch (err) { flash(err.response?.data?.message || t('common.error'), 'error') }
    }

    const handleLeave = async () => {
        try { await leaveGroup(id); navigate('/chat') }
        catch (err) { flash(err.response?.data?.message || t('common.error'), 'error'); setConfirmLeave(false) }
    }

    const handleDelete = async () => {
        try { await deleteGroup(id); navigate('/chat') }
        catch (err) { flash(err.response?.data?.message || t('common.error'), 'error'); setConfirmDelete(false) }
    }

    if (loading) return (
        <div style={s.loadingPage}>
            <div style={s.spinner} />
        </div>
    )

    const avatarLetter = group?.name?.charAt(0)?.toUpperCase() || 'G'

    return (
        <div style={s.page}>
            {/* Header */}
            <header style={s.header}>
                <button style={s.backBtn} onClick={() => navigate('/chat')}>
                    <ArrowLeft size={16} />
                    {t('common.back')}
                </button>
                <span style={s.headerTitle}>{t('group.settings')}</span>
                <div style={{ width: 72 }} />
            </header>

            <div style={s.body}>
                {/* Toasts */}
                {error && <div style={s.toast('error')}><div style={s.toastDot('error')} />{error}</div>}
                {success && <div style={s.toast('success')}><div style={s.toastDot('success')} />{success}</div>}

                {/* Hero card */}
                <div style={s.heroCard}>
                    <div style={s.avatarWrap}>
                        {group?.avatarUrl
                            ? <img src={group.avatarUrl} style={s.avatarImg} alt="" />
                            : <div style={s.avatarPlaceholder}>
                                <Users size={28} color="#fff" />
                            </div>
                        }
                        {avatarLoading && (
                            <div style={s.avatarOverlay}><div style={s.spinner} /></div>
                        )}
                        {isAdmin && (
                            <>
                                <button style={s.cameraBtn} onClick={() => fileRef.current.click()} disabled={avatarLoading}>
                                    <Camera size={13} />
                                </button>
                                <input ref={fileRef} type="file" accept="image/*"
                                    style={{ display: 'none' }} onChange={handleAvatarChange} />
                            </>
                        )}
                    </div>
                    <div style={s.heroInfo}>
                        <h2 style={s.heroName}>{group?.name}</h2>
                        <p style={s.heroMeta}>
                            {group?.memberCount} {t('group.memberCount')}
                        </p>
                        {isAdmin && (
                            <div style={s.adminPill}>
                                <Crown size={11} />
                                {t('group.admin')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info card */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <div style={s.cardTitleRow}>
                            <div style={s.cardIconWrap}>
                                <Edit3 size={13} color="var(--accent)" />
                            </div>
                            <span style={s.cardTitle}>{t('group.info')}</span>
                        </div>
                        {isAdmin && !editMode && (
                            <button style={s.editBtn} onClick={() => setEditMode(true)}>
                                <Edit3 size={13} /> {t('group.edit')}
                            </button>
                        )}
                        {editMode && (
                            <div style={s.editActions}>
                                <button style={s.cancelBtn} onClick={() => setEditMode(false)}>
                                    <X size={13} />
                                </button>
                                <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                                    {saving ? <div style={{ ...s.spinner, width: 13, height: 13 }} /> : <Check size={13} />}
                                    {saving ? t('group.saving') : t('group.save')}
                                </button>
                            </div>
                        )}
                    </div>
                    <div style={s.fieldList}>
                        {/* Name */}
                        <div style={s.fieldRow}>
                            <span style={s.fieldLabel}>{t('group.name')}</span>
                            {editMode
                                ? <input style={s.input} value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} maxLength={50} />
                                : <span style={s.fieldValue}>{group?.name}</span>
                            }
                        </div>
                        {/* Description */}
                        <div style={{ ...s.fieldRow, borderBottom: 'none' }}>
                            <span style={s.fieldLabel}>{t('group.description')}</span>
                            {editMode
                                ? <textarea style={s.textarea} value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    maxLength={200} rows={3} />
                                : <span style={s.fieldValue}>
                                    {group?.description || <span style={s.empty}>{t('group.noDescription')}</span>}
                                </span>
                            }
                        </div>
                    </div>
                </div>

                {/* Members card */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <div style={s.cardTitleRow}>
                            <div style={s.cardIconWrap}>
                                <Users size={13} color="var(--accent)" />
                            </div>
                            <span style={s.cardTitle}>{t('group.members')}</span>
                            <span style={s.memberCountBadge}>{group?.memberCount}</span>
                        </div>
                    </div>

                    {/* Add member search (admin only) */}
                    {isAdmin && (
                        <div style={s.addMemberWrap}>
                            <div style={s.searchInputWrap}>
                                <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                                <input
                                    style={s.searchInput}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={t('group.addMemberPlaceholder')}
                                />
                                {searchQuery && (
                                    <button style={s.clearBtn} onClick={() => { setSearchQuery(''); setSearchResults([]) }}>
                                        <X size={13} />
                                    </button>
                                )}
                            </div>
                            {searchResults.length > 0 && (
                                <div style={s.searchDropdown}>
                                    {searchResults.map(user => (
                                        <div key={user.id} style={s.searchRow} onClick={() => handleAddMember(user)}>
                                            {user.avatarUrl
                                                ? <img src={user.avatarUrl} style={s.miniAvatar} alt="" />
                                                : <div style={s.miniAvatarPh}>{user.fullName?.charAt(0)}</div>
                                            }
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={s.searchName}>{user.fullName}</div>
                                                <div style={s.searchHandle}>@{user.username}</div>
                                            </div>
                                            <div style={s.addIcon}><UserPlus size={14} color="var(--accent)" /></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Member list */}
                    <div style={s.memberList}>
                        {group?.members?.map((member, idx) => {
                            const isMe = member.id === me?.id
                            const isMemberAdmin = member.id === group?.admin?.id
                            const isLast = idx === group.members.length - 1

                            return (
                                <div key={member.id} style={{
                                    ...s.memberRow,
                                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                                }}>
                                    <div style={s.memberAvatarWrap}>
                                        {member.avatarUrl
                                            ? <img src={member.avatarUrl} style={s.memberAvatar} alt="" />
                                            : <div style={s.memberAvatarPh}>{member.fullName?.charAt(0)}</div>
                                        }
                                        {isMemberAdmin && (
                                            <div style={s.crownBadge}><Crown size={8} color="#fff" /></div>
                                        )}
                                    </div>
                                    <div style={s.memberInfo}>
                                        <div style={s.memberNameRow}>
                                            <span style={s.memberName}>{member.fullName}</span>
                                            {isMe && <span style={s.youTag}>{t('group.you')}</span>}
                                        </div>
                                        <span style={s.memberHandle}>@{member.username}</span>
                                    </div>
                                    {/* Admin actions */}
                                    {isAdmin && !isMe && !isMemberAdmin && (
                                        <div style={s.memberActions}>
                                            <button
                                                style={s.memberActionBtn('accent')}
                                                onClick={() => setTransferTo(member)}
                                                title={t('group.transferAdmin')}
                                            >
                                                <Crown size={13} />
                                            </button>
                                            <button
                                                style={s.memberActionBtn('error')}
                                                onClick={() => handleRemoveMember(member.id, member.fullName)}
                                                title={t('group.kick')}
                                            >
                                                <UserMinus size={13} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Danger zone */}
                <div style={s.dangerCard}>
                    <div style={s.dangerHeader}>
                        <div style={s.cardTitleRow}>
                            <div style={{ ...s.cardIconWrap, background: 'var(--error-bg)', borderColor: 'rgba(239,68,68,0.2)' }}>
                                <ShieldAlert size={13} color="var(--error)" />
                            </div>
                            <span style={{ ...s.cardTitle, color: 'var(--error)' }}>{t('group.dangerZone')}</span>
                        </div>
                    </div>
                    <div style={s.dangerActions}>
                        {!isAdmin && (
                            <button style={s.dangerBtn} onClick={() => setConfirmLeave(true)}>
                                <LogOut size={15} />
                                {t('group.leave')}
                                <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
                            </button>
                        )}
                        {isAdmin && (
                            <button style={s.dangerBtn} onClick={() => setConfirmDelete(true)}>
                                <Trash2 size={15} />
                                {t('group.delete')}
                                <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            {transferTo && (
                <Modal
                    title={t('group.transferConfirm')}
                    body={<><strong style={{ color: 'var(--text-primary)' }}>{transferTo.fullName}</strong> {t('group.transferText')}</>}
                    confirmLabel={t('group.transfer')}
                    onConfirm={handleTransferAdmin}
                    onCancel={() => setTransferTo(null)}
                />
            )}
            {confirmLeave && (
                <Modal
                    title={t('group.leaveConfirm')}
                    body={t('group.leaveText')}
                    confirmLabel={t('group.leaveBtn')}
                    danger
                    onConfirm={handleLeave}
                    onCancel={() => setConfirmLeave(false)}
                />
            )}
            {confirmDelete && (
                <Modal
                    title={t('group.deleteConfirm')}
                    body={t('group.deleteText')}
                    confirmLabel={t('group.deleteBtn')}
                    danger
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete(false)}
                />
            )}
        </div>
    )
}

/* ── Modal component ── */
function Modal({ title, body, confirmLabel, danger, onConfirm, onCancel }) {
    const { t } = useTranslation()
    return (
        <div style={m.overlay}>
            <div style={m.modal}>
                <h3 style={m.title}>{title}</h3>
                <p style={m.body}>{body}</p>
                <div style={m.actions}>
                    <button style={m.cancelBtn} onClick={onCancel}>{t('common.cancel')}</button>
                    <button style={danger ? m.dangerBtn : m.confirmBtn} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

/* ─────────────── Styles ─────────────── */
const s = {
    page: {
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        fontFamily: "'Inter', sans-serif",
        color: 'var(--text-primary)',
    },
    loadingPage: {
        minHeight: '100vh', background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(12px)',
    },
    backBtn: {
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'transparent', border: 'none',
        color: 'var(--accent)', fontSize: '13px', fontWeight: '600',
        cursor: 'pointer', fontFamily: 'inherit',
        padding: '6px 10px', borderRadius: '8px',
    },
    headerTitle: {
        fontSize: '15px', fontWeight: '700',
        color: 'var(--text-primary)', letterSpacing: '-0.02em',
    },
    body: {
        maxWidth: '560px',
        margin: '0 auto',
        padding: '28px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    toast: (type) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        background: type === 'error' ? 'var(--error-bg)' : 'var(--success-bg)',
        border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
        borderRadius: '10px', padding: '11px 14px',
        fontSize: '13px', fontWeight: '500',
        color: type === 'error' ? 'var(--error)' : 'var(--success)',
    }),
    toastDot: (type) => ({
        width: '6px', height: '6px', borderRadius: '50%',
        background: type === 'error' ? 'var(--error)' : 'var(--success)', flexShrink: 0,
    }),
    heroCard: {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
    },
    avatarWrap: { position: 'relative', flexShrink: 0 },
    avatarImg: {
        width: '72px', height: '72px',
        borderRadius: '20px', objectFit: 'cover',
        border: '2px solid var(--border)',
    },
    avatarPlaceholder: {
        width: '72px', height: '72px', borderRadius: '20px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    avatarOverlay: {
        position: 'absolute', inset: 0, borderRadius: '20px',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    cameraBtn: {
        position: 'absolute', bottom: '-6px', right: '-6px',
        width: '26px', height: '26px', borderRadius: '8px',
        background: 'var(--accent)', border: '2px solid var(--bg-secondary)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
    },
    heroInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
    heroName: {
        fontSize: '18px', fontWeight: '700',
        color: 'var(--text-primary)', letterSpacing: '-0.03em',
    },
    heroMeta: {
        fontSize: '13px', color: 'var(--text-muted)', fontWeight: '400',
    },
    adminPill: {
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.25)',
        color: '#f59e0b',
        borderRadius: '999px', padding: '3px 10px',
        fontSize: '11px', fontWeight: '600',
        width: 'fit-content', marginTop: '4px',
    },
    card: {
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px', overflow: 'hidden',
    },
    cardHeader: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
    },
    cardTitleRow: { display: 'flex', alignItems: 'center', gap: '10px' },
    cardIconWrap: {
        width: '28px', height: '28px', borderRadius: '8px',
        background: 'var(--accent-bg)', border: '1px solid var(--accent-bg-hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    cardTitle: {
        fontSize: '14px', fontWeight: '600',
        color: 'var(--text-primary)', letterSpacing: '-0.01em',
    },
    memberCountBadge: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '999px', padding: '1px 8px',
        fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)',
    },
    editBtn: {
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '6px 12px',
        fontSize: '12px', fontWeight: '600',
        color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
    },
    editActions: { display: 'flex', gap: '6px', alignItems: 'center' },
    cancelBtn: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '6px', color: 'var(--text-secondary)',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
    },
    saveBtn: {
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'var(--accent)', border: 'none', borderRadius: '8px',
        padding: '6px 14px', fontSize: '12px', fontWeight: '600',
        color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
    },
    fieldList: { padding: '4px 0' },
    fieldRow: {
        display: 'flex', flexDirection: 'column', gap: '6px',
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
    },
    fieldLabel: {
        fontSize: '11px', fontWeight: '600',
        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
    },
    fieldValue: { fontSize: '14px', color: 'var(--text-primary)' },
    empty: { color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px' },
    input: {
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '9px 12px',
        color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
        fontFamily: 'inherit', width: '100%',
    },
    textarea: {
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '9px 12px',
        color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
        fontFamily: 'inherit', width: '100%', resize: 'vertical', lineHeight: '1.5',
    },
    addMemberWrap: {
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
    },
    searchInputWrap: {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '9px 12px',
    },
    searchInput: {
        flex: 1, background: 'transparent', border: 'none',
        color: 'var(--text-primary)', fontSize: '13px',
        outline: 'none', fontFamily: 'inherit',
    },
    clearBtn: {
        background: 'transparent', border: 'none',
        color: 'var(--text-muted)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', padding: 0,
    },
    searchDropdown: {
        position: 'absolute', top: 'calc(100% - 4px)',
        left: '16px', right: '16px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '12px', zIndex: 50,
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden',
        maxHeight: '220px', overflowY: 'auto',
    },
    searchRow: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '11px 14px', cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        transition: 'background 0.12s',
    },
    miniAvatar: { width: '32px', height: '32px', borderRadius: '10px', objectFit: 'cover' },
    miniAvatarPh: {
        width: '32px', height: '32px', borderRadius: '10px',
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '700', color: '#fff',
    },
    searchName: { fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' },
    searchHandle: { fontSize: '11px', color: 'var(--text-muted)' },
    addIcon: { marginLeft: 'auto' },
    memberList: { padding: '4px 0' },
    memberRow: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 20px',
    },
    memberAvatarWrap: { position: 'relative', flexShrink: 0 },
    memberAvatar: { width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' },
    memberAvatarPh: {
        width: '40px', height: '40px', borderRadius: '12px',
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', fontWeight: '700', color: '#fff',
    },
    crownBadge: {
        position: 'absolute', bottom: '-4px', right: '-4px',
        width: '16px', height: '16px', borderRadius: '5px',
        background: '#f59e0b', border: '2px solid var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    memberInfo: { flex: 1, minWidth: 0 },
    memberNameRow: { display: 'flex', alignItems: 'center', gap: '6px' },
    memberName: {
        fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
    },
    youTag: {
        background: 'var(--accent-bg)', border: '1px solid var(--accent-bg-hover)',
        color: 'var(--accent-light)', borderRadius: '999px',
        padding: '1px 7px', fontSize: '10px', fontWeight: '700',
    },
    memberHandle: { fontSize: '12px', color: 'var(--text-muted)' },
    memberActions: { display: 'flex', gap: '6px' },
    memberActionBtn: (type) => ({
        background: type === 'error' ? 'var(--error-bg)' : 'var(--accent-bg)',
        border: `1px solid ${type === 'error' ? 'rgba(239,68,68,0.2)' : 'var(--accent-bg-hover)'}`,
        borderRadius: '8px', padding: '7px',
        color: type === 'error' ? 'var(--error)' : 'var(--accent)',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        transition: 'opacity 0.15s',
    }),
    dangerCard: {
        background: 'var(--bg-secondary)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '16px', overflow: 'hidden',
    },
    dangerHeader: {
        padding: '14px 20px', borderBottom: '1px solid rgba(239,68,68,0.15)',
    },
    dangerActions: { padding: '8px' },
    dangerBtn: {
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: '10px', padding: '13px 16px',
        color: 'var(--error)', fontSize: '14px', fontWeight: '600',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'opacity 0.15s',
    },
}

const m = {
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
        borderRadius: '16px', padding: '28px 28px 24px',
        width: '100%', maxWidth: '380px',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeUp 0.15s ease',
    },
    title: {
        fontSize: '17px', fontWeight: '700',
        color: 'var(--text-primary)', letterSpacing: '-0.02em',
        marginBottom: '10px',
    },
    body: {
        fontSize: '14px', color: 'var(--text-secondary)',
        lineHeight: '1.6', marginBottom: '24px',
    },
    actions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
    cancelBtn: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '9px 18px',
        fontSize: '13px', fontWeight: '600',
        color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
    },
    confirmBtn: {
        background: 'var(--accent)', border: 'none',
        borderRadius: '8px', padding: '9px 18px',
        fontSize: '13px', fontWeight: '600',
        color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
    },
    dangerBtn: {
        background: 'var(--error)', border: 'none',
        borderRadius: '8px', padding: '9px 18px',
        fontSize: '13px', fontWeight: '600',
        color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
    },
}