import { useState, useEffect, useRef } from 'react';
import { endpointFor } from '../config';
import { callDash } from '../lib/api';
import { initAuth, renderSignInButton, promptOneTap, subscribeAuth, currentSession, cacheKeyOf, signOut as authSignOut } from '../lib/auth';
import { clearCache } from '../lib/cache';
import TokenGate from './TokenGate';

// Sign-in screen + "which dashboard is this student's?" check. Only used when Google sign-in is switched on (see lib/auth.js).
// After sign-in the page asks the Medical script, then the Engineering script, to look the verified email up in its own "Approved Email" column.
// The first one that knows the email decides the stream; the answer is handed on so the dashboard does not ask twice.
const STREAMS = ['medical', 'engineering'];

export default function GoogleGate({ children }) {
  const [phase, setPhase] = useState('loading');   // loading | signin | checking | not_approved | error | ready
  const [session, setSession] = useState(null);
  const [expired, setExpired] = useState(false);
  const btnRef = useRef(null);
  const phaseRef = useRef('loading'); phaseRef.current = phase;
  const sessionRef = useRef(null); sessionRef.current = session;

  async function discover() {
    setPhase('checking');
    let sawError = false;
    for (const id of STREAMS) {
      const endpoint = endpointFor(id);
      if (!endpoint) continue;
      let res;
      try { res = await callDash(endpoint, 'getStudent'); } catch (e) { sawError = true; continue; }
      if (res && res.success && res.data) { setSession({ streamId: id, endpoint, prefetched: res, cacheKey: cacheKeyOf() }); setPhase('ready'); return; }
      if (res && (res.error === 'auth_invalid' || res.error === 'auth_required')) { setPhase('signin'); return; }
      if (!res || res.error !== 'not_approved') sawError = true;
    }
    setPhase(sawError ? 'error' : 'not_approved');
  }

  useEffect(() => {
    let alive = true;
    const off = subscribeAuth((ev) => {
      if (!alive) return;
      if (ev.type === 'token') { if (phaseRef.current === 'ready') setExpired(false); else discover(); }
      else if (ev.type === 'expired') { if (phaseRef.current === 'ready') setExpired(true); else setPhase('signin'); }
      else if (ev.type === 'out') { setSession(null); setExpired(false); setPhase('signin'); }
    });
    initAuth().then(() => { if (alive) { setPhase('signin'); promptOneTap(); } }).catch(() => { if (alive) setPhase('error'); });
    return () => { alive = false; off(); };
  }, []);

  // The Google button needs a real element: draw it whenever the sign-in card is on screen.
  useEffect(() => {
    if (phase === 'signin' || expired) { const t = setTimeout(() => renderSignInButton(btnRef.current), 0); return () => clearTimeout(t); }
    return undefined;
  }, [phase, expired]);

  const signOut = () => {
    const s = sessionRef.current;
    if (s && s.cacheKey) clearCache(s.cacheKey);     // a shared phone must not keep the previous student's cached data
    authSignOut();
  };

  if (phase === 'ready') {
    return (
      <>
        {children(session, signOut)}
        {expired && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(26,0,64,0.65)' }}>
            <TokenGate state="signin" expired buttonRef={btnRef} />
          </div>
        )}
      </>
    );
  }
  return <TokenGate state={phase === 'loading' || phase === 'checking' ? 'checking' : phase} buttonRef={btnRef} onSwitch={signOut} />;
}
