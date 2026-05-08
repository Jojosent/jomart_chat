import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import ChatPage from './pages/ChatPage'
import GroupSettingsPage from './pages/GroupSettingsPage'
import ProtectedRoute from './components/ProtectedRoute'
import AiChatPage from './pages/AiChatPage'

function ChatPlaceholder() {
    const navigate = () => window.location.href = '/profile'
    return (
        <div style={{
            minHeight: '100vh', background: '#0f0f1a',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '16px'
        }}>
            <div style={{ color: '#7c6af7', fontSize: '24px', fontWeight: '700' }}>
                💬 JoChat — Чат будет в Части 6
            </div>
            <a href="/profile" style={{
                color: '#a78bfa', fontSize: '15px', textDecoration: 'none'
            }}>
                → Открыть профиль
            </a>
        </div>
    )
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/chat" element={
                    <ProtectedRoute><ChatPage /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute><ProfilePage /></ProtectedRoute>
                } />
                <Route path="/groups/:id/settings" element={
                    <ProtectedRoute><GroupSettingsPage /></ProtectedRoute>
                } />
                <Route path="/ai" element={
  <ProtectedRoute><AiChatPage /></ProtectedRoute>
} />
            </Routes>
        </BrowserRouter>
    )
}
export default App