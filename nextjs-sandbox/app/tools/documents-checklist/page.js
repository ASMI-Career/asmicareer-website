'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import './checklist.css';

const DOCS = {
  sections: [
    {
      title: 'Academic Documents',
      docs: [
        { id: 'neet-admit',   label: 'NEET 2025 Admit Card',                             copies: 'Original + 2 self-attested photocopies' },
        { id: 'neet-score',   label: 'NEET 2025 Scorecard / Rank Letter',                copies: 'Original + 2 self-attested photocopies' },
        { id: 'cls10-mark',   label: 'Class 10 Marksheet',                               copies: 'Original + 3 attested photocopies',      note: 'Required as date of birth proof' },
        { id: 'cls10-cert',   label: 'Class 10 Passing Certificate',                     copies: 'Original + 3 attested photocopies' },
        { id: 'cls12-mark',   label: 'Class 12 Marksheet',                               copies: 'Original + 3 attested photocopies' },
        { id: 'cls12-cert',   label: 'Class 12 Passing Certificate / School Leaving',    copies: 'Original + 3 attested photocopies' },
      ]
    },
    {
      title: 'Identity & Address Proof',
      docs: [
        { id: 'aadhar-self',   label: 'Aadhaar Card — Student', copies: 'Original + 3 self-attested photocopies' },
        { id: 'aadhar-father', label: 'Aadhaar Card — Father',  copies: 'Original + 2 self-attested photocopies' },
        { id: 'aadhar-mother', label: 'Aadhaar Card — Mother',  copies: 'Original + 2 self-attested photocopies' },
        { id: 'photos',        label: 'Passport-size Photographs', copies: '10–15 recent, white background', note: 'Same set as used in NEET 2025 application form' },
      ]
    },
    {
      title: 'School / College Certificates',
      docs: [
        { id: 'tc',        label: 'Transfer Certificate (TC)',  copies: 'Original + 2 attested photocopies' },
        { id: 'migration', label: 'Migration Certificate',      copies: 'Original + 1 photocopy', note: 'Required if schooling was outside Maharashtra' },
        { id: 'character', label: 'Character Certificate',      copies: 'Original (from last institution)' },
      ]
    },
    {
      title: 'Medical Certificate',
      docs: [
        { id: 'medical-fit', label: 'Medical Fitness Certificate', copies: "Original on doctor's letterhead", note: 'From a registered MBBS doctor; some colleges issue their own format at reporting' },
      ]
    },
  ],
  category: {
    OBC: {
      title: 'OBC Category Documents',
      docs: [
        { id: 'obc-cert', label: 'OBC Certificate',                    copies: 'Original + 2 attested photocopies', note: 'Central format for AIQ; state government format for State Quota' },
        { id: 'ncl-cert', label: 'Non-Creamy Layer (NCL) Certificate', copies: 'Original + 2 attested photocopies', note: 'Must be issued within the last 1 year; annual family income below ₹8 lakh' },
      ]
    },
    SC: {
      title: 'SC Category Documents',
      docs: [
        { id: 'caste-sc',    label: 'Caste Certificate (SC)',   copies: 'Original + 2 attested photocopies' },
        { id: 'validity-sc', label: 'Caste Validity Certificate', copies: 'Original + 1 photocopy', note: 'Maharashtra: issued by District Caste Scrutiny Committee' },
      ]
    },
    ST: {
      title: 'ST Category Documents',
      docs: [
        { id: 'tribe-st',    label: 'Tribe Certificate (ST)',    copies: 'Original + 2 attested photocopies' },
        { id: 'validity-st', label: 'Tribe Validity Certificate', copies: 'Original + 1 photocopy', note: 'Maharashtra: issued by District Caste Scrutiny Committee' },
      ]
    },
    EWS: {
      title: 'EWS Category Documents',
      docs: [
        { id: 'ews-cert',    label: 'EWS Certificate',   copies: 'Original + 2 attested photocopies', note: 'Current financial year; issued by Tehsildar or Sub-Divisional Officer' },
        { id: 'income-cert', label: 'Income Certificate', copies: 'Original + 1 photocopy',            note: 'Annual family income below ₹8 lakh' },
      ]
    },
  },
  quota: {
    AIQ: {
      title: 'All India Quota (AIQ) Documents',
      docs: [
        { id: 'mcc-reg',       label: 'MCC Registration Printout',   copies: '2 photocopies',              note: 'Print from the MCC NEET UG 2025 counselling portal' },
        { id: 'mcc-allotment', label: 'AIQ Seat Allotment Letter',   copies: 'Original + 2 photocopies',   note: 'Download from MCC portal after seat allotment round' },
      ]
    },
    State: {
      title: 'State Quota (Maharashtra) Documents',
      docs: [
        { id: 'domicile', label: 'Maharashtra Domicile / Nativity Certificate', copies: 'Original + 2 attested photocopies', note: 'Issued by Tehsildar or SDO; family requires 15+ years Maharashtra residence' },
      ]
    },
    Management: {
      title: 'Management / NRI Quota Documents',
      docs: [
        { id: 'mgmt-allotment', label: 'Management / NRI Seat Allotment Letter', copies: 'Original + 2 photocopies', note: 'From college trust or state management quota authority' },
        { id: 'fee-receipt',    label: 'Fee Payment Receipt',                    copies: '2 photocopies',             note: 'If partial fee was collected at time of allotment' },
      ]
    },
  }
};

