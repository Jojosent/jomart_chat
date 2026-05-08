import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'

export default function useWebSocket(
    onMessage, onDelivered, onReadStatus, onTyping, onNotification
) {
    const clientRef = useRef(null)
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const client = new Client({
            brokerURL: 'ws://localhost:8080/ws/websocket',
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 3000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                setConnected(true)
                console.log('✅ WebSocket connected')

                client.subscribe('/user/queue/messages', (msg) => {
                    console.log('📨 New message:', msg.body)
                    try { if (onMessage) onMessage(JSON.parse(msg.body)) }
                    catch (e) { console.error('Parse error:', e) }
                })

                client.subscribe('/user/queue/delivered', (msg) => {
                    try { if (onDelivered) onDelivered(JSON.parse(msg.body)) }
                    catch (e) { console.error(e) }
                })

                client.subscribe('/user/queue/read-status', (msg) => {
                    try { if (onReadStatus) onReadStatus(JSON.parse(msg.body)) }
                    catch (e) { console.error(e) }
                })

                client.subscribe('/user/queue/typing', (msg) => {
                    try { if (onTyping) onTyping(JSON.parse(msg.body)) }
                    catch (e) { console.error(e) }
                })

                client.subscribe('/user/queue/notifications', (msg) => {
                    try { if (onNotification) onNotification(JSON.parse(msg.body)) }
                    catch (e) { console.error(e) }
                })
            },

            onDisconnect: () => {
                setConnected(false)
                console.log('❌ WebSocket disconnected')
            },

            onStompError: (frame) => {
                console.error('STOMP error:', frame)
            },

            onWebSocketError: (event) => {
                console.error('WS error:', event)
            },
        })

        client.activate()
        clientRef.current = client

        return () => { client.deactivate() }
    }, [])

    const sendMessage = (chatId, content) => {
        if (!clientRef.current?.connected) {
            console.warn('❌ Not connected, cannot send')
            return
        }
        console.log('📤 Sending:', { chatId, content })
        clientRef.current.publish({
            destination: '/app/chat.send',
            body: JSON.stringify({ chatId, content }),
        })
    }

    const markRead = (chatId) => {
        if (!clientRef.current?.connected) return
        clientRef.current.publish({
            destination: '/app/chat.read',
            body: JSON.stringify({ chatId }),
        })
    }

    const sendTyping = (chatId, typing) => {
        if (!clientRef.current?.connected) return
        clientRef.current.publish({
            destination: '/app/chat.typing',
            body: JSON.stringify({ chatId, typing }),
        })
    }

    return { connected, sendMessage, markRead, sendTyping }
}