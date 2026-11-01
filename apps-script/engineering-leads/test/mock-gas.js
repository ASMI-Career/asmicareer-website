/**
 * MOCK Google Apps Script environment (Node). NOT Google. Everything here is an in-memory stand-in:
 * spreadsheets, Script Properties, LockService, MailApp, Logger. It lets the REAL script file run unchanged
 * inside a vm context. Results from it are "mock" results, not proof of behaviour on real Google Sheets.
 */
'use strict';
const vm = require('vm');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCRIPT_PATH = path.join(__dirname, '..', 'engineering-leads.js');

class MockRange {
  constructor(sheet, r, c, nr, nc) { Object.assign(this, { sheet, r, c, nr, nc }); }
  _check() {
    if (this.r < 1 || this.c < 1) throw new Error('Mock: range starts before A1');
    if (this.r + this.nr - 1 > this.sheet.maxRows) throw new Error('Mock: range exceeds sheet rows (' + this.sheet.name + ')');
    if (this.c + this.nc - 1 > this.sheet.maxCols) throw new Error('Mock: range exceeds sheet columns (' + this.sheet.name + ')');
  }
  getValues() {
    this._check();
    const out = [];
    for (let i = 0; i < this.nr; i++) { const row = []; for (let j = 0; j < this.nc; j++) row.push(this.sheet._get(this.r + i, this.c + j)); out.push(row); }
    return out;
  }
  setValues(vals) {
    this._check();
    if (vals.length !== this.nr || vals.some(r => r.length !== this.nc)) throw new Error('Mock: setValues dimension mismatch');
    if (this.sheet.failOnSetValues > 0) { this.sheet.failOnSetValues--; throw new Error('Mock: simulated write failure on ' + this.sheet.name); }
    for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) {
      this.sheet._set(this.r + i, this.c + j, vals[i][j]);
      this.sheet.writeLog.push({ r: this.r + i, c: this.c + j, v: vals[i][j] });
    }
    return this;
  }
  setNumberFormats(f) {
    this._check();
    for (let i = 0; i < this.nr; i++) for (let j = 0; j < this.nc; j++) this.sheet.formats[(this.r + i) + ',' + (this.c + j)] = f[i][j];
    return this;
  }
}

class MockSheet {
  constructor(name, headers, opts = {}) {
    this.name = name;
    this.rows = [headers.slice()];
    this.maxRows = opts.maxRows || 2000;
    this.maxCols = Math.max(opts.maxCols || 0, headers.length);
    this.formats = {};
    this.writeLog = [];
    this.failOnSetValues = 0;
    this.insertedRows = 0;
  }
  _get(r, c) { const row = this.rows[r - 1]; const v = row && row[c - 1]; return v === undefined || v === null ? '' : v; }
  _set(r, c, v) { while (this.rows.length < r) this.rows.push([]); const row = this.rows[r - 1]; while (row.length < c) row.push(''); row[c - 1] = v; }
  getLastRow() { for (let i = this.rows.length; i >= 1; i--) if (this.rows[i - 1].some(v => String(v) !== '')) return i; return 0; }
  getLastColumn() { let m = 0; this.rows.forEach(r => r.forEach((v, i) => { if (String(v) !== '') m = Math.max(m, i + 1); })); return m; }
  getMaxRows() { return this.maxRows; }
  getMaxColumns() { return this.maxCols; }
  insertRowsAfter(after, n) { this.maxRows += n; this.insertedRows += n; }
  insertColumnsAfter(after, n) { this.maxCols += n; }
  getRange(r, c, nr = 1, nc = 1) { return new MockRange(this, r, c, nr, nc); }
  /** helper for tests: row as {header: value} */
  obj(r) { const h = this.rows[0]; const o = {}; h.forEach((name, i) => { o[name] = this._get(r, i + 1); }); return o; }
  /** helper for tests: cell by header */
  cell(r, header) { return this._get(r, this.rows[0].indexOf(header) + 1); }
}

class MockSpreadsheet {
  constructor(id) { this.id = id; this.sheets = {}; }
  add(sheet) { this.sheets[sheet.name] = sheet; return sheet; }
  getSheetByName(n) { return this.sheets[n] || null; }
}

