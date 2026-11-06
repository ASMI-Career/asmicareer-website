// ── Per-student browser cache ─────────────────────────────────────────────────
// Everything this page remembers in the browser is keyed by the student's token, so data cached for one
// student is never shown for another token. (Before this, name/rank/score/shortlist/checklist were stored
// under shared keys and leaked to whoever opened the next link on the same device.)
export const TOKEN_RE = /^[A-Za-z0-9_-]{3,64}$/;
export const cacheKey = (token, field) => `asmi_student:${token}:${field}`;
export const readCache = (token, field) => {
  try { const raw = localStorage.getItem(cacheKey(token, field)); return raw === null ? null : JSON.parse(raw); } catch (e) { return null; }
};
export const writeCache = (token, field, value) => {
  try { localStorage.setItem(cacheKey(token, field), JSON.stringify(value)); } catch (e) { /* storage blocked: cache is best-effort */ }
};
export const clearCache = (token) => {
  try { ['name', 'rank', 'score', 'shortlist', 'checklist'].forEach(f => localStorage.removeItem(cacheKey(token, f))); } catch (e) { /* ignore */ }
};
// Removes the old shared (un-keyed) keys written by earlier versions of this page. Nothing else reads them.
// 'asmi-checklist' is NOT removed: the public documents-checklist tool still uses it.
export const purgeLegacyCache = () => {
  try { ['name', 'rank', 'score', 'shortlist'].forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
};
