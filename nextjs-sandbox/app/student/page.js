'use client';

import { useState, useEffect } from 'react';
import './student.css';

// Helper functions & database schemas
const getBranchFromToken = (token) => {
  if (!token) return 'ASMI Career Network';
  const tok = String(token).toUpperCase();
  if (tok.includes('MUM')) return 'Mumbai Branch';
  if (tok.includes('PUN') || tok.includes('PNE')) return 'Pune Branch';
  if (tok.includes('NGP') || tok.includes('NAG')) return 'Nagpur Branch';
  if (tok.includes('KOL')) return 'Kolhapur Branch';
  if (tok.includes('SAN')) return 'Sangli Branch';
  if (tok.includes('CSN') || tok.includes('SAM')) return 'Chh. Sambhajinagar Branch';
  if (tok.includes('THN') || tok.includes('THA')) return 'Thane Branch';
  if (tok.includes('NSK') || tok.includes('NAS')) return 'Nashik Branch';
  return 'ASMI Regional Branch';
};

const getWhatsAppLink = (number) => {
  if (!number) return 'https://wa.me/917410019074';
  const cleanNum = String(number).replace(/\D/g, '');
  return 'https://wa.me/' + (cleanNum.startsWith('91') ? cleanNum : '91' + cleanNum);
};

const calculateChance = (cutoff, userRank) => {
  const diff = cutoff - userRank;
  if (diff >= 500) {
    return { key: 'safe', label: 'Safe', class: 'badge-safe' };
  } else if (diff >= 0) {
    return { key: 'likely', label: 'Likely', class: 'badge-likely' };
  } else if (diff >= -1000) {
    return { key: 'borderline', label: 'Borderline', class: 'badge-borderline' };
  } else {
    return { key: 'reach', label: 'Out of Reach', class: 'badge-reach' };
  }
};

const cleanFee = (feesStr) => {
  if (!feesStr) return 0;
  return parseInt(String(feesStr).replace(/[^0-9]/g, ''), 10) || 0;
};

const formatFees = (feesStr) => {
  const rawFee = cleanFee(feesStr);
  if (rawFee === 0) return '₹ — / yr';
  if (rawFee < 100000) {
    return `₹${rawFee.toLocaleString('en-IN')} / yr`;
  } else {
    const lakhs = (rawFee / 100000).toFixed(2);
    return `₹${lakhs} L / yr`;
  }
};

