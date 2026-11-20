/** MOCK tests for the saveProfile feature. Run: node apps-script/engineering-leads/test/profile-tests.js (in-memory fake of Google services). */
'use strict';
const assert = require('assert');
const { buildEnvironment } = require('./mock-gas');
const TOK = 'ENG-ABCDEFGH23';
const setCell = (sh, row, h, v) => sh._set(row, sh.rows[0].indexOf(h) + 1, v);
function seed(env, over = {}) {
  const v = Object.assign({ 'Token': TOK, 'Stream': 'Engineering', 'Student Name': 'Aarav Deshmukh', 'Score': 98.37, 'Category': 'OPEN',
    'Student Phone': '9876543210', 'Admin Remarks': 'keep' }, over);
  Object.keys(v).forEach(h => setCell(env.dsheet, 2, h, v[h]));
  env.dsheet.writeLog.length = 0;
}
const post = (env, body) => JSON.parse(env.ctx.doPost({ parameter: {}, postData: { type: 'text/plain', contents: JSON.stringify(body) } }).getContent());
const save = (env, profile, token = TOK) => post(env, { action: 'saveProfile', token, profile });
const get = (env) => JSON.parse(env.ctx.doGet({ parameter: { action: 'getStudent', token: TOK } }).getContent()).data;
const tests = []; const test = (n, f) => tests.push({ n, f });

