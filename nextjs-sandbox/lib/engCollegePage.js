// SERVER ONLY helpers for the public engineering college pages (/engineering/colleges/<slug>).
// Everything here is derived from the data files; nothing is invented. Missing data means the sentence or block is left out.
import fs from 'node:fs';
import path from 'node:path';
import config from '../app/student/config/engineering.provisional.json';
import { getCollegeCutoffs, sectionSummary, isTechBranch, openRows, yearComparison } from './engCollegeData';
import { loadProfile, has } from './engCollegeProfile';

export const SITE_URL = String(config.siteUrl || 'https://asmicareer.in').replace(/\/+$/, '');
export const PULSE_METHOD_TEXT = String(config.pulseMethodText || '').trim();
export const WHATSAPP_NUMBER = '917410019075';   // counsellor line, same number as /engineering/contact
const ADMISSION = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/admissionInfo.json'), 'utf8'));

export const loadColleges = () => JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/engineering-colleges.json'), 'utf8'));
export const canonicalUrl = (slug) => `${SITE_URL}/engineering/colleges/${slug}`;

export const profileFor = (college) => loadProfile(college.slug);
const cache = new Map();
// colleges with a profile get the rich cutoff data (all rounds, both genders, opening/PwD, every year on disk)
export function cutoffsFor(college, forceLean = false) {
  const rich = !forceLean && Boolean(profileFor(college));
  const key = college.slug + (rich ? ':rich' : '');
  if (!cache.has(key)) cache.set(key, getCollegeCutoffs(college, { rich }));
  return cache.get(key);
}

// ONE rule for "may search engines index this page": at least one branch with cutoff data, a description, or a profile.
export function isIndexable(college) {
  return cutoffsFor(college, true).sections.length > 0 || Boolean(college.description && String(college.description).trim()) || Boolean(profileFor(college));
}

// "JoSAA & CSAB" is the label of the Documents group; on an IIT page it must read "JoSAA" (IITs are not part of CSAB).
export const examLabel = (id, type) => {
  const l = (config.instituteExams.find(e => e.id === id) || (config.exams || []).find(e => e.id === id) || {}).label || id;
  return type === 'IIT' ? l.replace(/\s*&\s*CSAB/i, '') : l;
};
export function examLabels(college) { return (college.groups || []).map(g => examLabel(g, college.type)); }
const joinList = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
export const fmt = (n) => Number(n).toLocaleString('en-IN');
export const rupees = (n) => `₹${fmt(n)}`;
const SHORT_TYPES = ['IIT', 'NIT', 'IIIT', 'GFTI'];
const article = (t) => (/^[aeiou]|^(IIT|NIT|IIIT)$/i.test(t) ? 'an' : 'a');
const kindOf = (c, noun) => (SHORT_TYPES.includes(c.type) ? `${article(c.type)} ${c.type}` : `${article(c.type)} ${c.type} ${noun}`);
const place = (c) => [c.city, c.state].filter(Boolean).join(', ');

// the admission route as short badge text, e.g. "JoSAA · JEE Advanced"
export function routeBadge(college) {
  const ids = college.groups || [];
  const parts = [];
  if (college.type === 'IIT') parts.push('JoSAA · JEE Advanced');
  else if (['NIT', 'IIIT', 'GFTI'].includes(college.type)) parts.push('JoSAA · CSAB · JEE Main');
  if (ids.includes('mhtcet')) parts.push('Maharashtra CAP · MHT-CET');
  if (!parts.length) { const l = examLabels(college); if (l.length) parts.push(l.join(' · ')); }
  return parts;
}

// The section used for headline numbers: JoSAA first, then CSAB, Maharashtra CAP, DASA (ranks of different exams are never mixed)
export function primarySection(cut) {
  for (const id of ['josaa', 'csab', 'mhcap', 'dasa']) {
    const sec = cut.sections.find(s => s.id === id); const sum = sec && sectionSummary(sec);
    if (sum) return { sec, sum };
  }
  return null;
}

export function branchCount(cut) {
  const names = new Set();
  for (const s of cut.sections) {
    const yo = s.years[0];
    for (const q of yo.q) for (const r of ((q.g.all || {}).OPEN || [])) {
      if (isTechBranch(s, r[0])) { const [n, di, y] = s.b[r[0]]; names.add(`${n.toLowerCase()}|${di >= 0 ? s.dg[di] : ''}|${y}`); }
    }
  }
  return names.size;
}

const roundText = (sum) => (sum.roundMin === sum.roundMax ? `Round ${sum.roundMax}` : 'the final available round');

export function autoSummary(college, cut) {
  const where = place(college);
  let t = `${college.name} is ${kindOf(college, 'institute')}${where ? ' in ' + where : ''}.`;
  const ex = examLabels(college); if (ex.length) t += ` It admits through ${joinList(ex)}.`;
  const p = primarySection(cut);
  if (p) {
    const { sec, sum } = p;
    t += ` In ${sum.year}, ${sec.label} offered ${sum.branches} branch${sum.branches === 1 ? '' : 'es'} (${sum.quota} quota), with OPEN-category closing ranks from ${fmt(sum.min)} to ${fmt(sum.max)} (${roundText(sum)}).`;
  }
  return t;
}

