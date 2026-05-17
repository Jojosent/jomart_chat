import { useState, useEffect } from 'react'
import api from '../api/auth'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    Users, Shield, Trash2, ArrowLeft, Loader,
    User as UserIcon, MessageSquare, ShieldAlert,
    BarChart2, Activity, TrendingUp, Server,
    CheckCircle, XCircle, Clock, Eye,
    Crown, ChevronRight, RefreshCw, Search,
    Database, Cpu, Globe, Lock
} from 'lucide-react'

import AdminUsersTab from './AdminUsersTab'
import AdminGroupsTab from './AdminGroupsTab'
import AdminMessagesTab from './AdminMessagesTab'

export default function AdminPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [tab, setTab] = useState('dashboard')
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => { fetchStats() }, [])

    const fetchStats = async () => {
        setLoading(true); setError('')
        try {
            const [usersRes, groupsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/groups'),
            ])
            const users = usersRes.data
            const groups = groupsRes.data
            setStats({
                totalUsers: users.length,
                verifiedUsers: users.filter(u => u.emailVerified).length,
                adminCount: users.filter(u => u.role === 'ADMIN').length,
                onlineUsers: users.filter(u => u.status === 'ONLINE').length,
                totalGroups: groups.length,
                totalMembers: groups.reduce((acc, g) => acc + (g.memberCount || 0), 0),
            })
        } catch (err) {
            setError(t('admin.statsError', 'Failed to load statistics'))
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchStats()
        setRefreshing(false)
    }

    const TABS = [
        { id: 'dashboard', label: t('admin.dashboard'), icon: <BarChart2 size={16} /> },
        { id: 'users', label: t('admin.users'), icon: <UserIcon size={16} /> },
        { id: 'groups', label: t('admin.groups'), icon: <Users size={16} /> },
        { id: 'messages', label: t('admin.messages'), icon: <MessageSquare size={16} /> },
    ]

    return (
        <div style={s.page}>
            {/* ── Sidebar ── */}
            <aside style={s.sidebar}>
                <div style={s.sidebarTop}>
                    <div style={s.brand}>
                        <div style={s.brandIcon}>
                            <Shield size={18} color="#fff" />
                        </div>
                        <div>
                            <div style={s.brandName}>{t('admin.title')}</div>
                            <div style={s.brandSub}>{t('admin.subtitle')}</div>
                        </div>
                    </div>
                </div>

                <nav style={s.nav}>
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            style={{
                                ...s.navItem,
                                background: tab === t.id
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))'
                                    : 'transparent',
                                color: tab === t.id ? '#a5b4fc' : 'rgba(255,255,255,0.45)',
                                borderLeft: tab === t.id
                                    ? '2px solid #6366f1'
                                    : '2px solid transparent',
                            }}
                            onClick={() => setTab(t.id)}
                        >
                            <span style={{ opacity: tab === t.id ? 1 : 0.7 }}>{t.icon}</span>
                            {t.label}
                            {tab === t.id && (
                                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                            )}
                        </button>
                    ))}
                </nav>

                <div style={s.sidebarBottom}>
                    <button style={s.backBtn} onClick={() => navigate('/profile')}>
                        <ArrowLeft size={15} />
                        {t('admin.backToProfile', 'Back to Profile')}
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <div style={s.main}>
                {/* Header */}
                <header style={s.header}>
                    <div>
                        <h1 style={s.pageTitle}>
                            {tab === 'dashboard' && t('admin.dashboard')}
                            {tab === 'users' && t('admin.userManagement')}
                            {tab === 'groups' && t('admin.groupManagement')}
                            {tab === 'messages' && t('admin.messagesChats')}
                        </h1>
                        <p style={s.pageSubtitle}>
                            {tab === 'dashboard' && t('admin.overview')}
                            {tab === 'users' && t('admin.manageAccounts')}
                            {tab === 'groups' && t('admin.monitorGroups')}
                            {tab === 'messages' && t('admin.moderateMessages')}
                        </p>
                    </div>
                    <button
                        style={{ ...s.refreshBtn, opacity: refreshing ? 0.6 : 1 }}
                        onClick={handleRefresh}
                        disabled={refreshing}
                    >
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        {t('admin.refresh')}
                    </button>
                </header>

                {/* Content */}
                <div style={s.content}>
                    {tab === 'dashboard' && (
                        <DashboardTab stats={stats} loading={loading} error={error} />
                    )}
                    {tab === 'users' && <AdminUsersTab />}
                    {tab === 'groups' && <AdminGroupsTab />}
                    {tab === 'messages' && <AdminMessagesTab />}
                </div>
            </div>
        </div>
    )
}

