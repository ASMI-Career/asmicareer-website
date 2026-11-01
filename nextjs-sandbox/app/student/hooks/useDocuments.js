import { useState } from 'react';
import DOCS from '../data/docs.json';
import { APPS_SCRIPT_URL } from '../lib/config';
import { writeCache } from '../lib/cache';

// currentToken: the student's token (empty until it has been read from the link)
export default function useDocuments(currentToken) {
  const [checkedDocs, setCheckedDocs] = useState(new Set());
  const [docCategory, setDocCategory] = useState('General');
  const [docQuota, setDocQuota] = useState('State');

  // Checklist helpers
  const saveChecklist = (set, cat, quota) => {
    setCheckedDocs(set);
    const payload = { checked: Array.from(set), category: cat, quota };
    if (currentToken) writeCache(currentToken, 'checklist', payload);
    // Write to sheet for cross-device persistence (requires Apps Script action=saveDocStatus)
    if (currentToken) {
      fetch(`${APPS_SCRIPT_URL}?action=saveDocStatus&token=${encodeURIComponent(currentToken)}&data=${encodeURIComponent(JSON.stringify(payload))}`)
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
