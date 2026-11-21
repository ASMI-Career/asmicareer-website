'use client';
// "Add to Compare": up to 4 colleges, kept in localStorage (every access is wrapped in try/catch; without storage the choice
// still lasts for the open tab). No login. Used by the directory cards, the college page and the floating bar.
import { useEffect, useState } from 'react';
import styles from './compare.module.css';

export const COMPARE_KEY = 'asmi_eng_compare';
export const COMPARE_MAX = 4;
let mem = [];   // fallback when localStorage is blocked

function read() {
  try {
    const v = JSON.parse(window.localStorage.getItem(COMPARE_KEY) || '[]');
    if (Array.isArray(v)) { mem = v.filter((s) => typeof s === 'string').slice(0, COMPARE_MAX); }
  } catch { /* storage blocked or corrupt: keep the in-memory list */ }
  return mem.slice();
}
function write(list) {
  mem = list.slice(0, COMPARE_MAX);
  try { window.localStorage.setItem(COMPARE_KEY, JSON.stringify(mem)); } catch { /* ignore */ }
  try { window.dispatchEvent(new Event('asmi-compare')); } catch { /* ignore */ }
}

export function useCompare() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const sync = () => setList(read());
    sync();
    window.addEventListener('asmi-compare', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('asmi-compare', sync); window.removeEventListener('storage', sync); };
  }, []);
  const toggle = (slug) => { const cur = read(); write(cur.includes(slug) ? cur.filter((s) => s !== slug) : cur.length >= COMPARE_MAX ? cur : [...cur, slug]); };
  const clear = () => write([]);
  return { list, toggle, clear };
}

export function AddToCompare({ slug, variant = 'default', small = false }) {
  const { list, toggle } = useCompare();
  const on = list.includes(slug); const full = !on && list.length >= COMPARE_MAX;
  return (
    <button type="button" aria-pressed={on} disabled={full} title={full ? `You can compare up to ${COMPARE_MAX} colleges` : undefined}
      className={`${styles.addBtn} ${variant === 'light' ? styles.addBtnLight : ''} ${small ? styles.cardBtn : ''}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(slug); }}>
      {on ? '✓ Added to Compare' : '+ Add to Compare'}
    </button>
  );
}

export function CompareBar() {
  const { list, clear } = useCompare();
  if (!list.length) return null;
  return (
    <div className={styles.bar} role="region" aria-label="Compare colleges">
      <span>{list.length} college{list.length === 1 ? '' : 's'} selected</span>
      <a className={styles.barGo} href={`/engineering/compare?c=${list.map(encodeURIComponent).join(',')}`}>Compare Now</a>
      <button type="button" className={styles.barClear} onClick={clear}>Clear all</button>
    </div>
  );
}
