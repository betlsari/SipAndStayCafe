export function LoadingSpinner() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#F7F5F0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
            <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '18px',
                    background: '#fff',
                    border: '1px solid #E0DDD6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    boxShadow: '0 4px 16px rgba(95,113,84,0.08)',
                }}>☕</div>
                <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: '-4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2.5px solid #F7F5F0',
                    borderTopColor: '#5F7154',
                    borderRightColor: '#5F7154',
                    animation: 'spin 0.75s linear infinite',
                }} />
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#82A76B',
                            animation: 'bounce 1.2s ease-in-out infinite',
                            animationDelay: `${i * 0.18}s`,
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes bounce {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                    40% { transform: translateY(-6px); opacity: 1; }
                }
            `}</style>
        </div>
    )
}