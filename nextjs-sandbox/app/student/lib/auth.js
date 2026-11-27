// ── Google Sign-In (browser side) ─────────────────────────────────────────────
// The dashboard no longer trusts "whoever holds the link". The student signs in with Google; Google gives this page an ID token; the page sends it to the
// Apps Script in the BODY of a POST (never in a URL); the script checks it with Google and with the sheet's "Approved Email" column.
// The ID token lives in this module's memory only (not localStorage). It lasts about an hour; getIdToken() asks Google for a fresh one when needed.
//
// Switch: the whole sign-in flow is on only when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set at build time (a public value). While it is empty the page
// behaves exactly as before (link token), so this code can be merged and shipped before the scripts and Google client are ready.
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
export const googleMode = () => !!GOOGLE_CLIENT_ID;

let current = null;                 // { idToken, exp (ms), sub }
let initialized = false;
let gisLoading = null;
let waiter = null;
const listeners = new Set();
const emit = (e) => listeners.forEach(f => { try { f(e); } catch (err) { /* a listener must not break the others */ } });

// Reads the claims only to know the expiry and a stable account id for the browser cache. Nothing here is trusted: the script verifies the token.
function claims(jwt) {
  try {
    const b64 = String(jwt).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)), c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) { return null; }
}

function loadGis() {
  if (gisLoading) return gisLoading;
  gisLoading = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') { reject(new Error('no window')); return; }
    if (window.google && window.google.accounts && window.google.accounts.id) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { gisLoading = null; reject(new Error('Google sign-in could not load')); };
    document.head.appendChild(s);
  });
  return gisLoading;
}

function onCredential(resp) {
  const idToken = resp && resp.credential;
  const c = idToken && claims(idToken);
  if (!c) return;
  current = { idToken, exp: (Number(c.exp) || 0) * 1000, sub: String(c.sub || '') };
  if (waiter) { const w = waiter; waiter = null; w(current); }
  emit({ type: 'token' });
}

export async function initAuth() {
  await loadGis();
  if (!initialized) {
    window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onCredential, auto_select: true, cancel_on_tap_outside: false, itp_support: true });
    initialized = true;
  }
}
export function renderSignInButton(el) {
  if (el && initialized) { el.innerHTML = ''; window.google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: 280 }); }
}
export function promptOneTap() { if (initialized) { try { window.google.accounts.id.prompt(); } catch (e) { /* the button still works */ } } }
export const subscribeAuth = (f) => { listeners.add(f); return () => listeners.delete(f); };
export const currentSession = () => current;
// Which student is open when one Google account is registered for several (twins with a shared parent email). Sent with every call; the script
// re-checks that the signed-in email is really on that student's row, so this is a choice, not a credential.
let studentRef = '';
export const setStudentRef = (r) => { studentRef = r || ''; };
export const getStudentRef = () => studentRef;
// Staff view: a staff Google account opening any student. Sent as asStaff:true with every call; the script checks the Staff tab and logs each action.
let asStaff = false;
export const setAsStaff = (v) => { asStaff = !!v; };
export const getAsStaff = () => asStaff;
export const cacheKeyOf = () => (current && current.sub ? 'g_' + current.sub + (asStaff ? '_staff' : '') + (studentRef ? '_' + studentRef : '') : '');

const isFresh = () => !!current && current.exp - Date.now() > 60 * 1000;

// A usable ID token, or null. `force` asks Google for a new one even if this one looks fresh (used after the script refused it).
export async function getIdToken({ force = false } = {}) {
  if (!force && isFresh()) return current.idToken;
  if (!initialized) return null;
  const got = new Promise((resolve) => { waiter = resolve; });
  promptOneTap();                    // re-issues a credential silently when the student is still signed in to Google and allows it
  const next = await Promise.race([got, new Promise((r) => setTimeout(() => r(null), 6000))]);
  waiter = null;
  return next ? next.idToken : null;
}

export function signOut() {
  try { if (initialized) window.google.accounts.id.disableAutoSelect(); } catch (e) { /* ignore */ }
  current = null; studentRef = ''; asStaff = false;
  emit({ type: 'out' });
}
export function expireNow() { current = null; emit({ type: 'expired' }); }
