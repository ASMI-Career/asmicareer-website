// SERVER ONLY. Reads the cutoff files with fs at BUILD time and builds ONE in-memory index per build process
// (module-level cache). Never import this file from a 'use client' component: only the per-college result that
// getCollegeCutoffs() returns is passed to the page.
//
// Name matching: normalised exact name (case, spacing and punctuation ignored). The curated rows whose cutoff-file
// name differs (renames, trust prefixes, one comma) are listed in lib/engCollegeNameMap.json (slug -> cutoff name);
// these are the same decisions that produced the `groups` of engineering-colleges.json.
//
// Two shapes of a section ("lean" for every college, "rich" for colleges that have a profile file):
//   section = { id, label, basis, rich, b:[[name, degreeIdx, years]], dg:[degree], cl:{CAT:label},
//               years:[ { y, rn:[round numbers] | null, q:[ { k, l, g:{ all:{CAT:rows}, female:{CAT:rows} } } ] } ] }   (latest year first)
//   lean row  = [branchIdx, closingRank, round]                       (final available round, gender-neutral, one year)
//   rich row  = [branchIdx, closing[], opening[], closingPwd[]]       (arrays follow rn; null = no data for that round)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'public/data/cutoffs');
const NAME_MAP = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/engCollegeNameMap.json'), 'utf8'));

export const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const QUOTA_LABEL = {
  'all-india': 'All India', 'home-state': 'Home State', 'other-state': 'Other State', goa: 'Goa', jk: 'J&K', ladakh: 'Ladakh',
  'dasa-ciwg': 'DASA (CIWG)', 'dasa-non-ciwg': 'DASA (Non-CIWG)',
};
// which quota is used for the headline numbers / summary text
const QUOTA_PREF = {
  josaa: ['all-india', 'other-state', 'home-state', 'goa', 'jk', 'ladakh'],
  csab: ['all-india', 'other-state', 'home-state', 'goa', 'jk', 'ladakh'],
  dasa: ['dasa-non-ciwg', 'dasa-ciwg'],
  mhcap: ['state-level', 'all-india', 'other-than-home-university', 'home-university', 'minority'],
};

let INDEX = null;
let MH_LABELS = { quotas: {}, cats: {} };

const roundNo = (r) => Number(String(r).replace(/\D+/g, '')) || 0;

// one cutoff record -> { c:[closing per round], o:[opening per round], p:[closing PwD per round] } (index = round-1)
function compactRounds(rounds) {
  let max = 0; for (const r of Object.keys(rounds || {})) max = Math.max(max, roundNo(r));
  const c = new Array(max).fill(null), o = new Array(max).fill(null), p = new Array(max).fill(null);
  let any = false;
  for (const [r, v] of Object.entries(rounds || {})) {
    const i = roundNo(r) - 1; if (i < 0 || !v) continue;
    if (typeof v.AIR === 'number') { c[i] = v.AIR; any = true; }
    if (typeof v.Opening === 'number') o[i] = v.Opening;
    if (typeof v.AIR_PWD === 'number') p[i] = v.AIR_PWD;
  }
  return any ? { c, o, p } : null;
}
const lastIdx = (arr) => { for (let i = arr.length - 1; i >= 0; i--) if (arr[i] !== null) return i; return -1; };

function listDirs(dir) { try { return fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name); } catch { return []; } }
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'all.json' || e.name === 'female-only.json') out.push(p);
  }
  return out;
}

function buildIndex() {
  if (INDEX) return INDEX;
  const idx = new Map();   // normName -> { name, recs: [ {src, year, quota, gender, cat, program, mhType, c, o, p} ] }
  for (const [dirName, src] of [['JOSAA', 'jo'], ['CSAB', 'csab'], ['MH_ENGG', 'mh']]) {
    for (const yearDir of listDirs(path.join(ROOT, dirName)).filter(d => /^\d{4}$/.test(d))) {
      const year = Number(yearDir);
      const base = path.join(/*turbopackIgnore: true*/ ROOT, dirName, yearDir);
      for (const f of walk(base)) {
        const rel = path.relative(base, f).split(path.sep);   // quota / category / (all|female-only).json
        if (rel.length !== 3) continue;
        const [quota, cat, file] = rel; const gender = file === 'all.json' ? 'all' : 'female';
        if (gender === 'female' && src !== 'jo') continue;   // the female-only pool is read for JoSAA only
        let data; try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
        for (const c of data.colleges || []) {
          const cr = compactRounds(c.rounds); if (!cr) continue;
          const k = norm(c.name);
          let e = idx.get(k); if (!e) idx.set(k, e = { name: c.name, recs: [] });
          e.recs.push({ src, year, quota, gender, cat, program: c.program, mhType: src === 'mh' ? c.type : null, ...cr });
        }
      }
    }
  }
  try {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'MH_ENGG', '2026', 'manifest.json'), 'utf8'));
    MH_LABELS = { quotas: {}, cats: {} };
    for (const q of m.quotas || []) { MH_LABELS.quotas[q.key] = q.label; for (const c of q.categories || []) MH_LABELS.cats[c.key] = c.label; }
  } catch { /* labels fall back to the keys */ }
  INDEX = idx;
  return idx;
}

