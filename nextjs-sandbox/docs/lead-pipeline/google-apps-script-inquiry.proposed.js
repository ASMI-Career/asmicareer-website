// ════════════════════════════════════════════════════════════════
//  ASMI CAREER — Complete Google Apps Script (WITH SHORTLIST SAVING)
//
//  CHANGES FROM PREVIOUS VERSION:
//  - Added "Seminar" branch (Vile Parle QR check-in + walk-in leads)
//  - Token counter fix: no longer wraps 999 → 000
//  - Column Q: auto-generated PDF Download link
//  - onEdit trigger: auto-generates M/N/Q links on token entry
//  - Column E repurposed from NEET Score to NEET Rank (AIR) — see
//    COL_NEET_RANK below. Historical rows keep whatever score value
//    is already there; only new submissions write rank going forward.
//    NOTE: the sheet's E1 header cell text ("NEET Score") is NOT set
//    by this script anywhere (unlike columns M/N/O/Q, which have
//    set-once-if-empty header logic) — it's a static Google Form
//    header. Rename it to "NEET Rank" manually in the Sheet; this
//    script cannot do that for you.
//
//  NOTE: Seminar sheet's column O is labeled "Remark", not "Saved
//  Shortlist" like other branches. Code below still treats column
//  index 15 as COL_SHORTLIST for consistency across all branches —
//  if a Seminar-branch student ever saves a shortlist, it will write
//  into that same O column. Flagged for ASMI to confirm this is fine
//  (Seminar leads are report-only, unlikely to use shortlist feature).
//
//  SETUP INSTRUCTIONS:
//  1. Go to your Google Sheet
//  2. Extensions → Apps Script
//  3. DELETE everything currently in the editor
//  4. Paste this ENTIRE file
//  5. Click Save (floppy disk icon)
//  6. Click Deploy → Manage Deployments
//  7. Click pencil (edit) icon on your existing deployment
//  8. Change Version to "New version"
//  9. Click Deploy
//  10. Copy the Web App URL — paste it into dashboard.html APPS_SCRIPT_URL
//
//  TRIGGER SETUP:
//  1. Click the clock icon (Triggers) in the left sidebar
//  2. Add Trigger → onFormSubmit → From spreadsheet → On form submit → Save
//  3. Add Trigger → onEdit       → From spreadsheet → On edit       → Save
//
//  BACKFILL EXISTING ROWS (run once after deploy):
//  1. Select "backfillDashboardLinks" from the function dropdown
//  2. Click Run
// ════════════════════════════════════════════════════════════════


// ── CONFIGURATION ─────────────────────────────────────────────
var DASHBOARD_URL = "https://asmicareer.in/dashboard.html";

// Engineering leads go to their own tab (see getEngineeringSheet_). Medical leads keep
// using the branch tabs below. "Engineering" is listed so token look-ups (doGet,
// saveShortlist, backfill) also search it.
var ENGINEERING_SHEET = "Engineering";

var BRANCH_SHEETS = [
  "Online",
  "Andheri",
  "Thane",
  "Pune",
  "Kolhapur",
  "Sangli",
  "Sambhajinagar",
  "Seminar",
  "Engineering"
];

var BRANCH_PREFIXES = {
  "online":        "ONL",
  "andheri":       "AND",
  "thane":         "THA",
  "pune":          "PUN",
  "kolhapur":      "KOL",
  "sangli":        "SAN",
  "sambhajinagar": "SAM",
  "seminar":       "SEM",
  "engineering":   "ENG"
};

// ── LEAD ALERTS ───────────────────────────────────────────────
// Inbox(es) that get an email for every new lead. Comma-separated for several.
// LEFT EMPTY ON PURPOSE: fill in the counsellor inbox before deploying.
// Empty = no email is sent (the lead is still saved).
var LEAD_ALERT_EMAIL = "";
// Seminar walk-ins can be hundreds per event; email quota is ~100/day (free Gmail) or ~1500/day (Workspace).
var ALERT_ON_SEMINAR = false;

