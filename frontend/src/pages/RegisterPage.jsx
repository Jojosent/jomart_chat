import { useState } from 'react'
import { registerUser, verifyOtp, resendOtp } from '../api/auth'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState('register') // 'register' | 'otp'
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '' })
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  // Шаг 1: Регистрация
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

  // Шаг 2: Верификация OTP
  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await verifyOtp({ email, otp })
      localStorage.setItem('accessToken', res.data.accessToken)
      localStorage.setItem('refreshToken', res.data.refreshToken)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/chat')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code')
    } finally {
      setLoading(false)
    }
  }

  // Повторная отправка OTP
  const handleResend = async () => {
    try {
      await resendOtp(email)
      startCountdown()
    } catch (err) {
      setError('Failed to resend OTP')
    }
  }

  const startCountdown = () => {
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>JoChat</div>
        <p style={styles.tagline}>Мессенджер нового поколения</p>

        {step === 'register' ? (
          <>
            <h2 style={styles.title}>Регистрация</h2>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={handleRegister} style={styles.form}>
              <input style={styles.input} name="fullName"
                placeholder="Полное имя" value={form.fullName}
                onChange={handleChange} required />
              <input style={styles.input} name="username"
                placeholder="Логин (например: zhomart_99)" value={form.username}
                onChange={handleChange} required />
              <input style={styles.input} name="email" type="email"
                placeholder="Email" value={form.email}
                onChange={handleChange} required />
              <input style={styles.input} name="password" type="password"
                placeholder="Пароль (мин. 6 символов)" value={form.password}
                onChange={handleChange} required />
              <button style={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Отправка...' : 'Зарегистрироваться'}
              </button>
            </form>
            <p style={styles.link}>
              Уже есть аккаунт?{' '}
              <span style={styles.linkText} onClick={() => navigate('/login')}>
                Войти
              </span>
            </p>
          </>
        ) : (
          <>
            <h2 style={styles.title}>Подтверждение</h2>
            <p style={styles.hint}>
              Код отправлен на <strong>{email}</strong>
            </p>
            {error && <div style={styles.error}>{error}</div>}
            <form onSubmit={handleVerify} style={styles.form}>
              <input style={{ ...styles.input, ...styles.otpInput }}
                placeholder="000000" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value)}
                required />
              <button style={styles.btn} type="submit" disabled={loading}>
                {loading ? 'Проверка...' : 'Подтвердить'}
              </button>
            </form>
            <p style={styles.link}>
              {countdown > 0
                ? <span style={{ color: '#666' }}>Отправить снова через {countdown}с</span>
                : <span style={styles.linkText} onClick={handleResend}>Отправить снова</span>
              }
            </p>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f0f1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid #2d2d4e',
    borderRadius: '20px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    textAlign: 'center',
  },
  logo: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#7c6af7',
    letterSpacing: '-1px',
    marginBottom: '4px',
  },
  tagline: { color: '#555', fontSize: '13px', marginBottom: '32px' },
  title: { color: '#fff', fontSize: '22px', marginBottom: '20px', fontWeight: '700' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    background: '#0f0f1a',
    border: '1px solid #2d2d4e',
    borderRadius: '10px',
    padding: '14px 16px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  otpInput: {
    fontSize: '28px',
    letterSpacing: '16px',
    textAlign: 'center',
    fontWeight: '700',
    color: '#7c6af7',
  },
  btn: {
    background: '#7c6af7',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: {
    background: '#2d1a1a',
    border: '1px solid #f87171',
    color: '#f87171',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  hint: { color: '#888', fontSize: '14px', marginBottom: '20px' },
  link: { marginTop: '20px', color: '#666', fontSize: '14px' },
  linkText: { color: '#7c6af7', cursor: 'pointer', fontWeight: '600' },
}