// `program` is written "Branch name (N Years, Degree)" in the JoSAA/CSAB files; the Maharashtra CAP files carry no degree or
// duration at all. We only read what the string says: no parse -> degree null.
const tidy = (x) => String(x || '').replace(/\s+for DASA[- ]?(Non[- ]?)?CIWG/i, '').replace(/\s+/g, ' ').trim();
const PROGRAM_RE = /^(.*?)\s*\((\d+(?:\.\d+)?)\s*Years?,\s*(.+)\)\s*$/i;
export function parseProgram(raw) {
  const m = PROGRAM_RE.exec(String(raw || ''));
  return m ? { n: tidy(m[1]), y: Number(m[2]), d: m[3].trim() } : { n: String(raw || '').replace(/\s+/g, ' ').trim(), y: 0, d: null };
}
// Architecture and Planning use a different entrance paper, so they are listed in the table but left out of the headline numbers
export const isTechBranch = (sec, bidx) => { const [n, di] = sec.b[bidx]; return !/architecture|planning/i.test(n + ' ' + (di >= 0 ? sec.dg[di] : '')); };
const CAT_ORDER = ['OPEN', 'EWS', 'OBC-NCL', 'OBC', 'SEBC', 'SC', 'ST', 'VJ', 'NT1', 'NT2', 'NT3'];
const catSort = (a, b) => { const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b); };

