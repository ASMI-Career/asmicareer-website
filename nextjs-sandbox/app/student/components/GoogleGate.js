import { useState, useEffect, useRef } from 'react';
import { endpointFor } from '../config';
import { callDash } from '../lib/api';
import { initAuth, renderSignInButton, promptOneTap, subscribeAuth, cacheKeyOf, setStudentRef, setAsStaff, signOut as authSignOut } from '../lib/auth';
import { clearGoogleCaches } from '../lib/cache';
import TokenGate from './TokenGate';
import StaffFinder from './StaffFinder';

// Sign-in screen + "which dashboard is this student's?" check. Only used when Google sign-in is switched on (see lib/auth.js).
// After sign-in the page asks the Medical script, then the Engineering script, to look the verified email up in its own "Approved Email" column.
// The first one that knows the email decides the stream; the answer is handed on so the dashboard does not ask twice.
const STREAMS = ['medical', 'engineering'];

export default function GoogleGate({ children }) {
  const [phase, setPhase] = useState('loading');   // loading | signin | checking | choose | staff | not_approved | error | ready
  const [staffEndpoints, setStaffEndpoints] = useState([]);   // the scripts that say this account is on their Staff tab
  const [staffNotice, setStaffNotice] = useState('');
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

  // Staff: which scripts list this Google account on their Staff tab? (staffCheck needs no student.)
  async function findStaffScripts() {
    const found = []; let sawError = false;
    for (const id of STREAMS) {
      const endpoint = endpointFor(id); if (!endpoint) continue;
      try { const r = await callDash(endpoint, 'staffCheck'); if (r && r.success) found.push({ streamId: id, endpoint }); else if (r && r.error !== 'not_staff' && r.error !== 'auth_invalid' && r.error !== 'auth_required') sawError = true; } catch (e) { sawError = true; }
    }
    return { found, sawError };
  }

  async function openAsStaff(item) {
    setStaffNotice(''); setStudentRef(item.ref); setAsStaff(true); setPhase('checking');
    let res = null;
    try { res = await callDash(item.endpoint, 'getStudent'); } catch (e) { res = null; }
    if (res && res.success && res.data) { setSession({ streamId: item.streamId, endpoint: item.endpoint, prefetched: res, cacheKey: cacheKeyOf(), staff: true }); setPhase('ready'); return; }
    setAsStaff(false); setStudentRef(''); setStaffNotice('Could not open that student. Please try again.'); setPhase('staff');
  }

  function exitStaff() { clearGoogleCaches(); setAsStaff(false); setStudentRef(''); setSession(null); setStaffNotice(''); setPhase('staff'); }

  async function discover() {
    setPhase('checking'); setStudentRef(''); setAsStaff(false); setChoices(null); setStaffNotice('');
    let sawError = false; const options = [];
    // ?staff=1 asks for the staff screen first (a staff account that is also a student can use either).
    let wantsStaff = false; try { wantsStaff = new URLSearchParams(window.location.search).get('staff') === '1'; } catch (e) { wantsStaff = false; }
    if (wantsStaff) { const st = await findStaffScripts(); if (st.found.length) { setStaffEndpoints(st.found); setPhase('staff'); return; } }
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
    if (!wantsStaff) {                                                   // not a student: is it staff?
      const st = await findStaffScripts();
      if (st.found.length) { setStaffEndpoints(st.found); setPhase('staff'); return; }
      if (st.sawError) sawError = true;
    }
    setPhase(sawError ? 'error' : 'not_approved');
  }

  useEffect(() => {
    let alive = true;
    const off = subscribeAuth((ev) => {
      if (!alive) return;
      if (ev.type === 'token') { if (phaseRef.current === 'ready') setExpired(false); else discover(); }
      else if (ev.type === 'expired') { if (phaseRef.current === 'ready') setExpired(true); else setPhase('signin'); }
      else if (ev.type === 'out') { setSession(null); setChoices(null); setStaffEndpoints([]); setExpired(false); setPhase('signin'); }
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
        {children(session, signOut, switchStudent, session && session.staff ? exitStaff : null)}
        {expired && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(26,0,64,0.65)' }}>
            <TokenGate state="signin" expired buttonRef={btnRef} />
          </div>
        )}
      </>
    );
  }
  if (phase === 'staff') return <StaffFinder endpoints={staffEndpoints} onOpen={openAsStaff} onSignOut={signOut} notice={staffNotice} />;
  return <TokenGate state={phase === 'loading' || phase === 'checking' ? 'checking' : phase} buttonRef={btnRef} onSwitch={signOut} choices={choices} onChoose={(c) => open(c, choices)} />;
}
