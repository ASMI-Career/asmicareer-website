// Engineering Cutoff Explorer: the same JoSAA 2025 and Maharashtra CAP 2026 files the counsellor tool
// (public/engineering-counsellor) reads, shown in a student-friendly way. Nothing here is Medical.

export const JOSAA = {
  id: 'JOSAA', track: 'JoSAA', label: 'JoSAA', year: 2025,
  base: '/data/cutoffs/JOSAA/2025',
  rounds: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6'],
  defaultRound: 'Round 6',
  quotas: [
    { key: 'all-india', label: 'All India' }, { key: 'home-state', label: 'Home State' }, { key: 'other-state', label: 'Other State' },
    { key: 'goa', label: 'Goa' }, { key: 'jk', label: 'J&K' }, { key: 'ladakh', label: 'Ladakh' },
  ],
  categories: [
    { key: 'OPEN', label: 'Open' }, { key: 'EWS', label: 'EWS' }, { key: 'OBC-NCL', label: 'OBC-NCL' }, { key: 'SC', label: 'SC' }, { key: 'ST', label: 'ST' },
  ],
  genders: [{ key: 'all', label: 'Gender-neutral' }, { key: 'female-only', label: 'Female-only' }],
  itypes: ['IIT', 'NIT', 'IIIT', 'GFTI'],
};

export const MH = {
  id: 'MH', track: 'Maharashtra CAP', label: 'Maharashtra CAP', year: 2026,
  base: '/data/cutoffs/MH_ENGG/2026',
  manifest: '/data/cutoffs/MH_ENGG/2026/manifest.json',
  intake: '/data/cutoffs/MH_ENGG/2026/intake.json',
  defaultQuota: 'state-level',
};

export const cfgFor = (counselling) => (counselling === 'MH' ? MH : JOSAA);

// The student's category (from the sheet, mapped by the config rules) -> the file category for each counselling.
export function defaultCategory(counselling, studentCategory, availableKeys) {
  const has = (k) => !availableKeys || availableKeys.includes(k);
  const map = counselling === 'MH'
    ? { General: 'OPEN', OBC: 'OBC', SEBC: 'SEBC', SC: 'SC', ST: 'ST', EWS: 'EWS', 'VJ/NT/SBC': 'VJ' }
    : { General: 'OPEN', OBC: 'OBC-NCL', SC: 'SC', ST: 'ST', EWS: 'EWS' };   // SEBC / VJ-NT are Maharashtra categories: JoSAA treats them as Open
  const k = map[studentCategory] || 'OPEN';
  return has(k) ? k : (has('OPEN') ? 'OPEN' : (availableKeys && availableKeys[0]) || 'OPEN');
}

export function chanceFor(rank, closing) {
  if (rank == null || closing == null || !(rank > 0)) return null;
  if (rank <= closing * 0.88) return { key: 'safe', label: 'Safe' };
  if (rank <= closing)        return { key: 'likely', label: 'Likely' };
  if (rank <= closing * 1.12) return { key: 'borderline', label: 'Borderline' };
  return { key: 'out', label: 'Out of reach' };
}

export function roundValues(entry, round, pwd) {
  const r = entry && entry.rounds ? entry.rounds[round] : null;
  if (!r) return { open: null, close: null, pct: null, prep: false };
  return { open: (pwd ? r.Opening_PWD : r.Opening) ?? null, close: (pwd ? r.AIR_PWD : r.AIR) ?? null, pct: r.pct ?? null, prep: !!r.prep };
}

export const fmtNum = (v) => (v != null ? Number(v).toLocaleString('en-IN') : '—');

export const parseRank = (s) => { const n = parseInt(String(s || '').replace(/[^0-9]/g, ''), 10); return n > 0 ? n : null; };

// ── Percentile -> rank estimates (used by the engineering Predictor) ─────────────────────────────────────────────
// JEE Main: NTA publishes a percentile, not a rank. Rank is roughly (100 - percentile)% of all candidates, so the number of
// candidates matters. It is set in the config (engineeringPredictor.jeeMainCandidates) and is an ESTIMATE: not an NTA figure.
export function estimateMainRank(percentile, candidates) {
  const p = Number(percentile);
  if (!(p >= 0 && p <= 100) || !(candidates > 0)) return null;
  return Math.max(1, Math.round(((100 - p) / 100) * candidates));
}

// Maharashtra: no formula needed. Last year's results list a closing percentile next to every closing merit number, so the
// percentile -> merit relation is read straight from them. Median of the merit numbers whose closing percentile is close to
// the student's (window widens until at least 6 points are found). Returns { merit, inRange } or null without data.
export function buildMhCurve(colleges) {
  const seen = new Set(); const pairs = [];
  for (const c of colleges || []) for (const r of Object.values(c.rounds || {})) {
    if (r && r.AIR > 0 && r.pct > 0) { const k = r.pct + '|' + r.AIR; if (!seen.has(k)) { seen.add(k); pairs.push([r.pct, r.AIR]); } }
  }
  return pairs.length >= 50 ? pairs.sort((a, b) => a[0] - b[0]) : null;   // ascending percentile
}
export function estimateMhMerit(percentile, pairs) {
  const p = Number(percentile);
  if (!pairs || !(p > 0 && p <= 100)) return null;
  const lo = pairs[0][0], hi = pairs[pairs.length - 1][0];
  const inRange = p >= lo && p <= hi;
  const q = Math.min(Math.max(p, lo), hi);
  let w = 0.05, near = [];
  while (w <= 20) { near = pairs.filter(x => Math.abs(x[0] - q) <= w); if (near.length >= 6) break; w *= 2; }
  if (!near.length) return null;
  const m = near.map(x => x[1]).sort((a, b) => a - b);
  return { merit: m[Math.floor(m.length / 2)], inRange };
}

// JoSAA closing ranks for every category except Open are CATEGORY ranks (checked against the data: OBC-NCL closings are about 0.39x the
// Open ones, EWS 0.16x, SC 0.22x, ST 0.11x). So a reserved-category student must compare their category rank, not their CRL.
export const isReservedJosaa = (counselling, categoryKey) => counselling !== 'MH' && !!categoryKey && categoryKey !== 'OPEN';

// Rough category rank from a CRL estimate: CRL x the category's share of candidates. A shortcut for students who only know a percentile;
// the shares are set in the config and are estimates.
export function estimateCategoryRank(crl, categoryKey, shares) {
  if (crl == null) return null;
  if (!categoryKey || categoryKey === 'OPEN') return crl;
  const s = shares && shares[categoryKey];
  return s > 0 ? Math.max(1, Math.round(crl * s)) : null;
}
