/**
 * ASMI Career — ENGINEERING lead flow (Google Apps Script, V8 runtime)
 *
 * Standalone project. It does NOT import, replace or modify the Medical scripts
 * (google-apps-script.js / google-apps-script-inquiry.js).
 *
 * What it does on each form submission (doPost):
 *   validate -> route to a branch tab in the ENQUIRY workbook -> write the lead row
 *   -> create a row in the DASHBOARD workbook ("Student Dashboard") -> email one alert.
 *
 * Rules that matter:
 *   - Every column is found by HEADER NAME. Column numbers appear nowhere in this file.
 *   - Only the cells we have a value for are written, so formula / unknown columns are untouched.
 *   - "All Leads" (a formula tab) is never written; see NEVER_WRITE_TABS.
 *   - A failure never silently drops a lead: it is written, or parked in Script Properties
 *     (PENDING_LEAD_*) and replayed by replayPendingLeads().
 *
 * Script Properties (Project Settings -> Script properties). IDs live ONLY here:
 *   ENQUIRY_SPREADSHEET_ID    required
 *   DASHBOARD_SPREADSHEET_ID  required
 *   LEAD_ALERT_EMAIL          optional; empty = no emails. Comma-separate for several.
 *   ERROR_ALERT_EMAIL         optional; setup/header errors. Falls back to LEAD_ALERT_EMAIL.
 *   DASHBOARD_BASE_URL        optional; default https://asmicareer.in/student
 *   SEMINAR_ALERTS            optional; 'true' = email for Seminar walk-ins (default: no email)
 *   REQUIRE_CONSENT           optional; default 'true'. Set 'false' to stop requiring Consent.
 *   ENVIRONMENT               optional; 'copy' prefixes email subjects with [TEST].
 *   ALLOW_SMOKE_TEST          optional; 'true' lets runSmokeTest() write a synthetic lead.
 */

// ════════════════════════════════════════════════════════════════
//  CONFIG — header NAMES (matched case/space-insensitively, must match exactly otherwise)
//  If your sheet says something different, change the VALUE on the right, nothing else.
// ════════════════════════════════════════════════════════════════

var SCRIPT_VERSION = '1.1.0';

var ENQUIRY_TABS     = ['Online', 'Andheri', 'Thane', 'Pune', 'Sangli', 'Kolhapur', 'Sambhajinagar', 'Seminar'];
var NEVER_WRITE_TABS = ['All Leads'];            // formula tab: refused even if routing ever pointed at it
var DASHBOARD_TAB    = 'Student Dashboard';
var HEADER_ROW       = 1;

var ENQUIRY_HEADERS = {
  timestamp:      'Timestamp',
  token:          'Token',
  fullName:       'Full Name',
  studentContact: 'Student Contact',
  fatherContact:  'Father Contact',
  motherContact:  'Mother Contact',
  coaching:       'Coaching Class',
  city:           'City',
  category:       'Category',
  courses:        'Courses',
  budget:         'Budget',
  nearestBranch:  'Nearest Branch',
  percentile:     'Entrance Percentile',
  scoreExam:      'Score Exam',
  jeeMainRank:    'JEE Main Rank (CRL)',
  jeeAdvRank:     'JEE Advanced Rank',
  examsAppearing: 'Exams Appearing',
  homeState:      'Home State',
  classStatus:    'Class Status',
  source:         'Source',
  utmSource:      'utm_source',
  utmMedium:      'utm_medium',
  utmCampaign:    'utm_campaign',
  gclid:          'gclid',
  plan:           'Plan',
  consent:        'Consent',
  duplicateFlag:  'Duplicate Flag'
};

var DASHBOARD_HEADERS = {
  token:        'Token',
  dateAdded:    'Date Added',
  name:         'Name',
  score:        'Score',
  stream:       'Stream',
  plan:         'Plan',
  dashboardUrl: 'Dashboard URL',
  inquiryToken: 'Inquiry Token'
  // Deliberately no phone / contact columns. Never add them here.
};

// Form field names the website sends (first non-empty name wins). Header-style names are primary;
// camelCase aliases are accepted for the fields that existed on the old form.
var PARAM_NAMES = {
  fullName:       ['Full Name', 'fullName'],
  studentContact: ['Student Contact', 'studentContact'],
  fatherContact:  ['Father Contact', 'fatherContact'],
  motherContact:  ['Mother Contact', 'motherContact'],
  coaching:       ['Coaching Class', 'coachingClass'],
  city:           ['City', 'city'],
  category:       ['Category', 'category'],
  courses:        ['Courses', 'courses'],
  budget:         ['Budget', 'budget'],
  nearestBranch:  ['Nearest Branch', 'nearestBranch'],
  percentile:     ['Entrance Percentile'],
  scoreExam:      ['Score Exam'],
  jeeMainRank:    ['JEE Main Rank (CRL)'],
  jeeAdvRank:     ['JEE Advanced Rank'],
  examsAppearing: ['Exams Appearing'],
  homeState:      ['Home State'],
  classStatus:    ['Class Status'],
  source:         ['Source', 'source'],
  utmSource:      ['utm_source'],
  utmMedium:      ['utm_medium'],
  utmCampaign:    ['utm_campaign'],
  gclid:          ['gclid'],
  plan:           ['Plan'],
  consent:        ['Consent'],
  honeypot:       ['website_url']              // hidden field; humans leave it empty, bots fill it
};

var SCORE_EXAMS   = ['JEE Main', 'MHT-CET', 'Other State CET'];
var ALLOWED_PLANS = ['Explore'];               // the client can never self-upgrade; paid tiers are set by staff in the sheet
var DEFAULT_PLAN  = 'Explore';
var STREAM_VALUE  = 'Engineering';

// Nearest-branch text -> tab. Matched on lowercase letters only, first hit wins. Unknown -> Online.
var BRANCH_ALIASES = [
  ['andheri', 'Andheri'], ['mumbai', 'Andheri'],
  ['thane', 'Thane'],
  ['pune', 'Pune'],
  ['sangli', 'Sangli'],
  ['kolhapur', 'Kolhapur'],
  ['sambhajinagar', 'Sambhajinagar'], ['sambhaji', 'Sambhajinagar'], ['aurangabad', 'Sambhajinagar']
];

// Columns the student DASHBOARD PAGE reads and writes (same "Student Dashboard" tab). Kept separate from DASHBOARD_HEADERS so the
// lead flow keeps working even if these columns have not been added yet. Assumed names: change the VALUE if your sheet differs.
var STUDENT_HEADERS = {
  token:              'Token',
  stream:             'Stream',
  name:               'Name',
  score:              'Score',
  category:           'Category',
  stage:              'Stage',
  tracks:             'Tracks',
  counsellorName:     'Counsellor Name',
  counsellorWhatsapp: 'Counsellor WhatsApp',
  whatsappGroupLink:  'WhatsApp Group Link',
  savedShortlist:     'Saved Shortlist',
  documentStatus:     'Document Status'
};
var DASH_ACTIONS = { getStudent: true, saveShortlist: true, saveDocStatus: true };
var SHORTLIST_MAX_CHARS = 40000, SHORTLIST_MAX_ITEMS = 300, SHORTLIST_MAX_GROUPS = 10, SHORTLIST_ITEM_MAX_CHARS = 2000, DOC_MAX_IDS = 500;

