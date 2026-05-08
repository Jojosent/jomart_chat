import { useState, useEffect, useCallback } from 'react'
import { getUnreadCount } from '../api/notifications'

export default function useNotifications(wsClient) {
    const [unreadCount, setUnreadCount] = useState(0)
    const [notifications, setNotifications] = useState([])

    // Загрузить количество непрочитанных при старте
    useEffect(() => {
        fetchUnreadCount()
    }, [])

    const fetchUnreadCount = async () => {
        try {
            const res = await getUnreadCount()
            setUnreadCount(res.data.count)
        } catch { }
    }

    // Добавить новое уведомление (из WebSocket)
    const addNotification = useCallback((notification) => {
        setNotifications(prev => [notification, ...prev])
        setUnreadCount(prev => prev + 1)

        // Browser Push Notification
        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.body,
                icon: '/favicon.ico',
            })
        }
    }, [])

    const resetUnread = () => setUnreadCount(0)

    return {
        unreadCount,
        notifications,
        setNotifications,
        addNotification,
        fetchUnreadCount,
        resetUnread,
    }
}