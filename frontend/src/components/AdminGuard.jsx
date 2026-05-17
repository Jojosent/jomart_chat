import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/auth'
import { ShieldAlert, Lock, Eye, EyeOff, ArrowRight, X } from 'lucide-react'

export default function AdminGuard({ children }) {
    const navigate = useNavigate()

    // Читаем напрямую из localStorage — там уже role: "ADMIN"
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null')

    const [verified, setVerified] = useState(false)
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [shake, setShake] = useState(false)

    // Debug — убери после проверки
    console.log('AdminGuard user:', currentUser)
    console.log('AdminGuard role:', currentUser?.role)

    // Не админ
    if (currentUser?.role !== 'ADMIN') {
        return (
            <div style={s.page}>
                <div style={s.grid} />
                <div style={s.orb} />
                <div style={s.card}>
                    <div style={{
                        ...s.iconRing,
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        animation: 'none',
                        marginBottom: 16,
                    }}>
                        <ShieldAlert size={28} color="#ef4444" />
                    </div>
                    <h2 style={s.title}>Access Denied</h2>
                    <p style={s.subtitle}>
                        You don't have administrator privileges.
                        <br />
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            Role: <b>{currentUser?.role ?? 'not set'}</b>
                        </span>
                    </p>
                    <button style={s.backBtn} onClick={() => navigate('/chat')}>
                        ← Back to chats
                    </button>
                </div>
            </div>
        )
    }

    // Уже подтвердил пароль
    if (verified) return children

    const handleVerify = async (e) => {
        e.preventDefault()
        if (!password.trim()) return
        setLoading(true)
        setError('')
        try {
            await loginUser({ email: currentUser.email, password })
            setVerified(true)
        } catch {
            setError('Incorrect password. Try again.')
            setShake(true)
            setTimeout(() => setShake(false), 500)
            setPassword('')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={s.page}>
            <div style={s.grid} />
            <div style={s.orb} />

            <div style={{
                ...s.card,
                animation: shake ? 'shake 0.4s ease' : 'fadeUp 0.3s ease',
            }}>
                <div style={s.cardHeader}>
                    <button style={s.closeBtn} onClick={() => navigate('/chat')}>
                        <X size={16} />
                    </button>
                </div>

                <div style={s.iconRing}>
                    <ShieldAlert size={26} color="var(--accent)" />
                </div>

                <h2 style={s.title}>Admin Verification</h2>
                <p style={s.subtitle}>
                    Enter your password to access the admin panel
                </p>

                <div style={s.emailBadge}>
                    <div style={s.emailDot} />
                    <span style={s.emailText}>{currentUser?.email}</span>
                </div>

                {error && (
                    <div style={s.errorBox}>
                        <div style={s.errorDot} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleVerify} style={s.form}>
                    <div style={s.fieldGroup}>
                        <label style={s.label}>Password</label>
                        <div style={s.inputWrap}>
                            <Lock size={14} color="var(--text-muted)" style={s.inputIcon} />
                            <input
                                style={s.input}
                                type={showPass ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                                required
                            />
                            <button
                                type="button"
                                style={s.eyeBtn}
                                onClick={() => setShowPass(p => !p)}
                            >
                                {showPass
                                    ? <EyeOff size={14} color="var(--text-muted)" />
                                    : <Eye size={14} color="var(--text-muted)" />
                                }
                            </button>
                        </div>
                    </div>

                    <button
                        style={{
                            ...s.submitBtn,
                            opacity: password.trim() && !loading ? 1 : 0.45,
                        }}
                        type="submit"
                        disabled={!password.trim() || loading}
                    >
                        {loading ? (
                            <span style={s.btnSpinner} />
                        ) : (
                            <>
                                <ShieldAlert size={15} />
                                Confirm & Enter
                                <ArrowRight size={15} />
                            </>
                        )}
                    </button>
                </form>

                <button style={s.cancelLink} onClick={() => navigate('/chat')}>
                    Cancel — go back
                </button>
            </div>

            <style>{`
                @keyframes shake {
                    0%,100% { transform: translateX(0); }
                    20%     { transform: translateX(-10px); }
                    40%     { transform: translateX(10px); }
                    60%     { transform: translateX(-8px); }
                    80%     { transform: translateX(8px); }
                }
                @keyframes fadeUp {
                    from { opacity:0; transform:translateY(16px); }
                    to   { opacity:1; transform:translateY(0); }
                }
                @keyframes pulse-ring {
                    0%  { box-shadow: 0 0 0 0   rgba(99,102,241,0.35); }
                    70% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
                    100%{ box-shadow: 0 0 0 0   rgba(99,102,241,0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

const s = {
    page: {
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
    },
    grid: {
        position: 'absolute', inset: 0,
        backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 100%)',
        pointerEvents: 'none',
    },
    orb: {
        position: 'absolute',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
    },
    card: {
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: '400px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '20px', padding: '32px 32px 28px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
    },
    cardHeader: {
        width: '100%', display: 'flex',
        justifyContent: 'flex-end', marginBottom: '16px',
    },
    closeBtn: {
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '6px', cursor: 'pointer',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
    },
    iconRing: {
        width: '60px', height: '60px', borderRadius: '18px',
        background: 'var(--accent-bg)', border: '1px solid var(--accent-bg-hover)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px', animation: 'pulse-ring 2s infinite',
    },
    title: {
        fontSize: '20px', fontWeight: '700',
        color: 'var(--text-primary)', letterSpacing: '-0.03em',
        marginBottom: '6px', textAlign: 'center',
    },
    subtitle: {
        fontSize: '13px', color: 'var(--text-muted)',
        textAlign: 'center', lineHeight: '1.6', marginBottom: '20px',
    },
    emailBadge: {
        display: 'flex', alignItems: 'center', gap: '7px',
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: '999px', padding: '5px 14px', marginBottom: '20px',
    },
    emailDot: {
        width: '7px', height: '7px', borderRadius: '50%',
        background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)', flexShrink: 0,
    },
    emailText: {
        fontSize: '13px', fontWeight: '600',
        color: 'var(--text-secondary)', letterSpacing: '-0.01em',
    },
    errorBox: {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--error-bg)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '10px', padding: '10px 14px',
        fontSize: '13px', color: 'var(--error)', fontWeight: '500',
        width: '100%', marginBottom: '12px',
    },
    errorDot: {
        width: '6px', height: '6px', borderRadius: '50%',
        background: 'var(--error)', flexShrink: 0,
    },
    form: {
        display: 'flex', flexDirection: 'column', gap: '14px', width: '100%',
    },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '7px' },
    label: {
        fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
    },
    inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
    inputIcon: { position: 'absolute', left: '13px', pointerEvents: 'none', flexShrink: 0 },
    input: {
        width: '100%', background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)', borderRadius: '10px',
        padding: '11px 40px 11px 36px', color: 'var(--text-primary)',
        fontSize: '14px', outline: 'none', fontFamily: 'inherit',
        transition: 'border-color 0.15s, box-shadow 0.15s',
    },
    eyeBtn: {
        position: 'absolute', right: '12px', background: 'transparent',
        border: 'none', padding: '4px', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
    },
    submitBtn: {
        background: 'var(--accent)', border: 'none', borderRadius: '10px',
        padding: '13px', color: '#fff', fontSize: '14px', fontWeight: '600',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '8px', boxShadow: 'var(--shadow-accent)',
        fontFamily: 'inherit', transition: 'opacity 0.15s', letterSpacing: '-0.01em',
    },
    btnSpinner: {
        width: '18px', height: '18px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTop: '2px solid #fff', borderRadius: '50%',
        display: 'inline-block', animation: 'spin 0.7s linear infinite',
    },
    cancelLink: {
        marginTop: '16px', background: 'transparent', border: 'none',
        color: 'var(--text-muted)', fontSize: '13px',
        cursor: 'pointer', fontFamily: 'inherit',
    },
    backBtn: {
        marginTop: '16px', background: 'var(--bg-elevated)',
        border: '1px solid var(--border)', borderRadius: '10px',
        padding: '10px 20px', color: 'var(--text-secondary)',
        fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
    },
}