'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import './inquiry.css';
import { getEngineeringLeadTarget, ENGINEERING_NEW_SCRIPT, TEST_TOKEN, EMPTY_ATTR, readAttribution, sanitizePhoneInput, normalizePhone, PHONE_ERROR_INDIA, parsePercentile, percentileError, looksLikeToken } from '../../../lib/leadForm';
import TestModeBanner from '../../components/TestModeBanner';

const engineeringNavLinks = [
  { label: 'Colleges', href: '/engineering/colleges' },
  { label: 'Counselling', href: '/engineering/counselling' },
  { label: 'Packages', href: '/engineering#packages' },
  { label: 'Services', href: '/engineering/services' },
  { label: 'Events', href: '/engineering/events' },
  { label: 'News', href: '/engineering/news' },
  { label: 'About Us', href: '/engineering/about' },
  { label: 'Contact Us', href: '/engineering/contact' },
];

const INITIAL_FORM = {
  fullName: '',
  entranceScore: '',
  studentContact: '',
  fatherContact: '',
  motherContact: '',
  coachingClass: '',
  city: '',
  category: 'General',
  // Fields below are only shown/sent when the NEW engineering lead script is configured
  // (NEXT_PUBLIC_ENGINEERING_LEAD_URL, see apps-script/engineering-leads/README.md).
  scoreExam: '',
  jeeMainRank: '',
  jeeAdvancedRank: '',
  examsAppearing: '',
  homeState: '',
  classStatus: '',
  nearestBranch: 'Online',
  consent: false,
  website_url: '', // honeypot: real users never see or fill this
};

// Value for the "Nearest Branch" dropdown (matches the branch links ?source=pune etc.).
const BRANCH_OPTIONS = [
  { value: 'Andheri', label: 'Mumbai – Andheri' },
  { value: 'Thane', label: 'Thane' },
  { value: 'Pune', label: 'Pune' },
  { value: 'Kolhapur', label: 'Kolhapur' },
  { value: 'Sangli', label: 'Sangli' },
  { value: 'Sambhajinagar', label: 'Ch. Sambhajinagar' },
  { value: 'Online', label: 'Online / Not sure' },
];

