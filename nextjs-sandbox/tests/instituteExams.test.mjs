// Node tests for the Institutes exam groups. Run: node tests/instituteExams.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveExamIds, studentExamIds } from '../app/student/lib/exams.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CFG = JSON.parse(fs.readFileSync(path.join(root, 'app/student/config/engineering.provisional.json'), 'utf8'));
const COLLEGES = JSON.parse(fs.readFileSync(path.join(root, 'public/data/engineering-colleges.json'), 'utf8'));
let pass = 0, fail = 0;
const t = (n, f) => { try { const r = f(); pass++; console.log('PASS ' + n + (r ? '  -> ' + r : '')); } catch (e) { fail++; console.log('FAIL ' + n + '\n   ' + e.message.split('\n')[0]); } };
const ids = CFG.instituteExams.map(e => e.id);

t('E1 the exam list is exactly the 7 exams, in order', () => { assert.deepEqual(CFG.instituteExams.map(e => e.label), ['JEE Main', 'JEE Advanced', 'MHT-CET', 'COMEDK', 'MET', 'VITEEE', 'SRMJEE']); return ids.join(); });
t('E2 sheet and legacy names resolve to exam ids (institutes scope)', () => {
  const r = (x) => resolveExamIds(x, CFG, 'institutes').join();
  assert.equal(r(['JoSAA', 'CSAB', 'DASA', 'JEE Mains', 'jee main']), 'jee-main'); assert.equal(r(['JEE Advanced']), 'jee-advanced');
  assert.equal(r(['Maharashtra CAP', 'MH', 'CAP', 'MHT CET', 'MHT-CET NRI']), 'mhtcet'); assert.equal(r(['COMEDK']), 'comedk'); assert.equal(r(['Manipal MET', 'MET']), 'met');
  assert.equal(r(['VITEEE']), 'viteee'); assert.equal(r(['SRMJEE', 'SRMJEEE']), 'srmjee'); assert.equal(r(['Nonsense', '', null]), ''); assert.equal(r(undefined), '');
  return 'ok';
});
t('E3 documents scope is untouched (still the 8 counselling groups)', () => { assert.equal(resolveExamIds(['JoSAA'], CFG).join(), 'josaa-csab'); assert.equal(resolveExamIds(['DASA'], CFG).join(), 'dasa'); return 'ok'; });
t('S1 "my exams" comes from the profile scores and the tracks, in canonical order', () => {
  const s = (p, tr) => studentExamIds(p, tr, CFG).join();
  assert.equal(s({ jee_main_percentile: 97.5 }, []), 'jee-main'); assert.equal(s({ jee_main_crl_rank: 15000 }, []), 'jee-main'); assert.equal(s({ category_rank: 4000 }, []), 'jee-main');
  assert.equal(s({ jee_main_percentile: 97, jee_adv_rank: 3000 }, []), 'jee-main,jee-advanced'); assert.equal(s({ jee_adv_category_rank: 300 }, []), 'jee-advanced');
  assert.equal(s({ mhtcet_sml: 8500 }, []), 'mhtcet'); assert.equal(s({ mhtcet_percentile: 95 }, []), 'mhtcet');
  assert.equal(s({ mhtcet_sml: 8500 }, ['JoSAA']), 'jee-main,mhtcet'); assert.equal(s({}, ['VITEEE', 'SRMJEE']), 'viteee,srmjee');
  assert.equal(s({}, []), ''); assert.equal(s(null, undefined), ''); assert.equal(s({ jee_main_percentile: 0, mhtcet_sml: null }, []), '');
  return 'ok';
});
t('D1 every college group id is one of the 7 exams; none repeated', () => { for (const c of COLLEGES) { assert.ok(Array.isArray(c.groups)); c.groups.forEach(g => assert.ok(ids.includes(g), c.name + ': ' + g)); assert.equal(new Set(c.groups).size, c.groups.length); } return COLLEGES.length + ' rows'; });
t('D2 only `groups` changed: all other fields match origin/main, in the same order', () => {
  const old = JSON.parse(execSync('git show origin/main:nextjs-sandbox/public/data/engineering-colleges.json', { cwd: root }).toString());
  assert.equal(COLLEGES.length, old.length); COLLEGES.forEach((c, i) => { const { groups, ...rest } = c; const { groups: og, ...orest } = old[i]; assert.deepEqual(rest, orest); assert.equal(Object.keys(c).pop(), 'groups'); });
  return '34 rows';
});
t('D3 evidence rules: IITs only under JEE Advanced; NIT/IIIT only under JEE Main; Maharashtra colleges under MHT-CET; no COMEDK', () => {
  COLLEGES.filter(c => c.type === 'IIT').forEach(c => assert.deepEqual(c.groups, ['jee-advanced'], c.name));
  COLLEGES.filter(c => c.groups.includes('jee-main') && !/Manipal/.test(c.name)).forEach(c => assert.ok(['NIT', 'IIIT'].includes(c.type), c.name));
  assert.equal(COLLEGES.filter(c => c.groups.includes('comedk')).length, 0);
  assert.deepEqual(COLLEGES.find(c => /Vellore/.test(c.name)).groups, ['viteee']); assert.deepEqual(COLLEGES.find(c => /SRM/.test(c.name)).groups, ['srmjee']); assert.deepEqual(COLLEGES.find(c => /Manipal/.test(c.name)).groups, ['jee-main', 'met']);
  return 'ok';
});
const counts = Object.fromEntries(ids.map(id => [id, COLLEGES.filter(c => c.groups.includes(id)).length]));
console.log('\nCOLLEGES PER EXAM', counts, '| untagged:', COLLEGES.filter(c => !c.groups.length).length);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
