import { useState } from 'react';
import medicalDocs from '../data/docs.json';
import engineeringDocs from '../data/docs.engineering.provisional.json';

// Document lists by stream (the file is named in config.documents.data).
export const DOC_SETS = { medical: medicalDocs, engineering: engineeringDocs };
import { writeCache } from '../lib/cache';
import { callDash } from '../lib/api';
import { buildDocumentSections, docProgress } from '../lib/docGroups';

// currentToken: the student's token (empty until it has been read from the link)
export default function useDocuments({ config, endpoint, currentToken }) {
  const [checkedDocs, setCheckedDocs] = useState(new Set());
  const [docCategory, setDocCategory] = useState(config.documents.defaults.category);
  const [docQuota, setDocQuota] = useState(config.documents.defaults.quota);

  // Checklist helpers
  const saveChecklist = (set, cat, quota) => {
    setCheckedDocs(set);
    const payload = { checked: Array.from(set), category: cat, quota };
    if (currentToken) writeCache(currentToken, 'checklist', payload);
    // Write to sheet for cross-device persistence (requires Apps Script action=saveDocStatus)
    if (currentToken) {
      callDash(endpoint, 'saveDocStatus', { data: payload }, currentToken)
        .catch(() => {}); // silent fail — localStorage remains fallback
    }
  };

  const toggleDoc = (id) => {
    const next = new Set(checkedDocs);
    next.has(id) ? next.delete(id) : next.add(id);
    saveChecklist(next, docCategory, docQuota);
  };

  return { checkedDocs, setCheckedDocs, docCategory, setDocCategory, docQuota, setDocQuota, saveChecklist, toggleDoc };
}

// Which documents to show: always-groups, then the groups for the student's category, then the chosen quota (Medical),
// then one group per counselling track the student is on (Engineering: registration / verification slips).
// A student with no track recorded is treated as being on every track of the stream.
export function useDocumentSections({ config, checkedDocs, docCategory, docQuota, studentTracks }) {
  const DOCS = DOC_SETS[config.documents.data] || { sections: [], category: {}, quota: {} };
  // Engineering (config.exams): the default view of the groups ("My exams", or everything for a student with no tracks).
  if (config.exams) {
    const b = buildDocumentSections({ DOCS, config, docCategory, docQuota, studentTracks, view: null });
    return { sectionsToRender: b.sections, allIds: b.allIds, ...docProgress(b.allIds, checkedDocs) };
  }
  const tracks = (studentTracks && studentTracks.length) ? studentTracks : (config.tracks || []).map(t => t.id);
  const sectionsToRender = [
    ...DOCS.sections,
    ...(docCategory !== 'General' && DOCS.category[docCategory] ? [].concat(DOCS.category[docCategory]) : []),
    ...(DOCS.quota[docQuota] ? [DOCS.quota[docQuota]] : []),
    ...tracks.filter(t => DOCS.track && DOCS.track[t]).map(t => DOCS.track[t]),
  ];
  const allIds = sectionsToRender.flatMap(s => s.docs.map(d => d.id));
  const doneCount = allIds.filter(id => checkedDocs.has(id)).length;
  const pct = allIds.length ? Math.round((doneCount / allIds.length) * 100) : 0;
  return { sectionsToRender, allIds, doneCount, pct };
}
