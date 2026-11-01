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