var TOKEN_PREFIX   = 'ENG-';
var TOKEN_LENGTH   = 10;
var TOKEN_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // 31 chars; no I, L, O, 0, 1 (easy to read aloud)
var TOKEN_REGEX    = /^ENG-[A-HJKMNP-Z2-9]{10}$/;

var DUP_WINDOW_MS  = 24 * 60 * 60 * 1000;
var DUP_SCAN_ROWS  = 1500;                      // newest rows scanned per tab
var LOCK_WAIT_MS   = 20000;
var MAX_PENDING    = 100;
var PENDING_PREFIX = 'PENDING_LEAD_';
var ERROR_MAIL_THROTTLE_MS = 30 * 60 * 1000;

var TEXT_FORMAT = '@', GENERAL_FORMAT = 'General', DATE_FORMAT = 'yyyy-mm-dd hh:mm:ss';


// ════════════════════════════════════════════════════════════════
//  WEB APP ENTRY POINTS
// ════════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    // The student dashboard saves with a JSON body ({ action: 'saveShortlist', token, colleges }); the lead form posts form fields.
    var body = parseJsonBody_(e);
    if (body && body.action) {
      if (!DASH_ACTIONS[body.action]) return json_({ error: 'invalid_action' });
      return json_(dashboardAction_(body.action, body.token, body));
    }
    return json_(handleSubmission_((e && e.parameter) || {}));
  } catch (err) {
    log_('doPost crashed before the lead could be handled: ' + describeError_(err));
    notifyError_('doPost crash', describeError_(err));
    return json_({ ok: false, error: 'server_error', message: 'Something went wrong. Please try again or call our helpline.' });
  }
}

/**
 * GET ?action=getStudent&token=...            -> the student's dashboard data
 * GET ?action=saveDocStatus&token=...&data=.. -> saves the document checklist (same call the Medical dashboard makes)
 * GET with no action                          -> health check only. Exposes nothing about sheets or configuration.
 * (saveShortlist is POST only.)
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action) {
    if (p.action === 'getStudent' || p.action === 'saveDocStatus') return json_(dashboardAction_(p.action, p.token, { data: p.data }));
    return json_({ error: 'invalid_action' });
  }
  return json_({ ok: true, service: 'asmi-engineering-leads', version: SCRIPT_VERSION });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}


// ════════════════════════════════════════════════════════════════
//  MAIN FLOW
// ════════════════════════════════════════════════════════════════

function handleSubmission_(params) {
  var p = readParams_(params);

  if (p.honeypot) {                              // bot: pretend success, store nothing
    log_('Honeypot hit; submission dropped.');
    return { ok: true };
  }

  var v = validateSubmission_(p);
  if (!v.ok) {
    log_('Validation rejected a submission: ' + v.errors.map(function (x) { return x.field; }).join(', '));
    return { ok: false, errors: v.errors };
  }
  var lead = v.lead;

  var lock = LockService.getScriptLock();
  var locked = false;
  try { locked = lock.tryLock(LOCK_WAIT_MS); } catch (lockErr) { log_('Lock error: ' + describeError_(lockErr)); }
  if (!locked) {
    return parkLead_(lead, 'Could not get the script lock within ' + LOCK_WAIT_MS + ' ms');
  }

  var result;
  try {
    result = writeLead_(lead);
  } catch (err) {
    // Header problems, missing properties, no access to a workbook, quota errors...
    log_('Write failed, parking the lead: ' + describeError_(err));
    notifyError_(err && err.name === 'HeaderError' ? 'Missing/ambiguous sheet header' : 'Lead write failed', describeError_(err));
    return parkLead_(lead, describeError_(err));
  } finally {
    lock.releaseLock();
  }

  // Everything below runs AFTER the lead is safely in the sheet; none of it can lose the lead.
  var mail = { sent: false };
  try { mail = sendLeadAlert_(lead, result); } catch (mailErr) { log_('Alert email failed: ' + describeError_(mailErr)); }
  try { sendWhatsAppAlert_(lead, result); } catch (waErr) { log_('WhatsApp hook failed: ' + describeError_(waErr)); }

  return { ok: true, token: result.token, duplicate: result.duplicate };
}

/** Runs inside the lock. Throws if nothing could be written (caller then parks the lead). */
function writeLead_(lead) {
  var cfg = getConfig_();
  var enqSS  = SpreadsheetApp.openById(cfg.enquiryId);
  var dashSS = SpreadsheetApp.openById(cfg.dashboardId);
  var warnings = [];

  var route = routeTab_(lead);
  if (NEVER_WRITE_TABS.indexOf(route.tab) !== -1) throw new Error('Refusing to write to formula tab: ' + route.tab);
  if (ENQUIRY_TABS.indexOf(route.tab) === -1) throw new Error('Routing produced an unknown tab: ' + route.tab);

  var enqSheet = enqSS.getSheetByName(route.tab);
  if (!enqSheet) throw new Error('Enquiry tab not found: ' + route.tab);
  var dashSheet = dashSS.getSheetByName(DASHBOARD_TAB);
  if (!dashSheet) throw new Error('Dashboard tab not found: ' + DASHBOARD_TAB);

  // Resolve BOTH sets of headers before writing anything, so a bad dashboard header cannot leave a half-written lead.
  var enqCols  = resolveHeaders_(enqSheet, ENQUIRY_HEADERS, 'Enquiry/' + route.tab);
  var dashCols = resolveHeaders_(dashSheet, DASHBOARD_HEADERS, 'Dashboard/' + DASHBOARD_TAB);

  // A replayed lead keeps the time it was actually submitted.
  var nowDate = lead.submittedAt ? new Date(lead.submittedAt) : now_();
  var dup = findRecentDuplicate_(enqSS, lead.studentContactCanonical, nowDate.getTime(), warnings);

  var reuseToken = !!(dup && dup.token && TOKEN_REGEX.test(dup.token));
  var token = reuseToken ? dup.token : generateUniqueToken_(enqSS, dashSS, warnings);

  var flag = '';
  if (dup) {
    flag = 'DUPLICATE (same phone within 24h) of ' + (dup.token || 'row without token') + ' in ' + dup.tab + ' row ' + dup.row;
  }

  // ── 1. Enquiry row ──
  var enqValues = {
    timestamp: nowDate, token: token,
    fullName: lead.fullName, studentContact: lead.studentContact,
    fatherContact: lead.fatherContact, motherContact: lead.motherContact,
    coaching: lead.coaching, city: lead.city, category: lead.category,
    courses: lead.courses, budget: lead.budget, nearestBranch: lead.nearestBranch,
    percentile: lead.percentile === null ? '' : lead.percentile,
    scoreExam: lead.scoreExam,
    jeeMainRank: lead.jeeMainRank === null ? '' : lead.jeeMainRank,
    jeeAdvRank: lead.jeeAdvRank === null ? '' : lead.jeeAdvRank,
    examsAppearing: lead.examsAppearing, homeState: lead.homeState, classStatus: lead.classStatus,
    source: lead.source, utmSource: lead.utmSource, utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign, gclid: lead.gclid,
    plan: lead.plan, consent: lead.consent, duplicateFlag: flag
  };
  var enqFormats = {
    timestamp: DATE_FORMAT, percentile: GENERAL_FORMAT, jeeMainRank: GENERAL_FORMAT, jeeAdvRank: GENERAL_FORMAT
  };
  var enqRow = lastDataRow_(enqSheet, [enqCols.timestamp, enqCols.token, enqCols.fullName]) + 1;
  writeRowByHeaders_(enqSheet, enqRow, enqCols, enqValues, enqFormats);

  // ── 2. Dashboard row (skipped when this submission is a duplicate of an existing ENG- lead) ──
  var dashboardOk = true, dashboardRow = null;
  if (!reuseToken) {
    try {
      dashboardRow = createDashboardRow_(dashSheet, dashCols, cfg, token, lead, nowDate);
    } catch (dashErr) {
      dashboardOk = false;
      log_('Dashboard row FAILED for ' + token + ' (enquiry row is saved): ' + describeError_(dashErr));
      notifyError_('Dashboard row failed for ' + token, describeError_(dashErr) + '\nRun repairMissingDashboardRows() once fixed.');
    }
  }

  return {
    token: token, tab: route.tab, routeReason: route.reason, enquiryRow: enqRow,
    duplicate: !!dup, duplicateInfo: dup, dashboardOk: dashboardOk, dashboardRow: dashboardRow,
    warnings: warnings
  };
}

