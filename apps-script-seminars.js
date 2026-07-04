/**
 * ══════════════════════════════════════════════════════════════
 *  ASMI Career — Complete Google Apps Script
 *  Google Sheet: ASMI Career NEET 2026 Seminar RSVP (Responses)
 *  Sheet ID: 1g2g-aZsZUfotGpTjAE1b03J_iqITul7RPh9_PlDTzmI
 *
 *  HOW TO USE:
 *  1. Open your Google Sheet → Extensions → Apps Script
 *  2. DELETE everything in Code.gs
 *  3. PASTE THIS ENTIRE FILE
 *  4. Click Save (💾)
 *  5. Deploy → New Deployment
 *       Type         : Web App
 *       Execute as   : Me
 *       Who can access: Anyone
 *  6. Click Deploy → Authorise → Copy the Web App URL
 *  7. Paste that URL into events/page.js line 12 (APPS_SCRIPT_URL)
 * ══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
//  SECTION 1 — EXISTING GOOGLE FORM SYSTEM (unchanged)
// ═══════════════════════════════════════════════════════════════

const CONFIG = {

  SHEET_NAME: "Form Responses 2",

  // ── Capacity per venue ──────────────────────────────────────
  CAPACITY_MULUND:     300,
  CAPACITY_VILE_PARLE: 350,
  CAPACITY_PUNE: 375,   // was 300
  CAPACITY_KOLHAPUR:   300,

  // ── Admin ───────────────────────────────────────────────────
  ADMIN_EMAIL:     "devang@asmicareer.com",
  ALERT_THRESHOLD: 25,

  // ── Logo ────────────────────────────────────────────────────
  LOGO_URL: "https://drive.google.com/uc?export=view&id=1QjeUDWuX8W9iEungvT4cqaYrqndyUErJ",

  // ── Venues ──────────────────────────────────────────────────
  VENUE_DETAILS: {

    MULUND: {
      label:   "Thane",
      date:    "28 June 2026",
      time:    "TBD",
      address: "Balaji Banquets, Balaji Mandir, Dr. Ambedkar Road, Mulund West, Mumbai",
      maps:    "https://maps.app.goo.gl/SjD5JV4FUGY68Fyj7",
      phone:   "7410019075",
      email:   "thane@asmicareer.com"
    },

    VILE_PARLE: {
      label:   "Vile Parle",
      date:    "05 July 2026",
      time:    "11 AM to 1 PM",
      address: "P.L Deshpande Hall, Lokmanya Seva Sangh, Vile Parle East, Mumbai",
      maps:    "https://maps.app.goo.gl/hJzA2trDnim5roQs5",
      phone:   "7410019077",
      email:   "mumbai@asmicareer.com"
    },

    PUNE: {
      label:   "Pune",
      date:    "12 July 2026",    // was "TBD"
      time:    "11 AM to 1 PM",   // was "TBD"
      address: "Bharatiya Vidya Bhuvan's Sulochana Natu Vidya Mandir, Near Senapati Bapat Road, Dhotre Path, Shivajinagar, Pune, Maharashtra 411016",
      maps:    "https://maps.app.goo.gl/o3sd8LfJaowGyUsJ8",
      phone:   "7410013458",
      email:   "pune@asmicareer.com"
    },

    KOLHAPUR: {
      label:   "Kolhapur",
      date:    "TBD",
      time:    "TBD",
      address: "Deval Club & Sangeet Kendra and Govindrao Tembe Rangmandir, Kolhapur",
      maps:    "https://maps.app.goo.gl/3VZL8KHevSgwiDwh9?g_st=iw",
      phone:   "7057575833",
      email:   "helpdesk@asmicareer.com"
    },
    SANGLI: {
      label:   "Sangli",
      date:    "TBD",
      time:    "TBD",
      address: "Deval Club & Sangeet Kendra and Govindrao Tembe Rangmandir, Kolhapur",
      maps:    "https://maps.app.goo.gl/3VZL8KHevSgwiDwh9?g_st=iw",
      phone:   "7410019076",
      email:   "support@asmicareer.com"
    }
  }
};

// ── Helpers ─────────────────────────────────────────────────────

function cleanPhone(phone) {
  return phone.replace(/\D/g, "");
}

function getCallLink(phone) {
  return "tel:" + cleanPhone(phone);
}

function getWhatsAppLink(phone, venue) {
  var msg = encodeURIComponent(
    "Hi, I have registered for the " + venue + " seminar. I need assistance."
  );
  return "https://wa.me/" + cleanPhone(phone) + "?text=" + msg;
}

function getSeatCount(text) {
  if (!text) return 1;
  var t = text.toLowerCase().replace(/\s/g, "");
  if (t.includes("+2") || t.includes("2parent")) return 3;
  if (t.includes("+1") || t.includes("1parent")) return 2;
  return 1;
}

function getVenueKey(text) {
  if (!text) return null;
  text = text.toLowerCase();
  if (text.includes("mulund"))   return "MULUND";
  if (text.includes("vile"))     return "VILE_PARLE";
  if (text.includes("pune"))     return "PUNE";
  if (text.includes("kolhapur")) return "KOLHAPUR";
  return null;
}

function mapRow(headers, row) {
  var obj = {};
  headers.forEach(function(h, i) {
    var k = h.toLowerCase();
    if (k.includes("name"))     obj.name      = row[i];
    if (k.includes("email"))    obj.email     = row[i];
    if (k.includes("mobile"))   obj.phone     = row[i];
    if (k.includes("venue"))    obj.venue     = row[i];
    if (k.includes("attendee")) obj.attendees = row[i];
  });
  return obj;
}

// ── Form submit trigger ──────────────────────────────────────────

function onFormSubmit(e) {

  var ss    = SpreadsheetApp.openById(FormApp.getActiveForm().getDestinationId());
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  var data  = sheet.getDataRange().getValues();
  var row   = mapRow(data[0], data[data.length - 1]);

  var venueKey = getVenueKey(row.venue);
  if (!venueKey) return;

  var total    = countFromSheet(venueKey);

  var capacityMap = {
    MULUND:     CONFIG.CAPACITY_MULUND,
    VILE_PARLE: CONFIG.CAPACITY_VILE_PARLE,
    PUNE:       CONFIG.CAPACITY_PUNE,
    KOLHAPUR:   CONFIG.CAPACITY_KOLHAPUR
  };

  var remaining = capacityMap[venueKey] - total;

  if (remaining <= 0) {
    sendHousefullEmail(row.name, row.email, venueKey);
    addToWaitlist(row);
    updateVenueOptions();
    return;
  }

  sendConfirmationEmail(row.name, row.email, venueKey);
  addToConfirmed(row);

  if (remaining <= CONFIG.ALERT_THRESHOLD) {
    GmailApp.sendEmail(
      CONFIG.ADMIN_EMAIL,
      "Seats Running Low – " + venueKey,
      "Remaining Seats: " + remaining
    );
  }

  updateVenueOptions();
}

// ── Confirmation email (existing form bookings) ──────────────────

function sendConfirmationEmail(name, email, venueKey) {

  var v       = CONFIG.VENUE_DETAILS[venueKey];
  var subject = "ASMI Seminar Confirmed | " + v.label + " | " + v.date + " | " + v.time;

  var html =
    "<div style='font-family:Arial;max-width:600px;margin:auto;padding:20px;'>"

    + "<div style='text-align:center;margin-bottom:20px;'>"
    + "<img src='" + CONFIG.LOGO_URL + "' style='max-width:160px;height:auto;'>"
    + "</div>"

    + "<h2>Seat Confirmed</h2>"
    + "<p>Dear <b>" + name + "</b>,</p>"
    + "<p>Your seat is confirmed.</p>"
    + "<hr>"

    + "<h3>Venue Details</h3>"
    + "<p><b>" + v.address + "</b><br><br>"
    + "Date: " + v.date + "<br>"
    + "Time: " + v.time + "</p>"

    + "<p><a href='" + v.maps + "' target='_blank'>View Location</a></p>"

    + "<div style='margin-top:15px;'>"

    + "<a href='" + getCallLink(v.phone) + "'"
    + " style='display:inline-block;padding:12px 18px;background:#2e7d32;"
    + "color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;margin-right:10px;'>"
    + "<img src='https://cdn-icons-png.flaticon.com/512/724/724664.png'"
    + " style='width:16px;vertical-align:middle;margin-right:6px;'>"
    + "Call Now</a>"

    + "<a href='" + getWhatsAppLink(v.phone, v.label) + "' target='_blank'"
    + " style='display:inline-block;padding:12px 18px;background:#25D366;"
    + "color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;'>"
    + "<img src='https://cdn-icons-png.flaticon.com/512/733/733585.png'"
    + " style='width:18px;vertical-align:middle;margin-right:6px;'>"
    + "WhatsApp</a>"
    + "</div>"

    + "<p style='margin-top:12px;font-size:14px;'>"
    + "Call: <b>" + v.phone + "</b><br>Email: " + v.email + "</p>"

    + "<div style='font-size:12px;color:#555;margin-top:6px;'>"
    + "iPhone users: tap &amp; hold to call</div>"

    + "</div>";

  GmailApp.sendEmail(email, subject, "", { htmlBody: html });
}

function sendReminderEmail(name, email, venueKey) {

  var v       = CONFIG.VENUE_DETAILS[venueKey];
  var subject = "Reminder: " + v.label + " Seminar Tomorrow | " + v.time + " | ASMI Career";

  var html =
    "<div style='font-family:Arial;max-width:600px;margin:auto;padding:20px;'>"

    + "<div style='text-align:center;margin-bottom:20px;'>"
    + "<img src='" + CONFIG.LOGO_URL + "' style='max-width:160px;height:auto;'>"
    + "</div>"

    + "<h2>Reminder</h2>"
    + "<p>Dear <b>" + name + "</b>,</p>"
    + "<p>Your seminar is scheduled tomorrow.</p>"
    + "<hr>"

    + "<h3>Venue Details</h3>"
    + "<p><b>" + v.address + "</b><br><br>"
    + "Date: " + v.date + "<br>"
    + "Time: " + v.time + "</p>"

    + "<p><a href='" + v.maps + "' target='_blank'>View Location</a></p>"

    + "<div style='margin-top:15px;'>"

    + "<a href='" + getCallLink(v.phone) + "'"
    + " style='display:inline-block;padding:12px 18px;background:#2e7d32;"
    + "color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;margin-right:10px;'>"
    + "<img src='https://cdn-icons-png.flaticon.com/512/724/724664.png'"
    + " style='width:16px;vertical-align:middle;margin-right:6px;'>"
    + "Call Now</a>"

    + "<a href='" + getWhatsAppLink(v.phone, v.label) + "' target='_blank'"
    + " style='display:inline-block;padding:12px 18px;background:#25D366;"
    + "color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;'>"
    + "<img src='https://cdn-icons-png.flaticon.com/512/733/733585.png'"
    + " style='width:18px;vertical-align:middle;margin-right:6px;'>"
    + "WhatsApp</a>"
    + "</div>"

    + "<p style='margin-top:12px;font-size:14px;'>"
    + "Call: <b>" + v.phone + "</b><br>Email: " + v.email + "</p>"

    + "</div>";

  GmailApp.sendEmail(email, subject, "", { htmlBody: html });
}

function sendHousefullEmail(name, email, venueKey) {
  var v = CONFIG.VENUE_DETAILS[venueKey];
  GmailApp.sendEmail(
    email,
    v.label + " Seminar Full",
    "Dear " + name + ", you have been added to the waitlist."
  );
}

// ── Reminders (run this as a daily time-driven trigger) ──────────

function sendDailyReminders() {

  var ss      = SpreadsheetApp.openById(FormApp.getActiveForm().getDestinationId());
  var sheet   = ss.getSheetByName(CONFIG.SHEET_NAME);
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var today   = new Date();

  for (var i = 1; i < data.length; i++) {
    var row      = mapRow(headers, data[i]);
    var venueKey = getVenueKey(row.venue);
    if (!venueKey) continue;

    var venue       = CONFIG.VENUE_DETAILS[venueKey];
    var seminarDate = new Date(venue.date);
    var diff        = Math.ceil((seminarDate - today) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      sendReminderEmail(row.name, row.email, venueKey);
    }
  }
}

// ── Seat counter ─────────────────────────────────────────────────

function countFromSheet(venueKey) {

  var ss    = SpreadsheetApp.openById(FormApp.getActiveForm().getDestinationId());
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  var data  = sheet.getDataRange().getValues();
  var total = 0;

  for (var i = 1; i < data.length; i++) {
    if (getVenueKey(data[i][4]) === venueKey) {
      total += getSeatCount(data[i][5]);
    }
  }

  return total;
}

// ── Sheet helpers ────────────────────────────────────────────────

function addToConfirmed(row) {
  var sheet = getSheet("Confirmed");
  sheet.appendRow([row.name, row.email, row.phone, row.venue, new Date()]);
}

function addToWaitlist(row) {
  var sheet = getSheet("Waitlist");
  sheet.appendRow([row.name, row.email, row.phone, row.venue, new Date()]);
}

function getSheet(name) {
  var ss    = SpreadsheetApp.openById(FormApp.getActiveForm().getDestinationId());
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

// ── Update form venue options with seat counts ───────────────────

function updateVenueOptions() {

  var form = FormApp.getActiveForm();
  var item = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)[0].asMultipleChoiceItem();

  var capacityMap = {
    MULUND:     CONFIG.CAPACITY_MULUND,
    VILE_PARLE: CONFIG.CAPACITY_VILE_PARLE,
    PUNE:       CONFIG.CAPACITY_PUNE,
    KOLHAPUR:   CONFIG.CAPACITY_KOLHAPUR
  };

  var choices = [];

  Object.keys(CONFIG.VENUE_DETAILS).forEach(function(key) {
    var venue     = CONFIG.VENUE_DETAILS[key];
    var remaining = capacityMap[key] - countFromSheet(key);
    var text      = remaining > 0
      ? venue.label + " (" + venue.date + ", " + venue.time + ") — " + remaining + " seats left"
      : venue.label + " (" + venue.date + ", " + venue.time + ") — FULL";
    choices.push(item.createChoice(text));
  });

  item.setChoices(choices);
}


// ═══════════════════════════════════════════════════════════════
//  SECTION 2 — NEW WEBSITE BOOKING SYSTEM
//  Handles bookings from asmicareer.in/events page
// ═══════════════════════════════════════════════════════════════

// The same Google Sheet — new bookings go into a separate tab
var SEMINAR_SPREADSHEET_ID = "1g2g-aZsZUfotGpTjAE1b03J_iqITul7RPh9_PlDTzmI";
var SEMINAR_SHEET_NAME     = "Seminar Bookings 2026";

// ── Web App entry points ─────────────────────────────────────────

function doGet(e) {
  return handleWebBooking(e);
}

function doPost(e) {
  return handleWebBooking(e);
}

function handleWebBooking(e) {

  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var params = {};

    // Parse JSON body (sent from the website)
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        params = e.parameter || {};
      }
    } else {
      params = e.parameter || {};
    }

    if (params.action === "bookSeminar") {
      output.setContent(JSON.stringify(bookSeminar(params)));

    } else if (params.action === "verifySeminarTicket") {
      output.setContent(JSON.stringify(verifySeminarTicket(params.bookingId)));

    } else if (params.action === "addWalkIn") {
      output.setContent(JSON.stringify(addWalkIn(params)));

    } else if (params.action === "getRemainingSeats") {
      output.setContent(JSON.stringify(getRemainingSeats()));

    } else {
      output.setContent(JSON.stringify({
        success: false,
        error:   "Unknown action: " + params.action
      }));
    }

  } catch (err) {
    output.setContent(JSON.stringify({ success: false, error: err.toString() }));
  }

  return output;
}

// ── Helper to count booked seats for all seminars ────────────────
function getBookedSeatsCount() {
  var ss = SpreadsheetApp.openById(SEMINAR_SPREADSHEET_ID);
  var counts = {};

  // 1. Count new bookings from "Seminar Bookings 2026"
  var newSheet = ss.getSheetByName(SEMINAR_SHEET_NAME);
  if (newSheet) {
    var data = newSheet.getDataRange().getValues();
    if (data.length > 1) {
      var headers = data[0];
      var seminarIdIdx = headers.indexOf("SeminarID");
      var totalSeatsIdx = headers.indexOf("TotalSeats");

      if (seminarIdIdx !== -1 && totalSeatsIdx !== -1) {
        for (var i = 1; i < data.length; i++) {
          var semId = data[i][seminarIdIdx];
          var seats = parseInt(data[i][totalSeatsIdx]) || 1;
          if (semId) {
            counts[semId] = (counts[semId] || 0) + seats;
          }
        }
      }
    }
  }

  // 2. Count old Vile Parle bookings from "Form Responses 2" (postponed carry-over)
  var oldVileParleCount = 0;
  var oldSheet = ss.getSheetByName("Form Responses 2");
  if (oldSheet) {
    var oldData = oldSheet.getDataRange().getValues();
    if (oldData.length > 1) {
      for (var j = 1; j < oldData.length; j++) {
        var venue = oldData[j][4]; // Column E (index 4) is Venue
        if (venue && venue.toLowerCase().indexOf("vile") !== -1) {
          oldVileParleCount += getSeatCount(oldData[j][5]); // Column F (index 5) is Attendees
        }
      }
    }
  }

  // Add the old carried-over Vile Parle bookings to the Vile Parle seminar total
  counts["vile-parle-jul-2026"] = (counts["vile-parle-jul-2026"] || 0) + oldVileParleCount;

  return counts;
}

// ── Helper to get remaining seats for all seminars ───────────────
function getRemainingSeats() {
  var booked = getBookedSeatsCount();
  var remaining = {};

  // Define capacities for each seminar
  var capacities = {
    "thane-jun-2026": 300,
    "vile-parle-jul-2026": 477, // Default fallback. Dynamically set below.
    "kolhapur-tbd-2026": 300,
    "sangli-tbd-2026": 300,
    "pune-jun-2026": 375,   // change key from "pune-tbd-2026" and set 375
  };

  // Find exact old Vile Parle registrations count to dynamically adjust capacity
  var oldVileParleCount = 0;
  var ss = SpreadsheetApp.openById(SEMINAR_SPREADSHEET_ID);
  var oldSheet = ss.getSheetByName("Form Responses 2");
  if (oldSheet) {
    var oldData = oldSheet.getDataRange().getValues();
    if (oldData.length > 1) {
      for (var j = 1; j < oldData.length; j++) {
        var venue = oldData[j][4];
        if (venue && venue.toLowerCase().indexOf("vile") !== -1) {
          oldVileParleCount += getSeatCount(oldData[j][5]);
        }
      }
    }
  }

  // Vile Parle gets 177 new seats on top of the old registrations (100 + 77 freed via cancellation calls)
  capacities["vile-parle-jul-2026"] = oldVileParleCount + 177;

  Object.keys(capacities).forEach(function(id) {
    var count = booked[id] || 0;
    remaining[id] = Math.max(0, capacities[id] - count);
  });

  return remaining;
}

// ── Book seminar (called from website) ──────────────────────────

function bookSeminar(params) {

  // Validate required fields
  var required = ["bookingId", "name", "phone", "email", "seminarId", "city", "date", "slot"];
  for (var i = 0; i < required.length; i++) {
    if (!params[required[i]]) {
      return { success: false, error: "Missing field: " + required[i] };
    }
  }

  var members    = parseInt(params.members) || 0;
  var totalSeats = members + 1;

  // ── Capacity Check ──────────────────────────────────────────
  var remaining = getRemainingSeats();
  var semId = params.seminarId;
  if (remaining[semId] !== undefined) {
    if (remaining[semId] < totalSeats) {
      return {
        success: false,
        error: "HOUSEFULL",
        message: "Sorry, this seminar has only " + remaining[semId] + " seat(s) remaining, but you requested " + totalSeats + " seat(s)."
      };
    }
  }

  ensureCheckInColumns();

  // Open the sheet (or create it on first booking)
  var ss    = SpreadsheetApp.openById(SEMINAR_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SEMINAR_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SEMINAR_SHEET_NAME);
    sheet.appendRow([
      "BookingID", "SeminarID", "City", "Branch", "Venue",
      "Date", "Slot", "Name", "Phone", "Email",
      "NEETYear", "AdditionalMembers", "TotalSeats", "BookingDate",
      "CheckedIn", "CheckInTime"
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 16)
      .setFontWeight("bold")
      .setBackground("#1a0040")
      .setFontColor("#FFD700");
  }

  // Write booking row
  sheet.appendRow([
    params.bookingId,
    params.seminarId,
    params.city,
    params.branch   || params.city,
    params.venue,
    params.date,
    params.slot,
    params.name,
    params.phone,
    params.email,
    params.neetYear || "NEET 2026",
    members,
    totalSeats,
    new Date(),
    "",   // CheckedIn — blank until scanned
    ""    // CheckInTime — blank until scanned
  ]);

  // Send styled HTML email with QR code
  sendWebBookingEmail(params);

  return { success: true, bookingId: params.bookingId };
}

// ── Verify ticket by scanning QR code at venue ───────────────────

function verifySeminarTicket(bookingId) {

  if (!bookingId) return { success: false, error: "No booking ID provided" };

  ensureCheckInColumns();

  var ss    = SpreadsheetApp.openById(SEMINAR_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SEMINAR_SHEET_NAME);
  if (!sheet) return { success: false, error: "No bookings found" };

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];

  var bookingIdCol  = headers.indexOf("BookingID");
  var checkedInCol  = headers.indexOf("CheckedIn");
  var checkInTimeCol = headers.indexOf("CheckInTime");

  for (var r = 1; r < data.length; r++) {
    var row = data[r];

    if (row[bookingIdCol] && row[bookingIdCol].toString().trim() === bookingId.trim()) {

      var rowObj = {};
      headers.forEach(function(h, i) { rowObj[h] = row[i]; });

      var alreadyCheckedIn = rowObj["CheckedIn"] === true || rowObj["CheckedIn"] === "TRUE";

      if (alreadyCheckedIn) {
        return {
          success:     true,
          valid:       true,
          status:      "already_checked_in",
          bookingId:   rowObj["BookingID"],
          name:        rowObj["Name"],
          phone:       rowObj["Phone"],
          city:        rowObj["City"],
          date:        rowObj["Date"],
          slot:        rowObj["Slot"],
          venue:       rowObj["Venue"],
          seats:       rowObj["TotalSeats"],
          neetYear:    rowObj["NEETYear"],
          checkedInAt: rowObj["CheckInTime"]
        };
      }

      // First scan — mark as checked in
      var now = new Date();
      sheet.getRange(r + 1, checkedInCol + 1).setValue(true);
      sheet.getRange(r + 1, checkInTimeCol + 1).setValue(now);

      return {
        success:     true,
        valid:       true,
        status:      "checked_in",
        bookingId:   rowObj["BookingID"],
        name:        rowObj["Name"],
        phone:       rowObj["Phone"],
        city:        rowObj["City"],
        date:        rowObj["Date"],
        slot:        rowObj["Slot"],
        venue:       rowObj["Venue"],
        seats:       rowObj["TotalSeats"],
        neetYear:    rowObj["NEETYear"],
        checkedInAt: now
      };
    }
  }

  return { success: true, valid: false, status: "not_found", message: "Booking ID not found" };
}

// ── Walk-in registration (no prior booking — already at venue) ───

function generateWalkInBookingId() {
  var now  = new Date();
  var ds   = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMdd");
  var rand = Math.floor(1000 + Math.random() * 9000);
  return "ASMI-WLK-" + ds + "-" + rand;
}

function addWalkIn(params) {

  var required = ["name", "phone"];
  for (var i = 0; i < required.length; i++) {
    if (!params[required[i]]) {
      return { success: false, error: "Missing field: " + required[i] };
    }
  }

  ensureCheckInColumns();

  var ss    = SpreadsheetApp.openById(SEMINAR_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SEMINAR_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SEMINAR_SHEET_NAME);
    sheet.appendRow([
      "BookingID", "SeminarID", "City", "Branch", "Venue",
      "Date", "Slot", "Name", "Phone", "Email",
      "NEETYear", "AdditionalMembers", "TotalSeats", "BookingDate",
      "CheckedIn", "CheckInTime"
    ]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 16)
      .setFontWeight("bold")
      .setBackground("#1a0040")
      .setFontColor("#FFD700");
  }

  var bookingId = generateWalkInBookingId();
  var now       = new Date();

  // Walk-ins arrive with no prior venue/date/slot selection —
  // placeholder values since the check-in desk form only asks for
  // name/phone/email/score/category/course.
  sheet.appendRow([
    bookingId,
    "walk-in",
    params.city  || "Mumbai",
    params.city  || "Mumbai",
    params.venue || "P.L Deshpande Hall, Lokmanya Seva Sangh, Vile Parle East, Mumbai",
    params.date  || "5th July 2026",
    params.slot  || "11:00 AM – 01:00 PM",
    params.name,
    params.phone,
    params.email || "",
    params.neetYear || "NEET 2026",
    0,
    1,
    now,
    true,   // already at the venue — checked in immediately
    now
  ]);

  return { success: true, bookingId: bookingId };
}

// ── Idempotent columns checker ────────────────────────────────────

function ensureCheckInColumns() {
  var ss    = SpreadsheetApp.openById(SEMINAR_SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SEMINAR_SHEET_NAME);
  if (!sheet) return;

  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  if (headers.indexOf("CheckedIn") === -1) {
    var newCol = lastCol + 1;
    sheet.getRange(1, newCol).setValue("CheckedIn")
      .setFontWeight("bold").setBackground("#1a0040").setFontColor("#FFD700");
    sheet.getRange(1, newCol + 1).setValue("CheckInTime")
      .setFontWeight("bold").setBackground("#1a0040").setFontColor("#FFD700");
  }
}

// ── Styled HTML confirmation email with QR code ──────────────────

function sendWebBookingEmail(p) {

  var logoUrl    = CONFIG.LOGO_URL;
  var members    = parseInt(p.members) || 0;
  var totalSeats = members + 1;
  var mapsLink   = p.venueMaps || "#";

  var verifyUrl = "https://asmicareer.in/events/verify?id=" + encodeURIComponent(p.bookingId);

  var qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200"
    + "&data="    + encodeURIComponent(verifyUrl)
    + "&color=1a0040&bgcolor=ffffff";

  var subject = "✅ Booking Confirmed | ASMI Seminar — "
    + p.city + " | " + p.date;

  var html =
    "<!DOCTYPE html><html><head><meta charset='UTF-8'>"
    + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
    + "</head>"
    + "<body style='margin:0;padding:0;background:#f4f1f9;font-family:Arial,sans-serif;'>"

    // Card wrapper
    + "<div style='max-width:600px;margin:24px auto;background:#ffffff;"
    + "border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.12);'>"

    // ─ Header
    + "<div style='background:linear-gradient(135deg,#1a0040,#6a0dad);"
    + "padding:28px 28px 24px;text-align:center;'>"
    + "<img src='" + logoUrl + "' alt='ASMI Career'"
    + " style='height:44px;margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;'"
    + " onerror=\"this.style.display='none'\">"
    + "<div style='display:inline-block;background:#FFD700;color:#1a0040;"
    + "font-weight:900;font-size:12px;padding:6px 20px;border-radius:50px;"
    + "letter-spacing:.5px;margin-bottom:12px;'>✅ BOOKING CONFIRMED</div>"
    + "<h1 style='color:#ffffff;font-size:22px;font-weight:900;margin:0;'>"
    + "Your seat is reserved!</h1>"
    + "<p style='color:rgba(255,255,255,.65);font-size:13px;margin:8px 0 0;'>"
    + "We look forward to seeing you at the seminar.</p>"
    + "</div>"

    // ─ Booking ID + QR
    + "<div style='padding:24px 28px;"
    + "border-bottom:1px solid #f0ecfa;'>"
    + "<table style='width:100%;border-collapse:collapse;'><tr>"
    + "<td style='vertical-align:top;'>"
    + "<p style='color:#6a0dad;font-size:9px;font-weight:800;letter-spacing:2px;"
    + "text-transform:uppercase;margin:0 0 6px;'>BOOKING ID</p>"
    + "<p style='color:#1a0040;font-size:24px;font-weight:900;margin:0;"
    + "letter-spacing:.5px;'>" + p.bookingId + "</p>"
    + "<p style='color:#888;font-size:12px;margin:6px 0 0;'>"
    + "Show this at the venue entrance</p>"
    + "</td>"
    + "<td style='text-align:right;vertical-align:top;'>"
    + "<img src='" + qrUrl + "' alt='QR Code'"
    + " style='width:100px;height:100px;border:3px solid #FFD700;"
    + "border-radius:10px;'>"
    + "</td>"
    + "</tr></table>"
    + "</div>"

    // ─ Attendee
    + "<div style='padding:18px 28px;border-bottom:1px solid #f0ecfa;'>"
    + "<p style='color:#6a0dad;font-size:9px;font-weight:800;letter-spacing:2px;"
    + "text-transform:uppercase;margin:0 0 8px;'>ATTENDEE</p>"
    + "<p style='color:#1a0040;font-size:16px;font-weight:700;margin:0;'>"
    + p.name + "</p>"
    + "<p style='color:#555;font-size:13px;margin:4px 0 0;'>"
    + p.phone + " &nbsp;&middot;&nbsp; " + p.email + "</p>"
    + "</div>"

    // ─ Event details
    + "<div style='padding:18px 28px;background:#fafaf8;border-bottom:1px solid #f0ecfa;'>"
    + "<p style='color:#6a0dad;font-size:9px;font-weight:800;letter-spacing:2px;"
    + "text-transform:uppercase;margin:0 0 12px;'>EVENT DETAILS</p>"
    + "<table style='width:100%;border-collapse:collapse;font-size:13px;'>"
    + emailRow("Event",     (p.seminarTitle || "ASMI Seminar") + " — " + p.city)
    + emailRow("Date",      p.date)
    + emailRow("Time",      p.slot)
    + emailRow("Venue",     p.venue)
    + emailRow("Attendees", totalSeats + " person" + (totalSeats > 1 ? "s" : ""))
    + emailRow("Category",  p.neetYear || "NEET 2026")
    + "</table>"
    + "<a href='" + mapsLink + "' target='_blank'"
    + " style='display:inline-block;margin-top:14px;color:#6a0dad;"
    + "font-size:12px;font-weight:700;text-decoration:none;'>"
    + "📍 View Location on Maps &rarr;</a>"
    + "</div>"

    // ─ Help buttons
    + "<div style='padding:18px 28px;border-bottom:1px solid #f0ecfa;'>"
    + "<p style='color:#6a0dad;font-size:9px;font-weight:800;letter-spacing:2px;"
    + "text-transform:uppercase;margin:0 0 12px;'>NEED HELP?</p>"
    + "<a href='tel:7410019074'"
    + " style='display:inline-block;padding:10px 20px;background:#1a0040;"
    + "color:#FFD700;text-decoration:none;border-radius:8px;"
    + "font-weight:700;font-size:13px;margin-right:10px;'>"
    + "📞 Call Us</a>"
    + "<a href='https://wa.me/917410019074' target='_blank'"
    + " style='display:inline-block;padding:10px 20px;background:#25D366;"
    + "color:#ffffff;text-decoration:none;border-radius:8px;"
    + "font-weight:700;font-size:13px;'>"
    + "\ud83d\udacac WhatsApp</a>"
    + "<p style='color:#888;font-size:11px;margin:12px 0 0;'>"
    + "📧 support@asmicareer.com &nbsp;&middot;&nbsp; 🌐 asmicareer.in</p>"
    + "</div>"

    // ─ Footer
    + "<div style='background:#1a0040;padding:18px 28px;text-align:center;'>"
    + "<p style='color:rgba(255,255,255,.5);font-size:11px;margin:0;'>"
    + "ASMI Youth Career Advisor LLP &nbsp;&middot;&nbsp; Maharashtra &nbsp;&middot;&nbsp; "
    + new Date().getFullYear() + "</p>"
    + "<p style='color:rgba(255,255,255,.25);font-size:10px;margin:5px 0 0;'>"
    + "This is an automated confirmation. Please do not reply to this email.</p>"
    + "</div>"

    + "</div>"   // end card
    + "</body></html>";

  GmailApp.sendEmail(p.email, subject, "", { htmlBody: html });
}

// Helper: single detail row inside the email table
function emailRow(label, value) {
  return "<tr>"
    + "<td style='padding:5px 0;color:#888;width:90px;vertical-align:top;"
    + "font-size:13px;'>" + label + "</td>"
    + "<td style='padding:5px 0;color:#1a0040;font-weight:600;"
    + "font-size:13px;'>" + value + "</td>"
    + "</tr>";
}
