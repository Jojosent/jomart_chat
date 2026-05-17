import { useState, useEffect } from 'react'
import api from '../api/auth'
import {
    Search, Trash2, X, Users, Crown,
    ChevronDown, ChevronUp, ShieldAlert,
    Calendar, FileText, UserCheck, Hash,
    MessageSquare, Globe, Lock
} from 'lucide-react'

export default function AdminGroupsTab() {
    const [groups, setGroups] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [sortDir, setSortDir] = useState('asc')
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [actionLoading, setActionLoading] = useState(null)
    const [filterSize, setFilterSize] = useState('ALL')

    useEffect(() => { fetchGroups() }, [])

    const fetchGroups = async () => {
        setLoading(true); setError('')
        try {
            const res = await api.get('/admin/groups')
            setGroups(res.data)
        } catch { setError('Failed to load groups') }
        finally { setLoading(false) }
    }

    const handleDelete = async (groupId) => {
        setActionLoading(groupId + '_delete')
        try {
            await api.delete(`/admin/groups/${groupId}`)
            setGroups(prev => prev.filter(g => g.id !== groupId))
            if (selectedGroup?.id === groupId) setSelectedGroup(null)
            setConfirmDelete(null)
        } catch { setError('Failed to delete group') }
        finally { setActionLoading(null) }
    }

    const handleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortBy(col); setSortDir('asc') }
    }

    const filtered = groups
        .filter(g => {
            const q = search.toLowerCase()
            const matchSearch = !q
                || g.name?.toLowerCase().includes(q)
                || g.admin?.fullName?.toLowerCase().includes(q)
                || g.description?.toLowerCase().includes(q)
            const matchSize = filterSize === 'ALL'
                || (filterSize === 'SMALL' && (g.memberCount ?? 0) <= 5)
                || (filterSize === 'MEDIUM' && (g.memberCount ?? 0) > 5 && (g.memberCount ?? 0) <= 20)
                || (filterSize === 'LARGE' && (g.memberCount ?? 0) > 20)
            return matchSearch && matchSize
        })
        .sort((a, b) => {
            let av = sortBy === 'memberCount' ? (a.memberCount ?? 0) : (a[sortBy] ?? '')
            let bv = sortBy === 'memberCount' ? (b.memberCount ?? 0) : (b[sortBy] ?? '')
            if (typeof av === 'string') av = av.toLowerCase()
            if (typeof bv === 'string') bv = bv.toLowerCase()
            if (av < bv) return sortDir === 'asc' ? -1 : 1
            if (av > bv) return sortDir === 'asc' ? 1 : -1
            return 0
        })

    const totalMembers = groups.reduce((acc, g) => acc + (g.memberCount ?? 0), 0)

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <ChevronDown size={12} style={{ opacity: 0.3 }} />
        return sortDir === 'asc'
            ? <ChevronUp size={12} style={{ color: '#f59e0b' }} />
            : <ChevronDown size={12} style={{ color: '#f59e0b' }} />
    }

    if (loading) return (
        <div style={g.center}>
            <div style={g.spinner} />
            <span style={g.loadingText}>Loading groups...</span>
        </div>
    )

    return (
        <div style={g.wrap}>
            {error && (
                <div style={g.errorBox}>
                    <ShieldAlert size={16} />{error}
                    <button style={g.errorClose} onClick={() => setError('')}><X size={14} /></button>
                </div>
            )}

            {/* Summary cards */}
            <div style={g.summaryRow}>
                <SummaryCard
                    icon={<Users size={16} />}
                    label="Total Groups"
                    value={groups.length}
                    color="#f59e0b"
                    bg="rgba(245,158,11,0.12)"
                    border="rgba(245,158,11,0.25)"
                />
                <SummaryCard
                    icon={<UserCheck size={16} />}
                    label="Total Members"
                    value={totalMembers}
                    color="#6366f1"
                    bg="rgba(99,102,241,0.12)"
                    border="rgba(99,102,241,0.25)"
                />
                <SummaryCard
                    icon={<Hash size={16} />}
                    label="Avg Size"
                    value={groups.length > 0 ? Math.round(totalMembers / groups.length) : 0}
                    color="#10b981"
                    bg="rgba(16,185,129,0.12)"
                    border="rgba(16,185,129,0.25)"
                />
                <SummaryCard
                    icon={<Crown size={16} />}
                    label="Shown"
                    value={filtered.length}
                    color="#ec4899"
                    bg="rgba(236,72,153,0.12)"
                    border="rgba(236,72,153,0.25)"
                />
            </div>

            {/* Toolbar */}
            <div style={g.toolbar}>
                <div style={g.searchWrap}>
                    <Search size={14} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                    <input
                        style={g.searchInput}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, admin or description..."
                    />
                    {search && (
                        <button style={g.clearBtn} onClick={() => setSearch('')}>
                            <X size={12} />
                        </button>
                    )}
                </div>

                <select
                    style={g.select}
                    value={filterSize}
                    onChange={e => setFilterSize(e.target.value)}
                >
                    <option value="ALL">All Sizes</option>
                    <option value="SMALL">Small (≤5)</option>
                    <option value="MEDIUM">Medium (6–20)</option>
                    <option value="LARGE">Large (20+)</option>
                </select>

                <div style={g.countBadge}>
                    {filtered.length} / {groups.length} groups
                </div>
            </div>

            {/* Table + Detail */}
            <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
                {/* Table */}
                <div style={g.tableWrap}>
                    <table style={g.table}>
                        <thead>
                            <tr>
                                {[
                                    { col: 'name', label: 'Group' },
                                    { col: null, label: 'Admin' },
                                    { col: 'memberCount', label: 'Members' },
                                    { col: 'description', label: 'Description' },
                                    { col: 'createdAt', label: 'Created' },
                                    { col: null, label: 'Actions' },
                                ].map(({ col, label }) => (
                                    <th
                                        key={label}
                                        style={{ ...g.th, cursor: col ? 'pointer' : 'default' }}
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
                                    <td colSpan={6} style={g.emptyCell}>
                                        <Users size={20} style={{ opacity: 0.3 }} />
                                        <span>No groups found</span>
                                    </td>
                                </tr>
                            ) : filtered.map(group => {
                                const isSelected = selectedGroup?.id === group.id
                                const size = group.memberCount ?? 0
                                const sizeColor = size > 20 ? '#f59e0b' : size > 5 ? '#6366f1' : '#10b981'

                                return (
                                    <tr
                                        key={group.id}
                                        style={{
                                            ...g.tr,
                                            background: isSelected
                                                ? 'rgba(245,158,11,0.06)'
                                                : 'transparent',
                                            borderLeft: isSelected
                                                ? '2px solid #f59e0b'
                                                : '2px solid transparent',
                                        }}
                                        onClick={() => setSelectedGroup(isSelected ? null : group)}
                                    >
                                        {/* Group */}
                                        <td style={g.td}>
                                            <div style={g.groupCell}>
                                                {group.avatarUrl ? (
                                                    <img src={group.avatarUrl} style={g.avatar} alt="" />
                                                ) : (
                                                    <div style={g.avatarPh}>
                                                        <Users size={16} color="#fff" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={g.groupName}>{group.name}</div>
                                                    <div style={g.groupId}>ID: {group.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Admin */}
                                        <td style={g.td}>
                                            <div style={g.adminCell}>
                                                <Crown size={12} color="#f59e0b" />
                                                <span style={g.adminName}>
                                                    {group.admin?.fullName || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Members */}
                                        <td style={g.td}>
                                            <span style={{
                                                ...g.membersBadge,
                                                color: sizeColor,
                                                background: `${sizeColor}18`,
                                                border: `1px solid ${sizeColor}30`,
                                            }}>
                                                <Users size={10} />
                                                {size}
                                            </span>
                                        </td>
                                        {/* Description */}
                                        <td style={g.td}>
                                            <span style={g.descText}>
                                                {group.description
                                                    ? group.description.length > 40
                                                        ? group.description.slice(0, 40) + '…'
                                                        : group.description
                                                    : <span style={{ opacity: 0.3 }}>No description</span>
                                                }
                                            </span>
                                        </td>
                                        {/* Created */}
                                        <td style={g.td}>
                                            <span style={g.dateText}>
                                                {group.createdAt
                                                    ? new Date(group.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                    : '—'}
                                            </span>
                                        </td>
                                        {/* Actions */}
                                        <td style={g.td} onClick={e => e.stopPropagation()}>
                                            <button
                                                style={g.deleteBtn}
                                                onClick={() => setConfirmDelete(group)}
                                                disabled={!!actionLoading}
                                                title="Delete Group"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Detail Panel */}
                {selectedGroup && (
                    <div style={g.detailPanel}>
                        <div style={g.detailHeader}>
                            <span style={g.detailTitle}>Group Details</span>
                            <button style={g.detailClose} onClick={() => setSelectedGroup(null)}>
                                <X size={14} />
                            </button>
                        </div>

                        {/* Avatar */}
                        <div style={g.detailAvatarWrap}>
                            {selectedGroup.avatarUrl ? (
                                <img src={selectedGroup.avatarUrl} style={g.detailAvatarImg} alt="" />
                            ) : (
                                <div style={g.detailAvatarPh}>
                                    <Users size={28} color="#fff" />
                                </div>
                            )}
                        </div>

                        <div style={g.detailName}>{selectedGroup.name}</div>
                        <div style={g.detailIdBadge}>ID: {selectedGroup.id}</div>

                        {/* Member count big */}
                        <div style={g.detailMemberCount}>
                            <span style={g.detailMemberNum}>{selectedGroup.memberCount ?? 0}</span>
                            <span style={g.detailMemberLabel}>members</span>
                        </div>

                        {/* Size bar */}
                        <div style={g.sizeBarWrap}>
                            <div style={g.sizeBarTrack}>
                                <div style={{
                                    ...g.sizeBarFill,
                                    width: `${Math.min(100, ((selectedGroup.memberCount ?? 0) / 50) * 100)}%`,
                                }} />
                            </div>
                            <span style={g.sizeLabel}>
                                {(selectedGroup.memberCount ?? 0) <= 5 ? 'Small group'
                                    : (selectedGroup.memberCount ?? 0) <= 20 ? 'Medium group'
                                        : 'Large group'}
                            </span>
                        </div>

                        <div style={g.detailFields}>
                            <DetailField
                                icon={<Crown size={13} />}
                                label="Admin"
                                value={selectedGroup.admin?.fullName || '—'}
                                valueColor="#f59e0b"
                            />
                            <DetailField
                                icon={<FileText size={13} />}
                                label="Description"
                                value={selectedGroup.description || 'No description'}
                            />
                            <DetailField
                                icon={<Calendar size={13} />}
                                label="Created"
                                value={selectedGroup.createdAt
                                    ? new Date(selectedGroup.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                    : '—'}
                            />
                        </div>

                        <button
                            style={g.detailDeleteBtn}
                            onClick={() => setConfirmDelete(selectedGroup)}
                            disabled={!!actionLoading}
                        >
                            <Trash2 size={14} />
                            Delete Group
                        </button>
                    </div>
                )}
            </div>

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div style={g.overlay}>
                    <div style={g.modal}>
                        <div style={g.modalIcon}>
                            <Trash2 size={22} color="#ef4444" />
                        </div>
                        <h3 style={g.modalTitle}>Delete Group?</h3>
                        <p style={g.modalBody}>
                            Are you sure you want to delete{' '}
                            <strong style={{ color: '#f1f1f8' }}>{confirmDelete.name}</strong>?
                            All messages and data will be permanently removed.
                        </p>
                        <div style={g.modalActions}>
                            <button style={g.modalCancel} onClick={() => setConfirmDelete(null)}>
                                Cancel
                            </button>
                            <button
                                style={g.modalDelete}
                                onClick={() => handleDelete(confirmDelete.id)}
                                disabled={!!actionLoading}
                            >
                                {actionLoading === confirmDelete.id + '_delete'
                                    ? <div style={g.miniSpinner} />
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

function SummaryCard({ icon, label, value, color, bg, border }) {
    return (
        <div style={{
            ...g.summaryCard,
            borderColor: border,
        }}>
            <div style={{ ...g.summaryIcon, background: bg, border: `1px solid ${border}`, color }}>
                {icon}
            </div>
            <div style={{ ...g.summaryValue, color }}>{value}</div>
            <div style={g.summaryLabel}>{label}</div>
        </div>
    )
}

function DetailField({ icon, label, value, valueColor }) {
    return (
        <div style={g.detailField}>
            <div style={g.detailFieldIcon}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={g.detailFieldLabel}>{label}</div>
                <div style={{ ...g.detailFieldValue, color: valueColor || 'rgba(255,255,255,0.75)' }}>
                    {value}
                </div>
            </div>
        </div>
    )
}

const g = {
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
        borderTop: '2px solid #f59e0b',
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
    summaryRow: {
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
    },
    summaryCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid',
        borderRadius: '14px', padding: '16px',
        display: 'flex', flexDirection: 'column', gap: '6px',
        animation: 'fadeUp 0.25s ease forwards',
    },
    summaryIcon: {
        width: '36px', height: '36px', borderRadius: '10px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '4px',
    },
    summaryValue: {
        fontSize: '28px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: 1,
    },
    summaryLabel: {
        fontSize: '11px', color: 'rgba(255,255,255,0.35)',
        fontWeight: '600', letterSpacing: '-0.01em',
    },
    toolbar: {
        display: 'flex', alignItems: 'center', gap: '12px',
    },
    searchWrap: {
        flex: 1,
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
        flex: 1,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px', overflow: 'auto',
    },
    table: {
        width: '100%', borderCollapse: 'collapse', fontSize: '13px',
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
        cursor: 'pointer', transition: 'background 0.1s',
    },
    td: { padding: '12px 16px', verticalAlign: 'middle' },
    emptyCell: {
        padding: '48px', textAlign: 'center',
        color: 'rgba(255,255,255,0.25)', fontSize: '13px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '8px',
    },
    groupCell: { display: 'flex', alignItems: 'center', gap: '10px' },
    avatar: { width: '36px', height: '36px', borderRadius: '11px', objectFit: 'cover', flexShrink: 0 },
    avatarPh: {
        width: '36px', height: '36px', borderRadius: '11px', flexShrink: 0,
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    groupName: { fontSize: '13px', fontWeight: '600', color: '#f1f1f8', letterSpacing: '-0.01em' },
    groupId: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '1px' },
    adminCell: { display: 'flex', alignItems: 'center', gap: '5px' },
    adminName: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
    membersBadge: {
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        borderRadius: '999px', padding: '3px 9px',
        fontSize: '11px', fontWeight: '700',
    },
    descText: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' },
    dateText: { fontSize: '11px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' },
    deleteBtn: {
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: '7px', padding: '6px',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        color: '#f87171', transition: 'opacity 0.15s',
    },
    // Detail panel
    detailPanel: {
        width: '260px', minWidth: '260px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '14px', padding: '20px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        animation: 'fadeUp 0.15s ease',
        overflowY: 'auto',
    },
    detailHeader: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%', marginBottom: '20px',
    },
    detailTitle: {
        fontSize: '12px', fontWeight: '700',
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
    },
    detailClose: {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '7px', padding: '5px', cursor: 'pointer',
        color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center',
    },
    detailAvatarWrap: { marginBottom: '14px' },
    detailAvatarImg: { width: '72px', height: '72px', borderRadius: '20px', objectFit: 'cover' },
    detailAvatarPh: {
        width: '72px', height: '72px', borderRadius: '20px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    detailName: {
        fontSize: '16px', fontWeight: '700', color: '#f1f1f8',
        letterSpacing: '-0.02em', textAlign: 'center',
    },
    detailIdBadge: {
        fontSize: '11px', color: 'rgba(255,255,255,0.3)',
        marginTop: '3px', marginBottom: '14px',
    },
    detailMemberCount: {
        display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '10px',
    },
    detailMemberNum: {
        fontSize: '36px', fontWeight: '800', color: '#f59e0b', letterSpacing: '-0.04em',
    },
    detailMemberLabel: {
        fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '500',
    },
    sizeBarWrap: { width: '100%', marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '6px' },
    sizeBarTrack: {
        height: '5px', background: 'rgba(255,255,255,0.07)',
        borderRadius: '999px', overflow: 'hidden', width: '100%',
    },
    sizeBarFill: {
        height: '100%', borderRadius: '999px',
        background: 'linear-gradient(90deg, #6366f1, #f59e0b)',
        transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
    },
    sizeLabel: {
        fontSize: '10px', color: 'rgba(255,255,255,0.3)',
        fontWeight: '600', textAlign: 'right', letterSpacing: '0.04em',
    },
    detailFields: {
        width: '100%', display: 'flex', flexDirection: 'column',
        gap: '2px', marginBottom: '16px',
    },
    detailField: {
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '9px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    detailFieldIcon: { color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: '1px' },
    detailFieldLabel: {
        fontSize: '10px', color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        fontWeight: '600', marginBottom: '2px',
    },
    detailFieldValue: { fontSize: '12px', fontWeight: '500', wordBreak: 'break-word' },
    detailDeleteBtn: {
        width: '100%', display: 'flex', alignItems: 'center',
        gap: '8px', justifyContent: 'center',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '10px', padding: '10px',
        fontSize: '12px', fontWeight: '600', color: '#f87171',
        cursor: 'pointer', fontFamily: 'inherit',
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
        display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    modalIcon: {
        width: '52px', height: '52px', borderRadius: '16px',
        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
    },
    modalTitle: {
        fontSize: '18px', fontWeight: '700', color: '#f1f1f8',
        letterSpacing: '-0.02em', marginBottom: '8px', textAlign: 'center',
    },
    modalBody: {
        fontSize: '13px', color: 'rgba(255,255,255,0.45)',
        lineHeight: '1.6', textAlign: 'center', marginBottom: '24px',
    },
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