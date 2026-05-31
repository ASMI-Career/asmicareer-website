export default function Home() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 72px - 300px)',
      background: '#FFD700',
      fontFamily: 'var(--font-montserrat)',
    }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 900,
          color: '#1a0040',
          marginBottom: '12px',
        }}>
          ASMI Career
        </h1>
        <p style={{ fontSize: '18px', color: '#6a0dad', fontWeight: 700 }}>
          Phase 2 complete — global components live ✓
        </p>
      </div>
    </div>
  )
}
