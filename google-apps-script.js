/**
 * ASMI Career Student Dashboard & Shortlist Apps Script Endpoint
 * 
 * Instructions for Deployment:
 * 1. Open your Google Sheet (e.g., the sheet containing "Registered Students").
 * 2. Navigate to Extensions > Apps Script.
 * 3. Delete any existing code in Code.gs and paste this script.
 * 4. (Optional) Check the SHEET_NAME variable (defaults to "Registered Students").
 * 5. Click Save (disk icon).
 * 6. Click Deploy > New Deployment.
 * 7. Click the gear icon (Select type) next to "Deploy" and choose "Web app".
 * 8. Set Configuration:
 *    - Description: ASMI Student Portal API
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone"
 * 9. Click Deploy, authorise permissions, and copy the "Web app URL" (ends in /exec).
 * 10. Update the APPS_SCRIPT_URL constant in both dashboard.html and public/student/index.html with this new URL if it changed.
 */

const SHEET_NAME = "Registered Students";

// Helper to return JSON response with CORS headers enabled
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handle HTTP GET Requests (e.g. fetching student profile)
function doGet(e) {
  return handleRequest(e);
}

// Handle HTTP POST Requests (e.g. saving shortlisted colleges)
function doPost(e) {
  return handleRequest(e);
}

// Core Request Router
function handleRequest(e) {
  var params = e.parameter || {};
  
  // Parse POST body parameters if sent in url-encoded format
  if (e.postData && e.postData.contents) {
    try {
      var parts = e.postData.contents.split('&');
      for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].split('=');
        if (pair.length === 2) {
          params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
      }
    } catch (err) {
      // Fallback: try parsing JSON body directly
      try {
        var json = JSON.parse(e.postData.contents);
        for (var key in json) {
          params[key] = json[key];
        }
      } catch (jsonErr) {}
    }
  }

  var action = params.action;
  if (!action) {
    if (params.token) {
      action = "getStudent";
    } else {
      return jsonResponse({ success: false, error: "Missing action parameter" });
    }
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse({ success: false, error: "Sheet '" + SHEET_NAME + "' not found" });
    }

    if (action === "getStudent") {
      return getStudent(sheet, params.token);
    } else if (action === "saveShortlist") {
      return saveShortlist(sheet, params.token, params.shortlist);
    } else {
      return jsonResponse({ success: false, error: "Unknown action: " + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// API Action: Fetch Student Profile
function getStudent(sheet, token) {
  if (!token) {
    return jsonResponse({ success: false, error: "Missing token parameter" });
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return jsonResponse({ success: false, error: "not_found" });
  }

  // Normalize column headers to lowercase snake_case
  var headers = data[0].map(function(h) { 
    return h.toString().trim().toLowerCase().replace(/\s+/g, '_'); 
  });
  
  var tokenColIdx = headers.indexOf("token");
  if (tokenColIdx === -1) {
    return jsonResponse({ success: false, error: "Token column not found in sheet" });
  }

  var studentRowIdx = -1;
  for (var r = 1; r < data.length; r++) {
    if (data[r][tokenColIdx].toString().trim() === token.trim()) {
      studentRowIdx = r;
      break;
    }
  }

  if (studentRowIdx === -1) {
    return jsonResponse({ success: false, error: "not_found" });
  }

  var studentRow = data[studentRowIdx];
  var student = {};

  for (var c = 0; c < headers.length; c++) {
    var key = headers[c];
    if (!key) continue;
    var val = studentRow[c];

    // Handle columns specially
    if (key === "colleges" || key === "shortlist") {
      try {
        student["colleges"] = val ? JSON.parse(val.toString()) : [];
      } catch (err) {
        student["colleges"] = []; // Fallback to empty list if invalid JSON
      }
    } else {
      student[key] = val;
    }
  }

  return jsonResponse({ success: true, data: student });
}

// API Action: Save Shortlisted Colleges
function saveShortlist(sheet, token, shortlistStr) {
  if (!token) {
    return jsonResponse({ success: false, error: "Missing token parameter" });
  }
  if (!shortlistStr) {
    return jsonResponse({ success: false, error: "Missing shortlist parameter" });
  }

  // Validate JSON structure
  try {
    JSON.parse(shortlistStr);
  } catch (e) {
    return jsonResponse({ success: false, error: "Invalid JSON format for shortlist" });
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    return jsonResponse({ success: false, error: "Student not found (empty sheet)" });
  }

  var headers = data[0].map(function(h) { 
    return h.toString().trim().toLowerCase().replace(/\s+/g, '_'); 
  });
  
  var tokenColIdx = headers.indexOf("token");
  var collegesColIdx = headers.indexOf("colleges");
  if (collegesColIdx === -1) {
    collegesColIdx = headers.indexOf("shortlist");
  }

  if (tokenColIdx === -1) {
    return jsonResponse({ success: false, error: "Token column not found in sheet" });
  }
  if (collegesColIdx === -1) {
    return jsonResponse({ success: false, error: "Colleges/Shortlist column not found in sheet" });
  }

  var studentRowIdx = -1;
  for (var r = 1; r < data.length; r++) {
    if (data[r][tokenColIdx].toString().trim() === token.trim()) {
      studentRowIdx = r;
      break;
    }
  }

  if (studentRowIdx === -1) {
    return jsonResponse({ success: false, error: "Student token not found" });
  }

  // Write shortlist string directly to the colleges column cell
  // (row and col are 1-indexed; studentRowIdx is 0-indexed offset, so row is studentRowIdx + 1)
  sheet.getRange(studentRowIdx + 1, collegesColIdx + 1).setValue(shortlistStr);

  return jsonResponse({ success: true });
}
