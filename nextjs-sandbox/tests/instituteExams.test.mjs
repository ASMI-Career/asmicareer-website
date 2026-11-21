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
const CUR = COLLEGES.slice(0, 35), NEW = COLLEGES.slice(35);
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const cutDir = path.join(root, 'public/data/cutoffs');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.json') && e.name !== 'manifest.json' && e.name !== 'intake.json' ? [path.join(d, e.name)] : []);
const fromCutoffs = (sub) => { const m = new Map(); for (const f of walk(path.join(cutDir, sub))) for (const c of JSON.parse(fs.readFileSync(f, 'utf8')).colleges || []) if (!m.has(norm(c.name))) m.set(norm(c.name), c); return m; };
const JOSAA = fromCutoffs('JOSAA/2026'), CSAB = fromCutoffs('CSAB/2026'), MH = fromCutoffs('MH_ENGG/2026');
t('D2 the 35 curated rows are unchanged (only College of Engineering Pune gained groups); Walchand is listed twice; 508 rows added after them; slugs unique', () => {
  const old = JSON.parse(execSync('git show origin/main:nextjs-sandbox/public/data/engineering-colleges.json', { cwd: root }).toString());
  assert.equal(old.length, 35); assert.equal(CUR.length, 35);
  CUR.forEach((c, i) => { if (c.name === 'College of Engineering Pune') { assert.deepEqual(c.groups, ['mhtcet']); const { groups: _a, ...a } = c; const { groups: _b, ...b } = old[i]; assert.deepEqual(a, b); } else assert.deepEqual(c, old[i], c.name); });
  assert.equal(NEW.length, 508); assert.equal(new Set(COLLEGES.map(c => c.slug)).size, COLLEGES.length); assert.equal(new Set(COLLEGES.map(c => norm(c.name))).size, COLLEGES.length, 'no repeated name');
  return COLLEGES.length + ' rows';
});
t('D3 curated rows keep the evidence rules (IIT: JEE Advanced; NIT/IIIT: JEE Main; Maharashtra: MHT-CET, plus JEE Main unless Govt / Govt-Aided)', () => {
  CUR.filter(c => c.type === 'IIT').forEach(c => assert.deepEqual(c.groups, ['jee-advanced'], c.name));
  CUR.filter(c => ['NIT', 'IIIT'].includes(c.type) && c.groups.length).forEach(c => assert.deepEqual(c.groups, ['jee-main'], c.name));
  const govt = ['College of Engineering Pune', 'Veermata Jijabai Technological Institute', 'Government College of Engineering Amravati', 'Government College of Engineering Aurangabad', 'Walchand College of Engineering (Govt-Aided)'];
  const mh = CUR.filter(c => c.groups.includes('mhtcet')); assert.equal(mh.length, 13);
  mh.filter(c => govt.includes(c.name)).forEach(c => assert.deepEqual(c.groups, ['mhtcet'], c.name)); mh.filter(c => !govt.includes(c.name)).forEach(c => assert.deepEqual(c.groups, ['jee-main', 'mhtcet'], c.name));
  assert.deepEqual(COLLEGES.find(c => /Vellore/.test(c.name)).groups, ['viteee']); assert.deepEqual(COLLEGES.find(c => /SRM/.test(c.name)).groups, ['srmjee']); assert.deepEqual(COLLEGES.find(c => /Manipal/.test(c.name)).groups, ['jee-main', 'met']);
  return 'ok';
});
t('D4 every institute in the 2026 cutoff data is in the directory, under its exact cutoff name (curated rows cover the 14 renamed or shortened ones)', () => {
  const have = new Set(COLLEGES.map(c => norm(c.name))); const all = new Map([...JOSAA, ...CSAB, ...MH]);
  const absent = [...all.values()].filter(c => !have.has(norm(c.name))).map(c => c.name);
  assert.equal(absent.length, 14, absent.join(" | ")); assert.equal(all.size, 530);
  return `${all.size} institutes in data, ${absent.length} covered by curated rows (renamed or shortened)`;
});
t('D5 new rows: exact cutoff name, type mapping, groups by exam rules, no invented city/fees/seats/scores', () => {
  const tab = { IIT: 'IIT', NIT: 'NIT', IIIT: 'IIIT', GFTI: 'GFTI', Govt: 'Government', 'Govt-Aided': 'Government', University: 'Government', 'Un-Aided': 'Private', Minority: 'Private', Deemed: 'Deemed' };
  for (const c of NEW) {
    const k = norm(c.name); const mh = MH.get(k), jo = JOSAA.get(k) || CSAB.get(k); const src = mh || jo; assert.ok(src, c.name);
    assert.equal(c.type, tab[src.type], c.name); assert.equal(c.course, 'BTech'); assert.equal(c.city, ''); assert.equal(c.annual_fees, null); assert.equal(c.seats, null); assert.equal(c.asmi_recommended, false); assert.equal(c.asmi_pulse_score, null);
    if (mh) { assert.equal(c.state, 'Maharashtra'); assert.deepEqual(c.groups, ['Govt', 'Govt-Aided', 'University'].includes(src.type) ? ['mhtcet'] : ['jee-main', 'mhtcet'], c.name); }
    else { assert.equal(c.state, ''); assert.deepEqual(c.groups, src.type === 'IIT' ? ['jee-advanced'] : ['jee-main'], c.name); }
  }
  return `${NEW.length} rows`;
});
t('D6 mixed variants are listed separately (Walchand is the only one in the Maharashtra data); no new row for it', () => {
  const mixed = [...MH.values()]; const by = new Map(); fs.readdirSync(cutDir);
  const types = new Map(); for (const f of walk(path.join(cutDir, 'MH_ENGG/2026'))) for (const c of JSON.parse(fs.readFileSync(f, 'utf8')).colleges) { const k = norm(c.name); (types.get(k) || types.set(k, new Set()).get(k)).add(c.type); }
  const multi = [...types].filter(([, v]) => v.size > 1).map(([k]) => k); assert.deepEqual(multi, ['walchand college of engineering sangli']); assert.equal(mixed.length, 387);
  assert.equal(COLLEGES.filter(c => /^Walchand College of Engineering/.test(c.name)).length, 2);
  return 'ok';
});
const counts = Object.fromEntries(ids.map(id => [id, COLLEGES.filter(c => c.groups.includes(id)).length]));
console.log('\nCOLLEGES PER EXAM', counts, '| untagged:', COLLEGES.filter(c => !c.groups.length).length);
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