function createDashboardRow_(dashSheet, dashCols, cfg, token, lead, nowDate) {
  var values = {
    token: token, dateAdded: nowDate, name: lead.fullName,
    score: lead.percentile === null ? '' : lead.percentile,       // Score = percentile
    stream: STREAM_VALUE, plan: DEFAULT_PLAN,
    dashboardUrl: cfg.dashboardBaseUrl + '?token=' + encodeURIComponent(token),
    inquiryToken: token
  };
  var formats = { dateAdded: DATE_FORMAT, score: GENERAL_FORMAT };
  var row = lastDataRow_(dashSheet, [dashCols.token, dashCols.name, dashCols.dateAdded]) + 1;
  writeRowByHeaders_(dashSheet, row, dashCols, values, formats);
  return row;
}


// ════════════════════════════════════════════════════════════════
//  CONFIG / PROPERTIES
// ════════════════════════════════════════════════════════════════

function prop_(name) {
  var v = PropertiesService.getScriptProperties().getProperty(name);
  return v === null || v === undefined ? '' : String(v).trim();
}

function getConfig_() {
  var enq = prop_('ENQUIRY_SPREADSHEET_ID'), dash = prop_('DASHBOARD_SPREADSHEET_ID');
  var missing = [];
  if (!enq) missing.push('ENQUIRY_SPREADSHEET_ID');
  if (!dash) missing.push('DASHBOARD_SPREADSHEET_ID');
  if (missing.length) {
    var err = new Error('Script Properties missing: ' + missing.join(', '));
    err.name = 'ConfigError';
    throw err;
  }
  return {
    enquiryId: enq, dashboardId: dash,
    dashboardBaseUrl: (prop_('DASHBOARD_BASE_URL') || 'https://asmicareer.in/student').replace(/\?+$/, ''),
    requireConsent: prop_('REQUIRE_CONSENT').toLowerCase() !== 'false'
  };
}


// ════════════════════════════════════════════════════════════════
//  HEADERS — find columns by name, fail loudly
// ════════════════════════════════════════════════════════════════

function normHeader_(s) { return String(s === null || s === undefined ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase(); }

/**
 * Returns { key: 1-based column number }. Throws HeaderError (listing every problem) if any
 * header is missing or appears more than once. `spec` is { key: 'Header Name' }.
 */
function resolveHeaders_(sheet, spec, label) {
  var lastCol = sheet.getLastColumn();
  var row = lastCol > 0 ? sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0] : [];
  var index = {};
  for (var i = 0; i < row.length; i++) {
    var n = normHeader_(row[i]);
    if (n === '') continue;
    (index[n] = index[n] || []).push(i + 1);
  }
  var cols = {}, missing = [], ambiguous = [];
  Object.keys(spec).forEach(function (key) {
    var hits = index[normHeader_(spec[key])] || [];
    if (hits.length === 0) missing.push('"' + spec[key] + '"');
    else if (hits.length > 1) ambiguous.push('"' + spec[key] + '" (appears ' + hits.length + ' times)');
    else cols[key] = hits[0];
  });
  if (missing.length || ambiguous.length) {
    var msg = 'Header problem in ' + label + '.' +
      (missing.length ? ' MISSING: ' + missing.join(', ') + '.' : '') +
      (ambiguous.length ? ' AMBIGUOUS: ' + ambiguous.join(', ') + '.' : '');
    var err = new Error(msg);
    err.name = 'HeaderError';
    throw err;
  }
  return cols;
}

/**
 * Run this from the editor after changing Script Properties or headers.
 * Checks every Enquiry tab + the Dashboard tab. Logs the result and emails on failure.
 * Never writes to either workbook.
 */
function verifyHeaders() {
  var cfg = getConfig_();
  var enqSS = SpreadsheetApp.openById(cfg.enquiryId);
  var dashSS = SpreadsheetApp.openById(cfg.dashboardId);
  var problems = [];

  ENQUIRY_TABS.forEach(function (tab) {
    var sh = enqSS.getSheetByName(tab);
    if (!sh) { problems.push('Enquiry tab not found: ' + tab); return; }
    try { resolveHeaders_(sh, ENQUIRY_HEADERS, 'Enquiry/' + tab); } catch (e) { problems.push(e.message); }
  });
  var dsh = dashSS.getSheetByName(DASHBOARD_TAB);
  if (!dsh) problems.push('Dashboard tab not found: ' + DASHBOARD_TAB);
  else {
    try { resolveHeaders_(dsh, DASHBOARD_HEADERS, 'Dashboard/' + DASHBOARD_TAB); } catch (e) { problems.push(e.message); }
    try { resolveHeaders_(dsh, STUDENT_HEADERS, 'Student dashboard page/' + DASHBOARD_TAB); } catch (e) { problems.push(e.message); }
  }

  NEVER_WRITE_TABS.forEach(function (t) {
    if (!enqSS.getSheetByName(t)) log_('Note: formula tab "' + t + '" not found (fine; we never write it).');
  });

  if (problems.length) {
    var text = problems.join('\n');
    log_('verifyHeaders FAILED:\n' + text);
    notifyError_('verifyHeaders failed', text, true);
    return { ok: false, problems: problems };
  }
  log_('verifyHeaders OK: all ' + ENQUIRY_TABS.length + ' enquiry tabs + dashboard tab have every required header.');
  return { ok: true, problems: [] };
}


// ════════════════════════════════════════════════════════════════
//  STUDENT DASHBOARD ACTIONS  (getStudent / saveShortlist / saveDocStatus)
//  For the Engineering Dashboard workbook, "Student Dashboard" tab. Columns by header name (STUDENT_HEADERS).
// ════════════════════════════════════════════════════════════════