export default function DocumentChecklistPage() {
  const [checkedDocs, setCheckedDocs] = useState(new Set());
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [selectedQuota, setSelectedQuota] = useState('State');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const saved = JSON.parse(localStorage.getItem('asmi-checklist') || '{}');
      if (saved.checked) setCheckedDocs(new Set(saved.checked));
      if (saved.category) setSelectedCategory(saved.category);
      if (saved.quota) setSelectedQuota(saved.quota);
    } catch(e) {}
  }, []);

  const saveState = (checked, cat, quota) => {
    try {
      localStorage.setItem('asmi-checklist', JSON.stringify({
        checked: [...checked],
        category: cat,
        quota: quota
      }));
    } catch(e) {}
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    saveState(checkedDocs, cat, selectedQuota);
  };

  const handleQuotaChange = (quota) => {
    setSelectedQuota(quota);
    saveState(checkedDocs, selectedCategory, quota);
  };

  const toggleDoc = (id) => {
    const newChecked = new Set(checkedDocs);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedDocs(newChecked);
    saveState(newChecked, selectedCategory, selectedQuota);
  };

  const resetChecklist = () => {
    if (confirm('Clear all checkmarks and start fresh?')) {
      const empty = new Set();
      setCheckedDocs(empty);
      saveState(empty, selectedCategory, selectedQuota);
    }
  };

  if (!isClient) return null;

  const sectionsToRender = [
    ...DOCS.sections,
    ...(selectedCategory !== 'General' && DOCS.category[selectedCategory] ? [DOCS.category[selectedCategory]] : []),
    ...(DOCS.quota[selectedQuota] ? [DOCS.quota[selectedQuota]] : []),
  ];

  const allIds = sectionsToRender.flatMap(s => s.docs.map(d => d.id));
  const doneCount = allIds.filter(id => checkedDocs.has(id)).length;
  const pct = allIds.length ? Math.round((doneCount / allIds.length) * 100) : 0;

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
            Select your category and quota — get a personalised list of every certificate you need, how many copies, and what needs attestation. Print it and walk in prepared.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/inquiry" className="btn-gold">
              Get Expert Guidance <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="dc-container">
        
        {/* Profile Selector */}
        <div className="profile-card">
          <div className="mb-4">
            <div className="profile-label">Your Category</div>
            <div className="chip-row">
              {['General', 'OBC', 'SC', 'ST', 'EWS'].map(cat => (
                <div 
                  key={cat} 
                  className={`chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat === 'General' ? 'General / UR' : cat === 'OBC' ? 'OBC (Non-Creamy Layer)' : cat}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="profile-label">Quota Type</div>
            <div className="chip-row">
              {['State', 'AIQ', 'Management'].map(q => (
                <div 
                  key={q} 
                  className={`chip ${selectedQuota === q ? 'active' : ''}`}
                  onClick={() => handleQuotaChange(q)}
                >
                  {q === 'State' ? 'State Quota (Maharashtra)' : q === 'AIQ' ? 'All India Quota (AIQ)' : 'Management / NRI'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="progress-card">
          <span className="material-symbols-outlined" style={{ color: '#7b41b3', fontSize: '18px' }}>checklist</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${pct}%` }}></div>
          </div>
          <div className="progress-label">{doneCount} of {allIds.length} ready</div>
        </div>

        {/* Callout */}
        <div className="callout">
          <span className="material-symbols-outlined" style={{ color: '#7b41b3', fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>info</span>
          <p><strong>Attestation tip:</strong> &quot;Self-attested&quot; means you sign and write &quot;True Copy&quot; on the photocopy yourself. &quot;Attested copy&quot; means a gazetted officer, notary, or school principal signs it. Always carry a few extra copies — colleges often ask for more than listed.</p>
        </div>

        {/* Checklist */}
        <div>
          {sectionsToRender.map((section, idx) => (
            <div key={idx} className="doc-section">
              <div className="section-label">{section.title}</div>
              <div className="doc-list">
                {section.docs.map(doc => (
                  <div 
                    key={doc.id}
                    className={`doc-item ${checkedDocs.has(doc.id) ? 'checked' : ''}`}
                    role="checkbox"
                    aria-checked={checkedDocs.has(doc.id)}
                    tabIndex="0"
                    onClick={() => toggleDoc(doc.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleDoc(doc.id);
                      }
                    }}
                  >
                    <div className="doc-check">
                      <span className="material-symbols-outlined check-icon">check</span>
                    </div>
                    <div>
                      <div className="doc-label">{doc.label}</div>
                      <div className="doc-copies">{doc.copies}</div>
                      {doc.note && <div className="doc-note">{doc.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="action-row">
          <button className="btn-secondary" onClick={() => window.print()}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>print</span> Print Checklist
          </button>
          <button className="btn-secondary btn-danger" onClick={resetChecklist}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restart_alt</span> Reset
          </button>
          <Link href="/inquiry" className="btn-gold ml-auto hidden sm:inline-flex" style={{ fontSize: '0.875rem' }}>
            Talk to a Counsellor <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
          </Link>
        </div>

        {/* Other Tools */}
        <div className="other-tools-section">
          <div className="other-tool-label">Explore Other Tools</div>
          <div className="other-tool-grid">
            <Link href="/resources" className="other-tool">
              <span className="other-tool-icon">📚</span>
              <div>
                <div className="other-tool-title">Resources Hub</div>
                <div className="other-tool-desc">View all free guides and PDFs</div>
              </div>
            </Link>
            <Link href="/medical#events" className="other-tool">
              <span className="other-tool-icon">🎓</span>
              <div>
                <div className="other-tool-title">Events &amp; Seminars</div>
                <div className="other-tool-desc">Free counselling seminars</div>
              </div>
            </Link>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}
