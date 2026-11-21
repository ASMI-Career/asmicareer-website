
import { useState } from 'react';
import { DOC_SETS } from '../hooks/useDocuments';
import { buildDocumentSections, docProgress } from '../lib/docGroups';
import { resolveExamIds } from '../lib/exams';

export default function Documents(props) {
  const { config, studentTracks, checkedDocs, docCategory, docQuota, saveChecklist, setCheckedDocs, setDocQuota, toggleDoc } = props;
  // Engineering (config.exams): the list is split by exam / counselling group. The chosen chip is component state only (not saved).
  const [view, setView] = useState(null);   // null = the default view: "My exams" for a student with tracks, otherwise All
  const grouped = !!config.exams;
  const built = grouped ? buildDocumentSections({ DOCS: DOC_SETS[config.documents.data], config, docCategory, docQuota, studentTracks, view }) : null;
  const sectionsToRender = grouped ? built.sections : props.sectionsToRender;
  const allIds = grouped ? built.allIds : props.allIds;
  const { doneCount, pct } = grouped ? docProgress(built.allIds, checkedDocs) : props;
  const mine = grouped ? resolveExamIds(studentTracks, config) : [];


  const docCfg = config.documents;

  return (
              <div className="tool-card">
                <h2 className="section-title">📋 Documents Checklist</h2>
                <p className="section-sub">{docCfg.subtitle}</p>

                {/* Quota selector only — category is fixed from token */}
                {docCfg.quotas.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div className="form-label" style={{ marginBottom: 8 }}>{docCfg.quotaLabel}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {docCfg.quotas.map(({ value: q, label }) => (
                      <button key={q} className={`chip ${docQuota === q ? 'active' : ''}`}
                        onClick={() => { setDocQuota(q); saveChecklist(checkedDocs, docCategory, q); }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                )}

                {/* Exam / counselling groups (engineering) */}
                {grouped && (
                  <div className="dg-wrap">
                    <div className="dg-chips" role="group" aria-label="Exam or counselling">
                      <button type="button" className={`chip ${view === null ? 'active' : ''}`} aria-pressed={view === null} onClick={() => setView(null)}>{mine.length ? 'My exams' : 'All'}</button>
                      {mine.length > 0 && <button type="button" className={`chip ${view === 'all' ? 'active' : ''}`} aria-pressed={view === 'all'} onClick={() => setView('all')}>All</button>}
                      {config.exams.map(e => (
                        <button key={e.id} type="button" className={`chip ${view === e.id ? 'active' : ''}`} aria-pressed={view === e.id} onClick={() => setView(e.id)}>
                          {e.label}{mine.includes(e.id) && <span className="dg-own" title="One of your exams" aria-label="your exam"> ★</span>}
                        </button>))}
                    </div>
                    {built.notes.map(n => <div key={n.id} className="dg-note" role="status">{n.text}</div>)}
                  </div>
                )}

                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                  <div className="progress-bar-track" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-500)', whiteSpace: 'nowrap' }}>
                    {doneCount} / {allIds.length} ready ({pct}%)
                  </span>
                </div>

                {/* Tip */}
                <div className="tip-callout" style={{ marginBottom: 24 }}>
                  <strong>💡 Attestation tip:</strong> &quot;Self-attested&quot; means you sign and write &quot;True Copy&quot; on the photocopy yourself. &quot;Attested copy&quot; means a gazetted officer, notary, or school principal signs it. Always carry a few extra copies.
                </div>

                {/* Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sectionsToRender.map((section, idx) => (
                    <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                      <div style={{ background: 'var(--bg-subtle)', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
                        <div className="doc-section-title">{section.title}</div>
                      </div>
                      <div>
                        {section.docs.map(doc => {
                          const isChecked = checkedDocs.has(doc.id);
                          return (
                            <div key={doc.id} onClick={() => toggleDoc(doc.id)}
                              className={`doc-item ${isChecked ? 'checked' : ''}`}
                              style={{ borderBottom: '1px solid var(--border)' }}>
                              <div className="doc-checkbox">{isChecked ? '✓' : ''}</div>
                              <div style={{ flex: 1 }}>
                                <div className="doc-label">{doc.label}</div>
                                <div className="doc-copies">{doc.copies}</div>
                                {doc.note && <div className="doc-note">{doc.note}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                  <button onClick={() => window.print()} className="chip">🖨️ Print Checklist</button>
                  <button onClick={() => {
                    if (confirm('Clear all checkmarks and start fresh?')) {
                      const empty = new Set();
                      setCheckedDocs(empty);
                      saveChecklist(empty, docCategory, docQuota);
                    }
                  }} className="chip" style={{ color: 'var(--reach-color)', borderColor: 'var(--reach-border)' }}>
                    🔄 Reset Checklist
                  </button>
                </div>
              </div>
  );
}
