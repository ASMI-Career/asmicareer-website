export default function Home() {
  return (
    <main style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'var(--font-montserrat)',
      background: '#FFD700',
      color: '#1a0040'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 900 }}>ASMI Career</h1>
        <p style={{ fontSize: '18px', marginTop: '12px' }}>Next.js setup complete ✓</p>
      </div>
    </main>
  )
}
