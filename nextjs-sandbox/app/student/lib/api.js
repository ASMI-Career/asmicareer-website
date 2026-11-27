// One place that talks to the dashboard Apps Scripts.
//  - Google mode (NEXT_PUBLIC_GOOGLE_CLIENT_ID set): every call is a POST whose BODY carries { action, idToken, ...payload }. No token is ever put in a URL.
//  - Legacy mode (no client id): the old link-token calls, exactly as they were.
// Returns the parsed JSON answer; throws only when the network fails (callers already handle that).
import { googleMode, getIdToken, expireNow } from './auth';

const AUTH_ERRORS = { auth_required: true, auth_invalid: true };
const post = async (endpoint, body) => {
  const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  return r.json();
};

async function googleCall(endpoint, action, payload) {
  const token = await getIdToken();
  if (!token) { expireNow(); return { error: 'auth_required' }; }
  let res = await post(endpoint, { ...payload, action, idToken: token });
  if (res && AUTH_ERRORS[res.error]) {                      // the script refused it (expired, clock): ask Google for a new one and try once more
    const again = await getIdToken({ force: true });
    if (again) res = await post(endpoint, { ...payload, action, idToken: again });
    if (!again || (res && AUTH_ERRORS[res.error])) expireNow();
  }
  return res;
}

async function legacyCall(endpoint, action, payload, token) {
  const t = encodeURIComponent(token || '');
  if (action === 'getStudent') return (await fetch(`${endpoint}?action=getStudent&token=${t}`)).json();
  if (action === 'saveDocStatus') return (await fetch(`${endpoint}?action=saveDocStatus&token=${t}&data=${encodeURIComponent(JSON.stringify(payload.data))}`)).json();
  if (action === 'getPreferenceList') return (await fetch(`${endpoint}?action=getPreferenceList&token=${t}&counselling=${encodeURIComponent(payload.counselling)}`)).json();
  return post(endpoint, { action, token, ...payload });
}

// action: getStudent | saveShortlist | saveDocStatus | saveProfile | getPreferenceList | savePreferenceList
// legacyToken: the link token; used only in legacy mode.
export function callDash(endpoint, action, payload = {}, legacyToken = '') {
  return googleMode() ? googleCall(endpoint, action, payload) : legacyCall(endpoint, action, payload, legacyToken);
}