// Column positions (1-indexed)
var COL_TIMESTAMP        = 1;  // A
var COL_TOKEN            = 2;  // B
var COL_FULLNAME         = 3;  // C
var COL_STUDENT_CONTACT  = 4;  // D
var COL_NEET_RANK        = 5;  // E — repurposed from NEET Score to NEET Rank (AIR); index unchanged, historical score values in existing rows are left as-is
var COL_FATHER_CONTACT   = 6;  // F
var COL_MOTHER_CONTACT   = 7;  // G
var COL_COACHING         = 8;  // H
var COL_CITY             = 9;  // I
var COL_CATEGORY         = 10; // J
var COL_COURSES          = 11; // K
var COL_BUDGET           = 12; // L
var COL_DASHBOARD_LINK   = 13; // M ← Sales pitch dashboard
var COL_COUNSELLING_LINK = 14; // N ← Counsellor dashboard
var COL_SHORTLIST        = 15; // O ← Saved Shortlist JSON (Seminar sheet: "Remark" — see note above)
// P is occupied in Online sheet — skip to Q
var COL_DOWNLOAD_LINK    = 17; // Q ← PDF Report Download
// New lead-tracking columns (R onward, nothing existing is moved)
var COL_STREAM           = 18; // R ← Medical / Engineering
var COL_LEAD_BRANCH      = 19; // S ← Andheri / Thane / Online / ...
var COL_ENTRANCE_SCORE   = 20; // T ← JEE / MHT-CET percentile (engineering). Kept apart from E so rank stays numeric.
var COL_UTM_SOURCE       = 21; // U
var COL_UTM_MEDIUM       = 22; // V
var COL_UTM_CAMPAIGN     = 23; // W
var COL_GCLID            = 24; // X
var LEAD_HEADERS = ["Stream", "Branch", "Entrance Score", "utm_source", "utm_medium", "utm_campaign", "gclid"];


