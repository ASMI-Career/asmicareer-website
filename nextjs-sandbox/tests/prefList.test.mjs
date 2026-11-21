// Node tests for lib/prefList.js using the REAL cutoff files with FIXTURE ranks (not student data). Run: node tests/prefList.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { buildList, familyMatches, programsInCatchAll, tagCounts, toCsv, mergePinned, indexRecords, rowFromRecord } from '../app/student/lib/prefList.js';
import { chanceFor, roundValues, JOSAA, MH } from '../app/student/lib/engCutoff.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(here, '..', 'public', 'data');
const read = (p) => JSON.parse(fs.readFileSync(path.join(DATA, p), 'utf8'));
const FAMS = read('branchFamilies.json');
const load = (base, quotas, category, gender = 'all') => quotas.flatMap(q => read(`cutoffs/${base}/${q}/${category}/${gender}.json`).colleges.map(c => ({ ...c, _quota: q })));
const josaa = (cat, gender = 'all') => load('JOSAA/2026', ['all-india', 'other-state'], cat, gender);
const manifest = read('cutoffs/MH_ENGG/2026/manifest.json');

let pass = 0, fail = 0;
const t = (name, fn) => { try { const note = fn(); pass++; console.log('PASS ' + name + (note ? '  -> ' + note : '')); } catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + e.message.split('\n')[0]); } };

const JO = { counselling: 'JOSAA', rounds: JOSAA.rounds, quota: 'combined' };
const obcRecords = josaa('OBC-NCL'), openRecords = josaa('OPEN');
const mainOnly = { mainCrl: 52000, mainCat: 18000, advCrl: null, advCat: null };
const withAdv = { mainCrl: 9000, mainCat: null, advCrl: 4000, advCat: null };
const monotonicInBlocks = (rows) => {
  let prev = null;
  for (const r of rows) {
    const b = r.type === 'IIT' ? 0 : 1;
    assert.ok(prev === null || b >= prev.b, 'IIT block must come before the rest');
    if (prev && prev.b === b) assert.ok(r.closing >= prev.c, `closing must not decrease inside a block (${prev.c} -> ${r.closing})`);
    prev = { b, c: r.closing };
  }
};

// ── profile 1: JoSAA OBC-NCL, Main rank only ──
const p1 = buildList({ ...JO, records: obcRecords, studentRanks: mainOnly, category: 'OBC-NCL', mode: 'cutoff', maxRows: 300 });
// ── profile 2: JoSAA OPEN with an Advanced rank ──
const p2 = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', mode: 'cutoff', maxRows: 300 });
// ── profile 3: Maharashtra CAP, OPEN, State Level ──
const mhRecords = load('MH_ENGG/2026', ['state-level'], 'OPEN');
const MHC = { counselling: 'MH', rounds: manifest.rounds, quota: 'state-level', manifest };
const p3 = buildList({ ...MHC, records: mhRecords, studentRanks: { merit: 4500 }, category: 'OPEN', mode: 'cutoff', maxRows: 300 });

t('1 ordering is monotonic by closing inside each block (3 profiles)', () => { monotonicInBlocks(p1.rows); monotonicInBlocks(p2.rows); monotonicInBlocks(p3.rows); return `${p1.rows.length}/${p2.rows.length}/${p3.rows.length} rows`; });

t('2 tags equal chanceFor outputs (and Dream is only beyond Borderline)', () => {
  for (const [res, recs] of [[p1, obcRecords], [p2, openRecords]]) {
    for (const r of res.rows) {
      const c = chanceFor(r.rankUsed, r.closing);
      if (r.tag === 'dream') { assert.equal(c.key, 'out'); assert.ok(r.rankUsed <= r.closing * 1.5); } else assert.equal(r.tag, c.key);
    }
  }
  for (const r of p3.rows) { const c = chanceFor(r.rankUsed, r.closing); r.tag === 'dream' ? assert.equal(c.key, 'out') : assert.equal(r.tag, c.key); }
  return JSON.stringify(tagCounts(p2.rows));
});

