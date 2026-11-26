'use client';
// Branch tables for one college. The server renders the default view (latest year, gender-neutral, OPEN, final round) so the
// tables are in the static HTML; the selectors only swap which rows of the embedded compact data are shown.
// Row shapes (see lib/engCollegeData.js): lean [bi, rank, round]; rich [bi, closing[], opening[], closingPwd[]].
import { Fragment, useState } from 'react';
import styles from './college.module.css';

const fmt = (n) => Number(n).toLocaleString('en-IN');
const years = (y) => (y ? `${y} ${y === 1 ? 'year' : 'years'}` : '');
const lastIdx = (a) => { for (let i = a.length - 1; i >= 0; i--) if (a[i] !== null && a[i] !== undefined) return i; return -1; };
const GENDER_LABEL = { all: 'Gender-neutral', female: 'Female-only' };

// one row at the chosen round -> { bi, close, open, rnd } or null when that round has no data for the programme
function view(sec, yo, row, pwd, round) {
  if (!sec.rich) return { bi: row[0], close: row[1], open: null, rnd: row[2] };
  const arr = pwd ? row[3] : row[1];
  if (!arr || !arr.length) return null;
  const idx = round === 'final' ? lastIdx(arr) : yo.rn.indexOf(Number(round));
  if (idx < 0 || arr[idx] === null || arr[idx] === undefined) return null;
  const open = !pwd && row[2] && row[2].length ? row[2][idx] : null;
  return { bi: row[0], close: arr[idx], open: open === undefined ? null : open, rnd: yo.rn[idx] };
}

function groupRows(sec, rows) {
  if (!sec.b.some(x => x[1] >= 0)) return { grouped: false, groups: [{ heading: null, rows }] };   // e.g. Maharashtra CAP: the data carries no degree
  const map = new Map(); const other = [];
  for (const r of rows) { const di = sec.b[r.bi][1]; if (di < 0) other.push(r); else { if (!map.has(di)) map.set(di, []); map.get(di).push(r); } }
  const groups = [...map].map(([di, rs]) => ({ heading: sec.dg[di], rows: rs }));
  if (other.length) groups.push({ heading: 'Other programmes', rows: other });
  return { grouped: true, groups };
}

function Select({ label, value, onChange, options }) {
  return (
    <label className={styles.catPick}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
      </select>
    </label>
  );
}

function Section({ sec }) {
  const [year, setYear] = useState(String(sec.years[0].y));
  const [gender, setGender] = useState('all');
  const [cat, setCat] = useState('OPEN');
  const [round, setRound] = useState('final');
  const yo = sec.years.find(x => String(x.y) === year) || sec.years[0];
  const genders = ['all', 'female'].filter(g => yo.q.some(q => q.g[g]));
  const gEff = genders.includes(gender) ? gender : 'all';
  // categories available for this year + gender pool (PwD variants only where the data has them)
  const catOpts = [];
  for (const k of Object.keys(sec.cl)) {
    const has = yo.q.some(q => q.g[gEff] && q.g[gEff][k]);
    if (!has) continue;
    catOpts.push({ v: k, t: sec.cl[k] });
    if (sec.rich && yo.q.some(q => q.g[gEff] && q.g[gEff][k] && q.g[gEff][k].some(r => r[3] && r[3].length))) catOpts.push({ v: k + '|PWD', t: `${sec.cl[k]} (PwD)` });
  }
  const cEff = catOpts.some(o => o.v === cat) ? cat : (catOpts[0] || { v: 'OPEN' }).v;
  const pwd = cEff.endsWith('|PWD'); const baseCat = pwd ? cEff.slice(0, -4) : cEff;
  const rEff = round === 'final' || (yo.rn && yo.rn.includes(Number(round))) ? round : 'final';
  const showOpening = sec.rich && !pwd;
  const quotas = yo.q.filter(q => q.g[gEff] && q.g[gEff][baseCat]);
  const catLabel = (catOpts.find(o => o.v === cEff) || {}).t || baseCat;
  const rankHead = `Closing ${sec.basis}`;

  return (
    <div className={styles.cutBlock}>
      <div className={styles.cutHead}>
        <div>
          <h3 className={styles.h3}>{sec.label} {yo.y}</h3>
          <p className={styles.muted}>Rank type: {sec.basis}. {rEff === 'final' ? 'Each row shows the final available round for that branch.' : `Showing Round ${rEff}.`}</p>
        </div>
        <div className={styles.pickRow}>
          {sec.years.length > 1 && <Select label="Year" value={year} onChange={(v) => { setYear(v); setRound('final'); }} options={sec.years.map(x => ({ v: String(x.y), t: String(x.y) }))} />}
          {genders.length > 1 && <Select label="Gender pool" value={gEff} onChange={setGender} options={genders.map(g => ({ v: g, t: GENDER_LABEL[g] }))} />}
          {catOpts.length > 1 && <Select label="Category" value={cEff} onChange={setCat} options={catOpts} />}
          {yo.rn && yo.rn.length > 1 && <Select label="Round" value={rEff} onChange={setRound} options={[{ v: 'final', t: 'Final round' }, ...yo.rn.map(n => ({ v: String(n), t: `Round ${n}` }))]} />}
        </div>
      </div>
      {quotas.length === 0 && <p className={styles.muted}>No ranks for this selection.</p>}
      {quotas.map(q => {
        const rows = q.g[gEff][baseCat].map(r => view(sec, yo, r, pwd, rEff)).filter(Boolean).sort((a, b) => a.close - b.close);
        if (!rows.length) return null;
        const g = groupRows(sec, rows); const opening = showOpening && rows.some(r => r.open !== null);
        const cols = 3 + (g.grouped ? 1 : 0) + (opening ? 1 : 0);
        return (
          <div key={q.k} className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>{sec.label} {yo.y} · {q.l} quota · {GENDER_LABEL[gEff]} · {catLabel} · {rEff === 'final' ? 'final available round' : `Round ${rEff}`}</caption>
              <thead><tr>
                <th scope="col">Branch</th>
                {g.grouped && <th scope="col">Duration</th>}
                {opening && <th scope="col" className={styles.num}>Opening {sec.basis}</th>}
                <th scope="col" className={styles.num}>{rankHead}</th>
                <th scope="col" className={styles.num}>Round</th>
              </tr></thead>
              <tbody>
                {g.groups.map((grp, gi) => (
                  <Fragment key={gi}>
                    {grp.heading && <tr className={styles.degRow}><th scope="colgroup" colSpan={cols}>{grp.heading}</th></tr>}
                    {grp.rows.map((r, i) => (
                      <tr key={i}>
                        <td>{sec.b[r.bi][0]}</td>
                        {g.grouped && <td>{years(sec.b[r.bi][2])}</td>}
                        {opening && <td className={styles.num}>{r.open === null ? '' : fmt(r.open)}</td>}
                        <td className={styles.num}>{fmt(r.close)}</td><td className={styles.num}>{r.rnd}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export default function CutoffTables({ sections }) {
  return <>{sections.map(sec => <Section key={sec.id} sec={sec} />)}</>;
}