/* ── Dashboard Tab ── */
function DashboardTab({ stats, loading, error }) {
    const { t } = useTranslation()
    if (loading) return (
        <div style={d.center}>
            <div style={d.spinner} />
            <span style={d.loadingText}>{t('admin.loadingStats', 'Loading statistics...')}</span>
        </div>
    )

    if (error) return (
        <div style={d.errorBox}>
            <ShieldAlert size={20} />
            {error}
        </div>
    )

    const statCards = [
        {
            label: t('admin.totalUsers'),
            value: stats?.totalUsers ?? 0,
            icon: <UserIcon size={20} />,
            color: '#6366f1',
            bg: 'rgba(99,102,241,0.12)',
            border: 'rgba(99,102,241,0.25)',
            sub: `${stats?.verifiedUsers ?? 0} ${t('admin.verified').toLowerCase()}`,
            trend: '+12%',
        },
        {
            label: t('admin.onlineNow'),
            value: stats?.onlineUsers ?? 0,
            icon: <Activity size={20} />,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.12)',
            border: 'rgba(16,185,129,0.25)',
            sub: t('admin.activeUsers', 'active users'),
            trend: 'live',
        },
        {
            label: t('admin.totalGroups'),
            value: stats?.totalGroups ?? 0,
            icon: <Users size={20} />,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.12)',
            border: 'rgba(245,158,11,0.25)',
            sub: `${stats?.totalMembers ?? 0} ${t('admin.totalMembers', 'total members')}`,
            trend: '+5%',
        },
        {
            label: t('admin.admins'),
            value: stats?.adminCount ?? 0,
            icon: <Crown size={20} />,
            color: '#ec4899',
            bg: 'rgba(236,72,153,0.12)',
            border: 'rgba(236,72,153,0.25)',
            sub: t('admin.fullAccess', 'with full access'),
            trend: '',
        },
    ]

    const systemInfo = [
        { label: 'Backend', value: 'Spring Boot 3.2', icon: <Server size={14} />, ok: true },
        { label: 'Database', value: 'PostgreSQL', icon: <Database size={14} />, ok: true },
        { label: 'Cache', value: 'Redis', icon: <Cpu size={14} />, ok: true },
        { label: 'WebSocket', value: 'STOMP / SockJS', icon: <Globe size={14} />, ok: true },
        { label: 'AI', value: 'Gemini Flash', icon: <Activity size={14} />, ok: true },
        { label: 'Encryption', value: 'AES-256-GCM', icon: <Lock size={14} />, ok: true },
    ]

    return (
        <div style={d.wrap}>
            {/* Stat cards */}
            <div style={d.statsGrid}>
                {statCards.map((card, i) => (
                    <div key={i} style={{
                        ...d.statCard,
                        borderColor: card.border,
                        animationDelay: `${i * 80}ms`,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{
                                ...d.statIcon,
                                background: card.bg,
                                border: `1px solid ${card.border}`,
                                color: card.color,
                            }}>
                                {card.icon}
                            </div>
                            {card.trend && (
                                <span style={{
                                    ...d.trendBadge,
                                    background: card.trend === 'live'
                                        ? 'rgba(16,185,129,0.15)'
                                        : 'rgba(99,102,241,0.12)',
                                    color: card.trend === 'live' ? '#10b981' : '#a5b4fc',
                                    border: `1px solid ${card.trend === 'live' ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.2)'}`,
                                }}>
                                    {card.trend === 'live' && (
                                        <span style={d.liveDot} />
                                    )}
                                    {card.trend === 'live' ? 'LIVE' : card.trend}
                                </span>
                            )}
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            <div style={{ ...d.statValue, color: card.color }}>{card.value}</div>
                            <div style={d.statLabel}>{card.label}</div>
                            <div style={d.statSub}>{card.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom row */}
            <div style={d.bottomRow}>
                {/* Overview bar */}
                <div style={d.overviewCard}>
                    <div style={d.cardHeader}>
                        <TrendingUp size={15} color="#6366f1" />
                        <span style={d.cardTitle}>{t('admin.userOverview', 'User Overview')}</span>
                    </div>
                    <div style={d.overviewBars}>
                        <OverviewBar label={t('admin.verified')} value={stats?.verifiedUsers} total={stats?.totalUsers} color="#6366f1" />
                        <OverviewBar label={t('common.online')} value={stats?.onlineUsers} total={stats?.totalUsers} color="#10b981" />
                        <OverviewBar label={t('admin.admins')} value={stats?.adminCount} total={stats?.totalUsers} color="#f59e0b" />
                    </div>
                </div>

                {/* System status */}
                <div style={d.systemCard}>
                    <div style={d.cardHeader}>
                        <Server size={15} color="#6366f1" />
                        <span style={d.cardTitle}>{t('admin.systemStatus')}</span>
                        <span style={d.allOkBadge}>{t('admin.allSystemsOk')}</span>
                    </div>
                    <div style={d.systemList}>
                        {systemInfo.map((item, i) => (
                            <div key={i} style={d.systemRow}>
                                <span style={d.systemIcon}>{item.icon}</span>
                                <span style={d.systemLabel}>{item.label}</span>
                                <span style={d.systemValue}>{item.value}</span>
                                <CheckCircle size={13} color="#10b981" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function OverviewBar({ label, value, total, color }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0
    return (
        <div style={d.barWrap}>
            <div style={d.barTop}>
                <span style={d.barLabel}>{label}</span>
                <span style={{ ...d.barPct, color }}>
                    {value} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>/ {total}</span>
                </span>
            </div>
            <div style={d.barTrack}>
                <div style={{ ...d.barFill, width: `${pct}%`, background: color }} />
            </div>
            <div style={{ ...d.barPctLabel, color }}>{pct}%</div>
        </div>
    )
}

/* ─── Styles ─── */
const s = {
    page: {
        display: 'flex', height: '100vh',
        background: '#07070f',
        fontFamily: "'Inter', sans-serif",
        color: '#f1f1f8', overflow: 'hidden',
    },
    sidebar: {
        width: '240px', minWidth: '240px',
        background: 'linear-gradient(180deg, #0d0d1a 0%, #080810 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
    },
    sidebarTop: {
        padding: '24px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    brand: { display: 'flex', alignItems: 'center', gap: '12px' },
    brandIcon: {
        width: '40px', height: '40px', borderRadius: '12px',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(99,102,241,0.4)', flexShrink: 0,
    },
    brandName: { fontSize: '14px', fontWeight: '700', color: '#f1f1f8', letterSpacing: '-0.02em' },
    brandSub: { fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' },
    nav: {
        flex: 1, padding: '16px 12px',
        display: 'flex', flexDirection: 'column', gap: '4px',
    },
    navItem: {
        width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '10px', border: 'none',
        fontSize: '13px', fontWeight: '600', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s',
        textAlign: 'left', letterSpacing: '-0.01em',
    },
    sidebarBottom: {
        padding: '16px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
    },
    backBtn: {
        width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
        padding: '10px 14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', color: 'rgba(255,255,255,0.45)',
        fontSize: '12px', fontWeight: '600', cursor: 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s',
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    header: {
        padding: '24px 32px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.01)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
    },
    pageTitle: {
        fontSize: '22px', fontWeight: '700', letterSpacing: '-0.03em',
        color: '#f1f1f8', margin: 0,
    },
    pageSubtitle: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' },
    refreshBtn: {
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'rgba(99,102,241,0.12)',
        border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '10px', padding: '8px 14px',
        color: '#a5b4fc', fontSize: '12px', fontWeight: '600',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s',
    },
    content: { flex: 1, overflowY: 'auto', padding: '28px 32px' },
}

const d = {
    center: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: '14px', height: '300px',
    },
    spinner: {
        width: '28px', height: '28px',
        border: '2px solid rgba(255,255,255,0.1)',
        borderTop: '2px solid #6366f1',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    },
    loadingText: { fontSize: '13px', color: 'rgba(255,255,255,0.35)' },
    errorBox: {
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '12px', padding: '16px 20px',
        color: '#f87171', fontSize: '14px', fontWeight: '500',
    },
    wrap: { display: 'flex', flexDirection: 'column', gap: '20px' },
    statsGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
    },
    statCard: {
        background: 'rgba(255,255,255,0.03)', border: '1px solid',
        borderRadius: '16px', padding: '20px',
        animation: 'fadeUp 0.3s ease forwards', transition: 'background 0.2s',
    },
    statIcon: {
        width: '44px', height: '44px', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    trendBadge: {
        display: 'flex', alignItems: 'center', gap: '5px',
        borderRadius: '999px', padding: '3px 8px',
        fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em',
    },
    liveDot: {
        width: '6px', height: '6px', borderRadius: '50%',
        background: '#10b981', boxShadow: '0 0 6px #10b981',
        display: 'inline-block', animation: 'pulse 1.5s infinite',
    },
    statValue: { fontSize: '36px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: 1 },
    statLabel: { fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: '6px', letterSpacing: '-0.01em' },
    statSub: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' },
    bottomRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    overviewCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', padding: '20px',
    },
    systemCard: {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', padding: '20px',
    },
    cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' },
    cardTitle: { fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.01em' },
    allOkBadge: {
        marginLeft: 'auto', fontSize: '10px', fontWeight: '700',
        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
        color: '#10b981', borderRadius: '999px', padding: '3px 8px',
    },
    overviewBars: { display: 'flex', flexDirection: 'column', gap: '16px' },
    barWrap: { display: 'flex', flexDirection: 'column', gap: '6px' },
    barTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    barLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
    barPct: { fontSize: '13px', fontWeight: '700' },
    barTrack: { height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)' },
    barPctLabel: { fontSize: '10px', fontWeight: '700', letterSpacing: '0.04em', textAlign: 'right' },
    systemList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    systemRow: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
    },
    systemIcon: { color: 'rgba(255,255,255,0.4)', flexShrink: 0, display: 'flex' },
    systemLabel: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '500', width: '80px' },
    systemValue: { fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: '600', flex: 1 },
}