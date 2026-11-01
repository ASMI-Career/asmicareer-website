
export default function CutoffExplorer(props) {
  const { ceCollegeSearch, ceSingleCollege, ceState, ceViewMode, collegeData, handleToggleShortlist, setCeCollegeSearch, setCeSingleCollege, setCeState, setCeViewMode, shortlist } = props;
  const ceStates   = Array.from(new Set(collegeData.map(c => c.state))).sort();
  const ceColleges = Array.from(new Set(collegeData.map(c => c.name))).sort();

  return (
              <div className="tool-card">
                <h2 className="section-title">📈 Cutoff Explorer</h2>
                <p className="section-sub">Browse historical closing ranks for medical colleges across states and quotas.</p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  <button className={`chip ${ceViewMode === 'database' ? 'active' : ''}`} onClick={() => setCeViewMode('database')}>Browse Database</button>
                  <button className={`chip ${ceViewMode === 'single-college' ? 'active' : ''}`} onClick={() => setCeViewMode('single-college')}>Single College Lookup</button>
                </div>

                {ceViewMode === 'database' ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                      <div className="form-group">
                        <label className="form-label">Search College</label>
                        <input type="text" placeholder="Search..." className="form-input" value={ceCollegeSearch} onChange={e => setCeCollegeSearch(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <select className="form-select" value={ceState} onChange={e => setCeState(e.target.value)}>
                          <option value="All">All States</option>
                          {ceStates.map((st, i) => <option key={i} value={st}>{st}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="table-container">
                      <table className="dense-table">
                        <thead className="predictor-header"><tr>
                          <th>Institute</th><th>State</th><th>Quota</th><th>Closing Rank (AIR)</th><th>Action</th>
                        </tr></thead>
                        <tbody>
                          {collegeData.filter(c => {
                            if (ceState !== 'All' && c.state !== ceState) return false;
                            if (ceCollegeSearch && !c.name.toLowerCase().includes(ceCollegeSearch.toLowerCase())) return false;
                            return true;
                          }).slice(0, 60).map((c, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 700 }}>{c.name}</td>
                              <td>{c.state}</td>
                              <td><span className="tag tag-gold">{c.quota || 'All India'}</span></td>
                              <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{c.cutoff?.toLocaleString() || '—'}</td>
                              <td>
                                <button onClick={() => handleToggleShortlist(c.name, c)} className="chip" style={{ fontSize: 11 }}>
                                  {shortlist.includes(c.name) ? '★ Saved' : '☆ Save'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="form-group" style={{ maxWidth: 500 }}>
                      <label className="form-label">Select College</label>
                      <select className="form-select" value={ceSingleCollege} onChange={e => setCeSingleCollege(e.target.value)}>
                        <option value="">— Select College —</option>
                        {ceColleges.map((col, i) => <option key={i} value={col}>{col}</option>)}
                      </select>
                    </div>
                    {ceSingleCollege && (
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>{ceSingleCollege}</h3>
                        <div className="table-container">
                          <table className="dense-table">
                            <thead className="predictor-header"><tr><th>Quota</th><th>State</th><th>Fees</th><th>Closing Rank (AIR)</th></tr></thead>
                            <tbody>
                              {collegeData.filter(c => c.name === ceSingleCollege).map((c, i) => (
                                <tr key={i}>
                                  <td><span className="tag tag-gold">{c.quota || 'All India'}</span></td>
                                  <td>{c.state}</td>
                                  <td>{c.fees ? `₹${parseInt(c.fees, 10).toLocaleString('en-IN')}` : '—'}</td>
                                  <td style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 15 }}>{c.cutoff?.toLocaleString() || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
  );
}