// ════════════════════════════════════════════════════════════════
//  doPost — Handles inquiry form submissions & Shortlist saves
// ════════════════════════════════════════════════════════════════

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ── Handle Save Shortlist Action ──
    if (e.parameter.action === 'saveShortlist') {
      var token = e.parameter.token;
      var shortlistJson = e.parameter.shortlist;

      if (!token) throw new Error("No token provided");

      var foundSheet = null;
      var foundRowIdx = -1;

      for (var i = 0; i < BRANCH_SHEETS.length; i++) {
        var sh = ss.getSheetByName(BRANCH_SHEETS[i]);
        if (!sh) continue;

        var lastRow = sh.getLastRow();
        if (lastRow < 2) continue;

        var allTokens = sh.getRange(2, COL_TOKEN, lastRow - 1, 1).getValues();
        for (var r = 0; r < allTokens.length; r++) {
          if (String(allTokens[r][0]).trim() === String(token).trim()) {
            foundSheet = sh;
            foundRowIdx = r + 2;
            break;
          }
        }
        if (foundSheet) break;
      }

      if (!foundSheet) throw new Error("Student token not found");

      if (COL_SHORTLIST > foundSheet.getMaxColumns()) {
        foundSheet.insertColumnsAfter(foundSheet.getMaxColumns(), COL_SHORTLIST - foundSheet.getMaxColumns());
      }

      var headerCell = foundSheet.getRange(1, COL_SHORTLIST);
      if (!headerCell.getValue()) {
        headerCell.setValue("Saved Shortlist");
        headerCell.setFontWeight("bold");
        headerCell.setBackground("#1a0040");
        headerCell.setFontColor("#FFD700");
        headerCell.setHorizontalAlignment("center");
        foundSheet.setColumnWidth(COL_SHORTLIST, 200);
      }

      foundSheet.getRange(foundRowIdx, COL_SHORTLIST).setValue(shortlistJson);

      return jsonResponse({ success: true, message: "Shortlist saved successfully" });
    }

    // ── Handle New Student Inquiry Form ──
    var p = e.parameter;

    // 1. Stream + branch. New forms send stream/branch. Old cached pages and the legacy
    //    static forms send source = "Online (Engineering)" - still routed correctly.
    var rawSource   = String(p.branch || p.source || "Online").trim();
    var isEngineering = String(p.stream || "").toLowerCase() === "engineering" ||
                        /\(engineering\)\s*$/i.test(String(p.source || ""));
    var branchName  = normalizeBranch_(rawSource.replace(/\s*\(engineering\)\s*$/i, ""));
    var streamName  = isEngineering ? "Engineering" : "Medical";

    // 2. Validate (the website validates too, but this endpoint is public)
    // India: 10 digits starting 6-9 (a +91 / 91 / 0 prefix is stripped).
    // Other countries (MEDICAL leads only, e.g. NRI quota): "+" + country code, 8-15 digits in total,
    // stored as "+<digits>". Engineering leads accept Indian numbers only.
    var allowIntl    = !isEngineering;
    var studentPhone = normalizePhone_(p.studentContact, allowIntl);
    var fatherPhone  = normalizePhone_(p.fatherContact, allowIntl);
    var motherPhone  = normalizePhone_(p.motherContact, allowIntl);
    if (!String(p.fullName || "").trim())  throw new Error("Name is required");
    if (!studentPhone)                     throw new Error("Invalid student mobile number");
    if (String(p.fatherContact || "").trim() && !fatherPhone) throw new Error("Invalid father mobile number");
    if (String(p.motherContact || "").trim() && !motherPhone) throw new Error("Invalid mother mobile number");

    var neetRank      = "";
    var entranceScore = "";
    if (isEngineering) {
      // new form: entranceScore (percentile). legacy static form: jeeRank (free text)
      entranceScore = String(p.entranceScore || p.jeeRank || "").trim();
      if (!entranceScore) throw new Error("Entrance score is required");
      if (p.entranceScore) {
        var pctText = String(p.entranceScore).replace("%", "").replace(",", ".").trim();
        var pct = /^[0-9]{1,3}([.][0-9]{1,6})?$/.test(pctText) ? parseFloat(pctText) : NaN;
        if (isNaN(pct) || pct <= 0 || pct > 100) throw new Error("Entrance percentile must be between 0.01 and 100");
        entranceScore = String(pct);
      }
    } else {
      neetRank = String(p.neetRank || "").trim();
      // Seminar walk-ins (events/verify page) are checked in before results exist, so rank is optional there.
      if (branchName !== "Seminar" && !(parseInt(neetRank, 10) > 0)) throw new Error("NEET rank is required");
    }

    // 3. Select the tab: engineering -> its own tab; medical -> branch tab (fallback Online)
    var sheet = isEngineering ? getEngineeringSheet_(ss) : ss.getSheetByName(branchName);
    if (!sheet) {
      sheet      = ss.getSheetByName("Online");
      branchName = "Online";
    }

    // 4. Determine token prefix
    var prefix = isEngineering ? BRANCH_PREFIXES["engineering"]
                               : (BRANCH_PREFIXES[branchName.toLowerCase()] || "ONL");

    // 5. Append row first (token placeholder empty). Columns A-L are unchanged.
    var timestamp = new Date();
    var courses   = p.courses || "";
    var budget    = p.budget  || "";
    sheet.appendRow([
      timestamp,
      "",   // token — filled in step 6
      p.fullName       || "",
      studentPhone,
      neetRank,                    // E: NEET rank (blank for engineering; see T)
      fatherPhone,
      motherPhone,
      p.coachingClass  || "",
      p.city           || "",
      p.category       || "",
      courses,
      budget
    ]);

    // 6. Generate token AFTER append — uses actual new row number
    //    FIX: padStart never truncates (999 → "999", 1000 → "1000")
    var newRow       = sheet.getLastRow();
    var currentCount = newRow - 1;
    var currentYear  = timestamp.getFullYear().toString().slice(-2);
    var paddedCount  = String(currentCount).padStart(3, '0');
    var tokenNumber  = currentYear + "-" + prefix + "-" + paddedCount;

    // 7. Write token into column B
    sheet.getRange(newRow, COL_TOKEN).setValue(tokenNumber);

    // 7a. A number starting with "+" would be read by Sheets as a number and lose its "+":
    //     force those cells to plain text. Indian 10-digit numbers are left exactly as before.
    if (studentPhone.charAt(0) === "+") sheet.getRange(newRow, COL_STUDENT_CONTACT).setNumberFormat("@").setValue(studentPhone);
    if (fatherPhone.charAt(0)  === "+") sheet.getRange(newRow, COL_FATHER_CONTACT).setNumberFormat("@").setValue(fatherPhone);
    if (motherPhone.charAt(0)  === "+") sheet.getRange(newRow, COL_MOTHER_CONTACT).setNumberFormat("@").setValue(motherPhone);

    // 7b. Stream / branch / entrance score / campaign tracking (columns R-X).
    //     Skipped (and logged) if the tab already uses R-X for something else, so we never mix data in.
    var trackingFree = ensureLeadHeaders_(sheet);
    var utm = {
      source:   String(p.utm_source   || "").trim(),
      medium:   String(p.utm_medium   || "").trim(),
      campaign: String(p.utm_campaign || "").trim(),
      gclid:    String(p.gclid        || "").trim()
    };
    if (trackingFree) {
      sheet.getRange(newRow, COL_STREAM, 1, 7).setValues([[
        streamName, branchName, entranceScore, utm.source, utm.medium, utm.campaign, utm.gclid
      ]]);
    } else {
      console.log("Columns R-X on '" + sheet.getName() + "' are in use - tracking columns NOT written for " + tokenNumber);
    }

    // 8. Add all links
    addDashboardLink(sheet, newRow, tokenNumber);
    addCounsellingLink(sheet, newRow, tokenNumber);
    addDownloadLink(sheet, newRow, tokenNumber);

    // 9. Alerts. Never allowed to break the response: the lead is already saved.
    var lead = {
      token: tokenNumber, name: String(p.fullName || "").trim(), phone: studentPhone,
      stream: streamName, branch: branchName,
      score: isEngineering ? entranceScore : neetRank,
      scoreLabel: isEngineering ? "JEE / MHT-CET percentile" : "NEET rank (AIR)",
      city: p.city || "", category: p.category || "", courses: courses, budget: budget,
      utm: utm, sheet: sheet.getName()
    };
    try { sendLeadEmail_(lead); }     catch (mailErr) { console.log("sendLeadEmail_ error: " + mailErr); }
    try { sendWhatsAppAlert_(lead); } catch (waErr)   { console.log("sendWhatsAppAlert_ error: " + waErr); }

    // 10. Return token to the form
    return ContentService
      .createTextOutput(tokenNumber)
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService
      .createTextOutput("Error: " + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);

  } finally {
    lock.releaseLock();
  }
}