function buildEnvironment(options = {}) {
  const code = fs.readFileSync(SCRIPT_PATH, 'utf8');
  const state = {
    logs: [], mails: [], props: {}, lockAcquired: 0, lockReleased: 0, lockHeld: false, lockBusy: false,
    mailThrows: false, mailQuota: 100, spreadsheets: {}, clock: options.now ? new Date(options.now) : new Date('2026-11-01T10:00:00Z')
  };

  const ctx = vm.createContext({
    Logger: { log: m => state.logs.push(String(m)) },
    Utilities: { getUuid: () => crypto.randomUUID() },
    ContentService: {
      MimeType: { JSON: 'JSON', TEXT: 'TEXT' },
      createTextOutput: s => ({ _s: s, setMimeType() { return this; }, getContent() { return this._s; } })
    },
    MailApp: {
      sendEmail: m => { if (state.mailThrows) throw new Error('Mock: mail service unavailable'); state.mails.push(m); },
      getRemainingDailyQuota: () => state.mailQuota
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => { if (state.lockBusy || state.lockHeld) return false; state.lockHeld = true; state.lockAcquired++; return true; },
        releaseLock: () => { state.lockHeld = false; state.lockReleased++; }
      })
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: k => (k in state.props ? state.props[k] : null),
        setProperty: (k, v) => { state.props[k] = String(v); },
        deleteProperty: k => { delete state.props[k]; },
        getProperties: () => Object.assign({}, state.props)
      })
    },
    SpreadsheetApp: {
      openById: id => { if (!state.spreadsheets[id]) throw new Error('Mock: no access to spreadsheet'); return state.spreadsheets[id]; }
    },
    console
  });
  vm.runInContext(code, ctx, { filename: 'engineering-leads.js' });
  ctx.now_ = () => new Date(state.clock.getTime());     // controllable clock

  const get = name => vm.runInContext(name, ctx);       // read a script-level constant
  const ENQ = get('ENQUIRY_HEADERS'), DASH = get('DASHBOARD_HEADERS');
  const ENQ_ID = options.enqId || 'MOCK-ENQUIRY-COPY-ID', DASH_ID = options.dashId || 'MOCK-DASHBOARD-COPY-ID';

  // Enquiry tabs: real header names + extra columns the script must never touch. Order is intentionally NOT the config order.
  const enqHeaders = ['Dashboard Link', 'Counsellor Notes'].concat(Object.values(ENQ).slice().reverse()).concat(['Remark']);
  const enq = new MockSpreadsheet(ENQ_ID);
  get('ENQUIRY_TABS').forEach(tab => {
    const sh = enq.add(new MockSheet(tab, enqHeaders, options.sheetOpts));
    // formulas pre-filled far below the data, as many real sheets have (getLastRow counts them)
    const linkCol = enqHeaders.indexOf('Dashboard Link') + 1;
    for (let r = 2; r <= 60; r++) sh._set(r, linkCol, '=HYPERLINK("https://example.invalid/" & ROW(),"link")');
  });
  const allLeads = enq.add(new MockSheet('All Leads', ['Timestamp', 'Token', 'Full Name']));
  allLeads._set(2, 1, '=QUERY({Online!A:C;Andheri!A:C},"select *")');   // formula tab: must never be written
  allLeads.writeLog.length = 0;

  const dashHeaders = ['Counsellor Name', 'Stage'].concat(Object.values(DASH)).concat(['Document Status']);
  const dash = new MockSpreadsheet(DASH_ID);
  const dsheet = dash.add(new MockSheet('Student Dashboard', dashHeaders, options.sheetOpts));

  state.spreadsheets[ENQ_ID] = enq;
  state.spreadsheets[DASH_ID] = dash;
  if (options.configure !== false) {
    state.props.ENQUIRY_SPREADSHEET_ID = ENQ_ID;
    state.props.DASHBOARD_SPREADSHEET_ID = DASH_ID;
    state.props.LEAD_ALERT_EMAIL = 'alerts@example.invalid';
  }

  const submit = params => JSON.parse(ctx.doPost({ parameter: params }).getContent());
  return { ctx, state, enq, dash, dsheet, ENQ, DASH, get, submit, ENQ_ID, DASH_ID, enqHeaders, dashHeaders };
}

/** All data rows (row 2+) of a tab that carry a Token or Full Name, ignoring formula-only rows. */
function leadRows(sheet, tokenHeader = 'Token', nameHeader = 'Full Name') {
  const out = [];
  for (let r = 2; r <= sheet.rows.length; r++) {
    if (String(sheet.cell(r, tokenHeader)) !== '' || String(sheet.cell(r, nameHeader)) !== '') out.push(r);
  }
  return out;
}

module.exports = { buildEnvironment, MockSheet, MockSpreadsheet, leadRows };
