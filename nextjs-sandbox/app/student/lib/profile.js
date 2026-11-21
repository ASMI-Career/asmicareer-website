// Engineering student profile (Settings). The allowed lists mirror the Apps Script (PROFILE_* in engineering-leads.js): the script
// re-checks everything, this only gives the student quick feedback before saving.
export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
export const YES_NO = ['Yes', 'No'];
// Same names as the dashboard's category rules; "OBC-NCL" is how the dashboard labels OBC.
export const CATEGORIES = ['General', 'OBC-NCL', 'SEBC', 'SC', 'ST', 'EWS', 'VJ/NT/SBC'];
export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
export const MAX_BRANCHES = 6;

// The fields as they travel (same keys as the script). kind drives both the input and the check.
export const FIELDS = {
  name: { kind: 'name' }, category: { kind: 'enum', list: CATEGORIES }, gender: { kind: 'enum', list: GENDERS }, pwd: { kind: 'enum', list: YES_NO },
  home_state: { kind: 'enum', list: STATES }, home_university: { kind: 'text' }, minority: { kind: 'text' },
  jee_main_percentile: { kind: 'pct' }, jee_main_crl_rank: { kind: 'rank' }, category_rank: { kind: 'rank' }, jee_adv_rank: { kind: 'rank' }, jee_adv_category_rank: { kind: 'rank' },
  mhtcet_percentile: { kind: 'pct' }, mhtcet_sml: { kind: 'rank' }, desired_branches: { kind: 'branches' },
};
export const FIELD_KEYS = Object.keys(FIELDS);

// What the form edits: everything as strings (branches as an array).
export function toForm(p) {
  const f = {};
  FIELD_KEYS.forEach(k => { const v = p ? p[k] : undefined; f[k] = k === 'desired_branches' ? (Array.isArray(v) ? v.slice() : []) : (v === null || v === undefined ? '' : String(v)); });
  return f;
}

// Returns an error message, or '' when the value is fine (an empty value is fine, except for the name).
export function checkField(key, value) {
  const spec = FIELDS[key];
  if (spec.kind === 'branches') return value.length > MAX_BRANCHES ? `Choose at most ${MAX_BRANCHES} branches.` : '';
  const s = String(value).trim();
  if (spec.kind === 'name') {
    if (s.length < 2) return 'Please enter your name.';
    if (s.length > 80) return 'Name can have at most 80 characters.';
    if (/[<>=@\\]/.test(s) || /^[+\-]/.test(s)) return 'Name has characters that are not allowed.';
    return '';
  }
  if (s === '') return '';
  if (spec.kind === 'text') return s.length > 100 ? 'At most 100 characters.' : '';
  if (spec.kind === 'enum') return spec.list.includes(s) ? '' : 'Please choose from the list.';
  if (spec.kind === 'pct') return (/^\d{1,3}(\.\d{1,2})?$/.test(s) && parseFloat(s) <= 100) ? '' : 'Enter a percentile between 0 and 100 (up to 2 decimals).';
  if (spec.kind === 'rank') return (/^\d{1,7}$/.test(s) && parseInt(s, 10) >= 1) ? '' : 'Enter a whole number, 1 or more.';
  return '';
}

export function checkAll(form) {
  const errors = {};
  FIELD_KEYS.forEach(k => { const m = checkField(k, form[k]); if (m) errors[k] = m; });
  return errors;
}

const sameValue = (key, a, b) => (key === 'desired_branches' ? JSON.stringify(a) === JSON.stringify(b) : String(a).trim() === String(b).trim());
// Only the fields that differ from what was last loaded/saved. Numbers go as text; the script validates them.
export function changedFields(form, saved) {
  const base = toForm(saved);
  const out = {};
  FIELD_KEYS.forEach(k => { if (!sameValue(k, form[k], base[k])) out[k] = k === 'desired_branches' ? form[k] : String(form[k]).trim(); });
  return out;
}

// The line shown on the dashboard badge: JEE Main percentile first, else MHT-CET percentile, else the sheet's Score.
export function examBadge(profile, score, profileSupported) {
  const num = (v) => (v === null || v === undefined || v === '' || !isFinite(Number(v)) || Number(v) <= 0 ? null : Number(v));
  const j = profile && num(profile.jee_main_percentile); if (j !== null) return { label: 'JEE MAIN PERCENTILE', value: j };
  const m = profile && num(profile.mhtcet_percentile); if (m !== null) return { label: 'MHT-CET PERCENTILE', value: m };
  if (score) return { label: profileSupported ? 'SCORE' : 'PERCENTILE', value: score };
  return { label: profileSupported ? 'SCORE' : 'PERCENTILE', value: '—' };
}

// Predictor / Cutoff Explorer prefill. Only values the student has filled in are returned; everything else is left alone.
export function prefillFrom(profile) {
  const out = {};
  if (!profile) return out;
  // Both ranks are handed over; the Predictor picks per track. JoSAA compares reserved categories by CATEGORY rank, CSAB and the rest by CRL.
  if (profile.jee_main_crl_rank) out.mainCrl = String(profile.jee_main_crl_rank);
  if (profile.category_rank) out.mainCat = String(profile.category_rank);
  if (profile.jee_adv_rank) out.advCrl = String(profile.jee_adv_rank);
  if (profile.jee_adv_category_rank) out.advCat = String(profile.jee_adv_category_rank);
  if (profile.jee_main_percentile) out.mainPct = String(profile.jee_main_percentile);
  if (profile.mhtcet_percentile) out.mhPct = String(profile.mhtcet_percentile);
  if (profile.mhtcet_sml) out.mhMerit = String(profile.mhtcet_sml);   // Maharashtra state merit number (SML rank)
  if (profile.pwd === 'Yes') out.pwd = true;
  return out;
}

// POST as text/plain so the browser does not need a CORS pre-flight (same as the shortlist save).
export async function postProfile(endpoint, token, changes) {
  let res;
  try {
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'saveProfile', token, profile: changes }) });
    res = await r.json();
  } catch (e) { return { ok: false, error: 'network' }; }
  return res && typeof res === 'object' ? res : { ok: false, error: 'server_error' };
}

export const ERROR_TEXT = {
  network: "Couldn't reach the server. Check your internet and try again.",
  locked: 'Your profile has been locked by your counsellor. Contact them to change it.',
  rate_limited: 'Too many changes in the last hour. Please try again later.',
  busy: 'The server is busy. Please try again in a few seconds.',
  not_found: 'This link is not valid any more. Ask your counsellor for a fresh link.',
  server_error: 'Something went wrong on our side. Please try again.',
  validation: 'Some values need fixing (shown below).',
};
