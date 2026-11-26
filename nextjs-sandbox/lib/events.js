// Shared rules for events.json (deadlines, news). Optional fields on each event:
//   stream: 'medical' | 'engineering' | 'all'   (missing = medical)
//   track:  a track id, or an array of them     (missing = applies to every track)
//   status: 'confirmed' | 'tentative'           (missing = confirmed)

export const eventStream = (ev) => ev.stream || 'medical';

export const streamMatches = (ev, streamId) => {
  const s = eventStream(ev);
  return s === 'all' || s === streamId;
};

const trackList = (ev) => (ev.track === undefined || ev.track === null || ev.track === '' ? [] : [].concat(ev.track));

// Events that happen on several separate days (e.g. an exam held 20-24 and 28 January, with 25-27 free) carry an optional
// `dates` list of "YYYY-MM-DD". `date` stays the LAST day, so pages that only know `date` (home page, news) keep working.
// Without `dates` every function below returns exactly what it did before.
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
export const eventDays = (ev) => {
  const list = Array.isArray(ev.dates) ? [...new Set(ev.dates.filter(d => DAY_RE.test(String(d))))].sort() : [];
  return list.length ? list : [ev.date];
};
const lastDay = (ev) => { const d = eventDays(ev); return d[d.length - 1]; };
// The first listed day that is today or later; once every day has passed, the last day.
export const nextDay = (ev, today = new Date()) => {
  const t = new Date(today); t.setHours(0, 0, 0, 0);
  const days = eventDays(ev);
  return days.find(d => new Date(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10))) >= t) || days[days.length - 1];
};

// Merges several event lists and drops exact repeats (same title and date). One list is returned untouched.
export function mergeEvents(...lists) {
  if (lists.length === 1) return lists[0] || [];
  const seen = new Set(); const out = [];
  for (const list of lists) for (const ev of (list || [])) {
    const k = `${ev.title}|${ev.date}`; if (seen.has(k)) continue; seen.add(k); out.push(ev);
  }
  return out;
}

// Dashboard deadlines: events for this stream (or "all"), on one of the student's tracks, not past, soonest first.
// rules (per stream, from the config):
//   keepPastResults   events with "result" in the title stay visible after their date
//   useExpiryDate     hide an event after expiry_date (when it has one) instead of after date
//   requireTrackMatch only show events whose track is one of the student's tracks (events without a track always show;
//                     a student with no track recorded is treated as being on every track)
//   extraFields       (engineering only) also hand on link, cta, pdf, exam, display_date, expiry_date and tutorial_id, so the
//                     dashboard can show "Apply Now" and the Deadlines page can show details. Streams without this rule
//                     (Medical) get exactly the same objects as before.
export function selectDeadlines(events, { streamId, studentTracks, allTracks, rules }) {
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const mine = (studentTracks && studentTracks.length) ? studentTracks : allTracks;
  const isExpired = (ev) => {
    if (rules.keepPastResults && ev.title && ev.title.toLowerCase().includes('result')) return false;
    const raw = (rules.useExpiryDate && ev.expiry_date) || lastDay(ev);
    // new Date("YYYY-MM-DD") is midnight UTC, so for anyone behind UTC an event dated today looked expired. Engineering (extraFields)
    // reads a date-only value as a LOCAL date; every other stream keeps the original behaviour exactly.
    const targetDate = (rules.extraFields && /^\d{4}-\d{2}-\d{2}$/.test(String(raw)))
      ? new Date(Number(String(raw).slice(0, 4)), Number(String(raw).slice(5, 7)) - 1, Number(String(raw).slice(8, 10)))
      : new Date(raw);
    return targetDate < todayMidnight;
  };
  const onMyTrack = (ev) => {
    if (!rules.requireTrackMatch) return true;
    const t = trackList(ev); return t.length === 0 || t.some(x => mine.includes(x));
  };
  return events
    .filter(ev => streamMatches(ev, streamId))
    .filter(onMyTrack)
    .filter(ev => !isExpired(ev))
    .map(ev => toDeadline(ev, rules))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// The shape the dashboard works with. "status" is only tentative / confirmed (from the event's own `status`); whether an event is
// open or closed is not stored: it is worked out from the date (see the Dashboard countdown and the expiry filter above).
function toDeadline(ev, rules) {
  const multi = Array.isArray(ev.dates) && ev.dates.length > 0;
  const d = { title: ev.title, date: multi ? nextDay(ev) : ev.date, tag: ev.tag || 'NOTICE', status: ev.status === 'tentative' ? 'tentative' : 'confirmed', track: ev.track };
  if (rules && rules.extraFields) {
    d.link = ev.link; d.cta = ev.cta; d.pdf = ev.pdf; d.exam = ev.exam;
    d.display_date = ev.display_date; d.expiry_date = ev.expiry_date; d.tutorial_id = ev.tutorial_id;
  }
  if (multi) d.dates = eventDays(ev);   // only multi-day events get this field
  return d;
}

// Every event of this stream on the student's tracks, past ones included (the Deadlines page greys the closed ones out).
// Same stream and track rules as selectDeadlines, no expiry filter. Engineering uses it with rules.extraFields.
export function selectAllDeadlines(events, { streamId, studentTracks, allTracks, rules }) {
  const mine = (studentTracks && studentTracks.length) ? studentTracks : allTracks;
  const onMyTrack = (ev) => {
    if (!rules.requireTrackMatch) return true;
    const t = trackList(ev); return t.length === 0 || t.some(x => mine.includes(x));
  };
  return events
    .filter(ev => streamMatches(ev, streamId))
    .filter(onMyTrack)
    .map(ev => toDeadline(ev, rules));
}
