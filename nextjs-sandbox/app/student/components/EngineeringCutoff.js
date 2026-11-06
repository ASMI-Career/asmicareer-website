import { JOSAA, MH, cfgFor, quotaLabelOf, chanceFor, roundValues, fmtNum, parseRank, isReservedJosaa } from '../lib/engCutoff';

// Engineering Cutoff Explorer (student view). Same data as the counsellor tool; every filter is a plain dropdown,
// last year's closing ranks are shown per round, and a student who enters their rank sees Safe / Likely / Borderline / Out of reach.
export default function EngineeringCutoff(props) {
  const {
    config, shortlist, handleToggleShortlist,
    ecCounselling: cs, ecSwitch, ecQuota, setEcQuota, ecCategory, setEcCategory, ecGender, setEcGender, ecItype, setEcItype,
    ecRound, setEcRound, ecSearch, setEcSearch, ecSort, setEcSort, ecPwd, setEcPwd,
    ecMainRank, setEcMainRank, ecAdvRank, setEcAdvRank, ecMhMerit, setEcMhMerit,
    ecVisible, ecShowMore, ecManifest, ecIntake, ecData, ecMhCategories, ecMhGenders,
  } = props;
  const ec = config.engineeringCutoff;
  const isMH = cs === 'MH';
  const base = cfgFor(cs);
  const quotas = isMH ? (ecManifest ? ecManifest.quotas.map(q => ({ key: q.key, label: q.label })) : []) : JOSAA.quotas;
  const categories = isMH ? ecMhCategories : JOSAA.categories;
  const genders = isMH ? [{ key: 'all', label: 'General (G)' }, { key: 'female-only', label: 'Ladies (L)' }].filter(g => ecMhGenders.includes(g.key)) : JOSAA.genders;
  const itypes = isMH ? (ecManifest ? ecManifest.instituteTypes : []) : JOSAA.itypes;
  const rounds = isMH ? (ecManifest ? ecManifest.rounds : []) : JOSAA.rounds;
  const qLabel = (c) => quotaLabelOf(cs, c._quota || ecQuota, ecManifest);   // each row knows which quota it came from
  const track = base.track;
  const reserved = isReservedJosaa(cs, ecCategory);
  const catLabel = (categories.find(c => c.key === ecCategory) || {}).label || ecCategory;

  const rankFor = (c) => (isMH ? parseRank(ecMhMerit) : (c.type === 'IIT' ? parseRank(ecAdvRank) : parseRank(ecMainRank)));
  const haveRank = isMH ? !!parseRank(ecMhMerit) : (!!parseRank(ecAdvRank) || !!parseRank(ecMainRank));

  let rows = ecData.colleges
    .filter(c => ecItype === 'ALL' || c.type === ecItype)
    .filter(c => { const q = ecSearch.trim().toLowerCase(); return !q || c.name.toLowerCase().includes(q) || c.program.toLowerCase().includes(q); })
    .map(c => { const v = roundValues(c, ecRound, !isMH && ecPwd); return { c, ...v, chance: chanceFor(rankFor(c), v.close) }; })
    .filter(r => r.close != null);
  if (ecSort === 'closing_asc') rows.sort((a, b) => a.close - b.close);
  else if (ecSort === 'closing_desc') rows.sort((a, b) => b.close - a.close);
  else rows.sort((a, b) => a.c.name.localeCompare(b.c.name));
  const counts = { safe: 0, likely: 0, borderline: 0, out: 0 };
  if (haveRank) rows.forEach(r => { if (r.chance) counts[r.chance.key] += 1; });

  const labelOf = (c) => `${c.name} — ${c.program} (${qLabel(c)})`;
  const isIn = (c) => shortlist.includes(labelOf(c));
  const toggle = (c) => handleToggleShortlist(labelOf(c), { name: c.name, institute: c.name, branch: c.program, seatType: qLabel(c), track, type: c.type });

  const field = { fontFamily: 'inherit' };
  const pill = (r) => r.chance ? (r.chance.key === 'out' ? <span className="chance-out">Out of reach</span> : <span className={`chance-${r.chance.key}`}>{r.chance.label}</span>) : <span style={{ color: 'var(--text-300)' }}>—</span>;
  const intakeOf = (c) => { const t = (ecIntake[ecRound] || {})[c.choiceCode]; return t || null; };

  return (
    <div className="tool-card">
      <h2 className="section-title">{ec.title}</h2>
      <p className="section-sub">{ec.subtitle}</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className={`chip ${cs === 'JOSAA' ? 'active' : ''}`} onClick={() => ecSwitch('JOSAA')}>JoSAA {JOSAA.year}</button>
        <button className={`chip ${cs === 'MH' ? 'active' : ''}`} onClick={() => ecSwitch('MH')}>Maharashtra CAP {MH.year}</button>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-500)', marginBottom: 16 }}>
        {isMH
          ? `Maharashtra CAP ${MH.year}: closing merit number and percentile for each round. Merit number = your rank in the Maharashtra state merit list.`
          : `JoSAA ${JOSAA.year}: opening and closing ranks for each round. IIT ranks are JEE Advanced ranks; NIT, IIIT and GFTI ranks are JEE Main ranks. For every category except Open the ranks are category ranks (shown on your scorecard), not all-India ranks. JoSAA seats are split by quota: IITs, IIITs and most GFTIs are All India, while NITs are under Home State or Other State; the default view shows All India and Other State together.`}
        {' '}Last year&apos;s ranks are a guide, not a promise: cutoffs change every year.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 14 }}>
        <div className="form-group"><label className="form-label">Quota</label>
          <select className="form-select" style={field} value={ecQuota} onChange={e => setEcQuota(e.target.value)}>{quotas.map(q => <option key={q.key} value={q.key}>{q.label}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Category</label>
          <select className="form-select" style={field} value={ecCategory} onChange={e => setEcCategory(e.target.value)}>{categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
        {genders.length > 1 && (
          <div className="form-group"><label className="form-label">Seat for</label>
            <select className="form-select" style={field} value={ecGender} onChange={e => setEcGender(e.target.value)}>{genders.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}</select></div>
        )}
        <div className="form-group"><label className="form-label">Institute type</label>
          <select className="form-select" style={field} value={ecItype} onChange={e => setEcItype(e.target.value)}><option value="ALL">All</option>{itypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Round</label>
          <select className="form-select" style={field} value={ecRound} onChange={e => setEcRound(e.target.value)}>{rounds.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Sort by</label>
          <select className="form-select" style={field} value={ecSort} onChange={e => setEcSort(e.target.value)}>
            <option value="closing_asc">Closing rank: low to high</option><option value="closing_desc">Closing rank: high to low</option><option value="name">Institute name</option></select></div>
        <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Search institute or branch</label>
          <input className="form-input" style={field} placeholder="e.g. Computer, COEP, NIT Trichy" value={ecSearch} onChange={e => setEcSearch(e.target.value)} /></div>
      </div>

      <div style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-900)', marginBottom: 8 }}>Your rank (optional): see where you stand</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>
          {isMH ? (
            <div className="form-group"><label className="form-label">MHT-CET state merit number (SML)</label>
              <input className="form-input" style={field} inputMode="numeric" placeholder="e.g. 4500" value={ecMhMerit} onChange={e => setEcMhMerit(e.target.value)} /></div>
          ) : (<>
            <div className="form-group"><label className="form-label">{reserved ? `JEE Main category rank (${catLabel}) for NITs, IIITs, GFTIs` : 'JEE Main CRL rank (NITs, IIITs, GFTIs)'}</label>
              <input className="form-input" style={field} inputMode="numeric" placeholder="e.g. 12000" value={ecMainRank} onChange={e => setEcMainRank(e.target.value)} /></div>
            <div className="form-group"><label className="form-label">{reserved ? `JEE Advanced category rank (${catLabel}) for IITs` : 'JEE Advanced CRL rank (IITs)'}</label>
              <input className="form-input" style={field} inputMode="numeric" placeholder="e.g. 4000" value={ecAdvRank} onChange={e => setEcAdvRank(e.target.value)} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-700)', alignSelf: 'end', paddingBottom: 10 }}>
              <input type="checkbox" checked={ecPwd} onChange={e => setEcPwd(e.target.checked)} style={{ accentColor: 'var(--primary)' }} /> Show PwD ranks
            </label>
          </>)}
        </div>
        {!haveRank && <p style={{ fontSize: 11, color: 'var(--text-500)', marginTop: 8 }}>Only know your percentile? Use the Predictor tab to estimate your rank.</p>}
        {haveRank && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <span className="chance-safe">{counts.safe} safe</span><span className="chance-likely">{counts.likely} likely</span>
            <span className="chance-borderline">{counts.borderline} borderline</span><span className="chance-out">{counts.out} out of reach</span>
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-500)', marginBottom: 8 }}>{ecData.loading ? 'Loading…' : `${rows.length.toLocaleString('en-IN')} programs`}</div>
      {ecData.error && <div className="empty-state" role="alert">Could not load the cutoff data. Check your internet and try again.</div>}
      {!ecData.error && !ecData.loading && rows.length === 0 && <div className="empty-state">No programs found for this combination in the {base.label} {base.year} data. Try another quota, category or round.</div>}
      {!ecData.error && rows.length > 0 && (
        <div className="table-container">
          <table className="dense-table">
            <thead className="predictor-header"><tr>
              <th>Institute</th><th>Branch</th><th>Type</th>
              {isMH ? (<><th style={{ textAlign: 'right' }}>Closing merit</th><th style={{ textAlign: 'right' }}>Closing %ile</th><th style={{ textAlign: 'right' }}>Vacant</th></>)
                    : (<><th style={{ textAlign: 'right' }}>Opening</th><th style={{ textAlign: 'right' }}>Closing</th></>)}
              {haveRank && <th style={{ textAlign: 'center' }}>Chance</th>}
              <th style={{ textAlign: 'center' }}>Shortlist</th>
            </tr></thead>
            <tbody>
              {rows.slice(0, ecVisible).map((r, i) => {
                const c = r.c, inList = isIn(c), tk = isMH ? intakeOf(c) : null;
                return (
                  <tr key={`${c.choiceCode || c.name}-${c.program}-${c._quota}-${i}`}>
                    <td style={{ fontWeight: 700, color: 'var(--text-900)', minWidth: 200 }}>{c.name}{isMH && c.homeUniversity && c.homeUniversity !== 'Autonomous Institute' && <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-500)' }}>Home university: {c.homeUniversity}</div>}</td>
                    <td style={{ minWidth: 180 }}>{c.program}{r.prep && <span style={{ fontSize: 10, color: '#b45309', fontWeight: 700 }}> (Prep)</span>}</td>
                    <td><span className="tag tag-gold">{c.type}</span></td>
                    {isMH ? (<>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmtNum(r.close)}</td>
                      <td style={{ textAlign: 'right' }}>{r.pct != null ? r.pct.toFixed(4) : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{tk && tk.vacant != null ? tk.vacant : '—'}</td>
                    </>) : (<>
                      <td style={{ textAlign: 'right' }}>{fmtNum(r.open)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{fmtNum(r.close)}</td>
                    </>)}
                    {haveRank && <td style={{ textAlign: 'center' }}>{pill(r)}</td>}
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
          <button className="chip" onClick={ecShowMore}>Show 40 more ({(rows.length - ecVisible).toLocaleString('en-IN')} left)</button>
        </div>
      )}
    </div>
  );
}
