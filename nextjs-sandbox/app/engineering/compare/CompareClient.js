'use client';
// /engineering/compare?c=slug1,slug2 : for now a simple list of the chosen colleges (the side-by-side view is built in a later step).
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../colleges/compare.module.css';
import { COMPARE_KEY, COMPARE_MAX, useCompare } from '../colleges/CompareControls';

function Inner() {
  const params = useSearchParams();
  const { list, clear } = useCompare();
  const [all, setAll] = useState(null);
  const fromUrl = (params.get('c') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const slugs = (fromUrl.length ? fromUrl : list).slice(0, COMPARE_MAX);
  useEffect(() => {
    fetch('/data/engineering-colleges.json').then((r) => r.json()).then(setAll).catch(() => setAll([]));
  }, []);
  const chosen = (all || []).filter((c) => slugs.includes(c.slug));
  return (
    <div className={styles.wrap}>
      <h1>Compare colleges</h1>
      <p className={styles.note}>Side-by-side comparison is still being built. For now, here are the colleges you picked: open any of them to see cut-offs, fees and admission details.</p>
      {all === null ? <p>Loading…</p> : chosen.length === 0 ? (
        <p>No colleges selected yet. <a href="/engineering/colleges">Browse colleges</a> and press “+ Add to Compare”.</p>
      ) : (
        <ul className={styles.list}>
          {chosen.map((c) => (
            <li key={c.slug}><a href={`/engineering/colleges/${c.slug}`}>{c.name}</a><span>{[c.city, c.state].filter(Boolean).join(', ')}{c.type ? ` · ${c.type}` : ''}</span></li>
          ))}
        </ul>
      )}
      {list.length > 0 && <button type="button" className={styles.barClear} style={{ color: '#00756a' }} onClick={clear}>Clear my selection</button>}
    </div>
  );
}

export default function CompareClient() {
  return <Suspense fallback={<div className={styles.wrap}><p>Loading…</p></div>}><Inner /></Suspense>;
}
