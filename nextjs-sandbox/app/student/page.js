'use client';

import { useState, useEffect } from 'react';
import './dashboard.css';

// ── Helper functions ──────────────────────────────────────────────────────────
const getBranchFromToken = (token) => {
  if (!token) return 'ASMI Career Network';
  const tok = String(token).toUpperCase();
  if (tok.includes('MUM')) return 'Mumbai Branch Office';
  if (tok.includes('PUN') || tok.includes('PNE')) return 'Pune Branch Office';
  if (tok.includes('NGP') || tok.includes('NAG')) return 'Nagpur Branch Office';
  if (tok.includes('KOL')) return 'Kolhapur Branch Office';
  if (tok.includes('SAN')) return 'Sangli Branch Office';
  if (tok.includes('CSN') || tok.includes('SAM')) return 'Chh. Sambhajinagar Branch Office';
  if (tok.includes('THN') || tok.includes('THA')) return 'Thane Branch Office';
  if (tok.includes('NSK') || tok.includes('NAS')) return 'Nashik Branch Office';
  return 'ASMI Regional Branch';
};

const getWhatsAppLink = (number) => {
  if (!number) return 'https://wa.me/917410019074';
  const cleanNum = String(number).replace(/\D/g, '');
  return 'https://wa.me/' + (cleanNum.startsWith('91') ? cleanNum : '91' + cleanNum);
};

const cleanFee = (feesStr) => {
  if (!feesStr) return 0;
  return parseInt(String(feesStr).replace(/[^0-9]/g, ''), 10) || 0;
};

const formatFees = (feesStr) => {
  const rawFee = cleanFee(feesStr);
  if (rawFee === 0) return '₹ — / yr';
  if (rawFee < 100000) return `₹${rawFee.toLocaleString('en-IN')} / yr`;
  const lakhs = (rawFee / 100000).toFixed(2);
  return `₹${lakhs} L / yr`;
};

// ── Document Schema ───────────────────────────────────────────────────────────
const DOCS = {
  sections: [
    {
      title: 'Academic Documents',
      docs: [
        { id: 'neet-admit',   label: 'NEET Admit Card',                          copies: 'Original + 2 self-attested photocopies' },
        { id: 'neet-score',   label: 'NEET Scorecard / Rank Letter',             copies: 'Original + 2 self-attested photocopies' },
        { id: 'cls10-mark',   label: 'Class 10 Marksheet',                       copies: 'Original + 3 attested photocopies', note: 'Required as date of birth proof' },
        { id: 'cls10-cert',   label: 'Class 10 Passing Certificate',             copies: 'Original + 3 attested photocopies' },
        { id: 'cls12-mark',   label: 'Class 12 Marksheet',                       copies: 'Original + 3 attested photocopies' },
        { id: 'cls12-cert',   label: 'Class 12 Passing Certificate / School Leaving', copies: 'Original + 3 attested photocopies' },
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
        { id: 'medical-fit', label: 'Medical Fitness Certificate', copies: "Original on doctor's letterhead", note: 'From a registered MBBS doctor' },
      ]
    },
  ],
  category: {
    OBC: {
      title: 'OBC Category Documents',
      docs: [
        { id: 'obc-cert', label: 'OBC Certificate',                    copies: 'Original + 2 attested photocopies', note: 'Central format for AIQ; state format for State Quota' },
        { id: 'ncl-cert', label: 'Non-Creamy Layer (NCL) Certificate', copies: 'Original + 2 attested photocopies', note: 'Must be issued within the last 1 year; annual family income below ₹8 lakh' },
      ]
    },
    SC: {
      title: 'SC Category Documents',
      docs: [
        { id: 'caste-sc',    label: 'Caste Certificate (SC)',    copies: 'Original + 2 attested photocopies' },
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
        { id: 'ews-cert',    label: 'EWS Certificate',   copies: 'Original + 2 attested photocopies', note: 'Current financial year; issued by Tehsildar or SDO' },
        { id: 'income-cert', label: 'Income Certificate', copies: 'Original + 1 photocopy', note: 'Annual family income below ₹8 lakh' },
      ]
    },
  },
  quota: {
    AIQ: {
      title: 'All India Quota (AIQ) Documents',
      docs: [
        { id: 'mcc-reg',       label: 'MCC Registration Printout',  copies: '2 photocopies', note: 'Print from the MCC NEET UG counselling portal' },
        { id: 'mcc-allotment', label: 'AIQ Seat Allotment Letter',  copies: 'Original + 2 photocopies', note: 'Download from MCC portal after seat allotment round' },
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
        { id: 'fee-receipt',    label: 'Fee Payment Receipt',                    copies: '2 photocopies', note: 'If partial fee was collected at time of allotment' },
      ]
    },
  }
};

// ── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',      icon: 'lucide:layout-dashboard' },
  { id: 'predictor',  label: 'Predictor',       icon: 'lucide:bar-chart-3'      },
  { id: 'cutoff',     label: 'Cutoff Explorer', icon: 'lucide:search'           },
  { id: 'institutes', label: 'Institutes',      icon: 'lucide:building-2'       },
  { id: 'checklist',  label: 'Documents',       icon: 'lucide:file-text'        },
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [studentName, setStudentName] = useState('Student');
  const [studentRank, setStudentRank] = useState(null);
  const [studentScore, setStudentScore] = useState(null);
  const [shortlist, setShortlist] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [collegeData, setCollegeData] = useState([]);
  const [collegesList, setCollegesList] = useState([]);
  const [checkedDocs, setCheckedDocs] = useState(new Set());
  const [docCategory, setDocCategory] = useState('General');
  const [docQuota, setDocQuota] = useState('State');
  const [studentCategory, setStudentCategory] = useState(null); // null = not yet set from token

  // Counsellor
  const [counsellorName, setCounsellorName] = useState('ASMI Counsellor');
  const [counsellorWhatsapp, setCounsellorWhatsapp] = useState('917410019074');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [counsellorBranch, setCounsellorBranch] = useState('ASMI Career Network');
  const [progressSteps, setProgressSteps] = useState([
    { id: 1, label: 'Profile',     status: 'completed' },
    { id: 2, label: 'Counselling', status: 'active' },
    { id: 3, label: 'Shortlist',   status: 'pending' },
    { id: 4, label: 'Admission',   status: 'pending' }
  ]);

  // Rank Predictor
  const [predictorScore, setPredictorScore] = useState('');
  const [predictedRank, setPredictedRank] = useState(null);

  // College Predictor — shared
  const [cpInputMode, setCpInputMode] = useState('rank');

  // College Predictor — rank tab (full Cutoff Explorer logic)
  const [cpRankInput, setCpRankInput] = useState('');
  const [cpSelectedStates, setCpSelectedStates] = useState([]);  // multi-select
  const [cpStateSearch, setCpStateSearch] = useState('');
  const [cpSelectedTypes, setCpSelectedTypes] = useState([]);    // multi-select
  const [cpQuota, setCpQuota] = useState('All');
  const [cpMaxBudget, setCpMaxBudget] = useState(3000000);
  const [cpSortBy, setCpSortBy] = useState('chance');            // chance | fees_asc | fees_desc | name
  const [cpSearchFilter, setCpSearchFilter] = useState('');

  // College Predictor — score tab
  const [cpScoreInput, setCpScoreInput] = useState('');
  const [cpState, setCpState] = useState('All');                 // kept for score tab
  const [cpCategory, setCpCategory] = useState('Open');
  const [cpScoreCourse, setCpScoreCourse] = useState('MBBS');

  // Cutoff Explorer
  const [ceViewMode, setCeViewMode] = useState('database');
  const [ceCollegeSearch, setCeCollegeSearch] = useState('');
  const [ceState, setCeState] = useState('All');
  const [ceSingleCollege, setCeSingleCollege] = useState('');

  // Institutes
  const [instSearch, setInstSearch] = useState('');
  const [instStateSearch, setInstStateSearch] = useState('');
  const [instSelectedStates, setInstSelectedStates] = useState([]);
  const [instType, setInstType] = useState('All');
  const [instCourse, setInstCourse] = useState('All');
  const [instSortBy, setInstSortBy] = useState('Recommended');
  const [instMaxFees, setInstMaxFees] = useState(3000000);
  const [instTabType, setInstTabType] = useState('All');

  // Score DB
  const [asmiDb, setAsmiDb] = useState(null);
  const [feeMap, setFeeMap] = useState({});
  const [cpPoolFilter, setCpPoolFilter] = useState('All');
  const [cpTypeFilter, setCpTypeFilter] = useState('All');

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
      const low = scoreToRankMap[i + 1];
      if (score <= high.s && score >= low.s) {
        const ratio = (score - low.s) / (high.s - low.s);
        return Math.round(low.r + (high.r - low.r) * (1 - ratio));
      }
    }
    return 850000;
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) setActiveTab(tab);

      if (localStorage.getItem('sidebar_collapsed')) setSidebarCollapsed(true);
      setStudentName(localStorage.getItem('name') || 'Student');
      const savedRank = localStorage.getItem('rank');
      if (savedRank) setStudentRank(parseInt(savedRank, 10));
      const savedScore = localStorage.getItem('score');
      if (savedScore) setStudentScore(parseInt(savedScore, 10));

      try {
        const sList = JSON.parse(localStorage.getItem('shortlist')) || [];
        setShortlist(sList.map(c => typeof c === 'object' ? c.name : c));
      } catch(e) {}

      try {
        const saved = JSON.parse(localStorage.getItem('asmi-checklist') || '{}');
        setCheckedDocs(new Set(saved.checked || []));
        setDocCategory(saved.category || 'General');
        setDocQuota(saved.quota || 'State');
      } catch(e) {}

      // params already defined at top of useEffect
      const token = params.get('token');
      if (token && token.trim() !== '') {
        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyL1UC5_EGNPKZcitbkQ38HOnKzgj5ObTZGroPcH0kpyHtjY-SpYYtyl3_jH0-rUR-x/exec';
        fetch(`${APPS_SCRIPT_URL}?action=getStudent&token=${encodeURIComponent(token)}`)
          .then(res => res.json())
          .then(res => {
            if (res.success && res.data) {
              const s = res.data;
              console.log('[ASMI] student data:', s);
              if (s.name) { setStudentName(s.name); localStorage.setItem('name', s.name); }
              const rawRank = s.rank || s.neet_rank || s.air;
              const rawScore = s.score || s.neet_score;
              const parsedRank = (rawRank && rawRank !== 0) ? parseInt(rawRank, 10) : null;
              const parsedScore = (rawScore && rawScore !== 0) ? parseInt(rawScore, 10) : null;
              if (parsedRank)  { setStudentRank(parsedRank);   localStorage.setItem('rank', parsedRank); }
              if (parsedScore) { setStudentScore(parsedScore); localStorage.setItem('score', parsedScore); }
              if (s.colleges || s.shortlist) {
                const sl = (s.colleges || s.shortlist || []).map(c => typeof c === 'object' ? c.name : c);
                setShortlist(sl); localStorage.setItem('shortlist', JSON.stringify(sl));
              }
              if (s.category) {
                const cat = String(s.category).toUpperCase();
                const resolvedCat = cat.includes('OBC') ? 'OBC'
                  : cat.includes('SC') ? 'SC'
                  : cat.includes('ST') ? 'ST'
                  : cat.includes('EWS') ? 'EWS'
                  : 'General';
                setDocCategory(resolvedCat);
                setStudentCategory(resolvedCat);
                try {
                  const saved = JSON.parse(localStorage.getItem('asmi-checklist') || '{}');
                  localStorage.setItem('asmi-checklist', JSON.stringify({ ...saved, category: resolvedCat }));
                } catch(e) {}
              }
              if (s.quota) {
                const q = String(s.quota).toUpperCase();
                setDocQuota(
                  q.includes('AIQ') ? 'AIQ'
                  : (q.includes('MQ') || q.includes('MANAGEMENT') || q.includes('NRI')) ? 'Management'
                  : 'State'
                );
              }
              if (s.stage) {
                const stages = ["Enrolled", "Documents Verified", "Counselled", "Preferences Filed", "Round 1", "Allotted"];
                const idx = stages.findIndex(st => st.toLowerCase() === String(s.stage).toLowerCase().trim());
                if (idx !== -1) {
                  setProgressSteps(stages.map((st, i) => ({
                    id: i + 1, label: st,
                    status: i < idx ? 'completed' : (i === idx ? 'active' : 'pending')
                  })));
                }
              }
              const cName = s.counsellor_name || s.counsellorName || s.counselor_name || s.counselorName;
              if (cName) setCounsellorName(cName);
              const cWa = s.counsellor_whatsapp || s.counsellorWhatsapp || s.counselor_whatsapp || s.counselorWhatsapp;
              if (cWa) setCounsellorWhatsapp(String(cWa));
              const wGroup = s.whatsapp_group_link || s.whatsappGroupLink || s.whatsapp_group;
              if (wGroup) setWhatsappGroupLink(wGroup);
              setCounsellorBranch(getBranchFromToken(token));
            }
          }).catch(err => console.warn('Profile fetch failed:', err));
      }
    }

    fetch('/data/events.json')
      .then(r => r.json())
      .then(data => {
        const today = new Date().toISOString().split('T')[0];
        setDeadlines(
          data.filter(ev => (ev.expiry_date ? ev.expiry_date.split('T')[0] : ev.date) >= today)
            .map(ev => ({ title: ev.title, date: ev.date, tag: ev.tag || 'NOTICE' }))
            .sort((a, b) => new Date(a.date) - new Date(b.date))
        );
      }).catch(() => {});

    fetch('/data/rank_db.json').then(r => r.json()).then(setCollegeData).catch(() => {});
    fetch('/data/colleges.json').then(r => r.json()).then(setCollegesList).catch(() => {});
    fetch('/data/asmi_db.json').then(r => r.json()).then(setAsmiDb).catch(() => {});
    fetch('/fee_map.json').then(r => r.json()).then(setFeeMap).catch(() => {});
  }, []);

  // Checklist helpers
  const saveChecklist = (set, cat, quota) => {
    setCheckedDocs(set);
    localStorage.setItem('asmi-checklist', JSON.stringify({ checked: Array.from(set), category: cat, quota }));
  };

  const toggleDoc = (id) => {
    const next = new Set(checkedDocs);
    next.has(id) ? next.delete(id) : next.add(id);
    saveChecklist(next, docCategory, docQuota);
  };

  // Predictors
  const handlePredictRank = () => {
    const score = parseInt(predictorScore, 10);
    if (isNaN(score) || score < 200 || score > 720) { alert('Enter a valid NEET score between 200 and 720.'); return; }
    setPredictedRank(getRankFromScore(score));
  };

  // ── Chance label (mirrors the live Cutoff Explorer tool) ──────────────────
  // High  = closing rank ≥ your rank * 1.10  (comfortable buffer)
  // Med   = closing rank ≥ your rank          (within range)
  // Low   = closing rank ≥ your rank * 0.92  (slight stretch, within 8%)
  // (records outside Low range are excluded from results)
  const getChance = (cutoff, rank) => {
    if (cutoff >= rank * 1.10) return { label: 'High',   cls: 'badge-safe',       sort: 0 };
    if (cutoff >= rank)        return { label: 'Med',    cls: 'badge-likely',     sort: 1 };
    if (cutoff >= rank * 0.92) return { label: 'Low',    cls: 'badge-borderline', sort: 2 };
    return null; // excluded
  };

  const getRankPredictedColleges = () => {
    const rank = parseInt(cpRankInput, 10);
    if (isNaN(rank) || rank < 1) return [];

    let results = [];
    for (const c of collegeData) {
      const cutoff = parseInt(c.cutoff, 10);
      if (isNaN(cutoff)) continue;

      // Budget filter
      const fee = parseInt(c.fees, 10) || 0;
      if (fee > 0 && fee > cpMaxBudget) continue;

      // Quota filter
      if (cpQuota !== 'All' && c.quota !== cpQuota) continue;

      // Multi-state filter
      if (cpSelectedStates.length > 0 && !cpSelectedStates.includes(c.state)) continue;

      // Multi-type filter
      if (cpSelectedTypes.length > 0 && !cpSelectedTypes.includes(c.type)) continue;

      // Name search filter
      if (cpSearchFilter && !c.name.toLowerCase().includes(cpSearchFilter.toLowerCase())) continue;

      // Chance calc (excludes records beyond Low)
      const chance = getChance(cutoff, rank);
      if (!chance) continue;

      results.push({ ...c, closingRank: cutoff, chance: chance.label, chanceClass: chance.cls, chanceSort: chance.sort });
    }

    // Sort
    if (cpSortBy === 'chance')     results.sort((a, b) => a.chanceSort - b.chanceSort || a.closingRank - b.closingRank);
    else if (cpSortBy === 'rank')  results.sort((a, b) => a.closingRank - b.closingRank);
    else if (cpSortBy === 'fees_asc')  results.sort((a, b) => (parseInt(a.fees,10)||0) - (parseInt(b.fees,10)||0));
    else if (cpSortBy === 'fees_desc') results.sort((a, b) => (parseInt(b.fees,10)||0) - (parseInt(a.fees,10)||0));
    else if (cpSortBy === 'name')  results.sort((a, b) => a.name.localeCompare(b.name));

    return results;
  };

  const prob = (score, cutoff) => {
    const gap = score - (cutoff + 15);
    if (gap >= 15)  return { key: 'safe',       label: 'Safe',        cls: 'badge-safe' };
    if (gap >= 0)   return { key: 'likely',     label: 'Likely',      cls: 'badge-likely' };
    if (gap >= -10) return { key: 'borderline', label: 'Borderline',  cls: 'badge-borderline' };
    return                 { key: 'reach',      label: 'Out of Reach', cls: 'badge-reach' };
  };

  const getCategoryKeys = (category) => {
    const cat = category.toUpperCase();
    const m = {
      'OPEN': ['OPEN'],
      'GENERAL': ['OPEN'],
      'OBC': ['OBC', 'OPEN'],
      'SC': ['SC', 'OPEN'],
      'ST': ['ST', 'OPEN'],
      'EWS': ['EWS', 'OPEN'],
      'SEBC': ['SEBC', 'OPEN'],
      'VJ': ['VJ', 'OPEN'],
      'NT1': ['NT1', 'OPEN'],
      'NT2': ['NT2', 'OPEN'],
      'NT3': ['NT3', 'OPEN'],
      'IQ': ['IQ', 'OPEN']
    };
    return m[cat] || ['OPEN'];
  };

  const getMHCollegesList = (course, listType, userCat, score) => {
    if (!asmiDb || !asmiDb.MH || !asmiDb.MH[course]) return [];
    
    const openList = asmiDb.MH[course]?.OPEN?.[listType] || [];
    const catList = (userCat !== 'Open' && userCat !== 'General' && userCat !== 'IQ')
      ? (asmiDb.MH[course]?.[userCat.toUpperCase()]?.[listType] || [])
      : (userCat === 'IQ' && listType === 'mh_iq')
        ? (asmiDb.MH[course]?.IQ?.mh_iq || [])
        : [];
        
    const openMap = new Map(openList.map(c => [c.n, c.c]));
    const catMap = new Map(catList.map(c => [c.n, c.c]));
    const allNames = new Set([...openMap.keys(), ...catMap.keys()]);
    const cols = [];
    allNames.forEach(name => {
      const openC = openMap.has(name) ? openMap.get(name) : null;
      const catC = catMap.has(name) ? catMap.get(name) : null;
      const bestC = Math.min(openC ?? Infinity, catC ?? Infinity);
      if (bestC === Infinity) return;
      
      const p = prob(score, bestC);
      cols.push({
        name,
        cutoff: bestC,
        projected: bestC + 15,
        chance: p.label,
        chanceKey: p.key,
        chanceClass: p.cls,
        state: 'Maharashtra',
        pool: 'MH State',
        type: listType === 'mh_govt' ? 'Government' : 'Private'
      });
    });
    return cols;
  };

  const getMCCCollegesList = (course, userCat, score) => {
    const keys = getCategoryKeys(userCat);
    const results = [];
    
    const addColleges = (stateKey, courseKey, catKeysList, listType, type) => {
      if (!asmiDb || !asmiDb[stateKey] || !asmiDb[stateKey][courseKey]) return;
      const seen = new Map();
      catKeysList.forEach(catKey => {
        const d = asmiDb[stateKey][courseKey][catKey];
        if (!d || !d[listType]) return;
        d[listType].forEach(col => {
          const p = prob(score, col.c);
          const entry = {
            name: col.n,
            state: col.s || 'India',
            cutoff: col.c,
            projected: col.c + 15,
            chance: p.label,
            chanceKey: p.key,
            chanceClass: p.cls,
            pool: 'MCC AIQ',
            type
          };
          if (!seen.has(col.n)) {
            seen.set(col.n, entry);
          } else if (col.c < seen.get(col.n).cutoff) {
            seen.set(col.n, entry);
          }
        });
      });
      results.push(...seen.values());
    };

    addColleges('AIQ', course, keys, 'aiq', 'Government');
    if (course === 'MBBS') {
      addColleges('AIIMS', 'MBBS', keys, 'aiims', 'Government');
      addColleges('JIPMER', 'MBBS', keys, 'jipmer', 'Government');
    }
    addColleges('CENTRAL', course, keys, 'central', 'Government');
    addColleges('DEEMED', course, ['OPEN'], 'deemed', 'Deemed');

    return results;
  };

  const getOpenStateCollegesList = (course, score) => {
    if (course !== 'MBBS') return [];
    const results = [];
    const OPEN_STATES = ['KA', 'TS', 'TN', 'UP', 'KL', 'AP', 'HR', 'WB', 'BR', 'UK', 'CG', 'JH', 'HP', 'PY', 'TR', 'MN', 'ML', 'SK'];
    const STATE_LABELS = {
      KA:'Karnataka', TS:'Telangana', TN:'Tamil Nadu', UP:'Uttar Pradesh',
      UK:'Uttarakhand', PY:'Pondicherry', WB:'West Bengal', MN:'Manipur', ML:'Meghalaya',
      AP:'Andhra Pradesh', BR:'Bihar', HR:'Haryana', JH:'Jharkhand', CG:'Chhattisgarh',
      KL:'Kerala', HP:'Himachal Pradesh', TR:'Tripura', SK:'Sikkim'
    };

    OPEN_STATES.forEach(stKey => {
      if (!asmiDb || !asmiDb[stKey] || !asmiDb[stKey]['MBBS']) return;
      const seen = new Map();
      
      ['open_pvt', 'mgmt_quota'].forEach(listType => {
        const d = asmiDb[stKey]['MBBS']['OPEN'];
        if (!d || !d[listType]) return;
        d[listType].forEach(col => {
          const p = prob(score, col.c);
          const entry = {
            name: col.n,
            state: STATE_LABELS[stKey] || stKey,
            cutoff: col.c,
            projected: col.c + 15,
            chance: p.label,
            chanceKey: p.key,
            chanceClass: p.cls,
            pool: 'Open State',
            type: 'Private'
          };
          if (!seen.has(col.n)) {
            seen.set(col.n, entry);
          } else if (col.c < seen.get(col.n).cutoff) {
            seen.set(col.n, entry);
          }
        });
      });
      results.push(...seen.values());
    });
    return results;
  };

  const getScorePredictedColleges = () => {
    const score = parseInt(cpScoreInput, 10);
    if (isNaN(score) || score < 200 || score > 720 || !asmiDb) return [];
    
    const course = cpScoreCourse;
    const userCat = cpCategory;
    
    const results = [];
    
    // 1. MH State Pool
    if (asmiDb.MH && asmiDb.MH[course]) {
      const mhGovt = getMHCollegesList(course, 'mh_govt', userCat, score);
      const mhPvt = getMHCollegesList(course, 'mh_pvt', userCat, score);
      const mhIq = (userCat === 'IQ') ? getMHCollegesList(course, 'mh_iq', userCat, score) : [];
      results.push(...mhGovt, ...mhPvt, ...mhIq);
    }
    
    // 2. MCC AIQ Pool
    const mccColleges = getMCCCollegesList(course, userCat, score);
    results.push(...mccColleges);
    
    // 3. Open State Pool
    if (course === 'MBBS') {
      const openStateColleges = getOpenStateCollegesList(course, score);
      results.push(...openStateColleges);
    }
    
    // Filter
    let filtered = [...results];
    
    if (cpPoolFilter !== 'All') {
      filtered = filtered.filter(c => c.pool === cpPoolFilter);
    }
    
    if (cpTypeFilter !== 'All') {
      filtered = filtered.filter(c => c.type === cpTypeFilter);
    }
    
    // Sort
    filtered.sort((a, b) => b.cutoff - a.cutoff);
    
    return filtered;
  };

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar_collapsed', next ? '1' : '');
  };

  const handleToggleShortlist = (name) => {
    const next = shortlist.includes(name) ? shortlist.filter(n => n !== name) : [...shortlist, name];
    setShortlist(next);
    localStorage.setItem('shortlist', JSON.stringify(next));
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

  const ceStates   = Array.from(new Set(collegeData.map(c => c.state))).sort();
  const ceColleges = Array.from(new Set(collegeData.map(c => c.name))).sort();
  const uniqueStates = Array.from(new Set(collegesList.map(c => c.state).filter(Boolean))).sort();
  const filteredStatesList = uniqueStates.filter(s => s.toLowerCase().includes(instStateSearch.toLowerCase()));

  const getFilteredCollegesList = () => {
    let r = [...collegesList];
    if (instTabType !== 'All') r = r.filter(c => c.type?.toLowerCase() === instTabType.toLowerCase());
    if (instType !== 'All')    r = r.filter(c => c.type?.toLowerCase() === instType.toLowerCase());
    if (instCourse !== 'All')  r = r.filter(c => c.course?.toLowerCase() === instCourse.toLowerCase());
    if (instSelectedStates.length > 0) r = r.filter(c => instSelectedStates.includes(c.state));
    if (instSearch) r = r.filter(c => c.name.toLowerCase().includes(instSearch.toLowerCase()));
    r = r.filter(c => c.annual_fees == null || c.annual_fees <= instMaxFees);
    if (instSortBy === 'Recommended') r.sort((a, b) => (b.asmi_recommended ? 1 : 0) - (a.asmi_recommended ? 1 : 0));
    else if (instSortBy === 'Name')  r.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (instSortBy === 'Seats') r.sort((a, b) => (b.seats || 0) - (a.seats || 0));
    return r;
  };

  const sectionsToRender = [
    ...DOCS.sections,
    ...(docCategory !== 'General' && DOCS.category[docCategory] ? [DOCS.category[docCategory]] : []),
    ...(DOCS.quota[docQuota] ? [DOCS.quota[docQuota]] : []),
  ];
  const allIds = sectionsToRender.flatMap(s => s.docs.map(d => d.id));
  const doneCount = allIds.filter(id => checkedDocs.has(id)).length;
  const pct = allIds.length ? Math.round((doneCount / allIds.length) * 100) : 0;

  const initials = studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const counsellorInitials = counsellorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  // Progress line width
  const completedCount = progressSteps.filter(s => s.status === 'completed').length;
  const activeIdx = progressSteps.findIndex(s => s.status === 'active');
  const progressPct = progressSteps.length > 1
    ? ((completedCount + (activeIdx !== -1 ? 0.5 : 0)) / (progressSteps.length - 1)) * 100
    : 0;

  // ── Tag helper for deadline type
  const getDeadlineTag = (tag) => {
    const t = (tag || '').toUpperCase();
    if (t.includes('EXAM')) return 'tag-blue';
    if (t.includes('URGENT') || t.includes('NEET')) return 'tag-red';
    if (t.includes('REG')) return 'tag-purple';
    return 'tag-gold';
  };

  // ── Shortlist icon colors cycling
  const iconColors = ['tag-purple', 'tag-blue', 'tag-gold', 'tag-green', 'tag-red'];

  return (
    <div className="student-body">
      <div className="dashboard-shell">

        {/* ── SIDEBAR ── */}
        <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
          <div className="sidebar-logo">
            <img src="/asmi-logo.png" alt="ASMI Logo" className="logo-img" />
          </div>

          <nav className="sidebar-nav">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-link${activeTab === 'dashboard' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:layout-dashboard" className="nav-icon"></iconify-icon>
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('predictor')}
              className={`nav-link${activeTab === 'predictor' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:bar-chart-3" className="nav-icon"></iconify-icon>
              <span>Predictor</span>
            </button>

            <button
              onClick={() => { window.location.href = '/cutoff_explorer.html' + window.location.search; }}
              className={`nav-link${activeTab === 'cutoff' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:search" className="nav-icon"></iconify-icon>
              <span>Cutoff Explorer</span>
            </button>

            <button
              onClick={() => setActiveTab('institutes')}
              className={`nav-link${activeTab === 'institutes' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:building-2" className="nav-icon"></iconify-icon>
              <span>Institutes</span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`nav-link${activeTab === 'checklist' ? ' active' : ''}`}
            >
              <iconify-icon icon="lucide:file-text" className="nav-icon"></iconify-icon>
              <span>Documents</span>
            </button>

            <div className="nav-section-label" style={{marginTop: '24px'}}>Account</div>

            <button className="nav-link">
              <iconify-icon icon="lucide:settings" className="nav-icon"></iconify-icon>
              <span>Settings</span>
            </button>

            <button className="nav-link">
              <iconify-icon icon="lucide:help-circle" className="nav-icon"></iconify-icon>
              <span>Help &amp; Support</span>
            </button>

            <button onClick={toggleSidebar} className="nav-link sidebar-toggle-btn" style={{ marginTop: 16 }}>
              <iconify-icon icon={sidebarCollapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'} className="nav-icon"></iconify-icon>
              <span>Collapse</span>
            </button>
          </nav>
        </aside>

        {/* ── MAIN ── */}
        <div className={`main-content${sidebarCollapsed ? ' collapsed' : ''}`}>

          {/* Top Header */}
          <header className="dashboard-header">
            <div className="header-search">
              <span className="header-search-icon">⊕</span>
              <input type="text" placeholder="Search for colleges, cutoffs or help..." />
            </div>
            <div className="header-right">
              <div className="header-user">
                <div className="header-user-info">
                  <div className="header-user-name">{studentName}</div>
                  <div className="header-user-role">NEET Aspirant 2026</div>
                </div>
                <div className="user-avatar">{initials}</div>
              </div>
            </div>
          </header>

          {/* ── PAGE CONTENT ── */}
          <div className="page-content">

            {/* ══════════════════════════════════════════
                VIEW: DASHBOARD
            ══════════════════════════════════════════ */}
            {activeTab === 'dashboard' && (
              <div className="dash-grid">

                {/* ── LEFT COLUMN ── */}
                <div className="dash-col-left">

                  {/* Hero Welcome Card */}
                  <section className="hero-card">
                    <div>
                      <h1 className="hero-greeting">Welcome back, {studentName.split(' ')[0]} 👋</h1>
                      <p className="hero-subtitle">Your journey to MBBS 2026 is in progress. Keep going!</p>
                      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                        <div className="rank-badge">
                          <span className="rank-badge-label">NEET SCORE</span>
                          <span className="rank-badge-value">{studentScore || '—'}</span>
                        </div>
                        <div className="rank-badge">
                          <span className="rank-badge-label">NEET AIR RANK</span>
                          <span className="rank-badge-value">—</span>
                        </div>
                        <div className="rank-badge">
                          <span className="rank-badge-label">CATEGORY</span>
                          <span className="rank-badge-value">{studentCategory ? (studentCategory === 'General' ? 'General / UR' : studentCategory) : '—'}</span>
                        </div>
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
                        <a href="https://asmicareer.in/medical/news" target="_blank" rel="noreferrer" className="card-action" style={{ textDecoration: 'none' }}>View All</a>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {deadlines.length === 0 ? (
                          <div className="empty-state">No upcoming deadlines.</div>
                        ) : deadlines.slice(0, 4).map((dl, i) => {
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
                        <button className="card-action" onClick={() => setActiveTab('predictor')}>Edit List</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {shortlist.length === 0 ? (
                          <div className="empty-state">No colleges shortlisted yet.</div>
                        ) : shortlist.slice(0, 5).map((name, i) => (
                          <div key={i} className="shortlist-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className={`shortlist-icon tag ${iconColors[i % iconColors.length]}`}
                                style={{ background: undefined, border: undefined }}>🏥</div>
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
                        <button onClick={() => setActiveTab('predictor')}
                          style={{ width: '100%', marginTop: 4, padding: '10px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-400)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          + Add More Colleges
                        </button>
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
                              {!done && doc.id === 'neet-admit' && (
                                <div style={{ fontSize: 10, color: 'var(--reach-color)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                                  Action Required
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button onClick={() => setActiveTab('checklist')}
                      style={{ width: '100%', marginTop: 20, padding: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-500)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
                      onMouseOver={e => e.target.style.background = 'var(--bg-subtle)'}
                      onMouseOut={e => e.target.style.background = 'transparent'}
                    >
                      View Full Checklist →
                    </button>
                  </div>


                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                VIEW: PREDICTOR
            ══════════════════════════════════════════ */}
            {activeTab === 'predictor' && (
              <div>
                {/* Rank Predictor */}
                <div className="tool-card">
                  <h2 className="section-title">📊 NEET Rank Predictor</h2>
                  <p className="section-sub">Convert your tentative NEET Score into an estimated All India Rank.</p>
                  <div style={{ display: 'flex', gap: 10, maxWidth: 440 }}>
                    <input type="number" placeholder="Enter Score (200–720)" className="form-input"
                      value={predictorScore} onChange={e => setPredictorScore(e.target.value)} />
                    <button onClick={handlePredictRank} className="btn-gold">Predict</button>
                  </div>
                  {predictedRank && (
                    <div style={{ marginTop: 24, display: 'inline-block', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-md)', padding: '16px 24px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-500)', marginBottom: 4 }}>Estimated All India Rank</div>
                      <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--navy)' }}>#{predictedRank.toLocaleString()}</div>
                    </div>
                  )}
                </div>

                {/* College Predictor */}
                <div className="tool-card">
                  <h2 className="section-title">🔮 College Predictor</h2>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                    <button className={`chip ${cpInputMode === 'rank' ? 'active' : ''}`}
                      onClick={() => { setCpInputMode('rank'); setCpQuota('All'); }}>Use NEET AIR</button>
                    <button className={`chip ${cpInputMode === 'score' ? 'active' : ''}`}
                      onClick={() => { setCpInputMode('score'); setCpQuota('All'); }}>Use NEET Score</button>
                  </div>

                  {/* ── RANK TAB: full Cutoff Explorer layout ── */}
                  {cpInputMode === 'rank' && (() => {
                    const allStates = Array.from(new Set(collegeData.map(c => c.state))).sort();
                    const allTypes  = Array.from(new Set(collegeData.map(c => c.type).filter(Boolean))).sort();
                    const filteredCpStates = allStates.filter(s => s.toLowerCase().includes(cpStateSearch.toLowerCase()));
                    const results = getRankPredictedColleges();
                    const highCount  = results.filter(r => r.chance === 'High').length;
                    const medCount   = results.filter(r => r.chance === 'Med').length;
                    const lowCount   = results.filter(r => r.chance === 'Low').length;
                    return (
                      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                        {/* Filters panel */}
                        <div className="filters-panel" style={{ flex: '0 0 240px', minWidth: 200 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-900)' }}>Filters</span>
                            <button className="card-action" onClick={() => {
                              setCpSelectedStates([]); setCpSelectedTypes([]); setCpQuota('All');
                              setCpMaxBudget(3000000); setCpSortBy('chance'); setCpSearchFilter(''); setCpRankInput('');
                            }}>Reset All</button>
                          </div>

                          {/* Rank input */}
                          <div className="filter-section">
                            <div className="form-label">Your All India Rank (AIR)</div>
                            <input type="number" placeholder="e.g. 15000" className="form-input"
                              value={cpRankInput} onChange={e => setCpRankInput(e.target.value)}
                              style={{ padding: '9px 12px', fontSize: 14, fontWeight: 700 }} />
                          </div>

                          {/* College name search */}
                          <div className="filter-section">
                            <div className="form-label">Search College</div>
                            <input type="text" placeholder="Search college name..." className="form-input"
                              value={cpSearchFilter} onChange={e => setCpSearchFilter(e.target.value)}
                              style={{ padding: '7px 10px', fontSize: 12 }} />
                          </div>

                          {/* Quota */}
                          <div className="filter-section">
                            <div className="form-label">Quota</div>
                            <select className="form-select" value={cpQuota} onChange={e => setCpQuota(e.target.value)} style={{ fontSize: 12 }}>
                              <option value="All">All Quotas</option>
                              <option value="AIQ">All India Quota (AIQ)</option>
                              <option value="State">State Quota</option>
                              <option value="Open State">Open State Quota</option>
                              <option value="IP">Institutional / Private</option>
                            </select>
                          </div>

                          {/* State multi-select */}
                          <div className="filter-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div className="form-label" style={{ margin: 0 }}>State / Region</div>
                              {cpSelectedStates.length > 0 && (
                                <button className="card-action" onClick={() => setCpSelectedStates([])}>
                                  Clear ({cpSelectedStates.length})
                                </button>
                              )}
                            </div>
                            <input type="text" placeholder="Search state..." className="form-input"
                              value={cpStateSearch} onChange={e => setCpStateSearch(e.target.value)}
                              style={{ padding: '6px 10px', fontSize: 11, marginBottom: 8 }} />
                            <div style={{ maxHeight: 130, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {filteredCpStates.map(state => (
                                <label key={state} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-700)' }}>
                                  <input type="checkbox" checked={cpSelectedStates.includes(state)}
                                    onChange={() => setCpSelectedStates(prev =>
                                      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state])}
                                    style={{ accentColor: 'var(--primary)' }} />
                                  {state}
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Institution type multi-select */}
                          <div className="filter-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                              <div className="form-label" style={{ margin: 0 }}>Institution Type</div>
                              {cpSelectedTypes.length > 0 && (
                                <button className="card-action" onClick={() => setCpSelectedTypes([])}>
                                  Clear
                                </button>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {allTypes.map(type => (
                                <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-700)' }}>
                                  <input type="checkbox" checked={cpSelectedTypes.includes(type)}
                                    onChange={() => setCpSelectedTypes(prev =>
                                      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                                    style={{ accentColor: 'var(--primary)' }} />
                                  {type}
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Max Budget slider */}
                          <div className="filter-section">
                            <div className="form-label">Max Annual Fees</div>
                            <input type="range" min="0" max="3000000" step="50000"
                              value={cpMaxBudget} onChange={e => setCpMaxBudget(Number(e.target.value))}
                              style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', marginBottom: 6 }} />
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                              {cpMaxBudget >= 3000000 ? 'No Limit' : `Up to ₹${(cpMaxBudget/100000).toFixed(1)}L/yr`}
                            </div>
                          </div>

                          {/* Sort */}
                          <div>
                            <div className="form-label">Sort By</div>
                            <select className="form-select" value={cpSortBy} onChange={e => setCpSortBy(e.target.value)} style={{ fontSize: 12 }}>
                              <option value="chance">Chance (High first)</option>
                              <option value="rank">Closing Rank</option>
                              <option value="fees_asc">Fees: Low → High</option>
                              <option value="fees_desc">Fees: High → Low</option>
                              <option value="name">Name A–Z</option>
                            </select>
                          </div>
                        </div>

                        {/* Results area */}
                        <div style={{ flex: '1 1 400px', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 13, color: 'var(--text-500)' }}>
                              {!cpRankInput ? (
                                'Enter your AIR in the filter panel to see colleges'
                              ) : (
                                <><strong style={{ color: 'var(--text-900)' }}>{results.length}</strong> college{results.length !== 1 ? 's' : ''} matched</>
                              )}
                            </div>
                            {results.length > 0 && (
                              <div style={{ display: 'flex', gap: 8 }}>
                                {highCount > 0 && <span className="badge-safe">{highCount} High</span>}
                                {medCount  > 0 && <span className="badge-likely">{medCount} Med</span>}
                                {lowCount  > 0 && <span className="badge-borderline">{lowCount} Low</span>}
                              </div>
                            )}
                          </div>

                          {!cpRankInput ? (
                            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                              <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>Enter Your AIR to Start</div>
                              <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 280, margin: '0 auto' }}>
                                Type your All India Rank in the filter panel. Colleges are shown with High / Med / Low admission chance.
                              </div>
                            </div>
                          ) : results.length === 0 ? (
                            <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>No Matches Found</div>
                              <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 300, margin: '0 auto' }}>
                                No colleges match your current filters. Try expanding your state selection, increasing budget, or clearing institution type filters.
                              </div>
                            </div>
                          ) : (
                            <div className="table-container">
                              <table className="dense-table">
                                <thead className="predictor-header"><tr>
                                  <th>College Name</th>
                                  <th>State</th>
                                  <th>Type</th>
                                  <th>Quota</th>
                                  <th>Closing Rank</th>
                                  <th>Annual Fees</th>
                                  <th>Chance</th>
                                  <th>Shortlist</th>
                                </tr></thead>
                                <tbody>
                                  {results.map((c, i) => (
                                    <tr key={i}>
                                      <td style={{ fontWeight: 700, minWidth: 180 }}>{c.name}</td>
                                      <td style={{ whiteSpace: 'nowrap' }}>{c.state}</td>
                                      <td><span className={`tb ${c.type === 'Government' ? 'tb-govt' : c.type === 'Private' ? 'tb-private' : c.type === 'Deemed' ? 'tb-deemed' : ''}`}>{c.type}</span></td>
                                      <td style={{ fontSize: 11 }}>{c.quota}</td>
                                      <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{c.closingRank?.toLocaleString() || '—'}</td>
                                      <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                                        {c.fees && parseInt(c.fees, 10) > 0
                                          ? `₹${(parseInt(c.fees, 10) / 100000).toFixed(1)}L`
                                          : '—'}
                                      </td>
                                      <td><span className={c.chanceClass} style={{ whiteSpace: 'nowrap' }}>{c.chance}</span></td>
                                      <td>
                                        <button onClick={() => handleToggleShortlist(c.name)} className="chip" style={{ fontSize: 11 }}>
                                          {shortlist.includes(c.name) ? '★ Saved' : '☆ Save'}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── SCORE TAB ── */}
                  {cpInputMode === 'score' && (() => {
                    const results = getScorePredictedColleges();
                    return (
                      <>
                        {/* Score tab filters */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 20 }}>
                          <div className="form-group">
                            <label className="form-label">NEET Score</label>
                            <input type="number" placeholder="e.g. 620" className="form-input" value={cpScoreInput} onChange={e => setCpScoreInput(e.target.value)} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Course</label>
                            <select className="form-select" value={cpScoreCourse} onChange={e => setCpScoreCourse(e.target.value)}>
                              <option value="MBBS">MBBS</option>
                              <option value="BDS">BDS</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label className="form-label">Category</label>
                            <select className="form-select" value={cpCategory} onChange={e => setCpCategory(e.target.value)}>
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
                              <option value="IQ">Inst. / NRI</option>
                            </select>
                          </div>
                        </div>

                        {/* Filter chips (Pool and Type) */}
                        <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
                          <div>
                            <div className="form-label" style={{ marginBottom: 6 }}>Pool</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {[
                                { key: 'All', label: 'All Pools' },
                                { key: 'MH State', label: 'MH State' },
                                { key: 'MCC AIQ', label: 'MCC AIQ' },
                                { key: 'Open State', label: 'Open State' }
                              ].map(p => (
                                <button key={p.key} className={`chip ${cpPoolFilter === p.key ? 'active' : ''}`} onClick={() => setCpPoolFilter(p.key)}>
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="form-label" style={{ marginBottom: 6 }}>Institution Type</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {[
                                { key: 'All', label: 'All Types' },
                                { key: 'Government', label: 'Government' },
                                { key: 'Private', label: 'Private' },
                                { key: 'Deemed', label: 'Deemed' }
                              ].map(t => (
                                <button key={t.key} className={`chip ${cpTypeFilter === t.key ? 'active' : ''}`} onClick={() => setCpTypeFilter(t.key)}>
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Results list */}
                        {(!cpScoreInput || isNaN(parseInt(cpScoreInput, 10))) ? (
                          <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>Enter Your NEET Score to Start</div>
                            <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 280, margin: '0 auto' }}>
                              Type your NEET score (200-720) above to see matching colleges and admission chances.
                            </div>
                          </div>
                        ) : results.length === 0 ? (
                          <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center' }}>
                            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-900)', marginBottom: 6 }}>No Matches Found</div>
                            <div style={{ fontSize: 13, color: 'var(--text-400)', maxWidth: 300, margin: '0 auto' }}>
                              No colleges match your current score and category. Try changing the filters.
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: 13, color: 'var(--text-500)', marginBottom: 14 }}>
                              <strong style={{ color: 'var(--text-900)' }}>{results.length}</strong> college{results.length !== 1 ? 's' : ''} matched
                            </div>

                            <div className="table-container">
                              <table className="dense-table">
                                <thead className="predictor-header">
                                  <tr>
                                    <th>College Name</th>
                                    <th>Pool</th>
                                    <th>State</th>
                                    <th>Last Cutoff</th>
                                    <th>Projected</th>
                                    <th>Fee/yr</th>
                                    <th>Chance</th>
                                    <th style={{ textAlign: 'center', width: '60px' }}>★</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {results.map((c, i) => {
                                    const feeVal = feeMap[c.name] ? `₹${feeMap[c.name]}L/yr` : '—';
                                    return (
                                      <tr key={i}>
                                        <td style={{ fontWeight: 700, minWidth: 180 }}>{c.name}</td>
                                        <td>
                                          <span style={{
                                            backgroundColor: 'rgba(106, 13, 173, 0.08)',
                                            color: '#6a0dad',
                                            border: '1px solid rgba(106, 13, 173, 0.2)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            {c.pool}
                                          </span>
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap' }}>{c.state}</td>
                                        <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{c.cutoff}</td>
                                        <td style={{ textAlign: 'center' }}>
                                          <span style={{
                                            background: 'linear-gradient(135deg, var(--navy), var(--purple))',
                                            color: '#FFD700',
                                            padding: '3px 8px',
                                            borderRadius: '12px',
                                            fontSize: '11px',
                                            fontWeight: '800'
                                          }}>
                                            {c.projected}
                                          </span>
                                        </td>
                                        <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{feeVal}</td>
                                        <td>
                                          <span className={c.chanceClass} style={{ whiteSpace: 'nowrap' }}>
                                            {c.chance}
                                          </span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                          <button
                                            onClick={() => handleToggleShortlist(c.name)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              cursor: 'pointer',
                                              fontSize: '18px',
                                              color: shortlist.includes(c.name) ? '#FFD700' : 'rgba(26, 0, 64, 0.2)',
                                              padding: '4px',
                                              lineHeight: 1,
                                              transition: 'color 0.15s'
                                            }}
                                          >
                                            {shortlist.includes(c.name) ? '★' : '☆'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════
                VIEW: CUTOFF EXPLORER
            ══════════════════════════════════════════ */}
            {activeTab === 'cutoff' && (
              <div className="tool-card">
                <h2 className="section-title">📈 Cutoff Explorer</h2>
                <p className="section-sub">Browse historical closing ranks for medical colleges across states and quotas.</p>

                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  <button className={`chip ${ceViewMode === 'database' ? 'active' : ''}`} onClick={() => setCeViewMode('database')}>Browse Database</button>
                  <button className={`chip ${ceViewMode === 'single-college' ? 'active' : ''}`} onClick={() => setCeViewMode('single-college')}>Single College Lookup</button>
                </div>

                {ceViewMode === 'database' ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                      <div className="form-group">
                        <label className="form-label">Search College</label>
                        <input type="text" placeholder="Search..." className="form-input" value={ceCollegeSearch} onChange={e => setCeCollegeSearch(e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <select className="form-select" value={ceState} onChange={e => setCeState(e.target.value)}>
                          <option value="All">All States</option>
                          {ceStates.map((st, i) => <option key={i} value={st}>{st}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="table-container">
                      <table className="dense-table">
                        <thead className="predictor-header"><tr>
                          <th>Institute</th><th>State</th><th>Quota</th><th>Closing Rank (AIR)</th><th>Action</th>
                        </tr></thead>
                        <tbody>
                          {collegeData.filter(c => {
                            if (ceState !== 'All' && c.state !== ceState) return false;
                            if (ceCollegeSearch && !c.name.toLowerCase().includes(ceCollegeSearch.toLowerCase())) return false;
                            return true;
                          }).slice(0, 60).map((c, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 700 }}>{c.name}</td>
                              <td>{c.state}</td>
                              <td><span className="tag tag-gold">{c.quota || 'All India'}</span></td>
                              <td style={{ fontWeight: 800, color: 'var(--navy)' }}>{c.cutoff?.toLocaleString() || '—'}</td>
                              <td>
                                <button onClick={() => handleToggleShortlist(c.name)} className="chip" style={{ fontSize: 11 }}>
                                  {shortlist.includes(c.name) ? '★ Saved' : '☆ Save'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="form-group" style={{ maxWidth: 500 }}>
                      <label className="form-label">Select College</label>
                      <select className="form-select" value={ceSingleCollege} onChange={e => setCeSingleCollege(e.target.value)}>
                        <option value="">— Select College —</option>
                        {ceColleges.map((col, i) => <option key={i} value={col}>{col}</option>)}
                      </select>
                    </div>
                    {ceSingleCollege && (
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy)', marginBottom: 16 }}>{ceSingleCollege}</h3>
                        <div className="table-container">
                          <table className="dense-table">
                            <thead className="predictor-header"><tr><th>Quota</th><th>State</th><th>Fees</th><th>Closing Rank (AIR)</th></tr></thead>
                            <tbody>
                              {collegeData.filter(c => c.name === ceSingleCollege).map((c, i) => (
                                <tr key={i}>
                                  <td><span className="tag tag-gold">{c.quota || 'All India'}</span></td>
                                  <td>{c.state}</td>
                                  <td>{c.fees ? `₹${parseInt(c.fees, 10).toLocaleString('en-IN')}` : '—'}</td>
                                  <td style={{ fontWeight: 800, color: 'var(--navy)', fontSize: 15 }}>{c.cutoff?.toLocaleString() || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════
                VIEW: INSTITUTES
            ══════════════════════════════════════════ */}
            {activeTab === 'institutes' && (
              <div>
                <h2 className="section-title">🏫 Institutes Directory</h2>
                <p className="section-sub">Browse and filter medical colleges across India.</p>

                {/* Tab pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {['All', 'Private', 'Government', 'Deemed', 'AIIMS', 'JIPMER', 'Central'].map(tab => (
                    <button key={tab} onClick={() => setInstTabType(tab)}
                      className={`chip ${instTabType === tab ? 'active' : ''}`}>
                      {tab === 'All' ? 'All Colleges' : tab}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {/* Filters */}
                  <div className="filters-panel" style={{ flex: '0 0 260px', minWidth: 220 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-900)' }}>Filters</span>
                      <button onClick={() => {
                        setInstSelectedStates([]); setInstType('All'); setInstCourse('All');
                        setInstTabType('All'); setInstMaxFees(3000000); setInstSortBy('Recommended');
                        setInstSearch(''); setInstStateSearch('');
                      }} className="card-action">Reset all</button>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">Search College</div>
                      <input type="text" placeholder="Search..." className="form-input"
                        value={instSearch} onChange={e => setInstSearch(e.target.value)} style={{ padding: '8px 12px', fontSize: 12 }} />
                    </div>

                    <div className="filter-section">
                      <div className="form-label">State</div>
                      <input type="text" placeholder="Search state..." className="form-input"
                        value={instStateSearch} onChange={e => setInstStateSearch(e.target.value)}
                        style={{ padding: '6px 10px', fontSize: 11, marginBottom: 8 }} />
                      <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {filteredStatesList.map(state => (
                          <label key={state} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-700)' }}>
                            <input type="checkbox" checked={instSelectedStates.includes(state)}
                              onChange={() => setInstSelectedStates(prev =>
                                prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state])}
                              style={{ accentColor: 'var(--primary)' }} />
                            {state}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">College Type</div>
                      <select className="form-select" value={instType} onChange={e => setInstType(e.target.value)} style={{ fontSize: 12 }}>
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

                    <div className="filter-section">
                      <div className="form-label">Course</div>
                      <select className="form-select" value={instCourse} onChange={e => setInstCourse(e.target.value)} style={{ fontSize: 12 }}>
                        <option value="All">All Courses</option>
                        <option value="MBBS">MBBS</option>
                        <option value="BDS">BDS</option>
                        <option value="BPTH">BPTH</option>
                        <option value="BAMS">BAMS</option>
                        <option value="BHMS">BHMS</option>
                      </select>
                    </div>

                    <div className="filter-section">
                      <div className="form-label">Sort By</div>
                      <select className="form-select" value={instSortBy} onChange={e => setInstSortBy(e.target.value)} style={{ fontSize: 12 }}>
                        <option value="Recommended">ASMI Recommended</option>
                        <option value="Name">Name A–Z</option>
                        <option value="Seats">Seats (High to Low)</option>
                      </select>
                    </div>

                    <div>
                      <div className="form-label">Annual Fees</div>
                      <input type="range" min="0" max="3000000" step="50000" value={instMaxFees}
                        onChange={e => setInstMaxFees(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer', marginBottom: 6 }} />
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>
                        Up to {instMaxFees === 3000000 ? 'No Limit' : `₹${instMaxFees.toLocaleString('en-IN')}`}
                      </div>
                    </div>
                  </div>

                  {/* Grid */}
                  <div style={{ flex: '1 1 400px' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-500)', marginBottom: 16 }}>
                      Showing <strong style={{ color: 'var(--text-900)' }}>{getFilteredCollegesList().length}</strong> college{getFilteredCollegesList().length !== 1 ? 's' : ''} matching your criteria.
                    </div>
                    {getFilteredCollegesList().length === 0 ? (
                      <div className="card-sm empty-state">No colleges found. Try adjusting your filters.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {getFilteredCollegesList().slice(0, 48).map(college => {
                          const isShortlisted = shortlist.includes(college.name);
                          return (
                            <a href={`/medical/colleges/${college.slug}`} target="_blank" rel="noreferrer"
                              key={college.slug} className="college-card">
                              <div className="college-img-placeholder" style={{ position: 'relative' }}>
                                  {(() => { const imgSrc = college.image || college.cover_image || college.img || college.thumbnail; return imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={college.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                    onError={e => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : null; })()}
                                {!(college.image || college.cover_image || college.img || college.thumbnail) && (
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', textAlign: 'center' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>{college.name}</span>
                                  </div>
                                )}
                                {college.asmi_recommended && (
                                  <span className="college-badge-recommend">★ ASMI RECOMMENDS</span>
                                )}
                                {college.asmi_pulse_score && (
                                  <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,255,255,0.92)', color: 'var(--navy)', fontSize: 11, fontWeight: 800, padding: '4px 8px', borderRadius: 4 }}>
                                    ★ {college.asmi_pulse_score}/5
                                  </span>
                                )}
                                <button onClick={e => { e.preventDefault(); e.stopPropagation(); handleToggleShortlist(college.name); }}
                                  style={{ position: 'absolute', bottom: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: isShortlisted ? '#dc2626' : 'var(--navy)' }}>
                                  {isShortlisted ? '♥' : '♡'}
                                </button>
                              </div>
                              <div className="college-card-body">
                                <div className="college-meta">
                                  {college.city && <span>📍 {college.city}</span>}
                                  <span>🎓 {college.type}</span>
                                </div>
                                <div className="college-name">{college.name}</div>
                                <div className="college-stats">
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

            {/* ══════════════════════════════════════════
                VIEW: DOCUMENTS CHECKLIST
            ══════════════════════════════════════════ */}
            {activeTab === 'checklist' && (
              <div className="tool-card">
                <h2 className="section-title">📋 Documents Checklist</h2>
                <p className="section-sub">Track every document you need for MBBS counselling and admission.</p>

                {/* Quota selector only — category is fixed from token */}
                <div style={{ marginBottom: 24 }}>
                  <div className="form-label" style={{ marginBottom: 8 }}>Quota Type</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['State', 'AIQ', 'Management'].map(q => (
                      <button key={q} className={`chip ${docQuota === q ? 'active' : ''}`}
                        onClick={() => { setDocQuota(q); saveChecklist(checkedDocs, docCategory, q); }}>
                        {q === 'State' ? 'State Quota (Maharashtra)' : q === 'AIQ' ? 'All India Quota (AIQ)' : 'Management / NRI'}
                      </button>
                    ))}
                  </div>
                </div>

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
            )}

          </div>{/* /page-content */}
        </div>{/* /main-content */}

        {/* Mobile bottom nav */}
        <nav className="mobile-bottom-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => {
              if (item.id === 'cutoff') {
                window.location.href = '/cutoff_explorer.html' + window.location.search;
              } else {
                setActiveTab(item.id);
              }
            }}
              className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}>
              <iconify-icon icon={item.icon} className="nav-icon"></iconify-icon>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

      </div>{/* /dashboard-shell */}
    </div>
  );
}
