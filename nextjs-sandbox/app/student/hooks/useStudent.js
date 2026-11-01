import { useState, useEffect } from 'react';
import { APPS_SCRIPT_URL } from '../lib/config';
import { TOKEN_RE, readCache, writeCache, clearCache, purgeLegacyCache } from '../lib/cache';
import { normalizeGroups } from '../lib/shortlist';
import { getBranchFromToken } from '../lib/format';

// Resolves the token in the link, loads the student (cache first, then the sheet) and hands the pieces the other hooks own to their setters.
// The effect runs once, so it uses the values of the first render, exactly like before the split.
export default function useStudent({ setCurrentToken, setCheckedDocs, setDocCategory, setDocQuota, docCategory, docQuota, setShortlistGroups, setCpScoreInput }) {
  const [studentName, setStudentName] = useState('Student');
  const [studentRank, setStudentRank] = useState(null);
  const [studentScore, setStudentScore] = useState(null);
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'ok' | 'invalid' | 'error'
  const [studentCategory, setStudentCategory] = useState(null); // null = not yet set from token
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      purgeLegacyCache();

      // A student record is only shown for a valid token, and cached data is read per token only.
      const token = (params.get('token') || '').trim();
      if (!TOKEN_RE.test(token)) {
        setAuthState('invalid');
      } else {
        setCurrentToken(token);
        const cName = readCache(token, 'name');
        const cRank = readCache(token, 'rank');
        const cScore = readCache(token, 'score');
        const cList = readCache(token, 'shortlist');
        const cDocs = readCache(token, 'checklist');
        const hasCache = [cName, cRank, cScore, cList, cDocs].some(v => v !== null);
        if (cName) setStudentName(cName);
        if (cRank) setStudentRank(parseInt(cRank, 10));
        if (cScore) setStudentScore(parseInt(cScore, 10));
        if (cList) setShortlistGroups(normalizeGroups(cList));
        if (cDocs) {
          setCheckedDocs(new Set(cDocs.checked || []));
          setDocCategory(cDocs.category || 'General');
          setDocQuota(cDocs.quota || 'State');
        }
        setAuthState(hasCache ? 'ok' : 'checking');
        fetch(`${APPS_SCRIPT_URL}?action=getStudent&token=${encodeURIComponent(token)}`)
          .then(res => res.json())
          .then(res => {
            if (res.success && res.data) {
              setAuthState('ok');
              const s = res.data;
              console.log('[ASMI] student data:', s);
              if (s.name) { setStudentName(s.name); writeCache(token, 'name', s.name); }
              const rawRank = s.rank || s.neet_rank || s.air;
              const rawScore = s.score || s.neet_score;
              const parsedRank = (rawRank && rawRank !== 0) ? parseInt(rawRank, 10) : null;
              const parsedScore = (rawScore && rawScore !== 0) ? parseInt(rawScore, 10) : null;
              if (parsedRank)  { setStudentRank(parsedRank);   writeCache(token, 'rank', parsedRank); }
              if (parsedScore) { setStudentScore(parsedScore); writeCache(token, 'score', parsedScore); setCpScoreInput(String(parsedScore)); }
              // The sheet's grouped shortlist is returned as `saved_colleges` ({ MCC, MH, OPEN }).
              if (s.saved_colleges !== undefined) {
                const groups = normalizeGroups(s.saved_colleges);
                setShortlistGroups(groups); writeCache(token, 'shortlist', groups);
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
                writeCache(token, 'checklist', { ...(readCache(token, 'checklist') || {}), category: resolvedCat });
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

              // Restore document checklist from sheet (source of truth for cross-device sync)
              const rawDocStatus = s.document_status || s.documentStatus || s.doc_status;
              if (rawDocStatus) {
                try {
                  const parsed = typeof rawDocStatus === 'string' ? JSON.parse(rawDocStatus) : rawDocStatus;
                  if (parsed.checked) {
                    const restored = new Set(parsed.checked);
                    setCheckedDocs(restored);
                    writeCache(token, 'checklist', {
                      checked: Array.from(restored),
                      category: parsed.category || docCategory,
                      quota: parsed.quota || docQuota,
                    });
                  }
                } catch(e) { console.warn('Doc status parse failed:', e); }
              }
            } else if (/not[ _]?found/i.test(String((res && res.error) || ''))) {
              // The sheet does not know this token: show the "link not valid" page and forget anything cached for it.
              clearCache(token);
              setAuthState('invalid');
            } else if (!hasCache) {
              setAuthState('error');
            }
          }).catch(err => {
            console.warn('Profile fetch failed:', err);
            if (!hasCache) setAuthState('error');
          });
      }
    }
  }, []);

  const initials = studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const counsellorInitials = counsellorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return { studentName, studentRank, studentScore, authState, studentCategory, counsellorName, counsellorWhatsapp, whatsappGroupLink, counsellorBranch, progressSteps, initials, counsellorInitials };
}
