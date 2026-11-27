import { useState, useEffect, useRef } from 'react';
import { callDash } from '../lib/api';

// Staff screen: find any student by name or Token, then open that student's dashboard (the server checks the Staff tab and logs it).
const STREAM_LABEL = { medical: 'Medical', engineering: 'Engineering' };

export default function StaffFinder({ endpoints, onOpen, onSignOut, notice }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [state, setState] = useState('idle');       // idle | searching | done | error
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setState('idle'); return undefined; }
    const my = ++seq.current;
    setState('searching');
    const t = setTimeout(async () => {
      try {
        const lists = await Promise.all(endpoints.map(async (e) => {
          const r = await callDash(e.endpoint, 'staffSearch', { query: q });
          if (!(r && r.success && Array.isArray(r.results))) throw new Error('search failed');
          return r.results.map(x => ({ ...x, streamId: e.streamId, endpoint: e.endpoint }));
        }));
        if (my !== seq.current) return;
        setResults(lists.flat()); setState('done');
      } catch (err) { if (my === seq.current) setState('error'); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, endpoints]);

  const wrap = { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100vh', padding: 16 };
  const card = { maxWidth: 560, width: '100%', marginTop: 40 };
  const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontFamily: 'inherit' };
  return (
    <div className="student-body">
      <div style={wrap}>
        <div className="tool-card" style={card}>
          <img src="/asmi-logo.png" alt="ASMI Logo" style={{ height: 44, marginBottom: 16 }} />
          <h2 className="section-title">Staff: find a student</h2>
          <p className="section-sub">Type at least 2 letters of a name, or part of a Token. Everything you open or change is recorded in the Staff Log.</p>
          {notice && <p role="alert" style={{ color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>{notice}</p>}
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Student name or Token" aria-label="Student name or Token"
            style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '1.5px solid #d1d5db', borderRadius: 12, margin: '12px 0', fontFamily: 'inherit' }} />
          {state === 'searching' && <p className="section-sub">Searching…</p>}
          {state === 'error' && <p role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>Search failed. Please try again.</p>}
          {state === 'done' && results.length === 0 && <p className="section-sub">No student found.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((r, i) => (
              <button key={`${r.streamId}-${r.ref}-${i}`} style={row} onClick={() => onOpen(r)}>
                <span><strong>{r.name}</strong>{r.stage ? <span style={{ color: '#6b7280', fontSize: 12 }}> · {r.stage}</span> : null}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1A0040' }}>{STREAM_LABEL[r.streamId] || r.streamId}</span>
              </button>
            ))}
          </div>
          <button className="btn-outline-navy" style={{ marginTop: 20 }} onClick={onSignOut}>Sign out</button>
        </div>
      </div>
    </div>
  );
}