test('P1 save changes only the changed cells, returns the profile, logs one row per change', () => {
  const env = buildEnvironment(); seed(env);
  const r = save(env, { gender: 'Female', home_state: 'Maharashtra', jee_main_percentile: '97.5', jee_main_crl_rank: 12345, desired_branches: ['CSE', 'IT'], name: 'Aarav Deshmukh' });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.profile.gender, 'Female'); assert.strictEqual(r.profile.jee_main_percentile, 97.5);
  assert.deepStrictEqual(r.profile.desired_branches, ['CSE', 'IT']); assert.strictEqual(r.profile.category, 'General');
  assert.strictEqual(env.dsheet.cell(2, 'Desired Branches'), 'CSE, IT');
  assert.strictEqual(env.dsheet.writeLog.length, 5, 'name unchanged -> not written; 5 changed cells');
  assert.strictEqual(env.dsheet.cell(2, 'Admin Remarks'), 'keep'); assert.strictEqual(env.dsheet.cell(2, 'Student Phone'), '9876543210');
  const log = env.dash.getSheetByName('Profile Log'); assert.ok(log, 'Profile Log created');
  assert.strictEqual(log.getLastRow(), 6); assert.deepStrictEqual(log.rows[0], ['Timestamp', 'Token', 'Field', 'Old value', 'New value']);
  const again = save(env, { gender: 'Female' }); assert.strictEqual(again.ok, true);
  assert.strictEqual(log.getLastRow(), 6, 'no change -> no log row');
  return '5 cells written, 5 log rows, repeat save wrote nothing';
});
test('P2 category: only allowed names are written; sheet OPEN/OBC read as General/OBC-NCL', () => {
  const env = buildEnvironment(); seed(env, { Category: 'OBC' });
  assert.strictEqual(get(env).category, 'OBC', 'getStudent category stays raw');
  assert.strictEqual(save(env, { gender: 'Male' }).profile.category, 'OBC-NCL');
  assert.strictEqual(save(env, { category: 'OPEN' }).error, 'validation');
  assert.strictEqual(save(env, { category: 'ews' }).profile.category, 'EWS');
  assert.strictEqual(env.dsheet.cell(2, 'Category'), 'EWS');
  return 'OPEN rejected on write, accepted on read';
});
test('P3 validation rejects everything bad and writes nothing', () => {
  const env = buildEnvironment(); seed(env); const snap = JSON.stringify(env.dsheet.rows);
  const bad = [{ gender: 'x' }, { pwd: 'maybe' }, { home_state: 'Atlantis' }, { jee_main_percentile: 100.5 }, { jee_main_percentile: '98.123' }, { jee_main_percentile: -1 },
    { jee_main_crl_rank: 0 }, { jee_main_crl_rank: 1.5 }, { jee_main_crl_rank: 10000000 }, { category_rank: 'abc' }, { mhtcet_percentile: 'NaN' },
    { desired_branches: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }, { desired_branches: 'CSE' }, { desired_branches: ['A,B'] }, { desired_branches: [1] },
    { minority: 'x'.repeat(101) }, { home_university: 'y'.repeat(101) }, { name: '' }, { name: '<b>' }, { name: 'x'.repeat(81) },
    { admin_remarks: 'x' }, { token: 'ENG-X' }, { stage: 'Done' }, { score: 99 }, { gender: null }, { gender: {} }, { __proto__x: 1 }];
  bad.forEach(p => { env.state.cache = {}; const r = save(env, p); assert.strictEqual(r.ok, false, JSON.stringify(p)); assert.strictEqual(r.error, 'validation'); });
  env.state.cache = {}; assert.strictEqual(save(env, { gender: 'Male', pwd: 'maybe' }).ok, false, 'one bad field blocks the whole save');
  ['not-an-object', null, [], 5].forEach(p => { env.state.cache = {}; assert.strictEqual(save(env, p).ok, false); });
  assert.strictEqual(JSON.stringify(env.dsheet.rows), snap, 'sheet untouched'); assert.strictEqual(env.dash.getSheetByName('Profile Log'), null);
  return bad.length + ' bad payloads rejected, sheet byte-identical';
});
test('P4 clearing, numbers stay numbers, formula-injection text stays text', () => {
  const env = buildEnvironment(); seed(env);
  save(env, { jee_main_percentile: 90, minority: '=HYPERLINK("x")', home_university: 'COEP' });
  assert.strictEqual(env.dsheet.cell(2, 'JEE Main Percentile'), 90); assert.strictEqual(typeof env.dsheet.cell(2, 'JEE Main Percentile'), 'number');
  const fmt = env.dsheet.formats[`2,${env.dsheet.rows[0].indexOf('Minority') + 1}`]; assert.strictEqual(fmt, '@');
  const r = save(env, { jee_main_percentile: '', desired_branches: [] }); assert.strictEqual(r.ok, true);
  assert.strictEqual(r.profile.jee_main_percentile, null); assert.strictEqual(env.dsheet.cell(2, 'JEE Main Percentile'), '');
  return 'cleared to blank; text cells use text format';
});
test('P5 switch off: saveProfile answers locked, nothing written, getStudent says profile_locked', () => {
  const env = buildEnvironment(); seed(env); assert.strictEqual(get(env).profile_locked, false);
  env.ctx.PROFILE_EDIT_ENABLED = false;
  assert.deepStrictEqual(save(env, { gender: 'Male' }), { ok: false, error: 'locked' });
  assert.strictEqual(env.dsheet.writeLog.length, 0); assert.strictEqual(get(env).profile_locked, true);
  return 'locked';
});
test('P6 rate limit: 20 per token per hour; other tokens and next hour unaffected; cache failure does not block', () => {
  const env = buildEnvironment(); seed(env);
  for (let i = 0; i < 20; i++) assert.strictEqual(save(env, { gender: i % 2 ? 'Male' : 'Female' }).ok, true);
  assert.deepStrictEqual(save(env, { gender: 'Other' }), { ok: false, error: 'rate_limited' });
  env.state.clock = new Date(env.state.clock.getTime() + 3600e3); assert.strictEqual(save(env, { gender: 'Other' }).ok, true);
  const e2 = buildEnvironment(); seed(e2); e2.state.cacheThrows = true; assert.strictEqual(save(e2, { gender: 'Male' }).ok, true);
  return '21st call limited, resets next hour, cache outage fails open';
});
test('P7 lock: busy => busy and nothing written; lock released after success and after a failed write', () => {
  const env = buildEnvironment(); seed(env); env.state.lockBusy = true;
  assert.deepStrictEqual(save(env, { gender: 'Male' }), { ok: false, error: 'busy' }); assert.strictEqual(env.dsheet.writeLog.length, 0);
  env.state.lockBusy = false; assert.strictEqual(save(env, { gender: 'Male' }).ok, true); assert.strictEqual(env.state.lockHeld, false);
  env.dsheet.failOnSetValues = 1; const r = save(env, { gender: 'Female' }); assert.strictEqual(r.ok, false); assert.strictEqual(r.error, 'server_error');
  assert.strictEqual(env.state.lockHeld, false);
  return 'ok';
});
test('P8 unknown / malformed token => not_found, nothing written; formula cell never overwritten; missing column => server_error', () => {
  const env = buildEnvironment(); seed(env);
  assert.strictEqual(save(env, { gender: 'Male' }, 'ENG-JKMNPQRS45').error, 'not_found');
  assert.strictEqual(save(env, { gender: 'Male' }, 'bad').error, 'not_found');
  setCell(env.dsheet, 2, 'Gender', '=IF(1,"Male")'); assert.strictEqual(save(env, { gender: 'Female' }).ok, false);
  assert.strictEqual(env.dsheet.cell(2, 'Gender'), '=IF(1,"Male")');
  const e2 = buildEnvironment({ noProfileCols: true }); seed(e2);
  assert.strictEqual(save(e2, { gender: 'Male' }).error, 'server_error');
  const g = get(e2); assert.strictEqual(g.gender, ''); assert.strictEqual(g.name, 'Aarav Deshmukh');
  return 'ok; getStudent still works without the new columns';
});
test('P9 getStudent reads messy profile cells safely; no phone leak', () => {
  const env = buildEnvironment(); seed(env, { Gender: 'bogus', PwD: 'y', 'Home State': 'maharashtra', 'JEE Main Rank (CRL)': 'x', 'Desired Branches': 'CSE, IT,,ECE, A, B, C, D', 'JEE Main Percentile': 'abc', 'JEE Main CRL Rank': '1200' });
  const d = get(env);
  assert.strictEqual(d.gender, ''); assert.strictEqual(d.pwd, 'Yes'); assert.strictEqual(d.home_state, 'Maharashtra');
  assert.strictEqual(d.jee_main_percentile, null); assert.strictEqual(d.jee_main_crl_rank, 1200); assert.strictEqual(d.desired_branches.length, 6);
  assert.ok(!JSON.stringify(d).includes('9876543210'));
  return 'ok';
});
test('P10 MHT-CET SML rank: saved as a whole number, validated, header optional', () => {
  const env = buildEnvironment(); seed(env);
  const r = save(env, { mhtcet_sml: '12345' }); assert.strictEqual(r.ok, true); assert.strictEqual(r.profile.mhtcet_sml, 12345);
  assert.strictEqual(env.dsheet.cell(2, 'MHT-CET SML Rank'), 12345); assert.strictEqual(typeof env.dsheet.cell(2, 'MHT-CET SML Rank'), 'number');
  for (const bad of ['0', '1.5', 'abc', '10000000', '-3']) { env.state.cache = {}; assert.strictEqual(save(env, { mhtcet_sml: bad }).error, 'validation', bad); }
  assert.strictEqual(save(env, { mhtcet_sml: '' }).profile.mhtcet_sml, null);
  assert.strictEqual(get(env).mhtcet_sml, null);
  // the column is not in the sheet yet: everything else still saves, only this field refuses; verifyHeaders stays OK
  const e2 = buildEnvironment({ noProfileCols: false }); seed(e2);
  const i = e2.dsheet.rows[0].indexOf('MHT-CET SML Rank'); e2.dsheet.rows[0][i] = '';
  assert.strictEqual(save(e2, { gender: 'Male' }).ok, true, 'other fields still save');
  assert.strictEqual(save(e2, { mhtcet_sml: '500' }).error, 'server_error');
  assert.strictEqual(get(e2).mhtcet_sml, null);
  assert.strictEqual(e2.ctx.verifyHeaders().ok, true, 'verifyHeaders does not demand the optional header');
  return 'ok';
});
let p = 0, f = 0;
for (const t of tests) { try { const n = t.f(); p++; console.log('PASS ' + t.n + (n ? '\n      -> ' + n : '')); } catch (e) { f++; console.log('FAIL ' + t.n + '\n      -> ' + e.message.split('\n')[0]); if (process.env.VERBOSE) console.log(e.stack); } }
console.log(`\n${p} passed, ${f} failed, ${tests.length} total`); process.exit(f ? 1 : 0);
