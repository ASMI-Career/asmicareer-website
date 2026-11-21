'use client';
// Branch tables for one college. The server renders the OPEN category (so the tables are in the static HTML);
// the category selector only swaps which rows of the embedded compact data are shown.
import { Fragment, useState } from 'react';
import styles from './college.module.css';

const fmt = (n) => Number(n).toLocaleString('en-IN');

const years = (y) => (y ? `${y} ${y === 1 ? 'year' : 'years'}` : '');

// rows of one quota/category -> [{ heading|null, rows }] grouped by the degree written in the program string
function group(sec, rows) {
  const hasDegrees = sec.b.some(x => x[1] >= 0);
  if (!hasDegrees) return { grouped: false, groups: [{ heading: null, rows }] };   // e.g. Maharashtra CAP: the data carries no degree
  const map = new Map(); const other = [];
  for (const r of rows) { const di = sec.b[r[0]][1]; if (di < 0) other.push(r); else { if (!map.has(di)) map.set(di, []); map.get(di).push(r); } }
  const groups = [...map].map(([di, rs]) => ({ heading: sec.dg[di], rows: rs }));
  if (other.length) groups.push({ heading: 'Other programmes', rows: other });
  return { grouped: true, groups };
}

function Section({ sec }) {
  const [cat, setCat] = useState('OPEN');
  const cats = Object.keys(sec.cl);
  const quotas = sec.q.filter(q => q.c[cat] && q.c[cat].length);
  return (
    <div className={styles.cutBlock}>
      <div className={styles.cutHead}>
        <div>
          <h3 className={styles.h3}>{sec.label} {sec.year}</h3>
          <p className={styles.muted}>Closing rank type: {sec.basis}. Each row shows the final available round for that branch.</p>
        </div>
        {cats.length > 1 && (
          <label className={styles.catPick}>
            <span>Category</span>
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label={`${sec.label} category`}>
              {cats.map(k => <option key={k} value={k}>{sec.cl[k]}</option>)}
            </select>
          </label>
        )}
      </div>
      {quotas.length === 0 && <p className={styles.muted}>No ranks for this category.</p>}
      {quotas.map(q => {
        const g = group(sec, q.c[cat]); const cols = g.grouped ? 4 : 3;
        return (
          <div key={q.k} className={styles.tableWrap}>
            <table className={styles.table}>
              <caption>{sec.label} {sec.year} · {q.l} quota · {sec.cl[cat]} category · final available round</caption>
              <thead><tr>
                <th scope="col">Branch</th>
                {g.grouped && <th scope="col">Duration</th>}
                <th scope="col" className={styles.num}>Closing {sec.basis}</th>
                <th scope="col" className={styles.num}>Round</th>
              </tr></thead>
              <tbody>
                {g.groups.map((grp, gi) => (
                  <Fragment key={gi}>
                    {grp.heading && <tr className={styles.degRow}><th scope="colgroup" colSpan={cols}>{grp.heading}</th></tr>}
                    {grp.rows.map((r, i) => (
                      <tr key={i}>
                        <td>{sec.b[r[0]][0]}</td>
                        {g.grouped && <td>{years(sec.b[r[0]][2])}</td>}
                        <td className={styles.num}>{fmt(r[1])}</td><td className={styles.num}>{r[2]}</td>
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
