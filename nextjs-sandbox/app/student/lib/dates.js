// Date helpers for the engineering Deadlines page and the dashboard's Apply Now button.
// "YYYY-MM-DD" is always split into year / month / day and turned into a LOCAL date. new Date("2026-11-22") is midnight UTC,
// which is already 22 Nov 05:30 in India but the evening of the 21st for anyone behind UTC, so it is never used here.

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function parseLocalDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }

export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const formatLongDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

// An event is closed once its date is before today. (An event dated today is still open: it can be acted on today.)
export function isClosed(dateStr, today = startOfToday()) {
  const d = parseLocalDate(dateStr);
  return d ? d < today : false;
}

// closed   : the date has passed
// open     : an application or correction event (tag says DEADLINE or WINDOW) whose last date has not passed. Once such an event
//            is listed it counts as open until that last date (its `date`).
// upcoming : everything else (exams, admit cards, notices)
export function deadlineState(ev, today = startOfToday()) {
  if (isClosed(ev.date, today)) return 'closed';
  if (/DEADLINE|WINDOW/i.test(ev.tag || '')) return 'open';
  return 'upcoming';
}

// Some events state their window in `display_date`, e.g. "24th October – 22nd November 2026, upto 11:50 PM" or
// "20th October 2026 – 31st March 2027". The start of such a range is read from that text; nothing is read where the text has no
// range ("Last date: 2nd April 2027"). Used only to draw a running application on the calendar, never to decide open / closed.
const monthIndex = (name) => MONTHS.findIndex(m => m.toLowerCase().startsWith(String(name).toLowerCase().slice(0, 3)));
export function windowStart(displayDate) {
  const m = /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?\s*[–—-]\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s+(\d{4})/.exec(String(displayDate || ''));
  if (!m) return null;
  const sm = monthIndex(m[2]), em = monthIndex(m[5]);
  if (sm < 0 || em < 0) return null;
  const endYear = Number(m[6]);
  const end = new Date(endYear, em, Number(m[4]));
  let start = new Date(m[3] ? Number(m[3]) : endYear, sm, Number(m[1]));
  if (!m[3] && start > end) start = new Date(endYear - 1, sm, Number(m[1]));   // "30th December – 5th January 2027"
  return Number.isNaN(start.getTime()) ? null : start;
}

// The days an open application runs on the calendar: from the stated start (when it is in the past) or from today, up to its last date.
export function runningSpan(ev, today = startOfToday()) {
  if (deadlineState(ev, today) !== 'open') return null;
  const end = parseLocalDate(ev.date);
  const ws = windowStart(ev.display_date);
  let start = ws && ws < today ? ws : today;
  if (start > end) start = end;
  return { start, end };
}
