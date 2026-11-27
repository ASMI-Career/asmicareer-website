// ASMI Career: MEDICAL student dashboard script (asmicareer.in/student).
// Bound to the Medical dashboard workbook. Serves the "Student Dashboard" tab.
//
// HOW A STUDENT GETS IN
//   The page sends a Google ID token in the BODY of a POST. This script asks Google whether it is genuine and then requires its verified
//   email to equal exactly ONE cell in the "Approved Email" column (staff type the student's Google email there). A link or token alone does nothing.
//   Every answer is a short code; no internal error text ever reaches the browser.
//
// SETUP (Project Settings -> Script properties):  GOOGLE_CLIENT_ID = the OAuth "Web application" client ID (a public value, not a secret).
// Add a column headed exactly "Approved Email" at the far right of the Student Dashboard tab (found by header name, so its position does not matter).
//
// Actions (POST, text/plain JSON):  { action: 'getStudent' | 'saveShortlist' | 'saveDocStatus', idToken, ... }
// GET never serves student data.

var SHEET_NAME = 'Student Dashboard';
var HEADER_ROW = 1;
var APPROVED_EMAIL_HEADER = 'Approved Email';

// Fixed column positions of this tab (1-based). Only the email column is found by name.
var COL = { TOKEN: 2, DATE_ADDED: 3, NAME: 4, SCORE: 5, RANK: 6, CATEGORY: 7, COUNSELLOR_NAME: 8, COUNSELLOR_WHATSAPP: 9, WHATSAPP_GROUP: 10, STAGE: 11, SHORTLIST: 14, DOC_STATUS: 38 };

var GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo?id_token=';
var GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
var AUTH_CACHE_MAX_S = 300;
var EMAIL_RE = /^[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
var EMAIL_MAX = 254;
var LOCK_WAIT_MS = 20000;
var SHORTLIST_MAX_CHARS = 40000, SHORTLIST_MAX_ITEMS = 300, SHORTLIST_MAX_GROUPS = 10, SHORTLIST_ITEM_MAX_CHARS = 2000, DOC_MAX_IDS = 500;
var EMAIL_CHECK_TAB = 'Email Check';
var INACTIVE_STAGES = [];     // stages that are NOT checked by checkApprovedEmails(). Empty = every student row is checked.

// ── entry points ─────────────────────────────────────────────────

function doGet(e) {
  return jsonOut_({ error: 'invalid_action' });          // a link alone never returns or changes anything
}

function doPost(e) {
  try {
    var body = parseBody_(e);
    if (!body || typeof body.action !== 'string') return jsonOut_({ error: 'invalid_action' });
    if (body.action !== 'getStudent' && body.action !== 'saveShortlist' && body.action !== 'saveDocStatus') return jsonOut_({ error: 'invalid_action' });
    return jsonOut_(dashboardAction_(body.action, body.idToken, body));
  } catch (err) {
    log_('doPost failed: ' + describeError_(err));
    return jsonOut_({ error: 'server_error' });
  }
}

function parseBody_(e) {
  try {
    var c = e && e.postData && e.postData.contents;
    if (typeof c === 'string' && c.length <= 200000 && /^\s*\{/.test(c)) { var o = JSON.parse(c); return (o && typeof o === 'object' && !Array.isArray(o)) ? o : null; }
  } catch (err) { /* not JSON */ }
  return null;
}

/** Always returns a plain object, never throws. Codes: auth_required, auth_invalid, not_approved, invalid_input, busy, server_error. */
function dashboardAction_(action, idToken, payload) {
  try {
    var who = verifyGoogleIdToken_(idToken);
    if (who.error) return { error: who.error };

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Tab not found: ' + SHEET_NAME);
    var emailCol = findHeaderCol_(sheet, APPROVED_EMAIL_HEADER);
    if (!emailCol) throw new Error('Header not found: ' + APPROVED_EMAIL_HEADER);

    if (action === 'getStudent') {
      var f = findRowByEmail_(sheet, emailCol, who.email);
      if (!f.row) { if (f.duplicate) log_('Approved Email appears on more than one row (' + f.duplicate + '); nobody is served until staff fix it.'); return { error: 'not_approved' }; }
      return { success: true, data: readStudent_(sheet, f.row) };
    }

    var lock = LockService.getScriptLock();
    var locked = false;
    try { locked = lock.tryLock(LOCK_WAIT_MS); } catch (lockErr) { log_('Lock error: ' + describeError_(lockErr)); }
    if (!locked) return { error: 'busy' };
    try {
      // The row is looked up INSIDE the lock, from the verified email only.
      var found = findRowByEmail_(sheet, emailCol, who.email);
      if (!found.row) { if (found.duplicate) log_('Approved Email appears on more than one row (' + found.duplicate + ').'); return { error: 'not_approved' }; }
      if (action === 'saveShortlist') {
        var v = validateShortlist_(payload && payload.colleges);
        if (!v) return { error: 'invalid_input' };
        sheet.getRange(found.row, COL.SHORTLIST).setNumberFormat('@').setValue(v.json);   // plain text: nothing is read as a formula
        return { success: true, count: v.count };
      }
      if (action === 'saveDocStatus') {
        var d = validateDocStatus_(payload && payload.data);
        if (!d) return { error: 'invalid_input' };
        sheet.getRange(found.row, COL.DOC_STATUS).setNumberFormat('@').setValue(d);
        return { success: true };
      }
    } finally {
      lock.releaseLock();
    }
    return { error: 'invalid_action' };
  } catch (err) {
    log_('Dashboard action ' + action + ' failed: ' + describeError_(err));
    return { error: 'server_error' };
  }
}

/** The ONLY fields the page uses. No phone numbers of the student or parents, no tokens or links. */
function readStudent_(sheet, row) {
  var vals = sheet.getRange(row, 1, 1, Math.max(sheet.getLastColumn(), COL.DOC_STATUS)).getValues()[0];
  var v = function (c) { var x = vals[c - 1]; return (x === null || x === undefined) ? '' : x; };
  return {
    name:                String(v(COL.NAME)).trim(),
    score:               v(COL.SCORE),
    rank:                v(COL.RANK),
    category:            String(v(COL.CATEGORY)).trim(),
    counsellor_name:     String(v(COL.COUNSELLOR_NAME)).trim(),
    counsellor_whatsapp: String(v(COL.COUNSELLOR_WHATSAPP)).replace(/\D/g, ''),     // the COUNSELLOR's number, digits only
    whatsapp_group_link: safeHttpUrl_(v(COL.WHATSAPP_GROUP)),
    stage:               String(v(COL.STAGE)).trim(),
    saved_colleges:      parseJsonObject_(v(COL.SHORTLIST)),
    document_status:     validDocStatusString_(v(COL.DOC_STATUS))
  };
}

// ── Google sign-in ───────────────────────────────────────────────

function sha256Hex_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text).map(function (b) { var x = (b < 0 ? b + 256 : b).toString(16); return x.length === 1 ? '0' + x : x; }).join('');
}
function normEmail_(raw) { return String(raw === null || raw === undefined ? '' : raw).trim().toLowerCase(); }
function validEmail_(e) { return e.length > 0 && e.length <= EMAIL_MAX && EMAIL_RE.test(e); }
function now_() { return new Date(); }

