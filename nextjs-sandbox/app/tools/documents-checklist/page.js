'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import { buildDocumentList } from '../../../lib/buildDocumentList';
import './checklist.css';

const STEPS = [
  {
    id: 'quota',
    question: 'Which counselling are you preparing for?',
    options: [
      { label: 'MH State Quota', value: 'mh' },
      { label: 'MCC / All India Quota', value: 'aiq' },
      { label: 'Open State Quota', value: 'open_state' },
      { label: 'NRI / Management', value: 'nri' },
    ],
  },
  {
    id: 'category',
    question: 'What is your reservation category?',
    options: [
      { label: 'General / UR', value: 'general' },
      { label: 'OBC', value: 'obc' },
      { label: 'SEBC', value: 'sebc' },
      { label: 'VJ / NT / SBC', value: 'vj_nt_sbc' },
      { label: 'SC', value: 'sc' },
      { label: 'ST', value: 'st' },
      { label: 'EWS', value: 'ews' },
    ],
  },
  {
    id: 'additional',
    question: 'Any additional reservation?',
    options: [
      { label: 'None', value: 'none' },
      { label: 'Defence — D1', value: 'defence_d1' },
      { label: 'Defence — D2', value: 'defence_d2' },
      { label: 'Defence — D3', value: 'defence_d3' },
      { label: 'Hilly Area', value: 'hilly' },
      { label: 'PWD', value: 'pwd' },
    ],
  },
  {
    id: 'attempt',
    question: 'Is this your first NEET attempt?',
    options: [
      { label: 'Yes — first attempt', value: 'false' },
      { label: 'No — dropper / repeater', value: 'true' },
    ],
  },
  {
    id: 'minority',
    question: 'Applying under any minority quota?',
    options: [
      { label: 'No', value: 'none' },
      { label: 'Jain', value: 'minority_jain' },
      { label: 'Muslim', value: 'minority_muslim' },
      { label: 'Christian', value: 'minority_christian' },
      { label: 'Hindi (Linguistic)', value: 'minority_hindi' },
    ],
  },
];

const CHIP_LABELS = {
  quota: { mh: 'MH State Quota', aiq: 'MCC / All India Quota', open_state: 'Open State Quota', nri: 'NRI / Management' },
  category: { general: 'General / UR', obc: 'OBC', sebc: 'SEBC', vj_nt_sbc: 'VJ / NT / SBC', sc: 'SC', st: 'ST', ews: 'EWS' },
  additional: { none: 'No Add. Reservation', defence_d1: 'Defence D1', defence_d2: 'Defence D2', defence_d3: 'Defence D3', hilly: 'Hilly Area', pwd: 'PWD' },
  attempt: { false: 'Fresher', true: 'Repeater' },
  minority: { none: 'No Minority', minority_jain: 'Jain Minority', minority_muslim: 'Muslim Minority', minority_christian: 'Christian Minority', minority_hindi: 'Hindi Linguistic' },
};

