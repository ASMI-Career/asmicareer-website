// SERVER ONLY. Reads the cutoff files with fs at BUILD time and builds ONE in-memory index per build process
// (module-level cache). Never import this file from a 'use client' component: only the small per-college result
// that getCollegeCutoffs() returns is passed to the page.
//
// Name matching: normalised exact name (case, spacing and punctuation ignored). The curated rows whose cutoff-file
// name differs (renames, trust prefixes, one comma) are listed in lib/engCollegeNameMap.json (slug -> cutoff name);
// these are the same decisions that produced the `groups` of engineering-colleges.json.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'public/data/cutoffs');
const NAME_MAP = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'lib/engCollegeNameMap.json'), 'utf8'));

export const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const YEARS = { JOSAA: 2026, CSAB: 2026, MH_ENGG: 2026 };
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
let MH_LABELS = null;

const roundNo = (r) => Number(String(r).replace(/\D+/g, '')) || 0;
// the last round that has a closing rank for this record
function finalRound(rounds) {
  let best = null;
  for (const [r, v] of Object.entries(rounds || {})) {
    if (v && typeof v.AIR === 'number' && (best === null || roundNo(r) > best[0])) best = [roundNo(r), v.AIR];
  }
  return best;   // [round, rank] or null
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name === 'all.json') out.push(p);   // gender "all" only
  }
  return out;
}

function buildIndex() {
  if (INDEX) return INDEX;
  const idx = new Map();   // normName -> { jo, csab, mh }   each: Map quota -> Map category -> Map program -> {rank, round, mhType?}
  const put = (name, src, quota, cat, program, rank, round, extra) => {
    const k = norm(name);
    let e = idx.get(k); if (!e) idx.set(k, e = { name, jo: new Map(), csab: new Map(), mh: new Map() });
    const bySrc = e[src];
    let q = bySrc.get(quota); if (!q) bySrc.set(quota, q = new Map());
    let c = q.get(cat); if (!c) q.set(cat, c = new Map());
    c.set(extra ? extra + '|' + program : program, { program, rank, round, mhType: extra || null });
  };
  for (const [dirName, src] of [['JOSAA', 'jo'], ['CSAB', 'csab'], ['MH_ENGG', 'mh']]) {
    const base = path.join(/*turbopackIgnore: true*/ ROOT, dirName, String(YEARS[dirName]));
    for (const f of walk(base)) {
      const rel = path.relative(base, f).split(path.sep);   // quota / category / all.json
      if (rel.length !== 3) continue;
      const [quota, cat] = rel;
      let data; try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { continue; }
      for (const c of data.colleges || []) {
        const fr = finalRound(c.rounds); if (!fr) continue;
        put(c.name, src, quota, cat, c.program, fr[1], fr[0], src === 'mh' ? c.type : null);
      }
    }
  }
  try {
    const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'MH_ENGG', '2026', 'manifest.json'), 'utf8'));
    MH_LABELS = { quotas: {}, cats: {} };
    for (const q of m.quotas || []) { MH_LABELS.quotas[q.key] = q.label; for (const c of q.categories || []) MH_LABELS.cats[c.key] = c.label; }
  } catch { MH_LABELS = { quotas: {}, cats: {} }; }
  INDEX = idx;
  return idx;
}

// `program` is written "Branch name (N Years, Degree)" in the JoSAA/CSAB files; the Maharashtra CAP files carry no degree or
// duration at all. We only read what the string says: no parse -> degree null (shown under "Other programmes" or, when the
// whole section has none, as a plain list).
const tidy = (x) => String(x || '').replace(/\s+for DASA[- ]?(Non[- ]?)?CIWG/i, '').replace(/\s+/g, ' ').trim();
const PROGRAM_RE = /^(.*?)\s*\((\d+(?:\.\d+)?)\s*Years?,\s*(.+)\)\s*$/i;
export function parseProgram(raw) {
  const m = PROGRAM_RE.exec(String(raw || ''));
  return m ? { n: tidy(m[1]), y: Number(m[2]), d: m[3].trim() } : { n: String(raw || '').replace(/\s+/g, ' ').trim(), y: 0, d: null };   // no parse: keep the raw text
}
// Architecture and Planning use a different entrance paper, so they are listed in the table but left out of the headline numbers
export const isTechBranch = (sec, bidx) => { const [n, di] = sec.b[bidx]; return !/architecture|planning/i.test(n + ' ' + (di >= 0 ? sec.dg[di] : '')); };
const CAT_ORDER = ['OPEN', 'EWS', 'OBC-NCL', 'OBC', 'SEBC', 'SC', 'ST', 'VJ', 'NT1', 'NT2', 'NT3'];
const catSort = (a, b) => { const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b); };

