/**
 * MOCK tests for medical-leads.js.   Run:  node apps-script/medical-leads/test/run-tests.js
 * The real script code runs against an in-memory fake of Google's services. This is NOT proof of behaviour on real Sheets, Gmail or Google sign-in.
 */
'use strict';
const assert = require('assert');
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { MockSheet, MockSpreadsheet } = require('../../engineering-leads/test/mock-gas');

const SCRIPT = path.join(__dirname, '..', 'medical-leads.js');
const CLIENT = 'MOCK-CLIENT-ID.apps.googleusercontent.com';
const ENQ_ID = 'MOCK-MED-ENQUIRY', DASH_ID = 'MOCK-MED-REGISTRATION';
const EMAIL = 'riya.test@example.invalid', EMAIL2 = 'kabir.test@example.invalid', PARENT = 'parent.test@example.invalid', STAFF = 'counsellor.test@example.invalid';
const TOK = 'MED-ABCDEFGH23', TOK2 = 'MED-JKMNPQRS45';

function build(options = {}) {
  const state = { logs: [], mails: [], props: {}, cache: {}, cacheThrows: false, lockHeld: false, lockBusy: false, lockAcquired: 0, lockReleased: 0, mailQuota: 100,
    g: { tokens: {}, down: false, fetches: 0, n: 0 }, clock: new Date('2026-12-01T10:00:00Z'), spreadsheets: {} };
  const ctx = vm.createContext({
    Logger: { log: m => state.logs.push(String(m)) },
    Utilities: { getUuid: () => crypto.randomUUID(), DigestAlgorithm: { SHA_256: 'SHA_256' }, computeDigest: (a, t) => Array.from(crypto.createHash('sha256').update(String(t)).digest()).map(b => (b > 127 ? b - 256 : b)) },
    ContentService: { MimeType: { JSON: 'JSON' }, createTextOutput: s => ({ _s: s, setMimeType() { return this; }, getContent() { return this._s; } }) },
    MailApp: { sendEmail: m => { state.mails.push(m); }, getRemainingDailyQuota: () => state.mailQuota },
    LockService: { getScriptLock: () => ({ tryLock: () => { if (state.lockBusy || state.lockHeld) return false; state.lockHeld = true; state.lockAcquired++; return true; }, releaseLock: () => { state.lockHeld = false; state.lockReleased++; } }) },
    CacheService: { getScriptCache: () => { if (state.cacheThrows) throw new Error('cache down'); return { get: k => (k in state.cache ? state.cache[k] : null), put: (k, v) => { state.cache[k] = v; } }; } },
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => (k in state.props ? state.props[k] : null), setProperty: (k, v) => { state.props[k] = String(v); }, deleteProperty: k => { delete state.props[k]; }, getProperties: () => Object.assign({}, state.props) }) },
    SpreadsheetApp: { openById: id => { if (!state.spreadsheets[id]) throw new Error('Mock: no access to spreadsheet'); return state.spreadsheets[id]; } },
    UrlFetchApp: { fetch: url => {
      state.g.fetches++;
      const m = /^https:\/\/oauth2\.googleapis\.com\/tokeninfo\?id_token=([^&]+)$/.exec(String(url));
      if (!m) throw new Error('Mock: unexpected URL');
      if (state.g.down) return { getResponseCode: () => 503, getContentText: () => '' };
      const info = state.g.tokens[decodeURIComponent(m[1])];
      return info ? { getResponseCode: () => 200, getContentText: () => JSON.stringify(info) } : { getResponseCode: () => 400, getContentText: () => '{}' };
    } },
    console
  });
  vm.runInContext(fs.readFileSync(SCRIPT, 'utf8'), ctx, { filename: 'medical-leads.js' });
  ctx.now_ = () => new Date(state.clock.getTime());
  const get = n => vm.runInContext(n, ctx);
  const ENQ = get('ENQUIRY_HEADERS'), DASH = get('DASHBOARD_HEADERS'), STUDENT = get('STUDENT_HEADERS');

  // Enquiry workbook: real header names in a scrambled order, plus columns the script must never touch, plus a formula tab.
  const enq = new MockSpreadsheet(ENQ_ID);
  const enqHeaders = ['Dashboard Link', 'Counsellor Notes'].concat(Object.values(ENQ).slice().reverse()).concat(['Remark']);
  get('ENQUIRY_TABS').forEach(tab => {
    const sh = enq.add(new MockSheet(tab, enqHeaders, { maxRows: 2000 }));
    const linkCol = enqHeaders.indexOf('Dashboard Link') + 1;
    for (let r = 2; r <= 60; r++) sh._set(r, linkCol, '=HYPERLINK("https://example.invalid/" & ROW(),"link")');
  });
  const allLeads = enq.add(new MockSheet('All Leads', ['Timestamp', 'Token Number', 'Student Name'])); allLeads._set(2, 1, '=QUERY({Online!A:C},"select *")'); allLeads.writeLog.length = 0;

  // Registration workbook: the Student Dashboard tab with DECOY columns (phones, notes) the page's data must never include, and a Staff tab.
  const dash = new MockSpreadsheet(DASH_ID);
  const dashHeaders = ['Parent Notes', 'Student Phone'].concat(Array.from(new Set(Object.values(DASH).concat(Object.values(STUDENT))))).concat(['Admin Remarks']);
  const dsheet = dash.add(new MockSheet('Student Dashboard', dashHeaders, { maxRows: 2000 }));
  if (options.staff !== false) { const st = dash.add(new MockSheet('Staff', ['Notes', 'Staff Email'], { maxRows: 50 })); st._set(2, 2, STAFF); }

  state.spreadsheets[ENQ_ID] = enq; state.spreadsheets[DASH_ID] = dash;
  state.props.ENQUIRY_SPREADSHEET_ID = ENQ_ID; state.props.DASHBOARD_SPREADSHEET_ID = DASH_ID; state.props.GOOGLE_CLIENT_ID = CLIENT; state.props.LEAD_ALERT_EMAIL = 'alerts@example.invalid';

  const mint = (email, over = {}) => { const t = 'mk' + (++state.g.n) + '.p' + state.g.n + '.s' + state.g.n; state.g.tokens[t] = Object.assign({ aud: CLIENT, iss: 'https://accounts.google.com', exp: String(Math.floor(state.clock.getTime() / 1000) + 3600), email, email_verified: 'true' }, over); return t; };
  const post = body => { const b = Object.assign({}, body); if ('as' in b) { b.idToken = mint(b.as); delete b.as; } return JSON.parse(ctx.doPost({ parameter: {}, postData: { type: 'text/plain', contents: JSON.stringify(b) } }).getContent()); };
  const submit = params => JSON.parse(ctx.doPost({ parameter: params }).getContent());
  const set = (r, h, v, sheet = dsheet) => sheet._set(r, sheet.rows[0].indexOf(h) + 1, v);
  const seed = (r, over = {}) => { const v = Object.assign({ 'Token': TOK, 'Approved Email': EMAIL, 'Stream': 'Medical', 'Student Name': 'Riya Patil', 'NEET Score': 640, 'NEET Rank (AIR)': 5200, 'Category': 'OBC',
    'Stage': 'Counselled', 'Counsellor Name': 'Counsellor A', 'Counsellor WhatsApp': '+91 90000-00001', 'WhatsApp Group Link': 'https://chat.whatsapp.com/abc',
    'Saved Shortlist': JSON.stringify({ MCC: [{ name: 'Demo Medical College' }], MH: [], OPEN: [] }), 'Student Phone': '9876543210', 'Parent Notes': 'father 9123456780', 'Admin Remarks': 'secret-admin-note', 'Inquiry Token': 'INQ-SECRET' }, over);
    Object.keys(v).forEach(h => set(r, h, v[h])); dsheet.writeLog.length = 0; };
  return { ctx, state, enq, dash, dsheet, allLeads, mint, post, submit, set, seed, get, ENQ, DASH, STUDENT, enqHeaders, dashHeaders, snap: () => JSON.stringify(dsheet.rows) };
}

