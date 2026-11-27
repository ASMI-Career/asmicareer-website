/**
 * MOCK tests for engineering-leads.js.   Run:  node apps-script/engineering-leads/test/run-tests.js
 *
 * Every result printed here is a MOCK result: the real script code ran against an in-memory fake of
 * Google's services (see mock-gas.js). It does not prove behaviour on real Google Sheets, real Gmail
 * or real concurrent web requests. See README "What these tests cannot prove".
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { buildEnvironment, leadRows, MockSheet } = require('./mock-gas');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

const good = (over = {}) => Object.assign({
  'Full Name': 'Aarav Deshmukh', 'Student Contact': '98765 43210', 'City': 'Pune', 'Category': 'OBC',
  'Nearest Branch': 'Pune', 'Entrance Percentile': '98.37', 'Score Exam': 'JEE Main', 'JEE Main Rank (CRL)': '12345',
  'Home State': 'Maharashtra', 'Class Status': 'Class 12 appearing', 'Exams Appearing': 'JEE Main, MHT-CET',
  'Source': 'Website', 'utm_source': 'google', 'utm_medium': 'cpc', 'utm_campaign': 'eng-brand', 'gclid': 'abc123',
  'Plan': 'Explore', 'Consent': 'Yes', 'Courses': 'CS / IT', 'Budget': 'Govt 1-3L'
}, over);

const errFields = res => (res.errors || []).map(e => e.field);
const totalLeadRows = env => Array.from(env.get('ENQUIRY_TABS')).reduce((n, t) => n + leadRows(env.enq.getSheetByName(t)).length, 0);
const tabsWithLeads = env => Array.from(env.get('ENQUIRY_TABS')).filter(t => leadRows(env.enq.getSheetByName(t)).length > 0);
const dashRows = env => leadRows(env.dsheet, 'Token', 'Student Name');

// ─────────────────────────────────────────────────────────────── 1. happy path
test('01 happy path: Pune lead lands in Pune, dashboard row created, formulas untouched', env0 => {
  const env = buildEnvironment();
  const res = env.submit(good());
  assert.strictEqual(res.ok, true);
  assert.match(res.token, /^ENG-[A-HJKMNP-Z2-9]{10}$/);
  assert.deepStrictEqual(tabsWithLeads(env), ['Pune']);
  const pune = env.enq.getSheetByName('Pune');
  const r = leadRows(pune)[0];
  assert.strictEqual(r, 2, 'goes to the first empty DATA row even though formulas fill rows 2-60 in another column');
  const row = pune.obj(r);
  assert.strictEqual(row['Token Number'], res.token);
  assert.strictEqual(row['Student Name'], 'Aarav Deshmukh');
  assert.strictEqual(row['Student Contact'], '9876543210');
  assert.strictEqual(row['Entrance Percentile'], 98.37);
  assert.strictEqual(typeof row['Entrance Percentile'], 'number');
  assert.strictEqual(row['JEE Main Rank (CRL)'], 12345);
  assert.strictEqual(row['Score Exam'], 'JEE Main');
  assert.strictEqual(row['Plan'], 'Explore');
  assert.strictEqual(row['Consent'], 'Yes');
  assert.strictEqual(row['utm_campaign'], 'eng-brand');
  assert.strictEqual(row['gclid'], 'abc123');
  assert.strictEqual(row['Duplicate Flag'], '');
  assert.ok(Object.prototype.toString.call(row['Timestamp']) === '[object Date]');
  assert.ok(String(row['Dashboard Link']).startsWith('=HYPERLINK'), 'formula column not overwritten');
  assert.strictEqual(row['Counsellor Notes'], '', 'unmapped column untouched');
  assert.strictEqual(env.enq.getSheetByName('All Leads').writeLog.length, 0, 'All Leads never written');

  const dr = dashRows(env);
  assert.strictEqual(dr.length, 1);
  const d = env.dsheet.obj(dr[0]);
  assert.strictEqual(d['Token'], res.token);
  assert.strictEqual(d['Inquiry Token'], res.token);
  assert.strictEqual(d['Student Name'], 'Aarav Deshmukh');
  assert.strictEqual(d['Score'], 98.37);
  assert.strictEqual(d['Stream'], 'Engineering');
  assert.strictEqual(d['Plan'], 'Explore');
  assert.strictEqual(d['Dashboard URL'], 'https://asmicareer.in/student?token=' + res.token);
  assert.strictEqual(env.state.mails.length, 1, 'exactly one alert email');
  assert.match(env.state.mails[0].subject, /Aarav Deshmukh \(Pune\)/);
  return 'Pune row 2, dashboard row 2, 1 email, formula column + All Leads untouched';
});

// ─────────────────────────────────────────────────────────────── 2. percentile
test('02 percentile: decimal kept, range 0-100 enforced, exam required with it', () => {
  const ok = { '0': 0, '100': 100, '99.999999': 99.999999, '98.5%': 98.5, '7.25': 7.25, '98.37': 98.37 };
  const bad = ['100.01', '-1', '98,5', 'abc', '101', '1000', '98.5.5', '.5', '5.'];
  const notes = [];
  for (const [input, expected] of Object.entries(ok)) {
    const env = buildEnvironment();
    const res = env.submit(good({ 'Entrance Percentile': input }));
    assert.strictEqual(res.ok, true, 'should accept ' + input);
    const row = env.enq.getSheetByName('Pune').obj(2);
    assert.strictEqual(row['Entrance Percentile'], expected, input);
    assert.strictEqual(env.dsheet.obj(2)['Score'], expected);
  }
  for (const input of bad) {
    const env = buildEnvironment();
    const res = env.submit(good({ 'Entrance Percentile': input }));
    assert.strictEqual(res.ok, false, 'should reject ' + input);
    assert.deepStrictEqual(errFields(res), ['Entrance Percentile']);
    assert.strictEqual(totalLeadRows(env), 0);
  }
  let env = buildEnvironment();
  let res = env.submit(good({ 'Entrance Percentile': '', 'Score Exam': '' }));
  assert.strictEqual(res.ok, true, 'percentile optional');
  assert.strictEqual(env.dsheet.obj(2)['Score'], '');
  env = buildEnvironment();
  res = env.submit(good({ 'Score Exam': '' }));
  assert.strictEqual(res.ok, false);
  assert.deepStrictEqual(errFields(res), ['Score Exam']);
  return 'accepted ' + Object.keys(ok).join(', ') + ' | rejected ' + bad.join(', ');
});

// ─────────────────────────────────────────────────────────────── 3. routing
test('03 routing: branch -> tab, unknown/blank -> Online, seminar -> Seminar, All Leads never written', () => {
  const table = [
    ['Andheri', 'Andheri'], ['Thane', 'Thane'], ['Pune', 'Pune'], ['Sangli', 'Sangli'], ['Kolhapur', 'Kolhapur'],
    ['Sambhajinagar', 'Sambhajinagar'], ['Mumbai – Andheri', 'Andheri'], ['Ch. Sambhajinagar', 'Sambhajinagar'],
    ['Aurangabad', 'Sambhajinagar'], ['  PUNE  ', 'Pune'], ['Delhi', 'Online'], ['', 'Online'], ['Online', 'Online']
  ];
  table.forEach(([input, tab], i) => {
    const env = buildEnvironment();
    const res = env.submit(good({ 'Nearest Branch': input, 'Student Contact': '98765432' + String(10 + i) }));
    assert.strictEqual(res.ok, true, input);
    assert.deepStrictEqual(tabsWithLeads(env), [tab], '"' + input + '" should go to ' + tab);
    assert.strictEqual(env.enq.getSheetByName('All Leads').writeLog.length, 0);
  });
  const env = buildEnvironment();
  env.submit(good({ 'Source': 'Seminar', 'Nearest Branch': 'Pune' }));
  assert.deepStrictEqual(tabsWithLeads(env), ['Seminar'], 'seminar wins over branch');
  const env2 = buildEnvironment();
  env2.submit(good({ 'Source': 'seminar walk-in', 'Nearest Branch': '' }));
  assert.deepStrictEqual(tabsWithLeads(env2), ['Seminar']);
  return table.map(([a, b]) => `"${a}"->${b}`).join(', ') + ', Source=Seminar->Seminar';
});

test('04 seminar: no alert email by default, email when SEMINAR_ALERTS=true; other tabs still email', () => {
  let env = buildEnvironment();
  env.submit(good({ 'Source': 'Seminar' }));
  assert.strictEqual(env.state.mails.length, 0);
  env = buildEnvironment();
  env.state.props.SEMINAR_ALERTS = 'true';
  env.submit(good({ 'Source': 'Seminar' }));
  assert.strictEqual(env.state.mails.length, 1);
  env = buildEnvironment();
  env.submit(good());
  assert.strictEqual(env.state.mails.length, 1);
  return 'seminar default 0 mails; flag on 1 mail; Pune 1 mail';
});

// ─────────────────────────────────────────────────────────────── 4. phone / name
test('05 phone: Indian 10-digit (6-9) and +country-code 7-15 digits; junk rejected', () => {
  const valid = {
    '9876543210': '9876543210', '98765 43210': '9876543210', '+91 98765 43210': '9876543210', '919876543210': '9876543210',
    '09876543210': '9876543210', '6000000000': '6000000000', '+44 7911 123456': '+447911123456',
    '+1 (415) 555-2671': '+14155552671', '0044 7911 123456': '+447911123456', '+971 50 123 4567': '+971501234567'
  };
  const invalid = ['5876543210', '98765', '+91 5876543210', '+1234', '+1234567890123456', '12345678901', 'abcdefghij',
    '98765-43210x', '', '+0123456789', '98765+43210', '+91 987654321', '98765432101234'];
  for (const [input, stored] of Object.entries(valid)) {
    const env = buildEnvironment();
    const res = env.submit(good({ 'Student Contact': input }));
    assert.strictEqual(res.ok, true, 'should accept ' + input + ' ' + JSON.stringify(res));
    assert.strictEqual(env.enq.getSheetByName('Pune').obj(2)['Student Contact'], stored, input);
  }
  for (const input of invalid) {
    const env = buildEnvironment();
    const res = env.submit(good({ 'Student Contact': input }));
    assert.strictEqual(res.ok, false, 'should reject "' + input + '"');
    assert.deepStrictEqual(errFields(res), ['Student Contact'], input);
    assert.strictEqual(totalLeadRows(env), 0);
  }
  return `accepted ${Object.keys(valid).length} formats, rejected ${invalid.length} bad inputs`;
});

test('06 name: letters/spaces/. \' - (incl. Devanagari); digits and markup rejected', () => {
  const valid = ['Aarav Deshmukh', "Mary-Ann O'Neil", 'अनन्या देशमुख', 'Dr. A. P. J. Kalam', 'Li Wei'];
  const invalid = ['', 'A', 'Aarav123', '<script>alert(1)</script>', '12345', '=HYPERLINK("x")', '  ', 'A1'];
  valid.forEach(n => { const env = buildEnvironment(); assert.strictEqual(env.submit(good({ 'Full Name': n })).ok, true, n); });
  invalid.forEach(n => {
    const env = buildEnvironment();
    const res = env.submit(good({ 'Full Name': n }));
    assert.strictEqual(res.ok, false, 'should reject "' + n + '"');
    assert.deepStrictEqual(errFields(res), ['Full Name']);
  });
  return `accepted ${valid.length}, rejected ${invalid.length}`;
});

test('07 ranks, Score Exam, plan, consent', () => {
  for (const [input, norm] of [['jee main', 'JEE Main'], ['MHT CET', 'MHT-CET'], ['mht-cet', 'MHT-CET'], ['Other State CET', 'Other State CET']]) {
    const env = buildEnvironment();
    assert.strictEqual(env.submit(good({ 'Score Exam': input })).ok, true);
    assert.strictEqual(env.enq.getSheetByName('Pune').obj(2)['Score Exam'], norm);
  }
  let env = buildEnvironment();
  assert.deepStrictEqual(errFields(env.submit(good({ 'Score Exam': 'GATE' }))), ['Score Exam']);
  for (const bad of ['0', '2000001', '12.5', 'abc', '-5']) {
    env = buildEnvironment();
    assert.deepStrictEqual(errFields(env.submit(good({ 'JEE Main Rank (CRL)': bad }))), ['JEE Main Rank (CRL)'], bad);
  }
  env = buildEnvironment();
  env.submit(good({ 'JEE Main Rank (CRL)': '1,23,456', 'JEE Advanced Rank': '4500' }));
  assert.strictEqual(env.enq.getSheetByName('Pune').obj(2)['JEE Main Rank (CRL)'], 123456);
  assert.strictEqual(env.enq.getSheetByName('Pune').obj(2)['JEE Advanced Rank'], 4500);
  env = buildEnvironment();
  assert.deepStrictEqual(errFields(env.submit(good({ 'JEE Advanced Rank': '300001' }))), ['JEE Advanced Rank']);
  // plan: client cannot self-upgrade
  env = buildEnvironment();
  env.submit(good({ 'Plan': 'Premium' }));
  assert.strictEqual(env.enq.getSheetByName('Pune').obj(2)['Plan'], 'Explore');
  assert.strictEqual(env.dsheet.obj(2)['Plan'], 'Explore');
  env = buildEnvironment();
  env.submit(good({ 'Plan': '' }));
  assert.strictEqual(env.enq.getSheetByName('Pune').obj(2)['Plan'], 'Explore');
  // consent
  env = buildEnvironment();
  assert.deepStrictEqual(errFields(env.submit(good({ 'Consent': '' }))), ['Consent']);
  assert.strictEqual(totalLeadRows(env), 0);
  env = buildEnvironment();
  env.state.props.REQUIRE_CONSENT = 'false';
  assert.strictEqual(env.submit(good({ 'Consent': '' })).ok, true);
  assert.strictEqual(env.enq.getSheetByName('Pune').obj(2)['Consent'], 'No');
  return 'exam variants normalised; bad ranks rejected; Plan=Premium stored as Explore; consent enforced (and switchable)';
});

// ─────────────────────────────────────────────────────────────── 5. duplicates
test('08 duplicates: same phone within 24h is flagged, not silently re-added', () => {
  const env = buildEnvironment();
  const first = env.submit(good({ 'Student Contact': '9876543210' }));
  env.state.clock = new Date(env.state.clock.getTime() + 3 * 3600 * 1000);
  const second = env.submit(good({ 'Student Contact': '+91 98765-43210', 'Nearest Branch': 'Thane' }));
  assert.strictEqual(second.ok, true);
  assert.strictEqual(second.duplicate, true);
  assert.strictEqual(second.token, first.token, 'the student gets their original token back');
  assert.strictEqual(dashRows(env).length, 1, 'no second dashboard row');
  const thane = env.enq.getSheetByName('Thane');
  assert.match(String(thane.obj(2)['Duplicate Flag']), /DUPLICATE .* of ENG-[A-Z0-9]{10} in Pune row 2/);
  assert.strictEqual(env.state.mails.length, 2);
  assert.match(env.state.mails[1].subject, /DUPLICATE/);

  // 22h later the second row (3h old at the time of the first check) is 25h old: only rows inside 24h count.
  env.state.clock = new Date(env.state.clock.getTime() + 22 * 3600 * 1000);          // 25h after first, 22h after second
  const third = env.submit(good({ 'Student Contact': '9876543210' }));
  assert.strictEqual(third.duplicate, true, 'second submission is only 22h old, still inside the window');
  assert.strictEqual(third.token, first.token);
  env.state.clock = new Date(env.state.clock.getTime() + 25 * 3600 * 1000);          // 25h after the latest row
  const fourth = env.submit(good({ 'Student Contact': '9876543210' }));
  assert.strictEqual(fourth.duplicate, false);
  assert.notStrictEqual(fourth.token, first.token);
  assert.strictEqual(dashRows(env).length, 2);
  return 'dup flagged across tabs + formats, original token returned, 1 dashboard row; 25h after the latest row it is a new lead';
});

test('09 duplicates: a Medical-style token is flagged but never reused', () => {
  const env = buildEnvironment();
  const pune = env.enq.getSheetByName('Pune');
  const set = (h, v) => pune._set(2, env.enqHeaders.indexOf(h) + 1, v);
  set('Timestamp', new Date(env.state.clock.getTime() - 3600 * 1000)); set('Token Number', '26-PUN-045'); set('Student Name', 'Old Medical Lead'); set('Student Contact', '9876543210');
  const res = env.submit(good({ 'Student Contact': '9876543210' }));
  assert.strictEqual(res.duplicate, true);
  assert.match(res.token, /^ENG-/, 'new ENG token, not the medical one');
  assert.strictEqual(dashRows(env).length, 1, 'engineering dashboard row IS created for the new token');
  assert.match(String(pune.obj(3)['Duplicate Flag']), /26-PUN-045/);
  return 'flag mentions 26-PUN-045, token is new ENG-...';
});

// ─────────────────────────────────────────────────────────────── 6. tokens
test('10 tokens: format, uniqueness, not sequential, collision re-roll in BOTH workbooks', () => {
  const env = buildEnvironment({ sheetOpts: { maxRows: 5000 } });
  const tokens = [];
  for (let i = 0; i < 300; i++) {
    const res = env.submit(good({ 'Student Contact': '9' + String(100000000 + i * 7919).slice(-9).padStart(9, '1') }));
    assert.strictEqual(res.ok, true, JSON.stringify(res));
    tokens.push(res.token);
  }
  assert.strictEqual(new Set(tokens).size, tokens.length, 'all unique');
  tokens.forEach(t => assert.match(t, /^ENG-[A-HJKMNP-Z2-9]{10}$/));
  let ascending = 0; for (let i = 1; i < tokens.length; i++) if (tokens[i] > tokens[i - 1]) ascending++;
  const share = ascending / (tokens.length - 1);
  assert.ok(share > 0.4 && share < 0.6, 'order looks random, ascending share=' + share.toFixed(2));
  assert.ok(!tokens.some(t => /^ENG-0|I|L|O/.test(t.slice(4))), 'no ambiguous characters');

  // forced collisions: make the RNG return all-zero bytes first => 'ENG-AAAAAAAAAA'
  const rig = (where) => {
    const e = buildEnvironment();
    const real = e.ctx.randomBytes_;
    let calls = 0;
    e.ctx.randomBytes_ = () => (calls++ === 0 ? new Array(28).fill(0) : real());
    where(e);
    const res = e.submit(good());
    assert.strictEqual(res.ok, true);
    assert.notStrictEqual(res.token, 'ENG-AAAAAAAAAA', 'collision was re-rolled');
    assert.ok(calls >= 2, 'RNG called again after collision');
    return res;
  };
  rig(e => { const s = e.enq.getSheetByName('Andheri'); s._set(2, e.enqHeaders.indexOf('Token Number') + 1, 'ENG-AAAAAAAAAA'); s._set(2, e.enqHeaders.indexOf('Student Name') + 1, 'X Y'); });   // enquiry workbook
  rig(e => { e.dsheet._set(2, e.dashHeaders.indexOf('Token') + 1, 'ENG-AAAAAAAAAA'); e.dsheet._set(2, e.dashHeaders.indexOf('Student Name') + 1, 'X Y'); });                    // dashboard Token
  rig(e => { e.dsheet._set(2, e.dashHeaders.indexOf('Inquiry Token') + 1, 'ENG-AAAAAAAAAA'); e.dsheet._set(2, e.dashHeaders.indexOf('Student Name') + 1, 'X Y'); });             // dashboard Inquiry Token
  return `300 unique tokens, ascending share ${share.toFixed(2)}, collision re-rolled for enquiry / dashboard Token / dashboard Inquiry Token`;
});

// ─────────────────────────────────────────────────────────────── 7. headers
test('11 headers by name: shuffled order, extra columns, case/space variants all fine', () => {
  const env = buildEnvironment();
  // rename a header with odd spacing/case in the Pune tab; still found
  const pune = env.enq.getSheetByName('Pune');
  const idx = env.enqHeaders.indexOf('Student Name');
  pune.rows[0][idx] = '  student   NAME ';
  const res = env.submit(good());
  assert.strictEqual(res.ok, true);
  assert.strictEqual(pune._get(2, idx + 1), 'Aarav Deshmukh');
  // Dashboard columns are also not in config order (extra columns first and last)
  assert.strictEqual(env.dsheet.cell(2, 'Stream'), 'Engineering');
  assert.strictEqual(env.dsheet.cell(2, 'Counsellor Name'), '');
  assert.strictEqual(env.dsheet.cell(2, 'Document Status'), '');
  return 'columns found by name in a shuffled layout with unrelated columns around them';
});

test('12 missing enquiry header: nothing half-written, lead parked, loud email, replay works after the fix', () => {
  const env = buildEnvironment();
  const pune = env.enq.getSheetByName('Pune');
  const idx = env.enqHeaders.indexOf('Entrance Percentile');
  pune.rows[0][idx] = 'Entrance Pctile';          // someone renamed it
  const res = env.submit(good());
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.queued, true);
  assert.strictEqual(totalLeadRows(env), 0, 'no enquiry row');
  assert.strictEqual(dashRows(env).length, 0, 'no dashboard row');
  const pending = Object.keys(env.state.props).filter(k => k.startsWith('PENDING_LEAD_'));
  assert.strictEqual(pending.length, 1);
  assert.ok(env.state.logs.some(l => /MISSING: "Entrance Percentile"/.test(l)), 'logged');
  const errMail = env.state.mails.find(m => /SETUP\/ERROR/.test(m.subject));
  assert.ok(errMail && /Entrance Percentile/.test(errMail.body), 'error email names the header');
  const leadMail = env.state.mails.find(m => /NOT SAVED TO SHEET/.test(m.subject));
  assert.ok(leadMail && /Aarav Deshmukh/.test(leadMail.body), 'per-lead alert still sent, flagged');

  // fix the header, later in time; replay keeps the ORIGINAL submit time
  pune.rows[0][idx] = 'Entrance Percentile';
  const submittedAt = new Date(env.state.clock.getTime());
  env.state.clock = new Date(env.state.clock.getTime() + 2 * 3600 * 1000);
  const rep = env.ctx.replayPendingLeads();
  assert.strictEqual(rep.replayed, 1); assert.strictEqual(rep.remaining, 0);
  assert.strictEqual(totalLeadRows(env), 1);
  assert.strictEqual(dashRows(env).length, 1);
  assert.strictEqual(pune.obj(2)['Timestamp'].getTime(), submittedAt.getTime());
  assert.strictEqual(Object.keys(env.state.props).filter(k => k.startsWith('PENDING_LEAD_')).length, 0);
  const again = env.ctx.replayPendingLeads();
  assert.strictEqual(again.replayed, 0, 'idempotent');
  return 'parked, 2 emails (error + flagged lead), replay wrote 1 enquiry + 1 dashboard row with the original timestamp';
});

test('13 missing dashboard header: enquiry NOT written either (pre-check), lead parked', () => {
  const env = buildEnvironment();
  env.dsheet.rows[0][env.dashHeaders.indexOf('Stream')] = 'Track';
  const res = env.submit(good());
  assert.strictEqual(res.queued, true);
  assert.strictEqual(totalLeadRows(env), 0);
  assert.strictEqual(dashRows(env).length, 0);
  assert.ok(env.state.mails.some(m => /"Stream"/.test(m.body)));
  return 'no partial write; error names "Stream"';
});

test('14 ambiguous (duplicated) header fails loudly too', () => {
  const env = buildEnvironment();
  const pune = env.enq.getSheetByName('Pune');
  pune.rows[0][env.enqHeaders.indexOf('Remark')] = 'Plan';
  const res = env.submit(good());
  assert.strictEqual(res.queued, true);
  assert.ok(env.state.logs.some(l => /AMBIGUOUS: "Plan"/.test(l)));
  return 'two "Plan" columns -> AMBIGUOUS, parked';
});

test('15 verifyHeaders(): OK on a good copy, lists every problem across all tabs on a broken one', () => {
  let env = buildEnvironment();
  let r = env.ctx.verifyHeaders();
  assert.strictEqual(r.ok, true);
  assert.strictEqual(env.state.mails.length, 0);
  env = buildEnvironment();
  env.enq.getSheetByName('Seminar').rows[0][env.enqHeaders.indexOf('gclid')] = 'GCLID_OLD';
  env.enq.getSheetByName('Thane').rows[0][env.enqHeaders.indexOf('Consent')] = '';
  env.dsheet.rows[0][env.dashHeaders.indexOf('Dashboard URL')] = 'URL';
  r = env.ctx.verifyHeaders();
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.problems.length, 3);
  assert.ok(env.state.mails.length === 1 && /Seminar/.test(env.state.mails[0].body) && /Thane/.test(env.state.mails[0].body) && /Dashboard URL/.test(env.state.mails[0].body));
  assert.strictEqual(totalLeadRows(env), 0, 'read-only');
  return '3 problems reported in one email; nothing written';
});

// ─────────────────────────────────────────────────────────────── 8. email / hook / lock
test('16 mail failure, no recipient, zero quota: lead is always saved', () => {
  let env = buildEnvironment();
  env.state.mailThrows = true;
  let res = env.submit(good());
  assert.strictEqual(res.ok, true); assert.ok(res.token);
  assert.strictEqual(totalLeadRows(env), 1); assert.strictEqual(dashRows(env).length, 1);
  assert.ok(env.state.logs.some(l => /alert email FAILED/i.test(l)));

  env = buildEnvironment(); delete env.state.props.LEAD_ALERT_EMAIL;
  res = env.submit(good());
  assert.strictEqual(res.ok, true); assert.strictEqual(env.state.mails.length, 0); assert.strictEqual(totalLeadRows(env), 1);

  env = buildEnvironment(); env.state.mailQuota = 0;
  res = env.submit(good());
  assert.strictEqual(res.ok, true); assert.strictEqual(env.state.mails.length, 0); assert.strictEqual(totalLeadRows(env), 1);
  return 'throwing mail / empty LEAD_ALERT_EMAIL / quota 0 -> lead + dashboard row saved every time';
});

test('17 error emails are throttled; per-lead alerts are not; no lead lost in an outage', () => {
  const env = buildEnvironment();
  env.enq.getSheetByName('Pune').rows[0][env.enqHeaders.indexOf('Home State')] = 'State';
  for (let i = 0; i < 5; i++) env.submit(good({ 'Student Contact': '98765432' + (10 + i) }));
  const errMails = env.state.mails.filter(m => /SETUP\/ERROR/.test(m.subject));
  const leadMails = env.state.mails.filter(m => /NOT SAVED TO SHEET/.test(m.subject));
  assert.strictEqual(errMails.length, 1);
  assert.strictEqual(leadMails.length, 5);
  assert.strictEqual(Object.keys(env.state.props).filter(k => k.startsWith('PENDING_LEAD_')).length, 5);
  return '5 failing submissions -> 1 admin error mail, 5 flagged lead mails, 5 parked leads';
});

test('18 WhatsApp hook: default is a no-op; a throwing hook cannot lose the lead', () => {
  let env = buildEnvironment();
  assert.strictEqual(env.submit(good()).ok, true);
  env = buildEnvironment();
  const calls = [];
  env.ctx.sendWhatsAppAlert_ = (lead, result) => { calls.push(result.token); throw new Error('boom'); };
  const res = env.submit(good());
  assert.strictEqual(res.ok, true);
  assert.deepStrictEqual(calls, [res.token]);
  assert.strictEqual(totalLeadRows(env), 1);
  assert.ok(env.state.logs.some(l => /WhatsApp hook failed/.test(l)));
  return 'hook called once with the token; its exception was logged and the lead saved';
});

test('19 locking: busy lock parks the lead; lock released even when the write throws; sequential rows differ', () => {
  let env = buildEnvironment();
  env.state.lockBusy = true;
  let res = env.submit(good());
  assert.strictEqual(res.queued, true);
  assert.strictEqual(totalLeadRows(env), 0);
  env.state.lockBusy = false;
  assert.strictEqual(env.ctx.replayPendingLeads().replayed, 1);

  env = buildEnvironment();
  env.enq.getSheetByName('Pune').failOnSetValues = 1;       // write throws inside the lock
  res = env.submit(good());
  assert.strictEqual(res.queued, true);
  assert.strictEqual(env.state.lockAcquired, env.state.lockReleased, 'every acquired lock was released');
  assert.strictEqual(env.state.lockHeld, false);

  env = buildEnvironment();
  env.submit(good({ 'Student Contact': '9876500001' }));
  env.submit(good({ 'Student Contact': '9876500002' }));
  assert.deepStrictEqual(leadRows(env.enq.getSheetByName('Pune')), [2, 3]);
  assert.deepStrictEqual(dashRows(env), [2, 3]);
  return 'busy lock -> parked then replayed; lock always released; rows 2 and 3 for two sequential leads (MOCK ONLY: no true parallelism)';
});

test('20 dashboard write fails after the enquiry row: lead kept, flagged, repair is idempotent', () => {
  const env = buildEnvironment();
  env.dsheet.failOnSetValues = 1;
  const res = env.submit(good());
  assert.strictEqual(res.ok, true); assert.ok(res.token);
  assert.strictEqual(totalLeadRows(env), 1);
  assert.strictEqual(dashRows(env).length, 0);
  assert.ok(env.state.mails.some(m => /DASHBOARD ROW FAILED/.test(m.subject)));
  assert.ok(env.state.mails.some(m => /Dashboard row failed for/.test(m.subject)), 'admin error mail');
  assert.strictEqual(env.ctx.repairMissingDashboardRows().created, 1);
  assert.strictEqual(dashRows(env).length, 1);
  assert.strictEqual(env.dsheet.obj(2)['Token'], res.token);
  assert.strictEqual(env.dsheet.obj(2)['Score'], 98.37);
  assert.strictEqual(env.ctx.repairMissingDashboardRows().created, 0);
  return 'enquiry saved, dashboard repaired once, second repair created 0';
});

// ─────────────────────────────────────────────────────────────── 9. privacy / safety
test('21 no phone numbers anywhere in the Dashboard workbook', () => {
  const env = buildEnvironment();
  env.submit(good({ 'Student Contact': '9876543210', 'Father Contact': '9123456780', 'Mother Contact': '+44 7911 123456' }));
  const blob = JSON.stringify(env.dsheet.rows);
  ['9876543210', '9123456780', '447911123456', '7911123456'].forEach(n => assert.ok(!blob.includes(n), 'dashboard must not contain ' + n));
  // the script itself is configured with no phone column for the Dashboard (the sheet may hold unrelated decoy columns)
  const D = env.get('DASHBOARD_HEADERS'), SH = env.get('STUDENT_HEADERS');
  assert.strictEqual(Object.values(D).concat(Object.values(SH)).filter(h => /contact|phone|mobile/i.test(h)).length, 0);
  const enq = env.enq.getSheetByName('Pune').obj(2);
  assert.strictEqual(enq['Father Contact'], '9123456780');
  assert.strictEqual(enq['Mother Contact'], '+447911123456');
  return 'dashboard rows contain none of the 3 numbers; enquiry row has them';
});

test('22 parent numbers: invalid ones never cost the lead (kept as typed, flagged in the alert)', () => {
  const env = buildEnvironment();
  const res = env.submit(good({ 'Father Contact': '12345', 'Mother Contact': '' }));
  assert.strictEqual(res.ok, true);
  assert.strictEqual(env.enq.getSheetByName('Pune').obj(2)['Father Contact'], '12345');
  assert.match(env.state.mails[0].body, /Father Contact looks invalid/);
  return 'saved + warning in email';
});

test('23 honeypot and formula-injection text', () => {
  let env = buildEnvironment();
  const res = env.submit(good({ 'website_url': 'http://spam.invalid' }));
  assert.deepStrictEqual(res, { ok: true });
  assert.strictEqual(totalLeadRows(env), 0); assert.strictEqual(env.state.mails.length, 0);

  env = buildEnvironment();
  env.submit(good({ 'City': '=HYPERLINK("http://x.invalid","click")', 'utm_campaign': '+cmd|calc', 'Coaching Class': '@SUM(1+1)', 'Home State': '-2+3' }));
  const pune = env.enq.getSheetByName('Pune');
  const row = pune.obj(2);
  assert.strictEqual(row['City'], '=HYPERLINK("http://x.invalid","click")', 'stored literally as text');
  ['City', 'utm_campaign', 'Coaching Class', 'Home State', 'Student Contact', 'Student Name'].forEach(h => {
    assert.strictEqual(pune.formats['2,' + (env.enqHeaders.indexOf(h) + 1)], '@', h + ' cell is forced to plain-text format');
  });
  return 'bot dropped silently; risky strings stored with plain-text format requested (MOCK: cannot prove Sheets honours it)';
});

test('24 configuration: IDs only from Script Properties; missing/invalid IDs fail safe and never leak IDs', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'engineering-leads.js'), 'utf8');
  assert.ok(!/[A-Za-z0-9_-]{40,}/.test(src), 'no long ID-like string in the code');
  assert.ok(!/script\.google\.com|docs\.google\.com\/spreadsheets/.test(src), 'no URLs to sheets in the code');
  assert.ok(!/COL_[A-Z_]+\s*=\s*\d/.test(src), 'no column-number constants');

  let env = buildEnvironment({ configure: false });
  let res = env.submit(good());
  assert.strictEqual(res.ok, true); assert.strictEqual(res.queued, true);
  assert.strictEqual(Object.keys(env.state.props).filter(k => k.startsWith('PENDING_LEAD_')).length, 1);

  env = buildEnvironment({ enqId: 'SECRET-ENQ-ID-123', dashId: 'SECRET-DASH-ID-456' });
  env.state.props.ENQUIRY_SPREADSHEET_ID = 'WRONG-ID-NO-ACCESS';
  res = env.submit(good());
  assert.strictEqual(res.queued, true);
  const everything = env.state.logs.join('\n') + JSON.stringify(env.state.mails) + JSON.stringify(res);
  ['SECRET-ENQ-ID-123', 'SECRET-DASH-ID-456'].forEach(s => assert.ok(!everything.includes(s)));
  // doGet exposes nothing
  const out = JSON.parse(env.ctx.doGet().getContent());
  assert.deepStrictEqual(Object.keys(out).sort(), ['ok', 'service', 'version']);
  return 'no IDs/URLs/column numbers in source; bad config parks the lead; IDs absent from logs/emails/responses';
});

test('25 sheet growth: when the tab has no free rows left, rows are inserted', () => {
  const env = buildEnvironment({ sheetOpts: { maxRows: 61 } });     // 60 formula rows fill the sheet
  const pune = env.enq.getSheetByName('Pune');
  for (let r = 2; r <= 61; r++) { pune._set(r, env.enqHeaders.indexOf('Token Number') + 1, 'ENG-ZZZZZZZZ' + String(10 + r)); pune._set(r, env.enqHeaders.indexOf('Student Name') + 1, 'Filler'); }
  const res = env.submit(good());
  assert.strictEqual(res.ok, true);
  assert.ok(pune.insertedRows >= 1);
  assert.strictEqual(pune.obj(62)['Token Number'], res.token);
  return 'wrote to row 62 after inserting rows';
});

test('26 ENVIRONMENT=copy tags emails [TEST]; smoke test is refused unless explicitly enabled', () => {
  let env = buildEnvironment();
  env.state.props.ENVIRONMENT = 'copy';
  env.submit(good());
  assert.ok(env.state.mails[0].subject.startsWith('[TEST] '));
  env = buildEnvironment();
  assert.throws(() => env.ctx.runSmokeTest(), /disabled/);
  assert.strictEqual(totalLeadRows(env), 0);
  env.state.props.ALLOW_SMOKE_TEST = 'true';
  const res = env.ctx.runSmokeTest();
  assert.strictEqual(res.ok, true);
  assert.strictEqual(totalLeadRows(env), 1);
  return 'subject prefixed; smoke test blocked by default, works when flagged';
});

test('27 parking queue full: told honestly, not silently', () => {
  const env = buildEnvironment({ configure: false });
  env.state.props.LEAD_ALERT_EMAIL = 'alerts@example.invalid';
  for (let i = 0; i < 100; i++) env.state.props['PENDING_LEAD_' + i] = '{}';
  const res = env.submit(good());
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.error, 'unavailable');
  assert.ok(env.state.mails.some(m => /queue full/i.test(m.subject)));
  return 'ok:false returned so the form can tell the student to call';
});

// ─────────────────────────────────────────────────────────────── 10. website form contract (static)
test('28 website form sends exactly the field names the script reads (static check of page.js)', () => {
  const formPath = path.join(__dirname, '..', '..', '..', 'nextjs-sandbox', 'app', 'engineering', 'inquiry', 'page.js');
  const src = fs.readFileSync(formPath, 'utf8');
  const { buildEnvironment: be } = require('./mock-gas');
  const env = be();
  const names = env.get('PARAM_NAMES');
  const mustSend = ['Entrance Percentile', 'Score Exam', 'JEE Main Rank (CRL)', 'JEE Advanced Rank', 'Exams Appearing', 'Home State', 'Class Status',
    'Source', 'utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'Plan', 'Consent', 'Full Name', 'Student Contact', 'Nearest Branch', 'website_url'];
  mustSend.forEach(n => assert.ok(src.includes("'" + n + "'"), 'form page.js should send "' + n + '"'));
  // every name the form sends must be one the script knows
  const known = new Set(Object.values(names).flat());
  mustSend.forEach(n => assert.ok(known.has(n), 'script does not read "' + n + '"'));
  const lib = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'nextjs-sandbox', 'lib', 'leadForm.js'), 'utf8');
  assert.ok(lib.includes('process.env.NEXT_PUBLIC_ENGINEERING_LEAD_URL'), 'endpoint comes from an env var, not hard-coded');
  assert.ok(!/AKfycb[\w-]+/.test(src), 'page.js must not hard-code any script deployment URL (the live one lives only in lib/leadForm.js)');
  return 'all ' + mustSend.length + ' names present in the form and recognised by the script';
});

// ─────────────────────────────────────────────────────────────── 11. student dashboard actions (getStudent / saveShortlist / saveDocStatus)
const TOK = 'ENG-ABCDEFGH23';                 // the student's internal row id (Token column). NOT a way in any more.
const EMAIL = 'aarav.test@example.invalid';   // the student's Approved Email: the only way in
const EMAIL2 = 'other.test@example.invalid';
const ALLOWED_KEYS = ['category', 'category_rank', 'counsellor_name', 'counsellor_whatsapp', 'desired_branches', 'document_status', 'gender', 'home_state', 'home_university', 'jee_adv_category_rank', 'jee_adv_rank', 'jee_main_crl_rank', 'jee_main_percentile', 'mhtcet_percentile', 'mhtcet_sml', 'minority', 'name', 'pref_list_enabled', 'profile_locked', 'pwd', 'saved_colleges', 'score', 'stage', 'tracks', 'whatsapp_group_link'];
const setCell = (sheet, row, header, value) => sheet._set(row, sheet.rows[0].indexOf(header) + 1, value);
function seedStudent(env, row = 2, over = {}) {
  const v = Object.assign({
    'Token': TOK, 'Approved Email': EMAIL, 'Stream': 'Engineering', 'Student Name': 'Aarav Deshmukh', 'Score': 98.37, 'Category': 'OBC-NCL', 'Stage': 'Counselling Started',
    'Tracks': 'JoSAA, Maharashtra CAP', 'Counsellor Name': 'Engg Counsellor', 'Counsellor WhatsApp': '+91 90000-00003',
    'WhatsApp Group Link': 'https://chat.whatsapp.com/abc123',
    'Saved Shortlist': JSON.stringify({ JOSAA: [{ institute: 'Demo Institute Alpha', branch: 'Computer Science', seatType: 'AI' }], CAP: [] }),
    'Document Status': JSON.stringify({ checked: ['jee-scorecard'], category: 'OBC', quota: '' }),
    'Student Phone': '9876543210', 'Parent Notes': 'father 9123456780', 'Admin Remarks': 'secret-admin-note',
  }, over);
  Object.keys(v).forEach(h => setCell(env.dsheet, row, h, v[h]));
}
// postJson: `as: <email>` signs in as that Google account (a fresh mock ID token); `idToken` sends exactly what you give it.
const postJson = (env, body) => {
  const b = Object.assign({}, body);
  if ('as' in b) { b.idToken = env.mintToken(b.as); delete b.as; }
  return JSON.parse(env.ctx.doPost({ parameter: {}, postData: { type: 'text/plain', contents: JSON.stringify(b) } }).getContent());
};
const getStudent = (env, email) => postJson(env, { action: 'getStudent', as: email });
const saveDoc = (env, email, data) => postJson(env, { action: 'saveDocStatus', as: email, data });
const snapshot = env => JSON.stringify(env.dsheet.rows);

test('29 getStudent: only the fields the page uses; decimals kept; never a student/parent phone', () => {
  const env = buildEnvironment(); seedStudent(env);
  const res = getStudent(env, EMAIL);
  assert.strictEqual(res.success, true);
  assert.deepStrictEqual(Object.keys(res.data).sort(), ALLOWED_KEYS);
  assert.strictEqual(res.data.score, 98.37);
  assert.strictEqual(typeof res.data.score, 'number');
  assert.deepStrictEqual(Array.from(res.data.tracks), ['JoSAA', 'Maharashtra CAP']);
  assert.strictEqual(res.data.name, 'Aarav Deshmukh');
  assert.strictEqual(res.data.stage, 'Counselling Started');
  assert.strictEqual(res.data.counsellor_whatsapp, '919000000003');
  assert.strictEqual(res.data.whatsapp_group_link, 'https://chat.whatsapp.com/abc123');
  assert.deepStrictEqual(Array.from(res.data.saved_colleges.JOSAA).map(i => i.institute), ['Demo Institute Alpha']);
  assert.strictEqual(JSON.parse(res.data.document_status).checked[0], 'jee-scorecard');
  const blob = JSON.stringify(res);
  ['9876543210', '9123456780', 'secret-admin-note', 'father', 'Student Phone', 'Parent Notes'].forEach(x => assert.ok(!blob.includes(x), 'must not leak ' + x));
  return 'exactly 10 fields; no decoy columns; score 98.37 stays a number';
});

test('30 sign-in checked server-side: no/forged/expired/foreign/unverified tokens, unknown email, wrong stream', () => {
  const env = buildEnvironment(); seedStudent(env);
  const post = idToken => postJson(env, { action: 'getStudent', idToken });
  assert.deepStrictEqual(post(undefined), { error: 'auth_required' });
  assert.deepStrictEqual(post(''), { error: 'auth_required' });
  assert.deepStrictEqual(postJson(env, { action: 'getStudent', token: TOK }), { error: 'auth_required' }, 'the old ?token= alone is nothing');
  assert.deepStrictEqual(postJson(env, { action: 'getStudent', token: TOK, idToken: TOK }), { error: 'auth_invalid' }, 'a Token-column value is not a Google token');
  for (const bad of ['not a jwt', '<script>', 'a.b', 'x'.repeat(5000), 123, { a: 1 }, 'a.b.c']) {
    assert.deepStrictEqual(post(bad), { error: typeof bad === 'string' ? 'auth_invalid' : 'auth_required' }, 'bad token ' + String(bad).slice(0, 12));
  }
  assert.deepStrictEqual(post(env.mintToken(EMAIL, { aud: 'someone-elses-app.apps.googleusercontent.com' })), { error: 'auth_invalid' }, 'token made for another app');
  assert.deepStrictEqual(post(env.mintToken(EMAIL, { iss: 'https://evil.invalid' })), { error: 'auth_invalid' }, 'wrong issuer');
  assert.deepStrictEqual(post(env.mintToken(EMAIL, { exp: String(Math.floor(env.state.clock.getTime() / 1000) - 5) })), { error: 'auth_invalid' }, 'expired');
  assert.deepStrictEqual(post(env.mintToken(EMAIL, { email_verified: 'false' })), { error: 'auth_invalid' }, 'unverified email');
  assert.deepStrictEqual(post(env.mintToken('not-an-email')), { error: 'auth_invalid' });
  assert.deepStrictEqual(post(env.mintToken(EMAIL2)), { error: 'not_approved' }, 'genuine Google user, not on the sheet');
  assert.strictEqual(getStudent(env, '  ' + EMAIL.toUpperCase() + ' ').success, true, 'email compare ignores case and spaces');
  setCell(env.dsheet, 2, 'Stream', 'Medical');
  assert.deepStrictEqual(getStudent(env, EMAIL), { error: 'not_approved' }, 'a Medical row is never served here');
  setCell(env.dsheet, 2, 'Stream', '');
  assert.deepStrictEqual(getStudent(env, EMAIL), { error: 'not_approved' }, 'blank stream is not served');
  setCell(env.dsheet, 2, 'Stream', ' engineering ');
  assert.strictEqual(getStudent(env, EMAIL).success, true);
  setCell(env.dsheet, 2, 'Token', '');
  assert.deepStrictEqual(getStudent(env, EMAIL), { error: 'not_approved' }, 'a row with no internal id is not served');
  assert.ok(!env.state.logs.some(l => l.includes(EMAIL) || l.includes('mk1.')), 'logs never contain the email or a token');
  return 'every bad-token form and unknown/wrong-stream email refused with a short code';
});

test('31 messy cells never break or leak: corrupt JSON, bad score, unsafe link', () => {
  const env = buildEnvironment(); seedStudent(env, 2, { 'Saved Shortlist': '{not json', 'Document Status': 'oops', 'Score': 'n/a', 'WhatsApp Group Link': 'javascript:alert(1)', 'Tracks': '' });
  const d = getStudent(env, EMAIL).data;
  assert.deepStrictEqual(d.saved_colleges, {}); assert.strictEqual(d.document_status, null); assert.strictEqual(d.score, null);
  assert.strictEqual(d.whatsapp_group_link, ''); assert.deepStrictEqual(Array.from(d.tracks), []);
  setCell(env.dsheet, 2, 'Saved Shortlist', '[1,2,3]'); setCell(env.dsheet, 2, 'Score', '');
  const d2 = getStudent(env, EMAIL).data; assert.deepStrictEqual(d2.saved_colleges, {}); assert.strictEqual(d2.score, null);
  return 'safe defaults';
});

test('32 missing page header: server_error with no details, loud email; the lead flow still works', () => {
  const env = buildEnvironment(); seedStudent(env);
  env.dsheet.rows[0][env.dashHeaders.indexOf('Saved Shortlist')] = 'Shortlist JSON';
  const res = getStudent(env, EMAIL);
  assert.deepStrictEqual(res, { error: 'server_error' });
  const mail = env.state.mails.find(m => /SETUP\/ERROR/.test(m.subject));
  assert.ok(mail && /Saved Shortlist/.test(mail.body), 'admin email names the header');
  assert.ok(env.state.logs.some(l => /MISSING: "Saved Shortlist"/.test(l)));
  assert.ok(!JSON.stringify(res).includes('Saved Shortlist'));
  assert.strictEqual(env.submit(good({ 'Student Contact': '9876500077' })).ok, true, 'lead intake unaffected');
  assert.strictEqual(postJson(env, { action: 'saveShortlist', as: EMAIL, colleges: { JOSAA: [] } }).error, 'server_error');
  return 'getStudent/saveShortlist fail closed; lead flow keeps working';
});

test('33 saveShortlist: valid grouped list is saved as text, nothing else changes; bad shapes rejected', () => {
  const env = buildEnvironment(); seedStudent(env); seedStudent(env, 3, { 'Token': 'ENG-JKMNPQRS45', 'Approved Email': EMAIL2, 'Student Name': 'Other Student', 'Saved Shortlist': '' });
  const before = JSON.parse(snapshot(env));
  const list = { JOSAA: [{ institute: 'IIT Bombay', branch: 'CSE', seatType: 'AI', name: '=HYPERLINK("http://x.invalid","hi")' }], CAP: [{ institute: 'VJTI', branch: 'IT', seatType: 'State Level' }] };
  const res = postJson(env, { action: 'saveShortlist', as: EMAIL, colleges: list });
  assert.deepStrictEqual(res, { success: true, count: 2 });
  assert.deepStrictEqual(JSON.parse(env.dsheet.cell(2, 'Saved Shortlist')), list);
  assert.strictEqual(env.dsheet.formats['2,' + (env.dashHeaders.indexOf('Saved Shortlist') + 1)], '@', 'plain-text cell');
  assert.strictEqual(getStudent(env, EMAIL).data.saved_colleges.CAP[0].institute, 'VJTI');
  // every other cell identical
  const after = JSON.parse(snapshot(env)); const col = env.dashHeaders.indexOf('Saved Shortlist');
  after[1][col] = before[1][col];
  assert.deepStrictEqual(after, before, 'only the Saved Shortlist cell of that student changed');
  const bad = [[], 'x', null, { JOSAA: 'x' }, { JOSAA: [1] }, { JOSAA: [[1]] }, { 'bad key!': [] }, { JOSAA: [null] },
    { JOSAA: new Array(301).fill({ a: 1 }) }, { JOSAA: [{ a: 'x'.repeat(2100) }] }, Object.fromEntries(Array.from({ length: 11 }, (_, i) => ['G' + i, []]))];
  bad.forEach((b, i) => assert.deepStrictEqual(postJson(env, { action: 'saveShortlist', as: EMAIL, colleges: b }), { error: 'invalid_input' }, 'bad shape #' + i));
  assert.deepStrictEqual(postJson(env, { action: 'saveShortlist', as: 'nobody@example.invalid', colleges: list }), { error: 'not_approved' });
  assert.deepStrictEqual(JSON.parse(env.dsheet.cell(2, 'Saved Shortlist')), list, 'rejected requests changed nothing');
  return 'saved + read back; one cell changed; 11 bad shapes and an unknown token rejected without writing';
});

test('34 saveDocStatus: validated and normalised; bad input rejected', () => {
  const env = buildEnvironment(); seedStudent(env);
  const ok = saveDoc(env, EMAIL, JSON.stringify({ checked: ['jee-scorecard', 'cls10-mark', 'cls10-mark'], category: 'OBC', quota: '' }));
  assert.deepStrictEqual(ok, { success: true });
  assert.deepStrictEqual(JSON.parse(env.dsheet.cell(2, 'Document Status')), { checked: ['jee-scorecard', 'cls10-mark'], category: 'OBC', quota: '' });
  const before = snapshot(env);
  for (const bad of ['not json', '{}', JSON.stringify({ checked: 'x' }), JSON.stringify({ checked: ['<b>x</b>'] }), JSON.stringify({ checked: [1] }), JSON.stringify({ checked: new Array(501).fill('a') }), JSON.stringify([1]), undefined, ''])
    assert.deepStrictEqual(saveDoc(env, EMAIL, bad), { error: 'invalid_input' }, 'bad ' + String(bad).slice(0, 30));
  assert.deepStrictEqual(saveDoc(env, 'nobody@example.invalid', JSON.stringify({ checked: [] })), { error: 'not_approved' });
  assert.strictEqual(snapshot(env), before, 'nothing changed by rejected requests');
  return 'dedupes ids, rejects odd characters/shape/size, unknown token not_found';
});

test('35 routing: health check, unknown actions, saveShortlist is POST-only; lead form posts still reach the lead flow', () => {
  const env = buildEnvironment(); seedStudent(env);
  assert.deepStrictEqual(Object.keys(JSON.parse(env.ctx.doGet({ parameter: {} }).getContent())).sort(), ['ok', 'service', 'version']);
  assert.deepStrictEqual(JSON.parse(env.ctx.doGet({ parameter: { action: 'bogus', token: TOK } }).getContent()), { error: 'invalid_action' });
  assert.deepStrictEqual(JSON.parse(env.ctx.doGet({ parameter: { action: 'saveShortlist', token: TOK } }).getContent()), { error: 'invalid_action' });
  for (const a of ['getStudent', 'saveDocStatus', 'getPreferenceList']) assert.deepStrictEqual(JSON.parse(env.ctx.doGet({ parameter: { action: a, token: TOK, idToken: 'x.y.z' } }).getContent()), { error: 'invalid_action' }, a + ' by GET is gone');
  assert.deepStrictEqual(postJson(env, { action: 'deleteEverything', as: EMAIL }), { error: 'invalid_action' });
  const lead = env.submit(good({ 'Student Contact': '9876500088' }));      // urlencoded form fields, no JSON body
  assert.strictEqual(lead.ok, true); assert.match(lead.token, /^ENG-/);
  return 'dashboard calls and lead posts do not interfere';
});

test('36 writes take the lock: busy => nothing written; lock released after a failed write', () => {
  let env = buildEnvironment(); seedStudent(env);
  const before = snapshot(env); env.state.lockBusy = true;
  assert.deepStrictEqual(postJson(env, { action: 'saveShortlist', as: EMAIL, colleges: { JOSAA: [] } }), { error: 'busy' });
  assert.strictEqual(snapshot(env), before);
  env = buildEnvironment(); seedStudent(env); env.dsheet.failOnSetValues = 0;
  const range = env.dsheet.getRange; let thrown = false;
  env.dsheet.getRange = function (...a) { const r = range.apply(this, a); const sv = r.setValue; r.setValue = function () { thrown = true; throw new Error('Mock: boom'); }; return r; };
  assert.deepStrictEqual(postJson(env, { action: 'saveShortlist', as: EMAIL, colleges: { JOSAA: [] } }), { error: 'server_error' });
  assert.ok(thrown); assert.strictEqual(env.state.lockAcquired, env.state.lockReleased); assert.strictEqual(env.state.lockHeld, false);
  return 'busy lock -> busy, no write; failed write -> server_error and lock released';
});

test('37 columns by header name: a fully reversed column order gives the same answers', () => {
  const env = buildEnvironment(); seedStudent(env);
  const ref = getStudent(env, EMAIL);
  env.dsheet.rows = env.dsheet.rows.map(r => { const c = r.slice(); while (c.length < env.dashHeaders.length) c.push(''); return c.reverse(); });
  assert.deepStrictEqual(getStudent(env, EMAIL), ref);
  const list = { CAP: [{ institute: 'VJTI', branch: 'IT', seatType: 'State Level' }] };
  assert.strictEqual(postJson(env, { action: 'saveShortlist', as: EMAIL, colleges: list }).success, true);
  assert.deepStrictEqual(JSON.parse(env.dsheet.cell(2, 'Saved Shortlist')), list);
  return 'identical results with reversed columns';
});

test('38 verifyHeaders also checks the page columns and says which are missing', () => {
  const env = buildEnvironment();
  assert.strictEqual(env.ctx.verifyHeaders().ok, true);
  env.dsheet.rows[0][env.dashHeaders.indexOf('Tracks')] = ''; env.dsheet.rows[0][env.dashHeaders.indexOf('Counsellor WhatsApp')] = 'x';
  const r = env.ctx.verifyHeaders();
  assert.strictEqual(r.ok, false);
  assert.ok(r.problems.some(p => /Student dashboard page/.test(p) && /"Tracks"/.test(p) && /"Counsellor WhatsApp"/.test(p)));
  return 'both missing page headers reported in one message';
});


// ─────────────────────────────────────────────────────────────── 12. Google sign-in details
const PARENT = 'parent.test@example.invalid', TWIN2 = 'twin2.test@example.invalid', TOK2 = 'ENG-JKMNPQRS45';
function twinsEnv() {
  const env = buildEnvironment();
  seedStudent(env, 2, { 'Approved Email': EMAIL + ', ' + PARENT, 'Student Name': 'Aarav Deshmukh' });
  seedStudent(env, 3, { 'Token': TOK2, 'Approved Email': TWIN2 + ';\n' + PARENT.toUpperCase(), 'Student Name': 'Twin Two', 'Saved Shortlist': '', 'Document Status': '' });
  return env;
}
test('39 twins + shared parent email: a cell may list several emails; a shared email gets a choice, not data', () => {
  const env = twinsEnv();
  assert.strictEqual(getStudent(env, EMAIL).data.name, 'Aarav Deshmukh', 'a twin\'s own email opens only that twin');
  assert.strictEqual(getStudent(env, TWIN2).data.name, 'Twin Two');
  const ch = getStudent(env, PARENT);
  assert.strictEqual(ch.success, true); assert.deepStrictEqual(Object.keys(ch), ['success', 'choose'], 'no student data before a choice');
  assert.deepStrictEqual(ch.choose.map(c => c.name), ['Aarav Deshmukh', 'Twin Two']); assert.deepStrictEqual(ch.choose.map(c => c.ref), [TOK, TOK2]);
  ['9876543210', 'secret-admin-note', 'Student Phone', 'Counsellor', EMAIL, TWIN2].forEach(x => assert.ok(!JSON.stringify(ch).includes(x), 'must not leak ' + x));
  assert.strictEqual(postJson(env, { action: 'getStudent', as: PARENT, studentRef: TOK2 }).data.name, 'Twin Two');
  assert.strictEqual(postJson(env, { action: 'getStudent', as: PARENT, studentRef: '  ' + TOK + ' ' }).data.name, 'Aarav Deshmukh');
  return 'choose list = names + refs only';
});
test('39b the chosen student only: a ref can never reach a row the email is not on', () => {
  const env = twinsEnv(); const snap = snapshot(env);
  assert.deepStrictEqual(postJson(env, { action: 'getStudent', as: EMAIL, studentRef: TOK2 }), { error: 'not_approved' }, 'twin A cannot ask for twin B');
  assert.deepStrictEqual(postJson(env, { action: 'getStudent', as: TWIN2, studentRef: TOK }), { error: 'not_approved' });
  assert.deepStrictEqual(postJson(env, { action: 'getStudent', as: PARENT, studentRef: 'ENG-ZZZZZZZZZ9' }), { error: 'not_approved' }, 'unknown ref');
  assert.deepStrictEqual(postJson(env, { action: 'getStudent', as: 'stranger@example.invalid', studentRef: TOK }), { error: 'not_approved' });
  assert.deepStrictEqual(postJson(env, { action: 'saveShortlist', as: EMAIL, studentRef: TOK2, colleges: { JOSAA: [] } }), { error: 'not_approved' });
  assert.strictEqual(snapshot(env), snap, 'nothing written by refused requests');
  // a single-row student may also send their own ref
  assert.strictEqual(postJson(env, { action: 'getStudent', as: EMAIL, studentRef: TOK }).success, true);
});
test('39c writes by a shared email need a choice and go only to the chosen row (shortlist, documents, profile, preference list)', () => {
  const env = twinsEnv(); const list = { JOSAA: [{ institute: 'VJTI', branch: 'IT', seatType: 'AI' }] };
  assert.deepStrictEqual(postJson(env, { action: 'saveShortlist', as: PARENT, colleges: list }), { error: 'student_required' });
  assert.deepStrictEqual(postJson(env, { action: 'saveDocStatus', as: PARENT, data: { checked: ['a'] } }), { error: 'student_required' });
  assert.deepStrictEqual(postJson(env, { action: 'saveProfile', as: PARENT, profile: { gender: 'Male' } }), { ok: false, error: 'student_required' });
  assert.deepStrictEqual(postJson(env, { action: 'savePreferenceList', as: PARENT, counselling: 'JOSAA', items: [] }), { ok: false, error: 'student_required' });
  const snap = snapshot(env); assert.strictEqual(env.dash.getSheetByName('Preference Lists'), null);
  assert.deepStrictEqual(postJson(env, { action: 'saveShortlist', as: PARENT, studentRef: TOK2, colleges: list }), { success: true, count: 1 });
  assert.strictEqual(JSON.parse(env.dsheet.cell(3, 'Saved Shortlist')).JOSAA[0].institute, 'VJTI');
  assert.ok(env.dsheet.cell(2, 'Saved Shortlist').includes('Demo Institute Alpha'), 'the other twin is untouched');
  assert.strictEqual(postJson(env, { action: 'saveDocStatus', as: PARENT, studentRef: TOK, data: { checked: ['jee-scorecard'], category: 'OBC', quota: '' } }).success, true);
  assert.ok(env.dsheet.cell(3, 'Document Status') === '', 'twin 2 untouched'); 
  assert.strictEqual(postJson(env, { action: 'saveProfile', as: PARENT, studentRef: TOK2, profile: { gender: 'Female' } }).ok, true);
  assert.strictEqual(env.dsheet.cell(3, 'Gender'), 'Female'); assert.notStrictEqual(env.dsheet.cell(2, 'Gender'), 'Female');
  assert.strictEqual(postJson(env, { action: 'savePreferenceList', as: PARENT, studentRef: TOK2, counselling: 'JOSAA', items: [{ institute: 'IIT Bombay', program: 'CSE', quota: 'AI', gender: 'all', choiceCode: '', tag: 'safe' }] }).ok, true);
  const pl = env.dash.getSheetByName('Preference Lists'); assert.ok(pl.rows.slice(1).every(r => r.includes(TOK2) && !r.includes(TOK)), 'preference rows belong to the chosen twin');
  assert.ok(snap !== snapshot(env));
});
test('39d limits: more than 10 rows on one email is refused; non-Engineering rows and rows without a Token are never offered', () => {
  const env = buildEnvironment();
  for (let r = 2; r <= 12; r++) seedStudent(env, r, { 'Token': 'ENG-ABCDEFGH' + (20 + r), 'Approved Email': PARENT, 'Student Name': 'S' + r });
  assert.deepStrictEqual(getStudent(env, PARENT), { error: 'not_approved' }, '11 rows');
  assert.ok(env.state.logs.some(l => /more than 10 rows/.test(l)));
  const e2 = twinsEnv(); setCell(e2.dsheet, 3, 'Stream', 'Medical');
  assert.strictEqual(getStudent(e2, PARENT).data.name, 'Aarav Deshmukh', 'only one Engineering row left: opens at once');
  setCell(e2.dsheet, 3, 'Stream', 'Engineering'); setCell(e2.dsheet, 3, 'Token', '');
  assert.strictEqual(getStudent(e2, PARENT).data.name, 'Aarav Deshmukh', 'a row with no Token is not offered');
  const e3 = twinsEnv(); setCell(e3.dsheet, 3, 'Approved Email', TWIN2 + ', not-an-email');
  assert.strictEqual(getStudent(e3, TWIN2).success, true, 'one bad entry does not block the valid ones');
});

test('40 writes go to the signed-in student\'s row only, never another row', () => {
  const env = buildEnvironment(); seedStudent(env); seedStudent(env, 3, { 'Token': 'ENG-JKMNPQRS45', 'Approved Email': EMAIL2, 'Student Name': 'Other Student', 'Saved Shortlist': '', 'Document Status': '' });
  const list = { JOSAA: [{ institute: 'VJTI', branch: 'IT', seatType: 'AI' }] };
  assert.strictEqual(postJson(env, { action: 'saveShortlist', as: EMAIL2, colleges: list }).success, true);
  assert.deepStrictEqual(JSON.parse(env.dsheet.cell(3, 'Saved Shortlist')), list);
  assert.strictEqual(JSON.parse(env.dsheet.cell(2, 'Saved Shortlist')).JOSAA[0].institute, 'Demo Institute Alpha', 'row 2 untouched');
  assert.strictEqual(postJson(env, { action: 'saveShortlist', as: EMAIL2, token: TOK, colleges: { CAP: [] } }).success, true);
  assert.strictEqual(JSON.parse(env.dsheet.cell(2, 'Saved Shortlist')).JOSAA[0].institute, 'Demo Institute Alpha', 'a token in the body cannot redirect a write');
  return 'row chosen only by the verified email';
});

test('41 Google unreachable => server_error (fail closed); verified tokens are cached; removing the email takes effect at once', () => {
  const env = buildEnvironment(); seedStudent(env);
  const t = env.mintToken(EMAIL);
  const call = () => postJson(env, { action: 'getStudent', idToken: t });
  assert.strictEqual(call().success, true); assert.strictEqual(call().success, true);
  assert.strictEqual(env.state.google.fetches, 1, 'second call served from the short cache');
  setCell(env.dsheet, 2, 'Approved Email', '');
  assert.deepStrictEqual(call(), { error: 'not_approved' }, 'the sheet is read on every call, so un-approving is immediate');
  setCell(env.dsheet, 2, 'Approved Email', EMAIL);
  env.state.google.down = true;
  assert.deepStrictEqual(postJson(env, { action: 'getStudent', idToken: env.mintToken(EMAIL) }), { error: 'server_error' });
  env.state.google.down = false; env.state.cacheThrows = true;
  assert.strictEqual(postJson(env, { action: 'getStudent', idToken: env.mintToken(EMAIL) }).success, true, 'works without the cache');
  delete env.state.props.GOOGLE_CLIENT_ID;
  assert.deepStrictEqual(postJson(env, { action: 'getStudent', idToken: env.mintToken(EMAIL) }), { error: 'server_error' }, 'no client id configured => closed');
  return 'cache, fail-closed and instant un-approval verified';
});

test('42 missing "Approved Email" header: server_error, nothing served or written; verifyHeaders names it', () => {
  const env = buildEnvironment(); seedStudent(env);
  env.dsheet.rows[0][env.dashHeaders.indexOf('Approved Email')] = 'Email';
  assert.deepStrictEqual(getStudent(env, EMAIL), { error: 'server_error' });
  const r = env.ctx.verifyHeaders();
  assert.strictEqual(r.ok, false); assert.ok(r.problems.some(p => /"Approved Email"/.test(p)));
  return 'fails closed and names the header for staff';
});

test('43 errors never carry internal text: only short codes reach the browser', () => {
  const env = buildEnvironment(); seedStudent(env);
  const allowed = new Set(['auth_required', 'auth_invalid', 'not_approved', 'invalid_input', 'busy', 'server_error', 'invalid_action', 'locked', 'rate_limited', 'validation']);
  const tries = [{ action: 'getStudent' }, { action: 'getStudent', idToken: 'a.b.c' }, { action: 'saveDocStatus', as: EMAIL, data: '{{{' }, { action: 'saveShortlist', as: 'x@example.invalid', colleges: 1 },
    { action: 'getPreferenceList', as: EMAIL, counselling: 'XX' }, { action: 'saveProfile', as: EMAIL, profile: 5 }];
  tries.forEach(b => { const r = postJson(env, b); const code = r.error; assert.ok(!code || allowed.has(code), 'code ' + code); assert.ok(!/at |Error|\.gs|\.js|Exception/.test(JSON.stringify(r)), 'no stack-like text: ' + JSON.stringify(r)); });
  return 'only whitelisted short codes';
});

// ─────────────────────────────────────────────────────────────── 13. staff check inside the sheet
test('44 checkApprovedEmails: blank / invalid are problems; shared emails are listed for information; inside the "Email Check" tab only', () => {
  const env = buildEnvironment();
  seedStudent(env, 2, { 'Student Name': 'Good One' });
  seedStudent(env, 3, { 'Token': 'ENG-BBBBBBBBB2', 'Approved Email': '', 'Student Name': 'Blank One' });
  seedStudent(env, 4, { 'Token': 'ENG-CCCCCCCCC3', 'Approved Email': 'fine@example.invalid, no-at-sign', 'Student Name': 'Invalid One' });
  seedStudent(env, 5, { 'Token': 'ENG-DDDDDDDDD4', 'Approved Email': 'a1@example.invalid, ' + PARENT, 'Student Name': 'Twin A' });
  seedStudent(env, 6, { 'Token': 'ENG-EEEEEEEEE5', 'Approved Email': 'a2@example.invalid; ' + PARENT.toUpperCase(), 'Student Name': 'Twin B' });
  seedStudent(env, 7, { 'Token': 'ENG-FFFFFFFFF6', 'Approved Email': '', 'Student Name': 'Finished Student', 'Stage': 'Admitted' });
  seedStudent(env, 8, { 'Token': 'ENG-GGGGGGGGG7', 'Approved Email': '', 'Student Name': 'Medical Row', 'Stream': 'Medical' });
  const res = env.ctx.checkApprovedEmails();
  assert.deepStrictEqual({ c: res.checked, p: res.problems, s: res.shared }, { c: 5, p: 2, s: 2 });
  const text = JSON.stringify(env.dash.getSheetByName('Email Check').rows);
  ['Blank One', 'Invalid One', 'Twin A', 'Twin B', 'Good One'].forEach(n => assert.ok(text.includes(n) || n === 'Good One', n));
  assert.ok(/Blank/.test(text) && /Not a valid email/.test(text) && /Shared emails \(allowed/.test(text) && /Shares an email with rows: 6/.test(text) && /Shares an email with rows: 5/.test(text));
  assert.ok(!text.includes('Finished Student') && !text.includes('Medical Row'), 'inactive and other-stream rows are not listed');
  assert.ok(!text.includes(TOK) && !text.includes('9876543210') && !text.includes('@') , 'no token, phone or email copied into the tab');
  assert.strictEqual(env.state.mails.length, 0, 'nothing is emailed');
  assert.strictEqual(env.enq.getSheetByName('Online').writeLog.length, 0);
  return 'blank + invalid flagged; twins listed as shared (information)';
});

test('45 checkApprovedEmails: a clean sheet says so; running twice replaces the old list', () => {
  const env = buildEnvironment(); seedStudent(env);
  assert.strictEqual(env.ctx.checkApprovedEmails().problems, 0);
  assert.ok(JSON.stringify(env.dash.getSheetByName('Email Check').rows).includes('No problems found among 1 active students'));
  setCell(env.dsheet, 2, 'Approved Email', ''); env.ctx.checkApprovedEmails();
  setCell(env.dsheet, 2, 'Approved Email', EMAIL); env.ctx.checkApprovedEmails();
  assert.ok(!JSON.stringify(env.dash.getSheetByName('Email Check').rows).includes('Blank'));
  return 'idempotent';
});


// ─────────────────────────────────────────────────────────────── 14. staff sign-in (counsellor tools)
const STAFF = 'counsellor.test@example.invalid';
function staffEnv(emails = [STAFF]) {
  const env = buildEnvironment(); seedStudent(env);
  const st = env.dash.add(new MockSheet('Staff', ['Notes', 'Staff Email'], { maxRows: 50 }));
  emails.forEach((e, i) => { st._set(i + 2, 2, e); });
  return env;
}
const staffPost = (env, as, body) => postJson(env, Object.assign({ as }, body));

test('46 staff actions need a signed-in email on the Staff tab; a student (or stranger) is not_staff', () => {
  const env = staffEnv(['  ' + STAFF.toUpperCase()]);
  assert.deepStrictEqual(staffPost(env, STAFF, { action: 'staffCheck' }), { success: true });
  assert.deepStrictEqual(staffPost(env, EMAIL, { action: 'staffCheck' }), { error: 'not_staff' }, 'a student is not staff');
  assert.deepStrictEqual(staffPost(env, 'stranger@example.invalid', { action: 'staffGetStudent', token: TOK }), { error: 'not_staff' });
  assert.deepStrictEqual(postJson(env, { action: 'staffGetStudent', token: TOK }), { error: 'auth_required' }, 'a token alone is nothing');
  assert.deepStrictEqual(postJson(env, { action: 'staffGetStudent', token: TOK, idToken: 'a.b.c' }), { error: 'auth_invalid' });
  assert.deepStrictEqual(JSON.parse(env.ctx.doGet({ parameter: { action: 'staffGetStudent', token: TOK } }).getContent()), { error: 'invalid_action' });
  return 'only listed staff emails pass';
});

test('47 staff fail closed: no Staff tab, no header, repeated header, blank list', () => {
  const none = buildEnvironment(); seedStudent(none);
  assert.deepStrictEqual(staffPost(none, STAFF, { action: 'staffCheck' }), { error: 'not_staff' }, 'no Staff tab');
  const e1 = staffEnv(); e1.dash.getSheetByName('Staff').rows[0][1] = 'Email';
  assert.deepStrictEqual(staffPost(e1, STAFF, { action: 'staffCheck' }), { error: 'not_staff' }, 'wrong header');
  const e2 = staffEnv(); e2.dash.getSheetByName('Staff').rows[0][0] = 'Staff Email';
  assert.deepStrictEqual(staffPost(e2, STAFF, { action: 'staffCheck' }), { error: 'not_staff' }, 'header twice => ambiguous');
  const e3 = staffEnv([]);
  assert.deepStrictEqual(staffPost(e3, STAFF, { action: 'staffCheck' }), { error: 'not_staff' }, 'empty list');
  const e4 = staffEnv(); e4.dash.getSheetByName('Staff').rows[1][1] = '';
  assert.deepStrictEqual(staffPost(e4, STAFF, { action: 'staffCheck' }), { error: 'not_staff' }, 'removing the email takes effect at once');
});

test('48 staffGetStudent: by internal Token, same safe fields as the student view; unknown / bad / Medical => not_found', () => {
  const env = staffEnv();
  const r = staffPost(env, STAFF, { action: 'staffGetStudent', token: TOK });
  assert.strictEqual(r.success, true); assert.deepStrictEqual(Object.keys(r.data).sort(), ALLOWED_KEYS);
  ['9876543210', '9123456780', 'secret-admin-note', EMAIL, 'Student Phone'].forEach(x => assert.ok(!JSON.stringify(r).includes(x), 'must not leak ' + x));
  for (const bad of ['', undefined, null, 'x', 'ENG-SHORT', 'ENG-JKMNPQRS45', "ENG-ABCDEFGH23'", 123]) assert.deepStrictEqual(staffPost(env, STAFF, { action: 'staffGetStudent', token: bad }), { error: 'not_found' }, 'token ' + String(bad));
  setCell(env.dsheet, 2, 'Stream', 'Medical');
  assert.deepStrictEqual(staffPost(env, STAFF, { action: 'staffGetStudent', token: TOK }), { error: 'not_found' }, 'a Medical row is not served by this script');
});

test('49 staffSaveShortlist: validated, merged by group (student\'s other groups kept), text cell, only that row; bad input writes nothing', () => {
  const env = staffEnv(); seedStudent(env, 3, { 'Token': 'ENG-JKMNPQRS45', 'Approved Email': EMAIL2, 'Student Name': 'Other' });
  const before3 = JSON.stringify(env.dsheet.rows[2]);
  const mine = { COUNSELLOR: [{ id: 'a', institute: 'IIT Bombay', branch: 'CSE', name: '=HYPERLINK("http://x.invalid","y")' }] };
  assert.deepStrictEqual(staffPost(env, STAFF, { action: 'staffSaveShortlist', token: TOK, colleges: mine }), { success: true, count: 2 });
  const saved = JSON.parse(env.dsheet.cell(2, 'Saved Shortlist'));
  assert.deepStrictEqual(saved.COUNSELLOR, mine.COUNSELLOR); assert.strictEqual(saved.JOSAA[0].institute, 'Demo Institute Alpha', 'the student\'s own group is kept');
  assert.strictEqual(env.dsheet.formats['2,' + (env.dashHeaders.indexOf('Saved Shortlist') + 1)], '@');
  assert.strictEqual(JSON.stringify(env.dsheet.rows[2]), before3, 'no other row touched');
  assert.strictEqual(staffPost(env, STAFF, { action: 'staffSaveShortlist', token: TOK, colleges: { JOSAA: [] } }).success, true, 'a sent group replaces that group');
  assert.deepStrictEqual(JSON.parse(env.dsheet.cell(2, 'Saved Shortlist')).JOSAA, []);
  const snap = snapshot(env);
  const bad = [[], 'x', null, { A: 'x' }, { A: [1] }, { 'bad key!': [] }, { A: new Array(301).fill({ a: 1 }) }, { A: [{ a: 'x'.repeat(2100) }] }, Object.fromEntries(Array.from({ length: 11 }, (_, i) => ['G' + i, []]))];
  bad.forEach((b, i) => assert.deepStrictEqual(staffPost(env, STAFF, { action: 'staffSaveShortlist', token: TOK, colleges: b }), { error: 'invalid_input' }, 'bad #' + i));
  assert.deepStrictEqual(staffPost(env, STAFF, { action: 'staffSaveShortlist', token: 'ENG-JKMNPQRS99', colleges: mine }), { error: 'not_found' });
  assert.strictEqual(snapshot(env), snap, 'rejected requests changed nothing');
  env.state.lockBusy = true;
  assert.deepStrictEqual(staffPost(env, STAFF, { action: 'staffSaveShortlist', token: TOK, colleges: mine }), { error: 'busy' });
  env.state.lockBusy = false;
  // a merge that would exceed the limits is refused rather than truncated
  setCell(env.dsheet, 2, 'Saved Shortlist', JSON.stringify({ JOSAA: new Array(250).fill({ a: 1 }) }));
  assert.deepStrictEqual(staffPost(env, STAFF, { action: 'staffSaveShortlist', token: TOK, colleges: { CAP: new Array(100).fill({ a: 1 }) } }), { error: 'invalid_input' });
});

test('50 staff and students stay separate: a staff email is not a student; a student cannot read others; errors are short codes', () => {
  const env = staffEnv();
  assert.deepStrictEqual(getStudent(env, STAFF), { error: 'not_approved' }, 'staff email on the Staff tab does not open a student row');
  assert.deepStrictEqual(postJson(env, { action: 'getStudent', as: EMAIL, token: 'ENG-JKMNPQRS45' }).data.name, 'Aarav Deshmukh', 'a student always gets their OWN row');
  const ok = new Set(['auth_required', 'auth_invalid', 'not_staff', 'not_found', 'invalid_input', 'busy', 'server_error', 'invalid_action']);
  [{ action: 'staffGetStudent' }, { action: 'staffGetStudent', idToken: 'a.b.c' }, { action: 'staffSaveShortlist', as: STAFF, token: TOK, colleges: 1 }, { action: 'staffGetStudent', as: STAFF, token: { a: 1 } }].forEach(b => {
    const r = postJson(env, b); assert.ok(!r.error || ok.has(r.error), 'code ' + r.error); assert.ok(!/at |Error|\.gs|Exception/.test(JSON.stringify(r)));
  });
  env.dsheet.rows[0][env.dashHeaders.indexOf('Saved Shortlist')] = 'x';
  assert.deepStrictEqual(staffPost(env, STAFF, { action: 'staffGetStudent', token: TOK }), { error: 'server_error' }, 'missing header: closed, no details');
  assert.ok(!env.state.logs.some(l => l.includes(STAFF) || l.includes(EMAIL)), 'no emails in logs');
});

// ─────────────────────────────────────────────────────────────── runner
let pass = 0, fail = 0;
const lines = [];
for (const t of tests) {
  try {
    const note = t.fn();
    pass++; lines.push(`PASS  ${t.name}${note ? '\n        -> ' + note : ''}`);
  } catch (e) {
    fail++; lines.push(`FAIL  ${t.name}\n        -> ${e.message.split('\n')[0]}`);
    if (process.env.VERBOSE) lines.push(e.stack);
  }
}
console.log('MOCK TEST RESULTS (in-memory fake of Google services; not real Sheets/Gmail)\n');
console.log(lines.join('\n'));
console.log(`\n${pass} passed, ${fail} failed, ${tests.length} total`);
process.exit(fail ? 1 : 0);
