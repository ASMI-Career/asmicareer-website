import { useState, useEffect } from 'react';
import { TOKEN_RE, readCache, writeCache, clearCache, purgeLegacyCache } from '../lib/cache';
import { makeShortlist } from '../lib/shortlist';
import { applyRules } from '../config';
import { getBranchFromToken } from '../lib/format';

// Resolves the token in the link, loads the student (cache first, then the sheet) and hands the pieces the other hooks own to their setters.
// The effect runs once, so it uses the values of the first render, exactly like before the split.
export default function useStudent({ config, endpoint, setCurrentToken, setCheckedDocs, setDocCategory, setDocQuota, docCategory, docQuota, setShortlistGroups, setCpScoreInput }) {
  const sc = config.student;
  const { normalizeGroups } = makeShortlist(config.shortlist);
  // Medical keeps whole numbers (NEET score); engineering keeps decimals (percentile 98.37).
  const parseScore = (v) => (sc.scoreParse === 'float' ? parseFloat(v) : parseInt(v, 10));
  const [studentName, setStudentName] = useState(sc.defaultName);
  const [studentRank, setStudentRank] = useState(null);
  const [studentScore, setStudentScore] = useState(null);
  const [authState, setAuthState] = useState('checking'); // 'checking' | 'ok' | 'invalid' | 'error' | 'unavailable'
  const [studentCategory, setStudentCategory] = useState(null); // null = not yet set from token
  const [counsellorName, setCounsellorName] = useState(sc.counsellorDefaults.name);
  const [counsellorWhatsapp, setCounsellorWhatsapp] = useState(sc.counsellorDefaults.whatsapp);
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');
  const [counsellorBranch, setCounsellorBranch] = useState(sc.counsellorDefaults.branch);
  const [progressSteps, setProgressSteps] = useState(Array.isArray(sc.defaultProgress)
    ? sc.defaultProgress
    : sc.stages.map((label, i) => ({ id: i + 1, label, status: i === 0 ? 'active' : 'pending' })));   // "stages": first stage active
  const [studentTracks, setStudentTracks] = useState([]);   // engineering: which counselling tracks the student is on

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
        if (!endpoint) { setAuthState('unavailable'); return; }   // this stream's dashboard is not switched on yet
        const cName = readCache(token, 'name');
        const cRank = readCache(token, 'rank');
        const cScore = readCache(token, 'score');
        const cList = readCache(token, 'shortlist');
        const cDocs = readCache(token, 'checklist');
        const hasCache = [cName, cRank, cScore, cList, cDocs].some(v => v !== null);
        if (cName) setStudentName(cName);
        if (cRank) setStudentRank(parseInt(cRank, 10));
        if (cScore) setStudentScore(parseScore(cScore));
        if (cList) setShortlistGroups(normalizeGroups(cList));
        if (cDocs) {
          setCheckedDocs(new Set(cDocs.checked || []));
          setDocCategory(cDocs.category || config.documents.defaults.category);
          setDocQuota(cDocs.quota || config.documents.defaults.quota);
        }
        setAuthState(hasCache ? 'ok' : 'checking');
        fetch(`${endpoint}?action=getStudent&token=${encodeURIComponent(token)}`)
          .then(res => res.json())
          .then(res => {
            if (res.success && res.data) {
              setAuthState('ok');
              const s = res.data;
              if (sc.logRecord) console.log('[ASMI] student data:', s);
              if (s.name) { setStudentName(s.name); writeCache(token, 'name', s.name); }
              const rawRank = s.rank || s.neet_rank || s.air;
              const rawScore = s.score || s.neet_score;
              const parsedRank = (rawRank && rawRank !== 0) ? parseInt(rawRank, 10) : null;
              const parsedScore = (rawScore && rawScore !== 0) ? parseScore(rawScore) : null;
              if (parsedRank)  { setStudentRank(parsedRank);   writeCache(token, 'rank', parsedRank); }
              if (parsedScore) { setStudentScore(parsedScore); writeCache(token, 'score', parsedScore); setCpScoreInput(String(parsedScore)); }
              // The sheet's grouped shortlist is returned as `saved_colleges` ({ MCC, MH, OPEN }).
              if (s.saved_colleges !== undefined) {
                const groups = normalizeGroups(s.saved_colleges);
                setShortlistGroups(groups); writeCache(token, 'shortlist', groups);
              }
              if (s.category) {
                const resolvedCat = applyRules(s.category, sc.categoryRules);
                setDocCategory(resolvedCat);
                setStudentCategory(resolvedCat);
                writeCache(token, 'checklist', { ...(readCache(token, 'checklist') || {}), category: resolvedCat });
              }
              if (s.quota && sc.quotaRules) {
                setDocQuota(applyRules(s.quota, sc.quotaRules));
              }
              if (s.stage) {
                const stages = sc.stages;
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
              setCounsellorBranch(sc.branchFromToken ? getBranchFromToken(token) : sc.counsellorDefaults.branch);
              if (s.tracks) setStudentTracks([].concat(typeof s.tracks === 'string' ? s.tracks.split(/[,;|]/) : s.tracks).map(t => String(t).trim()).filter(Boolean));

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

  return { studentName, studentRank, studentScore, authState, studentCategory, counsellorName, counsellorWhatsapp, whatsappGroupLink, counsellorBranch, progressSteps, studentTracks, initials, counsellorInitials };
}
