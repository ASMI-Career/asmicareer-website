import { useState } from 'react';
import medicalDocs from '../data/docs.json';

// Document lists by stream (the file is named in config.documents.data).
const DOC_SETS = { medical: medicalDocs };
import { writeCache } from '../lib/cache';

// currentToken: the student's token (empty until it has been read from the link)
export default function useDocuments({ config, endpoint, currentToken }) {
  const DOCS = DOC_SETS[config.documents.data] || { sections: [], category: {}, quota: {} };
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
      fetch(`${endpoint}?action=saveDocStatus&token=${encodeURIComponent(currentToken)}&data=${encodeURIComponent(JSON.stringify(payload))}`)
        .catch(() => {}); // silent fail — localStorage remains fallback
    }
  };

  const toggleDoc = (id) => {
    const next = new Set(checkedDocs);
    next.has(id) ? next.delete(id) : next.add(id);
    saveChecklist(next, docCategory, docQuota);
  };

  const sectionsToRender = [
    ...DOCS.sections,
    ...(docCategory !== 'General' && DOCS.category[docCategory] ? [DOCS.category[docCategory]] : []),
    ...(DOCS.quota[docQuota] ? [DOCS.quota[docQuota]] : []),
  ];
  const allIds = sectionsToRender.flatMap(s => s.docs.map(d => d.id));
  const doneCount = allIds.filter(id => checkedDocs.has(id)).length;
  const pct = allIds.length ? Math.round((doneCount / allIds.length) * 100) : 0;

  return { checkedDocs, setCheckedDocs, docCategory, setDocCategory, docQuota, setDocQuota, saveChecklist, toggleDoc, sectionsToRender, allIds, doneCount, pct };
}