// The payload the real /medical/inquiry page sends (see nextjs-sandbox/app/medical/inquiry/page.js).
const good = (over = {}) => Object.assign({ source: 'Thane', branch: 'Thane', stream: 'Medical', fullName: 'Aarav Deshmukh', neetRank: '5200', studentContact: '98765 43210',
  fatherContact: '', motherContact: '', coachingClass: 'Test Classes', city: 'Mumbai', category: 'General', courses: 'MBBS, BDS', budget: 'Govt', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'med', gclid: 'abc123' }, over);
const leadRows = (sheet, th = 'Token Number', nh = 'Student Name') => { const out = []; for (let r = 2; r <= sheet.rows.length; r++) if (String(sheet.cell(r, th)) !== '' || String(sheet.cell(r, nh)) !== '') out.push(r); return out; };
const ENQ_TABS = ['Online', 'Andheri', 'Thane', 'Pune', 'Sangli', 'Kolhapur', 'Sambhajinagar', 'Seminar'];
const totalLeads = env => ENQ_TABS.reduce((n, t) => n + leadRows(env.enq.getSheetByName(t)).length, 0);
const tabsWithLeads = env => ENQ_TABS.filter(t => leadRows(env.enq.getSheetByName(t)).length > 0);
const dashRows = env => leadRows(env.dsheet, 'Token', 'Student Name');
const getStudent = (env, email) => env.post({ action: 'getStudent', as: email });

const tests = []; const test = (n, f) => tests.push({ n, f });

