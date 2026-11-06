// OFFLINE MOCK HARNESS. Runs the real Apps Script source in a Node VM with fake
// SpreadsheetApp / MailApp / LockService. It proves the script LOGIC only.
// It is NOT Google Sheets: nothing here touches the live sheet or any real sheet copy.
const fs = require('fs');
const vm = require('vm');
const path = require('path');

class Range {
  constructor(sh, r, c, nr, nc) { Object.assign(this, { sh, r, c, nr, nc }); }
  _each(fn) { for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) fn(this.r + i, this.c + j, i, j); }
  getValue() { return this.sh.cells[this.r + ',' + this.c] ?? ''; }
  setValue(v) { this.sh.cells[this.r + ',' + this.c] = v; return this; }
  getValues() { const o = []; for (let i = 0; i < this.nr; i++) { o.push([]); for (let j = 0; j < this.nc; j++) o[i].push(this.sh.cells[(this.r + i) + ',' + (this.c + j)] ?? ''); } return o; }
  setValues(v) { this._each((r, c, i, j) => { this.sh.cells[r + ',' + c] = v[i][j]; }); return this; }
  setFormula(f) { this.sh.cells[this.r + ',' + this.c] = f; return this; }
  copyTo(t) { this._each((r, c, i, j) => { t.sh.cells[(t.r + i) + ',' + (t.c + j)] = this.sh.cells[r + ',' + c] ?? ''; }); }
  setNumberFormat(f) { this.fmt = f; this._each((r, c) => { this.sh.fmts[r + ',' + c] = f; }); return this; }
  setFontWeight() { return this; } setBackground() { return this; } setFontColor() { return this; } setHorizontalAlignment() { return this; }
}
class Sheet {
  constructor(name) { this.name = name; this.cells = {}; this.fmts = {}; this.maxCols = 26; }
  getDataRange() { return new Range(this, 1, 1, this.getLastRow(), this.getLastColumn()); }
  getName() { return this.name; }
  getLastRow() { let m = 0; for (const k in this.cells) { if (this.cells[k] !== '') m = Math.max(m, +k.split(',')[0]); } return m; }
  getLastColumn() { let m = 0; for (const k in this.cells) { if (this.cells[k] !== '') m = Math.max(m, +k.split(',')[1]); } return m; }
  getMaxColumns() { return this.maxCols; }
  insertColumnsAfter(n, k) { this.maxCols += k; }
  appendRow(arr) { const r = this.getLastRow() + 1; arr.forEach((v, i) => { this.cells[r + ',' + (i + 1)] = v; }); }
  getRange(r, c, nr = 1, nc = 1) {
    if (c + nc - 1 > this.maxCols) throw new Error('The coordinates of the range are outside the dimensions of the sheet (' + this.name + ', col ' + (c + nc - 1) + ' > ' + this.maxCols + ')');
    return new Range(this, r, c, nr, nc);
  }
  setColumnWidth() {}
  row(n) { const o = []; for (let c = 1; c <= 24; c++) o.push(this.cells[n + ',' + c] ?? ''); return o; }
}

