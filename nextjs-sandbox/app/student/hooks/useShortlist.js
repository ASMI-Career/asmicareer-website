import { useState, useRef } from 'react';
import { writeCache } from '../lib/cache';
import { makeShortlist } from '../lib/shortlist';

export default function useShortlist({ config, endpoint, currentToken }) {
  const { normalizeGroups, groupNames, addToGroups, removeFromGroups } = makeShortlist(config.shortlist);
  const [shortlistGroups, setShortlistGroups] = useState(() => normalizeGroups(null)); // { <group>: [] } (Medical: MCC, MH, OPEN)
  const shortlist = groupNames(shortlistGroups);   // college names, in group order (what the UI lists)

  // Saves the shortlist to the sheet (Apps Script action `saveShortlist`, grouped { MCC, MH, OPEN } like the counsellor tools).
  // The same change is applied on top of the sheet's latest copy first, so a list the counsellor saved in the meantime is not
  // overwritten by an old one. Saves run one after another. A failed save is silent (like the documents checklist); the cache keeps the edit.
  const saveQueue = useRef({ chain: Promise.resolve(), pending: 0 });
  const saveShortlistToSheet = (token, op, localNext) => {
    const q = saveQueue.current;
    q.pending += 1;
    q.chain = q.chain.then(async () => {
      try {
        let merged = localNext;
        try {
          const latest = await (await fetch(`${endpoint}?action=getStudent&token=${encodeURIComponent(token)}`)).json();
          if (latest && latest.success && latest.data) merged = op(normalizeGroups(latest.data.saved_colleges));
        } catch (e) { /* offline or unreadable: save our own copy */ }
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'saveShortlist', token, colleges: merged }),
        });
        const json = await res.json();
        if (!(json && json.success)) throw new Error('save rejected: ' + JSON.stringify(json));
        if (q.pending === 1) { setShortlistGroups(merged); writeCache(token, 'shortlist', merged); } // last queued save: show what the sheet now holds
      } catch (e) {
        console.warn('Shortlist save failed:', e);
      } finally {
        q.pending -= 1;
      }
    });
  };

  const handleToggleShortlist = (name, entry = {}) => {
    const adding = !shortlist.includes(name);
    const op = (groups) => (adding ? addToGroups(groups, name, entry) : removeFromGroups(groups, name));
    const next = op(shortlistGroups);
    setShortlistGroups(next);
    if (!currentToken) return;
    writeCache(currentToken, 'shortlist', next);
    saveShortlistToSheet(currentToken, op, next);
  };

  return { shortlistGroups, setShortlistGroups, shortlist, handleToggleShortlist };
}