/** { email } for a genuine Google ID token, else { error: 'auth_required' | 'auth_invalid' | 'server_error' }. Never throws. */
function verifyGoogleIdToken_(idToken) {
  try {
    var t = (typeof idToken === 'string') ? idToken.trim() : '';
    if (!t) return { error: 'auth_required' };
    if (t.length > 4096 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t)) return { error: 'auth_invalid' };
    var clientId = String(PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID') || '').trim();
    if (!clientId) { log_('GOOGLE_CLIENT_ID is not set.'); return { error: 'server_error' }; }

    var cacheKey = 'gid_' + sha256Hex_(t), cache = null;
    try { cache = CacheService.getScriptCache(); var hit = cache.get(cacheKey); if (hit) return { email: hit }; } catch (ce) { cache = null; }

    var res = UrlFetchApp.fetch(GOOGLE_TOKENINFO_URL + encodeURIComponent(t), { muteHttpExceptions: true });
    var code = res.getResponseCode();
    if (code >= 500) { log_('Google token check unavailable (HTTP ' + code + ').'); return { error: 'server_error' }; }
    if (code !== 200) return { error: 'auth_invalid' };
    var info = JSON.parse(res.getContentText());
    var expMs = Number(info.exp) * 1000;
    var email = normEmail_(info.email);
    if (info.aud !== clientId) return { error: 'auth_invalid' };
    if (GOOGLE_ISSUERS.indexOf(info.iss) === -1) return { error: 'auth_invalid' };
    if (!isFinite(expMs) || expMs <= now_().getTime()) return { error: 'auth_invalid' };
    if (String(info.email_verified) !== 'true') return { error: 'auth_invalid' };
    if (!validEmail_(email)) return { error: 'auth_invalid' };
    if (cache) { try { cache.put(cacheKey, email, Math.max(1, Math.min(AUTH_CACHE_MAX_S, Math.floor((expMs - now_().getTime()) / 1000)))); } catch (pe) { /* optional */ } }
    return { email: email };
  } catch (err) {
    log_('Google token check failed: ' + describeError_(err));
    return { error: 'server_error' };
  }
}