// ════════════════════════════════════════════════════════════════
//  doGet — Handles dashboard data fetch by token
// ════════════════════════════════════════════════════════════════

function doGet(e) {
  try {
    var token = e.parameter.token;

    if (!token || token.trim() === "") {
      return jsonResponse({ error: "No token provided. Usage: ?token=26-AND-001" });
    }

    token = token.trim();

    var ss         = SpreadsheetApp.getActiveSpreadsheet();
    var foundData  = null;
    var foundSheet = null;

    for (var i = 0; i < BRANCH_SHEETS.length; i++) {
      var sheet = ss.getSheetByName(BRANCH_SHEETS[i]);
      if (!sheet) continue;

      var lastRow = sheet.getLastRow();
      if (lastRow < 2) continue;

      var colsToFetch = Math.max(COL_GCLID, sheet.getLastColumn());
      if (colsToFetch > sheet.getMaxColumns()) {
        sheet.insertColumnsAfter(sheet.getMaxColumns(), colsToFetch - sheet.getMaxColumns());
      }

      var allData = sheet.getRange(2, 1, lastRow - 1, colsToFetch).getValues();

      for (var r = 0; r < allData.length; r++) {
        var rowToken = String(allData[r][COL_TOKEN - 1]).trim();
        if (rowToken === token) {
          foundData  = allData[r];
          foundSheet = BRANCH_SHEETS[i];
          break;
        }
      }

      if (foundData) break;
    }

    if (!foundData) {
      return jsonResponse({ error: "Token not found: " + token });
    }

    var parsedShortlist = [];
    var rawShortlist = String(foundData[COL_SHORTLIST - 1] || "").trim();
    if (rawShortlist) {
      try { parsedShortlist = JSON.parse(rawShortlist); } catch (err) {}
    }

    var studentData = {
      token:          String(foundData[COL_TOKEN           - 1]).trim(),
      name:           String(foundData[COL_FULLNAME        - 1]).trim(),
      studentContact: String(foundData[COL_STUDENT_CONTACT - 1]).trim(),
      rank:           parseInt(foundData[COL_NEET_RANK     - 1]) || 0,
      fatherContact:  String(foundData[COL_FATHER_CONTACT  - 1]).trim(),
      motherContact:  String(foundData[COL_MOTHER_CONTACT  - 1]).trim(),
      coaching:       String(foundData[COL_COACHING        - 1]).trim(),
      city:           String(foundData[COL_CITY            - 1]).trim(),
      category:       String(foundData[COL_CATEGORY        - 1]).trim(),
      courses:        String(foundData[COL_COURSES         - 1]).trim(),
      budget:         String(foundData[COL_BUDGET          - 1]).trim(),
      shortlist:      parsedShortlist,
      branch:         foundSheet,
      stream:         String(foundData[COL_STREAM         - 1] || "").trim(),
      leadBranch:     String(foundData[COL_LEAD_BRANCH    - 1] || "").trim(),
      entranceScore:  String(foundData[COL_ENTRANCE_SCORE - 1] || "").trim(),
      timestamp:      foundData[COL_TIMESTAMP - 1]
                        ? Utilities.formatDate(
                            new Date(foundData[COL_TIMESTAMP - 1]),
                            Session.getScriptTimeZone(),
                            "dd MMM yyyy, hh:mm a"
                          )
                        : ""
    };

    return jsonResponse({ success: true, data: studentData });

  } catch (error) {
    return jsonResponse({ error: "Server error: " + error.toString() });
  }
}


