import { useState } from 'react';

// Engineering only: adding a shortlist choice needs more than the institute. One choice = institute + branch + seat type
// (on a track). Shown above the college grid after the student taps the heart on a college card.
export default function AddChoicePanel({ college, config, studentTracks, shortlist, onAdd, onCancel }) {
  const sl = config.shortlist;
  const tracks = ((studentTracks && studentTracks.length) ? studentTracks : (config.tracks || []).map(t => t.id)).filter(t => sl.seatTypes[t]);
  const [branch, setBranch] = useState('');
  const [track, setTrack] = useState(tracks[0] || '');
  const [seatType, setSeatType] = useState('');
  const [error, setError] = useState('');
  const seatOptions = sl.seatTypes[track] || [];

  const submit = () => {
    const b = branch.trim();
    if (!b) return setError('Enter the branch.');
    if (!track) return setError('Choose the track.');
    if (!seatType) return setError('Choose the seat type.');
    const label = `${college.name} — ${b} (${seatType})`;
    if (shortlist.includes(label)) return setError('This choice is already in your shortlist.');
    onAdd(label, { ...college, institute: college.name, branch: b, seatType, track });
  };
  const btn = { border: 'none', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };

  return (
    <div className="tool-card" id="addChoicePanel" style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-900)', marginBottom: 14 }}>Add to your shortlist: {college.name}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Branch</label>
          <input className="form-input" list="addChoiceBranches" placeholder="e.g. Computer Science" value={branch} onChange={e => { setBranch(e.target.value); setError(''); }} />
          <datalist id="addChoiceBranches">{sl.branchSuggestions.map(b => <option key={b} value={b} />)}</datalist>
        </div>
        <div className="form-group">
          <label className="form-label">Track</label>
          <select className="form-select" value={track} onChange={e => { setTrack(e.target.value); setSeatType(''); setError(''); }}>
            {tracks.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Seat type</label>
          <select className="form-select" value={seatType} onChange={e => { setSeatType(e.target.value); setError(''); }}>
            <option value="">— Select —</option>
            {seatOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {error && <p role="alert" style={{ color: 'red', fontSize: 12, marginTop: 10 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button style={{ ...btn, background: '#1A0040', color: '#ffffff' }} onClick={submit}>Add to shortlist</button>
        <button style={{ ...btn, background: 'transparent', color: 'var(--text-500)', border: '1px solid var(--border)' }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
