'use client';
// Medical-style navigation: a sticky tab bar shows ONE panel at a time. All panels are still rendered in the static HTML
// (the inactive ones carry the `hidden` attribute), so search engines read every section. A link such as #cutoffs opens that tab.
import { useEffect, useRef, useState } from 'react';
import styles from './college.module.css';

export default function Tabs({ items, panels, aside }) {
  const [active, setActive] = useState(items[0] ? items[0].id : '');
  const top = useRef(null);
  useEffect(() => {
    const fromHash = () => { const h = window.location.hash.replace('#', ''); if (items.some((i) => i.id === h)) setActive(h); };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, [items]);
  const pick = (id) => {
    setActive(id);
    try { window.history.replaceState(null, '', `#${id}`); } catch { /* ignore */ }
    const el = top.current;
    if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 70; if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'auto' }); }
  };
  const onKey = (e, i) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = items[(i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length];
    pick(n.id); const b = document.getElementById(`tab-${n.id}`); if (b) b.focus();
  };
  return (
    <>
      <div ref={top} className={styles.tabsWrap}>
        <div className={styles.tabs} role="tablist" aria-label="College sections">
          {items.map((n, i) => (
            <button key={n.id} id={`tab-${n.id}`} role="tab" type="button" aria-selected={active === n.id} aria-controls={`panel-${n.id}`}
              tabIndex={active === n.id ? 0 : -1} className={`${styles.tab} ${active === n.id ? styles.tabOn : ''}`}
              onClick={() => pick(n.id)} onKeyDown={(e) => onKey(e, i)}>{n.label}</button>
          ))}
        </div>
      </div>
      <div className={styles.layout}>
        {aside}
        <div className={styles.main}>
          {items.map((n) => (
            <div key={n.id} id={`panel-${n.id}`} role="tabpanel" aria-labelledby={`tab-${n.id}`} hidden={active !== n.id}>{panels[n.id]}</div>
          ))}
        </div>
      </div>
    </>
  );
}
