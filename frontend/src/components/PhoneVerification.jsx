import { useState } from 'react'
import { sendPhoneOtp, verifyPhoneOtp } from '../api/phone'
import useAuthStore from '../store/authStore'
import { useTranslation } from 'react-i18next'

export default function PhoneVerification({ currentPhone, isVerified, onUpdate }) {
    const { t } = useTranslation()
    const updateUser = useAuthStore((s) => s.updateUser)

    const [step, setStep] = useState('input')  // 'input' | 'otp'
    const [phone, setPhone] = useState(currentPhone || '')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [countdown, setCountdown] = useState(0)

    // Шаг 1 — отправить OTP
    const handleSendOtp = async () => {
        if (!phone.trim()) { setError(t('profile.phoneError', 'Enter phone number')); return }
        setLoading(true); setError('')
        try {
            await sendPhoneOtp(phone)
            setStep('otp')
            startCountdown()
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'))
        } finally {
            setLoading(false)
        }
    }

    // Шаг 2 — подтвердить OTP
    const handleVerify = async () => {
        if (!otp.trim()) { setError(t('auth.otpError', 'Enter OTP code')); return }
        setLoading(true); setError('')
        try {
            const res = await verifyPhoneOtp(phone, otp)
            updateUser(res.data)
            setSuccess(t('profile.phoneVerifiedSuccess', 'Phone verified successfully!'))
            setStep('input')
            if (onUpdate) onUpdate(res.data)
        } catch (err) {
            setError(err.response?.data?.message || t('auth.invalidOtp', 'Invalid OTP code'))
        } finally {
            setLoading(false)
        }
    }

    // Повторная отправка
    const handleResend = async () => {
        setLoading(true); setError('')
        try {
            await sendPhoneOtp(phone)
            startCountdown()
            setSuccess(t('auth.otpResent', 'OTP resent!'))
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || t('common.error'))
        } finally {
            setLoading(false)
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

    // Если уже верифицирован
    if (isVerified) {
        return (
            <div style={styles.verifiedBox}>
                <span style={styles.verifiedIcon}>✓</span>
                <div>
                    <div style={styles.verifiedTitle}>{t('profile.phoneVerified')}</div>
                    <div style={styles.verifiedPhone}>{currentPhone}</div>
                </div>
                <button style={styles.changeBtn} onClick={() => {
                    // сбрасываем чтобы поменять номер
                    setStep('input')
                }}>
                    {t('profile.edit')}
                </button>
            </div>
        )
    }

    return (
        <div style={styles.container}>
            <div style={styles.title}>📱 {t('profile.phoneVerified')}</div>

            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}

            {step === 'input' ? (
                <div style={styles.row}>
                    <input
                        style={styles.input}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={t('profile.phonePlaceholder')}
                        type="tel"
                    />
                    <button
                        style={styles.btn}
                        onClick={handleSendOtp}
                        disabled={loading}
                    >
                        {loading ? '...' : t('auth.otpResend')}
                    </button>
                </div>
            ) : (
                <div style={styles.otpSection}>
                    <p style={styles.hint}>
                        {t('auth.otpSent')} <strong style={{ color: '#7c6af7' }}>{phone}</strong>
                    </p>
                    <div style={styles.row}>
                        <input
                            style={{ ...styles.input, ...styles.otpInput }}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder={t('auth.otpPlaceholder')}
                            maxLength={6}
                            type="text"
                        />
                        <button
                            style={styles.btn}
                            onClick={handleVerify}
                            disabled={loading}
                        >
                            {loading ? '...' : t('auth.otpConfirm')}
                        </button>
                    </div>

                    <div style={styles.resendRow}>
                        <button
                            style={styles.backBtn}
                            onClick={() => { setStep('input'); setOtp(''); setError('') }}
                        >
                            ← {t('auth.changeEmail')}
                        </button>
                        {countdown > 0 ? (
                            <span style={styles.countdownText}>
                                {t('auth.otpResendIn')} {countdown}с
                            </span>
                        ) : (
                            <button style={styles.resendBtn} onClick={handleResend}>
                                {t('auth.otpResend')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

const styles = {
    container: {
        background: '#12122a',
        border: '1px solid #2d2d4e',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    title: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#a78bfa',
    },
    row: {
        display: 'flex',
        gap: '8px',
    },
    input: {
        flex: 1,
        background: '#0f0f1a',
        border: '1px solid #3d3d6e',
        borderRadius: '8px',
        padding: '10px 14px',
        color: '#fff',
        fontSize: '15px',
        outline: 'none',
    },
    otpInput: {
        fontSize: '22px',
        letterSpacing: '8px',
        textAlign: 'center',
        fontWeight: '700',
        color: '#7c6af7',
    },
    btn: {
        background: '#7c6af7',
        border: 'none',
        color: '#fff',
        borderRadius: '8px',
        padding: '10px 16px',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    otpSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    hint: {
        color: '#888',
        fontSize: '13px',
        margin: 0,
    },
    resendRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backBtn: {
        background: 'transparent',
        border: 'none',
        color: '#888',
        fontSize: '13px',
        cursor: 'pointer',
        padding: 0,
    },
    resendBtn: {
        background: 'transparent',
        border: 'none',
        color: '#7c6af7',
        fontSize: '13px',
        cursor: 'pointer',
        fontWeight: '600',
        padding: 0,
    },
    countdownText: {
        color: '#555',
        fontSize: '13px',
    },
    error: {
        background: '#2d1a1a',
        border: '1px solid #f87171',
        color: '#f87171',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '13px',
    },
    success: {
        background: '#1a2e1a',
        border: '1px solid #4ade80',
        color: '#4ade80',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '13px',
    },
    verifiedBox: {
        background: '#1a2e1a',
        border: '1px solid #4ade80',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    verifiedIcon: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#4ade80',
        color: '#0f1a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '900',
        fontSize: '16px',
        flexShrink: 0,
    },
    verifiedTitle: {
        color: '#4ade80',
        fontWeight: '700',
        fontSize: '14px',
    },
    verifiedPhone: {
        color: '#888',
        fontSize: '13px',
        marginTop: '2px',
    },
    changeBtn: {
        marginLeft: 'auto',
        background: 'transparent',
        border: '1px solid #4ade80',
        color: '#4ade80',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '12px',
        cursor: 'pointer',
    },
}