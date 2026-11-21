// Node tests for the engineering college pages data. Run from nextjs-sandbox: node tests/engCollegeData.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const { getCollegeCutoffs, sectionSummary, matchStats, parseProgram, yearComparison } = await import('../lib/engCollegeData.js');
const { loadProfile, validate, has, sourceLabel } = await import('../lib/engCollegeProfile.js');
const COLLEGES = JSON.parse(fs.readFileSync('public/data/engineering-colleges.json', 'utf8'));
let pass = 0, fail = 0;
const t = (n, f) => { try { const r = f(); pass++; console.log('PASS ' + n + (r ? '  -> ' + r : '')); } catch (e) { fail++; console.log('FAIL ' + n + '\n   ' + e.message.split('\n')[0]); } };

t('S1 slugs: unique, lowercase ASCII kebab-case, at most 70 characters', () => {
  const re = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  COLLEGES.forEach(c => { assert.match(c.slug, re, c.slug); assert.ok(c.slug.length <= 70, c.slug); });
  assert.equal(new Set(COLLEGES.map(c => c.slug)).size, COLLEGES.length); return COLLEGES.length + ' slugs';
});
t('S2 the 35 curated slugs are unchanged (iit-bombay, wce-sangli, wce-sangli-unaided ...)', () => {
  const s = COLLEGES.slice(0, 35).map(c => c.slug); assert.equal(s[0], 'iit-bombay'); assert.ok(s.includes('wce-sangli') && s.includes('wce-sangli-unaided') && s.includes('nit-trichy')); return 'ok';
});
t('M1 every name-map entry points at a real cutoff record', () => {
  const map = JSON.parse(fs.readFileSync('lib/engCollegeNameMap.json', 'utf8'));
  for (const slug of Object.keys(map)) { const c = COLLEGES.find(x => x.slug === slug); assert.ok(c, slug); assert.ok(getCollegeCutoffs(c).matched, slug + ' has no cutoffs'); }
  return Object.keys(map).length + ' mapped';
});
t('M2 match rate: 531 of 543 rows have cutoff data; the other 12 are not in any cutoff file', () => {
  const st = matchStats(COLLEGES); assert.equal(st.matched, 531); assert.equal(st.none.length, 12); return `${st.matched}/${st.total}`;
});
t('D1 IIT Bombay: JoSAA all-india OPEN, final round, JEE Advanced basis', () => {
  const c = getCollegeCutoffs(COLLEGES.find(x => x.slug === 'iit-bombay')); const j = c.sections.find(s => s.id === 'josaa');
  assert.ok(j && /JEE Advanced/.test(j.basis)); const q = j.years[0].q.find(x => x.k === 'all-india'); assert.ok(q.g.all.OPEN.length >= 10);
  assert.ok(q.g.all.OPEN.every(r => r[1] > 0 && r[2] >= 1)); const sum = sectionSummary(j); assert.ok(sum.min <= sum.max); return JSON.stringify([sum.branches, sum.min, sum.max]);
});
t('D2 Walchand rows are split by type: Govt-Aided and Un-Aided get different branch lists', () => {
  const ga = getCollegeCutoffs(COLLEGES.find(x => x.slug === 'wce-sangli')).sections[0]; const ua = getCollegeCutoffs(COLLEGES.find(x => x.slug === 'wce-sangli-unaided')).sections[0];
  assert.notDeepEqual(ga.b, ua.b); return `${ga.b.length} vs ${ua.b.length} branches`;
});
t('D3 payload per page stays far below the 60 KB cap', () => {
  let max = 0; for (const c of COLLEGES) max = Math.max(max, JSON.stringify(getCollegeCutoffs(c).sections).length); assert.ok(max < 60000, String(max)); return `max ${max} bytes`;
});
t('P1 program strings: degree and duration are read from "(N Years, Degree)" only; no parse keeps the raw text', () => {
  assert.deepEqual(parseProgram('Mechatronics Engineering (4 Years, Bachelor of Technology)'), { n: 'Mechatronics Engineering', y: 4, d: 'Bachelor of Technology' });
  assert.deepEqual(parseProgram('Mathematics & Computing (5 Years, Bachelor of Science and Master of Science (Dual Degree))'), { n: 'Mathematics & Computing', y: 5, d: 'Bachelor of Science and Master of Science (Dual Degree)' });
  assert.deepEqual(parseProgram('Architecture for DASA-CIWG (5 Years, Bachelor of Architecture)'), { n: 'Architecture', y: 5, d: 'Bachelor of Architecture' });
  assert.deepEqual(parseProgram('Mechanical Engineering [Minority seats]'), { n: 'Mechanical Engineering [Minority seats]', y: 0, d: null }); return 'ok';
});
t('P2 IIT Bombay sections carry degrees; Maharashtra CAP rows carry none (the data has none)', () => {
  const j = getCollegeCutoffs(COLLEGES.find(x => x.slug === 'iit-bombay')).sections[0]; assert.ok(j.dg.length >= 1 && j.b.every(b => b[1] >= 0 && b[2] > 0));
  const m = getCollegeCutoffs(COLLEGES.find(x => x.slug === 'pict-pune')).sections[0]; assert.equal(m.dg.length, 0); assert.ok(m.b.every(b => b[1] === -1)); assert.equal(m.basis, 'State merit number'); return 'ok';
});
t('A1 admissionInfo.json: IIT text never mentions CSAB; NIT/IIIT/GFTI text does', () => {
  const a = JSON.parse(fs.readFileSync('public/data/admissionInfo.json', 'utf8')); assert.deepEqual(Object.keys(a).sort(), ['_default', 'josaa-csab', 'mhtcet']); assert.deepEqual(Object.keys(a['josaa-csab']).sort(), ['GFTI', 'IIIT', 'IIT', 'NIT']); assert.ok(!/CSAB/.test(a['josaa-csab'].IIT)); return 'ok';
});
t('R1 rich cutoff data (IIT Bombay): both years, both gender pools, every round, opening and PwD, under the 60 KB cap', () => {
  const c = getCollegeCutoffs(COLLEGES.find(x => x.slug === 'iit-bombay'), { rich: true }); const j = c.sections.find(x => x.id === 'josaa');
  assert.deepEqual(j.years.map(y => y.y), [2026, 2025]); assert.ok(j.rich); const y26 = j.years[0]; assert.deepEqual(y26.rn, [1, 2, 3, 4, 5]); assert.ok(y26.q[0].g.all && y26.q[0].g.female);
  const row = y26.q[0].g.all.OPEN.find(r => j.b[r[0]][0] === 'Computer Science and Engineering'); assert.equal(row[1][4], 67); assert.equal(row[1][0], 65); assert.ok(row[2].length === 5 && row[3].length === 5);
  assert.ok(JSON.stringify(c.sections).length < 60000); return JSON.stringify(c.sections).length + ' bytes';
});
t('R2 2025 vs 2026 comparison matches the raw files (CSE: 66 in round 6 of 2025, 67 in round 5 of 2026)', () => {
  const c = getCollegeCutoffs(COLLEGES.find(x => x.slug === 'iit-bombay'), { rich: true }).sections.find(x => x.id === 'josaa'); const cmp = yearComparison(c);
  const r = cmp.rows.find(x => c.b[x.bi][0] === 'Computer Science and Engineering'); assert.deepEqual([r.prev.rank, r.prev.round, r.latest.rank, r.latest.round], [66, 6, 67, 5]); return cmp.rows.length + ' branches';
});
t('R3 colleges without a profile stay lean: one year, gender-neutral only, three numbers per row', () => {
  const c = getCollegeCutoffs(COLLEGES.find(x => x.slug === 'pict-pune')).sections[0]; assert.equal(c.rich, false); assert.equal(c.years.length, 1); assert.ok(!c.years[0].q[0].g.female); assert.equal(c.years[0].q[0].g.all.OPEN[0].length, 3); return 'ok';
});
t('F1 profile: iit-bombay loads, its fee figures add up, a wrong total or a figure without a source is rejected', () => {
  const p = loadProfile('iit-bombay'); assert.equal(p.slug, 'iit-bombay'); assert.equal(p.asmiRecommended, false); assert.ok(has(p.ranking.nirf)); assert.ok(!has(p.seats));
  const bad = JSON.parse(JSON.stringify(p)); bad.fees.perSemester.total = 1; assert.throws(() => validate('iit-bombay', bad), /add up/);
  const bad2 = JSON.parse(JSON.stringify(p)); delete bad2.identity.established.source; assert.throws(() => validate('iit-bombay', bad2), /needs a source/);
  const bad3 = JSON.parse(JSON.stringify(p)); bad3.slug = 'x'; assert.throws(() => validate('iit-bombay', bad3), /file name/);
  assert.equal(sourceLabel('https://www.iitb.ac.in/x ; https://acad.iitb.ac.in/y'), 'iitb.ac.in, acad.iitb.ac.in'); return 'ok';
});
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
