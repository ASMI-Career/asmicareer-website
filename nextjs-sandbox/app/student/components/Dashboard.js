
export default function Dashboard(props) {
  const { config, allIds, checkedDocs, counsellorBranch, counsellorInitials, counsellorName, counsellorWhatsapp, deadlines, doneCount, handleToggleShortlist, progressSteps, sectionsToRender, setActiveTab, shortlist, studentCategory, studentName, studentRank, studentScore, toggleDoc, whatsappGroupLink } = props;
  const dash = config.dashboard;
  const dlRules = config.deadlines;
  // The shortlist and checklist shortcuts only appear when the stream has the module they open.
  const hasEditTab = config.modules.includes(dash.shortlistEditTab);
  const hasChecklist = config.modules.includes('checklist');
  const badgeValue = (field) => {
    if (field === 'score') return studentScore || '—';
    if (field === 'rank') return studentRank ? studentRank.toLocaleString('en-IN') : '—';
    return studentCategory ? (dash.categoryLabels[studentCategory] || studentCategory) : '—';
  };
  const getCountdown = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: 'Closed', cls: 'tag-red' };
    if (days === 0) return { text: 'Today!', cls: 'tag-red' };
    if (days <= 3) return { text: `${days}d left`, cls: 'tag-red' };
    if (days <= 14) return { text: `${days}d left`, cls: 'tag-gold' };
    return { text: `${days}d left`, cls: 'tag-green' };
  };

  const getMonthAbbr = (d) => new Date(d).toLocaleString('en-US', { month: 'short' });
  const getDayNum   = (d) => new Date(d).getDate();
  const formatDeadlineDate = (d) => { const dt = new Date(d); return `${dt.getDate()} ${dt.toLocaleString('en-US', { month: 'short' })}`; };


  // ── Tag helper for deadline type
  const getDeadlineTag = (tag) => {
    const t = (tag || '').toUpperCase();
    if (t.includes('EXAM')) return 'tag-blue';
    if (dash.redTagKeywords.some(k => t.includes(k))) return 'tag-red';
    if (t.includes('REG')) return 'tag-purple';
    return 'tag-gold';
  };

  // ── Shortlist icon colors cycling
  const iconColors = ['tag-purple', 'tag-blue', 'tag-gold', 'tag-green', 'tag-red'];


  // Progress line width
  const completedCount = progressSteps.filter(s => s.status === 'completed').length;
  const activeIdx = progressSteps.findIndex(s => s.status === 'active');
  const progressPct = progressSteps.length > 1
    ? ((completedCount + (activeIdx !== -1 ? 0.5 : 0)) / (progressSteps.length - 1)) * 100
    : 0;

  return (
              <div className="dash-grid">

                {/* ── LEFT COLUMN ── */}
                <div className="dash-col-left">

                  {/* Hero Welcome Card */}
                  <section className="hero-card">
                    <div>
                      <h1 className="hero-greeting">Welcome back, {studentName.split(' ')[0]} 👋</h1>
                      <p className="hero-subtitle">{dash.heroSubtitle}</p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                        {dash.badges.map(b => (
                          <div className="rank-badge" key={b.field}>
                            <span className="rank-badge-label">{b.label}</span>
                            <span className="rank-badge-value">{badgeValue(b.field)}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '6px 14px', fontSize: 13, color: 'white', fontWeight: 500 }}>
                        <span>
                          {shortlist.length === 0
                            ? 'No colleges shortlisted yet'
                            : `${shortlist.length} college${shortlist.length !== 1 ? 's' : ''} shortlisted`}
                        </span>
                        {deadlines.length > 0 && (
                          <>
                            <span style={{ opacity: 0.5 }}>|</span>
                            <span>Next: {deadlines[0].title} on {formatDeadlineDate(deadlines[0].date)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Progress tracker */}
                    <div className="progress-tracker">
                      <div className="progress-label">Admission Progress</div>
                      <div className="progress-steps">
                        <div className="progress-line-track" style={{ background: 'rgba(255,255,255,0.15)' }} />
                        <div className="progress-line-fill" style={{ width: `calc(${progressPct}% * ((100% - 64px) / 100%) + 0px)`, background: '#A855F7' }} />
                        {progressSteps.map((step) => (
                          <div key={step.id} className="step-item">
                            <div className={`step-circle ${step.status}`} style={
                              step.status === 'completed' ? { background: '#1A0040', borderColor: '#1A0040', color: 'white' }
                              : step.status === 'active'    ? { background: 'white', borderColor: '#6A0DAD', color: '#6A0DAD' }
                              : { background: '#e5e7eb', borderColor: '#e5e7eb', color: '#9ca3af' }
                            }>
                              {step.status === 'completed' ? '✓' : step.id}
                            </div>
                            <span className={`step-label ${step.status}`} style={
                              step.status === 'active'  ? { color: '#ffffff' }
                              : step.status === 'pending' ? { color: 'rgba(255,255,255,0.45)' }
                              : { color: 'rgba(255,255,255,0.75)' }
                            }>{step.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Deadlines + Shortlist grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>

                    {/* Deadlines */}
                    <div className="card-sm" style={{ padding: 24 }}>
                      <div className="card-header">
                        <div className="card-title">
                          <span>📅</span> Upcoming Deadlines
                        </div>
                        <a href={dash.newsUrl} target="_blank" rel="noreferrer" className="card-action" style={{ textDecoration: 'none' }}>View All</a>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {deadlines.length === 0 ? (
                          <div className="empty-state">No upcoming deadlines.</div>
                        ) : deadlines.slice(0, dash.deadlineCount).map((dl, i) => {
                          const cd = getCountdown(dl.date);
                          return (
                            <div key={i} className="deadline-item">
                              <div className="deadline-date-box">
                                <span className="deadline-month">{getMonthAbbr(dl.date)}</span>
                                <span className="deadline-day">{getDayNum(dl.date)}</span>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div className="deadline-title">{dl.title}</div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 5 }}>
                                  <span className={`tag ${getDeadlineTag(dl.tag)}`}>{dl.tag}</span>
                                  <span style={{ fontSize: 10, color: 'var(--text-400)', fontWeight: 600 }}>{cd.text}</span>
                                  {dlRules.showTentative && dl.status === 'tentative' && <span className="tag tag-gold">TENTATIVE</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Shortlist */}
                    <div className="card-sm" style={{ padding: 24 }}>
                      <div className="card-header">
                        <div className="card-title">
                          <span style={{ color: '#d97706' }}>★</span> My Shortlist
                        </div>
                        {hasEditTab && <button className="card-action" onClick={() => setActiveTab(dash.shortlistEditTab)}>Edit List</button>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {shortlist.length === 0 ? (
                          <div className="empty-state">No colleges shortlisted yet.</div>
                        ) : shortlist.slice(0, 5).map((name, i) => (
                          <div key={i} className="shortlist-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className={`shortlist-icon tag ${iconColors[i % iconColors.length]}`}
                                style={{ background: undefined, border: undefined }}>{dash.shortlistIcon}</div>
                              <span className="shortlist-name">{name}</span>
                            </div>
                            <button onClick={() => handleToggleShortlist(name)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-300)', fontSize: 16, lineHeight: 1, padding: 4 }}>✕</button>
                          </div>
                        ))}
                        {shortlist.length > 5 && (
                          <div style={{ fontSize: 12, color: 'var(--text-400)', textAlign: 'center', padding: '8px 0' }}>
                            +{shortlist.length - 5} more colleges
                          </div>
                        )}
                        {hasEditTab && <button onClick={() => setActiveTab(dash.shortlistEditTab)}
                          style={{ width: '100%', marginTop: 4, padding: '10px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-400)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          + Add More Colleges
                        </button>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="dash-col-right">

                  {/* Advisor Card */}
                  <section className="advisor-card">
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 20 }}>My Personal Advisor</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div className="advisor-avatar">{counsellorInitials}</div>
                      <div>
                        <div className="advisor-name">{counsellorName}</div>
                        <div className="advisor-branch">📍 {counsellorBranch}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
                      <a href={`tel:${counsellorWhatsapp && counsellorWhatsapp.trim() ? counsellorWhatsapp.replace(/\D/g, '') : '7410019077'}`} className="btn-whatsapp">
                        📞 Call the Advisor
                      </a>
                      {whatsappGroupLink && whatsappGroupLink.trim() !== '' && (
                        <a href={whatsappGroupLink} target="_blank" rel="noreferrer" className="btn-outline-navy">
                          💬 Ask in Group
                        </a>
                      )}
                    </div>
                  </section>

                  {/* Document Status */}
                  {allIds.length > 0 && (
                  <div className="card-sm" style={{ padding: 24 }}>
                    <div className="card-header">
                      <div className="card-title">Document Status</div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: 'var(--navy)',
                        background: 'var(--primary-bg)', border: '1px solid var(--primary-border)',
                        padding: '3px 8px', borderRadius: 4, letterSpacing: 0.4
                      }}>
                        {doneCount}/{allIds.length} DONE
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {sectionsToRender[0]?.docs.slice(0, 4).map(doc => {
                        const done = checkedDocs.has(doc.id);
                        return (
                          <div key={doc.id} onClick={() => toggleDoc(doc.id)}
                            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                            <div style={{
                              marginTop: 2, width: 20, height: 20, borderRadius: '50%',
                              background: done ? '#22c55e' : 'transparent',
                              border: done ? 'none' : '2px solid var(--border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'white', fontSize: 10, fontWeight: 900, flexShrink: 0
                            }}>
                              {done ? '✓' : ''}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: done ? 'var(--text-900)' : 'var(--text-400)' }}>
                                {doc.label}
                              </div>
                              {!done && doc.id === dash.actionRequiredDocId && (
                                <div style={{ fontSize: 10, color: 'var(--reach-color)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                                  Action Required
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {hasChecklist && <button onClick={() => setActiveTab('checklist')}
                      style={{ width: '100%', marginTop: 20, padding: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-500)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                      onMouseOver={e => e.target.style.background = 'var(--bg-subtle)'}
                      onMouseOut={e => e.target.style.background = 'transparent'}
                    >
                      View Full Checklist →
                    </button>}
                  </div>
                  )}


                </div>
              </div>
  );
}