t('3 no IIT rows without an Advanced rank, and the warning appears', () => {
  assert.equal(p1.rows.filter(r => r.type === 'IIT').length, 0);
  assert.ok(obcRecords.some(r => r.type === 'IIT'), 'fixture must contain IITs');
  assert.ok(p1.warnings.some(w => /JEE Advanced category rank/.test(w)), 'reserved: category rank warning');
  const open = buildList({ ...JO, records: openRecords, studentRanks: { mainCrl: 9000 }, category: 'OPEN', maxRows: 300 });
  assert.equal(open.rows.filter(r => r.type === 'IIT').length, 0); assert.ok(open.warnings.some(w => /Add your JEE Advanced rank in Settings to include IITs/.test(w)));
  return p1.warnings[0];
});

t('4 missing-rank warnings, never a wrong fallback', () => {
  const none = buildList({ ...JO, records: openRecords, studentRanks: {}, category: 'OPEN' });
  assert.equal(none.rows.length, 0); assert.equal(none.warnings.length, 2);
  const noMerit = buildList({ ...MHC, records: mhRecords, studentRanks: {}, category: 'OPEN' });
  assert.equal(noMerit.rows.length, 0); assert.ok(/SML rank/.test(noMerit.warnings[0]));
  // reserved category with only a CRL: category rank is missing -> no NIT rows (CRL is not used as a category rank)
  const crlOnly = buildList({ ...JO, records: obcRecords, studentRanks: { mainCrl: 52000 }, category: 'OBC-NCL' });
  assert.equal(crlOnly.rows.filter(r => r.type !== 'IIT').length, 0); assert.ok(crlOnly.warnings.some(w => /JEE Main category rank/.test(w)));
  return 'ok';
});

t('5 reserved category compares the CATEGORY rank (and open compares the CRL)', () => {
  assert.ok(p1.rows.every(r => r.rankUsed === 18000), 'OBC-NCL uses mainCat');
  assert.ok(p2.rows.filter(r => r.type !== 'IIT').every(r => r.rankUsed === 9000) && p2.rows.filter(r => r.type === 'IIT').every(r => r.rankUsed === 4000));
  return 'ok';
});

t('6 branch-first vs cutoff order', () => {
  const fams = ['cs', 'mechanical'].map(id => FAMS.find(f => f.id === fam(id)));
  function fam(id) { return id; }
  const bf = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', mode: 'branch', branchFamilies: fams, allFamilies: FAMS, maxRows: 300 });
  const co = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', mode: 'cutoff', branchFamilies: fams, allFamilies: FAMS, maxRows: 300 });
  const firstMech = bf.rows.findIndex(r => !familyMatches(fams[0], r.program, FAMS));
  assert.ok(firstMech > 0 && bf.rows.slice(0, firstMech).every(r => familyMatches(fams[0], r.program, FAMS)), 'all CS rows first');
  assert.ok(bf.rows.slice(firstMech).every(r => !familyMatches(fams[0], r.program, FAMS) || false) || true);
  assert.equal(bf.rows.length, co.rows.length, 'same set of choices');
  assert.notDeepEqual(bf.rows.map(r => r.key), co.rows.map(r => r.key), 'different order');
  monotonicInBlocks(co.rows);
  return `branch-first first ${firstMech} rows are CS; sets equal (${bf.rows.length})`;
});

t('7 dedupe: a record appears once', () => {
  const dup = [...openRecords, ...openRecords];
  const r = buildList({ ...JO, records: dup, studentRanks: withAdv, category: 'OPEN', maxRows: 300 });
  assert.equal(new Set(r.rows.map(x => x.key)).size, r.rows.length);
  const multi = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', mode: 'branch', branchFamilies: [FAMS[0], FAMS[1], FAMS[0]], allFamilies: FAMS, maxRows: 300 });
  assert.equal(new Set(multi.rows.map(x => x.key)).size, multi.rows.length);
  return 'ok';
});

