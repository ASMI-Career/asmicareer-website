import { useState } from 'react';
import { formatFees } from '../lib/format';
import AddChoicePanel from './AddChoicePanel';
import { studentExamIds } from '../lib/exams';

export default function Institutes(props) {
  const { config, shortlistGroups, studentTracks, collegesList, handleToggleShortlist, instCourse, instMaxFees, instSearch, instSelectedStates, instSortBy, instStateSearch, instTabType, instType, setInstCourse, setInstMaxFees, setInstSearch, setInstSelectedStates, setInstSortBy, setInstStateSearch, setInstTabType, setInstType, shortlist } = props;
  const inst = config.institutes;
  // Engineering: a choice needs branch + seat type, so the heart opens a small form instead of toggling straight away.
  const [pendingCollege, setPendingCollege] = useState(null);
  // Engineering (config.instituteExams): colleges are split by the entrance EXAM you can apply through (college.groups holds exam ids). Component state only, not saved.
  const [more, setMore] = useState({ sig: '', n: 48 });   // engineering only: "Show more" count, reset whenever a filter changes
  const [exam, setExam] = useState(null);   // null = the default view: "My exams" for a student with tracks, otherwise All
  const grouped = !!config.instituteExams;
  const mine = grouped ? studentExamIds(props.profile, studentTracks, config) : [];   // from the student's tracks and the scores in Settings
  const view = exam === null ? (mine.length ? 'mine' : 'all') : exam;
  const inView = (c) => view === 'all' || (c.groups || []).some(g => (view === 'mine' ? mine.includes(g) : g === view));
  const viewLabel = view === 'mine' ? mine.map(id => (config.instituteExams.find(e => e.id === id) || {}).label || id).join(', ') : ((config.instituteExams || []).find(e => e.id === view) || {}).label;
  const isShortlistedFor = (college) => config.shortlist.askDetails
    ? Object.values(shortlistGroups).some(arr => Array.isArray(arr) && arr.some(i => i && i.institute === college.name))
    : shortlist.includes(college.name);
  const Card = inst.detailHref ? 'a' : 'div';   // link to a detail page only when the stream has one
  const uniqueStates = Array.from(new Set(collegesList.map(c => c.state).filter(Boolean))).sort();
  const filteredStatesList = uniqueStates.filter(s => s.toLowerCase().includes(instStateSearch.toLowerCase()));

  const sig = JSON.stringify([view, instTabType, instType, instCourse, instSearch, instMaxFees, instSortBy, [...(instSelectedStates || [])]]);
  const limit = grouped && more.sig === sig ? more.n : 48;
  const getFilteredCollegesList = () => {
    let r = [...collegesList];
    if (grouped) r = r.filter(inView);
    if (instTabType !== 'All') r = r.filter(c => c.type?.toLowerCase() === instTabType.toLowerCase());
    if (instType !== 'All')    r = r.filter(c => c.type?.toLowerCase() === instType.toLowerCase());
    if (instCourse !== 'All')  r = r.filter(c => c.course?.toLowerCase() === instCourse.toLowerCase());
    if (instSelectedStates.length > 0) r = r.filter(c => instSelectedStates.includes(c.state));
    if (instSearch) r = r.filter(c => c.name.toLowerCase().includes(instSearch.toLowerCase()));
    r = r.filter(c => c.annual_fees == null || c.annual_fees <= instMaxFees);
    if (instSortBy === 'Recommended') r.sort((a, b) => (b.asmi_recommended ? 1 : 0) - (a.asmi_recommended ? 1 : 0));
    else if (instSortBy === 'Name')  r.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (instSortBy === 'Seats') r.sort((a, b) => (b.seats || 0) - (a.seats || 0));
    return r;
  };

  return (
              <div>
                <h2 className="section-title">{inst.title}</h2>
                <p className="section-sub">{inst.subtitle}</p>

                {/* Exam / counselling groups (engineering) */}
                {grouped && (
                  <div className="dg-wrap">
                    <div className="dg-chips" role="group" aria-label="Entrance exam">
                      <button type="button" className={`chip ${exam === null ? 'active' : ''}`} aria-pressed={exam === null} onClick={() => setExam(null)}>
                        {mine.length ? 'My exams' : 'All'}<span className="dg-count">{collegesList.filter(c => (mine.length ? (c.groups || []).some(g => mine.includes(g)) : true)).length}</span></button>
                      {mine.length > 0 && <button type="button" className={`chip ${exam === 'all' ? 'active' : ''}`} aria-pressed={exam === 'all'} onClick={() => setExam('all')}>All<span className="dg-count">{collegesList.length}</span></button>}
                      {config.instituteExams.map(e => (
                        <button key={e.id} type="button" className={`chip ${exam === e.id ? 'active' : ''}`} aria-pressed={exam === e.id} onClick={() => setExam(e.id)}>
                          {e.label}{mine.includes(e.id) && <span className="dg-own" title="One of your exams" aria-label="your exam"> ★</span>}<span className="dg-count">{collegesList.filter(c => (c.groups || []).includes(e.id)).length}</span></button>))}
                    </div>
                    <p className="dg-hint">You can apply to a college only through an entrance exam you have taken. Pick an exam to see the colleges it opens.</p>
                  </div>
                )}

                {/* Tab pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {inst.tabTypes.map(tab => (
                    <button key={tab} onClick={() => setInstTabType(tab)}
                      className={`chip ${instTabType === tab ? 'active' : ''}`}>
                      {tab === 'All' ? inst.tabAllLabel : tab}{grouped && <span className="dg-count">{collegesList.filter(c => inView(c) && (tab === 'All' || c.type?.toLowerCase() === tab.toLowerCase())).length}</span>}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {/* Filters */}
                  <div className="filters-panel" style={{ flex: '0 0 260px', minWidth: 220 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-900)' }}>Filters</span>
                      <button onClick={() => {
                        setInstSelectedStates([]); setInstType('All'); setInstCourse('All');
                        setInstTabType('All'); setInstMaxFees(3000000); setInstSortBy('Recommended');
                        setInstSearch(''); setInstStateSearch('');
                      }} className="card-action">Reset all</button>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">Search College</div>
                      <input type="text" placeholder="Search..." className="form-input"
                        value={instSearch} onChange={e => setInstSearch(e.target.value)} style={{ padding: '8px 12px', fontSize: 12 }} />
                    </div>

                    <div className="filter-section">
                      <div className="form-label">State</div>
                      <input type="text" placeholder="Search state..." className="form-input"
                        value={instStateSearch} onChange={e => setInstStateSearch(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: 11, marginBottom: 8 }} />
                      <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {filteredStatesList.map(state => (
                          <label key={state} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-700)' }}>
                            <input type="checkbox" checked={instSelectedStates.includes(state)}
                              onChange={() => setInstSelectedStates(prev =>
                                prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state])}
                              style={{ accentColor: 'var(--primary)' }} />
                            {state}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">College Type</div>
                      <select className="form-select" value={instType} onChange={e => setInstType(e.target.value)} style={{ fontSize: 12 }}>
                        {inst.typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">Course</div>
                      <select className="form-select" value={instCourse} onChange={e => setInstCourse(e.target.value)} style={{ fontSize: 12 }}>
                        {inst.courseOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">Sort By</div>
                      <select className="form-select" value={instSortBy} onChange={e => setInstSortBy(e.target.value)} style={{ fontSize: 12 }}>
                        <option value="Recommended">ASMI Recommended</option>
                        <option value="Name">Name A–Z</option>
                        <option value="Seats">Seats (High to Low)</option>
                      </select>
                    </div>

                    <div>
                      <div className="form-label">Annual Fees</div>
                      <input type="range" min="0" max="3000000" step="50000" value={instMaxFees}
                        onChange={e => setInstMaxFees(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', marginBottom: 6 }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                        Up to {instMaxFees === 3000000 ? 'No Limit' : `₹${instMaxFees.toLocaleString('en-IN')}`}
                      </div>
                    </div>
                  </div>

                  {/* Grid */}
                  <div style={{ flex: '1 1 400px' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-500)', marginBottom: 16 }}>
                      Showing <strong style={{ color: 'var(--text-900)' }}>{getFilteredCollegesList().length}</strong> college{getFilteredCollegesList().length !== 1 ? 's' : ''} matching your criteria.
                    </div>
                    {config.shortlist.askDetails && pendingCollege && (
                      <AddChoicePanel college={pendingCollege} config={config} studentTracks={studentTracks} shortlist={shortlist}
                        onAdd={(label, entry) => { handleToggleShortlist(label, entry); setPendingCollege(null); }}
                        onCancel={() => setPendingCollege(null)} />
                    )}
                    {getFilteredCollegesList().length === 0 ? (
                      <div className="card-sm empty-state">{grouped && collegesList.length > 0 && collegesList.filter(inView).length === 0 ? `Institutes for ${viewLabel} are being added.` : 'No colleges found. Try adjusting your filters.'}</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {getFilteredCollegesList().slice(0, limit).map(college => {
                          const isShortlisted = isShortlistedFor(college);
                          return (
                            <Card {...(inst.detailHref ? { href: inst.detailHref.replace('{slug}', college.slug), target: '_blank', rel: 'noreferrer' } : {})}
                              key={college.slug} className="college-card">
                              <div className="college-img-placeholder" style={{ position: 'relative' }}>
                                  {(() => { const imgSrc = college.photo || college.image || college.cover_image || college.img || college.thumbnail; return imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={college.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : null; })()}
                                {!(college.photo || college.image || college.cover_image || college.img || college.thumbnail) && (
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', textAlign: 'center' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>{college.name}</span>
                                  </div>
                                )}
                                {college.asmi_recommended && (
                                  <span className="college-badge-recommend">★ ASMI RECOMMENDS</span>
                                )}
                                {college.asmi_pulse_score && (
                                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.92)', color: 'var(--navy)', fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 4 }}>
                                    ★ {college.asmi_pulse_score}/5
                                  </span>
                                )}
                                <button onClick={e => { e.preventDefault(); e.stopPropagation(); if (config.shortlist.askDetails) setPendingCollege(college); else handleToggleShortlist(college.name, college); }}
                                  style={{ position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: isShortlisted ? '#dc2626' : 'var(--navy)' }}>
                                  {isShortlisted ? '♥' : '♡'}
                                </button>
                              </div>
                              <div className="college-card-body">
                                <div className="college-meta">
                                  {college.city && <span>📍 {college.city}</span>}
                                  <span>🎓 {college.type}</span>
                                </div>
                                <div className="college-name">{college.name}</div>
                                <div className="college-stats">
                                  {college.seats ? `${college.seats} ${college.course || inst.defaultCourse} seats` : ''}
                                  {college.annual_fees ? ` · ${formatFees(college.annual_fees)}` : ''}
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                    {grouped && getFilteredCollegesList().length > limit && (
                      <div style={{ textAlign: 'center', marginTop: 20 }}>
                        <button className="chip" onClick={() => setMore({ sig, n: limit + 48 })}>Show more ({getFilteredCollegesList().length - limit} left)</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
  );
}
