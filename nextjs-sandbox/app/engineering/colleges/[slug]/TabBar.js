'use client';
// Sticky in-page tab bar. The links are plain #anchors (present in the static HTML); this only highlights the section in view.
import { useEffect, useState } from 'react';
import styles from './college.module.css';

export default function TabBar({ items }) {
  const [active, setActive] = useState(items[0] ? items[0].id : '');
  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean);
    if (!els.length || typeof IntersectionObserver === 'undefined') return undefined;
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : null);
      const visible = [...seen].filter(([, t]) => t !== null).sort((a, b) => a[1] - b[1]);
      if (visible.length) setActive(visible[0][0]);
    }, { rootMargin: '-130px 0px -55% 0px', threshold: 0 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);
  return (
    <nav className={styles.anchors} aria-label="On this page">
      {items.map((n) => <a key={n.id} href={`#${n.id}`} className={active === n.id ? styles.anchorOn : ''} aria-current={active === n.id ? 'true' : undefined}>{n.label}</a>)}
    </nav>
  );
}
