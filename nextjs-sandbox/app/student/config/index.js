import medical from './medical.json';
import engineering from './engineering.provisional.json';
import { APPS_SCRIPT_URL } from '../lib/config';

// One /student app, one config per stream. Everything that differs between Medical and Engineering lives in these JSON files.
export const STREAMS = { medical, engineering };

// Token prefix decides the stream: ENG-… is engineering, anything else is medical.
export function detectStream(token) {
  return /^ENG-/.test(String(token || '').trim()) ? 'engineering' : 'medical';
}

export function getStreamConfig(streamId) {
  return STREAMS[streamId] || STREAMS.medical;
}

// Where each stream's dashboard data lives (the Apps Script web app that answers getStudent / saveShortlist / saveDocStatus).
// Medical: the existing live script. Engineering: set at build time; empty means the engineering dashboard is not switched on yet.
//   NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL=https://script.google.com/macros/s/<deployment>/exec
export function endpointFor(streamId) {
  if (streamId === 'engineering') return process.env.NEXT_PUBLIC_ENGINEERING_DASHBOARD_URL || '';
  return APPS_SCRIPT_URL;
}

// Reads the stream from the link. Safe on the server (no window): returns medical, and nothing rendered depends on it
// until the student record has loaded.
export function streamFromLocation() {
  if (typeof window === 'undefined') return 'medical';
  try { return detectStream(new URLSearchParams(window.location.search).get('token')); } catch (e) { return 'medical'; }
}

// First matching rule wins; used for category and quota. Same behaviour as the old hard-coded chains.
export function applyRules(value, spec) {
  if (!spec) return null;
  const v = String(value).toUpperCase();
  for (const r of spec.rules) if (r.contains.some(s => v.includes(s))) return r.value;
  return spec.default;
}