function parseJsonBody_(e) {
  try {
    var c = e && e.postData && e.postData.contents;
    if (typeof c === 'string' && /^\s*\{/.test(c)) { var o = JSON.parse(c); return (o && typeof o === 'object') ? o : null; }
  } catch (err) { /* not JSON: it is a normal form post */ }
  return null;
}

/** Always returns a plain object, never throws. Error codes: not_found, invalid_input, busy, server_error. */
function dashboardAction_(action, token, payload) {
  try {
    var tok = String(token === undefined || token === null ? '' : token).trim();
    if (!TOKEN_REGEX.test(tok)) return { error: 'not_found' };            // wrong shape: never even looks at the sheet

    var cfg = getConfig_();
    var sheet = SpreadsheetApp.openById(cfg.dashboardId).getSheetByName(DASHBOARD_TAB);
    if (!sheet) throw new Error('Dashboard tab not found: ' + DASHBOARD_TAB);
    var cols = resolveHeaders_(sheet, STUDENT_HEADERS, 'Student dashboard page/' + DASHBOARD_TAB);

    var row = findTokenRow_(sheet, cols.token, tok);
    if (!row) return { error: 'not_found' };
    // This script only serves engineering students: a Medical (or blank) Stream behind an ENG- token is "not found".
    if (String(sheet.getRange(row, cols.stream).getValue()).trim().toLowerCase() !== STREAM_VALUE.toLowerCase()) return { error: 'not_found' };

    if (action === 'getStudent') return { success: true, data: readStudent_(sheet, row, cols) };

    var lock = LockService.getScriptLock();
    var locked = false;
    try { locked = lock.tryLock(LOCK_WAIT_MS); } catch (lockErr) { log_('Lock error: ' + describeError_(lockErr)); }
    if (!locked) return { error: 'busy' };
    try {
      if (action === 'saveShortlist') {
        var v = validateShortlist_(payload && payload.colleges);
        if (!v) return { error: 'invalid_input' };
        sheet.getRange(row, cols.savedShortlist).setNumberFormat(TEXT_FORMAT).setValue(v.json);   // text format: nothing is read as a formula
        return { success: true, count: v.count };
      }
      if (action === 'saveDocStatus') {
        var d = validateDocStatus_(payload && payload.data);
        if (!d) return { error: 'invalid_input' };
        sheet.getRange(row, cols.documentStatus).setNumberFormat(TEXT_FORMAT).setValue(d);
        return { success: true };
      }
    } finally {
      lock.releaseLock();
    }
    return { error: 'invalid_action' };
  } catch (err) {
    log_('Dashboard action ' + action + ' failed: ' + describeError_(err));
    notifyError_(err && err.name === 'HeaderError' ? 'Dashboard page: missing/ambiguous sheet header' : 'Dashboard action failed', describeError_(err));
    return { error: 'server_error' };       // no details to the browser
  }
}

/** Row number of the exact token (trimmed), or 0. Reads only the Token column. */
function findTokenRow_(sheet, tokenCol, token) {
  var last = sheet.getLastRow();
  if (last <= HEADER_ROW) return 0;
  var vals = sheet.getRange(HEADER_ROW + 1, tokenCol, last - HEADER_ROW, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0]).trim() === token) return HEADER_ROW + 1 + i;
  return 0;
}

/** The ONLY fields the page uses. Add a field here only when the page needs it. Never a student or parent phone number. */
function readStudent_(sheet, row, cols) {
  var vals = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var v = function (key) { var x = vals[cols[key] - 1]; return (x === null || x === undefined) ? '' : x; };
  var score = v('score'), scoreNum = (score === '' ? null : Number(score));
  return {
    name:                String(v('name')).trim(),
    score:               (scoreNum !== null && isFinite(scoreNum)) ? scoreNum : null,     // a number, decimals kept (percentile 98.37)
    category:            String(v('category')).trim(),
    stage:               String(v('stage')).trim(),
    tracks:              splitTracks_(v('tracks')),
    counsellor_name:     String(v('counsellorName')).trim(),
    counsellor_whatsapp: String(v('counsellorWhatsapp')).replace(/\D/g, ''),               // the COUNSELLOR's number, digits only (the page's "Call the Advisor" button)
    whatsapp_group_link: safeHttpUrl_(v('whatsappGroupLink')),
    saved_colleges:      parseJsonObject_(v('savedShortlist')),
    document_status:     validDocStatusString_(v('documentStatus'))
  };
}

function splitTracks_(raw) {
  return String(raw === null || raw === undefined ? '' : raw).split(/[,;|]/)
    .map(function (t) { return cleanText_(t, 40); }).filter(function (t) { return t; }).slice(0, 10);
}
function safeHttpUrl_(raw) { var u = String(raw === null || raw === undefined ? '' : raw).trim(); return /^https?:\/\/[^\s]+$/i.test(u) && u.length <= 500 ? u : ''; }
function parseJsonObject_(raw) {
  try { var o = JSON.parse(String(raw)); return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {}; } catch (e) { return {}; }
}
function validDocStatusString_(raw) {
  var s = String(raw === null || raw === undefined ? '' : raw).trim();
  if (!s) return null;
  var norm = validateDocStatus_(s);
  return norm || null;
}

/** colleges must be { group: [ {item}, ... ], ... }. Returns { json, count } or null. Item fields are page-defined (institute, branch, seatType, ...). */
function validateShortlist_(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  var keys = Object.keys(c);
  if (keys.length > SHORTLIST_MAX_GROUPS) return null;
  var out = {}, total = 0;
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i], arr = c[k];
    if (!/^[A-Za-z0-9_-]{1,30}$/.test(k) || !Array.isArray(arr)) return null;
    total += arr.length;
    if (total > SHORTLIST_MAX_ITEMS) return null;
    for (var j = 0; j < arr.length; j++) {
      var it = arr[j];
      if (!it || typeof it !== 'object' || Array.isArray(it) || JSON.stringify(it).length > SHORTLIST_ITEM_MAX_CHARS) return null;
    }
    out[k] = arr;
  }
  var json = JSON.stringify(out);
  if (json.length > SHORTLIST_MAX_CHARS) return null;
  return { json: json, count: total };
}

/** raw = JSON string or object { checked: [ids], category, quota }. Returns the normalised JSON string, or null. */
function validateDocStatus_(raw) {
  var o;
  try { o = (typeof raw === 'string') ? JSON.parse(raw) : raw; } catch (e) { return null; }
  if (!o || typeof o !== 'object' || Array.isArray(o) || !Array.isArray(o.checked) || o.checked.length > DOC_MAX_IDS) return null;
  var seen = {}, checked = [];
  for (var i = 0; i < o.checked.length; i++) {
    var id = o.checked[i];
    if (typeof id !== 'string' || !/^[A-Za-z0-9_.-]{1,60}$/.test(id)) return null;
    if (!seen[id]) { seen[id] = true; checked.push(id); }
  }
  return JSON.stringify({ checked: checked, category: cleanText_(o.category, 30), quota: cleanText_(o.quota, 30) });
}


// ════════════════════════════════════════════════════════════════
//  SHEET WRITING (only touches the cells we have values for)
// ════════════════════════════════════════════════════════════════

/** Last row (>= HEADER_ROW) where ANY of the given columns is non-empty. Ignores formula-filled empty rows below the data. */
function lastDataRow_(sheet, colNumbers) {
  var last = sheet.getLastRow();
  var result = HEADER_ROW;
  if (last <= HEADER_ROW) return result;
  colNumbers.forEach(function (c) {
    var vals = sheet.getRange(HEADER_ROW + 1, c, last - HEADER_ROW, 1).getValues();
    for (var i = vals.length - 1; i >= 0; i--) {
      if (String(vals[i][0]).trim() !== '') { result = Math.max(result, HEADER_ROW + 1 + i); break; }
    }
  });
  return result;
}

/**
 * Writes valuesByKey into `row`, grouped into runs of adjacent columns. Columns not in `cols`
 * (formulas, extra notes, anything else) are never touched. Text cells are forced to plain-text
 * format first so Sheets cannot turn "+44..." or "=cmd" into a number/formula.
 */
