// ── Shown instead of the dashboard when there is no valid student link ───────
export default function TokenGate({ state, helpline, buttonRef, onSwitch, expired, choices, onChoose }) {
  const number = helpline || '7410019074';   // engineering sets its own helpline in its config; Medical keeps this one
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
          {state === 'signin' && (
            <>
              <h2 className="section-title">{expired ? 'Please sign in again' : 'Sign in to your dashboard'}</h2>
              <p className="section-sub">{expired ? 'Your sign-in has expired. Sign in with the same Google account to carry on.' : 'Use the Google account your ASMI counsellor registered for you.'}</p>
              <div ref={buttonRef} style={{ display: 'flex', justifyContent: 'center', minHeight: 44, marginTop: 20 }} />
            </>
          )}
          {state === 'choose' && (
            <>
              <h2 className="section-title">Whose dashboard do you want to open?</h2>
              <p className="section-sub">Your Google account is registered for more than one student. You can switch any time from the menu.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                {(choices || []).map((c, i) => <button key={i} style={primaryBtn} onClick={() => onChoose(c)}>{c.name}</button>)}
                {onSwitch && <button className="btn-outline-navy" onClick={onSwitch}>Use a different Google account</button>}
              </div>
            </>
          )}
          {state === 'not_approved' && (
            <>
              <h2 className="section-title">This Google account is not registered</h2>
              <p className="section-sub">We could not find a student dashboard for the account you signed in with. Try the Google account you gave your ASMI counsellor, or ask them to add this one.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                {onSwitch && <button style={primaryBtn} onClick={onSwitch}>Use a different Google account</button>}
                <a href={`tel:${number}`} className="btn-outline-navy">{`Call ASMI Helpline: ${number}`}</a>
              </div>
            </>
          )}
          {state === 'invalid' && (
            <>
              <h2 className="section-title">This link is not valid</h2>
              <p className="section-sub">We could not find a student record for this link. Please contact your ASMI counsellor and ask for a new dashboard link.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                <a href={`tel:${number}`} style={primaryBtn}>{`Call ASMI Helpline: ${number}`}</a>
                <a href={`https://wa.me/91${number}`} target="_blank" rel="noreferrer" className="btn-outline-navy">Message us on WhatsApp</a>
              </div>
            </>
          )}
          {state === 'unavailable' && (
            <>
              <h2 className="section-title">Your dashboard is not open yet</h2>
              <p className="section-sub">This dashboard has not been switched on yet. Please contact your ASMI counsellor and we will let you know when it is ready.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                <a href={`tel:${number}`} style={primaryBtn}>{`Call ASMI Helpline: ${number}`}</a>
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
