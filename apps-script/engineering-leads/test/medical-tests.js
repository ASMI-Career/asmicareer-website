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
test('M4 Google unreachable or no client id => server_error (fail closed)', () => {
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
test('M10 checkApprovedEmails: blank / invalid are problems; shared emails are listed for information; the Email Check tab only', () => {
  const e = build();
  e.seed(2, { Name: 'Good One' }); e.seed(3, { Name: 'Blank One', 'Approved Email': '' }); e.seed(4, { Name: 'Invalid One', 'Approved Email': 'fine@example.invalid, oops' });
  e.seed(5, { Name: 'Twin A', 'Approved Email': 'a1@example.invalid, ' + PARENT }); e.seed(6, { Name: 'Twin B', 'Approved Email': 'a2@example.invalid;' + PARENT.toUpperCase() });
  e.seed(7, { Name: '', Token: '', 'Approved Email': '' });
  const res = e.ctx.checkApprovedEmails(); assert.deepStrictEqual({ c: res.checked, p: res.problems, s: res.shared }, { c: 5, p: 2, s: 2 });
  const text = JSON.stringify(e.ss.getSheetByName('Email Check').rows);
  ['Blank One', 'Invalid One', 'Twin A', 'Twin B', 'Shared emails (allowed', 'Shares an email with rows: 6', 'Shares an email with rows: 5'].forEach(x => assert.ok(text.includes(x), x));
  assert.ok(!text.includes('26-AND') && !text.includes('9876543210') && !text.includes('secret') && !text.includes('@'), 'no token, phone, link or email in the tab');
  assert.strictEqual(e.sheet.writeLog.length, 0, 'the dashboard tab itself is never written by the check');
});
const PARENT = 'parent.test@example.invalid', TWIN2 = 'twin2.test@example.invalid';
function twins() { const e = build(); e.seed(2, { Name: 'Riya Patil', 'Approved Email': EMAIL + ', ' + PARENT }); e.seed(3, { Name: 'Twin Two', Token: '26-AND-003', 'Approved Email': TWIN2 + ';\n' + PARENT.toUpperCase(), 'Saved Shortlist': '' }); return e; }
test('M14 twins + shared parent email: own email opens one child; shared email gets a choice list, no data', () => {
  const e = twins();
  assert.strictEqual(e.post({ action: 'getStudent', as: EMAIL }).data.name, 'Riya Patil'); assert.strictEqual(e.post({ action: 'getStudent', as: TWIN2 }).data.name, 'Twin Two');
  const ch = e.post({ action: 'getStudent', as: PARENT }); assert.deepStrictEqual(Object.keys(ch), ['success', 'choose']);
  assert.deepStrictEqual(ch.choose, [{ ref: '26-AND-002', name: 'Riya Patil' }, { ref: '26-AND-003', name: 'Twin Two' }]);
  ['9876543210', 'INQ-SECRET', 'secret', EMAIL, TWIN2].forEach(x => assert.ok(!JSON.stringify(ch).includes(x), 'must not leak ' + x));
  assert.strictEqual(e.post({ action: 'getStudent', as: PARENT, studentRef: '26-AND-003' }).data.name, 'Twin Two');
});
test('M15 a ref only picks among the rows the email is on; writes need a choice and touch only the chosen row', () => {
  const e = twins(); const snap = e.snap();
  assert.deepStrictEqual(e.post({ action: 'getStudent', as: EMAIL, studentRef: '26-AND-003' }), { error: 'not_approved' });
  assert.deepStrictEqual(e.post({ action: 'getStudent', as: PARENT, studentRef: '26-AND-999' }), { error: 'not_approved' });
  assert.deepStrictEqual(e.post({ action: 'getStudent', as: 'x@example.invalid', studentRef: '26-AND-002' }), { error: 'not_approved' });
  assert.deepStrictEqual(e.post({ action: 'saveShortlist', as: PARENT, colleges: { MCC: [] } }), { error: 'student_required' });
  assert.deepStrictEqual(e.post({ action: 'saveDocStatus', as: PARENT, data: { checked: [] } }), { error: 'student_required' });
  assert.deepStrictEqual(e.post({ action: 'saveShortlist', as: EMAIL, studentRef: '26-AND-003', colleges: { MCC: [] } }), { error: 'not_approved' });
  assert.strictEqual(e.snap(), snap, 'nothing written');
  assert.deepStrictEqual(e.post({ action: 'saveShortlist', as: PARENT, studentRef: '26-AND-003', colleges: { MCC: [{ name: 'Demo' }] } }), { success: true, count: 1 });
  assert.ok(e.sheet.cell(3, 'Saved Shortlist').includes('Demo')); assert.ok(e.sheet.cell(2, 'Saved Shortlist').includes('Demo Medical College'), 'the other twin untouched');
  assert.strictEqual(e.post({ action: 'saveDocStatus', as: PARENT, studentRef: '26-AND-002', data: { checked: ['x'] } }).success, true);
  assert.strictEqual(e.sheet.cell(3, 'Document Status'), '');
});
test('M16 limits: more than 10 rows on one email refused; rows without a Token not offered; one bad entry does not block the valid ones', () => {
  const e = build(); for (let r = 2; r <= 12; r++) e.seed(r, { Token: '26-AND-1' + r, 'Approved Email': PARENT, Name: 'S' + r });
  assert.deepStrictEqual(e.post({ action: 'getStudent', as: PARENT }), { error: 'not_approved' });
  const t = twins(); t.set(3, 'Token', ''); assert.strictEqual(t.post({ action: 'getStudent', as: PARENT }).data.name, 'Riya Patil');
  const u = twins(); u.set(3, 'Approved Email', TWIN2 + ', not-an-email'); assert.strictEqual(u.post({ action: 'getStudent', as: TWIN2 }).success, true);
});

const STAFF = 'counsellor.test@example.invalid';
function withStaff(emails = [STAFF]) { const e = build(); e.seed(2); const st = e.ss.add(new MockSheet('Staff', ['Notes', 'Staff Email'], { maxRows: 50 })); emails.forEach((x, i) => st._set(i + 2, 2, x)); return e; }
test('M11 staff actions need a signed-in email on the Staff tab; students and strangers are not_staff; fails closed', () => {
  const e = withStaff(['  ' + STAFF.toUpperCase()]);
  assert.deepStrictEqual(e.post({ action: 'staffCheck', as: STAFF }), { success: true });
  assert.deepStrictEqual(e.post({ action: 'staffCheck', as: EMAIL }), { error: 'not_staff' }, 'a student is not staff');
  assert.deepStrictEqual(e.post({ action: 'staffGetStudent', as: 'x@example.invalid', token: '26-AND-002' }), { error: 'not_staff' });
  assert.deepStrictEqual(e.post({ action: 'staffGetStudent', token: '26-AND-002' }), { error: 'auth_required' });
  assert.deepStrictEqual(JSON.parse(e.ctx.doGet({ parameter: { action: 'staffGetStudent', token: '26-AND-002' } }).getContent()), { error: 'invalid_action' });
  assert.deepStrictEqual(e.post({ action: 'getStudent', as: STAFF }), { error: 'not_approved' }, 'a staff email is not a student');
  const none = build(); none.seed(2); assert.deepStrictEqual(none.post({ action: 'staffCheck', as: STAFF }), { error: 'not_staff' }, 'no Staff tab');
  const h = withStaff(); h.ss.getSheetByName('Staff').rows[0][1] = 'Email'; assert.deepStrictEqual(h.post({ action: 'staffCheck', as: STAFF }), { error: 'not_staff' });
  const r = withStaff(); r.ss.getSheetByName('Staff').rows[1][1] = ''; assert.deepStrictEqual(r.post({ action: 'staffCheck', as: STAFF }), { error: 'not_staff' }, 'removed = locked out at once');
});
test('M12 staffGetStudent by internal Token: only the safe fields; unknown/bad token not_found', () => {
  const e = withStaff();
  const r = e.post({ action: 'staffGetStudent', as: STAFF, token: '26-AND-002' });
  assert.strictEqual(r.success, true); assert.strictEqual(r.data.name, 'Riya Patil');
  ['9876543210', 'INQ-SECRET', 'secret', EMAIL].forEach(x => assert.ok(!JSON.stringify(r).includes(x), 'must not leak ' + x));
  for (const bad of ['', undefined, null, 'x', "26-AND-002'", '26-AND-999', 5, { a: 1 }]) assert.deepStrictEqual(e.post({ action: 'staffGetStudent', as: STAFF, token: bad }), { error: 'not_found' }, String(bad));
});
test('M13 staffSaveShortlist: validated, merged by group, text cell, only that row; bad input writes nothing', () => {
  const e = withStaff(); e.seed(3, { Name: 'Kabir', 'Approved Email': EMAIL2, Token: '26-AND-003', 'Saved Shortlist': '' }); const row3 = JSON.stringify(e.sheet.rows[2]);
  const list = { MCC: [{ name: '=HYPERLINK("http://x.invalid","y")' }], MH: [], OPEN: [{ name: 'Demo OPEN' }] };
  assert.deepStrictEqual(e.post({ action: 'staffSaveShortlist', as: STAFF, token: '26-AND-002', colleges: list }), { success: true, count: 2 });
  assert.deepStrictEqual(JSON.parse(e.sheet.cell(2, 'Saved Shortlist')), list); assert.strictEqual(e.sheet.formats['2,14'], '@'); assert.strictEqual(JSON.stringify(e.sheet.rows[2]), row3);
  assert.strictEqual(e.post({ action: 'staffSaveShortlist', as: STAFF, token: '26-AND-002', colleges: { EXTRA: [{ name: 'x' }] } }).success, true);
  const kept = JSON.parse(e.sheet.cell(2, 'Saved Shortlist')); assert.strictEqual(kept.OPEN[0].name, 'Demo OPEN', 'groups not sent are kept'); assert.strictEqual(kept.EXTRA[0].name, 'x');
  const snap = e.snap();
  [[], 'x', null, { A: 'x' }, { A: [1] }, { 'bad key!': [] }, { A: new Array(301).fill({ a: 1 }) }].forEach((b, i) => assert.deepStrictEqual(e.post({ action: 'staffSaveShortlist', as: STAFF, token: '26-AND-002', colleges: b }), { error: 'invalid_input' }, 'bad #' + i));
  assert.deepStrictEqual(e.post({ action: 'staffSaveShortlist', as: STAFF, token: '26-AND-777', colleges: list }), { error: 'not_found' });
  e.state.lockBusy = true; assert.deepStrictEqual(e.post({ action: 'staffSaveShortlist', as: STAFF, token: '26-AND-002', colleges: list }), { error: 'busy' });
  e.state.lockBusy = false; assert.strictEqual(e.snap(), snap);
});

let p = 0, f = 0;
for (const t of tests) { try { t.f(); p++; console.log('PASS ' + t.n); } catch (er) { f++; console.log('FAIL ' + t.n + '\n      -> ' + er.message.split('\n')[0]); if (process.env.VERBOSE) console.log(er.stack); } }
console.log(`\n${p} passed, ${f} failed, ${tests.length} total`); process.exit(f ? 1 : 0);