// ── lead flow ─────────────────────────────────────────────────
test('L1 happy path: the real medical form payload lands in the Thane tab, a MED- token, a Student Dashboard row, an alert', () => {
  const env = build(); const res = env.submit(good());
  assert.strictEqual(res.ok, true); assert.match(res.token, /^MED-[A-HJKMNP-Z2-9]{10}$/); assert.strictEqual(res.duplicate, false);
  assert.deepStrictEqual(tabsWithLeads(env), ['Thane']);
  const thane = env.enq.getSheetByName('Thane'), r = leadRows(thane)[0], row = thane.obj(r);
  assert.strictEqual(r, 2, 'first data row even though formulas fill another column');
  assert.strictEqual(row['Token Number'], res.token); assert.strictEqual(row['Student Name'], 'Aarav Deshmukh'); assert.strictEqual(row['Student Contact'], '9876543210');
  assert.strictEqual(row['NEET Rank (AIR)'], 5200); assert.strictEqual(typeof row['NEET Rank (AIR)'], 'number'); assert.strictEqual(row['Branch'], 'Thane'); assert.strictEqual(row['Courses'], 'MBBS, BDS');
  assert.strictEqual(row['Plan'], 'Explore'); assert.strictEqual(row['utm_campaign'], 'med'); assert.strictEqual(row['gclid'], 'abc123'); assert.strictEqual(row['Duplicate Flag'], '');
  assert.ok(String(row['Dashboard Link']).startsWith('=HYPERLINK'), 'formula column untouched'); assert.strictEqual(row['Counsellor Notes'], '');
  assert.strictEqual(env.allLeads.writeLog.length, 0, 'All Leads never written');
  const d = dashRows(env); assert.strictEqual(d.length, 1); const dr = env.dsheet.obj(d[0]);
  assert.strictEqual(dr['Token'], res.token); assert.strictEqual(dr['Inquiry Token'], res.token); assert.strictEqual(dr['Stream'], 'Medical'); assert.strictEqual(dr['Plan'], 'Explore');
  assert.strictEqual(dr['NEET Rank (AIR)'], 5200); assert.strictEqual(dr['Category'], 'General'); assert.strictEqual(dr['Branch'], 'Thane'); assert.strictEqual(dr['Dashboard URL'], 'https://asmicareer.in/student');
  assert.strictEqual(dr['Approved Email'], ''); assert.strictEqual(dr['Student Phone'], '', 'no phone ever copied into the registration sheet');
  assert.strictEqual(env.state.mails.length, 1); assert.match(env.state.mails[0].subject, /\[ASMI Medical\].*Aarav Deshmukh \(Thane\)/); assert.ok(!/ENGINEERING/i.test(env.state.mails[0].body));
});
test('L2 routing by the form\'s branch: Online default, unknown => Online, Mumbai => Andheri, Seminar sends no alert by default', () => {
  for (const [src, tab] of [['Online', 'Online'], ['andheri', 'Andheri'], ['Mumbai', 'Andheri'], ['Pune', 'Pune'], ['Narnia', 'Online'], ['', 'Online'], ['Seminar', 'Seminar']]) {
    const env = build(); env.submit(good({ source: src, branch: src })); assert.deepStrictEqual(tabsWithLeads(env), [tab], 'source ' + src);
    if (tab === 'Seminar') assert.strictEqual(env.state.mails.length, 0, 'seminar walk-in: no email unless SEMINAR_ALERTS=true');
  }
});
test('L3 validation: bad name / phone / rank are rejected with nothing written; a blank rank and bad parent numbers are tolerated', () => {
  const env = build();
  for (const [over, field] of [[{ fullName: 'A' }, 'Full Name'], [{ fullName: '=cmd|x' }, 'Full Name'], [{ studentContact: '12345' }, 'Student Contact'], [{ studentContact: '' }, 'Student Contact'], [{ neetRank: '0' }, 'NEET Rank (AIR)'], [{ neetRank: 'abc' }, 'NEET Rank (AIR)'], [{ neetRank: '9999999' }, 'NEET Rank (AIR)'], [{ neetRank: '1.5' }, 'NEET Rank (AIR)']]) {
    const r = env.submit(good(over)); assert.strictEqual(r.ok, false, JSON.stringify(over)); assert.ok(r.errors.some(e => e.field === field), field);
  }
  assert.strictEqual(totalLeads(env), 0); assert.strictEqual(dashRows(env).length, 0); assert.strictEqual(env.state.mails.length, 0);
  const ok = env.submit(good({ neetRank: '', fatherContact: '123', motherContact: '98765 00011', studentContact: '9876500001' })); assert.strictEqual(ok.ok, true);
  const row = env.enq.getSheetByName('Thane').obj(leadRows(env.enq.getSheetByName('Thane'))[0]); assert.strictEqual(row['NEET Rank (AIR)'], ''); assert.strictEqual(row['Father Contact'], '123'); assert.strictEqual(row['Mother Contact'], '9876500011');
  assert.ok(/Father Contact looks invalid/.test(env.state.mails[0].body));
});
test('L4 text is stored as text: a value like =HYPERLINK or +44 is never read as a formula', () => {
  const env = build(); env.submit(good({ city: '=HYPERLINK("http://x.invalid","y")', coachingClass: '+44 1234', courses: '@SUM(1)' }));
  const sh = env.enq.getSheetByName('Thane'); const col = h => sh.rows[0].indexOf(h) + 1;
  for (const h of ['City', 'Coaching Class', 'Courses']) assert.strictEqual(sh.formats['2,' + col(h)], '@', h + ' is a plain-text cell');
});
test('L5 same phone within 24h: same token, a second enquiry row flagged DUPLICATE, no second dashboard row', () => {
  const env = build(); const a = env.submit(good()); env.state.clock = new Date(env.state.clock.getTime() + 3600e3); const b = env.submit(good({ fullName: 'Aarav D', source: 'Andheri', branch: 'Andheri' }));
  assert.strictEqual(b.token, a.token); assert.strictEqual(b.duplicate, true); assert.strictEqual(dashRows(env).length, 1); assert.strictEqual(totalLeads(env), 2);
  assert.match(env.enq.getSheetByName('Andheri').cell(2, 'Duplicate Flag'), /^DUPLICATE .*Thane row 2/);
  env.state.clock = new Date(env.state.clock.getTime() + 48 * 3600e3); const c = env.submit(good()); assert.notStrictEqual(c.token, a.token, 'after 24h it is a new lead');
});
test('L6 a missing enquiry header parks the lead (nothing written, alert says QUEUED); after the fix replayPendingLeads writes it with its original time', () => {
  const env = build(); const th = env.enq.getSheetByName('Thane'); const i = th.rows[0].indexOf('Budget'); th.rows[0][i] = 'Budget (old)';
  const res = env.submit(good()); assert.strictEqual(res.ok, true); assert.strictEqual(res.queued, true);
  assert.strictEqual(totalLeads(env), 0); assert.strictEqual(dashRows(env).length, 0);
  assert.strictEqual(Object.keys(env.state.props).filter(k => k.startsWith('PENDING_LEAD_')).length, 1);
  assert.ok(env.state.mails.some(m => /NOT SAVED TO SHEET/.test(m.subject))); assert.ok(env.state.mails.some(m => /SETUP\/ERROR/.test(m.subject) && /Budget/.test(m.body)));
  const queuedAt = new Date(env.state.clock); env.state.clock = new Date(queuedAt.getTime() + 7200e3); th.rows[0][i] = 'Budget';
  const rep = env.ctx.replayPendingLeads(); assert.deepStrictEqual({ r: rep.replayed, m: rep.remaining }, { r: 1, m: 0 });
  assert.strictEqual(Object.keys(env.state.props).filter(k => k.startsWith('PENDING_LEAD_')).length, 0); assert.strictEqual(totalLeads(env), 1);
  assert.strictEqual(+th.cell(2, 'Timestamp'), +queuedAt, 'original submission time kept');
});
test('L7 a failed dashboard WRITE never loses the enquiry; repairMissingDashboardRows fills the row in once, then is idempotent', () => {
  const env = build(); env.dsheet.failOnSetValues = 1;                                   // the registration sheet refuses one write
  const res = env.submit(good()); assert.strictEqual(res.ok, true); assert.strictEqual(totalLeads(env), 1); assert.strictEqual(dashRows(env).length, 0);
  assert.ok(env.state.mails.some(m => /DASHBOARD ROW FAILED/.test(m.subject))); assert.ok(env.state.mails.some(m => /SETUP\/ERROR: Dashboard row failed/.test(m.subject)));
  assert.strictEqual(env.ctx.repairMissingDashboardRows().created, 1); assert.strictEqual(env.ctx.repairMissingDashboardRows().created, 0);
  const dr = env.dsheet.obj(dashRows(env)[0]); assert.strictEqual(dr['Token'], res.token); assert.strictEqual(dr['NEET Rank (AIR)'], 5200); assert.strictEqual(dr['Branch'], 'Thane');
});
test('L7b a bad DASHBOARD header parks the whole lead (nothing half-written), then replay works after the fix', () => {
  const env = build(); const i = env.dsheet.rows[0].indexOf('Branch'); env.dsheet.rows[0][i] = 'Branch (old)';
  const res = env.submit(good()); assert.strictEqual(res.queued, true); assert.strictEqual(totalLeads(env), 0); assert.strictEqual(dashRows(env).length, 0);
  env.dsheet.rows[0][i] = 'Branch'; assert.strictEqual(env.ctx.replayPendingLeads().replayed, 1); assert.strictEqual(totalLeads(env), 1); assert.strictEqual(dashRows(env).length, 1);
});
test('L8 honeypot: pretend success, store nothing; lock busy parks the lead; GET exposes nothing', () => {
  const env = build(); assert.deepStrictEqual(env.submit(good({ website_url: 'http://spam.invalid' })), { ok: true }); assert.strictEqual(totalLeads(env), 0);
  env.state.lockBusy = true; const r = env.submit(good()); assert.strictEqual(r.queued, true); assert.strictEqual(totalLeads(env), 0); env.state.lockBusy = false;
  assert.deepStrictEqual(Object.keys(JSON.parse(env.ctx.doGet({ parameter: {} }).getContent())).sort(), ['ok', 'service', 'version']);
  for (const a of ['getStudent', 'saveDocStatus', 'saveShortlist']) assert.deepStrictEqual(JSON.parse(env.ctx.doGet({ parameter: { action: a, token: TOK } }).getContent()), { error: 'invalid_action' });
});

