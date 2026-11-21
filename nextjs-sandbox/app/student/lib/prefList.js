// Preference List generator: pure functions, no React. Builds an ordered list of institute + branch choices from last year's cutoff data
// and the student's ranks, for JoSAA ('JOSAA') and Maharashtra CAP ('MH') separately. CSAB is not supported in this version.
// It reuses chanceFor / roundValues / pickRank from lib/engCutoff.js, so Safe / Likely / Borderline mean exactly what they mean in the Explorer.
import { chanceFor, roundValues, pickRank, isReservedJosaa, quotaLabelOf } from './engCutoff.js';

export const DREAM_OPTIONS = [
  { key: 'off', label: 'Off (Borderline is the furthest)', factor: null },
  { key: '1.5', label: 'Dream up to 1.5x the closing rank', factor: 1.5 },
  { key: '2', label: 'Dream up to 2x the closing rank', factor: 2 },
  { key: '3', label: 'Dream up to 3x the closing rank', factor: 3 },
];
export const DEFAULT_DREAM = 1.5;
export const MAX_ROWS_DEFAULT = 100;
export const MAX_ROWS_LIMIT = 300;

export const TAG_LABELS = { safe: 'Safe', likely: 'Likely', borderline: 'Borderline', dream: 'Dream', out: 'Out of reach', none: 'Add your rank' };

const lc = (s) => String(s || '').toLowerCase();

// ── Branch families ────────────────────────────────────────────────────────────────────────────────────────────────
// A family is { id, label, keywords: [...], catchAll?: true } from public/data/branchFamilies.json, or { id, label, exact: 'Program name' }.
const keywordMatch = (fam, program) => { const p = lc(program); return (fam.keywords || []).some(k => p.includes(lc(k))); };
export function familyMatches(fam, program, allFamilies) {
  if (fam.exact !== undefined) return program === fam.exact;
  if (fam.catchAll) return !(allFamilies || []).some(f => !f.catchAll && keywordMatch(f, program));
  return keywordMatch(fam, program);
}
// Programs that only the catch-all family picks up (so the team can add keywords for them).
export function programsInCatchAll(families, programs) {
  return programs.filter(p => !families.some(f => !f.catchAll && keywordMatch(f, p)));
}
// Which families a free-text desired branch (from the profile) belongs to: the first family whose label or keywords it contains.
export function familyForDesired(text, families) {
  const t = lc(text);
  if (!t) return null;
  const f = families.find(f => !f.catchAll && (t.includes(lc(f.id)) || (f.keywords || []).some(k => t.includes(lc(k)) || lc(k).includes(t))));
  return f ? f.id : null;
}

// ── Rows ───────────────────────────────────────────────────────────────────────────────────────────────────────────
// The closing rank of a record: the final round that has a value (or the one round the student chose). PwD values as roundValues does.
export function closingFor(rec, rounds, pwd, round) {
  const order = round ? [round] : [...(rounds || [])].reverse();
  for (const r of order) {
    const v = roundValues(rec, r, !!pwd);
    if (v.close != null) return { close: v.close, round: r, pct: v.pct, prep: v.prep };
  }
  return null;
}

export const recordKey = (counselling, institute, program, quotaLabel, gender, choiceCode) =>
  `${institute}|${program}|${quotaLabel}|${gender || 'all'}` + (counselling === 'MH' ? `|${choiceCode || ''}` : '');

// Safe / Likely / Borderline come from chanceFor. Beyond Borderline, "Dream" if the rank is within dreamFactor x the closing rank.
export function tagFor(rank, close, dreamFactor) {
  const c = chanceFor(rank, close);
  if (!c) return null;
  if (c.key !== 'out') return c.key;
  if (dreamFactor && rank <= close * dreamFactor) return 'dream';
  return 'out';
}

// One record -> one row (or null when the closing value or the student's rank is missing). allowOut keeps "Out of reach" (manual picks).
export function rowFromRecord(ctx, rec, { allowOut = false } = {}) {
  const { counselling, rankFor, rounds, round, pwd, dreamFactor, quota, gender, manifest } = ctx;
  const cv = closingFor(rec, rounds, pwd, round);
  if (!cv) return null;
  const rank = rankFor(rec);
  const quotaLabel = quotaLabelOf(counselling, rec._quota || quota, manifest);
  let tag = rank == null ? 'none' : tagFor(rank, cv.close, dreamFactor);
  if (tag === 'out' && !allowOut) return null;
  if (!tag) return null;
  return {
    key: recordKey(counselling, rec.name, rec.program, quotaLabel, gender, rec.choiceCode),
    counselling, institute: rec.name, program: rec.program, type: rec.type || '', quota: quotaLabel, gender: gender || 'all',
    choiceCode: counselling === 'MH' ? (rec.choiceCode || '') : '', closing: cv.close, round: cv.round, rankUsed: rank, tag, tagLabel: TAG_LABELS[tag], pinned: false,
  };
}