function writeRowByHeaders_(sheet, row, cols, valuesByKey, formatsByKey) {
  var byCol = {};
  Object.keys(valuesByKey).forEach(function (key) {
    if (!cols[key]) throw new Error('Internal: no column resolved for ' + key);
    var v = valuesByKey[key];
    var fmt = (formatsByKey && formatsByKey[key]) || ((isDate_(v) || typeof v === 'number') ? GENERAL_FORMAT : TEXT_FORMAT);
    byCol[cols[key]] = { value: (v === null || v === undefined) ? '' : v, format: fmt };
  });
  var colNums = Object.keys(byCol).map(Number).sort(function (a, b) { return a - b; });
  if (colNums.length === 0) return;

  var maxNeededCol = colNums[colNums.length - 1];
  if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), row - sheet.getMaxRows());
  if (maxNeededCol > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), maxNeededCol - sheet.getMaxColumns());

  var runStart = 0;
  for (var i = 1; i <= colNums.length; i++) {
    if (i === colNums.length || colNums[i] !== colNums[i - 1] + 1) {
      var run = colNums.slice(runStart, i);
      var range = sheet.getRange(row, run[0], 1, run.length);
      range.setNumberFormats([run.map(function (c) { return byCol[c].format; })]);
      range.setValues([run.map(function (c) { return byCol[c].value; })]);
      runStart = i;
    }
  }
}


// ════════════════════════════════════════════════════════════════
//  ROUTING
// ════════════════════════════════════════════════════════════════

function routeTab_(lead) {
  var src = normLetters_(lead.source);
  if (src.indexOf('seminar') === 0) return { tab: 'Seminar', reason: 'source=seminar', isSeminar: true };

  var b = normLetters_(lead.nearestBranch);
  if (b) {
    for (var i = 0; i < BRANCH_ALIASES.length; i++) {
      if (b.indexOf(BRANCH_ALIASES[i][0]) !== -1) return { tab: BRANCH_ALIASES[i][1], reason: 'nearest branch', isSeminar: false };
    }
  }
  return { tab: 'Online', reason: b ? 'unknown branch' : 'no branch', isSeminar: false };
}

function normLetters_(s) { return String(s === null || s === undefined ? '' : s).toLowerCase().replace(/[^a-z]/g, ''); }


// ════════════════════════════════════════════════════════════════
//  VALIDATION
// ════════════════════════════════════════════════════════════════

function readParams_(params) {
  var out = {};
  Object.keys(PARAM_NAMES).forEach(function (key) {
    out[key] = '';
    for (var i = 0; i < PARAM_NAMES[key].length; i++) {
      var raw = params[PARAM_NAMES[key][i]];
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') { out[key] = String(raw); break; }
    }
  });
  return out;
}

function cleanText_(s, max) {
  var t = String(s === null || s === undefined ? '' : s).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.substring(0, max) : t;
}

function validateName_(raw) {
  var name = cleanText_(raw, 80);
  if (name.length < 2) return { ok: false, message: 'Please enter the student\'s full name.' };
  if (!/^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(name)) return { ok: false, message: 'Name can contain only letters, spaces, . \' and -.' };
  if ((name.match(/\p{L}/gu) || []).length < 2) return { ok: false, message: 'Please enter the student\'s full name.' };
  return { ok: true, value: name };
}

/**
 * Indian mobile: 10 digits starting 6-9 (also accepts +91 / 91 / 0 prefixes -> stored as 10 digits).
 * International: '+' + country code + number, 7-15 digits in total (also accepts a leading 00).
 * '+91' must be followed by a valid Indian mobile; it is never treated as an international number.
 * Returns value (what we store) and canonical (digits used for duplicate matching).
 */
function parsePhone_(raw) {
  var s = String(raw === null || raw === undefined ? '' : raw).trim();
  if (!s) return { ok: false, message: 'Phone number is required.' };
  if (/[^\d\s+\-().]/.test(s) || s.indexOf('+', 1) !== -1) return { ok: false, message: 'Phone number can contain only digits, spaces and a leading +.' };
  var hasPlus = s.charAt(0) === '+';
  var digits = s.replace(/\D/g, '');
  if (!hasPlus && digits.indexOf('00') === 0) { hasPlus = true; digits = digits.substring(2); }

  var indian = function (d) { return /^[6-9]\d{9}$/.test(d); };
  if (hasPlus) {
    if (digits.indexOf('91') === 0) {
      var rest = digits.substring(2);
      if (!indian(rest)) return { ok: false, message: 'Indian numbers (+91) must be a 10-digit mobile starting with 6, 7, 8 or 9.' };
      return { ok: true, value: rest, canonical: '91' + rest, kind: 'IN' };
    }
    if (digits.length < 7 || digits.length > 15 || digits.charAt(0) === '0') return { ok: false, message: 'International numbers must be + country code + number (7 to 15 digits).' };
    return { ok: true, value: '+' + digits, canonical: digits, kind: 'INTL' };
  }
  var d = digits;
  if (d.length === 11 && d.charAt(0) === '0') d = d.substring(1);
  else if (d.length === 12 && d.indexOf('91') === 0) d = d.substring(2);
  if (d.length === 10 && indian(d)) return { ok: true, value: d, canonical: '91' + d, kind: 'IN' };
  return { ok: false, message: 'Enter a 10-digit mobile number starting with 6, 7, 8 or 9, or an international number starting with + and the country code.' };
}

/** Matching key for numbers already in a sheet (any format). Never throws. */
function canonicalPhone_(stored) {
  var p = parsePhone_(stored);
  if (p.ok) return p.canonical;
  var d = String(stored === null || stored === undefined ? '' : stored).replace(/\D/g, '');
  if (d.length === 10) return '91' + d;
  return d;
}

function parsePercentile_(raw) {
  var s = String(raw).trim().replace(/%$/, '').trim();
  if (!/^\d{1,3}(\.\d{1,6})?$/.test(s)) return { ok: false, message: 'Percentile must be a number between 0 and 100 (for example 98.5), using a dot for decimals.' };
  var v = parseFloat(s);                                   // parseFloat on purpose: 98.37 must stay 98.37
  if (!(v >= 0 && v <= 100)) return { ok: false, message: 'Percentile must be between 0 and 100.' };
  return { ok: true, value: v };
}

function parseRank_(raw, max, label) {
  var s = String(raw).trim().replace(/[,\s]/g, '');
  if (!/^\d{1,8}$/.test(s) || parseInt(s, 10) < 1 || parseInt(s, 10) > max) return { ok: false, message: label + ' must be a whole number between 1 and ' + max + '.' };
  return { ok: true, value: parseInt(s, 10) };
}

function normalizeScoreExam_(raw) {
  var k = String(raw).toLowerCase().replace(/[^a-z]/g, '');
  if (k === 'jeemain') return 'JEE Main';
  if (k === 'mhtcet') return 'MHT-CET';
  if (k === 'otherstatecet') return 'Other State CET';
  return null;
}

function isTruthyConsent_(raw) {
  return ['yes', 'y', 'true', '1', 'on', 'agree', 'agreed'].indexOf(String(raw).trim().toLowerCase()) !== -1;
}