// ── student dashboard (Google sign-in) ────────────────────────
test('S1 getStudent: only the page fields; numbers stay numbers; no phone, link, token or decoy column; token alone is nothing', () => {
  const env = build(); env.seed(2); const r = getStudent(env, EMAIL);
  assert.strictEqual(r.success, true); assert.deepStrictEqual(Object.keys(r.data).sort(), ['category', 'counsellor_name', 'counsellor_whatsapp', 'document_status', 'name', 'rank', 'saved_colleges', 'score', 'stage', 'whatsapp_group_link']);
  assert.strictEqual(r.data.score, 640); assert.strictEqual(r.data.rank, 5200); assert.strictEqual(r.data.counsellor_whatsapp, '919000000001'); assert.strictEqual(r.data.stage, 'Counselled');
  const blob = JSON.stringify(r); ['9876543210', '9123456780', 'secret-admin-note', 'INQ-SECRET', TOK, EMAIL].forEach(x => assert.ok(!blob.includes(x), 'must not leak ' + x));
  assert.deepStrictEqual(env.post({ action: 'getStudent', token: TOK }), { error: 'auth_required' }); assert.deepStrictEqual(env.post({ action: 'getStudent', token: TOK, idToken: TOK }), { error: 'auth_invalid' });
  env.set(2, 'NEET Score', ''); env.set(2, 'NEET Rank (AIR)', 'n/a'); const d = getStudent(env, EMAIL).data; assert.strictEqual(d.score, null); assert.strictEqual(d.rank, null);
});
test('S2 bad Google tokens and unknown / wrong-stream / token-less rows are refused with short codes only', () => {
  const env = build(); env.seed(2); const p = t => env.post({ action: 'getStudent', idToken: t });
  assert.deepStrictEqual(p(env.mint(EMAIL, { aud: 'other-app' })), { error: 'auth_invalid' }); assert.deepStrictEqual(p(env.mint(EMAIL, { iss: 'https://evil.invalid' })), { error: 'auth_invalid' });
  assert.deepStrictEqual(p(env.mint(EMAIL, { exp: String(Math.floor(env.state.clock.getTime() / 1000) - 1) })), { error: 'auth_invalid' }); assert.deepStrictEqual(p(env.mint(EMAIL, { email_verified: 'false' })), { error: 'auth_invalid' });
  assert.deepStrictEqual(p(env.mint(EMAIL2)), { error: 'not_approved' });
  env.set(2, 'Stream', 'Engineering'); assert.deepStrictEqual(getStudent(env, EMAIL), { error: 'not_approved' }, 'an Engineering row is never served by the medical script');
  env.set(2, 'Stream', 'Medical'); env.set(2, 'Token', ''); assert.deepStrictEqual(getStudent(env, EMAIL), { error: 'not_approved' });
  env.state.g.down = true; assert.deepStrictEqual(env.post({ action: 'getStudent', idToken: env.mint(EMAIL) }), { error: 'server_error' }); env.state.g.down = false;
  delete env.state.props.GOOGLE_CLIENT_ID; assert.deepStrictEqual(env.post({ action: 'getStudent', idToken: env.mint(EMAIL) }), { error: 'server_error' });
  assert.ok(!env.state.logs.some(l => l.includes(EMAIL)), 'no emails in logs');
});
test('S3 twins + shared parent email: own email opens one child; the shared email gets a names-only choice; a ref can only pick among its own rows', () => {
  const env = build(); env.seed(2, { 'Approved Email': EMAIL + ', ' + PARENT }); env.seed(3, { 'Token': TOK2, 'Approved Email': TWIN2(), 'Student Name': 'Twin Two', 'Saved Shortlist': '' });
  function TWIN2() { return EMAIL2 + ';\n' + PARENT.toUpperCase(); }
  assert.strictEqual(getStudent(env, EMAIL).data.name, 'Riya Patil'); assert.strictEqual(getStudent(env, EMAIL2).data.name, 'Twin Two');
  const ch = getStudent(env, PARENT); assert.deepStrictEqual(Object.keys(ch), ['success', 'choose']); assert.deepStrictEqual(ch.choose, [{ ref: TOK, name: 'Riya Patil' }, { ref: TOK2, name: 'Twin Two' }]);
  assert.strictEqual(env.post({ action: 'getStudent', as: PARENT, studentRef: TOK2 }).data.name, 'Twin Two');
  const snap = env.snap();
  assert.deepStrictEqual(env.post({ action: 'getStudent', as: EMAIL, studentRef: TOK2 }), { error: 'not_approved' }); assert.deepStrictEqual(env.post({ action: 'saveShortlist', as: PARENT, colleges: { MCC: [] } }), { error: 'student_required' });
  assert.deepStrictEqual(env.post({ action: 'saveShortlist', as: EMAIL, studentRef: TOK2, colleges: { MCC: [] } }), { error: 'not_approved' }); assert.strictEqual(env.snap(), snap);
  assert.deepStrictEqual(env.post({ action: 'saveShortlist', as: PARENT, studentRef: TOK2, colleges: { MCC: [{ name: 'X' }] } }), { success: true, count: 1 });
  assert.ok(env.dsheet.cell(3, 'Saved Shortlist').includes('"X"') && env.dsheet.cell(2, 'Saved Shortlist').includes('Demo Medical College'), 'only the chosen twin changed');
});
test('S4 saves: validated, plain text, only the signed-in student\'s row; bad shapes write nothing; lock busy', () => {
  const env = build(); env.seed(2); env.seed(3, { 'Token': TOK2, 'Approved Email': EMAIL2, 'Student Name': 'Kabir', 'Saved Shortlist': '' });
  const list = { MCC: [{ name: '=HYPERLINK("http://x.invalid","y")' }], MH: [], OPEN: [] };
  assert.deepStrictEqual(env.post({ action: 'saveShortlist', as: EMAIL2, colleges: list }), { success: true, count: 1 }); assert.deepStrictEqual(JSON.parse(env.dsheet.cell(3, 'Saved Shortlist')), list);
  assert.strictEqual(env.dsheet.formats['3,' + (env.dsheet.rows[0].indexOf('Saved Shortlist') + 1)], '@'); assert.ok(env.dsheet.cell(2, 'Saved Shortlist').includes('Demo Medical College'));
  assert.strictEqual(env.post({ action: 'saveDocStatus', as: EMAIL2, data: JSON.stringify({ checked: ['a', 'b', 'a'], category: 'OBC', quota: 'State' }) }).success, true);
  assert.deepStrictEqual(JSON.parse(env.dsheet.cell(3, 'Document Status')), { checked: ['a', 'b'], category: 'OBC', quota: 'State' }); assert.strictEqual(env.dsheet.cell(2, 'Document Status'), '');
  const snap = env.snap();
  [[], 'x', null, { A: 'x' }, { A: [1] }, { 'bad key!': [] }, { A: new Array(301).fill({ a: 1 }) }, { A: [{ a: 'x'.repeat(2100) }] }].forEach((b, i) => assert.deepStrictEqual(env.post({ action: 'saveShortlist', as: EMAIL2, colleges: b }), { error: 'invalid_input' }, 'bad #' + i));
  for (const bad of ['not json', '{}', JSON.stringify({ checked: ['<b>'] }), JSON.stringify({ checked: new Array(501).fill('a') }), undefined]) assert.deepStrictEqual(env.post({ action: 'saveDocStatus', as: EMAIL2, data: bad }), { error: 'invalid_input' });
  assert.strictEqual(env.snap(), snap);
  env.state.lockBusy = true; assert.deepStrictEqual(env.post({ action: 'saveShortlist', as: EMAIL2, colleges: list }), { error: 'busy' }); env.state.lockBusy = false; assert.strictEqual(env.snap(), snap);
  assert.deepStrictEqual(env.post({ action: 'saveProfile', as: EMAIL2, profile: {} }), { error: 'invalid_action' }, 'engineering-only actions do not exist here');
});
test('S5 a missing dashboard header fails closed with no details; only short codes reach the browser', () => {
  const env = build(); env.seed(2); env.dsheet.rows[0][env.dashHeaders.indexOf('Saved Shortlist')] = 'x';
  assert.deepStrictEqual(getStudent(env, EMAIL), { error: 'server_error' }); assert.ok(env.state.logs.some(l => /MISSING: "Saved Shortlist"/.test(l)));
  const ok = new Set(['auth_required', 'auth_invalid', 'not_approved', 'not_staff', 'not_found', 'student_required', 'invalid_input', 'busy', 'server_error', 'invalid_action']);
  const env2 = build(); env2.seed(2);
  [{ action: 'getStudent' }, { action: 'getStudent', idToken: 'a.b.c' }, { action: 'saveDocStatus', as: EMAIL, data: '{{{' }, { action: 'saveShortlist', as: 'x@example.invalid', colleges: 1 }, { action: 'staffSearch', as: EMAIL, query: 'ri' }].forEach(b => {
    const r = env2.post(b); assert.ok(!r.error || ok.has(r.error), 'code ' + r.error); assert.ok(!/at |Error|\.gs|Exception/.test(JSON.stringify(r)));
  });
});