export function metaDescription(college, cut) {
  const where = place(college);
  const base = `${college.name} is ${kindOf(college, 'college')}${where ? ' in ' + where : ''}.`;
  const parts = [];
  const p = primarySection(cut);
  const nb = p ? p.sum.branches : branchCount(cut);   // same count as the Overview sentence
  if (nb) parts.push(`${nb} branch${nb === 1 ? '' : 'es'}`);
  if (p) parts.push(`OPEN closing ranks ${fmt(p.sum.min)}-${fmt(p.sum.max)} (${p.sec.label} ${p.sum.year})`);
  const ex = examLabels(college); if (ex.length) parts.push(`admission via ${joinList(ex)}`);
  let out = base;
  const [pb, pr, pe] = [nb ? parts[0] : null, p ? parts[nb ? 1 : 0] : null, ex.length ? parts[parts.length - 1] : null];
  const combos = [[pb, pr, pe], [pb, pr], [pr, pe], [pr], [pb, pe], [pb], [pe]];
  for (const c of combos) { const f = c.filter(Boolean); if (!f.length) continue; const cand = `${base} ${f.join('; ')}.`; if (cand.length <= 160) { out = cand; break; } }
  if (out === base) out = `${base} Admission guidance and counselling support from ASMI Career.`;
  if (out.length > 160) { out = out.slice(0, 157).replace(/\s+\S*$/, '') + '...'; }
  return out;
}

// up to `max` colleges sharing an exam group and type (same state first); each carries its best OPEN closing rank when we have one
export function similarColleges(college, all, max = 6) {
  const g = new Set(college.groups || []);
  const cand = all.filter(c => c.slug !== college.slug && c.type === college.type && (c.groups || []).some(x => g.has(x)));
  const score = (c) => (c.state && c.state === college.state ? 4 : 0) + (c.asmi_recommended ? 2 : 0) + (c.asmi_pulse_score ? 1 : 0);
  cand.sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
  return cand.slice(0, max).map(c => {
    const p = primarySection(cutoffsFor(c, true));
    return { ...c, best: p ? { rank: p.sum.bestRank, basis: p.sec.basis, label: p.sec.label, year: p.sum.year } : null };
  });
}

// Admission text per group (public/data/admissionInfo.json). IITs: JoSAA only (never CSAB); NIT/IIIT/GFTI: JoSAA + CSAB; Maharashtra: CAP.
export function admissionBlocks(college, cut) {
  const ids = college.groups || [];
  const hasJosaaCsab = cut.sections.some(s => s.id === 'josaa' || s.id === 'csab') || ['IIT', 'NIT', 'IIIT', 'GFTI'].includes(college.type);
  const blocks = []; let generic = false;
  const josaaText = (ADMISSION['josaa-csab'] || {})[college.type];
  if ((ids.includes('jee-main') || ids.includes('jee-advanced')) && hasJosaaCsab && josaaText) blocks.push({ id: 'josaa-csab', text: josaaText });
  else if (ids.includes('jee-main') || ids.includes('jee-advanced')) generic = true;
  if (ids.includes('mhtcet') && ADMISSION.mhtcet) blocks.push({ id: 'mhtcet', text: ADMISSION.mhtcet });
  if (ids.some(i => !['jee-main', 'jee-advanced', 'mhtcet'].includes(i))) generic = true;
  return { blocks, generic: generic ? ADMISSION._default : '' };
}

// Q&A pairs for FAQ JSON-LD: ONLY from `official` profile figures, and each answer is also visible on the page.
export function faqItems(college, profile) {
  const out = [];
  if (!profile) return out;
  const nirf = profile.ranking && profile.ranking.nirf;
  if (has(nirf) && nirf.status === 'official' && nirf.value && nirf.value.engineering) {
    out.push({ q: `What is the NIRF engineering rank of ${college.name}?`, a: `${college.name} was ranked ${nirf.value.engineering} in the NIRF ${nirf.year} engineering category.` });
  }
  const f = profile.fees;
  if (f && f.status === 'official' && f.perSemester && f.perSemester.total && f.oneTimeAtAdmission && f.oneTimeAtAdmission.total) {
    out.push({ q: `What is the fee at ${college.name} in the first semester?`, a: `For ${f.year}, the academic fees for the first semester are ${rupees(f.firstSemesterAcademicTotal ? f.firstSemesterAcademicTotal.generalEwsObc : f.oneTimeAtAdmission.total + f.perSemester.total)} for General, EWS and OBC students${f.firstSemesterAcademicTotal && f.firstSemesterAcademicTotal.scStPwd ? ` and ${rupees(f.firstSemesterAcademicTotal.scStPwd)} for SC, ST and PwD students` : ''}, as per the institute's fee circular. The institute may revise fees in later semesters.` });
  }
  return out;
}

export function jsonLd(college, profile) {
  const url = canonicalUrl(college.slug);
  const addr = {};
  if (college.city) addr.addressLocality = college.city;
  if (college.state) addr.addressRegion = college.state;
  const org = { '@context': 'https://schema.org', '@type': 'CollegeOrUniversity', name: college.name, url };
  if (Object.keys(addr).length) org.address = { '@type': 'PostalAddress', ...addr };
  const web = profile && profile.identity && profile.identity.website;
  if (web && web.status === 'official' && web.value) org.sameAs = [web.value];
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Engineering', item: `${SITE_URL}/engineering` },
      { '@type': 'ListItem', position: 2, name: 'Colleges', item: `${SITE_URL}/engineering/colleges` },
      { '@type': 'ListItem', position: 3, name: college.name, item: url },
    ],
  };
  const out = [org, crumbs];
  const faq = faqItems(college, profile);
  if (faq.length) out.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) });
  return out;
}

export { openRows, yearComparison, has };
