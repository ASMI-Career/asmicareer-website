/** MOCK tests for the Medical dashboard script (../../../google-apps-script.js). Run: node apps-script/engineering-leads/test/medical-tests.js
 *  In-memory fake of Google services, not real Sheets. See README "What these tests cannot prove". */
'use strict';
const assert = require('assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MockSheet, MockSpreadsheet } = require('./mock-gas');

const CLIENT = 'MOCK-CLIENT-ID.apps.googleusercontent.com';
const EMAIL = 'riya.test@example.invalid', EMAIL2 = 'kabir.test@example.invalid';
const HEADERS = ['Timestamp', 'Token', 'Date Added', 'Name', 'Score', 'Rank', 'Category', 'Counsellor Name', 'Counsellor WhatsApp', 'WhatsApp Group Link', 'Stage', 'Dashboard URL', 'Inquiry Token', 'Saved Shortlist'];
while (HEADERS.length < 37) HEADERS.push('Spare ' + HEADERS.length);
HEADERS.push('Document Status', 'Student Phone', 'Approved Email');          // col 38 = Document Status, then a decoy phone column, email at the far right

function build() {
  const state = { logs: [], props: { GOOGLE_CLIENT_ID: CLIENT }, cache: {}, cacheThrows: false, lockBusy: false, lockHeld: false, g: { tokens: {}, down: false, fetches: 0, n: 0 }, clock: new Date('2026-11-01T10:00:00Z') };
  const ss = new MockSpreadsheet('MOCK-MEDICAL');
  const sheet = ss.add(new MockSheet('Student Dashboard', HEADERS, { maxCols: 60 }));
  const ctx = vm.createContext({
    Logger: { log: m => state.logs.push(String(m)) },
    Utilities: { DigestAlgorithm: { SHA_256: 'SHA_256' }, computeDigest: (a, t) => Array.from(crypto.createHash('sha256').update(String(t)).digest()).map(b => (b > 127 ? b - 256 : b)) },
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: s => ({ _s: s, setMimeType() { return this; }, getContent() { return this._s; } }) },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (state.lockBusy || state.lockHeld) return false; state.lockHeld = true; return true; }, releaseLock: () => { state.lockHeld = false; } }) },
    CacheService: { getScriptCache: () => { if (state.cacheThrows) throw new Error('cache down'); return { get: k => (k in state.cache ? state.cache[k] : null), put: (k, v) => { state.cache[k] = v; } }; } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in state.props ? state.props[k] : null) }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    UrlFetchApp: { fetch: url => {
      state.g.fetches++;
      const m = /^https:\/\/oauth2\.googleapis\.com\/tokeninfo\?id_token=([^&]+)$/.exec(String(url));
      if (!m) throw new Error('unexpected URL');
      if (state.g.down) return { getResponseCode: () => 503, getContentText: () => '' };
      const info = state.g.tokens[decodeURIComponent(m[1])];
      return info ? { getResponseCode: () => 200, getContentText: () => JSON.stringify(info) } : { getResponseCode: () => 400, getContentText: () => '{}' };
    } },
    console
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'google-apps-script.js'), 'utf8'), ctx, { filename: 'google-apps-script.js' });
  ctx.now_ = () => new Date(state.clock.getTime());
  const mint = (email, over = {}) => { const t = 'mk' + (++state.g.n) + '.p' + state.g.n + '.s' + state.g.n; state.g.tokens[t] = Object.assign({ aud: CLIENT, iss: 'https://accounts.google.com', exp: String(Math.floor(state.clock.getTime() / 1000) + 3600), email, email_verified: 'true' }, over); return t; };
  const post = body => { const b = Object.assign({}, body); if ('as' in b) { b.idToken = mint(b.as); delete b.as; } return JSON.parse(ctx.doPost({ parameter: {}, postData: { type: 'text/plain', contents: JSON.stringify(b) } }).getContent()); };
  const set = (r, h, v) => sheet._set(r, HEADERS.indexOf(h) + 1, v);
  const seed = (r, over = {}) => { const v = Object.assign({ Token: '26-AND-00' + r, Name: 'Riya Patil', Score: 640, Rank: 5200, Category: 'OBC', 'Counsellor Name': 'Counsellor A', 'Counsellor WhatsApp': '+91 90000-00001',
    'WhatsApp Group Link': 'https://chat.whatsapp.com/abc', Stage: 'Counselled', 'Dashboard URL': 'https://x.invalid/?token=secret', 'Inquiry Token': 'INQ-SECRET', 'Saved Shortlist': JSON.stringify({ MCC: [{ name: 'Demo Medical College' }], MH: [], OPEN: [] }),
    'Student Phone': '9876543210', 'Approved Email': EMAIL }, over); Object.keys(v).forEach(h => set(r, h, v[h])); };
  return { ctx, state, ss, sheet, mint, post, set, seed, snap: () => JSON.stringify(sheet.rows) };
}

