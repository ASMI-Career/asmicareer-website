import RANK_DATA from '../data/rankData.json';
import { makeFeeFormatters } from '../lib/fees';

const RANK_SCORES = Object.keys(RANK_DATA).map(Number).sort((a,b) => b - a);

export default function Predictor(props) {
  const { config, asmiDb, cpCategory, cpInputMode, cpMaxBudget, cpPoolFilter, cpQuota, cpRankInput, cpScoreCourse, cpScoreInput, cpScoreSort, cpScoreState, cpSearchFilter, cpSelectedStates, cpSelectedTypes, cpSortBy, cpStateSearch, cpTypeFilter, cutoffDbData, feeMap, handleToggleShortlist, predictedRank, predictorScore, setCpCategory, setCpInputMode, setCpMaxBudget, setCpPoolFilter, setCpQuota, setCpRankInput, setCpScoreCourse, setCpScoreInput, setCpScoreSort, setCpScoreState, setCpSearchFilter, setCpSelectedStates, setCpSelectedTypes, setCpSortBy, setCpStateSearch, setCpTypeFilter, setPredictedRank, setPredictorScore, shortlist } = props;
  const { feeStr, feeStrAIR, budgetStr } = makeFeeFormatters(feeMap, config.fees);
  const pc = config.predictor;   // everything NEET/MBBS specific (limits, rules, labels, pools) comes from the stream config

  function getRankFromScore(score) {
    if (RANK_DATA[score]) return RANK_DATA[score];
    const above = RANK_SCORES.find(x => x <= score);
    const below = [...RANK_SCORES].reverse().find(x => x >= score);
    if (!above && !below) return null;
    if (!above) return RANK_DATA[below];
    if (!below) return RANK_DATA[above];
    const ratio = (score - below) / (above - below);
    return {
      min_rank: Math.round(RANK_DATA[above].min_rank + (RANK_DATA[below].min_rank - RANK_DATA[above].min_rank) * (1 - ratio)),
      max_rank: Math.round(RANK_DATA[above].max_rank + (RANK_DATA[below].max_rank - RANK_DATA[above].max_rank) * (1 - ratio))
    };
  }


  // Predictors
  const handlePredictRank = () => {
    const score = parseInt(predictorScore, 10);
    if (isNaN(score) || score < pc.scoreMin || score > pc.scoreMax) { alert(pc.scoreInvalidMessage); return; }
    setPredictedRank(getRankFromScore(Math.max(pc.scoreFloor, score - pc.scoreAdjust)));
  };

  // ── Chance label (mirrors the live Cutoff Explorer tool) ──────────────────
  // High  = closing rank ≥ your rank * 1.10  (comfortable buffer)
  // Med   = closing rank ≥ your rank          (within range)
  // Low   = closing rank ≥ your rank * 0.92  (slight stretch, within 8%)
  // (records outside Low range are excluded from results)
  const getChance = (cutoff, rank) => {
    if (cutoff >= rank * pc.chanceBands.high) return { label: 'High',   cls: 'badge-safe',       sort: 0 };
    if (cutoff >= rank)        return { label: 'Med',    cls: 'badge-likely',     sort: 1 };
    if (cutoff >= rank * pc.chanceBands.low) return { label: 'Low',    cls: 'badge-borderline', sort: 2 };
    return null; // excluded
  };

  const getRankPredictedColleges = () => {
    const rank = parseInt(cpRankInput, 10);
    if (isNaN(rank) || rank < 1) return [];

    const parseAirFee = (f) => parseInt(String(f || '').replace(/[,\s]/g, ''), 10) || 0;
    let results = [];
    for (const c of cutoffDbData) {
      const cutoff = c.closingRank;
      if (!cutoff || cutoff === 0) continue;

      // Budget filter
      const feeRaw = parseAirFee(c.fees);
      if (feeRaw > 0 && feeRaw > cpMaxBudget) continue;

      // Quota filter
      if (cpQuota !== 'All' && c.quota !== cpQuota) continue;

      // Multi-state filter
      if (cpSelectedStates.length > 0 && !cpSelectedStates.includes(c.state)) continue;

      // Multi-type filter
      if (cpSelectedTypes.length > 0 && !cpSelectedTypes.includes(c.type)) continue;

      // Name search filter
      if (cpSearchFilter && !c.name.toLowerCase().includes(cpSearchFilter.toLowerCase())) continue;

      // Chance calc (excludes records beyond Low)
      const chance = getChance(cutoff, rank);
      if (!chance) continue;

      results.push({ ...c, closingRank: cutoff, chance: chance.label, chanceClass: chance.cls, chanceSort: chance.sort });
    }

    // Sort
    if (cpSortBy === 'chance')     results.sort((a, b) => a.chanceSort - b.chanceSort || a.closingRank - b.closingRank);
    else if (cpSortBy === 'rank')  results.sort((a, b) => a.closingRank - b.closingRank);
    else if (cpSortBy === 'fees_asc')  results.sort((a, b) => parseAirFee(a.fees) - parseAirFee(b.fees));
    else if (cpSortBy === 'fees_desc') results.sort((a, b) => parseAirFee(b.fees) - parseAirFee(a.fees));
    else if (cpSortBy === 'name')  results.sort((a, b) => a.name.localeCompare(b.name));

    return results;
  };

  const prob = (score, cutoff) => {
    const gap = score - (cutoff + pc.prob.projection);
    if (gap >= pc.prob.safe)  return { key: 'safe',       label: 'Safe',        cls: 'badge-safe' };
    if (gap >= pc.prob.likely)   return { key: 'likely',     label: 'Likely',      cls: 'badge-likely' };
    if (gap >= pc.prob.borderline) return { key: 'borderline', label: 'Borderline',  cls: 'badge-borderline' };
    return                 { key: 'reach',      label: 'Out of Reach', cls: 'badge-reach' };
  };

  const getCategoryKeys = (category) => {
    const cat = category.toUpperCase();
    const m = {
      'OPEN': ['OPEN'],
      'GENERAL': ['OPEN'],
      'OBC': ['OBC', 'OPEN'],
      'SC': ['SC', 'OPEN'],
      'ST': ['ST', 'OPEN'],
      'EWS': ['EWS', 'OPEN'],
      'SEBC': ['SEBC', 'OPEN'],
      'VJ': ['VJ', 'OPEN'],
      'NT1': ['NT1', 'OPEN'],
      'NT2': ['NT2', 'OPEN'],
      'NT3': ['NT3', 'OPEN'],
      'IQ': ['IQ', 'OPEN']
    };
    return m[cat] || ['OPEN'];
  };

  const getMHCollegesList = (course, listType, userCat, score) => {
    if (!asmiDb || !asmiDb.MH || !asmiDb.MH[course]) return [];
    
    const openList = asmiDb.MH[course]?.OPEN?.[listType] || [];
    const catList = (userCat !== 'Open' && userCat !== 'General' && userCat !== 'IQ')
      ? (asmiDb.MH[course]?.[userCat.toUpperCase()]?.[listType] || [])
      : (userCat === 'IQ' && listType === 'mh_iq')
        ? (asmiDb.MH[course]?.IQ?.mh_iq || [])
        : [];
        
    const openMap = new Map(openList.map(c => [c.n, c.c]));
    const catMap = new Map(catList.map(c => [c.n, c.c]));
    const allNames = new Set([...openMap.keys(), ...catMap.keys()]);
    const cols = [];
    allNames.forEach(name => {
      const openC = openMap.has(name) ? openMap.get(name) : null;
      const catC = catMap.has(name) ? catMap.get(name) : null;
      const bestC = Math.min(openC ?? Infinity, catC ?? Infinity);
      if (bestC === Infinity) return;
      
      const p = prob(score, bestC);
      cols.push({
        name,
        openCutoff: openC,
        catCutoff: catC,
        cutoff: bestC,
        projected: bestC + pc.prob.projection,
        chance: p.label,
        chanceKey: p.key,
        chanceClass: p.cls,
        state: pc.mhState,
        pool: pc.pools.mh,
        type: listType === 'mh_govt' ? 'Government' : 'Private'
      });
    });
    return cols;
  };

  const getMCCCollegesList = (course, userCat, score) => {
    const catKeyForList = (userCat !== 'Open' && userCat !== 'General')
      ? userCat.toUpperCase() : null;
    const results = [];

    const addColleges = (stateKey, courseKey, listType, type) => {
      if (!asmiDb || !asmiDb[stateKey] || !asmiDb[stateKey][courseKey]) return;
      const openList = asmiDb[stateKey][courseKey]['OPEN']?.[listType] || [];
      const catList = catKeyForList
        ? (asmiDb[stateKey][courseKey][catKeyForList]?.[listType] || [])
        : [];
      const openMap = new Map(openList.map(c => [c.n, c.c]));
      const catMap = new Map(catList.map(c => [c.n, c.c]));
      const stateMap = new Map([...openList, ...catList].map(c => [c.n, c.s || 'India']));
      const allNames = new Set([...openMap.keys(), ...catMap.keys()]);
      allNames.forEach(name => {
        const openC = openMap.has(name) ? openMap.get(name) : null;
        const catC = catMap.has(name) ? catMap.get(name) : null;
        const bestC = Math.min(openC ?? Infinity, catC ?? Infinity);
        if (bestC === Infinity) return;
        const p = prob(score, bestC);
        results.push({
          name,
          openCutoff: openC,
          catCutoff: catC,
          cutoff: bestC,
          projected: bestC + pc.prob.projection,
          state: stateMap.get(name) || 'India',
          chance: p.label,
          chanceKey: p.key,
          chanceClass: p.cls,
          pool: pc.pools.mcc,
          type
        });
      });
    };

    addColleges('AIQ', course, 'aiq', 'Government');
    if (course === pc.mainCourse) {
      addColleges('AIIMS', pc.mainCourse, 'aiims', 'Government');
      addColleges('JIPMER', pc.mainCourse, 'jipmer', 'Government');
    }
    addColleges('CENTRAL', course, 'central', 'Government');
    addColleges('DEEMED', course, 'deemed', 'Deemed');

    return results;
  };

  const getOpenStateCollegesList = (course, score) => {
    if (course !== pc.mainCourse) return [];
    const results = [];
    const OPEN_STATES = ['KA', 'TS', 'TN', 'UP', 'KL', 'AP', 'HR', 'WB', 'BR', 'UK', 'CG', 'JH', 'HP', 'PY', 'TR', 'MN', 'ML', 'SK'];
    const STATE_LABELS = {
      KA:'Karnataka', TS:'Telangana', TN:'Tamil Nadu', UP:'Uttar Pradesh',
      UK:'Uttarakhand', PY:'Pondicherry', WB:'West Bengal', MN:'Manipur', ML:'Meghalaya',
      AP:'Andhra Pradesh', BR:'Bihar', HR:'Haryana', JH:'Jharkhand', CG:'Chhattisgarh',
      KL:'Kerala', HP:'Himachal Pradesh', TR:'Tripura', SK:'Sikkim'
    };

    OPEN_STATES.forEach(stKey => {
      if (!asmiDb || !asmiDb[stKey] || !asmiDb[stKey][pc.mainCourse]) return;
      const seen = new Map();
      
      ['open_pvt', 'mgmt_quota'].forEach(listType => {
        const d = asmiDb[stKey][pc.mainCourse]['OPEN'];
        if (!d || !d[listType]) return;
        d[listType].forEach(col => {
          const p = prob(score, col.c);
          const entry = {
            name: col.n,
            openCutoff: col.c,
            catCutoff: null,
            state: STATE_LABELS[stKey] || stKey,
            cutoff: col.c,
            projected: col.c + pc.prob.projection,
            chance: p.label,
            chanceKey: p.key,
            chanceClass: p.cls,
            pool: pc.pools.open,
            type: 'Private'
          };
          if (!seen.has(col.n)) {
            seen.set(col.n, entry);
          } else if (col.c < seen.get(col.n).cutoff) {
            seen.set(col.n, entry);
          }
        });
      });
      results.push(...seen.values());
    });
    return results;
  };

  const getScorePredictedColleges = () => {
    const score = parseInt(cpScoreInput, 10);
    if (isNaN(score) || score < pc.scoreMin || score > pc.scoreMax || !asmiDb) return [];
    
    const course = cpScoreCourse;
    const userCat = cpCategory;
    
    const results = [];
    
    // 1. MH State Pool
    if (asmiDb.MH && asmiDb.MH[course]) {
      const mhGovt = getMHCollegesList(course, 'mh_govt', userCat, score);
      const mhPvt = getMHCollegesList(course, 'mh_pvt', userCat, score);
      const mhIq = (userCat === 'IQ') ? getMHCollegesList(course, 'mh_iq', userCat, score) : [];
      results.push(...mhGovt, ...mhPvt, ...mhIq);
    }
    
    // 2. MCC AIQ Pool
    const mccColleges = getMCCCollegesList(course, userCat, score);
    results.push(...mccColleges);
    
    // 3. Open State Pool
    if (course === pc.mainCourse) {
      const openStateColleges = getOpenStateCollegesList(course, score);
      results.push(...openStateColleges);
    }
    
    // Filter
    let filtered = [...results];
    
    if (cpPoolFilter !== 'All') {
      filtered = filtered.filter(c => c.pool === cpPoolFilter);
    }
    
    if (cpTypeFilter !== 'All') {
      filtered = filtered.filter(c => c.type === cpTypeFilter);
    }

    if (cpScoreState !== 'All') {
      filtered = filtered.filter(c => c.state === cpScoreState);
    }

    const PO_SORT = { safe: 0, likely: 1, borderline: 2, reach: 3 };
    if (cpScoreSort === 'chance') filtered.sort((a, b) => PO_SORT[a.chanceKey] - PO_SORT[b.chanceKey] || b.cutoff - a.cutoff);
    else if (cpScoreSort === 'cutoff_asc') filtered.sort((a, b) => a.cutoff - b.cutoff);
    else if (cpScoreSort === 'cutoff_desc') filtered.sort((a, b) => b.cutoff - a.cutoff);
    else if (cpScoreSort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (cpScoreSort === 'fees_asc') filtered.sort((a, b) => parseAirFee(a.fees) - parseAirFee(b.fees));

    return filtered;
  };

  return (
              <div>
                {/* Rank Predictor */}
                <div className="tool-card">
                  <h2 className="section-title">{pc.title}</h2>
                  <p className="section-sub">{pc.subtitle}</p>
                  <div style={{ display: 'flex', gap: 10, maxWidth: 440 }}>
                    <input type="number" placeholder={pc.scorePlaceholder} className="form-input"
                      value={predictorScore} onChange={e => setPredictorScore(e.target.value)} />
                    <button onClick={handlePredictRank} className="btn-gold">Predict</button>
                  </div>
                  {predictedRank && (
                    <div style={{ marginTop: 24, display: 'inline-block', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', padding: '16px 24px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-500)', marginBottom: 4 }}>Estimated All India Rank</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--navy)' }}>#{predictedRank.min_rank.toLocaleString()} &ndash; #{predictedRank.max_rank.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                {/* College Predictor */}
                <div className="tool-card">
                  <h2 className="section-title">🔮 College Predictor</h2>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    <button className={`chip ${cpInputMode === 'rank' ? 'active' : ''}`}
                      onClick={() => { setCpInputMode('rank'); setCpQuota('All'); }}>{pc.modeLabels.rank}</button>
                    <button className={`chip ${cpInputMode === 'score' ? 'active' : ''}`}
                      onClick={() => { setCpInputMode('score'); setCpQuota('All'); }}>{pc.modeLabels.score}</button>
                  </div>

                  {/* ── RANK TAB: full Cutoff Explorer layout ── */}
                  {cpInputMode === 'rank' && (() => {
                    const allStates = Array.from(new Set(cutoffDbData.map(c => c.state))).sort();
                    const allTypes  = Array.from(new Set(cutoffDbData.map(c => c.type).filter(Boolean))).sort();
                    const filteredCpStates = allStates.filter(s => s.toLowerCase().includes(cpStateSearch.toLowerCase()));
                    const results = getRankPredictedColleges();
                    const highCount  = results.filter(r => r.chance === 'High').length;
                    const medCount   = results.filter(r => r.chance === 'Med').length;
                    const lowCount   = results.filter(r => r.chance === 'Low').length;
                    return (
                      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                        {/* Filters panel */}
                        <div className="filters-panel" style={{ flex: '0 0 240px', minWidth: 200 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-900)' }}>Filters</span>
                            <button className="card-action" onClick={() => {
                              setCpSelectedStates([]); setCpSelectedTypes([]); setCpQuota('All');
                              setCpMaxBudget(3000000); setCpSortBy('chance'); setCpSearchFilter(''); setCpRankInput('');
                            }}>Reset All</button>
                          </div>

                          {/* Rank input */}
                          <div className="filter-section">
                            <div className="form-label">Your All India Rank (AIR)</div>
                            <input type="number" placeholder="e.g. 15000" className="form-input"
                              value={cpRankInput} onChange={e => setCpRankInput(e.target.value)}
                              style={{ padding: '9px 12px', fontSize: 14, fontWeight: 700 }} />
                          </div>

                          {/* College name search */}
                          <div className="filter-section">
                            <div className="form-label">Search College</div>
                            <input type="text" placeholder="Search college name..." className="form-input"
                              value={cpSearchFilter} onChange={e => setCpSearchFilter(e.target.value)}
                              style={{ padding: '7px 10px', fontSize: 12 }} />
                          </div>

                          {/* Quota */}
                          <div className="filter-section">
                            <div className="form-label">Quota</div>
                            <select className="form-select" value={cpQuota} onChange={e => setCpQuota(e.target.value)} style={{ fontSize: 12 }}>
                              {pc.quotaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>

                          {/* State multi-select */}
                          <div className="filter-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div className="form-label" style={{ margin: 0 }}>State / Region</div>
                              {cpSelectedStates.length > 0 && (
                                <button className="card-action" onClick={() => setCpSelectedStates([])}>
                                  Clear ({cpSelectedStates.length})
                                </button>
                              )}
                            </div>
                            <input type="text" placeholder="Search state..." className="form-input"
                              value={cpStateSearch} onChange={e => setCpStateSearch(e.target.value)}
                              style={{ padding: '6px 10px', fontSize: 11, marginBottom: 8 }} />
                            <div style={{ maxHeight: 130, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {filteredCpStates.map(state => (
                                <label key={state} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-700)' }}>
                                  <input type="checkbox" checked={cpSelectedStates.includes(state)}
                                    onChange={() => setCpSelectedStates(prev =>
                                      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state])}
                                    style={{ accentColor: 'var(--primary)' }} />
                                  {state}
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Institution type multi-select */}
                          <div className="filter-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div className="form-label" style={{ margin: 0 }}>Institution Type</div>
                              {cpSelectedTypes.length > 0 && (
                                <button className="card-action" onClick={() => setCpSelectedTypes([])}>
                                  Clear
                                </button>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {allTypes.map(type => (
                                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-700)' }}>
                                  <input type="checkbox" checked={cpSelectedTypes.includes(type)}
                                    onChange={() => setCpSelectedTypes(prev =>
                                      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                                    style={{ accentColor: 'var(--primary)' }} />
                                  {type}
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Max Budget slider */}
                          <div className="filter-section">
                            <div className="form-label">Max Annual Fees</div>
                            <input type="range" min="0" max="3000000" step="50000"
                              value={cpMaxBudget} onChange={e => setCpMaxBudget(Number(e.target.value))}
                              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', marginBottom: 6 }} />
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                              {cpMaxBudget >= 3000000 ? 'No Limit' : `Up to ₹${(cpMaxBudget/100000).toFixed(1)}L/yr`}
                            </div>
                          </div>

                          {/* Sort */}
                          <div>
                            <div className="form-label">Sort By</div>
                            <select className="form-select" value={cpSortBy} onChange={e => setCpSortBy(e.target.value)} style={{ fontSize: 12 }}>
                              <option value="chance">Chance (High first)</option>
                              <option value="rank">Closing Rank</option>
                              <option value="fees_asc">Fees: Low → High</option>
                              <option value="fees_desc">Fees: High → Low</option>
                              <option value="name">Name A–Z</option>
                            </select>
                          </div>
                        </div>

                        {/* Results area */}
                        <div style={{ flex: '1 1 400px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-500)' }}>
                              {!cpRankInput ? (
                                'Enter your AIR in the filter panel to see colleges'
                              ) : (
                                <><strong style={{ color: 'var(--text-900)' }}>{results.length}</strong> college{results.length !== 1 ? 's' : ''} matched</>
                              )}
                            </div>
                            {results.length > 0 && (
                              <div style={{ display: 'flex', gap: 8 }}>
                                {highCount > 0 && <span className="badge-safe">{highCount} High</span>}
                                {medCount  > 0 && <span className="badge-likely">{medCount} Med</span>}
                                {lowCount  > 0 && <span className="badge-borderline">{lowCount} Low</span>}
                              </div>
                            )}
                          </div>

                          {!cpRankInput ? (
                            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                              <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>Enter Your AIR to Start</div>
                              <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 280, margin: '0 auto' }}>
                                Type your All India Rank in the filter panel. Colleges are shown with High / Med / Low admission chance.
                              </div>
                            </div>
                          ) : results.length === 0 ? (
                            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>No Matches Found</div>
                              <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 300, margin: '0 auto' }}>
                                No colleges match your current filters. Try expanding your state selection, increasing budget, or clearing institution type filters.
                              </div>
                            </div>
                          ) : (
                            <div className="table-container">
                              <table className="dense-table">
                                <thead className="predictor-header"><tr>
                                  <th>College Name</th>
                                  <th>State</th>
                                  <th>Type</th>
                                  <th>Quota</th>
                                  <th>Closing Rank</th>
                                  <th>Annual Fees</th>
                                  <th>Chance</th>
                                  <th>Shortlist</th>
                                </tr></thead>
                                <tbody>
                                  {results.map((c, i) => (
                                    <tr key={i}>
                                      <td style={{ fontWeight: 700, minWidth: 180 }}>{c.name}</td>
                                      <td style={{ whiteSpace: 'nowrap' }}>{c.state}</td>
                                      <td><span className={`tb ${c.type === 'Government' ? 'tb-govt' : c.type === 'Private' ? 'tb-private' : c.type === 'Deemed' ? 'tb-deemed' : ''}`}>{c.type}</span></td>
                                      <td style={{ fontSize: 11 }}>{c.quota}</td>
                                      <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{c.closingRank?.toLocaleString() || '—'}</td>
                                      <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                        {feeStrAIR(c.fees)}
                                      </td>
                                      <td><span className={c.chanceClass} style={{ whiteSpace: 'nowrap' }}>{c.chance}</span></td>
                                      <td>
                                        <button onClick={() => handleToggleShortlist(c.name, c)} className="chip" style={{ fontSize: 11 }}>
                                          {shortlist.includes(c.name) ? '★ Saved' : '☆ Save'}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── SCORE TAB ── */}
                  {cpInputMode === 'score' && (() => {
                    const results = getScorePredictedColleges();
                    return (
                      <>
                        {/* Score tab filters */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
                          <div className="form-group">
                            <label className="form-label">{pc.scoreLabel}</label>
                            <input type="number" placeholder={pc.scoreExample} className="form-input" value={cpScoreInput} onChange={e => setCpScoreInput(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Course</label>
                            <select className="form-select" value={cpScoreCourse} onChange={e => setCpScoreCourse(e.target.value)}>
                              {pc.courses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Category</label>
                            <select className="form-select" value={cpCategory} onChange={e => setCpCategory(e.target.value)}>
                              <option value="Open">Open / General</option>
                              <option value="OBC">OBC</option>
                              <option value="SC">SC</option>
                              <option value="ST">ST</option>
                              <option value="EWS">EWS</option>
                              <option value="VJ">VJ (DT-A)</option>
                              <option value="NT1">NT-B (NT-1)</option>
                              <option value="NT2">NT-C (NT-2)</option>
                              <option value="NT3">NT-D (NT-3)</option>
                              <option value="SEBC">SEBC</option>
                              <option value="IQ">Inst. / NRI</option>
                            </select>
                          </div>
                        </div>

                        {/* State + Sort row */}
                        {(() => {
                          const scoreResults = (cpScoreInput && !isNaN(parseInt(cpScoreInput,10)) && asmiDb) ? (() => {
                            const score=parseInt(cpScoreInput,10); if(score<pc.scoreMin||score>pc.scoreMax) return [];
                            const tmp=[]; const course=cpScoreCourse; const userCat=cpCategory;
                            if(asmiDb.MH&&asmiDb.MH[course]) {
                              tmp.push(...getMHCollegesList(course,'mh_govt',userCat,score),...getMHCollegesList(course,'mh_pvt',userCat,score));
                              if(userCat==='IQ') tmp.push(...getMHCollegesList(course,'mh_iq',userCat,score));
                            }
                            tmp.push(...getMCCCollegesList(course,userCat,score));
                            if(course===pc.mainCourse) tmp.push(...getOpenStateCollegesList(course,score));
                            return tmp;
                          })() : [];
                          const stateOptions = ['All', ...Array.from(new Set(scoreResults.map(c=>c.state).filter(Boolean))).sort()];
                          return (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                              <div className="form-group">
                                <label className="form-label">State</label>
                                <select className="form-select" value={cpScoreState} onChange={e => setCpScoreState(e.target.value)}>
                                  {stateOptions.map(s => <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>)}
                                </select>
                              </div>
                              <div className="form-group">
                                <label className="form-label">Sort By</label>
                                <select className="form-select" value={cpScoreSort} onChange={e => setCpScoreSort(e.target.value)}>
                                  <option value="chance">Admission Chance</option>
                                  <option value="cutoff_desc">Cutoff (High → Low)</option>
                                  <option value="cutoff_asc">Cutoff (Low → High)</option>
                                  <option value="fees_asc">Fees (Low → High)</option>
                                  <option value="name">College Name</option>
                                </select>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Filter chips (Pool and Type) */}
                        <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
                          <div>
                            <div className="form-label" style={{ marginBottom: 6 }}>Pool</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {pc.poolFilters.map(p => (
                                <button key={p.key} className={`chip ${cpPoolFilter === p.key ? 'active' : ''}`} onClick={() => setCpPoolFilter(p.key)}>
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="form-label" style={{ marginBottom: 6 }}>Institution Type</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {pc.typeFilters.map(t => (
                                <button key={t.key} className={`chip ${cpTypeFilter === t.key ? 'active' : ''}`} onClick={() => setCpTypeFilter(t.key)}>
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Results list */}
                        {(!cpScoreInput || isNaN(parseInt(cpScoreInput, 10))) ? (
                          <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>{pc.scoreHeadline}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 280, margin: '0 auto' }}>
                              {pc.scoreHint}
                            </div>
                          </div>
                        ) : results.length === 0 ? (
                          <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>No Matches Found</div>
                            <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 300, margin: '0 auto' }}>
                              No colleges match your current score and category. Try changing the filters.
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: 13, color: 'var(--text-500)', marginBottom: 14 }}>
                              <strong style={{ color: 'var(--text-900)' }}>{results.length}</strong> college{results.length !== 1 ? 's' : ''} matched
                            </div>

                            <div className="table-container">
                              <table className="dense-table">
                                <thead className="predictor-header">
                                  <tr>
                                    <th>College Name</th>
                                    <th>Pool</th>
                                    <th>State</th>
                                    <th>Open Cutoff</th>
                                    {cpCategory !== 'Open' && <th>Category Cutoff</th>}
                                    <th>Fee/yr</th>
                                    <th>Total Budget</th>
                                    <th>Chance</th>
                                    <th style={{ textAlign: 'center', width: '60px' }}>★</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {results.map((c, i) => {
                                    const feeVal = feeStr(c.name);
                                    const budgetVal = budgetStr(c.name, cpScoreCourse);
                                    const goldPill = (val) => val != null ? (
                                      <span style={{ background: 'linear-gradient(135deg, var(--navy), var(--purple))', color: '#FFD700', padding: '2px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', display: 'inline-block', marginTop: 2 }}>
                                        {val}
                                      </span>
                                    ) : null;
                                    return (
                                      <tr key={i}>
                                        <td style={{ fontWeight: 700, minWidth: 180 }}>{c.name}</td>
                                        <td>
                                          <span style={{ backgroundColor: 'rgba(106, 13, 173, 0.08)', color: '#6a0dad', border: '1px solid rgba(106, 13, 173, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                            {c.pool}
                                          </span>
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap' }}>{c.state}</td>
                                        <td style={{ textAlign: 'center' }}>
                                          {c.openCutoff != null ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                              <span style={{ fontWeight: 800, color: 'var(--navy)' }}>{c.openCutoff}</span>
                                              {goldPill(c.openCutoff + pc.prob.projection)}
                                            </div>
                                          ) : <span style={{ color: 'rgba(26,0,64,0.3)' }}>—</span>}
                                        </td>
                                        {cpCategory !== 'Open' && (
                                          <td style={{ textAlign: 'center' }}>
                                            {c.catCutoff != null ? (
                                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                                <span style={{ fontWeight: 800, color: 'var(--purple)' }}>{c.catCutoff}</span>
                                                {goldPill(c.catCutoff + pc.prob.projection)}
                                              </div>
                                            ) : <span style={{ color: 'rgba(26,0,64,0.3)' }}>—</span>}
                                          </td>
                                        )}
                                        <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{feeVal}</td>
                                        <td style={{ fontSize: 11, whiteSpace: 'nowrap', fontWeight: 700, color: 'var(--navy)' }}>{budgetVal}</td>
                                        <td>
                                          <span className={c.chanceClass} style={{ whiteSpace: 'nowrap' }}>{c.chance}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                          <button onClick={() => handleToggleShortlist(c.name, c)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: shortlist.includes(c.name) ? '#FFD700' : 'rgba(26, 0, 64, 0.2)', padding: '4px', lineHeight: 1, transition: 'color 0.15s' }}>
                                            {shortlist.includes(c.name) ? '★' : '☆'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
  );
}
