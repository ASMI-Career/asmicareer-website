import { useState, useEffect, useRef } from 'react';
import { JOSAA, MH, cfgFor, defaultCategory, buildMhCurve, COMBINED_PARTS } from '../lib/engCutoff';

// State and data for the engineering Cutoff Explorer tab. Lives in the page (like the other hooks), so filters survive tab
// switches. Files are fetched only after the student opens the tab. A no-op for streams without config.engineeringCutoff.
export default function useEngCutoff({ config, studentCategory, active }) {
  const enabled = !!(config && config.engineeringCutoff);
  const [counselling, setCounselling] = useState('JOSAA');
  const [quota, setQuota] = useState('combined');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState('all');
  const [itype, setItype] = useState('ALL');
  const [round, setRound] = useState(JOSAA.defaultRound);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('closing_asc');
  const [pwd, setPwd] = useState(false);
  const [mainRank, setMainRank] = useState('');     // JEE Main CRL
  const [advRank, setAdvRank] = useState('');       // JEE Advanced CRL
  const [mhMerit, setMhMerit] = useState('');       // MHT-CET state merit number
  const [pMode, setPMode] = useState('percentile');   // Predictor: 'percentile' or 'rank'
  const [mainPct, setMainPct] = useState('');        // Predictor: JEE Main percentile
  const [mhPct, setMhPct] = useState('');            // Predictor: MHT-CET percentile
  const [mhCurve, setMhCurve] = useState(null);      // percentile -> merit pairs from last year's Maharashtra results
  const [visible, setVisible] = useState(40);
  const [manifest, setManifest] = useState(null);
  const [intake, setIntake] = useState({});
  const [data, setData] = useState({ loading: false, error: false, colleges: [] });
  const seq = useRef(0);
  const touched = useRef(false);   // the student changed the category themselves

  // Maharashtra needs its manifest (quotas, categories, rounds, institute types) before it can show anything.
  useEffect(() => {
    if (!enabled || !active || counselling !== 'MH' || manifest) return;
    let live = true;
    fetch(MH.manifest).then(r => r.json()).then(m => { if (live) setManifest(m); })
      .catch(() => { if (live) setData({ loading: false, error: true, colleges: [] }); });
    fetch(MH.intake).then(r => (r.ok ? r.json() : {})).then(j => { if (live) setIntake(j || {}); }).catch(() => {});
    return () => { live = false; };
  }, [enabled, active, counselling, manifest]);

  // Predictor only: last year's Open (state level) results give the percentile -> merit relation for Maharashtra.
  useEffect(() => {
    if (!enabled || !active || counselling !== 'MH' || mhCurve) return;
    let live = true;
    fetch(`${MH.base}/state-level/OPEN/all.json`).then(r => r.json()).then(j => { if (live) setMhCurve(buildMhCurve(j.colleges)); }).catch(() => {});
    return () => { live = false; };
  }, [enabled, active, counselling, mhCurve]);

  const mhQuota = manifest ? manifest.quotas.find(q => q.key === quota) : null;
  const mhCategories = mhQuota ? mhQuota.categories : [];
  const mhGenders = (() => { const c = mhCategories.find(x => x.key === category); return c ? c.genders : ['all']; })();

  // Pick the student's own category the first time, and whenever the options change underneath the current choice.
  useEffect(() => {
    if (!enabled) return;
    const keys = counselling === 'MH' ? mhCategories.map(c => c.key) : JOSAA.categories.map(c => c.key);
    if (counselling === 'MH' && !manifest) return;
    const want = defaultCategory(counselling, studentCategory, keys);
    if (!touched.current) { if (category !== want) setCategory(want); }
    else if (!keys.includes(category)) setCategory(want);
    if (counselling === 'MH' && !mhGenders.includes(gender)) setGender('all');
  }, [enabled, counselling, manifest, quota, studentCategory, category, gender, mhCategories.length, mhGenders.join('|')]);

  // Load the file for the current selection.
  useEffect(() => {
    if (!enabled || !active || !category) return;
    if (counselling === 'MH' && !manifest) return;
    const id = ++seq.current;
    setData(d => ({ ...d, loading: true, error: false }));
    const parts = (counselling === 'JOSAA' && quota === 'combined') ? COMBINED_PARTS : [quota];
    Promise.all(parts.map(q => fetch(`${cfgFor(counselling).base}/${q}/${category}/${gender}.json`)
      .then(r => { if (r.status === 404) return { colleges: [] }; if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(j => (j.colleges || []).map(c => ({ ...c, _quota: q })))))
      .then(lists => { if (id === seq.current) { setData({ loading: false, error: false, colleges: [].concat(...lists) }); setVisible(40); } })
      .catch(() => { if (id === seq.current) setData({ loading: false, error: true, colleges: [] }); });
  }, [enabled, active, counselling, quota, category, gender, manifest]);

  const switchCounselling = (key) => {
    if (key === counselling) return;
    touched.current = false;
    setCounselling(key); setQuota(key === 'MH' ? MH.defaultQuota : 'combined'); setCategory(''); setGender('all'); setItype('ALL');
    setRound(key === 'MH' ? (manifest ? manifest.rounds[manifest.rounds.length - 1] : 'Round 1') : JOSAA.defaultRound);
    setPwd(false); setVisible(40);
  };
  // Once the Maharashtra manifest arrives, start on its last round.
  useEffect(() => { if (counselling === 'MH' && manifest && !manifest.rounds.includes(round)) setRound(manifest.rounds[manifest.rounds.length - 1]); }, [counselling, manifest, round]);

  return {
    ecEnabled: enabled, ecCounselling: counselling, ecSwitch: switchCounselling,
    ecQuota: quota, setEcQuota: (v) => { touched.current = false; setQuota(v); setCategory(''); },
    ecCategory: category, setEcCategory: (v) => { touched.current = true; setCategory(v); },
    ecGender: gender, setEcGender: setGender, ecItype: itype, setEcItype: (v) => { setItype(v); setVisible(40); },
    ecRound: round, setEcRound: setRound, ecSearch: search, setEcSearch: (v) => { setSearch(v); setVisible(40); },
    ecSort: sort, setEcSort: setSort, ecPwd: pwd, setEcPwd: setPwd,
    ecMainRank: mainRank, setEcMainRank: setMainRank, ecAdvRank: advRank, setEcAdvRank: setAdvRank, ecMhMerit: mhMerit, setEcMhMerit: setMhMerit,
    ecPMode: pMode, setEcPMode: setPMode, ecMainPct: mainPct, setEcMainPct: setMainPct, ecMhPct: mhPct, setEcMhPct: setMhPct, ecMhCurve: mhCurve,
    ecVisible: visible, ecShowMore: () => setVisible(v => v + 40),
    ecManifest: manifest, ecIntake: intake, ecData: data, ecMhCategories: mhCategories, ecMhGenders: mhGenders,
  };
}
