import { useState, useEffect } from 'react';
import { FIELDS, MAX_BRANCHES, toForm, checkField, checkAll, changedFields, ERROR_TEXT } from '../lib/profile';

const SECTIONS = [
  { title: 'Personal', hint: 'Used to pick your category and seat type in the Predictor and Cutoff Explorer.', fields: [
    ['name', 'Full name'], ['category', 'Category'], ['gender', 'Gender'], ['pwd', 'Person with disability (PwD)'],
    ['home_state', 'Home state'], ['home_university', 'Home university (if any)'], ['minority', 'Minority status (if any)'] ] },
  { title: 'Exam results', hint: 'Fill what you have. Leave the rest blank.', fields: [
    ['jee_main_percentile', 'JEE Main percentile'], ['jee_main_crl_rank', 'JEE Main CRL rank'], ['category_rank', 'JEE Main category rank (reserved categories)'],
    ['jee_adv_rank', 'JEE Advanced rank (CRL)'], ['jee_adv_category_rank', 'JEE Advanced category rank (reserved categories)'], ['mhtcet_percentile', 'MHT-CET percentile'], ['mhtcet_sml', 'MHT-CET SML rank (state merit list)'] ] },
];
const PLACEHOLDER = { jee_main_percentile: 'e.g. 97.85', mhtcet_percentile: 'e.g. 96.40', mhtcet_sml: 'e.g. 8500', jee_main_crl_rank: 'e.g. 12000', category_rank: 'e.g. 4500', jee_adv_rank: 'e.g. 3000', jee_adv_category_rank: 'e.g. 450', home_university: 'e.g. Mumbai University', minority: 'e.g. Muslim, Jain' };

