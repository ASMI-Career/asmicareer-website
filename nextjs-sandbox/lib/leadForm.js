// Shared helpers for the two inquiry forms (/medical/inquiry, /engineering/inquiry).

// Apps Script web-app that receives leads. To test against a COPY of the lead sheet,
// deploy the patched script on the copy and build with:
//   NEXT_PUBLIC_LEAD_ENDPOINT=https://script.google.com/macros/s/<TEST_ID>/exec npm run build
export const LEAD_ENDPOINT =
  process.env.NEXT_PUBLIC_LEAD_ENDPOINT ||
  'https://script.google.com/macros/s/AKfycbz_0k81uo0WOYsHaghxqlMBBdJMmc0c4TzYDjnLpsqtQ2yhzhPkVlfmxZ_mmVrh_pls/exec';

// ── Marketing attribution (utm_* + gclid) ───────────────────────────────
export const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'gclid'];
const ATTR_STORAGE_KEY = 'asmi_attr';
const ATTR_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const EMPTY_ATTR = { utm_source: '', utm_medium: '', utm_campaign: '', gclid: '' };

// Call on every page load (see AttributionCapture). If the URL carries any of the
// tracking params, remember them so they survive navigation landing page -> inquiry form.
export function captureAttribution() {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const found = {};
    ATTR_KEYS.forEach((k) => {
      const v = (params.get(k) || '').trim().slice(0, 200);
      if (v) found[k] = v;
    });
    if (Object.keys(found).length > 0) {
      window.localStorage.setItem(
        ATTR_STORAGE_KEY,
        JSON.stringify({ ...EMPTY_ATTR, ...found, ts: Date.now() })
      );
    }
  } catch (e) {
    /* storage blocked (private mode etc.) - attribution is best-effort */
  }
}

// Read stored attribution; URL params on the current page win over stored ones.
export function readAttribution() {
  const out = { ...EMPTY_ATTR };
  if (typeof window === 'undefined') return out;
  try {
    const raw = window.localStorage.getItem(ATTR_STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && Date.now() - (saved.ts || 0) < ATTR_TTL_MS) {
        ATTR_KEYS.forEach((k) => { out[k] = saved[k] || ''; });
      }
    }
  } catch (e) { /* ignore */ }
  try {
    const params = new URLSearchParams(window.location.search);
    ATTR_KEYS.forEach((k) => {
      const v = (params.get(k) || '').trim().slice(0, 200);
      if (v) out[k] = v;
    });
  } catch (e) { /* ignore */ }
  return out;
}

// ── Validation ──────────────────────────────────────────────────────────
// Indian mobile: 10 digits starting 6-9. Accepts pasted "+91 98765 43210" / "098765..." and
// reduces it to the 10-digit number.
export function cleanMobile(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
}

export function isValidMobile(v) {
  return /^[6-9]\d{9}$/.test(String(v || ''));
}

export const MOBILE_ERROR = 'Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8 or 9)';

// Server replies with the token on success and "Error: ..." on failure.
export function looksLikeToken(text) {
  const t = String(text || '').trim();
  return t.length > 0 && t.length < 40 && !/^error/i.test(t) && !/<\w+/.test(t);
}
