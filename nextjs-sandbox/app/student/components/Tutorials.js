import { useState, useEffect } from 'react';
import { youtubeId, youtubeEmbedUrl } from '../lib/youtube';

// Engineering "Tutorials" tab: how-to-apply videos from /data/tutorials.json, grouped by exam.
// Item shape: { id, exam, step, title, url, order }. The file ships empty; items are added by whoever owns the videos.
// An item whose url is not a YouTube watch / youtu.be / shorts link is skipped with a console warning.
export default function Tutorials() {
  const [items, setItems] = useState(null);   // null = loading
  const [focus] = useState(() => { try { return new URLSearchParams(window.location.search).get('video') || ''; } catch (e) { return ''; } });

  useEffect(() => {
    fetch('/data/tutorials.json').then(r => r.json()).then(list => {
      const ok = [];
      (Array.isArray(list) ? list : []).forEach((t, i) => {
        const vid = youtubeId(t && t.url);
        if (!vid) { console.warn('Tutorial skipped (not a YouTube link):', t && (t.id || t.title || i)); return; }
        ok.push({ ...t, vid });
      });
      setItems(ok);
    }).catch(() => setItems([]));
  }, []);

  // A link from a deadline ("Watch how to apply") carries ?video=<id>: bring that video into view.
  useEffect(() => {
    if (!items || !focus) return;
    const el = document.getElementById(`tutorial-${focus}`);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' });
  }, [items, focus]);

  const groups = [];
  (items || []).forEach(t => {
    const name = t.exam || 'General';
    let g = groups.find(x => x.name === name);
    if (!g) { g = { name, list: [] }; groups.push(g); }
    g.list.push(t);
  });
  groups.forEach(g => g.list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)));
  groups.sort((a, b) => (Number(a.list[0].order) || 0) - (Number(b.list[0].order) || 0));

  return (
    <div className="tool-card tut-wrap">
      <h2 className="section-title">Tutorials</h2>
      <p className="section-sub">Step-by-step videos on how to fill each exam form.</p>
      {items === null && <div className="empty-state">Loading…</div>}
      {items && items.length === 0 && <div className="empty-state">Video tutorials are being added. Check back soon.</div>}
      {groups.map(g => (
        <section key={g.name} className="tut-group">
          <h3 className="tut-group-title">{g.name}</h3>
          <div className="tut-grid">
            {g.list.map(t => (
              <article key={t.id || t.vid} id={t.id ? `tutorial-${t.id}` : undefined} className={`tut-card${focus && t.id === focus ? ' is-focus' : ''}`}>
                <div className="tut-frame">
                  <iframe src={youtubeEmbedUrl(t.vid)} title={t.title || `${g.name} tutorial`} loading="lazy"
                    allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
                </div>
                <div className="tut-body">
                  {t.step && <span className="tag tag-gold">{t.step}</span>}
                  <div className="tut-title">{t.title}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