const DOCS = {
  sections: [
    {
      title: 'Academic Documents',
      docs: [
        { id: 'neet-admit',   label: 'NEET Admit Card',                             copies: 'Original + 2 self-attested photocopies' },
        { id: 'neet-score',   label: 'NEET Scorecard / Rank Letter',                copies: 'Original + 2 self-attested photocopies' },
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
        { id: 'photos',        label: 'Passport-size Photographs', copies: '10–15 recent, white background', note: 'Same set as used in NEET application form' },
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
        { id: 'mcc-reg',       label: 'MCC Registration Printout',   copies: '2 photocopies',              note: 'Print from the MCC NEET UG counselling portal' },
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
  const [cpQuota, setCpQuota] = useState('All');
  const [cpScoreCourse, setCpScoreCourse] = useState('MBBS');

  // Cutoff Explorer inputs
  const [ceViewMode, setCeViewMode] = useState('database'); // 'database' or 'single-college'
  const [ceCollegeSearch, setCeCollegeSearch] = useState('');
  const [ceState, setCeState] = useState('All');
  const [ceRound, setCeRound] = useState('All');
  const [ceSingleCollege, setCeSingleCollege] = useState('');

  // Institutes Search inputs
  const [instSearch, setInstSearch] = useState('');
  const [instStateSearch, setInstStateSearch] = useState('');
  const [instSelectedStates, setInstSelectedStates] = useState([]);
  const [instType, setInstType] = useState('All');
  const [instCourse, setInstCourse] = useState('All');
  const [instSortBy, setInstSortBy] = useState('Recommended');
  const [instMaxFees, setInstMaxFees] = useState(3000000);
  const [instTabType, setInstTabType] = useState('All');

  // Score matching database
  const [asmiDb, setAsmiDb] = useState(null);

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
              const cName = student.counsellor_name || student.counsellorName || student.counselor_name || student.counselorName;
              if (cName) setCounsellorName(cName);
              
              const cWhatsapp = student.counsellor_whatsapp || student.counsellorWhatsapp || student.counselor_whatsapp || student.counselorWhatsapp;
              if (cWhatsapp) setCounsellorWhatsapp(String(cWhatsapp));
              
              const wGroup = student.whatsapp_group_link || student.whatsappGroupLink || student.whatsapp_group;
              if (wGroup) setWhatsappGroupLink(wGroup);
              
              const derivedBranch = getBranchFromToken(token);
              setCounsellorBranch(derivedBranch);
            }
          }).catch(err => console.warn('Could not load profile details:', err));
      }
    }

    // 3. Fetch Events & Cutoffs & Colleges list
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

    fetch('/data/asmi_db.json')
      .then(res => res.json())
      .then(data => setAsmiDb(data))
      .catch(err => console.warn('asmi_db.json loading failed:', err));
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

  // Rank-based predictor matching (Cutoff Explorer logic)
  const getRankPredictedColleges = () => {
    const rank = parseInt(cpRankInput, 10);
    if (isNaN(rank)) return [];

    let filtered = collegeData.filter(c => {
      if (cpState !== 'All' && c.state !== cpState) return false;
      if (cpQuota !== 'All' && c.quota !== cpQuota) return false;
      return true;
    });

    const results = [];
    filtered.forEach(c => {
      const cCutoff = parseInt(c.cutoff, 10);
      if (isNaN(cCutoff)) return;

      const diff = cCutoff - rank;
      let chance = 'Out of Reach';
      let chanceClass = 'badge-reach';
      if (diff >= 500) {
        chance = 'Safe';
        chanceClass = 'badge-safe';
      } else if (diff >= 0) {
        chance = 'Likely';
        chanceClass = 'badge-likely';
      } else if (diff >= -1000) {
        chance = 'Borderline';
        chanceClass = 'badge-borderline';
      } else {
        return; // Skip out of reach colleges
      }

      results.push({
        ...c,
        closingRank: cCutoff,
        chance,
        chanceClass
      });
    });

    return results.sort((a, b) => a.closingRank - b.closingRank);
  };

  // Score-based predictor matching (Sales Dashboard logic)
  const getScorePredictedColleges = () => {
    const score = parseInt(cpScoreInput, 10);
    if (isNaN(score) || score < 200 || score > 720) return [];
    if (!asmiDb) return [];

    const results = [];
    const courseData = asmiDb["MH"]?.[cpScoreCourse] || {};
    const categoryData = courseData[cpCategory.toUpperCase()] || {};

    const types = ['mh_govt', 'mh_pvt', 'mh_iq'];
    types.forEach(t => {
      if (cpQuota !== 'All' && t !== cpQuota) return;
      const list = categoryData[t] || [];
      list.forEach(item => {
        const cCutoff = parseInt(item.c, 10);
        if (isNaN(cCutoff)) return;

        const gapVal = score - (cCutoff + 10);
        
        let status = '❌ Below';
        let statusClass = 'badge-reach';
        if (gapVal >= 0) {
          status = '✅ Safe';
          statusClass = 'badge-safe';
        } else if (gapVal >= -30) {
          status = '🟡 Poss';
          statusClass = 'badge-likely';
        } else if (gapVal >= -55) {
          status = '🟠 Str';
          statusClass = 'badge-borderline';
        } else {
          return; // Skip below colleges
        }

        results.push({
          name: item.n,
          cutoff: cCutoff,
          adjCutoff: cCutoff + 10,
          gap: gapVal,
          status,
          statusClass,
          type: t === 'mh_govt' ? 'Government' : t === 'mh_pvt' ? 'Private' : 'Institutional/NRI',
          course: cpScoreCourse
        });
      });
    });

    return results.sort((a, b) => b.cutoff - a.cutoff);
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

  // Institutes filters logic
  const getFilteredCollegesList = () => {
    let result = [...collegesList];

    if (instTabType !== 'All') {
      result = result.filter(
        (c) => c.type && c.type.toLowerCase() === instTabType.toLowerCase()
      );
    }

    if (instType !== 'All') {
      result = result.filter(
        (c) => c.type && c.type.toLowerCase() === instType.toLowerCase()
      );
    }

    if (instCourse !== 'All') {
      result = result.filter(
        (c) => c.course && c.course.toLowerCase() === instCourse.toLowerCase()
      );
    }

    if (instSelectedStates.length > 0) {
      result = result.filter((c) => instSelectedStates.includes(c.state));
    }

    if (instSearch) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(instSearch.toLowerCase())
      );
    }

    result = result.filter((c) => {
      if (c.annual_fees === null || c.annual_fees === undefined) {
        return true;
      }
      return c.annual_fees <= instMaxFees;
    });

    if (instSortBy === 'Recommended') {
      result.sort((a, b) => {
        const aRec = a.asmi_recommended ? 1 : 0;
        const bRec = b.asmi_recommended ? 1 : 0;
        return bRec - aRec;
      });
    } else if (instSortBy === 'Name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (instSortBy === 'Seats') {
      result.sort((a, b) => (b.seats || 0) - (a.seats || 0));
    }

    return result;
  };

  const uniqueStates = Array.from(
    new Set(collegesList.map((c) => c.state).filter(Boolean))
  ).sort();

  const filteredStatesList = uniqueStates.filter((state) =>
    state.toLowerCase().includes(instStateSearch.toLowerCase())
  );

  // Document checklist logic
  const selectedCategory = docCategory; 
  const selectedQuota = docQuota; 

  const sectionsToRender = [
    ...DOCS.sections,
    ...(selectedCategory !== 'General' && DOCS.category[selectedCategory] ? [DOCS.category[selectedCategory]] : []),
    ...(DOCS.quota[selectedQuota] ? [DOCS.quota[selectedQuota]] : []),
  ];

  const allIds = sectionsToRender.flatMap(s => s.docs.map(d => d.id));
  const doneCount = allIds.filter(id => checkedDocs.has(id)).length;
  const pct = allIds.length ? Math.round((doneCount / allIds.length) * 100) : 0;

  const resetChecklist = () => {
    if (confirm('Clear all checkmarks and start fresh?')) {
      const empty = new Set();
      setCheckedDocs(empty);
      saveChecklist(empty, docCategory, docQuota);
    }
  };

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
                        <a href={getWhatsAppLink(counsellorWhatsapp)} target="_blank" rel="noreferrer" style={{ flex: 1, minWidth: '120px', background: '#25d366', color: '#fff', borderRadius: '8px', padding: '8px 12px', fontSize: '11px', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          💬 Chat with Advisor
                        </a>
                        {whatsappGroupLink && whatsappGroupLink.trim() !== '' && (
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
                        <div key={idx} style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '100%' }}>
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
                    <button className={`chip ${cpInputMode === 'rank' ? 'active' : ''}`} onClick={() => { setCpInputMode('rank'); setCpQuota('All'); }}>Use NEET AIR</button>
                    <button className={`chip ${cpInputMode === 'score' ? 'active' : ''}`} onClick={() => { setCpInputMode('score'); setCpQuota('All'); }}>Use NEET Score</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                    {cpInputMode === 'rank' ? (
                      <div className="form-group">
                        <label className="form-label">All India Rank</label>
                        <input type="number" placeholder="e.g. 15000" className="form-input" value={cpRankInput} onChange={(e) => setCpRankInput(e.target.value)} />
                      </div>
                    ) : (
                      <>
                        <div className="form-group">
                          <label className="form-label">NEET Score</label>
                          <input type="number" placeholder="e.g. 620" className="form-input" value={cpScoreInput} onChange={(e) => setCpScoreInput(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Course</label>
                          <select className="form-select" value={cpScoreCourse} onChange={(e) => setCpScoreCourse(e.target.value)}>
                            <option value="MBBS">MBBS</option>
                            <option value="BDS">BDS</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="form-group">
                      <label className="form-label">State Preference</label>
                      <select className="form-select" value={cpState} onChange={(e) => setCpState(e.target.value)}>
                        <option value="All">All States</option>
                        {ceStates.map((st, i) => <option key={i} value={st}>{st}</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Quota Type</label>
                      <select className="form-select" value={cpQuota} onChange={(e) => setCpQuota(e.target.value)}>
                        {cpInputMode === 'rank' ? (
                          <>
                            <option value="All">All Quotas</option>
                            <option value="State">State Quota</option>
                            <option value="AIQ">All India Quota (AIQ)</option>
                            <option value="Open State">Open State Quota</option>
                          </>
                        ) : (
                          <>
                            <option value="All">All Quotas</option>
                            <option value="mh_govt">Government Quota</option>
                            <option value="mh_pvt">Private Quota</option>
                            <option value="mh_iq">Institutional / NRI Quota</option>
                          </>
                        )}
                      </select>
                    </div>


                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select className="form-select" value={cpCategory} onChange={(e) => setCpCategory(e.target.value)}>
                        {cpInputMode === 'rank' ? (
                          <>
                            <option value="Open">Open / General</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                          </>
                        ) : (
                          <>
                            <option value="Open">Open / General</option>
                            <option value="OBC">OBC</option>
                            <option value="SC">SC</option>
                            <option value="ST">ST</option>
                            <option value="EWS">EWS</option>
                            <option value="VJ">VJ (DT-A)</option>
                            <option value="NT1">NT-B (NT-1)</option>
                            <option value="NT2">NT-C (NT-2)</option>
                            <option value="NT3">NT-D (NT-3)</option>
                            <option value="SEBC">SEBC</option>
                            <option value="IQ">Institutional / NRI Quota</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  {cpInputMode === 'score' && cpState !== 'All' && cpState !== 'Maharashtra' && (
                    <div style={{ color: 'var(--yellow)', fontSize: '12px', marginBottom: 16, fontWeight: '700' }}>
                      ⚠️ Note: Score-based matching is calibrated for Maharashtra state colleges only.
                    </div>
                  )}

                  {/* College Results Table */}
                  <div style={{ marginTop: 24 }}>
                    <h3 style={{ fontSize: '14px', marginBottom: 12 }}>Eligible Colleges</h3>
                    <div className="table-container">
                      <table className="dense-table">
                        {cpInputMode === 'rank' ? (
                          <>
                            <thead>
                              <tr>
                                <th>College Name</th>
                                <th>State</th>
                                <th>Type</th>
                                <th>Quota</th>
                                <th>Closing Cutoff (AIR)</th>
                                <th>Chance</th>
                                <th>Shortlist</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getRankPredictedColleges().length === 0 ? (
                                <tr>
                                  <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                    Enter your Rank to view matching colleges.
                                  </td>
                                </tr>
                              ) : getRankPredictedColleges().map((c, i) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: '700' }}>{c.name}</td>
                                  <td>{c.state}</td>
                                  <td>{c.type}</td>
                                  <td>{c.quota}</td>
                                  <td>{c.closingRank?.toLocaleString() || '—'}</td>
                                  <td>
                                    <span className="chip active" style={{ 
                                      color: c.chance === 'Safe' ? 'var(--safe-color)' : c.chance === 'Likely' ? 'var(--likely-color)' : 'var(--borderline-color)',
                                      borderColor: c.chance === 'Safe' ? 'var(--safe-border)' : c.chance === 'Likely' ? 'var(--likely-border)' : 'var(--borderline-border)',
                                      background: c.chance === 'Safe' ? 'var(--safe-bg)' : c.chance === 'Likely' ? 'var(--likely-bg)' : 'var(--borderline-bg)',
                                      padding: '4px 8px', fontSize: '10px'
                                    }}>
                                      {c.chance}
                                    </span>
                                  </td>
                                  <td>
                                    <button onClick={() => handleToggleShortlist(c.name)} className="chip active" style={{ padding: '4px 8px', fontSize: '10px' }}>
                                      {shortlist.includes(c.name) ? '★ Shortlisted' : '☆ Add'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        ) : (
                          <>
                            <thead>
                              <tr>
                                <th>College Name</th>
                                <th>Course</th>
                                <th>Type</th>
                                <th>2025 Cutoff</th>
                                <th>Adj. Cutoff (+10)</th>
                                <th>Your Score</th>
                                <th>Gap</th>
                                <th>Status</th>
                                <th>Shortlist</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getScorePredictedColleges().length === 0 ? (
                                <tr>
                                  <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                                    Enter your Score to view matching colleges.
                                  </td>
                                </tr>
                              ) : getScorePredictedColleges().map((c, i) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: '700' }}>{c.name}</td>
                                  <td>{c.course}</td>
                                  <td>{c.type}</td>
                                  <td>{c.cutoff}</td>
                                  <td>{c.adjCutoff}</td>
                                  <td>{cpScoreInput}</td>
                                  <td style={{ color: c.gap >= 0 ? 'var(--safe-color)' : 'var(--reach-color)', fontWeight: '700' }}>
                                    {c.gap >= 0 ? `+${c.gap}` : c.gap}
                                  </td>
                                  <td>
                                    <span className="chip active" style={{ 
                                      color: c.status.includes('Safe') ? 'var(--safe-color)' : c.status.includes('Poss') ? 'var(--likely-color)' : 'var(--borderline-color)',
                                      borderColor: c.status.includes('Safe') ? 'var(--safe-border)' : c.status.includes('Poss') ? 'var(--likely-border)' : 'var(--borderline-border)',
                                      background: c.status.includes('Safe') ? 'var(--safe-bg)' : c.status.includes('Poss') ? 'var(--likely-bg)' : 'var(--borderline-bg)',
                                      padding: '4px 8px', fontSize: '10px'
                                    }}>
                                      {c.status}
                                    </span>
                                  </td>
                                  <td>
                                    <button onClick={() => handleToggleShortlist(c.name)} className="chip active" style={{ padding: '4px 8px', fontSize: '10px' }}>
                                      {shortlist.includes(c.name) ? '★ Shortlisted' : '☆ Add'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </>
                        )}
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
                                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, fontSize: '10px' }}>
                                    CLOSING RANK: {c.cutoff?.toLocaleString()}
                                  </span>
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
                              <th>State</th>
                              <th>Fees</th>
                              <th>Round 1 Closing Rank</th>
                            </tr>
                          </thead>
                          <tbody>
                            {collegeData.filter(c => c.name === ceSingleCollege).map((c, i) => (
                              <tr key={i}>
                                <td>{c.quota || 'All India'}</td>
                                <td>{c.state}</td>
                                <td>{c.fees ? `₹${parseInt(c.fees, 10).toLocaleString('en-IN')}` : '—'}</td>
                                <td style={{ fontWeight: '700', color: 'var(--yellow)' }}>{c.cutoff?.toLocaleString() || '—'}</td>
                              </tr>
                            ))}
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
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: 16 }}>🏫 Institutes Directory</h2>
                
                {/* Pill Tabs */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  {[
                    { label: 'All Colleges', value: 'All' },
                    { label: 'Private', value: 'Private' },
                    { label: 'Government', value: 'Government' },
                    { label: 'Deemed', value: 'Deemed' },
                    { label: 'AIIMS', value: 'AIIMS' },
                    { label: 'JIPMER', value: 'JIPMER' },
                    { label: 'Central', value: 'Central' },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setInstTabType(tab.value)}
                      className={`chip ${instTabType === tab.value ? 'active' : ''}`}
                      style={{ border: '1px solid var(--card-border)', background: instTabType === tab.value ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 255, 255, 0.04)' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
                  {/* Left Filters Sidebar */}
                  <div className="tool-card" style={{ flex: '1 1 260px', maxWidth: '300px', height: 'fit-content' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 10, marginBottom: 16 }}>
                      <span style={{ fontSize: '14px', fontWeight: '800' }}>Filters</span>
                      <button 
                        onClick={() => {
                          setInstSelectedStates([]);
                          setInstType('All');
                          setInstCourse('All');
                          setInstTabType('All');
                          setInstMaxFees(3000000);
                          setInstSortBy('Recommended');
                          setInstSearch('');
                          setInstStateSearch('');
                        }} 
                        style={{ background: 'none', border: 'none', color: 'var(--yellow)', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Reset all
                      </button>
                    </div>

                    {/* Stream checkboxes */}
                    <div style={{ marginBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: 12 }}>
                      <span className="form-label">Stream</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', cursor: 'pointer', marginBottom: 8 }}>
                        <input type="checkbox" checked={true} readOnly style={{ accentColor: 'var(--yellow)' }} />
                        <span>Medical</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', opacity: 0.5, cursor: 'not-allowed' }}>
                        <input type="checkbox" checked={false} disabled />
                        <span>Engineering <small>(Soon)</small></span>
                      </label>
                    </div>

                    {/* Search name */}
                    <div style={{ marginBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: 12 }}>
                      <span className="form-label">Search College</span>
                      <input type="text" placeholder="Search..." className="form-input" value={instSearch} onChange={(e) => setInstSearch(e.target.value)} style={{ padding: '8px 12px', fontSize: '12px' }} />
                    </div>

                    {/* State Multi-select */}
                    <div style={{ marginBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: 12 }}>
                      <span className="form-label">State</span>
                      <input type="text" placeholder="Search state..." className="form-input" value={instStateSearch} onChange={(e) => setInstStateSearch(e.target.value)} style={{ padding: '6px 10px', fontSize: '11px', marginBottom: 8 }} />
                      <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
                        {filteredStatesList.map((state) => (
                          <label key={state} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={instSelectedStates.includes(state)} 
                              onChange={() => {
                                setInstSelectedStates(prev => 
                                  prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
                                );
                              }}
                              style={{ accentColor: 'var(--yellow)' }} 
                            />
                            <span>{state}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Type Dropdown */}
                    <div style={{ marginBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: 12 }}>
                      <span className="form-label">University Type</span>
                      <select className="form-select" value={instType} onChange={(e) => setInstType(e.target.value)} style={{ padding: '8px 10px', fontSize: '12px' }}>
                        <option value="All">All Colleges</option>
                        <option value="AIIMS">AIIMS</option>
                        <option value="Government">Government</option>
                        <option value="Private">Private</option>
                        <option value="Deemed">Deemed</option>
                        <option value="JIPMER">JIPMER</option>
                        <option value="Central">Central</option>
                        <option value="AFMC">AFMC</option>
                        <option value="Govt. Society">Govt. Society</option>
                      </select>
                    </div>

                    {/* Course Dropdown */}
                    <div style={{ marginBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: 12 }}>
                      <span className="form-label">Course</span>
                      <select className="form-select" value={instCourse} onChange={(e) => setInstCourse(e.target.value)} style={{ padding: '8px 10px', fontSize: '12px' }}>
                        <option value="All">All Courses</option>
                        <option value="MBBS">MBBS</option>
                        <option value="BDS">BDS</option>
                        <option value="BPTH">BPTH</option>
                        <option value="BAMS">BAMS</option>
                        <option value="BHMS">BHMS</option>
                      </select>
                    </div>

                    {/* Sort By Dropdown */}
                    <div style={{ marginBottom: 16, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: 12 }}>
                      <span className="form-label">Sort By</span>
                      <select className="form-select" value={instSortBy} onChange={(e) => setInstSortBy(e.target.value)} style={{ padding: '8px 10px', fontSize: '12px' }}>
                        <option value="Recommended">ASMI Recommended</option>
                        <option value="Name">Name A–Z</option>
                        <option value="Seats">Seats (High to Low)</option>
                      </select>
                    </div>

                    {/* Fees range slider */}
                    <div style={{ paddingBottom: 0 }}>
                      <span className="form-label">Annual Fees Range</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="3000000" 
                        step="50000" 
                        value={instMaxFees} 
                        onChange={(e) => setInstMaxFees(Number(e.target.value))} 
                        style={{ width: '100%', accentColor: 'var(--yellow)', cursor: 'pointer', marginBottom: 6 }} 
                      />
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--yellow)' }}>
                        Up to {instMaxFees === 3000000 ? 'No Limit' : `₹${instMaxFees.toLocaleString('en-IN')}`}
                      </div>
                    </div>
                  </div>

                  {/* Right Colleges Grid */}
                  <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      Showing <strong>{getFilteredCollegesList().length}</strong> college{getFilteredCollegesList().length !== 1 ? 's' : ''} matching your criteria.
                    </div>
                    
                    {getFilteredCollegesList().length === 0 ? (
                      <div className="tool-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', borderStyle: 'dashed' }}>
                        No colleges found. Try adjusting your filters.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {getFilteredCollegesList().slice(0, 48).map((college) => {
                          const isShortlisted = shortlist.includes(college.name);
                          return (
                            <a 
                              href={`/medical/colleges/${college.slug}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              key={college.slug} 
                              style={{ display: 'block', textDecoration: 'none', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s', position: 'relative' }}
                            >
                              <div style={{ width: '100%', aspectRatio: '4/3', background: college.photo ? `url(/images/colleges/${college.slug}.jpg) center/cover` : (college.photo_placeholder_color || '#1a0040'), position: 'relative' }}>
                                {college.asmi_recommended && (
                                  <span style={{ position: 'absolute', bottom: 10, left: 10, background: 'var(--yellow)', color: '#080112', fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '4px' }}>
                                    ★ ASMI RECOMMENDS
                                  </span>
                                )}
                                {college.asmi_pulse_score && (
                                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.9)', color: '#080112', fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '4px' }}>
                                    ★ {college.asmi_pulse_score}/5
                                  </span>
                                )}
                                <button 
                                  onClick={(e) => { 
                                    e.preventDefault(); 
                                    e.stopPropagation(); 
                                    handleToggleShortlist(college.name); 
                                  }} 
                                  style={{ position: 'absolute', bottom: 10, right: 10, width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isShortlisted ? '#dc2626' : '#6a0dad', fontSize: '14px' }}
                                >
                                  {isShortlisted ? '♥' : '♡'}
                                </button>
                              </div>
                              <div style={{ padding: 12 }}>
                                <div style={{ display: 'flex', gap: 8, fontSize: '10px', color: 'var(--yellow)', fontWeight: '700', marginBottom: 4 }}>
                                  {college.city && <span>📍 {college.city}</span>}
                                  <span>🎓 {college.type}</span>
                                </div>
                                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '13px', fontWeight: '800', color: '#fff', lineHeight: '1.4', marginBottom: 4, height: '36px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                  {college.name}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {college.seats ? `${college.seats} ${college.course || 'MBBS'} seats` : ''} 
                                  {college.annual_fees ? ` · ${formatFees(college.annual_fees)}` : ''}
                                </div>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── VIEW: DOCUMENTS CHECKLIST ── */}
            {activeTab === 'checklist' && (
              <div className="tool-card">
                <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: 16 }}>📋 Documents Checklist</h2>
                
                {/* Profile Selector */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8 }}>Your Category</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {['General', 'OBC', 'SC', 'ST', 'EWS'].map(cat => (
                      <button key={cat} className={`chip ${docCategory === cat ? 'active' : ''}`} onClick={() => { setDocCategory(cat); saveChecklist(checkedDocs, cat, docQuota); }}>
                        {cat === 'General' ? 'General / UR' : cat === 'OBC' ? 'OBC (NCL)' : cat}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: 8 }}>Quota Type</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['State', 'AIQ', 'Management'].map(q => (
                      <button key={q} className={`chip ${docQuota === q ? 'active' : ''}`} onClick={() => { setDocQuota(q); saveChecklist(checkedDocs, docCategory, q); }}>
                        {q === 'State' ? 'State Quota (Maharashtra)' : q === 'AIQ' ? 'All India Quota (AIQ)' : 'Management / NRI'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--yellow)', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                    {doneCount} of {allIds.length} ready ({pct}%)
                  </span>
                </div>

                {/* Attestation Tip Callout */}
                <div style={{ background: 'rgba(255, 215, 0, 0.05)', border: '1px solid rgba(255, 215, 0, 0.15)', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: '12px', color: 'var(--text-light)', lineHeight: '1.5' }}>
                  <strong>💡 Attestation tip:</strong> &quot;Self-attested&quot; means you sign and write &quot;True Copy&quot; on the photocopy yourself. &quot;Attested copy&quot; means a gazetted officer, notary, or school principal signs it. Always carry a few extra copies.
                </div>

                {/* Checklist Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sectionsToRender.map((section, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 12, padding: '16px 20px', border: '1px solid var(--card-border)' }}>
                      <h3 style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--yellow)', marginBottom: 12 }}>
                        {section.title}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {section.docs.map((doc) => {
                          const isChecked = checkedDocs.has(doc.id);
                          return (
                            <div key={doc.id} onClick={() => toggleDocChecked(doc.id)} style={{ display: 'flex', gap: 16, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', background: isChecked ? 'rgba(91,30,158,0.08)' : 'transparent', borderRadius: 8 }}>
                              <div style={{ width: '20px', height: '20px', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--yellow)', fontSize: '12px', fontWeight: '800', flexShrink: 0 }}>
                                {isChecked ? '✓' : ''}
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{doc.label}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>{doc.copies}</div>
                                {doc.note && <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 2 }}>{doc.note}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reset button */}
                <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                  <button onClick={() => window.print()} className="chip" style={{ color: '#fff', borderColor: 'var(--card-border)' }}>
                    Print Checklist 🖨️
                  </button>
                  <button onClick={resetChecklist} className="chip" style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    Reset Checklist 🔄
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

