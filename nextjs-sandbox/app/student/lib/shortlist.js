// ── Shortlist shape (matches the counsellor tools and the Apps Script): { <group>: [] , ... } ──
// Medical groups are MCC / MH / OPEN. The groups and the rules that pick one come from the stream config (config.shortlist).
export function makeShortlist(cfg) {
  const SHORTLIST_GROUPS = cfg.groups;
  const rules = cfg.groupRules;
  const normalizeGroups = (raw) => {
    const base = (raw && typeof raw === 'object' && !Array.isArray(raw)) ? { ...raw } : {};   // unknown keys are kept untouched
    SHORTLIST_GROUPS.forEach(g => {
      base[g] = (Array.isArray(base[g]) ? base[g] : [])
        .map(c => (typeof c === 'string' ? { name: c } : c))
        .filter(c => c && typeof c === 'object' && c.name);
    });
    return base;
  };
  const groupNames = (groups) => Array.from(new Set(SHORTLIST_GROUPS.flatMap(g => groups[g].map(c => c.name))));
  // Which list a college belongs to. Predictor/cutoff rows carry pool or quota; the institutes directory does not.
  const shortlistGroupFor = (c) => {
    const quota = String(c.quota || '').toLowerCase();
    for (const r of rules.byPoolOrQuota) if (c.pool === r.pool || quota === r.quota) return r.group;
    if (rules.byState[c.state]) return rules.byState[c.state];   // institutes directory: heuristic, the counsellor can re-group
    return c.type === 'Private' ? rules.privateGroup : rules.defaultGroup;
  };
  const shortlistItemFor = (name, c) => ({
    name, meta: '', state: c.state || '', type: c.type || '', quota: c.quota || '', fees: c.fees != null ? String(c.fees) : '',
    chancelabel: c.chance || '',
  });
  const removeFromGroups = (groups, name) => {
    const next = { ...groups };
    SHORTLIST_GROUPS.forEach(g => { next[g] = groups[g].filter(c => c.name !== name); });
    return next;
  };
  const addToGroups = (groups, name, entry) => {
    if (groupNames(groups).includes(name)) return groups;
    const g = shortlistGroupFor(entry);
    return { ...groups, [g]: [...groups[g], shortlistItemFor(name, entry)] };
  };
  return { SHORTLIST_GROUPS, normalizeGroups, groupNames, shortlistGroupFor, shortlistItemFor, removeFromGroups, addToGroups };
}
