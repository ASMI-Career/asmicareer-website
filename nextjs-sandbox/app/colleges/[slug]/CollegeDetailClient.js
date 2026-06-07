'use client';

import { useState } from 'react';
import './college.css';

export default function CollegeDetailClient({ college, slug }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSaved, setIsSaved] = useState(false);

  // Helper to extract initials for college logo placeholder
  const getInitials = (name) => {
    if (!name) return 'C';
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Standard NEET UG Documents List
  const docList = [
    'NEET UG Admit Card & Scorecard',
    'Class 10 Marksheet and Passing Certificate',
    'Class 12 Marksheet and Passing Certificate',
    'Category Certificate (OBC/SC/ST/EWS if applicable)',
    'Transfer / Migration Certificate',
    'Character Certificate & Domicile Certificate',
    'Provisional Allotment Letter',
    'Passport size photographs (8-10 copies)',
    'Valid Identity Proof (Aadhar Card, PAN Card, passport, etc.)'
  ];

  // Not Found State
  if (!college) {
    return (
      <div className="college-page not-found-page">
        <div className="not-found-container">
          <h2>College Not Found</h2>
          <p>We couldn't find a college matching the slug "<strong>{slug}</strong>".</p>
          <a href="/colleges" className="back-btn">
            ← Return to Directory
          </a>
        </div>
      </div>
    );
  }

  const hasPhoto = college.photo !== null;
  const initials = getInitials(college.name);

  return (
    <div className="college-page">
      
      {/* 1. HEADER BANNER */}
      <div
        className="detail-banner"
        style={
          hasPhoto
            ? { backgroundImage: `url(/images/colleges/${college.slug}.jpg)` }
            : { background: college.photo_placeholder_color || 'linear-gradient(135deg, #1a0040, #6a0dad)' }
        }
      >
        <div className="detail-banner-overlay"></div>
      </div>

      <div className="detail-container">
        
        {/* 2. HEADER CARD */}
        <div className="detail-header-card">
          <div
            className="detail-logo"
            style={{ background: college.photo_placeholder_color || '#1a0040' }}
          >
            {initials}
          </div>

          <div className="detail-header-content">
            <h1 className="detail-name">{college.name}</h1>
            <div className="detail-pills">
              {college.city && <span className="detail-pill">📍 {college.city}</span>}
              {college.state && <span className="detail-pill">🏛️ {college.state}</span>}
              <span className="detail-pill">🎓 {college.type}</span>
              <span className="detail-pill">📖 {college.course || 'MBBS'}</span>
              {college.asmi_recommended && (
                <span className="detail-pill recommend">★ ASMI RECOMMENDS</span>
              )}
            </div>
          </div>
        </div>

        {/* 3. STAT STRIP */}
        <div className="detail-stat-strip">
          <div className="detail-stat-col">
            <span className="detail-stat-val">{college.seats || '—'}</span>
            <span className="detail-stat-lbl">MBBS Seats</span>
          </div>
          <div className="detail-stat-col">
            <span className="detail-stat-val">{college.hospital_beds || '—'}</span>
            <span className="detail-stat-lbl">Hospital Beds</span>
          </div>
          <div className="detail-stat-col">
            <span className="detail-stat-val">{college.nirf_rank || '—'}</span>
            <span className="detail-stat-lbl">NIRF Rank</span>
          </div>
          <div className="detail-stat-col">
            <span className="detail-stat-val">{college.established_year || '—'}</span>
            <span className="detail-stat-lbl">Established</span>
          </div>
        </div>

        {/* 4. CTA BAR */}
        <div className="detail-cta-bar">
          <a href="/inquiry" className="detail-cta-primary">
            Talk to ASMI Experts →
          </a>
          {college.website ? (
            <a
              href={college.website}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-cta-secondary"
            >
              College Website ↗
            </a>
          ) : (
            <button className="detail-cta-secondary disabled" disabled>
              Website Unavailable
            </button>
          )}
        </div>

        {/* 5. STICKY TABS */}
        <div className="detail-tabs-wrapper">
          <div className="detail-tabs" role="tablist">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'fees', label: 'Fees & Seats' },
              { id: 'admissions', label: 'Admissions' },
              { id: 'cutoffs', label: 'Cut-offs' },
              { id: 'clinical', label: 'Clinical Info' },
              { id: 'contact', label: 'Contact' },
              { id: 'gallery', label: 'Gallery' },
              { id: 'reviews', label: 'Reviews' },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`detail-tab${activeTab === tab.id ? ' active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. TAB CONTENT PANELS */}
        <div className="detail-tab-content">
          
          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div className="detail-panel">
              <div className="panel-grid">
                <div className="panel-left">
                  <h3 className="section-title">About College</h3>
                  <p className="panel-desc">
                    {college.description ||
                      'Detailed information about this college is being compiled by the ASMI research team. Check back soon.'}
                  </p>

                  <h3 className="section-title" style={{ marginTop: '30px' }}>Key Highlights</h3>
                  <div className="highlights-grid">
                    <div className="highlight-card">
                      <div className="highlight-icon">🏆</div>
                      <div className="highlight-body">
                        <div className="highlight-lbl">NIRF Ranking</div>
                        <div className="highlight-val">{college.nirf_rank ? `#${college.nirf_rank}` : '—'}</div>
                      </div>
                    </div>
                    <div className="highlight-card">
                      <div className="highlight-icon">🎒</div>
                      <div className="highlight-body">
                        <div className="highlight-lbl">Total Intake</div>
                        <div className="highlight-val">{college.seats ? `${college.seats} Seats` : '—'}</div>
                      </div>
                    </div>
                    <div className="highlight-card">
                      <div className="highlight-icon">🏥</div>
                      <div className="highlight-body">
                        <div className="highlight-lbl">Hospital Beds</div>
                        <div className="highlight-val">{college.hospital_beds ? `${college.hospital_beds}+ Beds` : '—'}</div>
                      </div>
                    </div>
                    <div className="highlight-card">
                      <div className="highlight-icon">📆</div>
                      <div className="highlight-body">
                        <div className="highlight-lbl">Established Year</div>
                        <div className="highlight-val">{college.established_year || '—'}</div>
                      </div>
                    </div>
                  </div>

                  <h3 className="section-title" style={{ marginTop: '30px' }}>Location &amp; Access</h3>
                  <div className="location-card">
                    <p className="location-address">
                      <strong>Address:</strong> {college.address || 'Address information coming soon'}
                    </p>
                    <div className="map-placeholder">
                      <div className="map-icon">🗺️</div>
                      <span>Map visualization coming soon. Our counsellors can help plan your travel route.</span>
                    </div>
                  </div>
                </div>

                <div className="panel-right">
                  {/* ASMI Pulse Score */}
                  <div className="pulse-card">
                    <h4 className="pulse-title">ASMI Pulse Score</h4>
                    {college.asmi_pulse_score ? (
                      <div className="pulse-content">
                        <div className="pulse-score-row">
                          <span className="pulse-score-val">{college.asmi_pulse_score}</span>
                          <span className="pulse-score-max">/5</span>
                        </div>
                        <div className="pulse-bars">
                          {[
                            { name: 'Clinical Exposure', score: college.asmi_pulse_score },
                            { name: 'Infrastructure', score: Math.max(2.0, (college.asmi_pulse_score - 0.3).toFixed(1)) },
                            { name: 'Teaching Quality', score: Math.min(5.0, (college.asmi_pulse_score + 0.1).toFixed(1)) },
                            { name: 'Hospital Reputation', score: college.asmi_pulse_score },
                            { name: 'Hostel & Campus Life', score: Math.max(2.0, (college.asmi_pulse_score - 0.2).toFixed(1)) },
                          ].map((bar) => {
                            const percentage = (bar.score / 5) * 100;
                            return (
                              <div className="pulse-bar-item" key={bar.name}>
                                <div className="pulse-bar-lbl">
                                  <span>{bar.name}</span>
                                  <span>{bar.score}/5</span>
                                </div>
                                <div className="pulse-progress-track">
                                  <div className="pulse-progress-fill" style={{ width: `${percentage}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="pulse-placeholder">
                        <p>ASMI Pulse Score for this college is being researched. Our team visits colleges personally before rating them.</p>
                      </div>
                    )}
                  </div>

                  {/* Sticky Counselling Helper Widget */}
                  <div className="helper-widget">
                    <h5>Need Counselling Help?</h5>
                    <p>Unlock custom preference orders, budget analytics, and category cutoffs with ASMI experts.</p>
                    <a href="/inquiry" className="helper-btn">
                      Talk to Experts
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FEES & SEATS PANEL */}
          {activeTab === 'fees' && (
            <div className="detail-panel">
              <h3 className="section-title">Fee Structure &amp; Seat Details</h3>
              <table className="detail-table">
                <thead>
                  <tr>
                    <th>Particulars</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Intake Capability (MBBS)</td>
                    <td>{college.seats ? `${college.seats} Seats` : '—'}</td>
                  </tr>
                  <tr>
                    <td>Annual Tuition Fees</td>
                    <td>
                      {college.annual_fees
                        ? `₹${college.annual_fees.toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Compulsory Bond &amp; Stipend</h3>
              <table className="detail-table">
                <tbody>
                  <tr>
                    <td>Compulsory Bond Service Years</td>
                    <td>{college.bond_years !== null ? `${college.bond_years} Years` : '—'}</td>
                  </tr>
                  <tr>
                    <td>Bond Penalty Amount</td>
                    <td>
                      {college.bond_penalty
                        ? `₹${college.bond_penalty.toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Hostel Accommodations</h3>
              <div className="hostel-card">
                <div className="hostel-icon">🏨</div>
                <div className="hostel-body">
                  <span className="hostel-title-txt">Hostel Rooms Available</span>
                  <p className="hostel-status-desc">
                    {college.hostel_available || 'Information coming soon'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ADMISSIONS PANEL */}
          {activeTab === 'admissions' && (
            <div className="detail-panel">
              <h3 className="section-title">NEET UG Eligibility Criteria</h3>
              <div className="eligibility-content">
                <p>
                  To secure admission under open, category, state, or management quotas in this college, the candidate must satisfy the following:
                </p>
                <ul>
                  <li><strong>Academic Qualification:</strong> Must have passed 10+2 (Higher Secondary) or equivalent exam with Physics, Chemistry, Biology/Biotechnology, and English as core subjects, obtaining at least 50% aggregate marks (40% for SC/ST/OBC and 45% for Gen-PH).</li>
                  <li><strong>Age limit:</strong> Candidate must be at least 17 years old by December 31st of the admission year. No upper age limit.</li>
                  <li><strong>Entrance Exam:</strong> Must qualify the NEET UG (National Eligibility cum Entrance Test) with marks above the minimum qualifying percentile.</li>
                </ul>
              </div>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Admission Procedure</h3>
              <div className="admission-steps">
                {[
                  { step: 1, title: 'NEET Qualification', desc: 'Secure qualifying score in the NEET UG national entrance exam.' },
                  { step: 2, title: 'Counsellor Registration', desc: 'Register on the MCC official portal (for All India Quota) or corresponding State DME portal (for State Quota).' },
                  { step: 3, title: 'Choice Filling & Lock', desc: 'Fill the preferred college preferences. Lock your preferences prior to DME schedules.' },
                  { step: 4, title: 'Seat Allocation', desc: 'DME allocates seats based on merit ranks, choices, and category seat matrices.' },
                  { step: 5, title: 'Document Verification & Fee Pay', desc: 'Physically report to the college with allotment letters, pay tuition fees, verify original files, and join.' },
                ].map((s) => (
                  <div className="admission-step-item" key={s.step}>
                    <div className="step-num-circle">{s.step}</div>
                    <div className="step-body">
                      <h6>{s.title}</h6>
                      <p>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="section-title" style={{ marginTop: '30px' }}>Required Reporting Documents</h3>
              <div className="docs-content">
                <p>Ensure you bring original copies along with 3 sets of self-attested photocopies of the following:</p>
                <ul className="docs-list">
                  {docList.map((doc, idx) => (
                    <li key={idx}>✅ {doc}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* CUT-OFFS PANEL */}
          {activeTab === 'cutoffs' && (
            <div className="detail-panel">
              <h3 className="section-title">Opening &amp; Closing NEET Cutoffs (2025)</h3>
              
              {college.closing_rank_open ? (
                <div className="cutoff-wrapper">
                  <table className="cutoff-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Opening Rank (2025)</th>
                        <th>Closing Rank (2025)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>General / Open</strong></td>
                        <td>—</td>
                        <td><strong>{college.closing_rank_open}</strong></td>
                      </tr>
                      <tr className="cutoff-row-blurred">
                        <td>OBC</td>
                        <td>12450</td>
                        <td>14580</td>
                      </tr>
                      <tr className="cutoff-row-blurred">
                        <td>EWS</td>
                        <td>13100</td>
                        <td>15200</td>
                      </tr>
                      <tr className="cutoff-row-blurred">
                        <td>SC</td>
                        <td>74000</td>
                        <td>86000</td>
                      </tr>
                      <tr className="cutoff-row-blurred">
                        <td>ST</td>
                        <td>98000</td>
                        <td>115000</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Lock Overlay */}
                  <div className="cutoff-lock-overlay">
                    <div className="lock-content">
                      <div className="lock-icon">🔒</div>
                      <h5>Category-wise Cutoffs Locked</h5>
                      <p>View OBC, EWS, SC, and ST round-by-round allotments. Access comprehensive trend filters with ASMI Premium Counselling.</p>
                      <a href="/inquiry" className="lock-cta-btn">
                        Get Counselling Support
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="cutoff-empty">
                  <p>Cutoff data for this college is being updated.</p>
                </div>
              )}
            </div>
          )}

          {/* CLINICAL INFO PANEL */}
          {activeTab === 'clinical' && (
            <div className="detail-panel">
              <h3 className="section-title">Clinical Exposure &amp; Hospital Infrastructure</h3>
              <table className="detail-table">
                <tbody>
                  <tr>
                    <td>Hospital Bed Capacity</td>
                    <td>{college.hospital_beds ? `${college.hospital_beds}+ Beds` : '—'}</td>
                  </tr>
                  <tr>
                    <td>Average Daily OPD Patients</td>
                    <td>{college.opd_daily || 'Data being compiled'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="clinical-notice">
                <div className="notice-icon">⚠️</div>
                <div className="notice-text">
                  <p><strong>Verification Notice:</strong> Clinical exposure data is being verified by ASMI's research team.</p>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT PANEL */}
          {activeTab === 'contact' && (
            <div className="detail-panel">
              <h3 className="section-title">Official Contact Information</h3>
              <table className="detail-table">
                <tbody>
                  <tr>
                    <td>Phone Numbers</td>
                    <td>{college.contact_phone || 'Contact information coming soon'}</td>
                  </tr>
                  <tr>
                    <td>Official Email Address</td>
                    <td>{college.contact_email || 'Contact information coming soon'}</td>
                  </tr>
                  <tr>
                    <td>Official Website</td>
                    <td>
                      {college.website ? (
                        <a href={college.website} target="_blank" rel="noopener noreferrer" className="contact-link">
                          {college.website}
                        </a>
                      ) : (
                        'Website information coming soon'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* GALLERY PANEL */}
          {activeTab === 'gallery' && (
            <div className="detail-panel">
              <h3 className="section-title">Campus &amp; Hostel Gallery</h3>
              <p className="gallery-notice-txt">Gallery for this college is being compiled.</p>
              <div className="gallery-grid">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div className="gallery-placeholder-card" key={idx}>
                    <div className="gallery-icon-pic">🖼️</div>
                    <span>Photos coming soon</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REVIEWS PANEL */}
          {activeTab === 'reviews' && (
            <div className="detail-panel">
              <h3 className="section-title">Student Reviews &amp; Testimonials</h3>
              <div className="reviews-empty-container">
                <div className="reviews-bubble-icon">💬</div>
                <p className="reviews-empty-text">No reviews yet. Be the first to review after your admission.</p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
