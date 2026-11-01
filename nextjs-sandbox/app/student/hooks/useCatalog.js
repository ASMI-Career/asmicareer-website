import { useState, useEffect } from 'react';

// Static data the tabs read (deadlines, rank database, institutes, score database, fee map) plus the cutoff data for the student's category.
export default function useCatalog(studentCategory) {
  const [deadlines, setDeadlines] = useState([]);
  const [collegeData, setCollegeData] = useState([]);
  const [collegesList, setCollegesList] = useState([]);
  const [asmiDb, setAsmiDb] = useState(null);
  const [feeMap, setFeeMap] = useState({});
  const [cutoffDbData, setCutoffDbData] = useState([]);

  useEffect(() => {
    fetch('/data/events.json')
      .then(r => r.json())
      .then(data => {
        const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
        const isExpired = (ev) => {
          // Result entries stay visible regardless of date
          if (ev.title && ev.title.toLowerCase().includes('result')) return false;
          const targetDate = new Date(ev.expiry_date || ev.date);
          return targetDate < todayMidnight;
        };
        setDeadlines(
          data
            .filter(ev => !isExpired(ev))
            .map(ev => ({ title: ev.title, date: ev.date, tag: ev.tag || 'NOTICE' }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        );
      }).catch(() => {});

    fetch('/data/rank_db.json').then(r => r.json()).then(setCollegeData).catch(() => {});
    fetch('/data/colleges.json').then(r => r.json()).then(setCollegesList).catch(() => {});
    fetch('/data/asmi_db.json').then(r => r.json()).then(setAsmiDb).catch(() => {});
    fetch('/fee_map.json').then(r => r.json()).then(setFeeMap).catch(() => {});
  }, []);


  useEffect(() => {
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

      const mccTypes = [
        { key: 'GOVT_MBBS',    type: 'Government' },
        { key: 'AIIMS_MBBS',   type: 'AIIMS'      },
        { key: 'JIPMER_MBBS',  type: 'Government' },
        { key: 'CENTRAL_MBBS', type: 'Government' },
        { key: 'DEEMED_MBBS',  type: 'Deemed'     },
      ];
      await Promise.all(mccTypes.map(async (t) => {
        const data = await tryFetch(
          `/data/cutoffs/MCC/2025/${t.key}/${mccCatKey}.json`,
          `/data/cutoffs/MCC/2025/${t.key}/OPEN.json`
        );
        if (!data?.colleges) return;
        for (const c of data.colleges) {
          const closingRank = computeClosingRank(c.rounds);
          if (closingRank > 0)
            entries.push({ name: c.name, state: c.state || '', closingRank, fees: c.fees || '', type: t.type, pool: 'MCC AIQ', quota: 'AIQ' });
        }
      }));

      const mhTypes = [
        { key: 'GOVT_MBBS',    type: 'Government' },
        { key: 'PRIVATE_MBBS', type: 'Private'    },
      ];
      await Promise.all(mhTypes.map(async (t) => {
        const data = await tryFetch(
          `/data/cutoffs/MH/2025/${t.key}/${mhCatDir}/GENERAL.json`,
          `/data/cutoffs/MH/2025/${t.key}/OPEN/GENERAL.json`
        );
        if (!data?.colleges) return;
        for (const c of data.colleges) {
          const closingRank = computeClosingRank(c.rounds);
          if (closingRank > 0)
            entries.push({ name: c.name, state: 'Maharashtra', closingRank, fees: c.fees || '', type: t.type, pool: 'MH State', quota: 'State' });
        }
      }));

      const OPEN_STATES_DIRS = {
        Karnataka: 'Karnataka', Telangana: 'Telangana', Tamil_Nadu: 'Tamil Nadu',
        Uttar_Pradesh: 'Uttar Pradesh', Kerala: 'Kerala', Andhra_Pradesh: 'Andhra Pradesh',
        Haryana: 'Haryana', West_Bengal: 'West Bengal', Bihar: 'Bihar',
        Uttarakhand: 'Uttarakhand', Chhattisgarh: 'Chhattisgarh', Jharkhand: 'Jharkhand',
        Himachal_Pradesh: 'Himachal Pradesh', Pondicherry: 'Pondicherry',
        Manipur: 'Manipur', Meghalaya: 'Meghalaya', Sikkim: 'Sikkim'
      };
      await Promise.all(Object.entries(OPEN_STATES_DIRS).map(async ([stateDir, stateName]) => {
        const data = await tryFetch(`/data/cutoffs/OPEN/2025/${stateDir}/MQ.json`);
        if (!data?.colleges) return;
        const seen = new Map();
        for (const c of data.colleges) {
          const closingRank = computeClosingRank(c.rounds);
          if (closingRank > 0 && (!seen.has(c.name) || closingRank > seen.get(c.name).closingRank))
            seen.set(c.name, { name: c.name, state: stateName, closingRank, fees: c.fees || '', type: 'Private', pool: 'Open State', quota: 'Open State' });
        }
        entries.push(...seen.values());
      }));

      setCutoffDbData(entries);
    };

    loadCutoffData();
  }, [studentCategory]);

  return { deadlines, collegeData, collegesList, asmiDb, feeMap, cutoffDbData };
}
