import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/auth'
import useAuthStore from '../store/authStore'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { LangSwitcher } from '../components/LangSwitcher'

export default function LoginPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((s) => s.setAuth)

    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPass, setShowPass] = useState(false)

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await loginUser(form)
            setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
            navigate('/chat')
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={s.page}>
            {/* Background grid */}
            <div style={s.grid} />
            {/* Glow orbs */}
            <div style={s.orb1} />
            <div style={s.orb2} />

            <div style={s.card}>
                {/* Logo */}
                <div style={s.logoRow}>
                    <div style={s.logoMark}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                fill="#6366f1" />
                        </svg>
                    </div>
                    <span style={s.logoText}>JoChat</span>
                </div>

                <div style={s.heading}>
                    <h1 style={s.title}>Welcome back</h1>
                    <p style={s.subtitle}>Sign in to continue your conversations</p>
                </div>

                {error && (
                    <div style={s.errorBox}>
                        <div style={s.errorDot} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={s.form}>
                    {/* Email */}
                    <div style={s.fieldGroup}>
                        <label style={s.label}>Email address</label>
                        <div style={s.inputWrap}>
                            <Mail size={15} color="var(--text-muted)" style={s.inputIcon} />
                            <input
                                style={s.input}
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div style={s.fieldGroup}>
                        <label style={s.label}>Password</label>
                        <div style={s.inputWrap}>
                            <Lock size={15} color="var(--text-muted)" style={s.inputIcon} />
                            <input
                                style={{ ...s.input, paddingRight: '44px' }}
                                name="password"
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••••"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                            <button
                                type="button"
                                style={s.eyeBtn}
                                onClick={() => setShowPass(!showPass)}
                            >
                                {showPass
                                    ? <EyeOff size={15} color="var(--text-muted)" />
                                    : <Eye size={15} color="var(--text-muted)" />
                                }
                            </button>
                        </div>
                    </div>

                    <button style={s.submitBtn} type="submit" disabled={loading}>
                        {loading ? (
                            <span style={s.spinner} />
                        ) : (
                            <>
                                Sign in
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </form>

                <p style={s.switchText}>
                    Don't have an account?{' '}
                    <span style={s.switchLink} onClick={() => navigate('/register')}>
                        Create one
                    </span>
                </p>
            </div>
        </div>
    )
}

const s = {
    page: {
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    grid: {
        position: 'absolute',
        inset: 0,
        backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        pointerEvents: 'none',
    },
    orb1: {
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        top: '-100px',
        left: '-100px',
        pointerEvents: 'none',
    },
    orb2: {
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        bottom: '-80px',
        right: '-80px',
        pointerEvents: 'none',
    },
    card: {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '36px 32px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        animation: 'fadeUp 0.3s ease forwards',
    },
    logoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '28px',
    },
    logoMark: {
        width: '34px',
        height: '34px',
        borderRadius: '10px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-bg-hover)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoText: {
        fontSize: '17px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        letterSpacing: '-0.03em',
    },
    heading: {
        marginBottom: '24px',
    },
    title: {
        fontSize: '22px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        letterSpacing: '-0.03em',
        marginBottom: '6px',
    },
    subtitle: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        fontWeight: '400',
    },
    errorBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: 'var(--error-bg)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: '10px',
        padding: '11px 14px',
        fontSize: '13px',
        color: 'var(--error)',
        marginBottom: '16px',
        fontWeight: '500',
    },
    errorDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: 'var(--error)',
        flexShrink: 0,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
    },
    label: {
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    inputWrap: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    inputIcon: {
        position: 'absolute',
        left: '13px',
        pointerEvents: 'none',
        flexShrink: 0,
    },
    input: {
        width: '100%',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '11px 13px 11px 38px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontWeight: '400',
        outline: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        fontFamily: 'inherit',
    },
    eyeBtn: {
        position: 'absolute',
        right: '12px',
        background: 'transparent',
        border: 'none',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
    },
    submitBtn: {
        marginTop: '4px',
        background: 'var(--accent)',
        border: 'none',
        borderRadius: '10px',
        padding: '13px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'opacity 0.15s, transform 0.15s',
        letterSpacing: '-0.01em',
        boxShadow: 'var(--shadow-accent)',
    },
    spinner: {
        width: '18px',
        height: '18px',
        border: '2px solid rgba(255,255,255,0.3)',
        borderTop: '2px solid #fff',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.7s linear infinite',
    },
    switchText: {
        marginTop: '20px',
        textAlign: 'center',
        fontSize: '13px',
        color: 'var(--text-muted)',
    },
    switchLink: {
        color: 'var(--accent-light)',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'color 0.15s',
    },
}