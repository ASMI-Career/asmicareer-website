'use client';

import { useState, useEffect } from 'react';
import './student.css';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [studentName, setStudentName] = useState('Student');
  const [studentRank, setStudentRank] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [collegeData, setCollegeData] = useState([]);
  const [collegesList, setCollegesList] = useState([]); // from colleges.json
  const [checkedDocs, setCheckedDocs] = useState(new Set());
  const [docCategory, setDocCategory] = useState('General');
  const [docQuota, setDocQuota] = useState('State');
  
  // Counsellor details
  const [counsellorName, setCounsellorName] = useState('ASMI Counsellor');
  const [counsellorWhatsapp, setCounsellorWhatsapp] = useState('917410019074');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [counsellorBranch, setCounsellorBranch] = useState('ASMI Career Network');
  const [progressSteps, setProgressSteps] = useState([
    { id: 1, label: 'Profile', status: 'completed' },
    { id: 2, label: 'Counselling', status: 'active' },
    { id: 3, label: 'Shortlist', status: 'pending' },
    { id: 4, label: 'Admission', status: 'pending' }
  ]);

  // Rank Predictor score input state
  const [predictorScore, setPredictorScore] = useState('');
  const [predictedRank, setPredictedRank] = useState(null);

  // College Predictor inputs
  const [cpInputMode, setCpInputMode] = useState('rank');
  const [cpRankInput, setCpRankInput] = useState('');
  const [cpScoreInput, setCpScoreInput] = useState('');
  const [cpState, setCpState] = useState('All');
  const [cpCategory, setCpCategory] = useState('Open');
  const [cpGender, setCpGender] = useState('Co-Education');
  const [cpQuota, setCpQuota] = useState('All');
  const [cpPredictedColleges, setCpPredictedColleges] = useState([]);

  // Cutoff Explorer inputs
  const [ceViewMode, setCeViewMode] = useState('database'); // 'database' or 'single-college'
  const [ceCollegeSearch, setCeCollegeSearch] = useState('');
  const [ceState, setCeState] = useState('All');
  const [ceCategory, setCeCategory] = useState('All');
  const [ceRound, setCeRound] = useState('All');
  const [ceSingleCollege, setCeSingleCollege] = useState('');

  // Institutes Search inputs
  const [instSearch, setInstSearch] = useState('');
  const [instType, setInstType] = useState('All');
  const [instState, setInstState] = useState('All');

  // Documents checklist data
  const docCategories = ['General', 'OBC-NCL', 'SC/ST', 'EWS'];
  const docQuotas = ['State', 'All India', 'NRI'];

  const documentChecklistData = {
    'General': {
      'State': [
        { id: 'g1', label: 'NEET UG Admit Card & Score Card', copies: 'Original + 3 copies' },
        { id: 'g2', label: '10th & 12th Marksheet & Passing Certificate', copies: 'Original + 3 copies' },
        { id: 'g3', label: 'Nationality Certificate & Domicile Certificate', copies: 'Original + 3 copies' },
        { id: 'g4', label: 'Medical Fitness Certificate (Annexure H)', copies: 'Original' }
      ],
      'All India': [
        { id: 'g_ai1', label: 'Allotment Letter issued by MCC', copies: 'Original + 2 copies' },
        { id: 'g_ai2', label: 'NEET Rank Card & Admit Card', copies: 'Original + 2 copies' },
        { id: 'g_ai3', label: 'Identity Proof (Aadhaar / Passport)', copies: 'Original + 2 copies' }
      ]
    },
    'OBC-NCL': {
      'State': [
        { id: 'obc1', label: 'Caste Certificate', copies: 'Original + 3 copies' },
        { id: 'obc2', label: 'Caste Validity Certificate', copies: 'Original + 3 copies' },
        { id: 'obc3', label: 'Non-Creamy Layer Certificate (Valid till March 31 of current FY)', copies: 'Original + 3 copies' }
      ]
    }
  };

  // Score to Rank map (Sales Dashboard logic)
  const scoreToRankMap = [
    { s: 720, r: 1 }, { s: 700, r: 80 }, { s: 680, r: 950 },
    { s: 650, r: 5200 }, { s: 600, r: 21000 }, { s: 550, r: 51000 },
    { s: 500, r: 98000 }, { s: 450, r: 160000 }, { s: 400, r: 265000 },
    { s: 300, r: 520000 }, { s: 200, r: 850000 }
  ];

  function getRankFromScore(scoreVal) {
    const score = parseInt(scoreVal, 10);
    if (isNaN(score) || score < 200 || score > 720) return null;
    for (let i = 0; i < scoreToRankMap.length - 1; i++) {
      const high = scoreToRankMap[i];
      const low = scoreToRankMap[i+1];
      if (score <= high.s && score >= low.s) {
        const ratio = (score - low.s) / (high.s - low.s);
        return Math.round(low.r + (high.r - low.r) * (1 - ratio));
      }
    }
    return 850000;
  }

  // Load state and dynamic configs on mount
  useEffect(() => {
    // 1. Local state hydration
    if (typeof window !== 'undefined') {
      setStudentName(localStorage.getItem('name') || 'Student');
      const savedRank = localStorage.getItem('rank');
      if (savedRank) setStudentRank(parseInt(savedRank, 10));
      
      try {
        const sList = JSON.parse(localStorage.getItem('shortlist')) || [];
        setShortlist(sList.map(c => typeof c === 'object' ? c.name : c));
      } catch(e) {}

      try {
        const savedChecklist = JSON.parse(localStorage.getItem('asmi-checklist') || '{}');
        setCheckedDocs(new Set(savedChecklist.checked || []));
        setDocCategory(savedChecklist.category || 'General');
        setDocQuota(savedChecklist.quota || 'State');
      } catch(e) {}

      // 2. Read query params token & fetch profile
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token && token.trim() !== '') {
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyL1UC5_EGNPKZcitbkQ38HOnKzgj5ObTZGroPcH0kpyHtjY-SpYYtyl3_jH0-rUR-x/exec';
        fetch(`${APPS_SCRIPT_URL}?action=getStudent&token=${encodeURIComponent(token)}`)
          .then(res => res.json())
          .then(res => {
            if (res.success && res.data) {
              const student = res.data;
              if (student.name) {
                setStudentName(student.name);
                localStorage.setItem('name', student.name);
              }
              if (student.rank) {
                const rVal = parseInt(student.rank, 10);
                setStudentRank(rVal);
                localStorage.setItem('rank', rVal);
              }
              if (student.colleges || student.shortlist) {
                const sList = student.colleges || student.shortlist || [];
                const stringList = sList.map(c => typeof c === 'object' ? c.name : c);
                setShortlist(stringList);
                localStorage.setItem('shortlist', JSON.stringify(stringList));
              }
              if (student.category) setDocCategory(student.category);
              if (student.stage) {
                const stages = ["Enrolled", "Documents Verified", "Counselled", "Preferences Filed", "Round 1", "Allotted"];
                let idx = stages.findIndex(s => s.toLowerCase() === String(student.stage).toLowerCase().trim());
                if (idx !== -1) {
                  setProgressSteps(stages.map((st, i) => ({
                    id: i + 1,
                    label: st,
                    status: i < idx ? 'completed' : (i === idx ? 'active' : 'pending')
                  })));
                }
              }
              const cName = student.counsellorName || student.counsellor_name || student.counselorName || student.counselor_name;
              if (cName) setCounsellorName(cName);
              
              const cWhatsapp = student.counsellorWhatsapp || student.counsellor_whatsapp || student.counselorWhatsapp || student.counselor_whatsapp;
              if (cWhatsapp) setCounsellorWhatsapp(String(cWhatsapp));
              
              const wGroup = student.whatsappGroupLink || student.whatsapp_group_link || student.whatsapp_group;
              if (wGroup) setWhatsappGroupLink(wGroup);
              
              const cBranch = student.counsellorBranch || student.counsellor_branch || student.counselorBranch || student.counselor_branch;
              if (cBranch) setCounsellorBranch(cBranch);
            }
          }).catch(err => console.warn('Could not load profile details:', err));
      }
    }

    // 3. Fetch Events & Cutoffs
    fetch('/data/events.json')
      .then(res => res.json())
      .then(data => {
        const todayStr = new Date().toISOString().split('T')[0];
        const upcoming = data.filter(ev => ev.date >= todayStr).map(ev => ({
          title: ev.title,
          date: ev.date,
          authority: ev.tag || 'NOTICE'
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        setDeadlines(upcoming);
      }).catch(err => console.warn('Deadlines loading failed:', err));

    fetch('/data/rank_db.json')
      .then(res => res.json())
      .then(data => setCollegeData(data))
      .catch(err => console.warn('Rank database loading failed:', err));

    fetch('/data/colleges.json')
      .then(res => res.json())
      .then(data => setCollegesList(data))
      .catch(err => console.warn('Colleges list loading failed:', err));
  }, []);

  // Save checklist state helper
  const saveChecklist = (updatedSet, category, quota) => {
    setCheckedDocs(updatedSet);
    localStorage.setItem('asmi-checklist', JSON.stringify({
      checked: Array.from(updatedSet),
      category,
      quota
    }));
  };

  const toggleDocChecked = (id) => {
    const next = new Set(checkedDocs);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    saveChecklist(next, docCategory, docQuota);
  };

  // Predictor Calculation
  const handlePredictRank = () => {
    const score = parseInt(predictorScore, 10);
    if (isNaN(score) || score < 200 || score > 720) {
      alert('Please enter a valid NEET score between 200 and 720.');
      return;
    }
    const rank = getRankFromScore(score);
    setPredictedRank(rank);
  };

  // College Prediction logic (Using rank database cutoff explorer matching logic)
  const getPredictedColleges = () => {
    let rank = parseInt(cpInputMode === 'rank' ? cpRankInput : getRankFromScore(cpScoreInput), 10);
    if (isNaN(rank)) return [];

    let filtered = collegeData.filter(c => {
      if (cpState !== 'All' && c.state !== cpState) return false;
      if (cpQuota !== 'All' && c.quota !== cpQuota) return false;
      return true;
    });

    // Match Category Cutoff Closing Ranks
    const results = [];
    const seenColleges = new Set();

    filtered.forEach(c => {
      const matchKey = cpCategory.toLowerCase();
      const closingRank = c.cutoff?.[matchKey];
      if (closingRank && closingRank >= rank && !seenColleges.has(c.name)) {
        seenColleges.add(c.name);
        // Determine chance classification
        let chance = 'Likely';
        let chanceClass = 'badge-likely';
        const ratio = rank / closingRank;
        if (ratio < 0.8) {
          chance = 'Safe';
          chanceClass = 'badge-safe';
        } else if (ratio > 0.95) {
          chance = 'Reach';
          chanceClass = 'badge-reach';
        }
        results.push({ ...c, closingRank, chance, chanceClass });
      }
    });

    return results.sort((a, b) => a.closingRank - b.closingRank).slice(0, 50);
  };

  const handleToggleShortlist = (name) => {
    let next;
    if (shortlist.includes(name)) {
      next = shortlist.filter(n => n !== name);
    } else {
      next = [...shortlist, name];
    }
    setShortlist(next);
    localStorage.setItem('shortlist', JSON.stringify(next));
  };

  // Helper date conversions
  const getCountdown = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return { text: 'Closed', class: 'badge-reach' };
    if (days === 0) return { text: 'Today', class: 'badge-reach' };
    if (days <= 3) return { text: `${days}d left`, class: 'badge-reach' };
    return { text: `${days}d left`, class: 'badge-safe' };
  };

  const getMonthAbbr = (dateStr) => new Date(dateStr).toLocaleString('en-US', { month: 'short' });
  const getDayNum = (dateStr) => new Date(dateStr).getDate();

  // Dynamic filter states computation
  const ceStates = Array.from(new Set(collegeData.map(c => c.state))).sort();
  const ceColleges = Array.from(new Set(collegeData.map(c => c.name))).sort();

  return (
    <div className="student-body">
      {/* ── HEADER ── */}
      <header className="dashboard-header">
        <div className="header-inner">
          <div className="header-left">
            <img src="/asmi-logo.png" alt="ASMI Career" className="logo-img" />
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }}></div>
            <span className="header-portal">Student Portal</span>
          </div>
          <div style={{ color: 'var(--yellow)', fontSize: '12px', fontWeight: '800' }}>
            {studentName} 🎓
          </div>
        </div>
      </header>

      <div className="dashboard-shell">
        {/* ── SIDEBAR NAV ── */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <a onClick={() => setActiveTab('dashboard')} className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}>
              <span className="nav-icon">🏠</span>
              <span>Dashboard</span>
            </a>
            <a onClick={() => setActiveTab('predictor')} className={`nav-link ${activeTab === 'predictor' ? 'active' : ''}`}>
              <span className="nav-icon">🔮</span>
              <span>Predictor</span>
            </a>
            <a onClick={() => setActiveTab('cutoff')} className={`nav-link ${activeTab === 'cutoff' ? 'active' : ''}`}>
              <span className="nav-icon">📈</span>
              <span>Cutoff Explorer</span>
            </a>
            <a onClick={() => setActiveTab('institutes')} className={`nav-link ${activeTab === 'institutes' ? 'active' : ''}`}>
              <span className="nav-icon">🏫</span>
              <span>Institutes</span>
            </a>
            <a onClick={() => setActiveTab('checklist')} className={`nav-link ${activeTab === 'checklist' ? 'active' : ''}`}>
              <span className="nav-icon">📋</span>
              <span>Documents</span>
            </a>
          </nav>
          <div style={{ padding: '0 12px', fontSize: '10px', color: 'var(--text-dim)' }}>
            © 2026 ASMI Career
          </div>
        </aside>

        {/* ── MAIN CONTENT SPA VIEWS ── */}
        <main className="main-content">
          <div className="content-max">
            
            {/* ── VIEW: DASHBOARD ── */}
            {activeTab === 'dashboard' && (
              <div>
                <div className="tool-card" style={{ position: 'relative', overflow: 'hidden' }}>
                  {/* Constellation SVG Overlay */}
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="const-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--purple)" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="var(--yellow)" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="var(--purple)" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    <path d="M 80,40 L 300,110 L 520,70 L 780,130" fill="none" stroke="url(#const-grad)" strokeWidth="1.5" strokeDasharray="4,8" />
                    <circle cx="80" cy="40" r="3" fill="var(--purple)" opacity="0.7" />
                    <circle cx="300" cy="110" r="4" fill="var(--yellow)" />
                    <circle cx="520" cy="70" r="3" fill="var(--purple)" opacity="0.7" />
                    <circle cx="780" cy="130" r="5" fill="var(--yellow)" />
                  </svg>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, position: 'relative', zIndex: 1 }}>
                    <div>
                      <h1 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '12px', color: '#fff' }}>
                        Welcome back, <span style={{ color: 'var(--yellow)' }}>{studentName}</span> 🎓
                      </h1>
                      {studentRank && (
                        <div style={{ background: 'var(--navy)', border: '1px solid var(--card-border)', borderRadius: '30px', padding: '6px 16px', display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>NEET AIR</span>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '16px', fontWeight: '900', color: 'var(--yellow)' }}>#{studentRank.toLocaleString()}</span>
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ background: 'rgba(8,1,18,0.5)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--yellow)', display: 'block' }}>{shortlist.length}</span>
                          <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)' }}>SHORTLISTED</span>
                        </div>
                        <div style={{ background: 'rgba(8,1,18,0.5)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--yellow)', display: 'block' }}>
                            {deadlines.length > 0 ? getCountdown(deadlines[0].date).text : '—'}
                          </span>
                          <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--text-muted)' }}>NEXT DEADLINE</span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Counsellor Widget */}
                    <div style={{ background: 'var(--navy-light)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--purple)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px', border: '1px solid rgba(255,215,0,0.3)' }}>
                          {counsellorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{counsellorName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>📍 {counsellorBranch}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <a href={`https://wa.me/${String(counsellorWhatsapp).replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: '120px', background: '#25d366', color: '#fff', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          💬 Chat with Advisor
                        </a>
                        {whatsappGroupLink && (
                          <a href={whatsappGroupLink} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: '120px', background: 'transparent', border: '1px solid var(--yellow)', color: 'var(--yellow)', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            👥 Join Group
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Milestones timeline */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                      📈 Your Admission Progress
                    </div>
                    <div style={{ background: 'rgba(8,1,18,0.5)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                        {progressSteps.map((step, idx) => (
                          <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                            <div className={`step-circle ${step.status === 'completed' ? 'completed' : (step.status === 'active' ? 'active' : '')}`}>
                              {step.status === 'completed' ? '✓' : idx + 1}
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: step.status === 'active' ? 'var(--yellow)' : (step.status === 'completed' ? 'var(--safe-color)' : 'var(--text-muted)') }}>
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deadlines and Shortlist widgets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                  <div>
                    <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                      📅 Upcoming Deadlines
                    </h2>
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '20px', maxHeight: '320px', overflowY: 'auto' }}>
                      {deadlines.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No deadlines loaded.</div>
                      ) : deadlines.map((dl, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ flexShrink: 0, width: '48px', textAlign: 'center' }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--yellow)' }}>{getMonthAbbr(dl.date)}</div>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#fff' }}>{getDayNum(dl.date)}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{dl.title}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, fontSize: '10px' }}>
                              <span style={{ background: 'rgba(91,30,158,0.25)', padding: '2px 8px', borderRadius: '20px', border: '1px solid var(--card-border)' }}>{dl.authority}</span>
                              <span className={getCountdown(dl.date).class}>{getCountdown(dl.date).text}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                      ⭐ My Shortlist
                    </h2>
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '20px', maxHeight: '320px', overflowY: 'auto' }}>
                      {shortlist.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No colleges shortlisted yet.</div>
                      ) : shortlist.map((name, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>★ {name}</span>
                          <button onClick={() => handleToggleShortlist(name)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── VIEW: PREDICTOR ── */}
            {activeTab === 'predictor' && (
              <div>
                <div className="tool-card">
                  <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: 8 }}>📊 NEET Rank Predictor</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 20 }}>
                    Convert your tentative NEET Score into an estimated All India Rank (AIR).
                  </p>
                  <div style={{ display: 'flex', gap: 12, maxWidth: '400px' }}>
                    <input type="number" placeholder="Enter Score (200 - 720)" className="form-input" value={predictorScore} onChange={(e) => setPredictorScore(e.target.value)} />
                    <button onClick={handlePredictRank} className="btn-gold">Predict</button>
                  </div>
                  {predictedRank && (
                    <div style={{ marginTop: 24, background: 'rgba(8,1,18,0.5)', padding: 16, borderRadius: 12, display: 'inline-block' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ESTIMATED ALL INDIA RANK</span>
                      <div style={{ fontSize: '32px', fontWeight: '900', color: 'var(--yellow)', marginTop: 4 }}>#{predictedRank.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                <div className="tool-card">
                  <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: 16 }}>🔮 College Predictor</h2>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                    <button className={`chip ${cpInputMode === 'rank' ? 'active' : ''}`} onClick={() => setCpInputMode('rank')}>Use NEET AIR</button>
                    <button className={`chip ${cpInputMode === 'score' ? 'active' : ''}`} onClick={() => setCpInputMode('score')}>Use NEET Score</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {cpInputMode === 'rank' ? (
                      <div className="form-group">
                        <label className="form-label">All India Rank</label>
                        <input type="number" placeholder="e.g. 15000" className="form-input" value={cpRankInput} onChange={(e) => setCpRankInput(e.target.value)} />
                      </div>
                    ) : (
                      <div className="form-group">
                        <label className="form-label">NEET Score</label>
                        <input type="number" placeholder="e.g. 620" className="form-input" value={cpScoreInput} onChange={(e) => setCpScoreInput(e.target.value)} />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">State Preference</label>
                      <select className="form-select" value={cpState} onChange={(e) => setCpState(e.target.value)}>
                        <option value="All">All States</option>
                        {ceStates.map((st, i) => <option key={i} value={st}>{st}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={cpCategory} onChange={(e) => setCpCategory(e.target.value)}>
                        <option value="Open">Open / General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                  </div>

                  {/* College Results Table */}
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: '14px', marginBottom: 12 }}>Eligible Colleges</h3>
                    <div className="table-container">
                      <table className="dense-table">
                        <thead>
                          <tr>
                            <th>College Name</th>
                            <th>State</th>
                            <th>Round</th>
                            <th>Closing Cutoff</th>
                            <th>Shortlist</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getPredictedColleges().length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                Enter your Rank/Score to view matching colleges.
                              </td>
                            </tr>
                          ) : getPredictedColleges().map((c, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: '700' }}>{c.name}</td>
                              <td>{c.state}</td>
                              <td>{c.round || 'Round 1'}</td>
                              <td>{c.closingRank?.toLocaleString() || '—'}</td>
                              <td>
                                <button onClick={() => handleToggleShortlist(c.name)} className="chip active" style={{ padding: '4px 8px', fontSize: '10px' }}>
                                  {shortlist.includes(c.name) ? '★ Shortlisted' : '☆ Add'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── VIEW: CUTOFF EXPLORER ── */}
            {activeTab === 'cutoff' && (
              <div className="tool-card">
                <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: 16 }}>📈 Cutoff Explorer</h2>
                
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <button className={`chip ${ceViewMode === 'database' ? 'active' : ''}`} onClick={() => setCeViewMode('database')}>Browse Database</button>
                  <button className={`chip ${ceViewMode === 'single-college' ? 'active' : ''}`} onClick={() => setCeViewMode('single-college')}>Single College Lookup</button>
                </div>

                {ceViewMode === 'database' ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                      <div className="form-group">
                        <label className="form-label">Search College Name</label>
                        <input type="text" placeholder="Search..." className="form-input" value={ceCollegeSearch} onChange={(e) => setCeCollegeSearch(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <select className="form-select" value={ceState} onChange={(e) => setCeState(e.target.value)}>
                          <option value="All">All States</option>
                          {ceStates.map((st, i) => <option key={i} value={st}>{st}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="table-container">
                      <table className="dense-table">
                        <thead>
                          <tr>
                            <th>College Name</th>
                            <th>State</th>
                            <th>Quota</th>
                            <th>Cutoffs</th>
                          </tr>
                        </thead>
                        <tbody>
                          {collegeData.filter(c => {
                            if (ceState !== 'All' && c.state !== ceState) return false;
                            if (ceCollegeSearch && !c.name.toLowerCase().includes(ceCollegeSearch.toLowerCase())) return false;
                            return true;
                          }).slice(0, 50).map((c, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: '700' }}>{c.name}</td>
                              <td>{c.state}</td>
                              <td>{c.quota || 'All India'}</td>
                              <td>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  {Object.entries(c.cutoff || {}).map(([cat, val]) => (
                                    <span key={cat} style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, fontSize: '10px' }}>
                                      {cat.toUpperCase()}: {val?.toLocaleString()}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="form-group" style={{ maxWidth: '500px' }}>
                      <label className="form-label">Select College</label>
                      <select className="form-select" value={ceSingleCollege} onChange={(e) => setCeSingleCollege(e.target.value)}>
                        <option value="">-- Select College --</option>
                        {ceColleges.map((col, i) => <option key={i} value={col}>{col}</option>)}
                      </select>
                    </div>

                    {ceSingleCollege && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 12, border: '1px solid var(--card-border)' }}>
                        <h3 style={{ color: 'var(--yellow)', marginBottom: 16 }}>{ceSingleCollege}</h3>
                        <table className="dense-table">
                          <thead>
                            <tr>
                              <th>Quota</th>
                              <th>Category</th>
                              <th>Round 1 Closing Rank</th>
                            </tr>
                          </thead>
                          <tbody>
                            {collegeData.filter(c => c.name === ceSingleCollege).map((c, i) => 
                              Object.entries(c.cutoff || {}).map(([cat, val], idx) => (
                                <tr key={`${i}-${idx}`}>
                                  <td>{c.quota || 'All India'}</td>
                                  <td style={{ textTransform: 'uppercase', fontWeight: '700' }}>{cat}</td>
                                  <td>{val?.toLocaleString() || '—'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── VIEW: INSTITUTES (Colleges page wrapper) ── */}
            {activeTab === 'institutes' && (
              <div className="tool-card">
                <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: 16 }}>🏫 Institutes Directory</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Search Name</label>
                    <input type="text" placeholder="Search..." className="form-input" value={instSearch} onChange={(e) => setInstSearch(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={instType} onChange={(e) => setInstType(e.target.value)}>
                      <option value="All">All Types</option>
                      <option value="Government">Government</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>
                </div>

                <div className="table-container">
                  <table className="dense-table">
                    <thead>
                      <tr>
                        <th>College Name</th>
                        <th>Type</th>
                        <th>State</th>
                        <th>Annual Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collegesList.filter(c => {
                        if (instState !== 'All' && c.state !== instState) return false;
                        if (instType !== 'All' && c.type?.toLowerCase() !== instType.toLowerCase()) return false;
                        if (instSearch && !c.name.toLowerCase().includes(instSearch.toLowerCase())) return false;
                        return true;
                      }).slice(0, 50).map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: '700' }}>{c.name}</td>
                          <td>{c.type || 'Government'}</td>
                          <td>{c.state}</td>
                          <td>{c.annual_fees ? `₹${c.annual_fees.toLocaleString()}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── VIEW: DOCUMENTS CHECKLIST ── */}
            {activeTab === 'checklist' && (
              <div className="tool-card">
                <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: 16 }}>📋 Mandatory Documents Checklist</h2>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  {docCategories.map(cat => (
                    <button key={cat} className={`chip ${docCategory === cat ? 'active' : ''}`} onClick={() => { setDocCategory(cat); saveChecklist(checkedDocs, cat, docQuota); }}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  {docQuotas.map(q => (
                    <button key={q} className={`chip ${docQuota === q ? 'active' : ''}`} onClick={() => { setDocQuota(q); saveChecklist(checkedDocs, docCategory, q); }}>
                      {q} Quota
                    </button>
                  ))}
                </div>

                {/* Checklist Rows */}
                <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                  {((documentChecklistData[docCategory] || {})[docQuota] || []).length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                      No specific documents declared for this selection.
                    </div>
                  ) : ((documentChecklistData[docCategory] || {})[docQuota] || []).map((doc, i) => {
                    const isChecked = checkedDocs.has(doc.id);
                    return (
                      <div key={i} onClick={() => toggleDocChecked(doc.id)} style={{ display: 'flex', gap: 16, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: isChecked ? 'rgba(91,30,158,0.08)' : 'transparent' }}>
                        <div style={{ width: '20px', height: '20px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--yellow)', fontSize: '12px', fontWeight: '800' }}>
                          {isChecked ? '✓' : ''}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{doc.label}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>{doc.copies}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
