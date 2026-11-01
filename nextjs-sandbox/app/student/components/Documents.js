
export default function Documents(props) {
  const { config, allIds, checkedDocs, docCategory, docQuota, doneCount, pct, saveChecklist, sectionsToRender, setCheckedDocs, setDocQuota, toggleDoc } = props;


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