// ════════════════════════════════════════════════════════════════
//  Helper — Returns a JSON response
// ════════════════════════════════════════════════════════════════

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


// ═══════════════════════════════════════════════════════════
//  Lead helpers: normalising, engineering tab, alerts
// ═══════════════════════════════════════════════════════════

// "ANDHERI" / "andheri " -> "Andheri"; anything unknown -> "Online"
function normalizeBranch_(raw) {
  var want = String(raw || "").trim().toLowerCase();
  for (var i = 0; i < BRANCH_SHEETS.length; i++) {
    if (BRANCH_SHEETS[i] === ENGINEERING_SHEET) continue;   // not a branch
    if (BRANCH_SHEETS[i].toLowerCase() === want) return BRANCH_SHEETS[i];
  }
  return "Online";
}

// Returns the normalised phone number, or "" if invalid.
//   India:  "+91 98765 43210" / "98765-43210" / "098765 43210"  -> "9876543210"  (10 digits, starts 6-9)
//   Abroad: "+971 50 123 4567" / "+1 415 555 2671" / "+44 20 7946 0958" -> "+971501234567" (8-15 digits total)
//   A non-Indian number without the leading "+" is rejected (indistinguishable from a typo).
//   allowIntl=false (engineering leads): non-Indian numbers are rejected even with a "+".
function normalizePhone_(v, allowIntl) {
  var s = String(v || "").replace(/[^0-9+]/g, "");
  var hasPlus = s.charAt(0) === "+";
  var d = s.replace(/[+]/g, "");
  if (hasPlus) {
    if (d.indexOf("91") === 0) {
      d = d.slice(2);
      return /^[6-9][0-9]{9}$/.test(d) ? d : "";
    }
    return allowIntl && /^[1-9][0-9]{7,14}$/.test(d) ? "+" + d : "";
  }
  if (d.length === 12 && d.indexOf("91") === 0) d = d.slice(2);
  else if (d.length === 11 && d.charAt(0) === "0") d = d.slice(1);
  return /^[6-9][0-9]{9}$/.test(d) ? d : "";
}

// Creates the Engineering tab on first use, with the same A-L headers as "Online".
function getEngineeringSheet_(ss) {
  var sh = ss.getSheetByName(ENGINEERING_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(ENGINEERING_SHEET);
  var online = ss.getSheetByName("Online");
  if (online && online.getLastColumn() >= 12) {
    online.getRange(1, 1, 1, 12).copyTo(sh.getRange(1, 1, 1, 12));
  } else {
    sh.getRange(1, 1, 1, 12).setValues([[
      "Timestamp", "Token", "Full Name", "Student Contact", "NEET Rank", "Father Contact",
      "Mother Contact", "Coaching Class", "City", "Category", "Courses", "Budget"
    ]]);
  }
  sh.getRange(1, COL_NEET_RANK).setValue("NEET Rank (n/a - see Entrance Score)");
  return sh;
}

// Writes the R-X headers once per tab. Returns true if R-X belong to us (safe to write),
// false if something else already uses R1:X1 (then nothing is written there).
function ensureLeadHeaders_(sheet) {
  // Reading a range outside the grid throws in Sheets, so make sure columns R-X exist first.
  if (COL_GCLID > sheet.getMaxColumns()) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), COL_GCLID - sheet.getMaxColumns());
  }
  var existing = sheet.getRange(1, COL_STREAM, 1, LEAD_HEADERS.length).getValues()[0];
  var used = false;
  for (var i = 0; i < existing.length; i++) if (String(existing[i]).trim() !== "") used = true;
  if (used) return String(existing[0]).trim() === LEAD_HEADERS[0];   // already our headers
  var hdr = sheet.getRange(1, COL_STREAM, 1, LEAD_HEADERS.length);
  hdr.setValues([LEAD_HEADERS]);
  hdr.setFontWeight("bold");
  hdr.setBackground("#1a0040");
  hdr.setFontColor("#FFD700");
  hdr.setHorizontalAlignment("center");
  return true;
}

