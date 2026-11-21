'use client';
// Branch tables for one college. The server renders the OPEN category (so the tables are in the static HTML);
// the category selector only swaps which rows of the embedded compact data are shown.
import { useState } from 'react';
import styles from './college.module.css';

const fmt = (n) => Number(n).toLocaleString('en-IN');

function Section({ sec }) {
  const [cat, setCat] = useState('OPEN');
  const cats = Object.keys(sec.cl);
  const quotas = sec.q.filter(q => q.c[cat] && q.c[cat].length);
  return (
    <div className={styles.cutBlock}>
      <div className={styles.cutHead}>
        <div>
          <h3 className={styles.h3}>{sec.label} {sec.year}</h3>
          <p className={styles.muted}>Closing ranks are {sec.basis}, final available round, per branch.</p>
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
      {quotas.map(q => (
        <div key={q.k} className={styles.tableWrap}>
          <table className={styles.table}>
            <caption>{q.l} quota · {sec.cl[cat]} category</caption>
            <thead><tr><th scope="col">Branch</th><th scope="col" className={styles.num}>Closing rank</th><th scope="col" className={styles.num}>Round</th></tr></thead>
            <tbody>
              {q.c[cat].map((r, i) => (
                <tr key={i}><td>{sec.b[r[0]]}</td><td className={styles.num}>{fmt(r[1])}</td><td className={styles.num}>{r[2]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default function CutoffTables({ sections }) {
  return <>{sections.map(sec => <Section key={sec.id} sec={sec} />)}</>;
}
