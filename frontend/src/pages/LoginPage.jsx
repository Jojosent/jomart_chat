import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api/auth'
import useAuthStore from '../store/authStore'

export default function LoginPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((s) => s.setAuth)

    const [form, setForm] = useState({ email: '', password: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

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
            setError(err.response?.data?.message || 'Login failed. Check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.logo}>JoChat</div>
                <p style={styles.tagline}>Мессенджер нового поколения</p>

                <h2 style={styles.title}>Вход</h2>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleLogin} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            style={styles.input}
                            name="email"
                            type="email"
                            placeholder="your@email.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Пароль</label>
                        <input
                            style={styles.input}
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button style={styles.btn} type="submit" disabled={loading}>
                        {loading
                            ? <span style={styles.spinner}>⟳ Вход...</span>
                            : 'Войти'}
                    </button>
                </form>

                <p style={styles.link}>
                    Нет аккаунта?{' '}
                    <span style={styles.linkText} onClick={() => navigate('/register')}>
                        Зарегистрироваться
                    </span>
                </p>
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
    title: { color: '#fff', fontSize: '22px', marginBottom: '24px', fontWeight: '700' },
    form: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { color: '#888', fontSize: '13px', fontWeight: '500' },
    input: {
        background: '#0f0f1a',
        border: '1px solid #2d2d4e',
        borderRadius: '10px',
        padding: '14px 16px',
        color: '#fff',
        fontSize: '15px',
        outline: 'none',
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
        marginBottom: '4px',
        textAlign: 'left',
    },
    spinner: { display: 'inline-block' },
    link: { marginTop: '24px', color: '#666', fontSize: '14px' },
    linkText: { color: '#7c6af7', cursor: 'pointer', fontWeight: '600' },
}