import { useState, useEffect } from 'react'
import api from '../api/auth'
import {
    Search, Shield, Trash2, ChevronDown, ChevronUp,
    User as UserIcon, Crown, CheckCircle, XCircle,
    Filter, X, Eye, MoreVertical, UserCheck, UserX,
    Mail, Phone, Calendar, AtSign, ShieldAlert
} from 'lucide-react'

export default function AdminUsersTab() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [filterRole, setFilterRole] = useState('ALL')
    const [filterVerified, setFilterVerified] = useState('ALL')
    const [sortBy, setSortBy] = useState('fullName')
    const [sortDir, setSortDir] = useState('asc')
    const [selectedUser, setSelectedUser] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)

    useEffect(() => { fetchUsers() }, [])

    const fetchUsers = async () => {
        setLoading(true); setError('')
        try {
            const res = await api.get('/admin/users')
            setUsers(res.data)
        } catch { setError('Failed to load users') }
        finally { setLoading(false) }
    }

    const handleToggleRole = async (user) => {
        setActionLoading(user.id + '_role')
        const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
        try {
            const res = await api.patch(`/admin/users/${user.id}/role`, { role: newRole })
            setUsers(prev => prev.map(u => u.id === user.id ? res.data : u))
            if (selectedUser?.id === user.id) setSelectedUser(res.data)
        } catch { setError('Failed to update role') }
        finally { setActionLoading(null) }
    }

    const handleDelete = async (userId) => {
        setActionLoading(userId + '_delete')
        try {
            await api.delete(`/admin/users/${userId}`)
            setUsers(prev => prev.filter(u => u.id !== userId))
            if (selectedUser?.id === userId) setSelectedUser(null)
            setConfirmDelete(null)
        } catch { setError('Failed to delete user') }
        finally { setActionLoading(null) }
    }

    const handleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortBy(col); setSortDir('asc') }
    }

    const filtered = users
        .filter(u => {
            const q = search.toLowerCase()
            const matchSearch = !q || u.fullName?.toLowerCase().includes(q)
                || u.username?.toLowerCase().includes(q)
                || u.email?.toLowerCase().includes(q)
            const matchRole = filterRole === 'ALL' || u.role === filterRole
            const matchVerified = filterVerified === 'ALL'
                || (filterVerified === 'YES' && u.emailVerified)
                || (filterVerified === 'NO' && !u.emailVerified)
            return matchSearch && matchRole && matchVerified
        })
        .sort((a, b) => {
            let av = a[sortBy] ?? '', bv = b[sortBy] ?? ''
            if (typeof av === 'string') av = av.toLowerCase()
            if (typeof bv === 'string') bv = bv.toLowerCase()
            if (av < bv) return sortDir === 'asc' ? -1 : 1
            if (av > bv) return sortDir === 'asc' ? 1 : -1
            return 0
        })

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <ChevronDown size={12} style={{ opacity: 0.3 }} />
        return sortDir === 'asc'
            ? <ChevronUp size={12} style={{ color: '#6366f1' }} />
            : <ChevronDown size={12} style={{ color: '#6366f1' }} />
    }

    if (loading) return (
        <div style={u.center}>
            <div style={u.spinner} />
            <span style={u.loadingText}>Loading users...</span>
        </div>
    )

    return (
        <div style={u.wrap}>
            {error && (
                <div style={u.errorBox}>
                    <ShieldAlert size={16} />{error}
                    <button style={u.errorClose} onClick={() => setError('')}><X size={14} /></button>
                </div>
            )}

            {/* Toolbar */}
            <div style={u.toolbar}>
                <div style={u.searchWrap}>
                    <Search size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                    <input
                        style={u.searchInput}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, username or email..."
                    />
                    {search && (
                        <button style={u.clearBtn} onClick={() => setSearch('')}>
                            <X size={12} />
                        </button>
                    )}
                </div>

                <div style={u.filters}>
                    <FilterSelect
                        value={filterRole}
                        onChange={setFilterRole}
                        options={[
                            { value: 'ALL', label: 'All Roles' },
                            { value: 'USER', label: 'Users' },
                            { value: 'ADMIN', label: 'Admins' },
                        ]}
                    />
                    <FilterSelect
                        value={filterVerified}
                        onChange={setFilterVerified}
                        options={[
                            { value: 'ALL', label: 'All Status' },
                            { value: 'YES', label: 'Verified' },
                            { value: 'NO', label: 'Unverified' },
                        ]}
                    />
                </div>

                <div style={u.countBadge}>
                    {filtered.length} / {users.length} users
                </div>
            </div>

            {/* Table + Detail panel */}
            <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
                {/* Table */}
                <div style={{ ...u.tableWrap, flex: selectedUser ? '1' : '1' }}>
                    <table style={u.table}>
                        <thead>
                            <tr>
                                {[
                                    { col: 'fullName', label: 'User' },
                                    { col: 'email', label: 'Email' },
                                    { col: 'role', label: 'Role' },
                                    { col: 'emailVerified', label: 'Verified' },
                                    { col: 'status', label: 'Status' },
                                    { col: null, label: 'Actions' },
                                ].map(({ col, label }) => (
                                    <th
                                        key={label}
                                        style={{ ...u.th, cursor: col ? 'pointer' : 'default' }}
                                        onClick={() => col && handleSort(col)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {label}
                                            {col && <SortIcon col={col} />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={u.emptyCell}>
                                        <UserX size={20} style={{ opacity: 0.3 }} />
                                        <span>No users found</span>
                                    </td>
                                </tr>
                            ) : filtered.map(user => {
                                const isSelected = selectedUser?.id === user.id
                                return (
                                    <tr
                                        key={user.id}
                                        style={{
                                            ...u.tr,
                                            background: isSelected
                                                ? 'rgba(99,102,241,0.08)'
                                                : 'transparent',
                                            borderLeft: isSelected
                                                ? '2px solid #6366f1'
                                                : '2px solid transparent',
                                        }}
                                        onClick={() => setSelectedUser(isSelected ? null : user)}
                                    >
                                        {/* User */}
                                        <td style={u.td}>
                                            <div style={u.userCell}>
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} style={u.avatar} alt="" />
                                                ) : (
                                                    <div style={u.avatarPh}>
                                                        {user.fullName?.charAt(0)?.toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={u.userName}>{user.fullName}</div>
                                                    <div style={u.userHandle}>@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Email */}
                                        <td style={u.td}>
                                            <span style={u.emailText}>{user.email}</span>
                                        </td>
                                        {/* Role */}
                                        <td style={u.td}>
                                            <span style={{
                                                ...u.roleBadge,
                                                background: user.role === 'ADMIN'
                                                    ? 'rgba(245,158,11,0.12)'
                                                    : 'rgba(255,255,255,0.05)',
                                                color: user.role === 'ADMIN' ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                                                border: `1px solid ${user.role === 'ADMIN' ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.1)'}`,
                                            }}>
                                                {user.role === 'ADMIN' && <Crown size={10} />}
                                                {user.role}
                                            </span>
                                        </td>
                                        {/* Verified */}
                                        <td style={u.td}>
                                            {user.emailVerified
                                                ? <CheckCircle size={15} color="#10b981" />
                                                : <XCircle size={15} color="rgba(255,255,255,0.2)" />
                                            }
                                        </td>
                                        {/* Status */}
                                        <td style={u.td}>
                                            <div style={u.statusCell}>
                                                <div style={{
                                                    ...u.statusDot,
                                                    background: user.status === 'ONLINE' ? '#10b981' : 'rgba(255,255,255,0.2)',
                                                    boxShadow: user.status === 'ONLINE' ? '0 0 6px #10b981' : 'none',
                                                }} />
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: user.status === 'ONLINE' ? '#10b981' : 'rgba(255,255,255,0.35)',
                                                }}>
                                                    {user.status}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Actions */}
                                        <td style={u.td} onClick={e => e.stopPropagation()}>
                                            <div style={u.actionBtns}>
                                                <button
                                                    style={u.actionBtn}
                                                    onClick={() => handleToggleRole(user)}
                                                    disabled={!!actionLoading}
                                                    title={user.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                                                >
                                                    {actionLoading === user.id + '_role'
                                                        ? <div style={u.miniSpinner} />
                                                        : <Shield size={13} color={user.role === 'ADMIN' ? '#f59e0b' : 'rgba(255,255,255,0.4)'} />
                                                    }
                                                </button>
                                                <button
                                                    style={{ ...u.actionBtn, ...u.deleteBtn }}
                                                    onClick={() => setConfirmDelete(user)}
                                                    disabled={!!actionLoading}
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Detail Panel */}
                {selectedUser && (
                    <div style={u.detailPanel}>
                        <div style={u.detailHeader}>
                            <span style={u.detailTitle}>User Details</span>
                            <button style={u.detailClose} onClick={() => setSelectedUser(null)}>
                                <X size={14} />
                            </button>
                        </div>

                        <div style={u.detailAvatar}>
                            {selectedUser.avatarUrl ? (
                                <img src={selectedUser.avatarUrl} style={u.detailAvatarImg} alt="" />
                            ) : (
                                <div style={u.detailAvatarPh}>
                                    {selectedUser.fullName?.charAt(0)?.toUpperCase()}
                                </div>
                            )}
                            <div style={{
                                ...u.detailStatusDot,
                                background: selectedUser.status === 'ONLINE' ? '#10b981' : 'rgba(255,255,255,0.2)',
                                boxShadow: selectedUser.status === 'ONLINE' ? '0 0 8px #10b981' : 'none',
                            }} />
                        </div>

                        <div style={u.detailName}>{selectedUser.fullName}</div>
                        <div style={u.detailHandle}>@{selectedUser.username}</div>

                        <div style={{
                            ...u.detailRoleBadge,
                            background: selectedUser.role === 'ADMIN' ? 'rgba(245,158,11,0.12)' : 'rgba(99,102,241,0.12)',
                            color: selectedUser.role === 'ADMIN' ? '#f59e0b' : '#a5b4fc',
                            border: `1px solid ${selectedUser.role === 'ADMIN' ? 'rgba(245,158,11,0.3)' : 'rgba(99,102,241,0.25)'}`,
                        }}>
                            {selectedUser.role === 'ADMIN' && <Crown size={11} />}
                            {selectedUser.role}
                        </div>

                        <div style={u.detailFields}>
                            <DetailField icon={<Mail size={13} />} label="Email" value={selectedUser.email} />
                            <DetailField icon={<Phone size={13} />} label="Phone" value={selectedUser.phone || '—'} />
                            <DetailField icon={<Calendar size={13} />} label="Birthday" value={selectedUser.birthDate || '—'} />
                            <DetailField
                                icon={<CheckCircle size={13} />}
                                label="Email Verified"
                                value={selectedUser.emailVerified ? 'Yes' : 'No'}
                                valueColor={selectedUser.emailVerified ? '#10b981' : '#f87171'}
                            />
                            <DetailField
                                icon={<UserIcon size={13} />}
                                label="Status"
                                value={selectedUser.status}
                                valueColor={selectedUser.status === 'ONLINE' ? '#10b981' : 'rgba(255,255,255,0.4)'}
                            />
                            {selectedUser.bio && (
                                <DetailField icon={<AtSign size={13} />} label="Bio" value={selectedUser.bio} />
                            )}
                        </div>

                        <div style={u.detailActions}>
                            <button
                                style={{
                                    ...u.detailActionBtn,
                                    background: selectedUser.role === 'ADMIN'
                                        ? 'rgba(245,158,11,0.1)'
                                        : 'rgba(99,102,241,0.1)',
                                    border: `1px solid ${selectedUser.role === 'ADMIN'
                                        ? 'rgba(245,158,11,0.25)'
                                        : 'rgba(99,102,241,0.25)'}`,
                                    color: selectedUser.role === 'ADMIN' ? '#f59e0b' : '#a5b4fc',
                                }}
                                onClick={() => handleToggleRole(selectedUser)}
                                disabled={!!actionLoading}
                            >
                                <Shield size={14} />
                                {selectedUser.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                            </button>
                            <button
                                style={{ ...u.detailActionBtn, ...u.detailDeleteBtn }}
                                onClick={() => setConfirmDelete(selectedUser)}
                                disabled={!!actionLoading}
                            >
                                <Trash2 size={14} />
                                Delete User
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div style={u.overlay}>
                    <div style={u.modal}>
                        <div style={u.modalIcon}>
                            <Trash2 size={22} color="#ef4444" />
                        </div>
                        <h3 style={u.modalTitle}>Delete User?</h3>
                        <p style={u.modalBody}>
                            Are you sure you want to delete{' '}
                            <strong style={{ color: '#f1f1f8' }}>{confirmDelete.fullName}</strong>?
                            This action cannot be undone.
                        </p>
                        <div style={u.modalActions}>
                            <button style={u.modalCancel} onClick={() => setConfirmDelete(null)}>
                                Cancel
                            </button>
                            <button
                                style={u.modalDelete}
                                onClick={() => handleDelete(confirmDelete.id)}
                                disabled={!!actionLoading}
                            >
                                {actionLoading === confirmDelete.id + '_delete'
                                    ? <div style={u.miniSpinner} />
                                    : <Trash2 size={14} />
                                }
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function FilterSelect({ value, onChange, options }) {
    return (
        <select
            style={u.select}
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            {options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
    )
}

function DetailField({ icon, label, value, valueColor }) {
    return (
        <div style={u.detailField}>
            <div style={u.detailFieldIcon}>{icon}</div>
            <div>
                <div style={u.detailFieldLabel}>{label}</div>
                <div style={{ ...u.detailFieldValue, color: valueColor || 'rgba(255,255,255,0.75)' }}>
                    {value}
                </div>
            </div>
        </div>
    )
}

const u = {
    wrap: {
        display: 'flex', flexDirection: 'column', gap: '16px',
        height: '100%',
    },
    center: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '12px', height: '300px',
    },
    spinner: {
        width: '24px', height: '24px',
        border: '2px solid rgba(255,255,255,0.08)',
        borderTop: '2px solid #6366f1',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    },
    miniSpinner: {
        width: '12px', height: '12px',
        border: '2px solid rgba(255,255,255,0.2)',
        borderTop: '2px solid currentColor',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
    },
    loadingText: { fontSize: '13px', color: 'rgba(255,255,255,0.3)' },
    errorBox: {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '10px', padding: '11px 14px',
        fontSize: '13px', color: '#f87171', fontWeight: '500',
    },
    errorClose: {
        marginLeft: 'auto', background: 'transparent', border: 'none',
        color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center',
    },
    toolbar: {
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
    },
    searchWrap: {
        flex: 1, minWidth: '200px',
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', padding: '9px 12px',
    },
    searchInput: {
        flex: 1, background: 'transparent', border: 'none',
        color: '#f1f1f8', fontSize: '13px', outline: 'none',
        fontFamily: 'inherit',
    },
    clearBtn: {
        background: 'transparent', border: 'none',
        color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
    },
    filters: { display: 'flex', gap: '8px' },
    select: {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', padding: '9px 12px',
        color: 'rgba(255,255,255,0.7)', fontSize: '12px',
        fontWeight: '600', cursor: 'pointer',
        fontFamily: 'inherit', outline: 'none',
    },
    countBadge: {
        fontSize: '11px', fontWeight: '700',
        color: 'rgba(255,255,255,0.3)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '999px', padding: '4px 10px',
        whiteSpace: 'nowrap',
    },
    tableWrap: {
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px', overflow: 'auto',
    },
    table: {
        width: '100%', borderCollapse: 'collapse',
        fontSize: '13px',
    },
    th: {
        padding: '12px 16px',
        textAlign: 'left',
        fontSize: '11px', fontWeight: '700',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        whiteSpace: 'nowrap', userSelect: 'none',
        background: 'rgba(255,255,255,0.02)',
    },
    tr: {
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer',
        transition: 'background 0.1s',
    },
    td: {
        padding: '12px 16px',
        verticalAlign: 'middle',
    },
    emptyCell: {
        padding: '48px', textAlign: 'center',
        color: 'rgba(255,255,255,0.25)', fontSize: '13px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '8px',
    },
    userCell: { display: 'flex', alignItems: 'center', gap: '10px' },
    avatar: { width: '34px', height: '34px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 },
    avatarPh: {
        width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '700', color: '#fff',
    },
    userName: { fontSize: '13px', fontWeight: '600', color: '#f1f1f8', letterSpacing: '-0.01em' },
    userHandle: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' },
    emailText: { fontSize: '12px', color: 'rgba(255,255,255,0.5)' },
    roleBadge: {
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        borderRadius: '999px', padding: '3px 9px',
        fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em',
    },
    statusCell: { display: 'flex', alignItems: 'center', gap: '6px' },
    statusDot: { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0 },
    actionBtns: { display: 'flex', gap: '6px' },
    actionBtn: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '7px', padding: '6px',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        color: 'rgba(255,255,255,0.5)',
        transition: 'background 0.15s',
    },
    deleteBtn: {
        color: '#f87171',
        background: 'rgba(239,68,68,0.08)',
        borderColor: 'rgba(239,68,68,0.15)',
    },
    // Detail panel
    detailPanel: {
        width: '260px', minWidth: '260px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px', padding: '20px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0',
        animation: 'fadeUp 0.15s ease',
        overflowY: 'auto',
    },
    detailHeader: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%', marginBottom: '20px',
    },
    detailTitle: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' },
    detailClose: {
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '7px', padding: '5px', cursor: 'pointer',
        color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center',
    },
    detailAvatar: { position: 'relative', marginBottom: '12px' },
    detailAvatarImg: { width: '72px', height: '72px', borderRadius: '20px', objectFit: 'cover' },
    detailAvatarPh: {
        width: '72px', height: '72px', borderRadius: '20px',
        background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '26px', fontWeight: '800', color: '#fff',
    },
    detailStatusDot: {
        position: 'absolute', bottom: '2px', right: '2px',
        width: '12px', height: '12px', borderRadius: '50%',
        border: '2px solid #0d0d1a',
    },
    detailName: { fontSize: '16px', fontWeight: '700', color: '#f1f1f8', letterSpacing: '-0.02em' },
    detailHandle: { fontSize: '12px', color: '#6366f1', marginTop: '2px', marginBottom: '10px' },
    detailRoleBadge: {
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        borderRadius: '999px', padding: '4px 12px',
        fontSize: '11px', fontWeight: '700', marginBottom: '18px',
    },
    detailFields: { width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '16px' },
    detailField: {
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '9px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    detailFieldIcon: { color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: '1px' },
    detailFieldLabel: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600', marginBottom: '2px' },
    detailFieldValue: { fontSize: '12px', fontWeight: '500', wordBreak: 'break-all' },
    detailActions: { width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' },
    detailActionBtn: {
        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
        justifyContent: 'center', border: 'none', borderRadius: '10px',
        padding: '10px', fontSize: '12px', fontWeight: '600',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s',
    },
    detailDeleteBtn: {
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        color: '#f87171',
    },
    // Modal
    overlay: {
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease',
    },
    modal: {
        background: '#0e0e1a', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '380px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8)',
        animation: 'fadeUp 0.15s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0',
    },
    modalIcon: {
        width: '52px', height: '52px', borderRadius: '16px',
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
    },
    modalTitle: { fontSize: '18px', fontWeight: '700', color: '#f1f1f8', letterSpacing: '-0.02em', marginBottom: '8px', textAlign: 'center' },
    modalBody: { fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', textAlign: 'center', marginBottom: '24px' },
    modalActions: { display: 'flex', gap: '10px', width: '100%' },
    modalCancel: {
        flex: 1, background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px', padding: '11px',
        fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer', fontFamily: 'inherit',
    },
    modalDelete: {
        flex: 1, background: '#ef4444', border: 'none',
        borderRadius: '10px', padding: '11px',
        fontSize: '13px', fontWeight: '600', color: '#fff',
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    },
}