export default function DocumentChecklistPage() {
  const [step, setStep] = useState(0); // 0-4 = wizard steps, 5 = checklist
  const [selections, setSelections] = useState({});
  const [checked, setChecked] = useState(new Set());

  const handleSelect = useCallback((stepId, value) => {
    const newSelections = { ...selections, [stepId]: value };
    // Clear later selections when going back
    setSelections(newSelections);
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Step 5 (minority) done — show checklist
      setStep(5);
      setChecked(new Set());
    }
  }, [selections, step]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      // Clear current step's selection
      const stepId = STEPS[step].id;
      const newSel = { ...selections };
      delete newSel[stepId];
      setSelections(newSel);
      setStep(step - 1);
    }
  }, [step, selections]);

  const handleStartOver = useCallback(() => {
    setSelections({});
    setStep(0);
    setChecked(new Set());
  }, []);

  const toggleDoc = useCallback((id) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Build checklist when on step 5
  let checklistData = null;
  if (step === 5) {
    checklistData = buildDocumentList({
      quota: selections.quota,
      category: selections.category,
      additional: selections.additional,
      isRepeater: selections.attempt === 'true',
      minority: selections.minority,
    });
  }

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#f6f5f9]">
      <Nav />

      {/* HERO */}
      <div className="dc-hero">
        <div className="dc-hero-bg"></div>
        <div className="dc-hero-inner">
          <Link href="/resources" className="inline-flex items-center gap-1.5 text-xs font-semibold mb-5 text-white/50 hover:text-white transition-colors" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_back</span> All Resources
          </Link>
          <br />
          <div className="dc-badge">Free Tool</div>
          <h1 className="dc-h1">Your Complete Documents Checklist</h1>
          <p className="dc-sub">
            Answer 5 quick questions — get a personalised list of every document you need, how many copies, and what needs attestation. Print it and walk in prepared.
          </p>
        </div>
      </div>

      <div className="dc-container">

        {step < 5 ? (
          /* ── WIZARD ── */
          <div className="wizard-card">
            {/* Step indicator */}
            <div className="step-indicator">
              {STEPS.map((s, i) => (
                <div key={s.id} className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
              ))}
            </div>

            <div className="step-counter">Step {step + 1} of {STEPS.length}</div>
            <div className="step-question">{STEPS[step].question}</div>

            <div className="step-options">
              {STEPS[step].options.map(opt => (
                <button
                  key={opt.value}
                  className="step-option"
                  onClick={() => handleSelect(STEPS[step].id, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {step > 0 && (
              <button className="step-back" onClick={handleBack}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
                Back
              </button>
            )}
          </div>
        ) : (
          /* ── CHECKLIST ── */
          <>
            {/* Profile summary bar */}
            <div className="profile-summary no-print">
              {Object.entries(selections).map(([key, val]) => (
                <span key={key} className="profile-chip">{CHIP_LABELS[key]?.[val] ?? val}</span>
              ))}
              <button className="start-over-link" onClick={handleStartOver}>Start over</button>
            </div>

            {/* Print-only profile summary */}
            <div className="print-only print-profile">
              {Object.entries(selections).map(([key, val]) => (
                <span key={key} className="print-chip">{CHIP_LABELS[key]?.[val] ?? val}</span>
              ))}
            </div>

            {/* Progress counter */}
            <div className="progress-card no-print">
              <span className="material-symbols-outlined" style={{ color: '#7b41b3', fontSize: '18px' }}>checklist</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: checklistData.total ? `${Math.round((checked.size / checklistData.total) * 100)}%` : '0%' }}></div>
              </div>
              <div className="progress-label">{checked.size} of {checklistData.total} ready</div>
            </div>

            {/* Checklist groups */}
            {Object.entries(checklistData.groups).map(([groupName, items]) => (
              <div key={groupName} className="doc-section">
                <div className="section-label">{groupName}</div>
                <div className="doc-list">
                  {items.map(doc => (
                    <div
                      key={doc.id + '_' + groupName}
                      className={`doc-item ${checked.has(doc.id) ? 'checked' : ''}`}
                      role="checkbox"
                      aria-checked={checked.has(doc.id)}
                      tabIndex="0"
                      onClick={() => toggleDoc(doc.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDoc(doc.id); }
                      }}
                    >
                      <div className="doc-check">
                        <span className="material-symbols-outlined check-icon">check</span>
                      </div>
                      <div className="doc-content">
                        <div className="doc-label">{doc.name}</div>
                        <div className="doc-copies">{doc.copies}</div>
                        {doc.note && <div className="doc-note">{doc.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="action-row no-print">
              <button className="btn-secondary" onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span> Print Checklist
              </button>
            </div>

            {/* Registered user CTA */}
            <div className="student-cta no-print">
              ASMI students — <Link href="/student">log in to track your document submission status →</Link>
            </div>

            {/* Print footer */}
            <div className="print-only print-footer">
              asmicareer.in &nbsp;|&nbsp; Generated {today}
            </div>
          </>
        )}

      </div>

      <Footer />
    </div>
  );
}