export default function EngineeringInquiryPage() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isDuplicate, setIsDuplicate] = useState(false);
  
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedBudgets, setSelectedBudgets] = useState([]);
  const [source, setSource] = useState('Online');
  const [branchInfo, setBranchInfo] = useState({ phone: 'Loading...', address: 'Loading details...' });
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState('---');
  const [errorMsg, setErrorMsg] = useState(null);
  const [errors, setErrors] = useState({});
  const [attribution, setAttribution] = useState(EMPTY_ATTR); // utm_source/medium/campaign + gclid
  const [leadTarget, setLeadTarget] = useState(null); // where submissions go (TEST MODE banner on non-live hosts)

  const branchDetails = {
    'andheri':       { phone: '7410019077', address: '42, 4th Floor, A Wing, Silver Astra, J. B. Nagar, Andheri East.' },
    'thane':         { phone: '7410019075', address: '411, 4th floor, Shah Avenue, Gokhale Road, Besides Mango Stationary, Naupada, Thane West - 400602' },
    'pune':          { phone: '7410013458', address: 'Business Guild Complex, Office No. 302, 3rd floor, In front of hotel new Wadeshwar, Law college road.' },
    'kolhapur':      { phone: '7057575833', address: 'B-203, Muktashram Appt., Opp. Planet Fashion, 7th Lane, Rajarampuri.' },
    'sangli':        { phone: '7410019076', address: 'Flat No. 6, Satya Apartment, Above Picock Photo Studio, Vishrambag Chowk.' },
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
      setAttribution(readAttribution());
      setLeadTarget(getEngineeringLeadTarget());
      const preselected = BRANCH_OPTIONS.find(b => b.value.toLowerCase() === currentSource.toLowerCase());
      if (preselected) setFormData(prev => ({ ...prev, nearestBranch: preselected.value }));
    }
  }, []);

  const PHONE_FIELDS = ['studentContact', 'fatherContact', 'motherContact'];
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : (PHONE_FIELDS.includes(name) ? sanitizePhoneInput(value) : value) });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
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

  function validateForm(data) {
    const newErrors = {};
    if (!data.fullName.trim()) newErrors.fullName = 'Please enter the student\'s full name';
    if (parsePercentile(data.entranceScore) === null) newErrors.entranceScore = percentileError(data.entranceScore);
    if (!normalizePhone(data.studentContact, false)) newErrors.studentContact = PHONE_ERROR_INDIA;
    if (!data.city.trim()) newErrors.city = 'Please enter your current city';
    if (data.fatherContact && !normalizePhone(data.fatherContact, false)) newErrors.fatherContact = PHONE_ERROR_INDIA;
    if (data.motherContact && !normalizePhone(data.motherContact, false)) newErrors.motherContact = PHONE_ERROR_INDIA;
    if (ENGINEERING_NEW_SCRIPT) {
      if (!data.scoreExam) newErrors.scoreExam = 'Please choose which exam this percentile is for';
      if (data.jeeMainRank.trim() && !/^[\d,\s]+$/.test(data.jeeMainRank)) newErrors.jeeMainRank = 'Enter the rank as a number, for example 12345';
      if (data.jeeAdvancedRank.trim() && !/^[\d,\s]+$/.test(data.jeeAdvancedRank)) newErrors.jeeAdvancedRank = 'Enter the rank as a number, for example 4500';
      if (!data.consent) newErrors.consent = 'Please tick the box so our counsellor can contact you';
    }
    return newErrors;
  }

  // NEW engineering lead script: field names match the sheet headers (apps-script/engineering-leads).
  // Phones/percentile are sent in the cleaned form validated above.
  const submitToNewScript = (target) => {
    const data = new URLSearchParams();
    data.append('Full Name', formData.fullName.trim());
    data.append('Student Contact', normalizePhone(formData.studentContact, false));
    data.append('Father Contact', normalizePhone(formData.fatherContact, false));
    data.append('Mother Contact', normalizePhone(formData.motherContact, false));
    data.append('Coaching Class', formData.coachingClass.trim());
    data.append('City', formData.city.trim());
    data.append('Category', formData.category);
    data.append('Courses', selectedCourses.join(', '));
    data.append('Budget', selectedBudgets.join(', '));
    data.append('Nearest Branch', formData.nearestBranch);
    data.append('Entrance Percentile', String(parsePercentile(formData.entranceScore)));
    data.append('Score Exam', formData.scoreExam);
    data.append('JEE Main Rank (CRL)', formData.jeeMainRank.trim());
    data.append('JEE Advanced Rank', formData.jeeAdvancedRank.trim());
    data.append('Exams Appearing', formData.examsAppearing.trim());
    data.append('Home State', formData.homeState.trim());
    data.append('Class Status', formData.classStatus);
    data.append('Source', source.toLowerCase() === 'seminar' ? 'Seminar' : 'Website');
    data.append('utm_source', attribution.utm_source);
    data.append('utm_medium', attribution.utm_medium);
    data.append('utm_campaign', attribution.utm_campaign);
    data.append('gclid', attribution.gclid);
    data.append('Plan', 'Explore'); // the server ignores anything else; paid plans are set by staff
    data.append('Consent', formData.consent ? 'Yes' : 'No');
    data.append('website_url', formData.website_url);

    fetch(target.endpoint, { method: 'POST', body: data })
      .then(response => response.text())
      .then(text => {
        let res = null;
        try { res = JSON.parse(text); } catch (parseErr) { /* handled below */ }
        if (!res) throw new Error('Unexpected response from lead script');
        if (res.ok === false) {
          const first = res.errors && res.errors[0];
          setIsLoading(false);
          setErrorMsg(first ? first.message : (res.message || 'Submission failed. Please try again.'));
          setTimeout(() => setErrorMsg(null), 8000);
          return; // keep what the student typed so they can fix it
        }
        setToken(res.token || '');
        setIsDuplicate(!!res.duplicate);
        setShowModal(true);
        setFormData({ ...INITIAL_FORM, nearestBranch: formData.nearestBranch });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsLoading(true);
    setErrorMsg(null);

    // Preview / local builds must never post to the live lead sheet (see lib/leadForm.js).
    const target = getEngineeringLeadTarget();
    setLeadTarget(target);
    if (!target.endpoint) {
      setToken(TEST_TOKEN);
      setShowModal(true);
      setIsLoading(false);
      return;
    }

    if (target.newScript) { submitToNewScript(target); return; }

    const data = new URLSearchParams();
    // Keep the legacy suffix: the ORIGINAL Apps Script only understands this (it falls back to the Online tab),
    // the new script prefers stream/branch below.
    data.append('source', source + ' (Engineering)');
    data.append('branch', source);
    data.append('stream', 'Engineering');
    const cleaned = {
      ...formData,
      studentContact: normalizePhone(formData.studentContact, false),
      fatherContact: normalizePhone(formData.fatherContact, false),
      motherContact: normalizePhone(formData.motherContact, false),
      entranceScore: String(parsePercentile(formData.entranceScore)),
    };
    Object.keys(cleaned).forEach(key => {
      data.append(key, cleaned[key]);
    });
    data.append('courses', selectedCourses.join(', '));
    data.append('budget', selectedBudgets.join(', '));
    Object.keys(attribution).forEach(k => data.append(k, attribution[k]));

    fetch(target.endpoint, { method: 'POST', body: data })
      .then(response => response.text())
      .then(tokenText => {
        if (!looksLikeToken(tokenText)) throw new Error('Server rejected submission: ' + String(tokenText).slice(0, 120));
        const generatedToken = tokenText.trim();
        setToken(generatedToken);
        setShowModal(true);
        setFormData({ ...INITIAL_FORM, nearestBranch: formData.nearestBranch });
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
      <TestModeBanner target={leadTarget} />
      <div className="bg-deco"></div>
      <div className="bg-grid"></div>
      
      {/* ── NAVBAR ── */}
      <Nav links={engineeringNavLinks} ctaHref="/engineering/inquiry" homeHref="/engineering" />
      
      {/* ── PAGE HEADER ── */}
      <div className="page-header">
          <span className="page-header-eyebrow">Free · No Obligation · Any Percentile</span>
          <h1>Book Your Free Engineering Counselling Session</h1>
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
                              <span className="svc-text">JoSAA & CET Admission Guidance</span>
                          </li>
                          <li>
                              <span className="material-symbols-outlined">groups</span>
                              <span className="svc-text">Personal One-on-One Counselling</span>
                          </li>
                          <li>
                              <span className="material-symbols-outlined">format_list_bulleted</span>
                              <span className="svc-text">Tailored Option Forms</span>
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
                  <h2 className="form-heading">Engineering Admission Inquiry</h2>
                  <p className="form-sub">Welcome to ASMI Career! Please provide your academic and contact details below.</p>
      
                  <form id="inquiryForm" onSubmit={handleSubmit} noValidate>
                      {Object.keys(attribution).map(k => <input key={k} type="hidden" name={k} value={attribution[k]} readOnly />)}
                      <input type="hidden" name="stream" value="Engineering" readOnly />
                      <input type="hidden" name="branch" value={source} readOnly />
                      <div className="form-grid">
                          <div className="col-span-2">
                              <label className="field-label">Full Name</label>
                              <input name="fullName" className="field-input" placeholder="Enter student's full name" type="text" value={formData.fullName} onChange={handleInputChange} required/>
                              {errors.fullName && <p style={{color:'red',fontSize:'12px',marginTop:'4px'}}>{errors.fullName}</p>}
                          </div>
                          <div>
                              <label className="field-label">JEE / MHT-CET Percentile (0.01 to 100)</label>
                              <input name="entranceScore" className="field-input" placeholder="E.g., 98.5" type="text" inputMode="decimal" aria-describedby="entranceScoreHint" value={formData.entranceScore} onChange={handleInputChange} required/>
                              <p id="entranceScoreHint" style={{fontSize:'12px',opacity:0.75,marginTop:'4px'}}>Enter your percentile (for example 98.5). This is not your rank.</p>
                              {errors.entranceScore && <p style={{color:'red',fontSize:'12px',marginTop:'4px'}}>{errors.entranceScore}</p>}
                          </div>
                          <div>
                              <label className="field-label">Student Contact No.</label>
                              <input name="studentContact" className="field-input" placeholder="10-digit mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={24} value={formData.studentContact} onChange={handleInputChange} required/>
                              {errors.studentContact && <p style={{color:'red',fontSize:'12px',marginTop:'4px'}}>{errors.studentContact}</p>}
                          </div>
                          <div>
                              <label className="field-label">Father Contact No.</label>
                              <input name="fatherContact" className="field-input" placeholder="Father's number (optional)" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={24} value={formData.fatherContact} onChange={handleInputChange}/>
                              {errors.fatherContact && <p style={{color:'red',fontSize:'12px',marginTop:'4px'}}>{errors.fatherContact}</p>}
                          </div>
                          <div>
                              <label className="field-label">Mother Contact No.</label>
                              <input name="motherContact" className="field-input" placeholder="Mother's number (optional)" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={24} value={formData.motherContact} onChange={handleInputChange}/>
                              {errors.motherContact && <p style={{color:'red',fontSize:'12px',marginTop:'4px'}}>{errors.motherContact}</p>}
                          </div>
                          <div>
                              <label className="field-label">Coaching Class</label>
                              <input name="coachingClass" className="field-input" placeholder="Current coaching institute" type="text" value={formData.coachingClass} onChange={handleInputChange}/>
                          </div>
                          <div>
                              <label className="field-label">City</label>
                              <input name="city" className="field-input" placeholder="Current city" type="text" value={formData.city} onChange={handleInputChange} required/>
                              {errors.city && <p style={{color:'red',fontSize:'12px',marginTop:'4px'}}>{errors.city}</p>}
                          </div>
                          <div className="col-span-2">
                              <label className="field-label">Category</label>
                              <select name="category" className="field-select" value={formData.category} onChange={handleInputChange}>
                                  <option value="General">General</option>
                                  <option value="OBC">OBC/OBC-NCL</option>
                                  <option value="SC">SC</option>
                                  <option value="ST">ST</option>
                                  <option value="EWS">EWS</option>
                                  <option value="SEBC">SEBC</option>
                                  <option value="Other">VJ/NTB/NTC/NTD/SBC</option>
                              </select>
                          </div>
                      </div>
      
                      {ENGINEERING_NEW_SCRIPT && (
                      <div className="form-grid" style={{ marginBottom: '28px' }}>
                          <div>
                              <label className="field-label">Which exam is this percentile for?</label>
                              <select name="scoreExam" className="field-select" value={formData.scoreExam} onChange={handleInputChange}>
                                  <option value="">— Select —</option>
                                  <option value="JEE Main">JEE Main</option>
                                  <option value="MHT-CET">MHT-CET</option>
                                  <option value="Other State CET">Other State CET</option>
                              </select>
                              {errors.scoreExam && <p style={{color:'red',fontSize:'12px',marginTop:'4px'}}>{errors.scoreExam}</p>}
                          </div>
                          <div>
                              <label className="field-label">Nearest ASMI Branch</label>
                              <select name="nearestBranch" className="field-select" value={formData.nearestBranch} onChange={handleInputChange}>
                                  {BRANCH_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="field-label">JEE Main Rank (CRL) — optional</label>
                              <input name="jeeMainRank" className="field-input" placeholder="E.g., 12345" type="text" inputMode="numeric" value={formData.jeeMainRank} onChange={handleInputChange}/>
                              {errors.jeeMainRank && <p style={{color:'red',fontSize:'12px',marginTop:'4px'}}>{errors.jeeMainRank}</p>}
                          </div>
                          <div>
                              <label className="field-label">JEE Advanced Rank — optional</label>
                              <input name="jeeAdvancedRank" className="field-input" placeholder="E.g., 4500" type="text" inputMode="numeric" value={formData.jeeAdvancedRank} onChange={handleInputChange}/>
                              {errors.jeeAdvancedRank && <p style={{color:'red',fontSize:'12px',marginTop:'4px'}}>{errors.jeeAdvancedRank}</p>}
                          </div>
                          <div>
                              <label className="field-label">Exams Appearing In</label>
                              <input name="examsAppearing" className="field-input" placeholder="E.g., JEE Main, MHT-CET, BITSAT" type="text" value={formData.examsAppearing} onChange={handleInputChange}/>
                          </div>
                          <div>
                              <label className="field-label">Class Status</label>
                              <select name="classStatus" className="field-select" value={formData.classStatus} onChange={handleInputChange}>
                                  <option value="">— Select —</option>
                                  <option value="Class 12 appearing">Class 12 – appearing</option>
                                  <option value="Class 12 passed">Class 12 – passed</option>
                                  <option value="Repeater / dropper">Repeater / dropper</option>
                                  <option value="Diploma">Diploma</option>
                                  <option value="Other">Other</option>
                              </select>
                          </div>
                          <div className="col-span-2">
                              <label className="field-label">Home State</label>
                              <input name="homeState" className="field-input" placeholder="E.g., Maharashtra" type="text" value={formData.homeState} onChange={handleInputChange}/>
                          </div>
                      </div>
                      )}

                      <div style={{ marginBottom: '28px' }}>
                          <span className="section-lbl">Desired Branch (Select Multiple)</span>
                          <div className="course-pills">
                              {['CS / IT', 'AI / Data Science', 'E&TC / ECE', 'Mechanical', 'Civil', 'Other'].map(course => (
                                <label key={course} className={'course-pill ' + (selectedCourses.includes(course) ? 'selected' : '')} onClick={() => toggleCourse(course)}>
                                  <span>{course}</span>
                                </label>
                              ))}
                          </div>
                      </div>
      
                      <div style={{ marginBottom: '28px' }}>
                          <span className="section-lbl">Estimated Budget Range (4 Years)</span>
                          <div className="budget-grid">
                              {[
                                { key: 'Govt 1–3L', val: 'Govt 1–3L' },
                                { key: 'Private 5–10L', val: 'Private 5–10L' },
                                { key: 'Private/Deemed 10–20L', val: 'Private/Deemed 10–20L' },
                                { key: 'Management 20L+', val: 'Management 20L+' }
                              ].map(b => (
                                <label key={b.key} className={'budget-pill ' + (selectedBudgets.includes(b.key) ? 'selected' : '')} onClick={() => toggleBudget(b.key)}>
                                  <span>{b.val}</span>
                                </label>
                              ))}
                          </div>
                      </div>
      
                      {ENGINEERING_NEW_SCRIPT && (
                      <>
                      {/* Honeypot: hidden from people, bots tend to fill it. The server drops such submissions. */}
                      <div style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
                          <label>Leave this empty
                              <input name="website_url" type="text" tabIndex={-1} autoComplete="off" value={formData.website_url} onChange={handleInputChange}/>
                          </label>
                      </div>
                      {/* Consent wording is a DRAFT: have it reviewed before launch. */}
                      <div style={{ marginBottom: '24px' }}>
                          <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5, cursor: 'pointer' }}>
                              <input name="consent" type="checkbox" checked={formData.consent} onChange={handleInputChange} style={{ marginTop: 3 }}/>
                              <span>I agree that ASMI Career may contact me and my parents by call, SMS and WhatsApp about engineering counselling, and store the details I have shared for this purpose.</span>
                          </label>
                          {errors.consent && <p style={{color:'red',fontSize:'12px',marginTop:'4px'}}>{errors.consent}</p>}
                      </div>
                      </>
                      )}

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
      <Footer isEngineering={true} />
      
      {/* ── SUCCESS MODAL ── */}
      {showModal && (
        <div id="successModal" style={{ display: 'flex' }}>
            <div className="modal-card">
                <span className="material-symbols-outlined modal-icon">check_circle</span>
                <h2 className="modal-heading">Thank You!</h2>
                <p className="modal-sub">{token === TEST_TOKEN ? 'TEST MODE: nothing was sent to the lead sheet.' : isDuplicate ? 'We already have your details from today. Your original token is below.' : 'Welcome to ASMI Engineering. Your details are registered.'}</p>
                {token && (
                  <div className="modal-token-box">
                      <span className="modal-token-lbl">Your Token Number</span>
                      <span id="tokenDisplay">{token}</span>
                  </div>
                )}
                <p className="modal-msg">{token ? 'Please take a seat. A counsellor will call your token shortly.' : 'A counsellor will contact you shortly.'}</p>
                <button onClick={() => setShowModal(false)} className="modal-close">Close</button>
            </div>
        </div>
      )}
    </div>
  );
}
