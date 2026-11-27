import { useState, useEffect, useRef } from 'react';
import { JOSAA, MH, defaultCategory, fetchCutoffRecords, fetchMhManifest, quotaLabelOf, parseRank, pickRank } from '../lib/engCutoff';
import {
  buildList, rowFromRecord, indexRecords, mergePinned, familyForDesired, recordKey, TAG_LABELS, DREAM_OPTIONS, DEFAULT_DREAM, MAX_ROWS_DEFAULT, MAX_ROWS_LIMIT,
} from '../lib/prefList';
import { readCache, writeCache } from '../lib/cache';
import { callDash } from '../lib/api';

// State for the engineering "Preference List" tab. Lives in the page (like the other hooks), so the list survives tab switches.
// It loads its own cutoff files with the shared loaders in lib/engCutoff.js and never touches the Explorer's state.
// Saving: Apps Script actions savePreferenceList / getPreferenceList (only when the script said pref_list_enabled). The list is also
// kept in the browser cache (per token), so nothing is lost if saving is unavailable.
const SAVE_DELAY_MS = 1500;
const SCRIPT_COUNSELLING = { JOSAA: 'JOSAA', MH: 'CAP' };
const ITEM_LIMIT = MAX_ROWS_LIMIT;

async function loadSaved(endpoint, token, c) {
  const res = await callDash(endpoint, 'getPreferenceList', { counselling: SCRIPT_COUNSELLING[c] }, token);
  if (!(res && res.ok && Array.isArray(res.items))) throw new Error('not available');
  return { items: res.items, locked: !!res.locked };
}
async function postSave(endpoint, token, c, items) {
  return callDash(endpoint, 'savePreferenceList', { counselling: SCRIPT_COUNSELLING[c], items }, token);
}
const toItem = (r) => ({ institute: r.institute, program: r.program, quota: r.quota, gender: r.gender || 'all', choiceCode: r.choiceCode || '', tag: (r.pinned ? 'PICK:' : '') + (r.tag || 'none') });
// A saved item -> a stored row. Its numbers come back when the row is matched against the loaded data.
const fromItem = (c, it) => {
  const pinned = /^PICK:/.test(it.tag || ''); const tag = String(it.tag || 'none').replace(/^PICK:/, '');
  return { key: recordKey(c, it.institute, it.program, it.quota, it.gender, it.choiceCode), counselling: c, institute: it.institute, program: it.program, type: '', quota: it.quota,
    gender: it.gender || 'all', choiceCode: it.choiceCode || '', closing: null, round: '', rankUsed: null, tag, tagLabel: TAG_LABELS[tag] || tag, pinned };
};

