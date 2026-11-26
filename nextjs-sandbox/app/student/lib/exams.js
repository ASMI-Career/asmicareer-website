// Exam / counselling names and the one place that turns the names a student's sheet, the events or the old config use into ids.
// Two separate lists live in the engineering config, because the two screens split things differently:
//   Documents  -> config.exams / config.examAliases                     (counselling groups: JoSAA & CSAB, DASA, MHT-CET ...)
//   Institutes -> config.instituteExams / config.instituteExamAliases   (the entrance EXAMS you can apply through: JEE Main, JEE Advanced ...)
// Matching ignores case, spacing and punctuation: "MHT-CET", "MHT CET" and "mht cet" are the same name.
const norm = (s) => String(s === null || s === undefined ? '' : s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const KEYS = { documents: ['exams', 'examAliases'], institutes: ['instituteExams', 'instituteExamAliases'] };
const listsOf = (cfg, scope) => { const k = KEYS[scope] || KEYS.documents; return { exams: (cfg && cfg[k[0]]) || [], aliases: (cfg && cfg[k[1]]) || {} }; };

export function aliasIndex(cfg, scope) {
  const { exams, aliases } = listsOf(cfg, scope);
  const m = new Map();
  exams.forEach(e => { m.set(norm(e.id), e.id); m.set(norm(e.label), e.id); });
  Object.entries(aliases).forEach(([name, id]) => m.set(norm(name), id));
  return m;
}

// trackNames: the student's tracks (strings). Returns the ids in the order the names appear, without repeats; unknown names are ignored.
// A student with no tracks gets [] ("my exams" is empty, so the screen shows everything).
export function resolveExamIds(trackNames, cfg, scope) {
  const idx = aliasIndex(cfg, scope);
  const out = [];
  [].concat(trackNames || []).forEach(n => { const id = idx.get(norm(n)); if (id && !out.includes(id)) out.push(id); });
  return out;
}

// Institutes: the exams a student has taken or will take. From their sheet tracks (JoSAA / CSAB / DASA mean JEE Main, Maharashtra CAP means
// MHT-CET ...) and from the scores they have entered in Settings. Returned in the canonical order of config.instituteExams.
export function studentExamIds(profile, trackNames, cfg) {
  const have = new Set(resolveExamIds(trackNames, cfg, 'institutes'));
  const p = profile || {};
  const filled = (v) => v !== null && v !== undefined && v !== '' && Number(v) > 0;
  if (filled(p.jee_main_percentile) || filled(p.jee_main_crl_rank) || filled(p.category_rank)) have.add('jee-main');
  if (filled(p.jee_adv_rank) || filled(p.jee_adv_category_rank)) have.add('jee-advanced');
  if (filled(p.mhtcet_percentile) || filled(p.mhtcet_sml)) have.add('mhtcet');
  return listsOf(cfg, 'institutes').exams.map(e => e.id).filter(id => have.has(id));
}

export const examLabel = (cfg, id, scope) => { const e = listsOf(cfg, scope).exams.find(x => x.id === id); return e ? e.label : id; };
