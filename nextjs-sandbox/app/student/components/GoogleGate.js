import { useState, useEffect, useRef } from 'react';
import { endpointFor } from '../config';
import { callDash } from '../lib/api';
import { initAuth, renderSignInButton, promptOneTap, subscribeAuth, cacheKeyOf, setStudentRef, signOut as authSignOut } from '../lib/auth';
import { clearGoogleCaches } from '../lib/cache';
import TokenGate from './TokenGate';

// Sign-in screen + "which dashboard is this student's?" check. Only used when Google sign-in is switched on (see lib/auth.js).
// After sign-in the page asks the Medical script, then the Engineering script, to look the verified email up in its own "Approved Email" column.
// The first one that knows the email decides the stream; the answer is handed on so the dashboard does not ask twice.
const STREAMS = ['medical', 'engineering'];

export default function GoogleGate({ children }) {
  const [phase, setPhase] = useState('loading');   // loading | signin | checking | choose | not_approved | error | ready
  const [session, setSession] = useState(null);
  const [choices, setChoices] = useState(null);    // every student this Google account may open: [{ streamId, endpoint, ref, name, prefetched }]
  const [expired, setExpired] = useState(false);
  const btnRef = useRef(null);
  const phaseRef = useRef('loading'); phaseRef.current = phase;

  // Open one student: ask for their record (unless the first answer already was it) and hand it to the dashboard.
  async function open(opt, all) {
    setStudentRef(opt.ref);
    let res = opt.prefetched;
    if (!res) {
      setPhase('checking');
      try { res = await callDash(opt.endpoint, 'getStudent'); } catch (e) { setPhase('error'); return; }
      if (!(res && res.success && res.data)) { if (res && (res.error === 'auth_invalid' || res.error === 'auth_required')) setPhase('signin'); else setPhase(res && res.error === 'not_approved' ? 'not_approved' : 'error'); return; }
    }
    setSession({ streamId: opt.streamId, endpoint: opt.endpoint, prefetched: res, cacheKey: cacheKeyOf() });
    setPhase('ready');
  }

  async function discover() {
    setPhase('checking'); setStudentRef(''); setChoices(null);
    let sawError = false; const options = [];
    for (const id of STREAMS) {
      const endpoint = endpointFor(id);
      if (!endpoint) continue;
      let res;
      try { res = await callDash(endpoint, 'getStudent'); } catch (e) { sawError = true; continue; }
      if (res && res.success && res.data) options.push({ streamId: id, endpoint, ref: '', name: res.data.name || 'Student', prefetched: res });
      else if (res && res.success && Array.isArray(res.choose)) res.choose.forEach(c => options.push({ streamId: id, endpoint, ref: c.ref, name: c.name || 'Student', prefetched: null }));
      else if (res && (res.error === 'auth_invalid' || res.error === 'auth_required')) { setPhase('signin'); return; }
      else if (!res || res.error !== 'not_approved') sawError = true;
    }
    if (options.length === 1) { await open(options[0], options); return; }
    if (options.length > 1) { setChoices(options); setPhase('choose'); return; }
    setPhase(sawError ? 'error' : 'not_approved');
  }

  useEffect(() => {
    let alive = true;
    const off = subscribeAuth((ev) => {
      if (!alive) return;
      if (ev.type === 'token') { if (phaseRef.current === 'ready') setExpired(false); else discover(); }
      else if (ev.type === 'expired') { if (phaseRef.current === 'ready') setExpired(true); else setPhase('signin'); }
      else if (ev.type === 'out') { setSession(null); setChoices(null); setExpired(false); setPhase('signin'); }
    });
    initAuth().then(() => { if (alive) { setPhase('signin'); promptOneTap(); } }).catch(() => { if (alive) setPhase('error'); });
    return () => { alive = false; off(); };
  }, []);

  // The Google button needs a real element: draw it whenever the sign-in card is on screen.
  useEffect(() => {
    if (phase === 'signin' || expired) { const t = setTimeout(() => renderSignInButton(btnRef.current), 0); return () => clearTimeout(t); }
    return undefined;
  }, [phase, expired]);

  const signOut = () => { clearGoogleCaches(); authSignOut(); };      // a shared phone must not keep any child's cached data
  const switchStudent = (choices && choices.length > 1) ? () => { setSession(null); setStudentRef(''); setPhase('choose'); } : null;

  if (phase === 'ready') {
    return (
      <>
        {children(session, signOut, switchStudent)}
        {expired && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(26,0,64,0.65)' }}>
            <TokenGate state="signin" expired buttonRef={btnRef} />
          </div>
        )}
      </>
    );
  }
  return <TokenGate state={phase === 'loading' || phase === 'checking' ? 'checking' : phase} buttonRef={btnRef} onSwitch={signOut} choices={choices} onChoose={(c) => open(c, choices)} />;
}