function makeSection(id, label, basis, recs, { rich, mhType }) {
  const use = recs.filter(r => (id !== 'mhcap' || !mhType || r.mhType === mhType) && (rich || r.gender === 'all'));
  if (!use.length) return null;
  const branchIdx = new Map(); const branches = []; const degrees = [];
  const bi = (program) => {
    const k = String(program);   // distinct programs stay distinct (the same name can exist in more than one degree)
    if (!branchIdx.has(k)) {
      const pp = parseProgram(k); let di = -1;
      if (pp.d) { di = degrees.indexOf(pp.d); if (di < 0) { di = degrees.length; degrees.push(pp.d); } }
      branchIdx.set(k, branches.length); branches.push([pp.n, di, pp.y]);
    }
    return branchIdx.get(k);
  };
  const pref = QUOTA_PREF[id];
  const yearsAll = [...new Set(use.map(r => r.year))].sort((a, b) => b - a);
  const years = rich ? yearsAll : [yearsAll[0]];   // lean: latest year only
  const yearObjs = [];
  const catSet = new Set();
  for (const y of years) {
    const ry = use.filter(r => r.year === y);
    const maxRound = Math.max(...ry.map(r => r.c.length));
    const quotaKeys = [...new Set(ry.map(r => r.quota))];
    const qs = [];
    for (const qk of quotaKeys) {
      const g = {};
      for (const gender of (rich ? ['all', 'female'] : ['all'])) {
        const byCat = new Map();
        for (const r of ry.filter(x => x.quota === qk && x.gender === gender)) {
          if (!byCat.has(r.cat)) byCat.set(r.cat, []);
          byCat.get(r.cat).push(r);
        }
        const out = {};
        for (const [cat, rs] of byCat) {
          const rows = [];
          for (const r of rs) {
            if (rich) {
              const pad = (a) => { const x = a.slice(); while (x.length < maxRound) x.push(null); return x; };
              const o = r.o.some(v => v !== null) ? pad(r.o) : []; const p = r.p.some(v => v !== null) ? pad(r.p) : [];
              rows.push([bi(r.program), pad(r.c), o, p]);
            } else {
              const li = lastIdx(r.c); rows.push([bi(r.program), r.c[li], li + 1]);
            }
          }
          const key = (row) => (rich ? row[1][lastIdx(row[1])] : row[1]);
          rows.sort((a, b) => key(a) - key(b) || a[0] - b[0]);
          out[cat] = rows; catSet.add(cat);
        }
        if (Object.keys(out).length) g[gender] = out;
      }
      if (Object.keys(g).length) qs.push({ k: qk, l: id === 'mhcap' ? (MH_LABELS.quotas[qk] || qk) : (QUOTA_LABEL[qk] || qk), g });
    }
    qs.sort((a, b) => { const ia = pref.indexOf(a.k), ib = pref.indexOf(b.k); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
    if (qs.length) yearObjs.push({ y, rn: rich ? Array.from({ length: maxRound }, (_, i) => i + 1) : null, q: qs });
  }
  if (!yearObjs.length) return null;
  const cl = {}; for (const k of [...catSet].sort(catSort)) cl[k] = id === 'mhcap' ? (MH_LABELS.cats[k] || k) : k;
  return { id, label, basis, rich: !!rich, b: branches, dg: degrees, cl, years: yearObjs };
}

// rows of the headline quota's OPEN list in the latest year (gender-neutral, final available round) as { bi, rank, round }
export function openRows(sec) {
  const yo = sec.years[0]; const q = yo.q.find(x => x.g.all && x.g.all.OPEN); if (!q) return null;
  const rows = q.g.all.OPEN.map(r => {
    if (!sec.rich) return { bi: r[0], rank: r[1], round: r[2] };
    const li = lastIdx(r[1]); return { bi: r[0], rank: r[1][li], round: yo.rn[li], open: r[2].length ? r[2][li] : null };
  });
  return { year: yo.y, quota: q.l, rows };
}

// the OPEN closing ranks of the section's headline quota, for summary text and the stat strip
export function sectionSummary(sec) {
  const o = openRows(sec); if (!o) return null;
  const rows = o.rows.filter(r => isTechBranch(sec, r.bi)); if (!rows.length) return null;
  rows.sort((a, b) => a.rank - b.rank);
  const ranks = rows.map(r => r.rank); const rounds = rows.map(r => r.round); const best = rows[0];
  return { year: o.year, quota: o.quota, branches: rows.length, min: Math.min(...ranks), max: Math.max(...ranks), roundMax: Math.max(...rounds), roundMin: Math.min(...rounds), bestBranch: sec.b[best.bi][0], bestRank: best.rank, bestRound: best.round };
}

// 2025 vs 2026 final-round OPEN closing rank per programme, gender-neutral, headline quota. Server-rendered only (not sent to the browser).
export function yearComparison(sec) {
  if (sec.years.length < 2) return null;
  const [a, b] = sec.years;   // latest first
  const pick = (yo) => { const q = yo.q.find(x => x.g.all && x.g.all.OPEN); if (!q) return null; const m = new Map(); for (const r of q.g.all.OPEN) { const arr = sec.rich ? r[1] : null; const li = sec.rich ? lastIdx(arr) : -1; m.set(r[0], sec.rich ? { rank: arr[li], round: yo.rn[li] } : { rank: r[1], round: r[2] }); } return m; };
  const ma = pick(a), mb = pick(b); if (!ma || !mb) return null;
  const rows = [];
  for (const [bidx, va] of ma) { const vb = mb.get(bidx); if (vb) rows.push({ bi: bidx, latest: va, prev: vb }); }
  if (!rows.length) return null;
  rows.sort((x, y) => x.latest.rank - y.latest.rank);
  return { latestYear: a.y, prevYear: b.y, rows };
}

// Returns { matched, sections } for one directory row. `college` is a row of engineering-colleges.json.
// { rich: true } adds every round, both genders, opening and PwD ranks and every year on disk (used for colleges with a profile).
export function getCollegeCutoffs(college, { rich = false } = {}) {
  const idx = buildIndex();
  const map = NAME_MAP[college.slug] || {};
  const e = idx.get(norm(map.name || college.name));
  if (!e) return { matched: false, sections: [] };
  const isIIT = college.type === 'IIT';
  const jeeBasis = isIIT ? 'JEE Advanced rank' : 'JEE Main rank';
  const by = (src, pred = () => true) => e.recs.filter(r => r.src === src && pred(r));
  const opt = { rich, mhType: map.mhType || null };
  const sections = [
    makeSection('josaa', 'JoSAA', jeeBasis, by('jo'), opt),
    makeSection('csab', 'CSAB', jeeBasis, by('csab', r => !r.quota.startsWith('dasa-')), opt),
    makeSection('dasa', 'DASA', 'JEE Main rank (DASA)', by('csab', r => r.quota.startsWith('dasa-')), opt),
    makeSection('mhcap', 'Maharashtra CAP', 'State merit number', by('mh'), opt),
  ].filter(Boolean);
  return { matched: sections.length > 0, sections };
}

export function matchStats(colleges) {
  let n = 0; const none = [];
  for (const c of colleges) { if (getCollegeCutoffs(c).matched) n++; else none.push(c.name); }
  return { matched: n, total: colleges.length, none };
}
