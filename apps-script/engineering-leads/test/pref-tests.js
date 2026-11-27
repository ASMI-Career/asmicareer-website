/** MOCK tests for savePreferenceList / getPreferenceList. Run: node apps-script/engineering-leads/test/pref-tests.js (in-memory fake of Google services). */
'use strict';
const assert = require('assert');
const { buildEnvironment } = require('./mock-gas');
const TOK = 'ENG-ABCDEFGH23', TOK2 = 'ENG-JKMNPQRS45';

// Sign-in stand-ins: the old tests named a student by token; now a student is a Google account. EMAIL/EMAIL2/MEDMAIL are the Approved Email of TOK/TOK2/the Medical row.
const EMAIL = 'aarav.test@example.invalid', EMAIL2 = 'other.test@example.invalid', MEDMAIL = 'med.test@example.invalid';
function idFor(env, who) {
  if (who === TOK) return env.mintToken(EMAIL);
  if (typeof TOK2 !== 'undefined' && who === TOK2) return env.mintToken(EMAIL2);
  if (who === 'ENG-ZZZZZZZZ22') return env.mintToken(MEDMAIL);
  if (who === '' || who === undefined) return '';
  if (/^ENG-[A-Z0-9]{10}$/.test(who)) return env.mintToken('unknown@example.invalid');   // a well-formed but unknown student
  return 'bad';                                                                           // not a Google token at all
}
const setCell = (sh, row, h, v) => sh._set(row, sh.rows[0].indexOf(h) + 1, v);
function seed(env) {
  [[2, TOK, 'Engineering'], [3, TOK2, 'Engineering'], [4, 'ENG-ZZZZZZZZ22', 'Medical']].forEach(([r, t, st]) => { setCell(env.dsheet, r, 'Token', t); setCell(env.dsheet, r, 'Approved Email', r === 2 ? EMAIL : r === 3 ? EMAIL2 : MEDMAIL); setCell(env.dsheet, r, 'Stream', st); setCell(env.dsheet, r, 'Student Name', 'Test Student'); });
}
const post = (env, body) => {
  const b = Object.assign({}, body);
  if ('token' in b) { b.idToken = idFor(env, b.token); delete b.token; }
  return JSON.parse(env.ctx.doPost({ parameter: {}, postData: { type: 'text/plain', contents: JSON.stringify(b) } }).getContent());
};
const save = (env, counselling, items, token = TOK) => post(env, { action: 'savePreferenceList', token, counselling, items });
const get = (env, counselling, token = TOK) => post(env, { action: 'getPreferenceList', token, counselling });
const item = (i, over = {}) => Object.assign({ institute: 'Institute ' + i, program: 'Computer Engineering', quota: 'All India', gender: 'all', choiceCode: '', tag: 'safe' }, over);
const items = (n, over) => Array.from({ length: n }, (_, i) => item(i + 1, over));
const tab = (env) => env.dash.getSheetByName('Preference Lists');
const body = (sh) => { const out = []; for (let r = 2; r <= sh.getLastRow(); r++) out.push(sh.obj(r)); return out; };
const tests = []; const test = (n, f) => tests.push({ n, f });