// ── staff (counsellors) ───────────────────────────────────────
const logRows = env => { const t = env.dash.getSheetByName('Staff Log'); return t ? t.rows.slice(1).filter(r => r.some(v => String(v) !== '')) : []; };
function staffEnv() { const env = build(); env.seed(2); env.seed(3, { 'Token': TOK2, 'Approved Email': EMAIL2, 'Student Name': 'Kabir Shah', 'Saved Shortlist': '', 'Document Status': '' }); return env; }
test('T1 staff actions need a signed-in email on the Staff tab; students and strangers are not_staff; the tab missing or emptied fails closed', () => {
  const env = staffEnv();
  assert.deepStrictEqual(env.post({ action: 'staffCheck', as: STAFF }), { success: true }); assert.deepStrictEqual(env.post({ action: 'staffCheck', as: EMAIL }), { error: 'not_staff' });
  assert.deepStrictEqual(env.post({ action: 'staffSearch', as: 'x@example.invalid', query: 'riya' }), { error: 'not_staff' }); assert.deepStrictEqual(env.post({ action: 'staffSearch', query: 'riya' }), { error: 'auth_required' });
  assert.deepStrictEqual(getStudent(env, STAFF), { error: 'not_approved' }, 'a staff email is not a student');
  env.dash.getSheetByName('Staff').rows[1][1] = ''; assert.deepStrictEqual(env.post({ action: 'staffCheck', as: STAFF }), { error: 'not_staff' }, 'removed = locked out at once');
  const none = build({ staff: false }); none.seed(2); assert.deepStrictEqual(none.post({ action: 'staffCheck', as: STAFF }), { error: 'not_staff' }, 'no Staff tab');
});
test('T2 staffSearch: 2-60 characters, name or Token, max 20, only ref/name/stage, only Medical rows with a Token', () => {
  const env = staffEnv();
  assert.deepStrictEqual(env.post({ action: 'staffSearch', as: STAFF, query: 'kabir' }), { success: true, results: [{ ref: TOK2, name: 'Kabir Shah', stage: 'Counselled' }] });
  assert.deepStrictEqual(env.post({ action: 'staffSearch', as: STAFF, query: 'med-abc' }).results.map(x => x.name), ['Riya Patil']);
  for (const q of ['', 'a', undefined, 5, 'x'.repeat(61)]) assert.deepStrictEqual(env.post({ action: 'staffSearch', as: STAFF, query: q }), { error: 'invalid_input' });
  ['9876543210', 'INQ-SECRET', EMAIL, EMAIL2].forEach(x => assert.ok(!JSON.stringify(env.post({ action: 'staffSearch', as: STAFF, query: 'ri' })).includes(x)));
  env.set(3, 'Stream', 'Engineering'); assert.deepStrictEqual(env.post({ action: 'staffSearch', as: STAFF, query: 'kabir' }).results, []);
  const many = build(); for (let r = 2; r <= 40; r++) many.seed(r, { 'Token': 'MED-ABCDEFGH' + (10 + r), 'Approved Email': '', 'Student Name': 'Many ' + r }); assert.strictEqual(many.post({ action: 'staffSearch', as: STAFF, query: 'many' }).results.length, 20);
});
test('T3 staff view and edit any student (no email needed); students and strangers cannot; only the boolean true counts; each write lands only on that row', () => {
  const env = staffEnv(); const row2 = JSON.stringify(env.dsheet.rows[1]);
  assert.strictEqual(env.post({ action: 'getStudent', as: STAFF, asStaff: true, studentRef: TOK2 }).data.name, 'Kabir Shah');
  assert.deepStrictEqual(env.post({ action: 'getStudent', as: EMAIL, asStaff: true, studentRef: TOK2 }), { error: 'not_staff' }); assert.deepStrictEqual(env.post({ action: 'getStudent', as: STAFF }), { error: 'not_approved' });
  assert.deepStrictEqual(env.post({ action: 'getStudent', as: STAFF, asStaff: 'true', studentRef: TOK2 }), { error: 'not_approved' });
  for (const bad of ['', undefined, 'MED-SHORT', 'MED-ZZZZZZZZZ9', "MED-ABCDEFGH23'", 5, 'ENG-ABCDEFGH23']) assert.deepStrictEqual(env.post({ action: 'getStudent', as: STAFF, asStaff: true, studentRef: bad }), { error: 'not_found' }, String(bad));
  assert.deepStrictEqual(env.post({ action: 'saveShortlist', as: STAFF, asStaff: true, studentRef: TOK2, colleges: { MCC: [{ name: 'Demo' }] } }), { success: true, count: 1 });
  assert.strictEqual(env.post({ action: 'saveDocStatus', as: STAFF, asStaff: true, studentRef: TOK2, data: { checked: ['x'] } }).success, true);
  assert.ok(env.dsheet.cell(3, 'Saved Shortlist').includes('Demo') && env.dsheet.cell(3, 'Document Status').includes('"x"')); assert.strictEqual(JSON.stringify(env.dsheet.rows[1]), row2, 'the other student is untouched');
  assert.deepStrictEqual(env.post({ action: 'saveShortlist', as: STAFF, asStaff: true, studentRef: TOK2, colleges: { A: 'x' } }), { error: 'invalid_input' });
});
test('T4 every staff action is logged FIRST (no content); a log failure refuses the action; student actions are not logged; access ends with the Staff entry', () => {
  const env = staffEnv();
  env.post({ action: 'getStudent', as: STAFF, asStaff: true, studentRef: TOK2 }); env.post({ action: 'saveShortlist', as: STAFF, asStaff: true, studentRef: TOK2, colleges: { MCC: [{ name: 'SECRET-COLLEGE' }] } });
  assert.deepStrictEqual(logRows(env).map(r => [r[1], r[2], r[3]]), [[STAFF, TOK2, 'getStudent'], [STAFF, TOK2, 'saveShortlist']]);
  assert.ok(!JSON.stringify(env.dash.getSheetByName('Staff Log').rows).includes('SECRET-COLLEGE')); assert.strictEqual(env.dash.getSheetByName('Staff Log').formats['2,2'], '@');
  getStudent(env, EMAIL); env.post({ action: 'saveDocStatus', as: EMAIL, data: { checked: ['a'] } }); assert.strictEqual(logRows(env).length, 2);
  const log = env.dash.getSheetByName('Staff Log'), real = log.getRange; log.getRange = () => { throw new Error('Mock: log broken'); }; const snap = env.snap();
  assert.deepStrictEqual(env.post({ action: 'saveShortlist', as: STAFF, asStaff: true, studentRef: TOK2, colleges: { MCC: [] } }), { error: 'server_error' }); assert.strictEqual(env.snap(), snap); log.getRange = real;
  env.state.lockBusy = true; assert.deepStrictEqual(env.post({ action: 'getStudent', as: STAFF, asStaff: true, studentRef: TOK2 }), { error: 'server_error' }); env.state.lockBusy = false; assert.strictEqual(env.state.lockHeld, false);
  env.dash.getSheetByName('Staff').rows[1][1] = ''; assert.deepStrictEqual(env.post({ action: 'getStudent', as: STAFF, asStaff: true, studentRef: TOK2 }), { error: 'not_staff' });
  assert.ok(!env.state.logs.some(l => l.includes(STAFF)), 'no emails in the script log');
});
test('T5 the counsellor tool actions: staffGetStudent / staffSaveShortlist merge by group and never touch other rows', () => {
  const env = staffEnv(); const row2 = JSON.stringify(env.dsheet.rows[1]);
  const r = env.post({ action: 'staffGetStudent', as: STAFF, token: TOK2 }); assert.strictEqual(r.success, true); assert.strictEqual(r.data.name, 'Kabir Shah');
  assert.deepStrictEqual(env.post({ action: 'staffSaveShortlist', as: STAFF, token: TOK2, colleges: { MCC: [{ name: 'A' }] } }), { success: true, count: 1 });
  assert.deepStrictEqual(env.post({ action: 'staffSaveShortlist', as: STAFF, token: TOK2, colleges: { OPEN: [{ name: 'B' }] } }), { success: true, count: 2 }, 'groups not sent are kept');
  assert.deepStrictEqual(env.post({ action: 'staffGetStudent', as: EMAIL, token: TOK2 }), { error: 'not_staff' }); assert.strictEqual(JSON.stringify(env.dsheet.rows[1]), row2);
});

