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
  setFontWeight() { return this; } setBackground() { return this; } setFontColor() { return this; } setHorizontalAlignment() { return this; }
}
class Sheet {
  constructor(name) { this.name = name; this.cells = {}; this.maxCols = 26; }
  getName() { return this.name; }
  getLastRow() { let m = 0; for (const k in this.cells) { if (this.cells[k] !== '') m = Math.max(m, +k.split(',')[0]); } return m; }
  getLastColumn() { let m = 0; for (const k in this.cells) { if (this.cells[k] !== '') m = Math.max(m, +k.split(',')[1]); } return m; }
  getMaxColumns() { return this.maxCols; }
  insertColumnsAfter(n, k) { this.maxCols += k; }
  appendRow(arr) { const r = this.getLastRow() + 1; arr.forEach((v, i) => { this.cells[r + ',' + (i + 1)] = v; }); }
  getRange(r, c, nr = 1, nc = 1) { return new Range(this, r, c, nr, nc); }
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
  return { ctx, sheets, sent, post: (parameter) => ctx.doPost({ parameter }).getContent(), get: (token) => JSON.parse(ctx.doGet({ parameter: { token } }).getContent()) };
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
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
