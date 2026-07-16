const SHEET_NAME = 'Student Dashboard';

function doGet(e) {
  try {
    const action = e.parameter.action;
    const token = e.parameter.token;

    if (action === 'getStudent' && token) {
      return getStudent(token);
    }

    if (action === 'saveDocStatus' && token) {
      return saveDocStatus(token, e.parameter.data);
    }

    return jsonOut({ error: 'invalid_action' });

  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'saveShortlist') {
      return saveShortlist(data.token, data.colleges);
    }

    return jsonOut({ error: 'invalid_action' });

  } catch (err) {
    return jsonOut({ error: err.message });
  }
}

function getStudent(token) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  let studentRow = null;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === token) {
      studentRow = data[i];
      break;
    }
  }

  if (!studentRow) {
    return jsonOut({ error: 'not_found' });
  }

  // Shortlist now lives as a single JSON string in column N (index 13) —
  // replaces the old col 14-36 name/probability/cr spread (no legacy data to preserve).
  let savedColleges = [];
  try {
    savedColleges = studentRow[13] ? JSON.parse(studentRow[13]) : [];
  } catch (err) {
    savedColleges = [];
  }

  const student = {
    token:               studentRow[1],   // B
    date_added:          studentRow[2],   // C
    name:                studentRow[3],   // D
    score:               studentRow[4],   // E
    rank:                studentRow[5],   // F
    category:            studentRow[6],   // G
    counsellor_name:     studentRow[7],   // H
    counsellor_whatsapp: studentRow[8],   // I
    whatsapp_group_link: studentRow[9],   // J
    stage:               studentRow[10],  // K
    dashboard_url:       studentRow[11],  // L
    inquiry_token:       studentRow[12],  // M
    saved_colleges:      savedColleges,   // N (single JSON cell)
    document_status:     studentRow[37] || null,  // AJ
  };

  return jsonOut({ success: true, data: student });
}

function saveDocStatus(token, data) {
  if (!data) return jsonOut({ error: 'no_data' });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === token) {
      sheet.getRange(i + 1, 38).setValue(data); // col AJ = column 38 (1-indexed)
      return jsonOut({ success: true });
    }
  }

  return jsonOut({ error: 'not_found' });
}

function saveShortlist(token, colleges) {
  if (!token) {
    return jsonOut({ error: 'not_found' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === token) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) {
    return jsonOut({ error: 'not_found' });
  }

  sheet.getRange(rowIndex, 14).setValue(JSON.stringify(colleges || []));

  return jsonOut({ success: true, count: (colleges || []).length });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