function validateSubmission_(p) {
  var errors = [];
  var fail = function (field, message) { errors.push({ field: field, message: message }); };
  var cfg;
  try { cfg = getConfig_(); } catch (e) { cfg = { requireConsent: prop_('REQUIRE_CONSENT').toLowerCase() !== 'false' }; }

  var name = validateName_(p.fullName);
  if (!name.ok) fail('Full Name', name.message);

  var phone = parsePhone_(p.studentContact);
  if (!phone.ok) fail('Student Contact', phone.message);

  // Parent numbers are optional and must never cost us the lead: invalid ones are kept as typed and flagged.
  var warnings = [];
  var parent = function (raw, label) {
    if (!String(raw).trim()) return '';
    var r = parsePhone_(raw);
    if (r.ok) return r.value;
    warnings.push(label + ' looks invalid ("' + cleanText_(raw, 30) + '"): ' + r.message);
    return cleanText_(raw, 30);
  };
  var father = parent(p.fatherContact, 'Father Contact');
  var mother = parent(p.motherContact, 'Mother Contact');

  var percentile = null;
  if (String(p.percentile).trim() !== '') {
    var pr = parsePercentile_(p.percentile);
    if (!pr.ok) fail('Entrance Percentile', pr.message); else percentile = pr.value;
  }

  var scoreExam = '';
  if (String(p.scoreExam).trim() !== '') {
    scoreExam = normalizeScoreExam_(p.scoreExam);
    if (!scoreExam) { fail('Score Exam', 'Score Exam must be one of: ' + SCORE_EXAMS.join(', ') + '.'); scoreExam = ''; }
  } else if (percentile !== null) {
    fail('Score Exam', 'Please say which exam the percentile is for (' + SCORE_EXAMS.join(' / ') + ').');
  }

  var jeeMain = null, jeeAdv = null;
  if (String(p.jeeMainRank).trim() !== '') { var r1 = parseRank_(p.jeeMainRank, 2000000, 'JEE Main Rank (CRL)'); if (!r1.ok) fail('JEE Main Rank (CRL)', r1.message); else jeeMain = r1.value; }
  if (String(p.jeeAdvRank).trim() !== '')  { var r2 = parseRank_(p.jeeAdvRank, 300000, 'JEE Advanced Rank'); if (!r2.ok) fail('JEE Advanced Rank', r2.message); else jeeAdv = r2.value; }

  var consent = isTruthyConsent_(p.consent) ? 'Yes' : 'No';
  if (cfg.requireConsent && consent !== 'Yes') fail('Consent', 'Please tick the consent box so our counsellor can contact you.');

  if (errors.length) return { ok: false, errors: errors };

  var requestedPlan = ALLOWED_PLANS.filter(function (x) { return x.toLowerCase() === String(p.plan).trim().toLowerCase(); })[0];

  return {
    ok: true,
    lead: {
      fullName: name.value,
      studentContact: phone.value, studentContactCanonical: phone.canonical, phoneKind: phone.kind,
      fatherContact: father, motherContact: mother,
      coaching: cleanText_(p.coaching, 100), city: cleanText_(p.city, 80), category: cleanText_(p.category, 30),
      courses: cleanText_(p.courses, 200), budget: cleanText_(p.budget, 200),
      nearestBranch: cleanText_(p.nearestBranch, 60),
      percentile: percentile, scoreExam: scoreExam, jeeMainRank: jeeMain, jeeAdvRank: jeeAdv,
      examsAppearing: cleanText_(p.examsAppearing, 200), homeState: cleanText_(p.homeState, 60), classStatus: cleanText_(p.classStatus, 60),
      source: cleanText_(p.source, 60) || 'Website',
      utmSource: cleanText_(p.utmSource, 100), utmMedium: cleanText_(p.utmMedium, 100), utmCampaign: cleanText_(p.utmCampaign, 150),
      gclid: cleanText_(p.gclid, 200),
      plan: requestedPlan || DEFAULT_PLAN, consent: consent,
      submittedAt: now_().toISOString(),
      warnings: warnings
    }
  };
}


// ════════════════════════════════════════════════════════════════
//  DUPLICATES (same phone within 24 hours)
// ════════════════════════════════════════════════════════════════

function toMs_(v) {
  if (isDate_(v)) return v.getTime();
  if (typeof v === 'string' && v.trim() !== '') { var t = Date.parse(v); return isNaN(t) ? null : t; }
  return null;
}

/**
 * Looks at the newest DUP_SCAN_ROWS rows of every enquiry tab. A tab that cannot be read (missing header etc.)
 * is reported in `warnings` and skipped: the lead is still saved, just without that tab's duplicate check.
 * Prefers a match that already has an ENG- token (so we can reuse it).
 */
function findRecentDuplicate_(enqSS, canonical, nowMs, warnings) {
  var best = null;
  ENQUIRY_TABS.forEach(function (tab) {
    var sh = enqSS.getSheetByName(tab);
    if (!sh) { warnings.push('Duplicate check skipped: tab "' + tab + '" not found.'); return; }
    var cols;
    try { cols = resolveHeaders_(sh, { timestamp: ENQUIRY_HEADERS.timestamp, studentContact: ENQUIRY_HEADERS.studentContact, token: ENQUIRY_HEADERS.token }, 'Enquiry/' + tab); }
    catch (e) { warnings.push('Duplicate check skipped for "' + tab + '": ' + e.message); log_(e.message); return; }

    var last = sh.getLastRow();
    if (last <= HEADER_ROW) return;
    var start = Math.max(HEADER_ROW + 1, last - DUP_SCAN_ROWS + 1), n = last - start + 1;
    var ts = sh.getRange(start, cols.timestamp, n, 1).getValues();
    var ph = sh.getRange(start, cols.studentContact, n, 1).getValues();
    var tk = sh.getRange(start, cols.token, n, 1).getValues();
    for (var i = n - 1; i >= 0; i--) {
      var t = toMs_(ts[i][0]);
      if (t === null || (nowMs - t) > DUP_WINDOW_MS) continue;
      if (String(ph[i][0]).trim() === '' || canonicalPhone_(ph[i][0]) !== canonical) continue;
      var cand = { tab: tab, row: start + i, token: String(tk[i][0]).trim(), at: t };
      var candIsEng = TOKEN_REGEX.test(cand.token), bestIsEng = !!(best && TOKEN_REGEX.test(best.token));
      if (!best || (candIsEng && !bestIsEng) || (candIsEng === bestIsEng && cand.at > best.at)) best = cand;
    }
  });
  return best;
}


// ════════════════════════════════════════════════════════════════
//  TOKENS  ENG-XXXXXXXXXX  (random, unique across both workbooks)
// ════════════════════════════════════════════════════════════════

/** Random bytes from Java's SecureRandom via UUIDv4. The fixed version/variant bytes (6 and 8) are skipped. */
function randomBytes_() {
  var out = [];
  for (var u = 0; u < 2; u++) {
    var hex = Utilities.getUuid().replace(/-/g, '');
    for (var i = 0; i < 16; i++) { if (i === 6 || i === 8) continue; out.push(parseInt(hex.substr(i * 2, 2), 16)); }
  }
  return out;
}

function randomToken_() {
  var chars = '';
  while (chars.length < TOKEN_LENGTH) {
    var bytes = randomBytes_();
    for (var i = 0; i < bytes.length && chars.length < TOKEN_LENGTH; i++) {
      if (bytes[i] < 248) chars += TOKEN_ALPHABET.charAt(bytes[i] % TOKEN_ALPHABET.length);   // 248 = 31 * 8: no modulo bias
    }
  }
  return TOKEN_PREFIX + chars;
}