function findHeaderCol_(sheet, header) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return 0;
  var row = sheet.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0], want = normHeader_(header), hits = [];
  for (var i = 0; i < row.length; i++) if (normHeader_(row[i]) === want) hits.push(i + 1);
  return hits.length === 1 ? hits[0] : 0;      // missing or repeated header => 0 => the caller fails closed
}
function normHeader_(s) { return String(s === null || s === undefined ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase(); }

/** { row } for exactly one match; { row: 0 } for none; { row: 0, duplicate: 'rows 4, 9' } when several rows hold the email. */
function findRowByEmail_(sheet, emailCol, email) {
  var last = sheet.getLastRow();
  if (last <= HEADER_ROW || !validEmail_(email)) return { row: 0 };
  var vals = sheet.getRange(HEADER_ROW + 1, emailCol, last - HEADER_ROW, 1).getValues(), hits = [];
  for (var i = 0; i < vals.length; i++) if (normEmail_(vals[i][0]) === email) hits.push(HEADER_ROW + 1 + i);
  if (hits.length === 1) return { row: hits[0] };
  return hits.length ? { row: 0, duplicate: 'rows ' + hits.join(', ') } : { row: 0 };
}

// ── input checks (same rules as the engineering script) ──────────

function cleanText_(s, max) { return String(s === null || s === undefined ? '' : s).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, max); }
function safeHttpUrl_(raw) { var u = String(raw === null || raw === undefined ? '' : raw).trim(); return /^https?:\/\/[^\s]+$/i.test(u) && u.length <= 500 ? u : ''; }
function parseJsonObject_(raw) { try { var o = JSON.parse(String(raw)); return (o && typeof o === 'object' && !Array.isArray(o)) ? o : {}; } catch (e) { return {}; } }
function validDocStatusString_(raw) {
  var s = String(raw === null || raw === undefined ? '' : raw).trim();
  if (!s) return null;
  return validateDocStatus_(s) || null;
}

/** colleges must be { group: [ {item}, ... ] } (Medical groups: MCC, MH, OPEN). Returns { json, count } or null. */
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

// ── staff check, inside the sheet ────────────────────────────────

/** Adds an "ASMI" menu to the workbook. Staff click ASMI -> Check approved emails. */
function onOpen() {
  try { SpreadsheetApp.getUi().createMenu('ASMI').addItem('Check approved emails', 'checkApprovedEmails').addToUi(); } catch (e) { /* no UI (trigger/test) */ }
}

/** Lists active students whose Approved Email is blank, not a valid email, or used by more than one row, in the "Email Check" tab. Nothing leaves the workbook. */
function checkApprovedEmails() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Tab not found: ' + SHEET_NAME);
  var emailCol = findHeaderCol_(sheet, APPROVED_EMAIL_HEADER);
  if (!emailCol) throw new Error('Header "' + APPROVED_EMAIL_HEADER + '" is missing or appears twice.');
  var last = sheet.getLastRow(), problems = [], checked = 0;
  if (last > HEADER_ROW) {
    var vals = sheet.getRange(HEADER_ROW + 1, 1, last - HEADER_ROW, Math.max(sheet.getLastColumn(), COL.STAGE)).getValues();
    var byEmail = {};
    vals.forEach(function (row, i) { var e = normEmail_(row[emailCol - 1]); if (e) (byEmail[e] = byEmail[e] || []).push(HEADER_ROW + 1 + i); });
    var inactive = INACTIVE_STAGES.map(function (x) { return x.toLowerCase(); });
    vals.forEach(function (row, i) {
      var rowNo = HEADER_ROW + 1 + i, token = String(row[COL.TOKEN - 1] || '').trim(), name = String(row[COL.NAME - 1] || '').trim();
      if (!token && !name) return;
      if (inactive.indexOf(String(row[COL.STAGE - 1] || '').trim().toLowerCase()) !== -1) return;
      checked++;
      var e = normEmail_(row[emailCol - 1]), label = name || '(no name)';
      if (!e) problems.push([rowNo, label, 'Blank', '']);
      else if (!validEmail_(e)) problems.push([rowNo, label, 'Not a valid email', '']);
      else if (byEmail[e].length > 1) problems.push([rowNo, label, 'Duplicate', 'Also on rows: ' + byEmail[e].filter(function (r) { return r !== rowNo; }).join(', ')]);
    });
  }
  var out = ss.getSheetByName(EMAIL_CHECK_TAB) || ss.insertSheet(EMAIL_CHECK_TAB);
  out.clearContents();
  var all = [['Sheet row', 'Student Name', 'Problem', 'Detail']].concat(problems.length ? problems : [['', 'No problems found among ' + checked + ' students.', '', '']]);
  out.getRange(1, 1, all.length, 4).setNumberFormat('@').setValues(all.map(function (r) { return r.map(String); }));
  out.getRange(all.length + 2, 1, 1, 2).setValues([['Last run', now_().toString()]]);
  return { checked: checked, problems: problems.length };
}

// ── helpers ──────────────────────────────────────────────────────

function jsonOut_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function log_(msg) { Logger.log(String(msg)); }
function describeError_(err) { return (err && err.name ? err.name + ': ' : '') + (err && err.message ? err.message : String(err)); }