// ── The generator ──────────────────────────────────────────────────────────────────────────────────────────────────
export function buildList({
  counselling, records, studentRanks, category, pwd = false, rounds = [], round = null, mode = 'branch', branchFamilies = [], allFamilies = null,
  filters = {}, dreamFactor = DEFAULT_DREAM, maxRows = MAX_ROWS_DEFAULT, quota = '', gender = 'all', manifest = null,
}) {
  const warnings = [];
  if (counselling !== 'JOSAA' && counselling !== 'MH') return { rows: [], warnings: ['This counselling is not supported in the list generator yet.'] };
  const isMH = counselling === 'MH';
  const reserved = isReservedJosaa(counselling, category);
  const ranks = studentRanks || {};
  const rankFor = (c) => (isMH ? (ranks.merit ?? null) : pickRank(counselling, c.type, reserved, ranks));
  const cap = Math.min(Math.max(parseInt(maxRows, 10) || MAX_ROWS_DEFAULT, 1), MAX_ROWS_LIMIT);
  const fams = allFamilies || branchFamilies;
  const ctx = { counselling, rankFor, rounds, round, pwd, dreamFactor, quota, gender, manifest };

  // filters
  const types = filters.types && filters.types.length ? filters.types : null;
  const needle = lc(filters.name).trim();
  const pool = (records || []).filter(c =>
    (!types || types.includes(c.type)) &&
    (!needle || lc(c.name).includes(needle)) &&
    (!isMH || !filters.autonomousOnly || c.autonomous === true) &&
    (!isMH || !filters.university || c.homeUniversity === filters.university));

  // missing ranks: skip those records and say how to include them (never fall back to another rank)
  const missing = new Set();
  const candidates = [];
  for (const c of pool) {
    const rank = rankFor(c);
    if (rank == null) { missing.add(isMH ? 'MH' : (c.type === 'IIT' ? 'IIT' : 'MAIN')); continue; }
    const row = rowFromRecord(ctx, c);
    if (row) candidates.push({ row, rec: c });
  }
  if (missing.has('MH')) warnings.push('Add your MHT-CET SML rank (state merit number) in Settings to build a Maharashtra list.');
  if (missing.has('IIT')) warnings.push(reserved ? 'Add your JEE Advanced category rank in Settings to include IITs.' : 'Add your JEE Advanced rank in Settings to include IITs.');
  if (missing.has('MAIN')) warnings.push(reserved ? 'Add your JEE Main category rank in Settings to include NITs, IIITs and GFTIs.' : 'Add your JEE Main rank in Settings to include NITs, IIITs and GFTIs.');

  // JoSAA: IIT ranks (Advanced) and the others (Main) are different lists, so the two blocks are never mixed in one sort.
  const block = (r) => (!isMH && r.type === 'IIT' ? 0 : 1);
  const cmp = (a, b) => block(a) - block(b) || a.closing - b.closing || a.institute.localeCompare(b.institute) || a.program.localeCompare(b.program);

  let ordered = [];
  if (branchFamilies.length && mode === 'branch') {
    const used = new Set();
    for (const fam of branchFamilies) {
      const part = candidates.filter(x => !used.has(x.row.key) && familyMatches(fam, x.row.program, fams)).map(x => x.row).sort(cmp);
      part.forEach(r => used.add(r.key));
      ordered = ordered.concat(part);
    }
  } else {
    const keep = branchFamilies.length ? candidates.filter(x => branchFamilies.some(f => familyMatches(f, x.row.program, fams))) : candidates;
    ordered = keep.map(x => x.row).sort(cmp);
  }
  // a record appears once
  const seen = new Set();
  ordered = ordered.filter(r => (seen.has(r.key) ? false : (seen.add(r.key), true)));

  if (ordered.length > cap) {
    warnings.push(`Showing the first ${cap} of ${ordered.length} matching choices. Narrow the branches or filters, or raise the maximum (up to ${MAX_ROWS_LIMIT}).`);
    ordered = ordered.slice(0, cap);
  }
  if (ordered.length === 0 && warnings.length === 0) warnings.push('No choices matched. Try another category or quota, more branches, or a higher Dream setting.');
  return { rows: ordered, warnings };
}

// ── Helpers for the UI ─────────────────────────────────────────────────────────────────────────────────────────────
export const tagCounts = (rows) => rows.reduce((n, r) => { n[r.tag] = (n[r.tag] || 0) + 1; return n; }, { safe: 0, likely: 0, borderline: 0, dream: 0, out: 0, none: 0 });

// Records indexed by row key, so saved rows and manual picks can be matched to the loaded data.
export function indexRecords({ counselling, records, quota, gender, manifest }) {
  const m = new Map();
  for (const rec of records || []) {
    const q = quotaLabelOf(counselling, rec._quota || quota, manifest);
    m.set(recordKey(counselling, rec.name, rec.program, q, gender, rec.choiceCode), rec);
  }
  return m;
}

// Regenerate keeps pinned rows at their positions: the new list is laid out first, then each pinned row goes back to its old index.
export function mergePinned(newRows, oldRows) {
  const out = newRows.filter(r => !oldRows.some(o => o.pinned && o.key === r.key));
  oldRows.forEach((o, i) => { if (o.pinned) out.splice(Math.min(i, out.length), 0, o); });
  return out;
}

const csvCell = (v) => {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s;   // never let a spreadsheet read a text cell as a formula
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
export function toCsv(rows) {
  const head = ['No', 'Institute', 'Branch', 'Type', 'Quota/Seat', 'ChoiceCode', 'Closing', 'Round', 'YourRank', 'Tag'];
  const lines = [head.join(',')].concat(rows.map((r, i) => [i + 1, r.institute, r.program, r.type, r.quota + (r.gender === 'female-only' ? ' (Female-only)' : ''), r.choiceCode, r.closing, r.round, r.rankUsed ?? '', r.pinned ? `Your pick (${r.tagLabel})` : r.tagLabel].map(csvCell).join(',')));
  return '﻿' + lines.join('\r\n') + '\r\n';
}