/** True if `token` is already in any Enquiry tab's Token column or the Dashboard's Token / Inquiry Token columns. */
function tokenExists_(enqSS, dashSS, token, warnings) {
  var found = false;
  var scan = function (sheet, header, label) {
    if (found) return;
    var cols;
    try { cols = resolveHeaders_(sheet, { t: header }, label); } catch (e) { warnings.push('Token check skipped for ' + label + ': ' + e.message); return; }
    var last = sheet.getLastRow();
    if (last <= HEADER_ROW) return;
    var vals = sheet.getRange(HEADER_ROW + 1, cols.t, last - HEADER_ROW, 1).getValues();
    for (var i = 0; i < vals.length; i++) if (String(vals[i][0]).trim() === token) { found = true; return; }
  };
  ENQUIRY_TABS.forEach(function (tab) { var sh = enqSS.getSheetByName(tab); if (sh) scan(sh, ENQUIRY_HEADERS.token, 'Enquiry/' + tab); });
  var ds = dashSS.getSheetByName(DASHBOARD_TAB);
  if (ds) { scan(ds, DASHBOARD_HEADERS.token, 'Dashboard/Token'); scan(ds, DASHBOARD_HEADERS.inquiryToken, 'Dashboard/Inquiry Token'); }
  return found;
}

function generateUniqueToken_(enqSS, dashSS, warnings) {
  for (var attempt = 0; attempt < 10; attempt++) {
    var t = randomToken_();
    if (!tokenExists_(enqSS, dashSS, t, warnings)) return t;
    log_('Token collision on ' + t + ', regenerating.');
  }
  throw new Error('Could not generate a unique token after 10 attempts.');
}


// ════════════════════════════════════════════════════════════════
//  PARKING QUEUE — a lead that could not be written is never dropped
// ════════════════════════════════════════════════════════════════

function parkLead_(lead, reason) {
  var props = PropertiesService.getScriptProperties();
  var pending = Object.keys(props.getProperties()).filter(function (k) { return k.indexOf(PENDING_PREFIX) === 0; });
  if (pending.length >= MAX_PENDING) {
    log_('PARKING QUEUE FULL (' + pending.length + '). Lead NOT stored: ' + lead.fullName);
    notifyError_('Parking queue full — lead could not be stored', 'Check the sheets and run replayPendingLeads().');
    return { ok: false, error: 'unavailable', message: 'We could not save your details right now. Please call our helpline.' };
  }
  var key = PENDING_PREFIX + now_().getTime() + '_' + randomToken_().substring(TOKEN_PREFIX.length);
  props.setProperty(key, JSON.stringify({ lead: lead, queuedAt: now_().toISOString(), reason: String(reason).substring(0, 500) }));
  log_('Lead parked as ' + key + ' (' + reason + ')');

  // Per-lead alert still goes out, flagged, so staff can act even before the sheet is fixed.
  try { sendLeadAlert_(lead, { token: '(none yet)', tab: '(NOT IN SHEET)', queued: true, queueReason: reason, warnings: [] }); }
  catch (mailErr) { log_('Queued-lead alert failed: ' + describeError_(mailErr)); }
  return { ok: true, queued: true, message: 'Your details are received. A counsellor will contact you shortly.' };
}

/** Writes parked leads once the sheets/headers are fixed. Safe to run repeatedly (also OK on a time trigger). */
function replayPendingLeads() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) { log_('replayPendingLeads: lock busy, try again.'); return { replayed: 0, remaining: -1 }; }
  var replayed = 0, remaining = 0;
  try {
    var props = PropertiesService.getScriptProperties();
    var keys = Object.keys(props.getProperties()).filter(function (k) { return k.indexOf(PENDING_PREFIX) === 0; }).sort();
    keys.forEach(function (key) {
      var item;
      try { item = JSON.parse(props.getProperty(key)); } catch (e) { log_('Unreadable parked lead ' + key + ' left in place.'); remaining++; return; }
      try {
        var result = writeLead_(item.lead);
        props.deleteProperty(key);
        replayed++;
        log_('Replayed ' + key + ' as ' + result.token + ' in ' + result.tab);
      } catch (err) {
        remaining++;
        log_('Replay of ' + key + ' failed again: ' + describeError_(err));
      }
    });
  } finally {
    lock.releaseLock();
  }
  log_('replayPendingLeads: replayed=' + replayed + ' remaining=' + remaining);
  return { replayed: replayed, remaining: remaining };
}

/**
 * Creates Dashboard rows for ENG- leads that exist in the Enquiry workbook but not in the Dashboard
 * (for example after a dashboard failure). Idempotent: existing rows are never duplicated.
 */
function repairMissingDashboardRows() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_WAIT_MS)) { log_('repair: lock busy.'); return { created: 0 }; }
  var created = 0;
  try {
    var cfg = getConfig_();
    var enqSS = SpreadsheetApp.openById(cfg.enquiryId), dashSS = SpreadsheetApp.openById(cfg.dashboardId);
    var dashSheet = dashSS.getSheetByName(DASHBOARD_TAB);
    var dashCols = resolveHeaders_(dashSheet, DASHBOARD_HEADERS, 'Dashboard/' + DASHBOARD_TAB);
    var have = {};
    var dlast = dashSheet.getLastRow();
    if (dlast > HEADER_ROW) {
      var dv = dashSheet.getRange(HEADER_ROW + 1, dashCols.token, dlast - HEADER_ROW, 1).getValues();
      dv.forEach(function (r) { have[String(r[0]).trim()] = true; });
    }
    ENQUIRY_TABS.forEach(function (tab) {
      var sh = enqSS.getSheetByName(tab);
      if (!sh) return;
      var cols;
      try { cols = resolveHeaders_(sh, { token: ENQUIRY_HEADERS.token, fullName: ENQUIRY_HEADERS.fullName, percentile: ENQUIRY_HEADERS.percentile, timestamp: ENQUIRY_HEADERS.timestamp }, 'Enquiry/' + tab); }
      catch (e) { log_(e.message); return; }
      var last = sh.getLastRow();
      if (last <= HEADER_ROW) return;
      var n = last - HEADER_ROW;
      var tk = sh.getRange(HEADER_ROW + 1, cols.token, n, 1).getValues();
      var nm = sh.getRange(HEADER_ROW + 1, cols.fullName, n, 1).getValues();
      var pc = sh.getRange(HEADER_ROW + 1, cols.percentile, n, 1).getValues();
      var ts = sh.getRange(HEADER_ROW + 1, cols.timestamp, n, 1).getValues();
      for (var i = 0; i < n; i++) {
        var token = String(tk[i][0]).trim();
        if (!TOKEN_REGEX.test(token) || have[token]) continue;
        var pct = pc[i][0] === '' ? null : Number(pc[i][0]);
        var lead = { fullName: String(nm[i][0]), percentile: (pct === null || isNaN(pct)) ? null : pct };
        createDashboardRow_(dashSheet, dashCols, cfg, token, lead, isDate_(ts[i][0]) ? ts[i][0] : now_());
        have[token] = true;
        created++;
        log_('Repaired dashboard row for ' + token);
      }
    });
  } finally {
    lock.releaseLock();
  }
  return { created: created };
}


// ════════════════════════════════════════════════════════════════
//  ALERTS
// ════════════════════════════════════════════════════════════════

