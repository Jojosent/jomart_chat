import { useState, useEffect } from 'react'
import api from '../api/auth'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    Users, Shield, Trash2, ArrowLeft, Loader,
    User as UserIcon, MessageSquare, ShieldAlert
} from 'lucide-react'

export default function AdminPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [tab, setTab] = useState('users') // 'users' | 'groups'
    const [users, setUsers] = useState([])
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchData()
    }, [tab])

    const fetchData = async () => {
        setLoading(true)
        setError('')
        try {
            if (tab === 'users') {
                const res = await api.get('/admin/users')
                setUsers(res.data)
            } else {
                const res = await api.get('/admin/groups')
                setGroups(res.data)
            }
        } catch (err) {
            setError(err.response?.status === 403 ? 'Access denied' : 'Failed to fetch data')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return
        try {
            await api.delete(`/admin/users/${id}`)
            setUsers(users.filter(u => u.id !== id))
        } catch (err) {
            alert('Failed to delete user')
        }
    }

    const handleToggleRole = async (user) => {
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
        try {
            const res = await api.patch(`/admin/users/${user.id}/role`, { role: newRole })
            setUsers(users.map(u => u.id === user.id ? res.data : u))
        } catch (err) {
            alert('Failed to update role')
        }
    }

    const handleDeleteGroup = async (id) => {
        if (!window.confirm('Are you sure you want to delete this group?')) return
        try {
            await api.delete(`/admin/groups/${id}`)
            setGroups(groups.filter(g => g.id !== id))
        } catch (err) {
            alert('Failed to delete group')
        }
    }

    return (
        <div style={s.page}>
            <header style={s.header}>
                <button style={s.backBtn} onClick={() => navigate('/profile')}>
                    <ArrowLeft size={18} />
                </button>
                <h1 style={s.title}>{t('admin.title', 'Admin Panel')}</h1>
                <div style={{ width: 40 }} />
            </header>

            <div style={s.tabs}>
                <button
                    style={{ ...s.tab, borderBottomColor: tab === 'users' ? 'var(--accent)' : 'transparent', color: tab === 'users' ? 'var(--accent)' : 'var(--text-muted)' }}
                    onClick={() => setTab('users')}
                >
                    <UserIcon size={16} />
                    {t('admin.users', 'Users')}
                </button>
                <button
                    style={{ ...s.tab, borderBottomColor: tab === 'groups' ? 'var(--accent)' : 'transparent', color: tab === 'groups' ? 'var(--accent)' : 'var(--text-muted)' }}
                    onClick={() => setTab('groups')}
                >
                    <Users size={16} />
                    {t('admin.groups', 'Groups')}
                </button>
            </div>

            <main style={s.main}>
                {loading ? (
                    <div style={s.center}><Loader style={s.spin} /></div>
                ) : error ? (
                    <div style={s.error}><ShieldAlert /> {error}</div>
                ) : tab === 'users' ? (
                    <div style={s.list}>
                        {users.map(u => (
                            <div key={u.id} style={s.item}>
                                <div style={s.itemInfo}>
                                    {u.avatarUrl ? (
                                        <img src={u.avatarUrl} style={s.avatar} alt="" />
                                    ) : (
                                        <div style={s.avatarPlaceholder}>{u.fullName?.charAt(0)}</div>
                                    )}
                                    <div>
                                        <div style={s.itemName}>{u.fullName}</div>
                                        <div style={s.itemSub}>@{u.username} • {u.email}</div>
                                        <div style={{...s.roleBadge, background: u.role === 'ADMIN' ? 'var(--accent-bg)' : 'var(--bg-elevated)', color: u.role === 'ADMIN' ? 'var(--accent)' : 'var(--text-muted)'}}>
                                            {u.role}
                                        </div>
                                    </div>
                                </div>
                                <div style={s.actions}>
                                    <button style={s.actionBtn} onClick={() => handleToggleRole(u)} title="Toggle Role">
                                        <Shield size={16} />
                                    </button>
                                    <button style={{...s.actionBtn, color: 'var(--error)'}} onClick={() => handleDeleteUser(u.id)} title="Delete User">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={s.list}>
                        {groups.map(g => (
                            <div key={g.id} style={s.item}>
                                <div style={s.itemInfo}>
                                    {g.avatarUrl ? (
                                        <img src={g.avatarUrl} style={s.avatar} alt="" />
                                    ) : (
                                        <div style={{...s.avatarPlaceholder, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)'}}><Users size={20} /></div>
                                    )}
                                    <div>
                                        <div style={s.itemName}>{g.name}</div>
                                        <div style={s.itemSub}>{g.memberCount} members • Admin: {g.admin?.fullName || 'None'}</div>
                                    </div>
                                </div>
                                <div style={s.actions}>
                                    <button style={{...s.actionBtn, color: 'var(--error)'}} onClick={() => handleDeleteGroup(g.id)} title="Delete Group">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}

const s = {
    page: { minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' },
    header: { height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 10 },
    backBtn: { background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: 8, borderRadius: 8 },
    title: { fontSize: 18, fontWeight: 700 },
    tabs: { display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' },
    tab: { flex: 1, padding: '15px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderBottom: '2px solid transparent', transition: 'all 0.2s' },
    main: { padding: 20, maxWidth: 800, margin: '0 auto' },
    center: { display: 'flex', justifyContent: 'center', padding: 40 },
    spin: { animation: 'spin 1s linear infinite' },
    error: { color: 'var(--error)', background: 'var(--error-bg)', padding: 15, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 },
    list: { display: 'flex', flexDirection: 'column', gap: 12 },
    item: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 15, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' },
    itemInfo: { display: 'flex', alignItems: 'center', gap: 15 },
    avatar: { width: 48, height: 48, borderRadius: 12, objectFit: 'cover' },
    avatarPlaceholder: { width: 48, height: 48, borderRadius: 12, background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 },
    itemName: { fontSize: 15, fontWeight: 600 },
    itemSub: { fontSize: 13, color: 'var(--text-muted)' },
    roleBadge: { fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block' },
    actions: { display: 'flex', gap: 8 },
    actionBtn: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)', padding: 8, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
}