// ── sheet checks ──────────────────────────────────────────────
test('C1 checkApprovedEmails: blank / invalid are problems; shared emails are listed for information; only inside the Email Check tab', () => {
  const env = build();
  env.seed(2, { 'Student Name': 'Good One' }); env.seed(3, { 'Token': 'MED-BBBBBBBBB2', 'Approved Email': '', 'Student Name': 'Blank One' }); env.seed(4, { 'Token': 'MED-CCCCCCCCC3', 'Approved Email': 'fine@example.invalid, oops', 'Student Name': 'Invalid One' });
  env.seed(5, { 'Token': 'MED-DDDDDDDDD4', 'Approved Email': 'a1@example.invalid, ' + PARENT, 'Student Name': 'Twin A' }); env.seed(6, { 'Token': 'MED-EEEEEEEEE5', 'Approved Email': 'a2@example.invalid; ' + PARENT.toUpperCase(), 'Student Name': 'Twin B' });
  env.seed(7, { 'Token': 'MED-FFFFFFFFF6', 'Approved Email': '', 'Student Name': 'Engineering Row', 'Stream': 'Engineering' });
  const res = env.ctx.checkApprovedEmails(); assert.deepStrictEqual({ p: res.problems, s: res.shared }, { p: 2, s: 2 });
  const text = JSON.stringify(env.dash.getSheetByName('Email Check').rows);
  ['Blank One', 'Invalid One', 'Twin A', 'Twin B', 'Shared emails (allowed', 'Shares an email with rows: 6'].forEach(x => assert.ok(text.includes(x), x));
  assert.ok(!text.includes('MED-') && !text.includes('9876543210') && !text.includes('@'), 'no token, phone or email in the tab'); assert.strictEqual(env.state.mails.length, 0);
});
test('C2 verifyHeaders: OK on a correct setup; names a missing enquiry header, a missing dashboard header and a missing Staff tab', () => {
  const ok = build(); assert.strictEqual(ok.ctx.verifyHeaders().ok, true); assert.ok(ok.state.logs.some(l => /verifyHeaders OK/.test(l)));
  const bad = build({ staff: false }); bad.enq.getSheetByName('Pune').rows[0][bad.enqHeaders.indexOf('City')] = 'Town'; bad.dsheet.rows[0][bad.dashHeaders.indexOf('Approved Email')] = 'Email';
  const r = bad.ctx.verifyHeaders(); assert.strictEqual(r.ok, false);
  assert.ok(r.problems.some(p => /Enquiry\/Pune/.test(p) && /"City"/.test(p))); assert.ok(r.problems.some(p => /Student dashboard page/.test(p) && /"Approved Email"/.test(p))); assert.ok(r.problems.some(p => /Staff tab not found/.test(p)));
});
test('C3 the dashboard link written for a new lead is a plain sign-in link with no token; the lead and its dashboard row share one internal token', () => {
  const env = build(); const r = env.submit(good()); const dr = env.dsheet.obj(dashRows(env)[0]);
  assert.ok(!/token/i.test(dr['Dashboard URL'])); assert.strictEqual(dr['Token'], r.token);
  env.dsheet.rows[1][env.dashHeaders.indexOf('Approved Email')] = EMAIL; assert.strictEqual(getStudent(env, EMAIL).data.name, 'Aarav Deshmukh', 'a lead is a dashboard student the moment staff add the email');
});

let pass = 0, fail = 0; const lines = [];
for (const t of tests) { try { t.f(); pass++; lines.push('PASS  ' + t.n); } catch (e) { fail++; lines.push('FAIL  ' + t.n + '\n        -> ' + e.message.split('\n')[0]); if (process.env.VERBOSE) lines.push(e.stack); } }
console.log('MOCK TEST RESULTS (in-memory fake of Google services; not real Sheets/Gmail)\n'); console.log(lines.join('\n')); console.log(`\n${pass} passed, ${fail} failed, ${tests.length} total`); process.exit(fail ? 1 : 0);
