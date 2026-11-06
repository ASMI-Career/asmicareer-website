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
export function selectDeadlines(events, { streamId, studentTracks, allTracks, rules }) {
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const mine = (studentTracks && studentTracks.length) ? studentTracks : allTracks;
  const isExpired = (ev) => {
    if (rules.keepPastResults && ev.title && ev.title.toLowerCase().includes('result')) return false;
    const targetDate = new Date((rules.useExpiryDate && ev.expiry_date) || ev.date);
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
    .map(ev => ({ title: ev.title, date: ev.date, tag: ev.tag || 'NOTICE', status: ev.status === 'tentative' ? 'tentative' : 'confirmed', track: ev.track }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}
