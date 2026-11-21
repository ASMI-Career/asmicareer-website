import { useState, useMemo } from 'react';
import { JOSAA, MH, fmtNum } from '../lib/engCutoff';
import { DREAM_OPTIONS, MAX_ROWS_LIMIT, tagCounts, toCsv } from '../lib/prefList';

// Preference List: an ordered list of institute + branch choices built from last year's cutoffs and the student's ranks, for JoSAA
// and Maharashtra CAP separately. The student can reorder, remove and add by hand, download a CSV, print, and (when the script supports
// it) have the list saved to their record automatically.
const SAVE_TEXT = { saved: 'Saved', saving: 'Saving…', error: 'Not saved', idle: '', locked: 'Locked by your counsellor: read-only', unavailable: 'Saving is not available yet. You can still download your list.' };

export default function PreferenceList(props) {
  const {
    studentName, plCounselling: cs, plIsMH: isMH, plSwitch, plQuota, plSetQuota, plCategory, plSetCategory, plGender, plSetGender, plPwd, plSetPwd,
    plRanks, plSetRank, plReservedJosaa: reserved, plMode, plSetMode, plDreamKey, plSetDream, plMaxRows, plSetMaxRows, plRound, plSetRound,
    plFilters, plSetFilter, plToggleType, plFamilies, plSelected, plAddFamily, plRemoveFamily, plMoveFamily, plExact, plAddExact, plRemoveExact,
    plManifest, plData, plMhCategories, plMhGenders, plRounds, plRows: rows, plGenerated, plWarnings, plPending, plEdited,
    plGenerate, plConfirm, plCancel, plMove, plRemove, plClear, plSearch, plAddPick, plImport, plNotice, plSave, plRetrySave,
  } = props;

  const base = isMH ? MH : JOSAA;
  const readOnly = plSave === 'locked';
  const quotas = isMH ? (plManifest ? plManifest.quotas.map(q => ({ key: q.key, label: q.label })) : []) : JOSAA.quotas;
  const categories = isMH ? plMhCategories : JOSAA.categories;
  const genders = isMH ? [{ key: 'all', label: 'General (G)' }, { key: 'female-only', label: 'Ladies (L)' }].filter(g => plMhGenders.includes(g.key)) : JOSAA.genders;
  const itypes = isMH ? (plManifest ? plManifest.instituteTypes : []) : JOSAA.itypes;
  const universities = useMemo(() => (isMH ? [...new Set(plData.records.map(r => r.homeUniversity).filter(Boolean))].sort() : []), [isMH, plData.records]);
  const programs = useMemo(() => [...new Set(plData.records.map(r => r.program))].sort(), [plData.records]);
  const finalRound = plRounds.length ? plRounds[plRounds.length - 1] : '';
  const catLabel = (categories.find(c => c.key === plCategory) || {}).label || plCategory;
  const counts = tagCounts(rows);
  const [pickText, setPickText] = useState('');
  const [exactText, setExactText] = useState('');
  const results = pickText.trim().length >= 2 ? plSearch(pickText) : [];
  const fam = (id) => plFamilies.find(f => f.id === id);
  const fmt = (v) => (v == null ? '—' : fmtNum(v));

  const download = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `ASMI_Preference_List_${isMH ? 'Maharashtra_CAP' : 'JoSAA'}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const rankField = (key, label, ph) => (
    <div className="form-group" key={key}><label className="form-label" htmlFor={`pl-rank-${key}`}>{label}</label>
      <input id={`pl-rank-${key}`} className="form-input" inputMode="numeric" placeholder={ph} value={plRanks[key]} onChange={e => plSetRank(key, e.target.value)} /></div>);

  return (
    <div className="pl-wrap tool-card">
      <div className="pl-print-head">
        <img src="/asmi-logo.png" alt="ASMI Career" className="pl-print-logo" />
        <div><div className="pl-print-title">Preference List — {isMH ? 'Maharashtra CAP' : 'JoSAA'} {base.year}</div><div className="pl-print-sub">{studentName}</div></div>
      </div>

      <h2 className="section-title">Preference List</h2>
      <p className="section-sub">Build an ordered list of colleges and branches to fill in at counselling, from last year&apos;s cutoffs and your ranks.</p>

      <div className="pl-chips" role="group" aria-label="Counselling">
        <button className={`chip ${cs === 'JOSAA' ? 'active' : ''}`} onClick={() => plSwitch('JOSAA')}>JoSAA</button>
        <button className={`chip ${cs === 'MH' ? 'active' : ''}`} onClick={() => plSwitch('MH')}>Maharashtra CAP</button>
      </div>

      <p className="pl-note">
        Based on last year&apos;s cutoffs ({isMH ? `CAP ${MH.year}` : `JoSAA ${JOSAA.year} ${plRound || finalRound || 'final round'}`}). Cutoffs change every year; this list is a guide, not a promise.
        {!isMH && ' Your Home State quota cannot be worked out automatically: pick the quota yourself (the default shows All India and Other State seats).'}
      </p>

      {readOnly && <div className="pl-warn" role="status">Your preference list is locked by your counsellor. You can view and download it, but not change it.</div>}

      <section className="pl-card" aria-label="Your ranks and seat">
        <h3 className="pl-h">Your rank and seat</h3>
        <div className="pl-grid">
          {isMH ? rankField('merit', 'MHT-CET SML rank (state merit number)', 'e.g. 8500')
            : (reserved
              ? [rankField('mainCat', `JEE Main category rank (${catLabel})`, 'e.g. 18000'), rankField('advCat', `JEE Advanced category rank (${catLabel}), IITs`, 'optional, e.g. 450')]
              : [rankField('mainCrl', 'JEE Main CRL rank', 'e.g. 45000'), rankField('advCrl', 'JEE Advanced CRL rank (IITs)', 'optional, e.g. 4000')])}
          <div className="form-group"><label className="form-label" htmlFor="pl-quota">Quota</label>
            <select id="pl-quota" className="form-select" value={plQuota} onChange={e => plSetQuota(e.target.value)}>{quotas.map(q => <option key={q.key} value={q.key}>{q.label}</option>)}</select></div>
          <div className="form-group"><label className="form-label" htmlFor="pl-cat">Category</label>
            <select id="pl-cat" className="form-select" value={plCategory} onChange={e => plSetCategory(e.target.value)}>{categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}</select></div>
          {genders.length > 1 && (
            <div className="form-group"><label className="form-label" htmlFor="pl-gender">Seat for</label>
              <select id="pl-gender" className="form-select" value={plGender} onChange={e => plSetGender(e.target.value)}>{genders.map(g => <option key={g.key} value={g.key}>{g.label}</option>)}</select></div>)}
          <div className="form-group pl-check"><label><input type="checkbox" checked={plPwd} onChange={e => plSetPwd(e.target.checked)} /> I am a PwD candidate (use PwD seats; enter your PwD rank)</label></div>
        </div>
      </section>

      <section className="pl-card" aria-label="Branches">
        <h3 className="pl-h">Branches, in your order of priority</h3>
        <p className="pl-hint">{plSelected.length || plExact.length ? 'The list follows this order: all choices for the first branch, then the next.' : 'Nothing selected: every branch is included, ordered by closing rank.'}</p>
        <ol className="pl-fams">
          {plSelected.map((id, i) => (
            <li key={id} className="pl-fam"><span>{i + 1}. {(fam(id) || {}).label || id}</span>
              <span className="pl-fam-ctl">
                <button type="button" aria-label="Move branch up" onClick={() => plMoveFamily(id, -1)} disabled={i === 0}>↑</button>
                <button type="button" aria-label="Move branch down" onClick={() => plMoveFamily(id, 1)} disabled={i === plSelected.length - 1}>↓</button>
                <button type="button" aria-label="Remove branch" onClick={() => plRemoveFamily(id)}>✕</button></span></li>))}
          {plExact.map(p => (
            <li key={p} className="pl-fam"><span>Exact: {p}</span><span className="pl-fam-ctl"><button type="button" aria-label="Remove exact branch" onClick={() => plRemoveExact(p)}>✕</button></span></li>))}
        </ol>
        <div className="pl-add-row">
          <select aria-label="Add a branch family" className="form-select" value="" onChange={e => { if (e.target.value) plAddFamily(e.target.value); }}>
            <option value="">+ Add a branch…</option>{plFamilies.filter(f => !plSelected.includes(f.id)).map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
          <input aria-label="Add an exact program name" className="form-input" list="pl-programs" placeholder="or type an exact program name" value={exactText} onChange={e => setExactText(e.target.value)} />
          <datalist id="pl-programs">{programs.slice(0, 700).map(p => <option key={p} value={p} />)}</datalist>
          <button type="button" className="chip" disabled={!programs.includes(exactText)} onClick={() => { plAddExact(exactText); setExactText(''); }}>Add</button>
        </div>
      </section>

      <section className="pl-card" aria-label="Options">
        <h3 className="pl-h">Options</h3>
        <div className="pl-grid">
          <div className="form-group"><label className="form-label" htmlFor="pl-mode">Order</label>
            <select id="pl-mode" className="form-select" value={plMode} onChange={e => plSetMode(e.target.value)}>
              <option value="branch">Branch first (my branch order)</option><option value="cutoff">Cutoff order (hardest first)</option></select></div>
          <div className="form-group"><label className="form-label" htmlFor="pl-dream">Dream choices</label>
            <select id="pl-dream" className="form-select" value={plDreamKey} onChange={e => plSetDream(e.target.value)}>{DREAM_OPTIONS.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}</select></div>
          <div className="form-group"><label className="form-label" htmlFor="pl-max">Maximum choices</label>
            <select id="pl-max" className="form-select" value={plMaxRows} onChange={e => plSetMaxRows(Number(e.target.value))}>{[50, 100, 150, 200, MAX_ROWS_LIMIT].map(n => <option key={n} value={n}>{n}</option>)}</select></div>
          <div className="form-group"><label className="form-label" htmlFor="pl-round">Cutoff round</label>
            <select id="pl-round" className="form-select" value={plRound} onChange={e => plSetRound(e.target.value)}><option value="">Final round with data{finalRound ? ` (${finalRound})` : ''}</option>{plRounds.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
          <div className="form-group"><label className="form-label" htmlFor="pl-search">Search institute or city name</label>
            <input id="pl-search" className="form-input" placeholder="e.g. Pune" value={plFilters.name} onChange={e => plSetFilter('name', e.target.value)} /></div>
          {isMH && plQuota === 'home-university' && (
            <div className="form-group"><label className="form-label" htmlFor="pl-uni">My university</label>
              <select id="pl-uni" className="form-select" value={plFilters.university} onChange={e => plSetFilter('university', e.target.value)}><option value="">Any university</option>{universities.map(u => <option key={u} value={u}>{u}</option>)}</select></div>)}
          {isMH && <div className="form-group pl-check"><label><input type="checkbox" checked={plFilters.autonomousOnly} onChange={e => plSetFilter('autonomousOnly', e.target.checked)} /> Autonomous institutes only</label></div>}
        </div>
        <div className="pl-chips" role="group" aria-label="Institute type">
          <span className="pl-chips-l">Institute type:</span>
          {itypes.map(t => <button key={t} type="button" className={`chip ${plFilters.types.includes(t) ? 'active' : ''}`} onClick={() => plToggleType(t)}>{t}</button>)}
          {!plFilters.types.length && <span className="pl-hint">All types</span>}
        </div>
        <div className="pl-gen-row">
          <button type="button" className="pl-btn-primary" onClick={() => plGenerate()} disabled={plData.loading || plData.error || !plData.records.length || readOnly}>{plData.loading ? 'Loading cutoff data…' : (rows.length ? 'Regenerate list' : 'Generate list')}</button>
          {plData.loading && <span className="pl-hint" role="status">Loading last year&apos;s cutoffs…</span>}
          {plData.error && <span className="pl-err" role="alert">Could not load the cutoff data. Check your internet and try again.</span>}
        </div>
      </section>

      {plPending && (
        <div className="pl-confirm" role="alert">You moved or removed choices by hand. Replace your list with a new one? Your own picks stay where they are.
          <span><button type="button" className="pl-btn-primary" onClick={plConfirm}>Replace my list</button> <button type="button" className="chip" onClick={plCancel}>Keep my list</button></span></div>)}
      {plWarnings.map((w, i) => <div key={i} className="pl-warn" role="status">{w}</div>)}

      <section className="pl-card" aria-label="Add your own pick">
        <h3 className="pl-h">Add a choice yourself</h3>
        <div className="pl-add-row">
          <input aria-label="Search institute or branch to add" className="form-input" placeholder="Search an institute or branch to add" value={pickText} onChange={e => setPickText(e.target.value)} disabled={readOnly} />
          <button type="button" className="chip" onClick={plImport} disabled={readOnly || !plData.records.length}>Import my shortlist</button>
        </div>
        {results.length > 0 && (
          <ul className="pl-results">{results.map(r => (
            <li key={r.key}><span><b>{r.institute}</b> — {r.program} <span className="pl-meta">({r.type} · {r.quota}) closing {fmt(r.closing)}</span> <span className={`pl-tag pl-tag-${r.tag}`}>{r.tagLabel}</span></span>
              <span>{r.inList ? <em>In your list</em> : (<><button type="button" className="chip" onClick={() => plAddPick(r, 'top')}>Add at top</button> <button type="button" className="chip" onClick={() => plAddPick(r, 'bottom')}>Add at end</button></>)}</span></li>))}</ul>)}
        {plNotice && <div className="pl-hint" role="status">{plNotice}</div>}
      </section>

      {plGenerated || rows.length ? (
        <section aria-label="Your list">
          <div className="pl-summary">
            <b>{rows.length}</b> choices:
            <span className="chance-safe">{counts.safe} safe</span><span className="chance-likely">{counts.likely} likely</span><span className="chance-borderline">{counts.borderline} borderline</span>
            <span className="pl-tag pl-tag-dream">{counts.dream} dream</span>{counts.out > 0 && <span className="chance-out">{counts.out} out of reach</span>}
            {rows.length > 0 && counts.safe === 0 && <div className="pl-warn" role="status">There is no Safe choice in this list. Add some Safe choices so you are not left without a seat.</div>}
          </div>
          <div className="pl-actions">
            <button type="button" className="chip" onClick={download} disabled={!rows.length}>Download CSV</button>
            <button type="button" className="chip" onClick={() => window.print()} disabled={!rows.length}>Print</button>
            <button type="button" className="chip" onClick={plClear} disabled={!rows.length || readOnly}>Clear list</button>
            <span className={`pl-save pl-save-${plSave}`} role="status">{SAVE_TEXT[plSave] || ''}{plSave === 'error' && <> — <button type="button" className="pl-link" onClick={plRetrySave}>retry</button></>}</span>
          </div>
          {rows.length === 0 ? <div className="empty-state">Your list is empty.</div> : (
            <ol className="pl-list">
              {rows.map((r, i) => (
                <li key={r.key} className={`pl-row ${r.tag === 'missing' ? 'pl-missing' : ''}`}>
                  <div className="pl-no">{i + 1}</div>
                  <div className="pl-main">
                    <div className="pl-inst">{r.institute}</div>
                    <div className="pl-prog">{r.program}</div>
                    <div className="pl-meta">{r.type ? `${r.type} · ` : ''}{r.quota}{r.gender === 'female-only' ? ' · Female-only' : ''}{r.pinned && <span className="pl-pick"> Your pick</span>}</div>
                  </div>
                  <div className="pl-nums"><span>Closing {fmt(r.closing)}</span><span>{r.round}</span><span>Your rank {fmt(r.rankUsed)}</span></div>
                  <span className={`pl-tag pl-tag-${r.tag}`}>{r.tagLabel}</span>
                  <div className="pl-ctl">
                    <button type="button" aria-label={`Move choice ${i + 1} up`} onClick={() => plMove(i, -1)} disabled={readOnly || i === 0}>↑</button>
                    <button type="button" aria-label={`Move choice ${i + 1} down`} onClick={() => plMove(i, 1)} disabled={readOnly || i === rows.length - 1}>↓</button>
                    <button type="button" aria-label={`Move choice ${i + 1} to top`} onClick={() => plMove(i, 'top')} disabled={readOnly || i === 0}>⤒</button>
                    <button type="button" aria-label={`Remove choice ${i + 1}`} onClick={() => plRemove(i)} disabled={readOnly}>✕</button>
                  </div>
                </li>))}
            </ol>)}
          {plEdited && <div className="pl-hint">You have changed this list by hand. Regenerating will ask before replacing it.</div>}
        </section>) : null}
    </div>
  );
}
