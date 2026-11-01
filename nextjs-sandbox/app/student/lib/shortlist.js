// ── Shortlist shape (matches the counsellor tools and the Apps Script): { MCC: [], MH: [], OPEN: [] } ──
export const SHORTLIST_GROUPS = ['MCC', 'MH', 'OPEN'];
export const normalizeGroups = (raw) => {
  const base = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? { ...raw } : {};   // unknown keys are kept untouched
  SHORTLIST_GROUPS.forEach(g => {
    base[g] = (Array.isArray(base[g]) ? base[g] : [])
      .map(c => (typeof c === 'string' ? { name: c } : c))
      .filter(c => c && typeof c === 'object' && c.name);
  });
  return base;
};
export const groupNames = (groups) => Array.from(new Set(SHORTLIST_GROUPS.flatMap(g => groups[g].map(c => c.name))));
// Which counselling list a college belongs to. Predictor/cutoff rows carry pool or quota; the institutes directory does not.
export const shortlistGroupFor = (c) => {
  const quota = String(c.quota || '').toLowerCase();
  if (c.pool === 'MCC AIQ' || quota === 'aiq') return 'MCC';
  if (c.pool === 'MH State' || quota === 'state') return 'MH';
  if (c.pool === 'Open State' || quota === 'open state') return 'OPEN';
  if (c.state === 'Maharashtra') return 'MH';           // institutes directory: heuristic, the counsellor can re-group
  return c.type === 'Private' ? 'OPEN' : 'MCC';
};
export const shortlistItemFor = (name, c) => ({
  name, meta: '', state: c.state || '', type: c.type || '', quota: c.quota || '', fees: c.fees != null ? String(c.fees) : '',
  chancelabel: c.chance || '',
});
export const removeFromGroups = (groups, name) => {
  const next = { ...groups };
  SHORTLIST_GROUPS.forEach(g => { next[g] = groups[g].filter(c => c.name !== name); });
  return next;
};
export const addToGroups = (groups, name, entry) => {
  if (groupNames(groups).includes(name)) return groups;
  const g = shortlistGroupFor(entry);
  return { ...groups, [g]: [...groups[g], shortlistItemFor(name, entry)] };
};
