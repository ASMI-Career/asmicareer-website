// Documents by counselling / exam group (engineering). Pure functions, no React, so they can be tested on their own.
// DOCS is the document file (data/docs.engineering.provisional.json). Its `groups` say which item ids belong to each exam group:
//   groups[examId] = { sections: [item ids], includeCategory: true|false, note?: string }
// A group WITHOUT `sections` is not defined yet: it falls back to today's list (all base sections + the student's category items) plus its note.
// Item ids are never changed here: ticks are saved by id.
import { resolveExamIds } from './exams.js';

// The list as it was before groups existed: base sections, the student's category items, the chosen quota, then one group per track.
export function legacySections(DOCS, config, docCategory, docQuota, studentTracks) {
  const tracks = (studentTracks && studentTracks.length) ? studentTracks : (config.tracks || []).map(t => t.id);
  return [
    ...DOCS.sections,
    ...(docCategory !== 'General' && DOCS.category[docCategory] ? [].concat(DOCS.category[docCategory]) : []),
    ...(DOCS.quota[docQuota] ? [DOCS.quota[docQuota]] : []),
    ...tracks.filter(t => DOCS.track && DOCS.track[t]).map(t => DOCS.track[t]),
  ];
}

export const defaultDocView = (config, studentTracks) => (resolveExamIds(studentTracks, config).length ? 'mine' : 'all');

// view: 'mine' (the student's own groups), 'all' (everything, as before) or one exam id.
export function buildDocumentSections({ DOCS, config, docCategory, docQuota, studentTracks, view }) {
  const mine = resolveExamIds(studentTracks, config);
  const v = view || (mine.length ? 'mine' : 'all');
  let sections; const notes = [];
  if (!config.exams || !DOCS.groups || v === 'all' || (v === 'mine' && !mine.length)) {
    sections = legacySections(DOCS, config, docCategory, docQuota, studentTracks);
  } else {
    const selected = v === 'mine' ? mine : [v];
    const ids = new Set(); let withCategory = false;
    const baseIds = DOCS.sections.flatMap(s => s.docs.map(d => d.id));
    for (const g of selected) {
      const def = DOCS.groups[g] || {};
      if (Array.isArray(def.sections)) { def.sections.forEach(i => ids.add(i)); if (def.includeCategory) withCategory = true; }
      else { baseIds.forEach(i => ids.add(i)); withCategory = true; if (def.note) notes.push({ id: g, text: def.note }); }   // not defined yet: today's list + its note
    }
    const keep = (s) => ({ ...s, docs: s.docs.filter(d => ids.has(d.id)) });
    const own = (studentTracks || []).filter(t => DOCS.track && DOCS.track[t]);
    const trackKeys = [...own, ...Object.keys(DOCS.track || {}).filter(k => !own.includes(k))];
    sections = [
      ...DOCS.sections.map(keep),
      ...(withCategory && docCategory !== 'General' && DOCS.category[docCategory] ? [].concat(DOCS.category[docCategory]) : []),
      ...(DOCS.quota[docQuota] ? [DOCS.quota[docQuota]] : []),
      ...trackKeys.map(k => keep(DOCS.track[k])),
    ].filter(s => s.docs.length > 0);
  }
  const allIds = sections.flatMap(s => s.docs.map(d => d.id));
  return { sections, allIds, notes, view: v, mine };
}

export const docProgress = (allIds, checked) => {
  const done = allIds.filter(id => checked.has(id)).length;
  return { doneCount: done, pct: allIds.length ? Math.round((done / allIds.length) * 100) : 0 };
};
