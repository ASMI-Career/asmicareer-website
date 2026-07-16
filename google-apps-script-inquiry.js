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

var BRANCH_SHEETS = [
  "Online",
  "Andheri",
  "Thane",
  "Pune",
  "Kolhapur",
  "Sangli",
  "Sambhajinagar",
  "Seminar"
];

var BRANCH_PREFIXES = {
  "online":        "ONL",
  "andheri":       "AND",
  "thane":         "THA",
  "pune":          "PUN",
  "kolhapur":      "KOL",
  "sangli":        "SAN",
  "sambhajinagar": "SAM",
  "seminar":       "SEM"
};

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

    // 1. Identify source
    var rawSource  = e.parameter.source || "Online";
    var sourceName = rawSource.charAt(0).toUpperCase() + rawSource.slice(1).toLowerCase();

    // 2. Select matching tab
    var sheet = ss.getSheetByName(sourceName);
    if (!sheet) {
      sheet      = ss.getSheetByName("Online");
      sourceName = "Online";
    }

    // 3. Determine branch prefix
    var prefix      = "ONL";
    var lowerSource = sourceName.toLowerCase();
    if (BRANCH_PREFIXES[lowerSource]) {
      prefix = BRANCH_PREFIXES[lowerSource];
    }

    // 4. Get form values
    var timestamp = new Date();
    var courses   = e.parameter.courses || "";
    var budget    = e.parameter.budget  || "";

    // 5. Append row first (token placeholder empty)
    sheet.appendRow([
      timestamp,
      "",   // token — filled in step 6
      e.parameter.fullName       || "",
      e.parameter.studentContact || "",
      e.parameter.neetRank       || "",
      e.parameter.fatherContact  || "",
      e.parameter.motherContact  || "",
      e.parameter.coachingClass  || "",
      e.parameter.city           || "",
      e.parameter.category       || "",
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

    // 8. Add all links
    addDashboardLink(sheet, newRow, tokenNumber);
    addCounsellingLink(sheet, newRow, tokenNumber);
    addDownloadLink(sheet, newRow, tokenNumber);

    // 9. Return token to the form
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

      var colsToFetch = Math.max(COL_SHORTLIST, sheet.getLastColumn());
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

    var url     = "https://asmicareer.in/slide4_recommended.html?token=" + encodeURIComponent(token) + "&download=1";
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
      var dlUrl     = "https://asmicareer.in/slide4_recommended.html?token=" + encodeURIComponent(token) + "&download=1";
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