// READ-ONLY. Run once from the Apps Script editor on the sheet COPY before deploying:
// lists, per tab, how many non-empty cells already exist in columns R-X. Everything
// should say 0 (or only our own headers). Nothing is written.
function auditLeadColumns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var names = BRANCH_SHEETS.slice();
  var report = [];
  for (var i = 0; i < names.length; i++) {
    var sh = ss.getSheetByName(names[i]);
    if (!sh) { report.push(names[i] + ": (tab not found)"); continue; }
    var last = sh.getLastRow();
    var maxC = sh.getMaxColumns();
    if (last < 1 || maxC < COL_STREAM) { report.push(names[i] + ": 0 cells in R-X"); continue; }
    var width = Math.min(LEAD_HEADERS.length, maxC - COL_STREAM + 1);
    var vals = sh.getRange(1, COL_STREAM, last, width).getValues();
    var n = 0;
    for (var r = 0; r < vals.length; r++) for (var c = 0; c < vals[r].length; c++) if (String(vals[r][c]).trim() !== "") n++;
    report.push(names[i] + ": " + n + " non-empty cell(s) in R-X");
  }
  console.log(report.join("\n"));
  return report;
}

// Email alert to the counsellor inbox: name, phone, score, branch, source.
function sendLeadEmail_(lead) {
  var to = String(LEAD_ALERT_EMAIL || "").trim();
  if (!to) { console.log("LEAD_ALERT_EMAIL is empty - email alert skipped"); return; }
  if (lead.branch === "Seminar" && !ALERT_ON_SEMINAR) return;

  var src = [];
  if (lead.utm.source)   src.push("utm_source="   + lead.utm.source);
  if (lead.utm.medium)   src.push("utm_medium="   + lead.utm.medium);
  if (lead.utm.campaign) src.push("utm_campaign=" + lead.utm.campaign);
  if (lead.utm.gclid)    src.push("gclid="        + lead.utm.gclid);

  var body = [
    "New " + lead.stream + " lead",
    "",
    "Name:    " + lead.name,
    "Phone:   " + lead.phone,
    lead.scoreLabel + ": " + lead.score,
    "Branch:  " + lead.branch,
    "Source:  " + (src.length ? src.join(", ") : "direct / no campaign tags"),
    "",
    "City: " + lead.city + "   Category: " + lead.category,
    "Courses: " + lead.courses,
    "Budget: " + lead.budget,
    "",
    "Token: " + lead.token + "   (sheet tab: " + lead.sheet + ")",
    "Counselling view: " + DASHBOARD_URL + "?token=" + encodeURIComponent(lead.token) + "&mode=counsel"
  ].join("\n");

  MailApp.sendEmail({
    to: to,
    subject: "[New lead] " + lead.name + " - " + lead.stream + " - " + lead.branch,
    body: body,
    name: "ASMI Lead Alerts"
  });
}

// ──────────────────────────────────────────────────────────
//  >>> WHATSAPP ALERT HOOK (not implemented yet) <<<
//  Called once per new lead, after the row is saved and the email is sent.
//  To add WhatsApp later, fill this in with UrlFetchApp.fetch(...) to your
//  WhatsApp Business API provider, using the `lead` fields
//  (name, phone, stream, branch, score, token, utm).
//  Errors here are caught by the caller and cannot break lead capture.
// ──────────────────────────────────────────────────────────
function sendWhatsAppAlert_(lead) {
  // TODO(WhatsApp): intentionally empty.
}


// ════════════════════════════════════════════════════════════════
//  Helper — Adds sales pitch dashboard link to column M
// ════════════════════════════════════════════════════════════════

function addDashboardLink(sheet, rowNum, token) {
  try {
    var headerCell = sheet.getRange(1, COL_DASHBOARD_LINK);
    if (!headerCell.getValue()) {
      headerCell.setValue("Dashboard Link");
      headerCell.setFontWeight("bold");
      headerCell.setBackground("#F5A623");
      headerCell.setFontColor("#0A2472");
      headerCell.setHorizontalAlignment("center");
      sheet.setColumnWidth(COL_DASHBOARD_LINK, 165);
    }

    var url     = DASHBOARD_URL + "?token=" + encodeURIComponent(token);
    var formula = '=HYPERLINK("' + url + '","▶ Open Dashboard")';
    var cell    = sheet.getRange(rowNum, COL_DASHBOARD_LINK);
    cell.setFormula(formula);
    cell.setFontColor("#1A3A8F");
    cell.setFontWeight("bold");
    cell.setHorizontalAlignment("center");

  } catch (err) {
    console.log("addDashboardLink error: " + err.toString());
  }
}


// ════════════════════════════════════════════════════════════════
//  Helper — Adds counselling dashboard link to column N
// ════════════════════════════════════════════════════════════════

