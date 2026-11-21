// Node tests for the exam groups in Documents. Run: node tests/docGroups.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildDocumentSections, legacySections, docProgress } from '../app/student/lib/docGroups.js';
import { resolveExamIds } from '../app/student/lib/exams.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const S = path.join(root, 'app/student');
const DOCS = JSON.parse(fs.readFileSync(path.join(S, 'data/docs.engineering.provisional.json'), 'utf8'));
const CONFIG = JSON.parse(fs.readFileSync(path.join(S, 'config/engineering.provisional.json'), 'utf8'));
const idsOf = (sections) => sections.flatMap(s => s.docs.map(d => d.id));
const build = (category, tracks, view) => buildDocumentSections({ DOCS, config: CONFIG, docCategory: category, docQuota: '', studentTracks: tracks, view });
// the list exactly as it was before groups existed (the old code, kept here as the reference)
const before = (category, tracks) => idsOf(legacySections(DOCS, CONFIG, category, '', tracks));

let pass = 0, fail = 0;
const t = (name, fn) => { try { const n = fn(); pass++; console.log('PASS ' + name + (n ? '  -> ' + n : '')); } catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + e.message.split('\n')[0]); } };

t('R1 REGRESSION: OBC + tracks JoSAA and Maharashtra CAP see the same 23 ids under "My exams" (same order)', () => {
  const b = build('OBC', ['JoSAA', 'Maharashtra CAP']); const old = before('OBC', ['JoSAA', 'Maharashtra CAP']);
  assert.equal(old.length, 23); assert.equal(b.allIds.length, 23); assert.deepEqual(b.allIds, old); assert.equal(b.view, 'mine');
  return `${b.allIds.length} ids, identical order`;
});
t('R2 REGRESSION: a student with no tracks sees exactly what they saw before (default view = All)', () => {
  for (const cat of ['General', 'OBC', 'SC', 'ST', 'EWS', 'SEBC', 'VJ/NT/SBC']) {
    const b = build(cat, []); assert.equal(b.view, 'all'); assert.deepEqual(b.allIds, before(cat, []), cat);
    assert.deepEqual(build(cat, undefined).allIds, before(cat, undefined));
  }
  return `${before('OBC', []).length} ids for OBC`;
});
t('R3 General and EWS students with both tracks: same ids as before', () => {
  assert.deepEqual(build('General', ['JoSAA', 'Maharashtra CAP']).allIds, before('General', ['JoSAA', 'Maharashtra CAP']));
  const ews = build('EWS', ['JoSAA', 'Maharashtra CAP']); assert.deepEqual(ews.allIds, before('EWS', ['JoSAA', 'Maharashtra CAP']));
  return `General ${build('General', ['JoSAA', 'Maharashtra CAP']).allIds.length}, EWS ${ews.allIds.length}`;
});
t('R4 other categories with both tracks: same ids as before', () => {
  for (const cat of ['SC', 'ST', 'SEBC', 'VJ/NT/SBC']) assert.deepEqual(build(cat, ['JoSAA', 'Maharashtra CAP']).allIds, before(cat, ['JoSAA', 'Maharashtra CAP']), cat);
  return 'ok';
});
t('T1 ticks saved before this change still count for the regression student (same count in the default view)', () => {
  const old = before('OBC', ['JoSAA', 'Maharashtra CAP']);
  const saved = new Set(old.filter((_, i) => i % 2 === 0).concat(['some-removed-id']));   // as the sheet would hold: ids, one of them stale
  const b = build('OBC', ['JoSAA', 'Maharashtra CAP']);
  const oldDone = old.filter(id => saved.has(id)).length; const p = docProgress(b.allIds, saved);
  assert.equal(p.doneCount, oldDone); assert.equal(p.pct, Math.round((oldDone / 23) * 100));
  return `${p.doneCount}/23 (${p.pct}%) before and after`;
});
t('F1 only VITEEE (no definition yet): falls back to the base list + category items, with the group note', () => {
  const b = build('OBC', ['VITEEE']);
  assert.equal(b.view, 'mine'); assert.deepEqual(b.mine, ['viteee']);
  const base = idsOf(DOCS.sections); const cat = idsOf(DOCS.category.OBC);
  assert.deepEqual(b.allIds, [...base, ...cat]); assert.equal(b.allIds.length, 15);
  assert.ok(!b.allIds.some(i => /^(josaa|cap)-/.test(i)), 'no counselling slips');
  assert.equal(b.notes.length, 1); assert.match(b.notes[0].text, /VITEEE is being prepared by your counsellor/);
  return '15 ids + note';
});
t('U1 JoSAA + DASA: union (JoSAA definition + DASA fallback), no duplicates, category once', () => {
  const b = build('OBC', ['JoSAA', 'DASA']);
  assert.deepEqual(b.mine, ['josaa-csab', 'dasa']); assert.equal(new Set(b.allIds).size, b.allIds.length);
  const expected = [...idsOf(DOCS.sections), ...idsOf(DOCS.category.OBC), ...DOCS.track.JoSAA.docs.map(d => d.id)];
  assert.deepEqual(b.allIds, expected); assert.equal(b.notes.length, 1); assert.match(b.notes[0].text, /DASA/);
  return `${b.allIds.length} ids`;
});
t('G1 a single group chip: JoSAA & CSAB has no MHT-CET scorecard; MHT-CET has no JEE scorecards', () => {
  const j = build('General', ['JoSAA', 'Maharashtra CAP'], 'josaa-csab'); const m = build('General', ['JoSAA', 'Maharashtra CAP'], 'mhtcet');
  assert.ok(!j.allIds.includes('mht-cet-scorecard') && j.allIds.includes('jee-main-scorecard') && j.allIds.includes('josaa-reg-slip') && !j.allIds.includes('cap-application'));
  assert.ok(m.allIds.includes('mht-cet-scorecard') && !m.allIds.includes('jee-main-scorecard') && m.allIds.includes('cap-fee-receipt') && !m.allIds.includes('josaa-reg-slip'));
  return `josaa-csab ${j.allIds.length}, mhtcet ${m.allIds.length}`;
});
t('G2 every group chip works for any student, with a note when it is not defined yet', () => {
  for (const e of CONFIG.exams) { const b = build('SC', ['JoSAA'], e.id); assert.ok(b.allIds.length > 0, e.id); if (!DOCS.groups[e.id].sections) assert.equal(b.notes.length, 1, e.id); }
  const all = build('SC', ['JoSAA'], 'all'); assert.deepEqual(all.allIds, before('SC', ['JoSAA']));
  return 'all 8 groups render';
});
t('G3 category items appear once for any selection with a category-aware group; General adds none', () => {
  const b = build('OBC', ['JoSAA', 'Maharashtra CAP'], 'mine'); assert.equal(b.allIds.filter(i => i === 'caste-obc').length, 1);
  assert.ok(!build('General', ['JoSAA', 'Maharashtra CAP']).allIds.some(i => /^(caste|tribe|ncl|ews|income|validity)/.test(i)));
  return 'ok';
});
t('A1 aliases: legacy and sheet names resolve to the group ids (case, spacing and punctuation are ignored)', () => {
  const r = (x) => resolveExamIds(x, CONFIG).join();
  assert.equal(r(['JoSAA']), 'josaa-csab'); assert.equal(r(['JOSAA', 'csab', 'JoSAA & CSAB']), 'josaa-csab');
  assert.equal(r(['Maharashtra CAP', 'MH', 'CAP', 'MHT-CET', 'MHT CET', 'mht cet']), 'mhtcet');
  assert.equal(r(['MHT-CET NRI']), 'mhtcet-nri'); assert.equal(r(['MHT CET NRI']), 'mhtcet-nri'); assert.equal(r(['DASA']), 'dasa');
  assert.equal(r(['MET', 'Manipal MET']), 'met'); assert.equal(r(['VITEEE']), 'viteee'); assert.equal(r(['SRMJEEE', 'SRMJEE']), 'srmjeee'); assert.equal(r(['COMEDK']), 'comedk');
  assert.equal(r(['JoSAA', 'Maharashtra CAP', 'DASA']), 'josaa-csab,mhtcet,dasa'); assert.equal(r(['Nonsense', '', null]), ''); assert.equal(r([]), ''); assert.equal(r(undefined), '');
  return 'ok';
});
t('A2 an unrecognised track list shows everything (no "my exams")', () => {
  const b = build('OBC', ['Something else']); assert.equal(b.view, 'all'); assert.equal(b.allIds.length, before('OBC', ['Something else']).length);
  return `${b.allIds.length} ids (note: before, a track with no document group added nothing; the base list is unchanged)`;
});
t('I1 ids are untouched: every id of origin/main is still there, none repeated, every group id exists', () => {
  const old = JSON.parse(execSync('git show origin/main:nextjs-sandbox/app/student/data/docs.engineering.provisional.json', { cwd: root }).toString());
  const all = (d) => [...d.sections.flatMap(s => s.docs), ...Object.values(d.category).flat().flatMap(s => s.docs), ...Object.values(d.track).flatMap(s => s.docs)];
  const oldIds = all(old).map(x => x.id), newIds = all(DOCS).map(x => x.id);
  assert.deepEqual(newIds, oldIds, 'same ids in the same order'); assert.equal(oldIds.length, 35);
  const labels = (d) => JSON.stringify(all(d).map(x => [x.id, x.label, x.copies, x.note || '']));
  assert.equal(labels(DOCS), labels(old), 'labels, copies and notes unchanged');
  for (const g of Object.values(DOCS.groups)) for (const i of g.sections || []) assert.ok(newIds.includes(i), i);
  return `${newIds.length} ids unchanged`;
});

console.log('\n--- GROUP -> ITEM IDS (for review) ---');
for (const e of CONFIG.exams) { const g = DOCS.groups[e.id]; console.log(`${e.id.padEnd(11)} ${g.sections ? g.sections.length + ' items: ' + g.sections.join(', ') + (g.includeCategory ? '  [+ the student\'s category items]' : '') : 'NOT DEFINED -> fallback (12 base items + category items). Note: ' + g.note}`); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
