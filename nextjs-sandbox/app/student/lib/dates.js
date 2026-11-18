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
