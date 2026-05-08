export default function MessageTicks({ status }) {
    if (status === 'READ') {
        return (
            <span style={styles.container} title="Прочитано">
                <Tick color="#7c6af7" />
                <Tick color="#7c6af7" style={{ marginLeft: '-5px' }} />
            </span>
        )
    }

    if (status === 'DELIVERED') {
        return (
            <span style={styles.container} title="Доставлено">
                <Tick color="rgba(255,255,255,0.45)" />
                <Tick color="rgba(255,255,255,0.45)" style={{ marginLeft: '-5px' }} />
            </span>
        )
    }

    // SENT
    return (
        <span style={styles.container} title="Отправлено">
            <Tick color="rgba(255,255,255,0.45)" />
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