export default function usePrefList({ config, endpoint, currentToken, active, studentCategory, profile, prefListEnabled, shortlistGroups }) {
  const enabled = !!(config && config.preferenceList);
  const [counselling, setCounselling] = useState('JOSAA');
  const isMH = counselling === 'MH';
  const [quota, setQuota] = useState('combined');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState('all');
  const [pwd, setPwd] = useState(false);
  const [ranks, setRanks] = useState({ mainCrl: '', mainCat: '', advCrl: '', advCat: '', merit: '' });
  const [mode, setMode] = useState('branch');
  const [dreamKey, setDreamKey] = useState(String(DEFAULT_DREAM));
  const [maxRows, setMaxRows] = useState(MAX_ROWS_DEFAULT);
  const [round, setRound] = useState('');                 // '' = the final round that has a value
  const [filters, setFilters] = useState({ types: [], name: '', university: '', autonomousOnly: false });
  const [families, setFamilies] = useState(null);
  const [selected, setSelected] = useState([]);            // ordered family ids
  const [exact, setExact] = useState([]);                  // exact program names the student picked
  const [manifest, setManifest] = useState(null);
  const [data, setData] = useState({ loading: false, error: false, records: [] });
  const [lists, setLists] = useState({ JOSAA: [], MH: [] });
  const [edited, setEdited] = useState({ JOSAA: false, MH: false });   // the student moved or removed rows by hand
  const [warnings, setWarnings] = useState([]);
  const [generated, setGenerated] = useState({ JOSAA: false, MH: false });
  const [pending, setPending] = useState(null);           // a regenerated list waiting for the student to confirm replacing manual edits
  const [saveState, setSaveState] = useState({ JOSAA: 'idle', MH: 'idle' });   // idle | saving | saved | error | locked | unavailable
  const [notice, setNotice] = useState('');

  const seq = useRef(0);
  const catTouched = useRef(false);
  const rankTouched = useRef(false);
  const famTouched = useRef(false);
  const profRanks = useRef({});
  const [profTick, setProfTick] = useState(0);
  const listsRef = useRef(lists); listsRef.current = lists;
  const timers = useRef({});
  const chain = useRef(Promise.resolve());
  const loadedCache = useRef(false);
  const loadedSaved = useRef(false);
  const lockedRef = useRef(false);

  // ── data ──
  useEffect(() => {
    if (!enabled || !active || families) return;
    fetch('/data/branchFamilies.json').then(r => r.json()).then(setFamilies).catch(() => setFamilies([]));
  }, [enabled, active, families]);

  useEffect(() => {
    if (!enabled || !active || !isMH || manifest) return;
    let live = true;
    fetchMhManifest().then(m => { if (live) setManifest(m); }).catch(() => { if (live) setData({ loading: false, error: true, records: [] }); });
    return () => { live = false; };
  }, [enabled, active, isMH, manifest]);

  const mhQuota = manifest ? manifest.quotas.find(q => q.key === quota) : null;
  const mhCategories = mhQuota ? mhQuota.categories : [];
  const mhGenders = (() => { const c = mhCategories.find(x => x.key === category); return c ? c.genders : ['all']; })();

  useEffect(() => {
    if (!enabled) return;
    if (isMH && !manifest) return;
    const keys = isMH ? mhCategories.map(c => c.key) : JOSAA.categories.map(c => c.key);
    const want = defaultCategory(counselling, studentCategory, keys);
    if (!catTouched.current) { if (category !== want) setCategory(want); } else if (!keys.includes(category)) setCategory(want);
    if (isMH && !mhGenders.includes(gender)) setGender('all');
  }, [enabled, counselling, manifest, quota, studentCategory, category, gender, mhCategories.length, mhGenders.join('|')]);

  useEffect(() => {
    if (!enabled || !active || !category) return;
    if (isMH && !manifest) return;
    const id = ++seq.current;
    setData(d => ({ ...d, loading: true, error: false }));
    fetchCutoffRecords(counselling, quota, category, gender)
      .then(records => { if (id === seq.current) setData({ loading: false, error: false, records }); })
      .catch(() => { if (id === seq.current) setData({ loading: false, error: true, records: [] }); });
  }, [enabled, active, counselling, quota, category, gender, manifest]);

  // ── profile prefill (same rules as the Explorer: only values the student has filled in; typing here is never written back) ──
  const prefill = (v) => {
    profRanks.current = { mainCrl: v.mainCrl || '', mainCat: v.mainCat || '', advCrl: v.advCrl || '', advCat: v.advCat || '', merit: v.mhMerit || '' };
    setProfTick(t => t + 1);
    if (v.pwd) setPwd(true);
  };
  useEffect(() => {
    if (!enabled || rankTouched.current) return;
    const p = profRanks.current;
    if (p.mainCrl || p.mainCat || p.advCrl || p.advCat || p.merit) setRanks({ mainCrl: p.mainCrl || '', mainCat: p.mainCat || '', advCrl: p.advCrl || '', advCat: p.advCat || '', merit: p.merit || '' });
  }, [enabled, profTick]);

  // desired branches from the profile -> branch families, once
  useEffect(() => {
    if (!enabled || !families || famTouched.current || !profile || !Array.isArray(profile.desired_branches)) return;
    const ids = [];
    profile.desired_branches.forEach(t => { const id = familyForDesired(t, families); if (id && !ids.includes(id)) ids.push(id); });
    if (ids.length) setSelected(ids);
  }, [enabled, families, profile]);

  // ── saved lists: the browser copy first (once), then the sheet's copy as soon as the script says it supports it ──
  useEffect(() => {
    if (!enabled || !active || !currentToken || loadedCache.current) return;
    loadedCache.current = true;
    const cached = readCache(currentToken, 'preflist');
    if (cached && typeof cached === 'object') {
      const next = { JOSAA: Array.isArray(cached.JOSAA) ? cached.JOSAA : [], MH: Array.isArray(cached.MH) ? cached.MH : [] };
      setLists(next); listsRef.current = next;
    }
  }, [enabled, active, currentToken]);
  useEffect(() => {
    if (!enabled || !active || !currentToken || !endpoint || !prefListEnabled || loadedSaved.current) return;
    loadedSaved.current = true;
    ['JOSAA', 'MH'].forEach(async (c) => {
      try {
        const { items, locked } = await loadSaved(endpoint, currentToken, c);
        if (locked) { lockedRef.current = true; setSaveState(s => ({ ...s, [c]: 'locked' })); }
        if (items.length) setLists(l => { const n = { ...l, [c]: items.map(it => fromItem(c, it)) }; listsRef.current = n; return n; });
        setSaveState(s => (s[c] === 'locked' ? s : { ...s, [c]: 'saved' }));
      } catch (e) { setSaveState(s => ({ ...s, [c]: 'unavailable' })); }
    });
  }, [enabled, active, currentToken, endpoint, prefListEnabled]);

  // ── saving: debounced, one after another ──
  const runSave = (c) => {
    chain.current = chain.current.then(async () => {
      if (lockedRef.current) return;
      const rows = listsRef.current[c];
      setSaveState(s => ({ ...s, [c]: 'saving' }));
      try {
        const res = await postSave(endpoint, currentToken, c, rows.map(toItem));
        if (res && res.ok) setSaveState(s => ({ ...s, [c]: 'saved' }));
        else if (res && res.error === 'locked') { lockedRef.current = true; setSaveState(s => ({ ...s, [c]: 'locked' })); }
        else setSaveState(s => ({ ...s, [c]: res && res.error === 'invalid_action' ? 'unavailable' : 'error' }));
      } catch (e) { setSaveState(s => ({ ...s, [c]: 'error' })); }
    });
  };
  const scheduleSave = (c) => {
    if (!currentToken || !endpoint || !prefListEnabled || lockedRef.current) return;
    clearTimeout(timers.current[c]);
    setSaveState(s => ({ ...s, [c]: 'saving' }));
    timers.current[c] = setTimeout(() => runSave(c), SAVE_DELAY_MS);
  };
  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  // every change to a list goes through here: state, browser cache, then the debounced save
  const commit = (c, rows, { manual = false, resetEdited = false } = {}) => {
    const next = { ...listsRef.current, [c]: rows };
    listsRef.current = next; setLists(next);
    if (currentToken) writeCache(currentToken, 'preflist', next);
    if (manual) setEdited(e => ({ ...e, [c]: true })); else if (resetEdited) setEdited(e => ({ ...e, [c]: false }));
    scheduleSave(c);
  };

  // ── derived: the numbers the generator uses ──
  const reservedCats = JOSAA.categories.filter(x => x.key !== 'OPEN').map(x => x.key);
  const studentRanks = { mainCrl: parseRank(ranks.mainCrl), mainCat: parseRank(ranks.mainCat), advCrl: parseRank(ranks.advCrl), advCat: parseRank(ranks.advCat), merit: parseRank(ranks.merit) };
  const rounds = isMH ? (manifest ? manifest.rounds : []) : JOSAA.rounds;
  const dream = DREAM_OPTIONS.find(d => d.key === dreamKey) || DREAM_OPTIONS[1];
  const famList = families || [];
  const selectedFamilies = selected.map(id => famList.find(f => f.id === id)).filter(Boolean).concat(exact.map(p => ({ id: 'x:' + p, label: p, exact: p })));

  // rows as shown: re-matched against the loaded data, so tags follow the current ranks (rows that are not in the data say so)
  const index = data.records.length ? indexRecords({ counselling, records: data.records, quota, gender, manifest }) : null;
  // the generator's context for one record (which student rank applies, rounds, PwD, Dream factor)
  const ctxForRanks = () => {
    const reserved = !isMH && category !== 'OPEN';
    return { counselling, rankFor: (c) => (isMH ? studentRanks.merit : pickRank(counselling, c.type, reserved, studentRanks)), rounds, round: round || null, pwd, dreamFactor: dream.factor, quota, gender, manifest };
  };
  const displayRows = (c) => (listsRef.current[c] || []).map(r => {
    if (c !== counselling || !index || data.loading) return r;
    const rec = index.get(r.key);
    if (!rec) return { ...r, tag: 'missing', tagLabel: TAG_LABELS.missing };
    const row = rowFromRecord(ctxForRanks(), rec, { allowOut: true });
    return row ? { ...row, pinned: r.pinned } : { ...r, tag: 'none', tagLabel: TAG_LABELS.none };
  });

  // ── actions ──
  const switchCounselling = (key) => {
    if (key === counselling) return;
    catTouched.current = false; setCounselling(key); setQuota(key === 'MH' ? MH.defaultQuota : 'combined'); setCategory(''); setGender('all');
    setRound(''); setFilters({ types: [], name: '', university: '', autonomousOnly: false }); setData({ loading: false, error: false, records: [] }); setPending(null); setWarnings([]);
  };
  const setRank = (k, v) => { rankTouched.current = true; setRanks(r => ({ ...r, [k]: v })); };
  const setCat = (v) => { catTouched.current = true; setCategory(v); };
  const changeQuota = (v) => { catTouched.current = false; setQuota(v); setCategory(''); };
  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const toggleType = (t) => setFilters(f => ({ ...f, types: f.types.includes(t) ? f.types.filter(x => x !== t) : f.types.concat(t) }));
  const addFamily = (id) => { famTouched.current = true; setSelected(s => (s.includes(id) ? s : s.concat(id))); };
  const removeFamily = (id) => { famTouched.current = true; setSelected(s => s.filter(x => x !== id)); };
  const moveFamily = (id, dir) => { famTouched.current = true; setSelected(s => { const i = s.indexOf(id); const j = i + dir; if (i < 0 || j < 0 || j >= s.length) return s; const n = s.slice(); [n[i], n[j]] = [n[j], n[i]]; return n; }); };
  const addExact = (p) => { if (p && !exact.includes(p)) setExact(e => e.concat(p)); };
  const removeExact = (p) => setExact(e => e.filter(x => x !== p));

  const generate = (force = false) => {
    setNotice('');
    const res = buildList({ counselling, records: data.records, studentRanks, category, pwd, rounds, round: round || null, mode, branchFamilies: selectedFamilies, allFamilies: famList,
      filters, dreamFactor: dream.factor, maxRows, quota, gender, manifest });
    setWarnings(res.warnings); setGenerated(g => ({ ...g, [counselling]: true }));
    const old = listsRef.current[counselling];
    const merged = mergePinned(res.rows, old);
    if (!force && edited[counselling] && old.length) { setPending(merged); return; }
    setPending(null); commit(counselling, merged, { resetEdited: true });
  };
  const confirmRegenerate = () => { if (pending) { commit(counselling, pending, { resetEdited: true }); setPending(null); } };
  const cancelRegenerate = () => setPending(null);

  const move = (i, dir) => { const rows = listsRef.current[counselling].slice(); const j = dir === 'top' ? 0 : i + dir; if (j < 0 || j >= rows.length || j === i) return; const [r] = rows.splice(i, 1); rows.splice(j, 0, r); commit(counselling, rows, { manual: true }); };
  const remove = (i) => { const rows = listsRef.current[counselling].slice(); rows.splice(i, 1); commit(counselling, rows, { manual: true }); };
  const clearList = () => commit(counselling, [], { resetEdited: true });

  // manual add: search the loaded records, add one at a chosen position as a pinned row
  const searchRecords = (q) => {
    const n = String(q || '').trim().toLowerCase();
    if (n.length < 2) return [];
    const have = new Set(listsRef.current[counselling].map(r => r.key));
    const out = [];
    for (const rec of data.records) {
      if (!(rec.name.toLowerCase().includes(n) || rec.program.toLowerCase().includes(n))) continue;
      const row = rowFromRecord(ctxForRanks(), rec, { allowOut: true });
      if (row) out.push({ ...row, inList: have.has(row.key) });
      if (out.length >= 15) break;
    }
    return out;
  };
  const addPick = (row, where = 'top') => {
    const rows = listsRef.current[counselling];
    if (rows.some(r => r.key === row.key)) { setNotice('That choice is already in your list.'); return; }
    if (rows.length >= ITEM_LIMIT) { setNotice(`A list can have at most ${ITEM_LIMIT} choices.`); return; }
    const pick = { ...row, pinned: true, inList: undefined };
    commit(counselling, where === 'top' ? [pick, ...rows] : [...rows, pick], { manual: true }); setNotice('');
  };
  // import the student's saved shortlist (Cutoff Explorer / Predictor stars): matched by name, branch and seat type
  const importShortlist = () => {
    const group = (shortlistGroups && shortlistGroups[SCRIPT_COUNSELLING[counselling] === 'CAP' ? 'CAP' : 'JOSAA']) || [];
    if (!group.length) { setNotice('Your shortlist for this counselling is empty.'); return; }
    const byTriple = new Map(); data.records.forEach(rec => byTriple.set(`${rec.name}|${rec.program}|${quotaLabelOf(counselling, rec._quota || quota, manifest)}`, rec));
    const rows = listsRef.current[counselling]; const have = new Set(rows.map(r => r.key));
    const added = []; const unmatched = [];
    group.forEach(it => {
      const rec = byTriple.get(`${it.institute || it.name}|${it.branch}|${it.seatType}`);
      const row = rec && rowFromRecord(ctxForRanks(), rec, { allowOut: true });
      if (row && !have.has(row.key)) { added.push({ ...row, pinned: true }); have.add(row.key); } else if (!row) unmatched.push(`${it.institute || it.name} — ${it.branch}`);
    });
    if (added.length) commit(counselling, [...added, ...rows].slice(0, ITEM_LIMIT), { manual: true });
    setNotice(`Imported ${added.length} from your shortlist.` + (unmatched.length ? ` ${unmatched.length} not found in the data currently loaded (try the quota or category they were saved for): ${unmatched.slice(0, 5).join('; ')}${unmatched.length > 5 ? '…' : ''}` : ''));
  };
  const retrySave = () => { if (lockedRef.current) return; runSave(counselling); };

  return {
    plEnabled: enabled, plCounselling: counselling, plIsMH: isMH, plSwitch: switchCounselling,
    plQuota: quota, plSetQuota: changeQuota, plCategory: category, plSetCategory: setCat, plGender: gender, plSetGender: setGender, plPwd: pwd, plSetPwd: setPwd,
    plRanks: ranks, plSetRank: setRank, plReservedJosaa: !isMH && reservedCats.includes(category),
    plMode: mode, plSetMode: setMode, plDreamKey: dreamKey, plSetDream: setDreamKey, plMaxRows: maxRows, plSetMaxRows: setMaxRows, plRound: round, plSetRound: setRound,
    plFilters: filters, plSetFilter: setFilter, plToggleType: toggleType,
    plFamilies: famList, plSelected: selected, plAddFamily: addFamily, plRemoveFamily: removeFamily, plMoveFamily: moveFamily, plExact: exact, plAddExact: addExact, plRemoveExact: removeExact,
    plManifest: manifest, plData: data, plMhCategories: mhCategories, plMhGenders: mhGenders, plRounds: rounds,
    plRows: displayRows(counselling), plGenerated: generated[counselling], plWarnings: warnings, plPending: pending, plEdited: edited[counselling],
    plGenerate: generate, plConfirm: confirmRegenerate, plCancel: cancelRegenerate, plMove: move, plRemove: remove, plClear: clearList,
    plSearch: searchRecords, plAddPick: addPick, plImport: importShortlist, plNotice: notice,
    plSave: prefListEnabled ? saveState[counselling] : 'unavailable', plRetrySave: retrySave, plPrefill: prefill,
  };
}

