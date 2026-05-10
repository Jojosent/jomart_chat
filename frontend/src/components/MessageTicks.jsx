import { Check, CheckCheck } from 'lucide-react'


export default function MessageTicks({ status }) {
    if (status === 'READ') {
        return (
            <span title="Read" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <CheckCheck size={13} color="#6366f1" />
            </span>
        )
    }
    if (status === 'DELIVERED') {
        return (
            <span title="Delivered" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <CheckCheck size={13} color="rgba(255,255,255,0.4)" />
            </span>
        )
    }
    // SENT
    return (
        <span title="Sent" style={{ display: 'inline-flex', alignItems: 'center' }}>
            <Check size={13} color="rgba(255,255,255,0.4)" />
        </span>
    )
}


// SVG птичка — точная копия стиля WhatsApp
function Tick({ color, style }) {
    return (
        <svg
            style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
            width="16"
            height="11"
            viewBox="0 0 16 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M1 5.5L4.5 9L11 1"
                stroke={color}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

const styles = {
    container: {
        display: 'inline-flex',
        alignItems: 'center',
        marginLeft: '3px',
        lineHeight: 1,
    },
}