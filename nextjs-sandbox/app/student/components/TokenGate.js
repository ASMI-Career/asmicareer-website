// ── Shown instead of the dashboard when there is no valid student link ───────
export default function TokenGate({ state }) {
  const wrap = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 16 };
  const card = { maxWidth: 460, width: '100%', textAlign: 'center', marginBottom: 0 };
  // Explicit colours: other global stylesheets also define generic button classes.
  const primaryBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: '#1A0040', color: '#ffffff', border: 'none', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 700, textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit' };
  return (
    <div className="student-body">
      <div style={wrap}>
        <div className="tool-card" style={card} role={state === 'checking' ? 'status' : 'alert'}>
          <img src="/asmi-logo.png" alt="ASMI Logo" style={{ height: 44, marginBottom: 20 }} />
          {state === 'checking' && <h2 className="section-title">Loading your dashboard…</h2>}
          {state === 'invalid' && (
            <>
              <h2 className="section-title">This link is not valid</h2>
              <p className="section-sub">We could not find a student record for this link. Please contact your ASMI counsellor and ask for a new dashboard link.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                <a href="tel:7410019074" style={primaryBtn}>Call ASMI Helpline: 7410019074</a>
                <a href="https://wa.me/917410019074" target="_blank" rel="noreferrer" className="btn-outline-navy">Message us on WhatsApp</a>
              </div>
            </>
          )}
          {state === 'error' && (
            <>
              <h2 className="section-title">We could not load your dashboard</h2>
              <p className="section-sub">Please check your internet connection and try again. If it keeps happening, contact your ASMI counsellor.</p>
              <button style={{ ...primaryBtn, marginTop: 20 }} onClick={() => window.location.reload()}>Try again</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