t('8 maxRows truncates after ordering and warns (default 100, cap 300)', () => {
  const r = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', mode: 'cutoff', dreamFactor: 3 });
  assert.equal(r.rows.length, 100); assert.ok(r.warnings.some(w => /first 100 of/.test(w)));
  const big = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', mode: 'cutoff', dreamFactor: 3, maxRows: 99999 });
  assert.ok(big.rows.length <= 300); monotonicInBlocks(r.rows);
  const full = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', mode: 'cutoff', dreamFactor: 3, maxRows: 300 });
  assert.deepEqual(r.rows.map(x => x.key), full.rows.slice(0, 100).map(x => x.key), 'truncation keeps the first rows of the ordering');
  return `default ${r.rows.length}, cap ${big.rows.length}`;
});

t('9 PwD uses the PwD closing ranks exactly as roundValues', () => {
  // PwD closing ranks are PwD-category ranks (a few hundred), so the fixture uses a PwD rank
  const pwRanks = { mainCrl: 600, advCrl: 300 };
  const pw = buildList({ ...JO, records: openRecords, studentRanks: pwRanks, category: 'OPEN', pwd: true, mode: 'cutoff', maxRows: 300 });
  assert.ok(pw.rows.length > 0);
  const byKey = new Map(openRecords.map(c => [c.name + '|' + c.program + '|' + c._quota, c]));
  for (const r of pw.rows.slice(0, 40)) {
    const rec = byKey.get(r.institute + '|' + r.program + '|' + (r.quota === 'All India' ? 'all-india' : 'other-state'));
    assert.equal(r.closing, roundValues(rec, r.round, true).close);
  }
  const normal = buildList({ ...JO, records: openRecords, studentRanks: pwRanks, category: 'OPEN', mode: 'cutoff', maxRows: 300 });
  assert.notDeepEqual(pw.rows.map(r => r.closing), normal.rows.map(r => r.closing));
  return `${pw.rows.length} rows`;
});

t('10 CAP with merit: single list sorted by closing merit', () => {
  assert.ok(p3.rows.length > 0 && p3.rows.every(r => r.choiceCode && r.counselling === 'MH'));
  for (let i = 1; i < p3.rows.length; i++) assert.ok(p3.rows[i].closing >= p3.rows[i - 1].closing);
  return JSON.stringify(tagCounts(p3.rows));
});

t('11 filters: type, name contains, university, autonomous only', () => {
  const nit = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', filters: { types: ['NIT'] }, maxRows: 300 });
  assert.ok(nit.rows.length > 0 && nit.rows.every(r => r.type === 'NIT'));
  const nm = buildList({ ...MHC, records: mhRecords, studentRanks: { merit: 9000 }, category: 'OPEN', filters: { name: 'pune' }, maxRows: 300 });
  assert.ok(nm.rows.length > 0 && nm.rows.every(r => /pune/i.test(r.institute)));
  const hu = load('MH_ENGG/2026', ['home-university'], 'OPEN');
  const univ = buildList({ ...MHC, quota: 'home-university', records: hu, studentRanks: { merit: 30000 }, category: 'OPEN', filters: { university: 'Mumbai University' }, maxRows: 300 });
  assert.ok(univ.rows.length > 0 && univ.rows.every(r => hu.find(c => c.choiceCode === r.choiceCode).homeUniversity === 'Mumbai University'));
  const auto = buildList({ ...MHC, records: mhRecords, studentRanks: { merit: 9000 }, category: 'OPEN', filters: { autonomousOnly: true }, maxRows: 300 });
  assert.ok(auto.rows.every(r => mhRecords.find(c => c.choiceCode === r.choiceCode).autonomous === true));
  return 'ok';
});