function makeSection(id, label, year, basis, quotaMap, college, mhType) {
  // quotaMap: Map quota -> Map cat -> Map programKey -> rec
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
  const quotas = [];
  for (const [quota, cats] of quotaMap) {
    const out = {};
    for (const [cat, progs] of cats) {
      const rows = [];
      for (const rec of progs.values()) {
        if (id === 'mhcap' && mhType && rec.mhType !== mhType) continue;
        rows.push([bi(rec.program), rec.rank, rec.round]);
      }
      if (rows.length) { rows.sort((a, b) => a[1] - b[1] || a[0] - b[0]); out[cat] = rows; }
    }
    if (Object.keys(out).length) quotas.push({ k: quota, l: id === 'mhcap' ? (MH_LABELS.quotas[quota] || quota) : (QUOTA_LABEL[quota] || quota), c: out });
  }
  if (!quotas.length) return null;
  quotas.sort((a, b) => { const ia = pref.indexOf(a.k), ib = pref.indexOf(b.k); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); });
  const catKeys = [...new Set(quotas.flatMap(q => Object.keys(q.c)))].sort(catSort);
  const cl = {}; for (const k of catKeys) cl[k] = id === 'mhcap' ? (MH_LABELS.cats[k] || k) : k;
  return { id, label, year, basis, b: branches, dg: degrees, q: quotas, cl };
}

// the OPEN closing ranks of the section's headline quota, for summary text and the stat strip
export function sectionSummary(sec) {
  const q = sec.q.find(x => x.c.OPEN); if (!q) return null;
  const rows = q.c.OPEN.filter(r => isTechBranch(sec, r[0])); if (!rows.length) return null;
  const ranks = rows.map(r => r[1]); const rounds = rows.map(r => r[2]);
  const best = rows[0];
  return { quota: q.l, branches: rows.length, min: Math.min(...ranks), max: Math.max(...ranks), roundMax: Math.max(...rounds), roundMin: Math.min(...rounds), bestBranch: sec.b[best[0]][0], bestRank: best[1], bestRound: best[2] };
}

// Returns { matched, sections } for one directory row. `college` is a row of engineering-colleges.json.
export function getCollegeCutoffs(college) {
  const idx = buildIndex();
  const map = NAME_MAP[college.slug] || {};
  const e = idx.get(norm(map.name || college.name));
  if (!e) return { matched: false, sections: [] };
  const isIIT = college.type === 'IIT';
  const sections = [];
  const jo = makeSection('josaa', 'JoSAA', YEARS.JOSAA, isIIT ? 'JEE Advanced rank' : 'JEE Main rank', e.jo, college);
  if (jo) sections.push(jo);
  const csabAll = new Map([...e.csab].filter(([k]) => !k.startsWith('dasa-')));
  const dasaAll = new Map([...e.csab].filter(([k]) => k.startsWith('dasa-')));
  const cs = makeSection('csab', 'CSAB', YEARS.CSAB, isIIT ? 'JEE Advanced rank' : 'JEE Main rank', csabAll, college);
  if (cs) sections.push(cs);
  const da = makeSection('dasa', 'DASA', YEARS.CSAB, 'JEE Main rank (DASA)', dasaAll, college);
  if (da) sections.push(da);
  const mh = makeSection('mhcap', 'Maharashtra CAP', YEARS.MH_ENGG, 'State merit number', e.mh, college, map.mhType || null);
  if (mh) sections.push(mh);
  return { matched: sections.length > 0, sections };
}

export function matchStats(colleges) {
  let n = 0; const none = [];
  for (const c of colleges) { if (getCollegeCutoffs(c).matched) n++; else none.push(c.name); }
  return { matched: n, total: colleges.length, none };
}