const tests = []; const test = (n, f) => tests.push({ n, f });

test('M1 getStudent returns only the page fields; no phone, token, link or inquiry id', () => {
  const e = build(); e.seed(2);
  const r = e.post({ action: 'getStudent', as: EMAIL });
  assert.strictEqual(r.success, true);
  assert.deepStrictEqual(Object.keys(r.data).sort(), ['category', 'counsellor_name', 'counsellor_whatsapp', 'document_status', 'name', 'rank', 'saved_colleges', 'score', 'stage', 'whatsapp_group_link']);
  assert.strictEqual(r.data.counsellor_whatsapp, '919000000001');
  const blob = JSON.stringify(r); ['9876543210', 'INQ-SECRET', 'secret', '26-AND-002'].forEach(x => assert.ok(!blob.includes(x), 'must not leak ' + x));
});
test('M2 a link/token alone does nothing: GET anything, POST with only token, Token-column value as idToken', () => {
  const e = build(); e.seed(2);
  for (const p of [{ action: 'getStudent', token: '26-AND-002' }, {}, { token: '26-AND-002' }]) assert.deepStrictEqual(JSON.parse(e.ctx.doGet({ parameter: p }).getContent()), { error: 'invalid_action' });
  assert.deepStrictEqual(e.post({ action: 'getStudent', token: '26-AND-002' }), { error: 'auth_required' });
  assert.deepStrictEqual(e.post({ action: 'getStudent', idToken: '26-AND-002' }), { error: 'auth_invalid' });
  assert.deepStrictEqual(e.post({ action: 'saveShortlist', token: '26-AND-002', colleges: { MCC: [] } }), { error: 'auth_required' });
  assert.deepStrictEqual(e.post({ action: 'bogus', as: EMAIL }), { error: 'invalid_action' });
});
test('M3 bad Google tokens: other app, wrong issuer, expired, unverified, bad email; unknown email => not_approved', () => {
  const e = build(); e.seed(2);
  const p = t => e.post({ action: 'getStudent', idToken: t });
  assert.deepStrictEqual(p(e.mint(EMAIL, { aud: 'other-app' })), { error: 'auth_invalid' });
  assert.deepStrictEqual(p(e.mint(EMAIL, { iss: 'https://evil.invalid' })), { error: 'auth_invalid' });
  assert.deepStrictEqual(p(e.mint(EMAIL, { exp: String(Math.floor(e.state.clock.getTime() / 1000) - 1) })), { error: 'auth_invalid' });
  assert.deepStrictEqual(p(e.mint(EMAIL, { email_verified: 'false' })), { error: 'auth_invalid' });
  assert.deepStrictEqual(p(e.mint('nope')), { error: 'auth_invalid' });
  assert.deepStrictEqual(p(e.mint(EMAIL2)), { error: 'not_approved' });
  assert.strictEqual(p(e.mint(' ' + EMAIL.toUpperCase())).success, true, 'case/space-insensitive');
  assert.ok(!e.state.logs.some(l => l.includes(EMAIL) || l.includes('mk1.')), 'no email or token in logs');
});
test('M4 duplicate Approved Email: nobody served, nothing written; Google down or no client id => server_error', () => {
  const e = build(); e.seed(2); e.seed(3, { Name: 'Sibling' }); const before = e.snap();
  assert.deepStrictEqual(e.post({ action: 'getStudent', as: EMAIL }), { error: 'not_approved' });
  assert.deepStrictEqual(e.post({ action: 'saveDocStatus', as: EMAIL, data: { checked: [] } }), { error: 'not_approved' });
  assert.strictEqual(e.snap(), before);
  const f = build(); f.seed(2); f.state.g.down = true;
  assert.deepStrictEqual(f.post({ action: 'getStudent', as: EMAIL }), { error: 'server_error' });
  f.state.g.down = false; delete f.state.props.GOOGLE_CLIENT_ID;
  assert.deepStrictEqual(f.post({ action: 'getStudent', as: EMAIL }), { error: 'server_error' });
});
test('M5 saveShortlist: valid list saved as text on the signed-in row only; bad shapes rejected without writing', () => {
  const e = build(); e.seed(2); e.seed(3, { Name: 'Kabir', 'Approved Email': EMAIL2, 'Saved Shortlist': '' });
  const list = { MCC: [{ name: '=HYPERLINK("http://x.invalid","y")', meta: '' }], MH: [], OPEN: [] };
  assert.deepStrictEqual(e.post({ action: 'saveShortlist', as: EMAIL2, colleges: list }), { success: true, count: 1 });
  assert.deepStrictEqual(JSON.parse(e.sheet.cell(3, 'Saved Shortlist')), list);
  assert.strictEqual(e.sheet.formats['3,14'], '@');
  assert.ok(e.sheet.cell(2, 'Saved Shortlist').includes('Demo Medical College'), 'other row untouched');
  const before = e.snap();
  const bad = [[], 'x', null, { MCC: 'x' }, { MCC: [1] }, { MCC: [[1]] }, { 'bad key!': [] }, { MCC: [null] }, { MCC: new Array(301).fill({ a: 1 }) }, { MCC: [{ a: 'x'.repeat(2100) }] }, Object.fromEntries(Array.from({ length: 11 }, (_, i) => ['G' + i, []]))];
  bad.forEach((b, i) => assert.deepStrictEqual(e.post({ action: 'saveShortlist', as: EMAIL2, colleges: b }), { error: 'invalid_input' }, 'bad #' + i));
  assert.strictEqual(e.snap(), before);
});
test('M6 saveDocStatus: normalised; bad input rejected; a token in the body cannot redirect the write', () => {
  const e = build(); e.seed(2); e.seed(3, { Name: 'Kabir', 'Approved Email': EMAIL2 });
  assert.deepStrictEqual(e.post({ action: 'saveDocStatus', as: EMAIL2, token: '26-AND-002', data: JSON.stringify({ checked: ['a', 'b', 'a'], category: 'OBC', quota: 'State' }) }), { success: true });
  assert.deepStrictEqual(JSON.parse(e.sheet.cell(3, 'Document Status')), { checked: ['a', 'b'], category: 'OBC', quota: 'State' });
  assert.strictEqual(e.sheet.cell(2, 'Document Status'), '', 'row 2 untouched');
  const before = e.snap();
  for (const bad of ['not json', '{}', JSON.stringify({ checked: 'x' }), JSON.stringify({ checked: ['<b>'] }), JSON.stringify({ checked: [1] }), JSON.stringify({ checked: new Array(501).fill('a') }), JSON.stringify([1]), undefined])
    assert.deepStrictEqual(e.post({ action: 'saveDocStatus', as: EMAIL2, data: bad }), { error: 'invalid_input' });
  assert.strictEqual(e.snap(), before);
});
test('M7 lock busy => busy and no write; missing/duplicate "Approved Email" header => server_error', () => {
  const e = build(); e.seed(2); const before = e.snap(); e.state.lockBusy = true;
  assert.deepStrictEqual(e.post({ action: 'saveShortlist', as: EMAIL, colleges: { MCC: [] } }), { error: 'busy' }); assert.strictEqual(e.snap(), before);
  const f = build(); f.seed(2); f.sheet.rows[0][HEADERS.indexOf('Approved Email')] = 'Email';
  assert.deepStrictEqual(f.post({ action: 'getStudent', as: EMAIL }), { error: 'server_error' });
  const g = build(); g.seed(2); g.sheet.rows[0][HEADERS.indexOf('Spare 20')] = 'Approved Email';
  assert.deepStrictEqual(g.post({ action: 'getStudent', as: EMAIL }), { error: 'server_error' }, 'repeated header is ambiguous => closed');
});
test('M8 caching: a verified token is reused, but un-approving the email takes effect at once; works without cache', () => {
  const e = build(); e.seed(2); const t = e.mint(EMAIL); const call = () => e.post({ action: 'getStudent', idToken: t });
  assert.strictEqual(call().success, true); assert.strictEqual(call().success, true); assert.strictEqual(e.state.g.fetches, 1);
  e.set(2, 'Approved Email', ''); assert.deepStrictEqual(call(), { error: 'not_approved' });
  e.set(2, 'Approved Email', EMAIL); e.state.cacheThrows = true; assert.strictEqual(e.post({ action: 'getStudent', as: EMAIL }).success, true);
});
test('M9 only short codes ever reach the browser', () => {
  const e = build(); e.seed(2);
  const ok = new Set(['auth_required', 'auth_invalid', 'not_approved', 'invalid_input', 'busy', 'server_error', 'invalid_action']);
  [{ action: 'getStudent' }, { action: 'getStudent', idToken: 'a.b.c' }, { action: 'saveDocStatus', as: EMAIL, data: '{{{' }, { action: 'saveShortlist', as: EMAIL, colleges: 1 }].forEach(b => {
    const r = e.post(b); assert.ok(!r.error || ok.has(r.error)); assert.ok(!/Error|at |\.gs|Exception/.test(JSON.stringify(r)));
  });
  e.sheet.getRange = () => { throw new Error('Mock: internal boom'); };
  const r = e.post({ action: 'getStudent', as: EMAIL }); assert.deepStrictEqual(r, { error: 'server_error' });
});
test('M10 checkApprovedEmails: blank / invalid / duplicate listed in the Email Check tab only; nothing else written', () => {
  const e = build();
  e.seed(2, { Name: 'Good One' }); e.seed(3, { Name: 'Blank One', 'Approved Email': '' }); e.seed(4, { Name: 'Invalid One', 'Approved Email': 'oops' });
  e.seed(5, { Name: 'Dup One', 'Approved Email': EMAIL.toUpperCase() }); e.seed(6, { Name: '', Token: '', 'Approved Email': '' });
  const res = e.ctx.checkApprovedEmails(); assert.deepStrictEqual({ c: res.checked, p: res.problems }, { c: 4, p: 4 });
  const text = JSON.stringify(e.ss.getSheetByName('Email Check').rows);
  ['Blank One', 'Invalid One', 'Dup One', 'Good One', 'Also on rows: 5'].forEach(x => assert.ok(text.includes(x), x));
  assert.ok(!text.includes('26-AND') && !text.includes('9876543210') && !text.includes('secret'));
  assert.strictEqual(e.sheet.writeLog.length, 0, 'the dashboard tab itself is never written by the check (only its own Email Check tab)');
});

let p = 0, f = 0;
for (const t of tests) { try { t.f(); p++; console.log('PASS ' + t.n); } catch (er) { f++; console.log('FAIL ' + t.n + '\n      -> ' + er.message.split('\n')[0]); if (process.env.VERBOSE) console.log(er.stack); } }
console.log(`\n${p} passed, ${f} failed, ${tests.length} total`); process.exit(f ? 1 : 0);
