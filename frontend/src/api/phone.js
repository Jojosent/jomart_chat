import api from './auth'

// Отправить OTP на номер
export const sendPhoneOtp = (phone) =>
    api.post('/phone/send-otp', { phone })

// Подтвердить OTP
export const verifyPhoneOtp = (phone, otp) =>
    api.post('/phone/verify-otp', { phone, otp })