function addCounsellingLink(sheet, rowNum, token) {
  try {
    var headerCell = sheet.getRange(1, COL_COUNSELLING_LINK);
    if (!headerCell.getValue()) {
      headerCell.setValue("Counselling Link");
      headerCell.setFontWeight("bold");
      headerCell.setBackground("#6a0dad");
      headerCell.setFontColor("#FFD700");
      headerCell.setHorizontalAlignment("center");
      sheet.setColumnWidth(COL_COUNSELLING_LINK, 175);
    }

    var url     = DASHBOARD_URL + "?token=" + encodeURIComponent(token) + "&mode=counsel";
    var formula = '=HYPERLINK("' + url + '","▶ Counselling View")';
    var cell    = sheet.getRange(rowNum, COL_COUNSELLING_LINK);
    cell.setFormula(formula);
    cell.setFontColor("#6a0dad");
    cell.setFontWeight("bold");
    cell.setHorizontalAlignment("center");

  } catch (err) {
    console.log("addCounsellingLink error: " + err.toString());
  }
}


// ════════════════════════════════════════════════════════════════
//  Helper — Adds PDF download link to column Q
// ════════════════════════════════════════════════════════════════

function addDownloadLink(sheet, rowNum, token) {
  try {
    var headerCell = sheet.getRange(1, COL_DOWNLOAD_LINK);
    if (!headerCell.getValue()) {
      headerCell.setValue("Download Report");
      headerCell.setFontWeight("bold");
      headerCell.setBackground("#2e7d32");
      headerCell.setFontColor("#ffffff");
      headerCell.setHorizontalAlignment("center");
      sheet.setColumnWidth(COL_DOWNLOAD_LINK, 165);
    }

    var url     = "https://asmicareer.in/slide4_recommended.html?token=" + encodeURIComponent(token) + "&mode=counsel&download=1";
    var formula = '=HYPERLINK("' + url + '","⬇ Download PDF")';
    var cell    = sheet.getRange(rowNum, COL_DOWNLOAD_LINK);
    cell.setFormula(formula);
    cell.setFontColor("#2e7d32");
    cell.setFontWeight("bold");
    cell.setHorizontalAlignment("center");

  } catch (err) {
    console.log("addDownloadLink error: " + err.toString());
  }
}


// ════════════════════════════════════════════════════════════════
//  onFormSubmit — Trigger: fires when Google Form submits
// ════════════════════════════════════════════════════════════════

function onFormSubmit(e) {
  try {
    var sheet   = e.source.getActiveSheet();
    var lastRow = sheet.getLastRow();
    var token   = sheet.getRange(lastRow, COL_TOKEN).getValue();

    if (!token) return;

    addDashboardLink(sheet, lastRow, String(token));
    addCounsellingLink(sheet, lastRow, String(token));
    addDownloadLink(sheet, lastRow, String(token));

  } catch (err) {
    console.log("onFormSubmit error: " + err.toString());
  }
}


// ════════════════════════════════════════════════════════════════
//  onEdit — Trigger: fires when token typed/pasted into col B
// ════════════════════════════════════════════════════════════════

function onEdit(e) {
  try {
    var range = e.range;
    var sheet = range.getSheet();

    // Only act on token column (B) and data rows
    if (range.getColumn() !== COL_TOKEN) return;
    var row = range.getRow();
    if (row < 2) return;

    var token = String(range.getValue()).trim();
    if (!token) return;

    // Skip if links already exist
    var existingLink = sheet.getRange(row, COL_DASHBOARD_LINK).getValue();
    if (existingLink) return;

    addDashboardLink(sheet, row, token);
    addCounsellingLink(sheet, row, token);
    addDownloadLink(sheet, row, token);

  } catch (err) {
    console.log("onEdit error: " + err.toString());
  }
}


// ════════════════════════════════════════════════════════════════
//  backfillDashboardLinks — Run ONCE manually after deploy
// ════════════════════════════════════════════════════════════════