// Engineering profile screen. Students edit everything themselves while the script's switch is on; when it is off (locked) the same
// values are shown read-only. Save sends only the changed fields.
export default function Settings(props) {
  const { config, profile, profileLocked, saveProfile } = props;
  const [form, setForm] = useState(() => toForm(profile));
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [status, setStatus] = useState({ kind: '', text: '' });   // kind: '' | 'saving' | 'ok' | 'error'
  const [branchInput, setBranchInput] = useState('');
  const suggestions = (config.shortlist && config.shortlist.branchSuggestions) || [];

  const errors = checkAll(form);
  const changes = changedFields(form, profile);
  const dirty = Object.keys(changes).length > 0;
  const canSave = !profileLocked && dirty && Object.keys(errors).length === 0 && status.kind !== 'saving';

  // Leaving with unsaved changes asks first (closing the tab or reloading).
  useEffect(() => {
    if (!dirty || profileLocked) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, profileLocked]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setServerErrors(e => { if (!e[k]) return e; const n = { ...e }; delete n[k]; return n; }); if (status.kind === 'ok') setStatus({ kind: '', text: '' }); };
  const blur = (k) => setTouched(t => ({ ...t, [k]: true }));
  const msg = (k) => (touched[k] ? errors[k] : '') || serverErrors[k] || '';

  const addBranch = (raw) => {
    const t = String(raw).replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return;
    if (form.desired_branches.some(b => b.toLowerCase() === t.toLowerCase())) { setBranchInput(''); return; }
    if (form.desired_branches.length >= MAX_BRANCHES) { setTouched(x => ({ ...x, desired_branches: true })); return; }
    set('desired_branches', form.desired_branches.concat(t.slice(0, 100))); setBranchInput('');
  };

  const onSave = async () => {
    setTouched(Object.fromEntries(Object.keys(FIELDS).map(k => [k, true])));
    if (!canSave) return;
    setStatus({ kind: 'saving', text: 'Saving…' });
    const r = await saveProfile(changes);
    if (r.ok) { setServerErrors({}); setStatus({ kind: 'ok', text: 'Saved. Your Predictor and Cutoff Explorer now use these details.' }); setTouched({}); }
    else { setServerErrors(r.fields || {}); setStatus({ kind: 'error', text: ERROR_TEXT[r.error] || ERROR_TEXT.server_error }); }
  };
  // After a save the form shows exactly what the sheet now holds (it may have tidied spelling).
  useEffect(() => { if (status.kind === 'ok') setForm(toForm(profile)); }, [profile]);   // eslint-disable-line react-hooks/exhaustive-deps

  const input = (k, label) => {
    const spec = FIELDS[k]; const id = `pf-${k}`; const err = msg(k); const ro = profileLocked;
    const common = { id, disabled: ro, 'aria-invalid': !!err, onBlur: () => blur(k) };
    let control;
    if (spec.kind === 'enum') {
      control = (
        <select className="form-select" {...common} value={form[k]} onChange={e => set(k, e.target.value)}>
          <option value="">{k === 'category' || k === 'gender' ? 'Select…' : '— not set —'}</option>
          {spec.list.map(o => <option key={o} value={o}>{o}</option>)}
        </select>);
    } else {
      const numeric = spec.kind === 'pct' || spec.kind === 'rank';
      control = <input className="form-input" {...common} type="text" inputMode={spec.kind === 'pct' ? 'decimal' : spec.kind === 'rank' ? 'numeric' : 'text'} autoComplete="off"
        placeholder={ro ? '' : (PLACEHOLDER[k] || '')} value={form[k]} onChange={e => set(k, e.target.value)} maxLength={numeric ? 8 : 100} />;
    }
    return (
      <div className="form-group pf-field" key={k}>
        <label className="form-label" htmlFor={id}>{label}</label>
        {control}
        {err && <div className="pf-error" role="alert">{err}</div>}
      </div>);
  };

  return (
    <div className="pf-wrap">
      <div className="pf-head">
        <h2 className="pf-title">Your profile</h2>
        <p className="pf-sub">{profileLocked ? 'Your profile is locked. Contact your counsellor if something needs to change.' : 'Keep these details correct: your Predictor and Cutoff Explorer start from them.'}</p>
        {profileLocked && status.text && <p className="pf-status" role="status" data-kind={status.kind}>{status.text}</p>}
      </div>

      {SECTIONS.map(sec => (
        <section className="pf-card" key={sec.title}>
          <h3 className="pf-card-title">{sec.title}</h3>
          <p className="pf-card-hint">{sec.hint}</p>
          <div className="pf-grid">{sec.fields.map(([k, label]) => input(k, label))}</div>
        </section>
      ))}

      <section className="pf-card">
        <h3 className="pf-card-title">Preferences</h3>
        <p className="pf-card-hint">Branches you want, up to {MAX_BRANCHES}.</p>
        <div className="pf-chips">
          {form.desired_branches.length === 0 && <span className="pf-none">None chosen yet</span>}
          {form.desired_branches.map(b => (
            <span className="pf-chip" key={b}>{b}
              {!profileLocked && <button type="button" className="pf-chip-x" aria-label={`Remove ${b}`} onClick={() => set('desired_branches', form.desired_branches.filter(x => x !== b))}>✕</button>}
            </span>))}
        </div>
        {!profileLocked && (
          <div className="pf-add">
            <input className="form-input" list="pf-branch-list" placeholder="Type or pick a branch" value={branchInput} aria-label="Add a branch"
              onChange={e => setBranchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBranch(branchInput); } }} />
            <datalist id="pf-branch-list">{suggestions.map(b => <option key={b} value={b} />)}</datalist>
            <button type="button" className="dl-mini-btn" onClick={() => addBranch(branchInput)} disabled={!branchInput.trim()}>Add</button>
          </div>)}
        {msg('desired_branches') && <div className="pf-error" role="alert">{msg('desired_branches')}</div>}
      </section>

      {!profileLocked && (
        <div className="pf-bar">
          <button type="button" className="pf-save" onClick={onSave} disabled={!canSave}>{status.kind === 'saving' ? 'Saving…' : 'Save changes'}</button>
          <span className="pf-status" role="status" data-kind={status.kind}>
            {status.text || (dirty ? (Object.keys(errors).length ? 'Fix the highlighted fields to save.' : 'You have unsaved changes.') : 'No changes yet.')}
          </span>
        </div>)}
    </div>
  );
}