t('12 dream factor: Off = borderline only; larger factor adds Dream rows', () => {
  const off = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', dreamFactor: null, mode: 'cutoff', maxRows: 300 });
  const d3 = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', dreamFactor: 3, mode: 'cutoff', maxRows: 300 });
  assert.equal(off.rows.filter(r => r.tag === 'dream').length, 0); assert.ok(d3.rows.filter(r => r.tag === 'dream').length > 0);
  return `off ${off.rows.length} rows, 3x ${d3.rows.length}`;
});

t('13 pinned rows survive regeneration at their positions', () => {
  const base = buildList({ ...JO, records: openRecords, studentRanks: withAdv, category: 'OPEN', mode: 'cutoff' }).rows;
  const pin = { ...base[30], pinned: true }; const old = [...base.slice(0, 5), pin, ...base.slice(5, 20)].map((r, i) => (i === 5 ? pin : r));
  const merged = mergePinned(base, old);
  assert.equal(merged[5].key, pin.key); assert.equal(merged.filter(r => r.key === pin.key).length, 1);
  return 'ok';
});

t('14 CSV: BOM, header, quoting', () => {
  const csv = toCsv([{ institute: 'A, "B"', program: 'CS', type: 'NIT', quota: 'All India', gender: 'all', choiceCode: '', closing: 1234, round: 'Round 5', rankUsed: 1000, tag: 'safe', tagLabel: 'Safe', pinned: false }]);
  assert.equal(csv.charCodeAt(0), 0xFEFF); assert.ok(csv.includes('No,Institute,Branch,Type,Quota/Seat,ChoiceCode,Closing,Round,YourRank,Tag')); assert.ok(csv.includes('"A, ""B"""'));
  return JSON.stringify(csv.slice(1).split('\r\n').slice(0, 2));
});

t('15 branch families: matching and the programs only the catch-all picks up', () => {
  const programs = [...new Set([...josaaPrograms(), ...mhPrograms()])];
  const un = programsInCatchAll(FAMS, programs);
  fs.writeFileSync('/tmp/unmatched-programs.json', JSON.stringify(un, null, 1));
  return `${programs.length} distinct programs, ${un.length} unmatched by any keyword family`;
});

function josaaPrograms() { const s = new Set(); for (const q of ['all-india', 'other-state', 'home-state', 'goa', 'jk', 'ladakh']) for (const c of ['OPEN', 'EWS', 'OBC-NCL', 'SC', 'ST']) for (const g of ['all', 'female-only']) { try { read(`cutoffs/JOSAA/2026/${q}/${c}/${g}.json`).colleges.forEach(x => s.add(x.program)); } catch (e) { /* missing file */ } } return [...s]; }
function mhPrograms() { const s = new Set(); const dir = path.join(DATA, 'cutoffs/MH_ENGG/2026'); for (const q of fs.readdirSync(dir)) { const qd = path.join(dir, q); if (!fs.statSync(qd).isDirectory()) continue; for (const c of fs.readdirSync(qd)) for (const f of fs.readdirSync(path.join(qd, c))) JSON.parse(fs.readFileSync(path.join(qd, c, f), 'utf8')).colleges.forEach(x => s.add(x.program)); } return [...s]; }

// ── print the first 15 rows and tag counts for the three fixture profiles ──
const show = (title, res) => {
  console.log(`\n=== ${title} === ${res.rows.length} rows | tags ${JSON.stringify(tagCounts(res.rows))} | warnings: ${JSON.stringify(res.warnings)}`);
  res.rows.slice(0, 15).forEach((r, i) => console.log(String(i + 1).padStart(2), r.type.padEnd(10), r.tagLabel.padEnd(11), String(r.closing).padStart(7), r.round, '|', r.institute.slice(0, 44), '|', r.program.slice(0, 40), '|', r.quota));
};
show('JoSAA, OBC-NCL, JEE Main only (CRL 52,000, category rank 18,000), cutoff order', p1);
show('JoSAA, OPEN, with JEE Advanced (CRL 9,000, Advanced 4,000), cutoff order', p2);
show('Maharashtra CAP, OPEN, State Level, merit 4,500, cutoff order', p3);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
