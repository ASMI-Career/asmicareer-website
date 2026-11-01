import { useState, useEffect } from 'react';
import { selectDeadlines, mergeEvents } from '../../../lib/events';

// Static data the tabs read (events, rank database, institutes, score database, fee map) plus the cutoff data for the student's category.
// Which files to read, and which cutoff folders, comes from the stream config (config.catalog); a null entry means the stream has no such data.
export default function useCatalog({ config, studentCategory, studentTracks }) {
  const cat = config.catalog;
  const [events, setEvents] = useState([]);
  const [collegeData, setCollegeData] = useState([]);
  const [collegesList, setCollegesList] = useState([]);
  const [asmiDb, setAsmiDb] = useState(null);
  const [feeMap, setFeeMap] = useState({});
  const [cutoffDbData, setCutoffDbData] = useState([]);

  useEffect(() => {
    Promise.all((cat.events || []).map(url => fetch(url).then(r => r.json())))
      .then(lists => setEvents(mergeEvents(...lists)))
      .catch(() => {});

    if (cat.rankDb) fetch(cat.rankDb).then(r => r.json()).then(setCollegeData).catch(() => {});
    if (cat.colleges) fetch(cat.colleges).then(r => r.json()).then(setCollegesList).catch(() => {});
    if (cat.asmiDb) fetch(cat.asmiDb).then(r => r.json()).then(setAsmiDb).catch(() => {});
    if (cat.feeMap) fetch(cat.feeMap).then(r => r.json()).then(setFeeMap).catch(() => {});
  }, []);

  // Deadlines shown on the dashboard: this stream's (or "all") events, on the student's tracks, not past, soonest first.
  const deadlines = selectDeadlines(events, {
    streamId: config.id,
    studentTracks,
    allTracks: (config.tracks || []).map(t => t.id),
    rules: config.deadlines,
  });

  useEffect(() => {
    const cut = cat.cutoff;
    if (!cut) return;   // this stream has no cutoff data loaded here
    const mccCatKey = (!studentCategory || studentCategory === 'General') ? 'OPEN' : studentCategory.toUpperCase();
    const mhCatDir  = mccCatKey;

    const computeClosingRank = (rounds) => Math.max(
      rounds?.['Round 1']?.AIR ?? 0,
      rounds?.['Round 2']?.AIR ?? 0,
      rounds?.['Round 3']?.AIR ?? 0
    );

    const tryFetch = async (url, fallbackUrl) => {
      try {
        let res = await fetch(url);
        if (!res.ok && fallbackUrl) res = await fetch(fallbackUrl);
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    };

    const loadCutoffData = async () => {
      const entries = [];

      const mcc = cut.mcc;
      await Promise.all(mcc.folders.map(async (t) => {
        const data = await tryFetch(
          `${mcc.base}/${t.key}/${mccCatKey}.json`,
          `${mcc.base}/${t.key}/OPEN.json`
        );
        if (!data?.colleges) return;
        for (const c of data.colleges) {
          const closingRank = computeClosingRank(c.rounds);
          if (closingRank > 0)
            entries.push({ name: c.name, state: c.state || '', closingRank, fees: c.fees || '', type: t.type, pool: mcc.pool, quota: mcc.quota });
        }
      }));

      const mh = cut.mh;
      await Promise.all(mh.folders.map(async (t) => {
        const data = await tryFetch(
          `${mh.base}/${t.key}/${mhCatDir}/${mh.file}`,
          `${mh.base}/${t.key}/OPEN/${mh.file}`
        );
        if (!data?.colleges) return;
        for (const c of data.colleges) {
          const closingRank = computeClosingRank(c.rounds);
          if (closingRank > 0)
            entries.push({ name: c.name, state: mh.state, closingRank, fees: c.fees || '', type: t.type, pool: mh.pool, quota: mh.quota });
        }
      }));

      const os = cut.openStates;
      await Promise.all(Object.entries(os.states).map(async ([stateDir, stateName]) => {
        const data = await tryFetch(`${os.base}/${stateDir}/${os.file}`);
        if (!data?.colleges) return;
        const seen = new Map();
        for (const c of data.colleges) {
          const closingRank = computeClosingRank(c.rounds);
          if (closingRank > 0 && (!seen.has(c.name) || closingRank > seen.get(c.name).closingRank))
            seen.set(c.name, { name: c.name, state: stateName, closingRank, fees: c.fees || '', type: os.type, pool: os.pool, quota: os.quota });
        }
        entries.push(...seen.values());
      }));

      setCutoffDbData(entries);
    };

    loadCutoffData();
  }, [studentCategory]);

  return { deadlines, collegeData, collegesList, asmiDb, feeMap, cutoffDbData };
}