function backfillDashboardLinks() {
  var ss      = SpreadsheetApp.getActiveSpreadsheet();
  var total   = 0;
  var skipped = 0;

  for (var s = 0; s < BRANCH_SHEETS.length; s++) {
    var sheet = ss.getSheetByName(BRANCH_SHEETS[s]);
    if (!sheet) { console.log("Sheet not found: " + BRANCH_SHEETS[s]); continue; }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) { console.log("No data rows in: " + BRANCH_SHEETS[s]); continue; }

    // Ensure headers
    var headerM = sheet.getRange(1, COL_DASHBOARD_LINK);
    if (!headerM.getValue()) {
      headerM.setValue("Dashboard Link");
      headerM.setFontWeight("bold");
      headerM.setBackground("#F5A623");
      headerM.setFontColor("#0A2472");
      headerM.setHorizontalAlignment("center");
      sheet.setColumnWidth(COL_DASHBOARD_LINK, 165);
    }

    var headerN = sheet.getRange(1, COL_COUNSELLING_LINK);
    if (!headerN.getValue()) {
      headerN.setValue("Counselling Link");
      headerN.setFontWeight("bold");
      headerN.setBackground("#6a0dad");
      headerN.setFontColor("#FFD700");
      headerN.setHorizontalAlignment("center");
      sheet.setColumnWidth(COL_COUNSELLING_LINK, 175);
    }

    var headerQ = sheet.getRange(1, COL_DOWNLOAD_LINK);
    if (!headerQ.getValue()) {
      headerQ.setValue("Download Report");
      headerQ.setFontWeight("bold");
      headerQ.setBackground("#2e7d32");
      headerQ.setFontColor("#ffffff");
      headerQ.setHorizontalAlignment("center");
      sheet.setColumnWidth(COL_DOWNLOAD_LINK, 165);
    }

    var tokens = sheet.getRange(2, COL_TOKEN, lastRow - 1, 1).getValues();

    for (var r = 0; r < tokens.length; r++) {
      var token = String(tokens[r][0]).trim();
      if (!token || token === "") { skipped++; continue; }

      var rowNum = r + 2;

      // Dashboard link (M)
      var url     = DASHBOARD_URL + "?token=" + encodeURIComponent(token);
      var formula = '=HYPERLINK("' + url + '","▶ Open Dashboard")';
      var cellM   = sheet.getRange(rowNum, COL_DASHBOARD_LINK);
      cellM.setFormula(formula);
      cellM.setFontColor("#1A3A8F");
      cellM.setFontWeight("bold");
      cellM.setHorizontalAlignment("center");

      // Counselling link (N)
      var counselUrl     = DASHBOARD_URL + "?token=" + encodeURIComponent(token) + "&mode=counsel";
      var counselFormula = '=HYPERLINK("' + counselUrl + '","▶ Counselling View")';
      var cellN          = sheet.getRange(rowNum, COL_COUNSELLING_LINK);
      cellN.setFormula(counselFormula);
      cellN.setFontColor("#6a0dad");
      cellN.setFontWeight("bold");
      cellN.setHorizontalAlignment("center");

      // Download link (Q)
      var dlUrl     = "https://asmicareer.in/slide4_recommended.html?token=" + encodeURIComponent(token) + "&mode=counsel&download=1";
      var dlFormula = '=HYPERLINK("' + dlUrl + '","⬇ Download PDF")';
      var cellQ     = sheet.getRange(rowNum, COL_DOWNLOAD_LINK);
      cellQ.setFormula(dlFormula);
      cellQ.setFontColor("#2e7d32");
      cellQ.setFontWeight("bold");
      cellQ.setHorizontalAlignment("center");

      total++;
    }

    SpreadsheetApp.flush();
    console.log("Done: " + BRANCH_SHEETS[s] + " — " + tokens.length + " rows processed");
  }

  Browser.msgBox(
    "Backfill Complete!\n\n" +
    "Rows updated: " + total + "\n" +
    "Rows skipped (no token): " + skipped + "\n\n" +
    "Column M — Sales Dashboard links\n" +
    "Column N — Counselling View links\n" +
    "Column Q — PDF Download links"
  );
}


// ════════════════════════════════════════════════════════════════
//  testGetHandler — Test function (optional)
// ════════════════════════════════════════════════════════════════

function testGetHandler() {
  var fakeEvent = {
    parameter: {
      token: "26-ONL-001"  // ← Replace with a real token from your sheet
    }
  };

  var result = doGet(fakeEvent);
  var text   = result.getContent();
  console.log("doGet result:", text);

  var parsed = JSON.parse(text);
  if (parsed.error) {
    Browser.msgBox("❌ Error: " + parsed.error + "\n\nMake sure the token exists in your sheet.");
  } else {
    Browser.msgBox(
      "✅ doGet working!\n\n" +
      "Name: "     + parsed.data.name     + "\n" +
      "Rank: "     + parsed.data.rank     + "\n" +
      "Category: " + parsed.data.category + "\n" +
      "Courses: "  + parsed.data.courses  + "\n" +
      "Branch: "   + parsed.data.branch
    );
  }
}
