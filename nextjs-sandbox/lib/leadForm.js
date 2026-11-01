// Shared helpers for the two inquiry forms (/medical/inquiry, /engineering/inquiry).

// ── Where do leads go? ──────────────────────────────────────────────────
// Production Apps Script web-app (the live lead sheet).
const PRODUCTION_LEAD_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbz_0k81uo0WOYsHaghxqlMBBdJMmc0c4TzYDjnLpsqtQ2yhzhPkVlfmxZ_mmVrh_pls/exec';

// Only these hostnames are treated as the live site. If the domain ever moves,
// add the new hostname here, otherwise the form will show TEST MODE on the live site.
export const PRODUCTION_HOSTS = ['asmicareer.in', 'www.asmicareer.in', 'asmicareer.com', 'www.asmicareer.com'];

// Decide at submit time (browser only) where a lead may be sent. A preview or local
// build can NEVER post to production:
//   - live hostname                      -> production endpoint (or NEXT_PUBLIC_LEAD_ENDPOINT if set)
//   - other host + NEXT_PUBLIC_LEAD_ENDPOINT set -> that TEST endpoint, with a visible TEST MODE banner
//   - other host, nothing set            -> nothing is sent, visible TEST MODE banner
// To test against a COPY of the lead sheet, build with:
//   NEXT_PUBLIC_LEAD_ENDPOINT=https://script.google.com/macros/s/<TEST_ID>/exec
export function getLeadTarget() {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isProd = PRODUCTION_HOSTS.includes(host);
  const envEndpoint = process.env.NEXT_PUBLIC_LEAD_ENDPOINT || '';
  if (envEndpoint) {
    return {
      endpoint: envEndpoint,
      testMode: !isProd,
      label: isProd ? '' : 'TEST MODE: submissions go to the TEST endpoint, not the live lead sheet.',
    };
  }
  if (isProd) return { endpoint: PRODUCTION_LEAD_ENDPOINT, testMode: false, label: '' };
  return {
    endpoint: null,
    testMode: true,
    label: 'TEST MODE: this is not the live site. Nothing you submit here is sent anywhere.',
  };
}

export const TEST_TOKEN = 'TEST-NOT-SENT';

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

// ── Phone numbers ───────────────────────────────────────────────────────
// Rules (the Apps Script uses the same ones, see normalizePhone_):
//   International numbers are for the MEDICAL form only (NRI / overseas students). The engineering form
//   passes allowInternational=false and accepts Indian numbers only.
//   India          10 digits starting 6-9. "+91 ...", "91 ..." (12 digits) and "0 ..." (11 digits) are reduced to the 10 digits.
//   Other country  must start with "+" and the country code; 8-15 digits in total (E.164 limit),
//                  first digit 1-9. Stored as "+<digits>", e.g. +971501234567.
//   A number outside India typed without "+" is rejected (it cannot be told apart from a mistyped Indian number).

// Keeps only what a phone box should hold while typing: digits and one leading "+".
export function sanitizePhoneInput(v) {
  let s = String(v || '').replace(/[^\d+]/g, '');
  const plus = s.startsWith('+');
  s = s.replace(/\+/g, '');
  return (plus ? '+' : '') + s.slice(0, 15);
}

// Returns the normalised number, or '' if it is not valid.
export function normalizePhone(v, allowInternational = true) {
  const s = sanitizePhoneInput(v);
  if (!s) return '';
  if (s.startsWith('+')) {
    let d = s.slice(1);
    if (d.startsWith('91')) {
      d = d.slice(2);
      return /^[6-9]\d{9}$/.test(d) ? d : '';
    }
    return allowInternational && /^[1-9]\d{7,14}$/.test(d) ? '+' + d : '';
  }
  let d = s;
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : '';
}

export function isValidPhone(v, allowInternational = true) {
  return normalizePhone(v, allowInternational) !== '';
}

export const PHONE_ERROR =
  'Enter a valid mobile number: 10 digits for India (starts with 6, 7, 8 or 9), or + country code for other countries (e.g. +971 50 123 4567)';

// Engineering form: Indian numbers only.
export const PHONE_ERROR_INDIA =
  'Enter a valid 10-digit Indian mobile number (starts with 6, 7, 8 or 9)';

// ── Engineering entrance score ──────────────────────────────────────────
// The engineering form asks for a PERCENTILE (not a rank). Accepts "98.5", "98,5", "98.5%".
export const PERCENTILE_MIN = 0.01;
export const PERCENTILE_MAX = 100;

// Returns the number, or null if it is not a percentile in (0, 100].
export function parsePercentile(v) {
  const s = String(v ?? '').trim().replace(/%$/, '').replace(',', '.').trim();
  if (!/^\d{1,3}(\.\d{1,6})?$/.test(s)) return null;
  const n = Number(s);
  return n > 0 && n <= PERCENTILE_MAX ? n : null;
}

export function percentileError(v) {
  const s = String(v ?? '').trim().replace(/%$/, '').replace(',', '.').trim();
  if (/^\d+$/.test(s) && Number(s) > PERCENTILE_MAX) {
    return 'That looks like a rank. Enter your percentile (0.01 to 100) here, and tell your counsellor your rank on the call.';
  }
  return 'Enter your percentile as a number from 0.01 to 100 (for example 98.5).';
}

// Server replies with the token on success and "Error: ..." on failure.
export function looksLikeToken(text) {
  const t = String(text || '').trim();
  return t.length > 0 && t.length < 40 && !/^error/i.test(t) && !/<\w+/.test(t);
}
