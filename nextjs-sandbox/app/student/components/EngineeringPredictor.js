import { useState } from 'react';
import { JOSAA, MH, cfgFor, chanceFor, roundValues, fmtNum, parseRank, estimateMainRank, estimateMhMerit, isReservedJosaa, estimateCategoryRank } from '../lib/engCutoff';

// Engineering Predictor: the student enters the percentile they expect (or the rank, if they know it), we estimate the rank,
// and list the colleges and branches that rank could get, using last year's closing ranks (the same data as the Cutoff Explorer).
export default function EngineeringPredictor(props) {
  const {
    config, shortlist, handleToggleShortlist, setActiveTab,
    ecCounselling: cs, ecSwitch, ecQuota, setEcQuota, ecCategory, setEcCategory, ecGender, setEcGender, ecItype, setEcItype,
    ecRound, setEcRound, ecSearch, setEcSearch, ecPwd, ecMainRank, setEcMainRank, ecAdvRank, setEcAdvRank, ecMhMerit, setEcMhMerit,
    ecPMode: mode, setEcPMode, ecMainPct, setEcMainPct, ecMhPct, setEcMhPct, ecMhCurve,
    ecVisible, ecShowMore, ecManifest, ecData, ecMhCategories, ecMhGenders,
  } = props;
  const pc = config.engineeringPredictor;
  const isMH = cs === 'MH';
  const base = cfgFor(cs);
  const [show, setShow] = useState('all');          // all | safe | likely | borderline
  const [showOut, setShowOut] = useState(false);

  const quotas = isMH ? (ecManifest ? ecManifest.quotas.map(q => ({ key: q.key, label: q.label })) : []) : JOSAA.quotas;
  const categories = isMH ? ecMhCategories : JOSAA.categories;
  const genders = isMH ? [{ key: 'all', label: 'General (G)' }, { key: 'female-only', label: 'Ladies (L)' }].filter(g => ecMhGenders.includes(g.key)) : JOSAA.genders;
  const itypes = isMH ? (ecManifest ? ecManifest.instituteTypes : []) : JOSAA.itypes;
  const rounds = isMH ? (ecManifest ? ecManifest.rounds : []) : JOSAA.rounds;
  const quotaLabel = (quotas.find(q => q.key === ecQuota) || {}).label || ecQuota;

  // ── the student's rank ──
  const advRank = parseRank(ecAdvRank);
  const aiMerit = isMH && ecQuota === 'all-india';          // All India merit numbers are on a different list: no percentile estimate for them
  const reserved = isReservedJosaa(cs, ecCategory);          // reserved categories are compared by CATEGORY rank in JoSAA
  const catLabel = (categories.find(c => c.key === ecCategory) || {}).label || ecCategory;
  let crlEst = null, mainRank = null, merit = null, note = '', estimated = false;
  if (!isMH) {
    if (mode === 'percentile') {
      crlEst = estimateMainRank(parseFloat(ecMainPct), pc.jeeMainCandidates);
      mainRank = reserved ? estimateCategoryRank(crlEst, ecCategory, pc.categoryShare) : crlEst;
      estimated = mainRank != null;
      if (crlEst != null && reserved && mainRank == null) note = 'Cannot estimate a category rank for this category. Choose "I know my rank" and enter it from your scorecard.';
    } else mainRank = parseRank(ecMainRank);
  } else if (mode === 'percentile' && !aiMerit) {
    const est = estimateMhMerit(parseFloat(ecMhPct), ecMhCurve);
    if (est) { merit = est.merit; estimated = true; if (!est.inRange) note = 'This percentile is outside the range of last year\'s admissions, so the estimate is rough.'; }
    else if (ecMhPct && !ecMhCurve) note = 'Loading last year\'s results…';
  } else merit = parseRank(ecMhMerit);
  const haveRank = isMH ? merit != null : (mainRank != null || advRank != null);
  const rankFor = (c) => (isMH ? merit : (c.type === 'IIT' ? advRank : mainRank));

  let all = ecData.colleges
    .filter(c => ecItype === 'ALL' || c.type === ecItype)
    .filter(c => { const q = ecSearch.trim().toLowerCase(); return !q || c.name.toLowerCase().includes(q) || c.program.toLowerCase().includes(q); })
    .map(c => { const v = roundValues(c, ecRound, !isMH && ecPwd); return { c, ...v, chance: chanceFor(rankFor(c), v.close) }; })
    .filter(r => r.close != null && r.chance);
  const counts = { safe: 0, likely: 0, borderline: 0, out: 0 };
  all.forEach(r => { counts[r.chance.key] += 1; });
  const iitSkipped = !isMH && advRank == null && ecData.colleges.some(c => c.type === 'IIT');
  let rows = all.filter(r => (showOut || r.chance.key !== 'out') && (show === 'all' || r.chance.key === show));
  rows.sort((a, b) => a.close - b.close);

  const labelOf = (c) => `${c.name} — ${c.program} (${quotaLabel})`;
  const isIn = (c) => shortlist.includes(labelOf(c));
  const toggle = (c) => handleToggleShortlist(labelOf(c), { name: c.name, institute: c.name, branch: c.program, seatType: quotaLabel, track: base.track, type: c.type });
  const openInExplorer = () => { if (!isMH && mainRank != null) setEcMainRank(String(mainRank)); if (isMH && merit != null) setEcMhMerit(String(merit)); setActiveTab('cutoff'); };

  const field = { fontFamily: 'inherit' };
  const fmt = (v) => v.toLocaleString('en-IN');
  const chanceBtn = (key, label) => <button key={key} className={`chip ${show === key ? 'active' : ''}`} onClick={() => setShow(key)}>{label}</button>;
  const pill = (r) => r.chance.key === 'out' ? <span className="chance-out">Out of reach</span> : <span className={`chance-${r.chance.key}`}>{r.chance.label}</span>;

  return (
    <div className="tool-card">
      <h2 className="section-title">{pc.title}</h2>
      <p className="section-sub">{pc.subtitle}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`chip ${cs === 'JOSAA' ? 'active' : ''}`} onClick={() => ecSwitch('JOSAA')}>JEE Main / JEE Advanced (JoSAA)</button>
        <button className={`chip ${cs === 'MH' ? 'active' : ''}`} onClick={() => ecSwitch('MH')}>MHT-CET (Maharashtra CAP)</button>
      </div>

      <div style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button className={`chip ${mode === 'percentile' ? 'active' : ''}`} onClick={() => setEcPMode('percentile')}>I know my percentile</button>
          <button className={`chip ${mode === 'rank' ? 'active' : ''}`} onClick={() => setEcPMode('rank')}>I know my rank</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {!isMH && mode === 'percentile' && (
            <div className="form-group"><label className="form-label">JEE Main percentile (0 – 100)</label>
              <input className="form-input" style={field} inputMode="decimal" placeholder="e.g. 96.5" value={ecMainPct} onChange={e => setEcMainPct(e.target.value)} /></div>
          )}
          {!isMH && mode === 'rank' && (
            <div className="form-group"><label className="form-label">{reserved ? `JEE Main category rank (${catLabel}), from your scorecard` : 'JEE Main CRL rank'}</label>
              <input className="form-input" style={field} inputMode="numeric" placeholder="e.g. 45000" value={ecMainRank} onChange={e => setEcMainRank(e.target.value)} /></div>
          )}
          {!isMH && (
            <div className="form-group"><label className="form-label">{reserved ? `JEE Advanced category rank (${catLabel}), IITs only` : 'JEE Advanced CRL rank (only for IITs)'}</label>
              <input className="form-input" style={field} inputMode="numeric" placeholder="optional, e.g. 4000" value={ecAdvRank} onChange={e => setEcAdvRank(e.target.value)} /></div>
          )}
          {isMH && mode === 'percentile' && !aiMerit && (
            <div className="form-group"><label className="form-label">MHT-CET percentile (0 – 100)</label>
              <input className="form-input" style={field} inputMode="decimal" placeholder="e.g. 95.2" value={ecMhPct} onChange={e => setEcMhPct(e.target.value)} /></div>
          )}
          {isMH && (mode === 'rank' || aiMerit) && (
            <div className="form-group"><label className="form-label">{aiMerit ? 'All India quota merit number' : 'MHT-CET state merit number (SML)'}</label>
              <input className="form-input" style={field} inputMode="numeric" placeholder="e.g. 9000" value={ecMhMerit} onChange={e => setEcMhMerit(e.target.value)} /></div>
          )}
          <div className="form-group"><label className="form-label">Category</label>
            <select className="form-select" style={field} value={ecCategory} onChange={e => setEcCategory(e.target.value)}>{categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Quota</label>
            <select className="form-select" style={field} value={ecQuota} onChange={e => setEcQuota(e.target.value)}>{quotas.map(q => <option key={q.key} value={q.key}>{q.label}</option>)}</select></div>
          {genders.length > 1 && (
            <div className="form-group"><label className="form-label">Seat for</label>
              <select className="form-select" style={field} value={ecGender} onChange={e => setEcGender(e.target.value)}>{genders.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}</select></div>
          )}
        </div>
        {aiMerit && mode === 'percentile' && <p style={{ fontSize: 11, color: 'var(--text-500)', marginTop: 8 }}>For the All India quota, enter your merit number. A percentile cannot be turned into a rank for this quota.</p>}
        {!isMH && <p style={{ fontSize: 11, color: 'var(--text-500)', marginTop: 8 }}>Quota: All India covers IITs, IIITs and many NIT seats. Choose Home State for NITs and GFTIs in your own home state, and Other State for all the others.</p>}
        {haveRank && (
          <div style={{ marginTop: 14, fontSize: 14, color: 'var(--text-900)' }}>
            {!isMH && crlEst != null && <div>Estimated <b>JEE Main CRL rank: about {fmt(crlEst)}</b> (from your percentile)</div>}
            {!isMH && mainRank != null && reserved && <div>{estimated ? 'Estimated ' : ''}<b>{catLabel} category rank: about {fmt(mainRank)}</b>{estimated && ' (rough: your CRL x the category\'s share of candidates)'}</div>}
            {!isMH && advRank != null && <div>JEE Advanced {reserved ? `${catLabel} category` : 'CRL'} rank: <b>{fmt(advRank)}</b></div>}
            {!isMH && reserved && <div style={{ fontSize: 11, color: 'var(--text-500)', marginTop: 4 }}>For {catLabel}, JoSAA closing ranks are category ranks, so your category rank is used. It is on your JEE scorecard.</div>}
            {isMH && <div>{estimated ? 'Estimated ' : ''}<b>state merit number: about {fmt(merit)}</b>{estimated && ' (read from last year\'s CAP results)'}</div>}
            {note && <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>{note}</div>}
            {estimated && <div style={{ fontSize: 11, color: 'var(--text-500)', marginTop: 4 }}>
              {isMH ? 'The real merit number depends on this year\'s result and the number of candidates.' : `This assumes about ${fmt(pc.jeeMainCandidates)} candidates. NTA publishes the real rank after the results.`} Treat this as a guide.</div>}
            <button className="chip" style={{ marginTop: 10 }} onClick={openInExplorer}>Open in Cutoff Explorer</button>
          </div>
        )}
      </div>

      {!haveRank && <div className="empty-state">Enter your {mode === 'percentile' ? 'percentile' : 'rank'} above to see which colleges and branches you could get.</div>}

      {haveRank && (<>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 14 }}>
          <div className="form-group"><label className="form-label">Round</label>
            <select className="form-select" style={field} value={ecRound} onChange={e => setEcRound(e.target.value)}>{rounds.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Institute type</label>
            <select className="form-select" style={field} value={ecItype} onChange={e => setEcItype(e.target.value)}><option value="ALL">All</option>{itypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Search branch or institute</label>
            <input className="form-input" style={field} placeholder="e.g. Computer, Mechanical, COEP" value={ecSearch} onChange={e => setEcSearch(e.target.value)} /></div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          {chanceBtn('all', `All (${counts.safe + counts.likely + counts.borderline})`)}{chanceBtn('safe', `Safe (${counts.safe})`)}{chanceBtn('likely', `Likely (${counts.likely})`)}{chanceBtn('borderline', `Borderline (${counts.borderline})`)}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-700)', marginLeft: 'auto' }}>
            <input type="checkbox" checked={showOut} onChange={e => setShowOut(e.target.checked)} style={{ accentColor: 'var(--primary)' }} /> Also show out of reach ({counts.out})
          </label>
        </div>
        {iitSkipped && <p style={{ fontSize: 12, color: '#b45309', marginBottom: 10 }}>IITs are not shown because they need your JEE Advanced rank. Add it above to include them.</p>}
        {ecData.error && <div className="empty-state" role="alert">Could not load the cutoff data. Check your internet and try again.</div>}
        {!ecData.error && !ecData.loading && rows.length === 0 && <div className="empty-state">No matches for this rank with these filters. Try another round, quota or category, or tick &quot;Also show out of reach&quot;.</div>}
        {rows.length > 0 && (
          <div className="table-container">
            <table className="dense-table">
              <thead className="predictor-header"><tr>
                <th>Institute</th><th>Branch</th><th>Type</th><th style={{ textAlign: 'right' }}>Last year closing</th><th style={{ textAlign: 'center' }}>Chance</th><th style={{ textAlign: 'center' }}>Shortlist</th>
              </tr></thead>
              <tbody>
                {rows.slice(0, ecVisible).map((r, i) => {
                  const c = r.c, inList = isIn(c);
                  return (
                    <tr key={`${c.choiceCode || c.name}-${c.program}-${i}`}>
                      <td style={{ fontWeight: 700, color: 'var(--text-900)', minWidth: 200 }}>{c.name}</td>
                      <td style={{ minWidth: 180 }}>{c.program}</td>
                      <td><span className="tag tag-gold">{c.type}</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmtNum(r.close)}{isMH && r.pct != null && <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--text-500)' }}>{r.pct.toFixed(2)} %ile</div>}</td>
                      <td style={{ textAlign: 'center' }}>{pill(r)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button onClick={() => toggle(c)} aria-label={inList ? 'Remove from shortlist' : 'Add to shortlist'}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: inList ? 'var(--primary-accent, #00A896)' : 'var(--text-300)' }}>{inList ? '★' : '☆'}</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > ecVisible && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="chip" onClick={ecShowMore}>Show 40 more ({fmt(rows.length - ecVisible)} left)</button>
          </div>
        )}
        <p style={{ fontSize: 11, color: 'var(--text-500)', marginTop: 14 }}>Based on {base.label} {base.year} closing ranks. Safe = your rank is well inside last year&apos;s closing rank; Borderline = just outside it. Cutoffs change every year, so use this to build a list, not to make a final decision.</p>
      </>)}
    </div>
  );
}
