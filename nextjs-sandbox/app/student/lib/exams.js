// The canonical exam / counselling groups of the engineering dashboard (config.exams) and the one place that turns the names a student's
// sheet, the events or the old config use ("JoSAA", "Maharashtra CAP", "Manipal MET" ...) into those group ids (config.examAliases).
// Matching ignores case, spacing and punctuation: "MHT-CET", "MHT CET" and "mht cet" are the same name.
const norm = (s) => String(s === null || s === undefined ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function aliasIndex(cfg) {
  const m = new Map();
  ((cfg && cfg.exams) || []).forEach(e => { m.set(norm(e.id), e.id); m.set(norm(e.label), e.id); });
  Object.entries((cfg && cfg.examAliases) || {}).forEach(([name, id]) => m.set(norm(name), id));
  return m;
}

// trackNames: the student's tracks (strings). Returns the group ids in the order the names appear, without repeats; unknown names are ignored.
// A student with no tracks gets [] ("my exams" is empty, so the screens show everything, as they always did).
export function resolveExamIds(trackNames, cfg) {
  const idx = aliasIndex(cfg);
  const out = [];
  [].concat(trackNames || []).forEach(n => { const id = idx.get(norm(n)); if (id && !out.includes(id)) out.push(id); });
  return out;
}

export const examLabel = (cfg, id) => { const e = ((cfg && cfg.exams) || []).find(x => x.id === id); return e ? e.label : id; };
