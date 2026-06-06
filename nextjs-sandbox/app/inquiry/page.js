'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InquiryPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    neetScore: '',
    studentContact: '',
    fatherContact: '',
    motherContact: '',
    coachingClass: '',
    city: '',
    category: 'General',
  });
  
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedBudgets, setSelectedBudgets] = useState([]);
  const [source, setSource] = useState('Online');
  const [branchInfo, setBranchInfo] = useState({ phone: 'Loading...', address: 'Loading details...' });
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState('---');
  const [errorMsg, setErrorMsg] = useState(null);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  const branchDetails = {
    'andheri':       { phone: '7410019077', address: '42, 4th Floor, A Wing, Silver Astra, J. B. Nagar, Andheri East.' },
    'thane':         { phone: '7410019075', address: '411, 4th floor, Shah Avenue, Gokhale Road, Besides Mango Stationary, Naupada, Thane West - 400602' },
    'pune':          { phone: '7410013458', address: 'Business Guild Complex, Office No. 302, 3rd floor, In front of hotel new Wadeshwar, Law college road.' },
    'kolhapur':      { phone: '7057575833', address: 'B-203, Muktashram Appt., Opp. Planet Fashion, 7th Lane, Rajarampuri.' },
    'sangli':        { phone: '7410019706', address: 'Flat No. 6, Satya Apartment, Above Picock Photo Studio, Vishrambag Chowk.' },
    'sambhajinagar': { phone: '8484980032', address: 'Shrinidhi Building, Plot No. 95, Shrey Nagar, near HDFC Bank, Kalda Corner.' },
    'online':        { phone: '7410019074 (Central Helpline)', address: 'Head Office: 42, 4th Floor, A Wing, Silver Astra, J. B. Nagar, Andheri East.<br><br>Regional Offices: Pune | Thane | Kolhapur | Sangli | Ch. Sambhajinagar' }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hashSource = window.location.hash.replace('#', '').trim();
      const currentSource = hashSource || urlParams.get('source') || 'Online';
      setSource(currentSource);
      
      const details = branchDetails[currentSource.toLowerCase()] || branchDetails['online'];
      setBranchInfo(details);
    }
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleCourse = (course) => {
    if (selectedCourses.includes(course)) {
      setSelectedCourses(selectedCourses.filter(c => c !== course));
    } else {
      setSelectedCourses([...selectedCourses, course]);
    }
  };

  const toggleBudget = (budget) => {
    if (selectedBudgets.includes(budget)) {
      setSelectedBudgets(selectedBudgets.filter(b => b !== budget));
    } else {
      setSelectedBudgets([...selectedBudgets, budget]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const scriptURL = 'https://script.google.com/macros/s/AKfycbz_0k81uo0WOYsHaghxqlMBBdJMmc0c4TzYDjnLpsqtQ2yhzhPkVlfmxZ_mmVrh_pls/exec';

    const data = new URLSearchParams();
    data.append('source', source);
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    data.append('courses', selectedCourses.join(', '));
    data.append('budget', selectedBudgets.join(', '));

    fetch(scriptURL, { method: 'POST', body: data })
      .then(response => response.text())
      .then(tokenText => {
        const generatedToken = tokenText.trim();
        setToken(generatedToken);
        setShowModal(true);
        setFormData({
          fullName: '',
          neetScore: '',
          studentContact: '',
          fatherContact: '',
          motherContact: '',
          coachingClass: '',
          city: '',
          category: 'General',
        });
        setSelectedCourses([]);
        setSelectedBudgets([]);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Network Error!', error);
        setIsLoading(false);
        setErrorMsg('Submission Failed. Try Again.');
        setTimeout(() => setErrorMsg(null), 4000);
      });
  };

  return (
    <div className="inquiryPortal">
      <div className="bg-deco"></div>
      <div className="bg-grid"></div>
      
      {/* ── NAVBAR ── */}
      <nav className="asmi-nav">
          <div className="asmi-nav-inner">
              <Link href="/" className="asmi-nav-logo">
                  <img src="/asmi-logo.png" alt="ASMI Career"/>
              </Link>
              <ul className="asmi-nav-links">
                  <li><Link href="/">Home</Link></li>
                  <li className="nav-dropdown">
                      <Link href="#tools">Tools</Link>
                      <ul className="nav-dropdown-menu">
                          <li><Link href="/tools/rank-predictor"><span>📊</span> Rank Predictor</Link></li>
                          <li><Link href="/tools/college-search"><span>🏥</span> College Search</Link></li>
                          <li><Link href="/tools/cutoff-explorer"><span>📈</span> Cutoff Explorer</Link></li>
                          <li><Link href="/tools/documents-checklist"><span>📋</span> Documents Checklist</Link></li>
                          <li><Link href="/tools/events"><span>🎓</span> Events & Seminars</Link></li>
                      </ul>
                  </li>
                  <li><Link href="/#about-us">About</Link></li>
                  <li><Link href="/#contact">Contact</Link></li>
                  <li className="nav-cta"><Link href="/inquiry" className="active">Book Free Counselling</Link></li>
              </ul>
              <button className="asmi-nav-hamburger" id="hamburger" aria-label="Open menu" onClick={() => setHamburgerOpen(!hamburgerOpen)}>
                  <span></span><span></span><span></span>
              </button>
          </div>
          <div className={'asmi-mobile-menu ' + (hamburgerOpen ? 'open' : '')} id="mobileMenu">
              <Link href="/" onClick={() => setHamburgerOpen(false)}>🏠 Home</Link>
              <div className="mobile-section-label">Tools</div>
              <Link href="/tools/rank-predictor" onClick={() => setHamburgerOpen(false)}>📊 Rank Predictor</Link>
              <Link href="/tools/college-search" onClick={() => setHamburgerOpen(false)}>🏥 College Search</Link>
              <Link href="/tools/cutoff-explorer" onClick={() => setHamburgerOpen(false)}>📈 Cutoff Explorer</Link>
              <Link href="/tools/documents-checklist" onClick={() => setHamburgerOpen(false)}>📋 Documents Checklist</Link>
              <Link href="/tools/events" onClick={() => setHamburgerOpen(false)}>🎓 Events & Seminars</Link>
              <div className="mobile-section-label">Company</div>
              <Link href="/#about-us" onClick={() => setHamburgerOpen(false)}>About ASMI</Link>
              <Link href="/#contact" onClick={() => setHamburgerOpen(false)}>Contact & Branches</Link>
              <Link href="/inquiry" className="mobile-cta" onClick={() => setHamburgerOpen(false)}>Book Free Counselling →</Link>
          </div>
      </nav>
      
      {/* ── PAGE HEADER ── */}
      <div className="page-header">
          <span className="page-header-eyebrow">Free · No Obligation · Any Score</span>
          <h1>Book Your Free Counselling Session</h1>
          <p className="page-header-sub">Fill in your details below. A counsellor from your nearest branch will reach out within 24 hours.</p>
      </div>
      
      {/* ── FORM SECTION ── */}
      <main className="form-main">
          <div className="form-card">
      
              {/* Left panel */}
              <section className="left-panel">
                  <div>
                      <img alt="ASMI Career Logo" className="left-panel-logo" src="/asmi-logo.png"/>
                      <h2>Our Services</h2>
                      <ul>
                          <li>
                              <span className="material-symbols-outlined">verified_user</span>
                              <span className="svc-text">Complete Admission Guidance</span>
                          </li>
                          <li>
                              <span className="material-symbols-outlined">groups</span>
                              <span className="svc-text">Personal One-on-One Counselling</span>
                          </li>
                          <li>
                              <span className="material-symbols-outlined">format_list_bulleted</span>
                              <span className="svc-text">Tailored Preference Lists</span>
                          </li>
                          <li>
                              <span className="material-symbols-outlined">analytics</span>
                              <span className="svc-text">Accurate Round Cutoffs</span>
                          </li>
                          <li>
                              <span className="material-symbols-outlined">notifications_active</span>
                              <span className="svc-text">Real-time Alerts & Updates</span>
                          </li>
                          <li>
                              <span className="material-symbols-outlined">fact_check</span>
                              <span className="svc-text">Document Verification Support</span>
                          </li>
                          <li>
                              <span className="material-symbols-outlined">edit_document</span>
                              <span className="svc-text">Form Filling Assistance</span>
                          </li>
                          <li>
                              <span className="material-symbols-outlined">support_agent</span>
                              <span className="svc-text">Dedicated Helpline Support</span>
                          </li>
                      </ul>
                  </div>
                  <hr className="left-panel-divider"/>
                  <div className="left-contact">
                      <div className="left-contact-item">
                          <span className="material-symbols-outlined">call</span>
                          <div>
                              <span className="contact-lbl">Helpline</span>
                              <p id="helplineDisplay" className="contact-val" dangerouslySetInnerHTML={{ __html: branchInfo.phone }}></p>
                          </div>
                      </div>
                      <div className="left-contact-item">
                          <span className="material-symbols-outlined">location_on</span>
                          <div>
                              <span className="contact-lbl">Address</span>
                              <p id="addressDisplay" className="contact-addr" dangerouslySetInnerHTML={{ __html: branchInfo.address }}></p>
                          </div>
                      </div>
                  </div>
              </section>
      
              {/* Right panel — form */}
              <section className="right-panel">
                  <h2 className="form-heading">Admission Inquiry</h2>
                  <p className="form-sub">Welcome to ASMI Career! Please provide your academic and contact details below.</p>
      
                  <form id="inquiryForm" onSubmit={handleSubmit}>
                      <div className="form-grid">
                          <div className="col-span-2">
                              <label className="field-label">Full Name</label>
                              <input name="fullName" className="field-input" placeholder="Enter student's full name" type="text" value={formData.fullName} onChange={handleInputChange} required/>
                          </div>
                          <div>
                              <label className="field-label">NEET Score</label>
                              <input name="neetScore" className="field-input" placeholder="Out of 720" type="number" value={formData.neetScore} onChange={handleInputChange} required/>
                          </div>
                          <div>
                              <label className="field-label">Student Contact No.</label>
                              <input name="studentContact" className="field-input" placeholder="98765 43210" type="tel" value={formData.studentContact} onChange={handleInputChange} required/>
                          </div>
                          <div>
                              <label className="field-label">Father Contact No.</label>
                              <input name="fatherContact" className="field-input" placeholder="Parent's mobile number" type="tel" value={formData.fatherContact} onChange={handleInputChange}/>
                          </div>
                          <div>
                              <label className="field-label">Mother Contact No.</label>
                              <input name="motherContact" className="field-input" placeholder="Parent's mobile number" type="tel" value={formData.motherContact} onChange={handleInputChange}/>
                          </div>
                          <div>
                              <label className="field-label">Coaching Class</label>
                              <input name="coachingClass" className="field-input" placeholder="Current coaching institute" type="text" value={formData.coachingClass} onChange={handleInputChange}/>
                          </div>
                          <div>
                              <label className="field-label">City</label>
                              <input name="city" className="field-input" placeholder="Current city" type="text" value={formData.city} onChange={handleInputChange} required/>
                          </div>
                          <div className="col-span-2">
                              <label className="field-label">Category</label>
                              <select name="category" className="field-select" value={formData.category} onChange={handleInputChange}>
                                  <option value="General">General</option>
                                  <option value="OBC">OBC</option>
                                  <option value="SC">SC</option>
                                  <option value="ST">ST</option>
                                  <option value="EWS">EWS</option>
                                  <option value="SEBC">SEBC</option>
                                  <option value="Other">VJ/NTB/NTC/NTD/SBC</option>
                              </select>
                          </div>
                      </div>
      
                      <div style={{ marginBottom: '28px' }}>
                          <span className="section-lbl">Desired Course</span>
                          <div className="course-pills">
                              {['MBBS', 'BDS', 'BAMS', 'BPTH', 'BHMS', 'BVSC'].map(course => (
                                <label key={course} className={'course-pill ' + (selectedCourses.includes(course) ? 'selected' : '')} onClick={() => toggleCourse(course)}>
                                  <span>{course}</span>
                                </label>
                              ))}
                          </div>
                      </div>
      
                      <div style={{ marginBottom: '28px' }}>
                          <span className="section-lbl">Estimated Budget Range</span>
                          <div className="budget-grid">
                              {[
                                { key: 'Govt 1-2L', val: 'Govt 1–2L' },
                                { key: 'Private 7-15L', val: 'Private 7–20L' },
                                { key: 'Deemed 18-30L', val: 'Deemed 10–35L' },
                                { key: 'NRI / Management 40-50L', val: 'NRI / Management 20–60L' }
                              ].map(b => (
                                <label key={b.key} className={'budget-pill ' + (selectedBudgets.includes(b.key) ? 'selected' : '')} onClick={() => toggleBudget(b.key)}>
                                  <span>{b.val}</span>
                                </label>
                              ))}
                          </div>
                      </div>
      
                      <div>
                          {!isLoading && !errorMsg && (
                            <button id="submitBtn" type="submit" className="submit-btn">
                                Submit Details
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                          )}
                          {isLoading && (
                            <div id="loader" className="loader-container" style={{ display: 'flex' }}>
                                <div className="spinner"></div>
                                <div className="loader-text">Securing your token...</div>
                            </div>
                          )}
                          {errorMsg && (
                            <button type="button" className="submit-btn bg-red-500 text-white" style={{ display: 'flex' }}>
                                {errorMsg}
                            </button>
                          )}
                      </div>
                  </form>
              </section>
          </div>
      </main>
      
      {/* ── FOOTER ── */}
      <footer className="asmi-footer" id="contact">
          <div className="asmi-footer-inner">
              <div className="asmi-footer-grid">
                  <div className="asmi-footer-brand">
                      <img src="/asmi-logo.png" alt="ASMI Career"/>
                      <p>ASMI Career is Maharashtra's leading NEET medical admissions counselling company. 11+ years of experience, 25,000+ admissions.</p>
                      <div style={{ marginTop: '16px', fontSize: '.875rem', color: 'rgba(255,255,255,.45)' }}>
                          <div>📞 Central Helpline: <a href="tel:7410019074" style={{ color: 'rgba(255,255,255,.65)' }}>7410019074</a></div>
                      </div>
                  </div>
                  <div>
                      <h4>Quick Links</h4>
                      <ul>
                          <li><Link href="/">Home</Link></li>
                          <li><Link href="/tools/rank-predictor">Rank Predictor</Link></li>
                          <li><Link href="/tools/cutoff-explorer">Cutoff Explorer</Link></li>
                          <li><Link href="/tools/documents-checklist">Documents Checklist</Link></li>
                          <li><Link href="/tools/events">Events</Link></li>
                      </ul>
                  </div>
                  <div>
                      <h4>Branches</h4>
                      <ul>
                          <li><Link href="/inquiry?source=andheri">Mumbai – Andheri</Link></li>
                          <li><Link href="/inquiry?source=thane">Thane</Link></li>
                          <li><Link href="/inquiry?source=pune">Pune</Link></li>
                          <li><Link href="/inquiry?source=kolhapur">Kolhapur</Link></li>
                          <li><Link href="/inquiry?source=sangli">Sangli</Link></li>
                          <li><Link href="/inquiry?source=sambhajinagar">Ch. Sambhajinagar</Link></li>
                      </ul>
                  </div>
                  <div>
                      <h4>Contact</h4>
                      <div className="asmi-footer-contact-item">
                          <strong>Andheri (Head Office)</strong>
                          42, 4th Floor, A Wing, Silver Astra, J.B. Nagar, Andheri East
                          <br/><a href="tel:7410019077" style={{ color: 'rgba(255,255,255,.65)' }}>7410019077</a>
                      </div>
                      <div className="asmi-footer-contact-item">
                          <strong>Thane</strong>
                          Shah Avenue, Gokhale Road, Naupada
                          <br/><a href="tel:7410019075" style={{ color: 'rgba(255,255,255,.65)' }}>7410019075</a>
                      </div>
                  </div>
              </div>
              <div className="asmi-footer-bottom">
                  <span>© 2026 ASMI Youth Career Advisor LLP. All rights reserved.</span>
                  <span>asmicareer.in</span>
              </div>
          </div>
      </footer>
      
      {/* ── SUCCESS MODAL ── */}
      {showModal && (
        <div id="successModal" style={{ display: 'flex' }}>
            <div className="modal-card">
                <span className="material-symbols-outlined modal-icon">check_circle</span>
                <h2 className="modal-heading">Thank You!</h2>
                <p className="modal-sub">Welcome to ASMI. Your details are registered.</p>
                <div className="modal-token-box">
                    <span className="modal-token-lbl">Your Token Number</span>
                    <span id="tokenDisplay">{token}</span>
                </div>
                <p className="modal-msg">Please take a seat. A counsellor will call your token shortly.</p>
                <button onClick={() => setShowModal(false)} className="modal-close">Close</button>
            </div>
        </div>
      )}
    </div>
  );
}
