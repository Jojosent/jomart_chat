import { useState } from 'react'
import { registerUser, verifyOtp, resendOtp } from '../api/auth'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, AtSign, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('register')
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await registerUser(form)
      setEmail(form.email)
      setStep('otp')
      startCountdown()
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const code = otp.join('')
    try {
      const res = await verifyOtp({ email, otp: code })
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await resendOtp(email)
      startCountdown()
    } catch {
      setError('Failed to resend code')
    }
  }

  const startCountdown = () => {
    setCountdown(60)
    const t = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(t); return 0 } return p - 1 })
    }, 1000)
  }

  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[idx] = val.slice(-1)
    setOtp(next)
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus()
    }
  }

  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(''))
      document.getElementById('otp-5')?.focus()
    }
  }

  return (
    <div style={s.page}>
      <div style={s.grid} />
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

        {step === 'register' ? (
          <>
            <div style={s.heading}>
              <h1 style={s.title}>Create account</h1>
              <p style={s.subtitle}>Join and start messaging instantly</p>
            </div>

            {error && (
              <div style={s.errorBox}>
                <div style={s.errorDot} />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} style={s.form}>
              {/* Full Name */}
              <div style={s.fieldGroup}>
                <label style={s.label}>Full name</label>
                <div style={s.inputWrap}>
                  <User size={15} color="var(--text-muted)" style={s.inputIcon} />
                  <input
                    style={s.input}
                    name="fullName"
                    placeholder="Jane Smith"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div style={s.fieldGroup}>
                <label style={s.label}>Username</label>
                <div style={s.inputWrap}>
                  <AtSign size={15} color="var(--text-muted)" style={s.inputIcon} />
                  <input
                    style={s.input}
                    name="username"
                    placeholder="jane_smith"
                    value={form.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

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
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowPass(!showPass)}>
                    {showPass
                      ? <EyeOff size={15} color="var(--text-muted)" />
                      : <Eye size={15} color="var(--text-muted)" />
                    }
                  </button>
                </div>
              </div>

              <button style={s.submitBtn} type="submit" disabled={loading}>
                {loading ? <span style={s.spinner} /> : <>Create account <ArrowRight size={16} /></>}
              </button>
            </form>

            <p style={s.switchText}>
              Already have an account?{' '}
              <span style={s.switchLink} onClick={() => navigate('/login')}>Sign in</span>
            </p>
          </>
        ) : (
          <>
            {/* OTP Step */}
            <div style={s.otpHeader}>
              <div style={s.shieldIcon}>
                <ShieldCheck size={22} color="var(--accent)" />
              </div>
              <h1 style={s.title}>Check your email</h1>
              <p style={s.subtitle}>
                We sent a 6-digit code to{' '}
                <span style={{ color: 'var(--text-accent)', fontWeight: '600' }}>{email}</span>
              </p>
            </div>

            {error && (
              <div style={s.errorBox}>
                <div style={s.errorDot} />
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} style={s.form}>
              <div style={s.otpRow} onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    style={{
                      ...s.otpBox,
                      borderColor: digit
                        ? 'var(--accent)'
                        : 'var(--border)',
                      background: digit
                        ? 'var(--accent-bg)'
                        : 'var(--bg-tertiary)',
                      color: digit ? 'var(--accent-light)' : 'var(--text-primary)',
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                    onKeyDown={(e) => handleOtpKey(e, i)}
                  />
                ))}
              </div>

              <button
                style={{
                  ...s.submitBtn,
                  opacity: otp.join('').length === 6 ? 1 : 0.5,
                }}
                type="submit"
                disabled={loading || otp.join('').length < 6}
              >
                {loading ? <span style={s.spinner} /> : <>Verify code <ArrowRight size={16} /></>}
              </button>
            </form>

            <div style={s.resendRow}>
              <button style={s.backBtn} onClick={() => { setStep('register'); setOtp(['', '', '', '', '', '']) }}>
                ← Change email
              </button>
              {countdown > 0 ? (
                <span style={s.countdown}>Resend in {countdown}s</span>
              ) : (
                <span style={s.switchLink} onClick={handleResend}>Resend code</span>
              )}
            </div>
          </>
        )}
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
    width: '500px', height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    top: '-100px', left: '-100px',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute',
    width: '400px', height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
    bottom: '-80px', right: '-80px',
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
    width: '34px', height: '34px',
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
  heading: { marginBottom: '24px' },
  otpHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },
  shieldIcon: {
    width: '44px', height: '44px',
    borderRadius: '12px',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-bg-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  title: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    letterSpacing: '-0.03em',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
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
    width: '6px', height: '6px',
    borderRadius: '50%',
    background: 'var(--error)',
    flexShrink: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
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
  },
  input: {
    width: '100%',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '11px 13px 11px 38px',
    color: 'var(--text-primary)',
    fontSize: '14px',
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
    boxShadow: 'var(--shadow-accent)',
    letterSpacing: '-0.01em',
  },
  spinner: {
    width: '18px', height: '18px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid #fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  // OTP
  otpRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  otpBox: {
    width: '48px', height: '54px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: '700',
    outline: 'none',
    transition: 'all 0.15s',
    fontFamily: "'JetBrains Mono', monospace",
    cursor: 'text',
    caretColor: 'var(--accent)',
  },
  resendRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '16px',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'inherit',
  },
  countdown: {
    fontSize: '13px',
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
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
  },
}