function load(file) {
  const sheets = {};
  const mk = (n) => (sheets[n] = new Sheet(n));
  ['Online', 'Andheri', 'Thane', 'Pune', 'Kolhapur', 'Sangli', 'Sambhajinagar', 'Seminar'].forEach((n) => {
    const s = mk(n);
    ['Timestamp', 'Token', 'Full Name', 'Student Contact', 'NEET Rank', 'Father', 'Mother', 'Coaching', 'City', 'Category', 'Courses', 'Budget']
      .forEach((h, i) => s.cells['1,' + (i + 1)] = h);
  });
  const ss = { getSheetByName: (n) => sheets[n] || null, insertSheet: (n) => mk(n) };
  const sent = [];
  const ctx = {
    console: { log: () => {} },
    SpreadsheetApp: { getActiveSpreadsheet: () => ss, flush() {} },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { MimeType: { TEXT: 'TEXT', JSON: 'JSON' }, createTextOutput: (t) => ({ t, setMimeType() { return this; }, getContent() { return this.t; } }) },
    MailApp: { sendEmail: (o) => { if (ctx.__mailFails) throw new Error('quota exceeded'); sent.push(o); } },
    Utilities: { formatDate: (d) => d.toISOString() },
    Session: { getScriptTimeZone: () => 'Asia/Kolkata' },
    Browser: { msgBox() {} },
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
  return { ctx, sheets, ss, sent, post: (parameter) => ctx.doPost({ parameter }).getContent(), get: (token) => JSON.parse(ctx.doGet({ parameter: { token } }).getContent()) };
}
module.exports = { load };

if (require.main === module) {
  const SP = __dirname;
  let pass = 0, fail = 0;
  const ok = (cond, msg) => { cond ? pass++ : fail++; console.log((cond ? '  PASS ' : '  FAIL ') + msg); };

  // ───────── BASELINE: ORIGINAL script + payload exactly as the OLD engineering form sent it ─────────
  console.log('\n=== BASELINE (original script, old engineering-form payload) ===');
  {
    const h = load(path.join(__dirname, '../../../google-apps-script-inquiry.js'));
    const tok = h.post({ source: 'Online (Engineering)', fullName: 'TEST – delete eng-old', entranceScore: '98.5', studentContact: '9000000001',
      fatherContact: '', motherContact: '', coachingClass: '', city: 'Pune', category: 'General', courses: '', budget: 'Private 5-10L' });
    const row = h.sheets.Online.row(2);
    console.log('  token returned :', tok);
    console.log('  landed in tab  : Online (no Engineering tab exists:', !h.sheets.Engineering, ')');
    console.log('  row A-L        :', JSON.stringify(row.slice(1, 12)));
    ok(row[4] === '', 'BUG CONFIRMED: column E (score/rank) is blank');
    ok(!row.some((v) => String(v).includes('98.5')), 'BUG CONFIRMED: the score 98.5 is stored nowhere in the row');
    ok(!row.some((v) => /engineering/i.test(String(v))), 'BUG CONFIRMED: nothing in the row says it is an engineering lead');
  }

  // ───────── PROPOSED script ─────────
  console.log('\n=== PROPOSED script ===');
  const P = path.join(__dirname, 'google-apps-script-inquiry.proposed.js');
  const base = { fatherContact: '', motherContact: '', coachingClass: 'TEST coaching', category: 'OBC' };

  { // 1 engineering, new form
    const h = load(P); h.ctx.LEAD_ALERT_EMAIL = 'counsellor-test@example.invalid';
    const tok = h.post({ ...base, stream: 'Engineering', branch: 'pune', source: 'pune', fullName: 'TEST – delete eng-new', entranceScore: '98.5',
      studentContact: '+91 90000 00001', city: 'Pune', courses: '', budget: 'Private 5–10L', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'jee-2026', gclid: 'TEST-GCLID-123' });
    const E = h.sheets.Engineering, r = E && E.row(2);
    console.log('[1] engineering new-form  token=' + tok); console.log('    Engineering row:', JSON.stringify(r));
    ok(/^\d\d-ENG-001$/.test(tok), 'token has ENG prefix: ' + tok);
    ok(!!E && h.sheets.Pune.getLastRow() === 1 && h.sheets.Online.getLastRow() === 1, 'row went to the new "Engineering" tab, not a medical tab');
    ok(r[3] === '9000000001', 'phone normalised from "+91 90000 00001" -> 9000000001');
    ok(r[19] === '98.5', 'entrance score 98.5 reaches column T');
    ok(r[4] === '', 'column E (NEET rank) stays blank for engineering');
    ok(r[17] === 'Engineering' && r[18] === 'Pune', 'stream=Engineering, branch=Pune written (cols R,S)');
    ok(r[20] === 'google' && r[21] === 'cpc' && r[22] === 'jee-2026' && r[23] === 'TEST-GCLID-123', 'utm_source/medium/campaign + gclid written (cols U-X)');
    ok(r[10] === '' && r[11] === 'Private 5–10L', 'budget stored exactly as displayed');
    ok(String(E.cells['2,13']).includes('HYPERLINK') && String(E.cells['2,17']).includes('HYPERLINK'), 'dashboard/download links still generated (cols M, Q)');
    ok(h.sent.length === 1, 'exactly 1 alert email sent');
    const m = h.sent[0] || {};
    console.log('    --- email ---\n    to: ' + m.to + '\n    subject: ' + m.subject + '\n' + String(m.body).split('\n').map((l) => '    | ' + l).join('\n'));
    ok(m.to === 'counsellor-test@example.invalid' && /TEST – delete eng-new/.test(m.body) && /9000000001/.test(m.body) && /98\.5/.test(m.body) && /Pune/.test(m.body) && /utm_source=google/.test(m.body) && /gclid=TEST-GCLID-123/.test(m.body), 'email contains name, phone, score, branch, source');
    const g = h.get(tok);
    ok(g.success && g.data.entranceScore === '98.5' && g.data.stream === 'Engineering' && g.data.leadBranch === 'Pune' && g.data.rank === 0, 'doGet(token) finds the engineering row; entranceScore=98.5, rank stays 0 (not truncated to 98)');
  }
  { // 2 medical, new form
    const h = load(P); h.ctx.LEAD_ALERT_EMAIL = 'counsellor-test@example.invalid';
    const tok = h.post({ ...base, stream: 'Medical', branch: 'andheri', source: 'andheri', fullName: 'TEST – delete med-new', neetRank: '12345', studentContact: '9000000002',
      city: 'Mumbai', courses: 'MBBS, BDS', budget: 'Private 7–20L', utm_source: '', utm_medium: '', utm_campaign: '', gclid: '' });
    const r = h.sheets.Andheri.row(2);
    console.log('[2] medical new-form      token=' + tok + '  row=' + JSON.stringify(r));
    ok(/^\d\d-AND-001$/.test(tok), 'token ' + tok + ' (unchanged AND prefix)');
    ok(r[4] === '12345' && r[17] === 'Medical' && r[18] === 'Andheri' && r[19] === '', 'rank in E, stream/branch written, no entrance score');
    ok(r[11] === 'Private 7–20L', 'budget in sheet == label the student saw ("Private 7–20L"; before: "Private 7-15L")');
    ok(!h.sheets.Engineering, 'no Engineering tab created for a medical lead');
    ok(/NEET rank \(AIR\): 12345/.test(h.sent[0].body) && /direct \/ no campaign tags/.test(h.sent[0].body), 'email shows NEET rank and "direct" source when no UTM');
  }
  { // 3 legacy engineering (old cached frontend / public/inquiry-engineering.html)
    const h = load(P); h.ctx.LEAD_ALERT_EMAIL = 'x@example.invalid';
    const tok = h.post({ ...base, source: 'Online (Engineering)', fullName: 'TEST – delete eng-legacy', jeeRank: '97.1', studentContact: '9000000003', city: 'Thane', budget: 'x' });
    const r = h.sheets.Engineering && h.sheets.Engineering.row(2);
    console.log('[3] legacy engineering    token=' + tok);
    ok(/ENG/.test(tok) && r[19] === '97.1' && r[18] === 'Online' && r[17] === 'Engineering', 'legacy "(Engineering)" source + jeeRank still routed to Engineering tab, score kept');
  }
  { // 4 legacy medical
    const h = load(P);
    const tok = h.post({ ...base, source: 'sangli', fullName: 'TEST – delete med-legacy', neetRank: '500', studentContact: '9000000004', city: 'Sangli' });
    ok(/-SAN-001$/.test(tok) && h.sheets.Sangli.row(2)[17] === 'Medical', '[4] legacy medical form (no stream/branch fields) still works -> Sangli tab');
  }
  { // 5 invalid phone
    const h = load(P); h.ctx.LEAD_ALERT_EMAIL = 'x@example.invalid';
    const out = h.post({ ...base, stream: 'Medical', branch: 'online', fullName: 'TEST – delete bad-phone', neetRank: '10', studentContact: '1234567890', city: 'X' });
    console.log('[5] invalid phone -> ' + out);
    ok(/^Error/.test(out) && h.sheets.Online.getLastRow() === 1 && h.sent.length === 0, 'rejected with "Error:", no row written, no email');
  }
  { // 6 missing name / rank / bad percentile
    const h = load(P);
    const a = h.post({ ...base, stream: 'Medical', branch: 'online', fullName: '  ', neetRank: '10', studentContact: '9000000005' });
    const b = h.post({ ...base, stream: 'Medical', branch: 'online', fullName: 'TEST – delete', neetRank: '', studentContact: '9000000005' });
    const c = h.post({ ...base, stream: 'Engineering', branch: 'online', fullName: 'TEST – delete', entranceScore: '150', studentContact: '9000000005' });
    const d = h.post({ ...base, stream: 'Medical', branch: 'online', fullName: 'TEST – delete', neetRank: '5', studentContact: '9000000005', fatherContact: '12345' });
    console.log('[6] ' + [a, b, c, d].join(' | '));
    ok([a, b, c, d].every((x) => /^Error/.test(x)) && h.sheets.Online.getLastRow() === 1 && !h.sheets.Engineering, 'blank name, blank NEET rank, percentile 150, bad father number: all rejected, nothing written');
  }
  { // 7 email failure must not lose the lead
    const h = load(P); h.ctx.LEAD_ALERT_EMAIL = 'x@example.invalid'; h.ctx.__mailFails = true;
    const tok = h.post({ ...base, stream: 'Medical', branch: 'thane', fullName: 'TEST – delete mail-fails', neetRank: '77', studentContact: '9000000006', city: 'T' });
    ok(/-THA-001$/.test(tok) && h.sheets.Thane.getLastRow() === 2, '[7] MailApp throws -> lead still saved and token still returned');
  }
  { // 8 no alert email configured
    const h = load(P);
    const tok = h.post({ ...base, stream: 'Medical', branch: 'pune', fullName: 'TEST – delete no-inbox', neetRank: '88', studentContact: '9000000007', city: 'P' });
    ok(/-PUN-001$/.test(tok) && h.sent.length === 0, '[8] LEAD_ALERT_EMAIL empty -> no email, lead saved (ships this way until you fill in the inbox)');
  }
  { // 9 seminar walk-in (events/verify page): blank NEET rank, no stream, no email
    const h = load(P); h.ctx.LEAD_ALERT_EMAIL = 'x@example.invalid';
    const tok = h.post({ source: 'Seminar', fullName: 'TEST – delete walk-in', studentContact: '9000000008', neetRank: '', category: 'OPEN', courses: 'MBBS', city: 'Mumbai' });
    ok(/-SEM-001$/.test(tok) && h.sent.length === 0, '[9] seminar walk-in with blank NEET rank still accepted; no per-walk-in email (ALERT_ON_SEMINAR=false)');
  }
  { // 10 sequential tokens + unknown branch fallback
    const h = load(P);
    const t1 = h.post({ ...base, stream: 'Engineering', branch: 'pune', fullName: 'TEST – delete a', entranceScore: '90', studentContact: '9000000009', city: 'a' });
    const t2 = h.post({ ...base, stream: 'Engineering', branch: 'ZZZ', fullName: 'TEST – delete b', entranceScore: '91', studentContact: '9000000010', city: 'b' });
    ok(/-ENG-001$/.test(t1) && /-ENG-002$/.test(t2) && h.sheets.Engineering.row(3)[18] === 'Online', '[10] engineering tokens count up (001, 002); unknown branch "ZZZ" falls back to Online');
    ok(h.sheets.Engineering.row(1)[17] === 'Stream' && h.sheets.Engineering.row(1)[23] === 'gclid' && h.sheets.Engineering.row(1)[0] === 'Timestamp', 'Engineering tab was created with headers A-L (copied from Online) and R-X');
  }

  { // 11 international numbers (+971, +1, +44) and Indian numbers with prefixes
    const mk = () => { const h = load(P); h.ctx.LEAD_ALERT_EMAIL = 'x@example.invalid'; return h; };
    const send = (h, ph, extra = {}) => h.post({ ...base, stream: 'Medical', branch: 'online', fullName: 'TEST – delete intl', neetRank: '100', studentContact: ph, city: 'Dubai', ...extra });
    const cases = [
      ['+971 50 123 4567', '+971501234567', 'UAE +971'],
      ['+1 415 555 2671',  '+14155552671',  'USA/Canada +1'],
      ['+44 20 7946 0958', '+442079460958', 'UK +44'],
      ['+91 98765 43210',  '9876543210',    'India +91 prefix is still reduced to 10 digits'],
      ['919876543210',     '9876543210',    'India 91 + 10 digits (no plus)'],
      ['09876543210',      '9876543210',    'India leading 0'],
    ];
    cases.forEach(([inp, want, label]) => {
      const h = mk(); const tok = send(h, inp);
      const cell = h.sheets.Online.cells['2,4'];
      ok(/^\d\d-ONL-001$/.test(tok) && cell === want, `[11] ${label}: "${inp}" -> stored "${cell}"` + (want[0] === '+' ? ` (text format applied: ${h.sheets.Online.fmts['2,4'] === '@'})` : ''));
      if (want[0] === '+') ok(h.sheets.Online.fmts['2,4'] === '@', `[11] ${label}: cell forced to plain text so Sheets keeps the "+"`);
    });
    const bad = [
      ['+1234',            'too short for an international number'],
      ['+0 501234567',     'country code cannot start with 0'],
      ['+971 50 123 4567 8901 2345', 'more than 15 digits'],
      ['971501234567',     'non-Indian number WITHOUT the leading +'],
      ['+91 12345 67890',  'Indian number must start 6-9, even with +91'],
      ['1234567890',       'Indian-length number starting with 1'],
      ['',                 'empty'],
    ];
    bad.forEach(([inp, label]) => {
      const h = mk(); const out = send(h, inp);
      ok(/^Error/.test(out) && h.sheets.Online.getLastRow() === 1 && h.sent.length === 0, `[11] rejected: "${inp}" (${label})`);
    });
    const h = mk();
    const tok = send(h, '+971501234567', { fatherContact: '+1 415 555 2671', motherContact: '+44 20 7946 0958' });
    const r = h.sheets.Online.row(2);
    ok(r[5] === '+14155552671' && r[6] === '+442079460958' && h.sheets.Online.fmts['2,6'] === '@' && h.sheets.Online.fmts['2,7'] === '@', '[11] international father/mother numbers also stored as text');
    ok(/Phone:   \+971501234567/.test(h.sent[0].body), '[11] alert email shows the full international number');
    const g = h.get(tok);
    ok(g.success && g.data.studentContact === '+971501234567', '[11] doGet returns the +971 number intact');
    const h2 = mk();
    const e2 = send(h2, '+1 415 555 2671', { father: 'x', fatherContact: '12345' });
    ok(/^Error: Error: Invalid father mobile number/.test(e2), '[11] a bad optional parent number is still rejected');
  }
  { // 11b international numbers are MEDICAL-only: the engineering lead path accepts Indian numbers only
    const mk = () => { const h = load(P); h.ctx.LEAD_ALERT_EMAIL = 'x@example.invalid'; return h; };
    const eng = (h, ph, extra = {}) => h.post({ ...base, stream: 'Engineering', branch: 'online', fullName: 'TEST – delete eng-phone', entranceScore: '95', studentContact: ph, city: 'x', ...extra });
    ['+971 50 123 4567', '+1 415 555 2671', '+44 20 7946 0958'].forEach((n) => {
      const h = mk(); const out = eng(h, n);
      ok(/^Error/.test(out) && !h.sheets.Engineering && h.sent.length === 0, `[11b] ENGINEERING rejects "${n}" (nothing written, no Engineering tab, no email)`);
    });
    const h = mk();
    const t1 = eng(h, '+91 98765 43210'), t2 = eng(h, '9876543211'), t3 = eng(h, '09876543212');
    const E = h.sheets.Engineering;
    ok(/-ENG-001$/.test(t1) && E.cells['2,4'] === '9876543210' && E.cells['3,4'] === '9876543211' && E.cells['4,4'] === '9876543212', '[11b] ENGINEERING still accepts Indian numbers incl. +91 and 0 prefixes (stored as 10 digits)');
    const e3 = eng(mk(), '9000000099', { fatherContact: '+971 50 123 4567' });
    ok(/^Error: Error: Invalid father mobile number/.test(e3), '[11b] ENGINEERING rejects an international parent number too');
    const m = mk(); const tm = m.post({ ...base, stream: 'Medical', branch: 'online', fullName: 'TEST – delete med-nri', neetRank: '100', studentContact: '+971 50 123 4567', city: 'Dubai' });
    ok(/-ONL-001$/.test(tm) && m.sheets.Online.cells['2,4'] === '+971501234567', '[11b] MEDICAL still accepts +971 (NRI), unchanged');
  }
  { // 12 percentile formats accepted by the server (matches the form)
    const h = load(P);
    const t = (v) => h.post({ ...base, stream: 'Engineering', branch: 'online', fullName: 'TEST – delete pct', entranceScore: v, studentContact: '9000000011', city: 'x' });
    const a = t('98,5'), b = t('98.5%'), c = t('100'), d = t('0'), e = t('8432'), f = t('abc');
    const E = h.sheets.Engineering;
    ok(E.row(2)[19] === '98.5' && E.row(3)[19] === '98.5' && E.row(4)[19] === '100', '[12] "98,5" and "98.5%" stored as 98.5; 100 accepted');
    ok([d, e, f].every((x) => /^Error/.test(x)) && E.getLastRow() === 4, '[12] 0, 8432 (a rank) and "abc" rejected');
  }
  { // 13 columns R-X already used by something else: lead is saved, tracking columns are NOT overwritten
    const h = load(P); h.ctx.LEAD_ALERT_EMAIL = 'x@example.invalid';
    h.sheets.Pune.cells['1,18'] = 'Manual follow-up note';       // R1 used by a human
    h.sheets.Pune.cells['1,19'] = 'something in S1';
    const tok = h.post({ ...base, stream: 'Medical', branch: 'pune', fullName: 'TEST – delete conflict', neetRank: '9', studentContact: '9000000012', city: 'P', utm_source: 'google' });
    const r = h.sheets.Pune.row(2);
    ok(/-PUN-001$/.test(tok) && r[2] === 'TEST – delete conflict', '[13] lead still saved and token returned');
    ok(h.sheets.Pune.cells['1,18'] === 'Manual follow-up note' && r[17] === '' && r[20] === '', '[13] existing R1 header left alone and NO tracking values written into R-X');
    ok(h.sent.length === 1 && /utm_source=google/.test(h.sent[0].body), '[13] the alert email still carries the source, so nothing is lost');
  }
  { // 14 audit helper is read-only and reports R-X usage per tab
    const h = load(P);
    h.sheets.Thane.cells['1,18'] = 'note'; h.sheets.Thane.cells['3,22'] = 'x';
    const before = JSON.stringify(h.sheets.Thane.cells);
    const rep = h.ctx.auditLeadColumns();
    ok(rep.some((l) => l === 'Thane: 2 non-empty cell(s) in R-X') && rep.some((l) => /^Online: 0 /.test(l)), '[14] auditLeadColumns() reports R-X usage per tab: ' + JSON.stringify(rep.filter((l) => /Thane|Online|Engineering/.test(l))));
    ok(JSON.stringify(h.sheets.Thane.cells) === before, '[14] audit wrote nothing');
  }
  { // 16 a tab narrower than 24 columns (real Sheets throws when a range is outside the grid)
    const h = load(P); h.ctx.LEAD_ALERT_EMAIL = 'x@example.invalid';
    h.sheets.Thane.maxCols = 17;   // exactly A-Q: no room for R-X yet
    const out = h.post({ ...base, stream: 'Medical', branch: 'thane', fullName: 'TEST – delete narrow', neetRank: '5', studentContact: '9000000015', city: 'T', utm_source: 'google' });
    ok(/-THA-001$/.test(out) && !/^Error/.test(out), '[16] narrow tab (17 columns): the form gets a token, not an error (otherwise the student resubmits and creates a duplicate lead): ' + out);
    ok(h.sheets.Thane.maxCols >= 24 && h.sheets.Thane.row(2)[17] === 'Medical' && h.sheets.Thane.row(2)[20] === 'google', '[16] the tab was widened to 24 columns and R-X were written');
  }
  { // 15 token lookup after several leads: ENG token resolves; medical token still resolves
    const h = load(P);
    const m = h.post({ ...base, stream: 'Medical', branch: 'andheri', fullName: 'TEST – delete m', neetRank: '10', studentContact: '9000000013', city: 'a' });
    const e = h.post({ ...base, stream: 'Engineering', branch: 'andheri', source: 'andheri (Engineering)', fullName: 'TEST – delete e', entranceScore: '91', studentContact: '9000000014', city: 'a' });
    const gm = h.get(m), ge = h.get(e);
    ok(m === '26-AND-001' && e === '26-ENG-001', `[15] tokens ${m} and ${e}`);
    ok(gm.success && gm.data.branch === 'Andheri' && ge.success && ge.data.branch === 'Engineering' && ge.data.leadBranch === 'Andheri' && ge.data.entranceScore === '91' && ge.data.rank === 0, '[15] doGet: 26-ENG-001 -> sheet "Engineering", branch Andheri, entranceScore 91, rank 0');
    console.log('     doGet(26-ENG-001) =', JSON.stringify(ge.data));
  }

  // ───────── BACKWARD COMPATIBILITY: real NEW-frontend payloads replayed against the ORIGINAL script ─────────
  const pf = path.join(__dirname, 'new-frontend-payloads.json');
  if (fs.existsSync(pf)) {
    console.log('\n=== BACKWARD COMPATIBILITY: new-frontend payloads (captured from the real forms) vs ORIGINAL script ===');
    const payloads = JSON.parse(fs.readFileSync(pf, 'utf8'));
    const orig = load(path.join(__dirname, '../../../google-apps-script-inquiry.js'));
    const prop = load(P); prop.ctx.LEAD_ALERT_EMAIL = '';
    const rows = [];
    payloads.forEach((pl) => {
      const o = orig.post(pl.body); const n = prop.post(pl.body);
      const tab = (h, tok) => { for (const name of Object.keys(h.sheets)) { const sh = h.sheets[name]; for (let r = 2; r <= sh.getLastRow(); r++) if (sh.cells[r + ',2'] === tok) return name; } return '(none)'; };
      const oRow = (() => { const t = tab(orig, o); const sh = orig.sheets[t]; if (!sh) return null; for (let r = 2; r <= sh.getLastRow(); r++) if (sh.cells[r + ',2'] === o) return sh.row(r); return null; })();
      rows.push({ label: pl.label, origTab: tab(orig, o), origToken: o, origScoreStored: oRow ? (oRow.slice(0, 12).some((v) => String(v) === String(pl.body.entranceScore || pl.body.neetRank)) ? 'yes' : 'NO') : '-', newTab: tab(prop, n), newToken: n });
    });
    console.log('  ' + 'lead'.padEnd(38) + 'ORIGINAL script: tab / token / score kept'.padEnd(52) + 'PROPOSED script: tab / token');
    rows.forEach((r) => console.log('  ' + r.label.padEnd(38) + `${r.origTab} / ${r.origToken} / ${r.origScoreStored}`.padEnd(52) + `${r.newTab} / ${r.newToken}`));
    const eng = rows.filter((r) => /engineering/i.test(r.label)), med = rows.filter((r) => /medical/i.test(r.label));
    ok(eng.every((r) => r.origTab === 'Online' && /-ONL-/.test(r.origToken)), 'ORIGINAL script: every engineering lead from the NEW form lands in the Online tab (same as before this PR), never in a medical branch tab');
    ok(med.every((r) => r.origTab !== '(none)' && !/^Error/.test(r.origToken)), 'ORIGINAL script: every medical lead from the NEW form is accepted and lands in its branch tab');
    ok(eng.every((r) => r.newTab === 'Engineering' && /-ENG-/.test(r.newToken)), 'PROPOSED script: every engineering lead lands in the Engineering tab with an ENG token');
  }
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