test('C1 valid save: rows written in order, text formats, get returns them in position order', () => {
  const env = buildEnvironment(); seed(env);
  const r = save(env, 'JOSAA', [item(1, { tag: 'PICK:dream' }), item(2), item(3, { quota: 'Other State', gender: 'female-only' })]);
  assert.deepStrictEqual(r, { ok: true, count: 3 });
  const rows = body(tab(env));
  assert.strictEqual(rows.length, 3); assert.deepStrictEqual(rows.map(x => x.Position), [1, 2, 3]);
  assert.ok(rows.every(x => x.Token === TOK && x.Counselling === 'JOSAA')); assert.strictEqual(rows[0].Tag, 'PICK:dream'); assert.strictEqual(rows[2].Gender, 'female-only');
  assert.deepStrictEqual(tab(env).rows[0], ['Token', 'Counselling', 'Position', 'Institute', 'Program', 'Quota', 'Gender', 'ChoiceCode', 'Tag', 'UpdatedAt']);
  const g = get(env, 'JOSAA'); assert.strictEqual(g.ok, true); assert.deepStrictEqual(g.items.map(x => x.institute), ['Institute 1', 'Institute 2', 'Institute 3']);
  assert.strictEqual(g.locked, false); assert.deepStrictEqual(get(env, 'CAP').items, []);
  return '3 rows, header ok, get in order';
});
test('C2 replace-all: a shorter list replaces a longer one; the other counselling and other students are untouched', () => {
  const env = buildEnvironment(); seed(env);
  save(env, 'JOSAA', items(5)); save(env, 'CAP', items(2, { quota: 'State Level', choiceCode: '0301224510' })); save(env, 'JOSAA', items(4, { tag: 'likely' }), TOK2);
  const r = save(env, 'JOSAA', items(2, { institute: 'New' }));
  assert.deepStrictEqual(r, { ok: true, count: 2 });
  const rows = body(tab(env));
  const mine = rows.filter(x => x.Token === TOK && x.Counselling === 'JOSAA'); assert.strictEqual(mine.length, 2); assert.ok(mine.every(x => x.Institute === 'New'));
  assert.strictEqual(rows.filter(x => x.Token === TOK && x.Counselling === 'CAP').length, 2);
  assert.strictEqual(rows.filter(x => x.Token === TOK2).length, 4);
  assert.strictEqual(rows.length, 2 + 2 + 4, 'no stray rows left behind');
  return '2 + 2 + 4 rows';
});
test('C3 non-contiguous rows are deleted correctly (interleaved with other students and counsellings)', () => {
  const env = buildEnvironment(); seed(env); save(env, 'JOSAA', items(1, { institute: 'seed' }), TOK2);   // creates the tab
  const sh = tab(env); sh.rows.length = 1;                                                               // keep only the header
  const put = (r, tok, c, name) => ['Token', 'Counselling', 'Position', 'Institute', 'Program', 'Quota', 'Gender', 'ChoiceCode', 'Tag'].forEach((h, i) => setCell(sh, r, h, [tok, c, 1, name, 'P', 'All India', 'all', '', 'safe'][i]));
  put(2, TOK, 'JOSAA', 'mine-1'); put(3, TOK2, 'JOSAA', 'other-a'); put(4, TOK, 'JOSAA', 'mine-2'); put(5, TOK, 'JOSAA', 'mine-3'); put(6, TOK, 'CAP', 'cap-keep'); put(7, TOK, 'JOSAA', 'mine-4'); put(8, TOK2, 'CAP', 'other-b'); put(9, TOK, 'JOSAA', 'mine-5');
  const r = save(env, 'JOSAA', items(2, { institute: 'fresh' }));
  assert.deepStrictEqual(r, { ok: true, count: 2 });
  const names = body(sh).map(x => x.Institute).sort();
  assert.deepStrictEqual(names, ['cap-keep', 'fresh', 'fresh', 'other-a', 'other-b']);
  assert.strictEqual(sh.deletedRows, 5, 'exactly the 5 old rows were deleted');
  return 'left: ' + names.join(', ');
});
test('C4 validation: 301 items, long string, unknown key, bad types write nothing (the tab is not even created)', () => {
  const env = buildEnvironment(); seed(env);
  const bad = [
    [items(301)], [[item(1, { institute: 'x'.repeat(151) })]], [[Object.assign(item(1), { extra: 'x' })]], [[item(1, { gender: 'both' })]], [[item(1, { tag: 'great' })]],
    [[item(1, { institute: '' })]], [[item(1, { quota: '' })]], [[Object.assign(item(1), { institute: 5 })]], [[item(1, { choiceCode: 'bad code!' })]], [[item(1, { program: 'a\u0000b' })]],
    ['not a list'], [[null]], [[['x']]],
  ];
  bad.forEach(([it]) => { env.state.cache = {}; const r = save(env, 'JOSAA', it); assert.strictEqual(r.ok, false); assert.strictEqual(r.error, 'validation'); });
  env.state.cache = {}; assert.strictEqual(save(env, 'NIT', items(1)).error, 'validation'); assert.strictEqual(save(env, undefined, items(1)).error, 'validation');
  assert.strictEqual(tab(env), null, 'nothing was written');
  env.state.cache = {}; assert.deepStrictEqual(save(env, 'JOSAA', items(300)), { ok: true, count: 300 });
  return bad.length + ' bad payloads rejected; exactly 300 accepted';
});
test('C5 a valid save followed by an invalid one keeps the first list', () => {
  const env = buildEnvironment(); seed(env); save(env, 'JOSAA', items(3));
  env.state.cache = {}; assert.strictEqual(save(env, 'JOSAA', [item(1), item(2, { tag: 'zzz' })]).error, 'validation');
  assert.strictEqual(get(env, 'JOSAA').items.length, 3);
  return 'ok';
});
test('C6 sign-in checks: no/bad Google token, unknown email and a Medical row are refused; nothing written', () => {
  const env = buildEnvironment(); seed(env);
  [['', 'auth_required'], ['bad', 'auth_invalid'], ['ENG-SHORT', 'auth_invalid'], ['ENG-JKMNPQRS99', 'not_approved'], ['ENG-ZZZZZZZZ22', 'not_approved']].forEach(([t, code]) => {
    env.state.cache = {};
    assert.deepStrictEqual(save(env, 'JOSAA', items(1), t), { ok: false, error: code }, 'save as ' + t);
    assert.deepStrictEqual(get(env, 'JOSAA', t), { ok: false, error: code }, 'get as ' + t);
  });
  assert.strictEqual(tab(env), null);
  return 'ok';
});
test('C7 locked: save is refused, nothing written, get says locked', () => {
  const env = buildEnvironment(); seed(env); save(env, 'JOSAA', items(2));
  env.ctx.PREF_LIST_EDIT_ENABLED = false; env.state.cache = {};
  assert.deepStrictEqual(save(env, 'JOSAA', items(5)), { ok: false, error: 'locked' });
  const g = get(env, 'JOSAA'); assert.strictEqual(g.items.length, 2); assert.strictEqual(g.locked, true);
  return 'locked';
});
test('C8 throttle: 60 saves per token per hour; resets next hour; another token unaffected; cache outage does not block', () => {
  const env = buildEnvironment(); seed(env);
  for (let i = 0; i < 60; i++) assert.strictEqual(save(env, 'JOSAA', items(1)).ok, true, 'save ' + (i + 1));
  assert.deepStrictEqual(save(env, 'JOSAA', items(1)), { ok: false, error: 'rate_limited' });
  assert.strictEqual(save(env, 'JOSAA', items(1), TOK2).ok, true);
  env.state.clock = new Date(env.state.clock.getTime() + 3600e3); assert.strictEqual(save(env, 'JOSAA', items(1)).ok, true);
  const e2 = buildEnvironment(); seed(e2); e2.state.cacheThrows = true; assert.strictEqual(save(e2, 'JOSAA', items(1)).ok, true);
  return '61st limited, next hour ok';
});
test('C9 lock busy => busy and nothing written; lock released after success and after a failed write', () => {
  const env = buildEnvironment(); seed(env); save(env, 'JOSAA', items(2));
  env.state.lockBusy = true; assert.deepStrictEqual(save(env, 'JOSAA', items(5)), { ok: false, error: 'busy' }); env.state.lockBusy = false;
  assert.strictEqual(get(env, 'JOSAA').items.length, 2);
  assert.strictEqual(save(env, 'JOSAA', items(3)).ok, true); assert.strictEqual(env.state.lockHeld, false);
  tab(env).failOnSetValues = 1; const r = save(env, 'JOSAA', items(1)); assert.strictEqual(r.ok, false); assert.strictEqual(r.error, 'server_error'); assert.strictEqual(env.state.lockHeld, false);
  return 'ok';
});
test('C10 empty list clears; text starting with = stays text; get on a missing tab is empty', () => {
  const env = buildEnvironment(); seed(env);
  assert.deepStrictEqual(get(env, 'JOSAA').items, []);
  save(env, 'JOSAA', [item(1, { institute: '=HYPERLINK("http://x","y")' })]);
  const sh = tab(env); const col = sh.rows[0].indexOf('Institute') + 1; assert.strictEqual(sh.formats[`2,${col}`], '@');
  assert.deepStrictEqual(save(env, 'JOSAA', []), { ok: true, count: 0 }); assert.strictEqual(get(env, 'JOSAA').items.length, 0);
  return 'ok';
});
test('C11 existing endpoints still work (getStudent has pref_list_enabled:true; shortlist unchanged)', () => {
  const env = buildEnvironment(); seed(env);
  const gs = post(env, { action: 'getStudent', token: TOK });
  assert.strictEqual(gs.data.pref_list_enabled, true);
  const sl = post(env, { action: 'saveShortlist', token: TOK, colleges: { JOSAA: [{ name: 'x' }], CAP: [] } }); assert.strictEqual(sl.success, true);
  assert.deepStrictEqual(post(env, { action: 'nope', token: TOK }), { error: 'invalid_action' });
  assert.strictEqual(env.ctx.verifyHeaders().ok, true);
  return 'ok';
});
let p = 0, f = 0;
for (const t of tests) { try { const n = t.f(); p++; console.log('PASS ' + t.n + (n ? '\n      -> ' + n : '')); } catch (e) { f++; console.log('FAIL ' + t.n + '\n      -> ' + e.message.split('\n')[0]); if (process.env.VERBOSE) console.log(e.stack); } }
console.log(`\n${p} passed, ${f} failed, ${tests.length} total`); process.exit(f ? 1 : 0);
