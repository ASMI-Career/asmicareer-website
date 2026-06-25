import docs from '../data/documents.json';

const GROUP_ORDER = [
  'NEET Documents',
  'Class X Documents',
  'Class XII Documents',
  'School & College Certificates',
  'Identity & Address Proof',
  'Medical Certificate',
  'Category Documents',
  'Additional Reservation Documents',
  'NRI Documents',
  'Conditional Documents',
];

export function buildDocumentList({ quota, category, additional, isRepeater, minority }) {
  const seen = new Set();
  const all = [];

  const add = (items) => {
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        all.push(item);
      }
    }
  };

  add(docs.base);
  if (quota && docs.byQuota[quota]) add(docs.byQuota[quota]);
  if (category && docs.byCategory[category]) add(docs.byCategory[category]);
  if (additional && additional !== 'none' && docs.byAdditional[additional]) add(docs.byAdditional[additional]);
  if (isRepeater) add(docs.conditional.repeater);
  if (minority && minority !== 'none' && docs.conditional[minority]) add(docs.conditional[minority]);

  const groupMap = {};
  for (const item of all) {
    if (!groupMap[item.group]) groupMap[item.group] = [];
    groupMap[item.group].push(item);
  }

  const groups = {};
  for (const g of GROUP_ORDER) {
    if (groupMap[g] && groupMap[g].length > 0) {
      groups[g] = groupMap[g];
    }
  }

  const total = all.length;
  return { groups, total };
}