function subjectPrefix_() { return prop_('ENVIRONMENT').toLowerCase() === 'copy' ? '[TEST] ' : ''; }

/** One email per lead. Returns { sent, reason }. Never throws; a mail problem is logged and the lead is already saved. */
function sendLeadAlert_(lead, result) {
  var to = prop_('LEAD_ALERT_EMAIL');
  if (!to) return { sent: false, reason: 'no LEAD_ALERT_EMAIL' };
  var route = routeTab_(lead);
  if (route.isSeminar && prop_('SEMINAR_ALERTS').toLowerCase() !== 'true') return { sent: false, reason: 'seminar alerts off' };

  try {
    if (MailApp.getRemainingDailyQuota() < 1) { log_('Mail quota exhausted; alert skipped.'); return { sent: false, reason: 'quota' }; }
    var flags = [];
    if (result.queued) flags.push('NOT SAVED TO SHEET — QUEUED');
    if (result.duplicate) flags.push('DUPLICATE');
    if (result.dashboardOk === false) flags.push('DASHBOARD ROW FAILED');
    var lines = [
      'New engineering lead' + (flags.length ? '  [' + flags.join(' | ') + ']' : ''),
      '',
      'Name:        ' + lead.fullName,
      'Phone:       ' + lead.studentContact + (lead.phoneKind === 'INTL' ? '  (international)' : ''),
      'Father:      ' + (lead.fatherContact || '-'),
      'Mother:      ' + (lead.motherContact || '-'),
      'City / state: ' + (lead.city || '-') + ' / ' + (lead.homeState || '-'),
      'Class status: ' + (lead.classStatus || '-'),
      'Score:       ' + (lead.percentile === null ? '-' : lead.percentile + ' percentile') + ' (' + (lead.scoreExam || '-') + ')',
      'JEE Main CRL: ' + (lead.jeeMainRank === null ? '-' : lead.jeeMainRank) + '   JEE Adv: ' + (lead.jeeAdvRank === null ? '-' : lead.jeeAdvRank),
      'Exams appearing: ' + (lead.examsAppearing || '-'),
      'Category:    ' + (lead.category || '-'),
      'Branches:    ' + (lead.courses || '-'),
      'Budget:      ' + (lead.budget || '-'),
      'Nearest branch: ' + (lead.nearestBranch || '-') + '  ->  tab: ' + result.tab,
      'Source:      ' + lead.source + '   utm: ' + [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(String).join(' / ') + (lead.gclid ? '   gclid: ' + lead.gclid : ''),
      'Plan:        ' + lead.plan,
      'Token:       ' + result.token
    ];
    if (result.duplicateInfo) lines.push('', 'Duplicate of: ' + (result.duplicateInfo.token || 'row without token') + ' in ' + result.duplicateInfo.tab + ' row ' + result.duplicateInfo.row);
    if (result.queued) lines.push('', 'Why not saved: ' + result.queueReason);
    var warn = (lead.warnings || []).concat(result.warnings || []);
    if (warn.length) lines.push('', 'Warnings:', warn.map(function (w) { return ' - ' + w; }).join('\n'));

    MailApp.sendEmail({
      to: to,
      subject: subjectPrefix_() + '[ASMI Engineering] ' + (flags.length ? flags[0] + ' — ' : 'New lead — ') + lead.fullName + ' (' + result.tab + ')',
      body: lines.join('\n'),
      name: 'ASMI Lead Bot'
    });
    return { sent: true };
  } catch (err) {
    log_('Lead alert email FAILED (lead is safe): ' + describeError_(err));
    return { sent: false, reason: 'error', error: describeError_(err) };
  }
}

/** Setup/sheet problems. Throttled per subject so an outage cannot flood the inbox. `force` skips the throttle. */
function notifyError_(subject, details, force) {
  try {
    var to = prop_('ERROR_ALERT_EMAIL') || prop_('LEAD_ALERT_EMAIL');
    if (!to) { log_('(no alert email configured) ' + subject); return; }
    var props = PropertiesService.getScriptProperties();
    var key = 'LAST_ERR_MAIL_' + String(subject).replace(/[^A-Za-z0-9]/g, '').substring(0, 40);
    var last = Number(props.getProperty(key) || 0);
    if (!force && now_().getTime() - last < ERROR_MAIL_THROTTLE_MS) return;
    if (MailApp.getRemainingDailyQuota() < 1) return;
    MailApp.sendEmail({
      to: to,
      subject: subjectPrefix_() + '[ASMI Engineering] SETUP/ERROR: ' + subject,
      body: String(details).substring(0, 4000) + '\n\nVersion ' + SCRIPT_VERSION + '. Leads are not lost: they are parked in Script Properties (PENDING_LEAD_*) until you run replayPendingLeads().',
      name: 'ASMI Lead Bot'
    });
    props.setProperty(key, String(now_().getTime()));
  } catch (err) {
    log_('notifyError_ itself failed: ' + describeError_(err));
  }
}

/**
 * ════════ WHATSAPP ALERT HOOK — INTENTIONALLY EMPTY ════════
 * Called once per saved lead, after the sheet write, inside try/catch (an error here cannot lose a lead).
 * To add WhatsApp later, implement it here (e.g. UrlFetchApp to your WhatsApp Business provider).
 *   lead   = the validated lead (fullName, studentContact, percentile, ...)
 *   result = { token, tab, duplicate, ... }
 * Do NOT put API keys in this file; use Script Properties.
 */
function sendWhatsAppAlert_(lead, result) {
  // intentionally empty
}


// ════════════════════════════════════════════════════════════════
//  SMALL HELPERS
// ════════════════════════════════════════════════════════════════

function now_() { return new Date(); }                    // tests replace this to control time
function isDate_(v) { return Object.prototype.toString.call(v) === '[object Date]'; }   // realm-safe Date check
function log_(msg) { Logger.log(String(msg)); }
function describeError_(err) { return (err && err.name ? err.name + ': ' : '') + (err && err.message ? err.message : String(err)); }


// ════════════════════════════════════════════════════════════════
//  MANUAL TOOLS (run from the Apps Script editor, on the COPIES)
// ════════════════════════════════════════════════════════════════

/**
 * Writes ONE synthetic lead through the real code path. Refuses unless Script Property ALLOW_SMOKE_TEST = 'true',
 * so it cannot be run against the live workbooks by accident. Turn the property off again afterwards.
 */
function runSmokeTest() {
  if (prop_('ALLOW_SMOKE_TEST').toLowerCase() !== 'true') {
    throw new Error('runSmokeTest is disabled. Point Script Properties at the COPIES, then set ALLOW_SMOKE_TEST=true.');
  }
  var suffix = String(now_().getTime()).slice(-6);
  var res = handleSubmission_({
    'Full Name': 'Smoke Test Student', 'Student Contact': '90000' + suffix.slice(-5),
    'City': 'Mumbai', 'Category': 'General', 'Nearest Branch': 'Andheri',
    'Entrance Percentile': '98.37', 'Score Exam': 'JEE Main', 'JEE Main Rank (CRL)': '12345',
    'Home State': 'Maharashtra', 'Class Status': 'Class 12 appearing', 'Source': 'SMOKE TEST',
    'utm_source': 'smoke', 'Plan': 'Explore', 'Consent': 'Yes'
  });
  log_('Smoke test result: ' + JSON.stringify(res));
  return res;
}
