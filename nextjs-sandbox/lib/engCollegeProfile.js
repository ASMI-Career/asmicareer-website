// SERVER ONLY. Per-college profile files: nextjs-sandbox/data/college-profiles/<directory slug>.json, read at BUILD time and
// inlined into the page (the folder is deliberately NOT under public/, so it adds no files to the export and the team's
// todo/caveat notes are not downloadable).
//
// Every figure carries value + year + source + status. status: 'official' | 'secondary' | 'official-by-rule' | 'missing'.
// A block is shown only when its data exists; a malformed profile FAILS THE BUILD (better than publishing a wrong number).
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'data/college-profiles');
const STATUSES = new Set(['official', 'secondary', 'official-by-rule', 'missing']);
const cache = new Map();

const sum = (o, skip = ['total']) => Object.entries(o).filter(([k, v]) => !skip.includes(k) && typeof v === 'number').reduce((a, [, v]) => a + v, 0);

// internal consistency checks for the fee block (a typo in a fee must not reach the page)
function checkFees(f, problems) {
  if (!f || typeof f !== 'object' || f.status === 'missing') return;
  const one = f.oneTimeAtAdmission, per = f.perSemester, dep = f.refundableDeposits;
  for (const [n, o] of [['oneTimeAtAdmission', one], ['perSemester', per], ['refundableDeposits', dep]]) {
    if (o && typeof o.total === 'number' && sum(o) !== o.total) problems.push(`fees.${n}: parts add up to ${sum(o)} but total is ${o.total}`);
  }
  const g = f.firstSemesterAcademicTotal;
  if (g && one && per && dep) {
    const general = one.total + per.total + dep.total;
    if (typeof g.generalEwsObc === 'number' && g.generalEwsObc !== general) problems.push(`fees.firstSemesterAcademicTotal.generalEwsObc should be ${general}`);
    if (typeof g.scStPwd === 'number' && typeof per.tuitionStatutory === 'number' && g.scStPwd !== general - per.tuitionStatutory) problems.push(`fees.firstSemesterAcademicTotal.scStPwd should be ${general - per.tuitionStatutory}`);
  }
  const pay = f.firstSemesterPayable, g2 = f.firstSemesterAcademicTotal;
  if (pay && g2 && typeof f.hostelFirstSemester === 'number') {
    if (typeof pay.generalEwsObc === 'number' && pay.generalEwsObc !== g2.generalEwsObc + f.hostelFirstSemester) problems.push('fees.firstSemesterPayable.generalEwsObc != academic total + hostel');
    if (typeof pay.scStPwd === 'number' && pay.scStPwd !== g2.scStPwd + f.hostelFirstSemester) problems.push('fees.firstSemesterPayable.scStPwd != academic total + hostel');
  }
}

export function validate(slug, p) {
  const problems = [];
  if (p.slug !== slug) problems.push(`slug "${p.slug}" must equal the file name "${slug}"`);
  (function walk(o, trail) {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach((x, i) => walk(x, trail + `[${i}]`)); return; }
    if ('status' in o && typeof o.status === 'string') {
      if (!STATUSES.has(o.status)) problems.push(`${trail}: unknown status "${o.status}"`);
      else if (o.status !== 'missing' && o.status !== 'official-by-rule' && 'value' in o && o.value !== null && !o.source) problems.push(`${trail}: a figure needs a source`);
    }
    for (const [k, v] of Object.entries(o)) walk(v, trail ? `${trail}.${k}` : k);
  })(p, '');
  checkFees(p.fees, problems);
  if (problems.length) throw new Error(`Invalid college profile ${slug}.json:\n - ` + problems.join('\n - '));
}

export function loadProfile(slug) {
  if (cache.has(slug)) return cache.get(slug);
  const file = path.join(DIR, `${slug}.json`);
  let out = null;
  if (fs.existsSync(file)) { out = JSON.parse(fs.readFileSync(file, 'utf8')); validate(slug, out); }
  cache.set(slug, out);
  return out;
}

export function allProfileSlugs() {
  try { return fs.readdirSync(DIR).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)); } catch { return []; }
}

// a figure object is usable only when it has a value and is not marked missing
export const has = (f) => Boolean(f) && f.status !== 'missing' && f.value !== null && f.value !== undefined && f.value !== '';

// "iitb.ac.in" for every URL inside a source string; otherwise the text itself (trimmed)
export function sourceLabel(source) {
  const list = Array.isArray(source) ? source : [source];
  const out = [];
  for (const s of list) {
    const urls = String(s || '').match(/https?:\/\/[^\s;,)]+/g);
    if (urls) for (const u of urls) { try { const h = new URL(u).hostname.replace(/^www\./, ''); if (!out.includes(h)) out.push(h); } catch { /* ignore */ } }
    else if (s) out.push(String(s).slice(0, 80));
  }
  return out.join(', ');
}
export function sourceLinks(source) {
  const list = Array.isArray(source) ? source : [source]; const out = [];
  for (const s of list) for (const u of (String(s || '').match(/https?:\/\/[^\s;,)]+/g) || [])) { try { out.push({ href: u, host: new URL(u).hostname.replace(/^www\./, '') }); } catch { /* ignore */ } }
  const seen = new Set(); return out.filter(x => (seen.has(x.href) ? false : seen.add(x.href)));
}
