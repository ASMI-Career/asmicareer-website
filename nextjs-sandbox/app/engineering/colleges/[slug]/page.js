// Public engineering college page. Server component: every block is in the static HTML.
// Data: public/data/engineering-colleges.json, the build-time cutoff index (lib/engCollegeData.js) and the optional per-college
// profile (data/college-profiles/<slug>.json, lib/engCollegeProfile.js). A block is rendered ONLY when its data exists: a missing
// field means no block, no placeholder. Figures carry a "Source, year" line; media-sourced ones carry a "verify" chip.
import Link from 'next/link';
import Nav from '../../../components/Nav';
import Footer from '../../../components/Footer';
import CutoffTables from './CutoffTables';
import TabBar from './TabBar';
import { AddToCompare, CompareBar } from '../CompareControls';
import styles from './college.module.css';
import {
  SITE_URL, PULSE_METHOD_TEXT, WHATSAPP_NUMBER, loadColleges, canonicalUrl, cutoffsFor, isIndexable, examLabels, routeBadge,
  primarySection, branchCount, autoSummary, metaDescription, similarColleges, admissionBlocks, jsonLd, profileFor, fmt, rupees, has, yearComparison,
} from '../../../../lib/engCollegePage';
import { getCollegeCutoffs } from '../../../../lib/engCollegeData';
import { sourceLabel, sourceLinks } from '../../../../lib/engCollegeProfile';

export const dynamicParams = false;

const engineeringNavLinks = [
  { label: 'Colleges', href: '/engineering/colleges' },
  { label: 'Counselling', href: '/engineering/counselling' },
  { label: 'Packages', href: '/engineering#packages' },
  { label: 'Services', href: '/engineering/services' },
  { label: 'Events', href: '/engineering/events' },
  { label: 'News', href: '/engineering/news' },
  { label: 'About Us', href: '/engineering/about' },
  { label: 'Contact Us', href: '/engineering/contact' },
];

export async function generateStaticParams() {
  return loadColleges().map((c) => ({ slug: c.slug }));
}

const find = async (params) => { const { slug } = await params; return loadColleges().find((c) => c.slug === slug); };

export async function generateMetadata({ params }) {
  const college = await find(params);
  if (!college) return {};
  const cut = cutoffsFor(college);
  const title = `${college.name} - Cutoffs, Branches & Admission | ASMI Career`;
  const description = metaDescription(college, cut);
  const url = canonicalUrl(college.slug);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'ASMI Career' },
    robots: isIndexable(college) ? { index: true, follow: true } : { index: false, follow: true },
  };
}

const initials = (name) => { const w = String(name).split(/\s+/).filter(Boolean); return (w.length > 1 ? w[0][0] + w[1][0] : String(name).slice(0, 2)).toUpperCase(); };
const pretty = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
const FEE_LABEL = {
  admissionFee: 'Admission fee', alumniLifeMembership: 'Alumni life membership', studentWelfareFund: 'Student welfare fund',
  tuitionStatutory: 'Tuition (statutory)', registrationAndExamination: 'Registration and examination', gymkhana: 'Gymkhana',
  studentBenevolentFund: 'Student benevolent fund', accidentInsurance: 'Accident insurance', medical: 'Medical',
  instituteSecurity: 'Institute security deposit', librarySecurity: 'Library security deposit',
};
const feeLabel = (k) => FEE_LABEL[k] || pretty(k);

// "Source, year" line. status 'secondary' (news / aggregator) adds the verify chip until the team marks the figure official.
function Src({ status, year, source }) {
  const label = sourceLabel(source);
  if (!label && !year) return null;
  const links = sourceLinks(source);
  return (
    <div className={styles.src}>
      <span>Source: {links.length ? links.map((l, i) => <span key={l.href}>{i ? ', ' : ''}<a href={l.href} target="_blank" rel="noopener noreferrer nofollow">{l.host}</a></span>) : label}{year ? `, ${year}` : ''}</span>
      {status === 'secondary' && <span className={styles.verify}>Reported by media, verify</span>}
    </div>
  );
}

function KV({ title, obj, total = true }) {
  const rows = Object.entries(obj).filter(([k, v]) => typeof v === 'number' && k !== 'total');
  if (!rows.length) return null;
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption>{title}</caption>
        <tbody>
          {rows.map(([k, v]) => <tr key={k}><th scope="row">{feeLabel(k)}</th><td className={styles.num}>{rupees(v)}</td></tr>)}
          {total && typeof obj.total === 'number' && <tr className={styles.totalRow}><th scope="row">Total</th><td className={styles.num}>{rupees(obj.total)}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// 4-year B.Tech estimate, built only from the official per-semester figures; always labelled an estimate with its formula
function feeEstimate(profile) {
  const f = profile.fees; const prog = ((profile.programmes || {}).value || []).find((p) => /^B\.?\s?Tech$/i.test(p.degree) && p.years);
  if (!f || !prog || !f.oneTimeAtAdmission || !f.perSemester || typeof f.perSemester.total !== 'number') return null;
  const sems = prog.years * 2; const one = f.oneTimeAtAdmission.total; const per = f.perSemester.total;
  const out = [{ who: 'General, EWS, OBC', total: one + sems * per, formula: `${rupees(one)} one-time + ${sems} semesters × ${rupees(per)}` }];
  if (typeof f.perSemester.tuitionStatutory === 'number') { const per2 = per - f.perSemester.tuitionStatutory; out.push({ who: 'SC, ST, PwD (tuition exempt)', total: one + sems * per2, formula: `${rupees(one)} one-time + ${sems} semesters × ${rupees(per2)}` }); }
  return { prog, out };
}

function comparisonFor(college, cut) {
  let sec = cut.sections.find((s) => s.id === 'josaa' && s.rich);
  if (!sec) { const rich = getCollegeCutoffs(college, { rich: true }); sec = rich.sections.find((s) => s.id === 'josaa'); }
  if (!sec) return null;
  const cmp = yearComparison(sec);
  if (!cmp) return null;
  return { sec, cmp };
}

export default async function Page({ params }) {
  const all = loadColleges();
  const college = await find(params);
  const profile = profileFor(college);
  const cut = cutoffsFor(college);
  const prim = primarySection(cut);
  const nBranches = branchCount(cut);
  const labels = examLabels(college);
  const routes = routeBadge(college);
  const where = [college.city, college.state].filter(Boolean).join(', ');
  const description = college.description && String(college.description).trim();
  const id = (profile && profile.identity) || {};
  const nirf = profile && profile.ranking && profile.ranking.nirf;
  const recommended = profile ? profile.asmiRecommended === true : Boolean(college.asmi_recommended);
  const website = has(id.website) ? id.website.value : null;
  const showPulse = Boolean(college.asmi_pulse_score) && PULSE_METHOD_TEXT.length > 0;
  const fees = profile && profile.fees && profile.fees.status !== 'missing' && profile.fees.oneTimeAtAdmission ? profile.fees : null;
  const placements = profile && profile.placements && has(profile.placements) ? profile.placements : null;
  const seats = profile && has(profile.seats) ? profile.seats : null;
  const admission = (profile && profile.admission) || {};
  const adm = admissionBlocks(college, cut);
  const windows = Object.entries(admission).filter(([k, v]) => /^feePaymentWindow/.test(k) && has(v));
  const route = has(admission.route) ? admission.route : null;
  const facilities = profile && has(profile.facilities) ? profile.facilities : null;
  const contact = profile && has(profile.contact) ? profile.contact : null;
  const railway = profile && profile.location && has(profile.location.nearestRailway) ? profile.location.nearestRailway : null;
  const airport = profile && profile.location && has(profile.location.nearestAirport) ? profile.location.nearestAirport : null;
  const hasCampus = has(id.address) || has(id.campusAcres) || railway || airport || facilities || contact;
  const similar = similarColleges(college, all, 6);
  const cmp = cut.sections.length ? comparisonFor(college, cut) : null;
  const est = fees ? feeEstimate(profile) : null;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi, I need counselling help for ${college.name}`)}`;
  const inquiryHref = `/engineering/inquiry?college=${encodeURIComponent(college.name)}`;

  // hero stats: only those with data
  const stats = [];
  if (nirf && has(nirf) && nirf.value && nirf.value.engineering) stats.push({ k: 'NIRF engineering rank', v: `#${nirf.value.engineering}`, src: { status: nirf.status, year: nirf.year, source: nirf.source } });
  if (has(id.established)) stats.push({ k: 'Established', v: String(id.established.value), src: { status: id.established.status, year: id.established.year, source: id.established.source } });
  if (prim) stats.push({ k: 'Best closing rank (OPEN)', v: fmt(prim.sum.bestRank), sub: `${prim.sum.bestBranch} · ${prim.sec.label} ${prim.sum.year} · Round ${prim.sum.bestRound} · ${prim.sec.basis}` });
  if (nBranches) stats.push({ k: 'Branches', v: String(nBranches) });
  if (seats) stats.push({ k: 'UG intake', v: fmt(seats.value), src: { status: seats.status, year: seats.year, source: seats.source } });

  const tabs = [{ id: 'overview', label: 'Overview' }];
  if (cut.sections.length) tabs.push({ id: 'cutoffs', label: 'Branches & Cut-offs' });
  if (fees) tabs.push({ id: 'fees', label: 'Fees' });
  tabs.push({ id: 'admissions', label: 'Admissions' });
  if (placements) tabs.push({ id: 'placements', label: 'Placements' });
  if (hasCampus) tabs.push({ id: 'campus', label: 'Campus & Location' });
  if (similar.length) tabs.push({ id: 'similar', label: 'Compare similar' });

  const ld = jsonLd(college, profile).map((o) => JSON.stringify(o).replace(/</g, '\\u003c'));
  const students = has(id.students) ? id.students.value : null;
  const highlights = [];
  if (nirf && has(nirf) && nirf.value && nirf.value.engineering) highlights.push({ k: 'NIRF engineering rank', v: `#${nirf.value.engineering}`, note: nirf.value.overall ? `Overall #${nirf.value.overall}` : '', src: nirf });
  if (has(id.established)) highlights.push({ k: 'Established', v: String(id.established.value), src: id.established });
  if (has(id.campusAcres)) highlights.push({ k: 'Campus', v: `${fmt(id.campusAcres.value)} acres`, src: id.campusAcres });
  if (students && students.total) highlights.push({ k: 'Students', v: fmt(students.total), note: [students.ug && `UG ${fmt(students.ug)}`, students.pg && `PG ${fmt(students.pg)}`, students.phd && `PhD ${fmt(students.phd)}`].filter(Boolean).join(' · '), src: id.students });
  if (has(id.faculty)) highlights.push({ k: 'Faculty', v: fmt(id.faculty.value), src: id.faculty });
  if (has(id.status)) highlights.push({ k: 'Designation', v: id.status.value, src: id.status });

  return (
    <div className={styles.page}>
      <Nav links={engineeringNavLinks} ctaHref="/engineering/inquiry" homeHref="/engineering" />
      {ld.map((j, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: j }} />)}

      <header className={styles.hero}>
        <div className={styles.wrap}>
          <nav className={styles.crumbs} aria-label="Breadcrumb">
            <Link href="/engineering">Engineering</Link><span aria-hidden="true">›</span>
            <Link href="/engineering/colleges">Colleges</Link><span aria-hidden="true">›</span>
            <span aria-current="page">{college.name}</span>
          </nav>
          <div className={styles.heroRow}>
            <div className={styles.logo} aria-hidden="true">{initials(college.name)}</div>
            <div>
              <h1 className={styles.h1}>{college.name}</h1>
              <div className={styles.pills}>
                {college.city && <span className={styles.pill}>📍 {college.city}</span>}
                {college.state && <span className={styles.pill}>🏛️ {college.state}</span>}
                {college.type && <span className={styles.pill}>🎓 {college.type}</span>}
                {college.course && <span className={styles.pill}>📖 {college.course === 'BTech' ? 'B.Tech' : college.course}</span>}
                {routes.map((r) => <span key={r} className={styles.chip}>{r}</span>)}
                {recommended && <span className={styles.rec}>★ ASMI RECOMMENDS</span>}
              </div>
            </div>
          </div>
          <div className={styles.ctaRow}>
            <Link href={inquiryHref} className={styles.ctaPrimary}>Talk to ASMI Experts →</Link>
            {website && <a href={website} target="_blank" rel="noopener noreferrer" className={styles.ctaSecondary}>College Website ↗</a>}
            <AddToCompare slug={college.slug} variant="light" />
          </div>
        </div>
      </header>

      <div className={styles.wrap}>
        {stats.length > 0 && (
          <div className={styles.stats}>
            {stats.map((s) => (
              <div key={s.k} className={styles.stat}>
                <span className={styles.statV}>{s.v}</span>
                <span className={styles.statK}>{s.k}</span>
                {s.sub && <span className={styles.statSub}>{s.sub}</span>}
                {s.src && <Src {...s.src} />}
              </div>
            ))}
          </div>
        )}

        <TabBar items={tabs} />

        <div className={styles.layout}>
          <aside className={styles.aside}>
            <div className={styles.helpCard}>
              <h2 className={styles.h3}>Need counselling help?</h2>
              <p className={styles.small}>Talk to an ASMI counsellor about {college.name}: cut-offs, preference list and the admission process.</p>
              <Link href={inquiryHref} className={styles.ctaPrimary}>Talk to Experts →</Link>
              <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>WhatsApp our counsellor</a>
            </div>
            {showPulse && (
              <div className={styles.helpCard}>
                <h2 className={styles.h3}>ASMI Pulse Score</h2>
                <div className={styles.pulseV}>{college.asmi_pulse_score}</div>
                <p className={styles.small}>{PULSE_METHOD_TEXT}</p>
              </div>
            )}
          </aside>

          <div className={styles.main}>
            <section id="overview" className={styles.section}>
              <h2 className={styles.h2}>Overview</h2>
              <p className={styles.p}>{description || autoSummary(college, cut)}</p>
              {highlights.length > 0 && (
                <>
                  <h3 className={styles.h3}>Key highlights</h3>
                  <div className={styles.hlGrid}>
                    {highlights.map((h) => (
                      <div key={h.k} className={styles.hl}>
                        <span className={styles.hlK}>{h.k}</span>
                        <span className={styles.hlV} style={String(h.v).length > 22 ? { fontSize: 15 } : undefined}>{h.v}</span>
                        {h.note && <span className={styles.hlNote}>{h.note}</span>}
                        <Src status={h.src.status} year={h.src.year} source={h.src.source} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>

            {cut.sections.length > 0 && (
              <section id="cutoffs" className={styles.section}>
                <h2 className={styles.h2}>Branches &amp; Cut-offs</h2>
                <p className={styles.notice}>Last year&apos;s ranks are a guide, not a promise. Ranks are from the {[...new Set(cut.sections.flatMap((s) => s.years.map((y) => y.y)))].sort((a, b) => b - a).join(' and ')} counselling rounds. Use the selectors to change category, gender pool, round and year.</p>
                <CutoffTables sections={cut.sections} />
                {cmp && (
                  <div className={styles.cutBlock}>
                    <h3 className={styles.h3}>{cmp.cmp.prevYear} vs {cmp.cmp.latestYear} closing rank</h3>
                    <p className={styles.muted}>{cmp.sec.label}, OPEN category, gender-neutral, final available round of each year. Rank type: {cmp.sec.basis}.</p>
                    <div className={styles.tableWrap}>
                      <table className={styles.table}>
                        <caption>{cmp.sec.label} · OPEN · {cmp.cmp.prevYear} vs {cmp.cmp.latestYear}</caption>
                        <thead><tr><th scope="col">Branch</th><th scope="col" className={styles.num}>{cmp.cmp.prevYear}</th><th scope="col" className={styles.num}>{cmp.cmp.latestYear}</th><th scope="col" className={styles.num}>Change</th></tr></thead>
                        <tbody>
                          {cmp.cmp.rows.map((r) => {
                            const d = r.latest.rank - r.prev.rank; const [bn, di, y] = cmp.sec.b[r.bi];
                            return (
                              <tr key={r.bi}>
                                <td>{bn}{di >= 0 ? <span className={styles.degTag}> · {cmp.sec.dg[di]}{y ? `, ${y} yrs` : ''}</span> : null}</td>
                                <td className={styles.num}>{fmt(r.prev.rank)}</td><td className={styles.num}>{fmt(r.latest.rank)}</td>
                                <td className={styles.num}>{d === 0 ? '0' : d > 0 ? `+${fmt(d)}` : `−${fmt(-d)}`}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {fees && (
              <section id="fees" className={styles.section}>
                <h2 className={styles.h2}>Fees</h2>
                <p className={styles.p}>{fees.year}</p>
                <Src status={fees.status} year={null} source={fees.source} />
                <div className={styles.twoCol}>
                  <KV title="One-time, at admission" obj={fees.oneTimeAtAdmission} />
                  {fees.perSemester && <KV title="Every semester" obj={fees.perSemester} />}
                  {fees.refundableDeposits && <KV title="Refundable deposits" obj={fees.refundableDeposits} />}
                </div>
                {fees.firstSemesterAcademicTotal && (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <caption>First semester</caption>
                      <thead><tr><th scope="col">Category</th><th scope="col" className={styles.num}>Academic total</th>{fees.firstSemesterPayable && <th scope="col" className={styles.num}>Payable with hostel</th>}</tr></thead>
                      <tbody>
                        <tr><th scope="row">General, EWS, OBC</th><td className={styles.num}>{rupees(fees.firstSemesterAcademicTotal.generalEwsObc)}</td>{fees.firstSemesterPayable && <td className={styles.num}>{rupees(fees.firstSemesterPayable.generalEwsObc)}</td>}</tr>
                        <tr><th scope="row">SC, ST, PwD</th><td className={styles.num}>{rupees(fees.firstSemesterAcademicTotal.scStPwd)}</td>{fees.firstSemesterPayable && <td className={styles.num}>{rupees(fees.firstSemesterPayable.scStPwd)}</td>}</tr>
                      </tbody>
                    </table>
                  </div>
                )}
                {(typeof fees.hostelFirstSemester === 'number' || typeof fees.messAdvancePerSemester === 'number') && (
                  <ul className={styles.bullets}>
                    {typeof fees.hostelFirstSemester === 'number' && <li>Hostel, first semester: <strong>{rupees(fees.hostelFirstSemester)}</strong></li>}
                    {typeof fees.messAdvancePerSemester === 'number' && <li>Mess advance, per semester: <strong>{rupees(fees.messAdvancePerSemester)}</strong> (paid separately)</li>}
                  </ul>
                )}
                {fees.tuitionExemption && <p className={styles.p}>{fees.tuitionExemption}</p>}
                {fees.firstSemesterPayable && fees.firstSemesterPayable.note && <p className={styles.muted}>{fees.firstSemesterPayable.note}</p>}
                {est && (
                  <div className={styles.estimate}>
                    <strong>Estimate, not an official figure: {est.prog.degree} over {est.prog.years} years</strong>
                    <ul className={styles.bullets}>
                      {est.out.map((e) => <li key={e.who}>{e.who}: <strong>{rupees(e.total)}</strong> <span className={styles.muted}>= {e.formula}</span></li>)}
                    </ul>
                    <span className={styles.muted}>Excludes hostel, mess and the refundable deposits, and assumes the fees stay the same every semester.</span>
                  </div>
                )}
                {fees.caveat && <p className={styles.notice}>The institute may revise fees in later semesters. Always check the latest fee circular on the institute&apos;s website.</p>}
              </section>
            )}

            <section id="admissions" className={styles.section}>
              <h2 className={styles.h2}>Admissions</h2>
              {(routes.length > 0 || labels.length > 0) && <div className={styles.pills}>{(routes.length ? routes : labels).map((l) => <span key={l} className={styles.chip}>{l}</span>)}</div>}
              {adm.blocks.map((b) => <p key={b.id} className={styles.p}>{b.text}</p>)}
              {(adm.generic || adm.blocks.length === 0) && <p className={styles.p}>{adm.generic || 'Contact ASMI for the current admission process.'}</p>}
              {route && (<><p className={styles.p}>{route.value}</p><Src status={route.status} year={route.year} source={route.source} /></>)}
              {windows.length > 0 && (
                <ul className={styles.bullets}>
                  {windows.map(([k, v]) => <li key={k}>New-entrant fee payment window: <strong>{v.value}</strong><Src status={v.status} year={null} source={v.source} /></li>)}
                </ul>
              )}
              <p className={styles.p}><Link href="/tools/documents-checklist" className={styles.inlineLink}>Open the document checklist →</Link> <span className={styles.muted}>(also inside your student dashboard)</span></p>
            </section>

            {placements && (
              <section id="placements" className={styles.section}>
                <h2 className={styles.h2}>Placements{placements.year ? ` ${placements.year}` : ''}</h2>
                <Src status={placements.status} year={placements.year} source={placements.source} />
                <div className={styles.hlGrid}>
                  {[
                    ['offersAccepted', 'Offers accepted', fmt], ['companiesWithOffers', 'Companies with offers', fmt], ['companiesParticipated', 'Companies participated', fmt],
                    ['averageCtcLakh', 'Average CTC', (n) => `₹${n} lakh`], ['medianCtcLakh', 'Median CTC', (n) => `₹${n} lakh`],
                    ['ppoAccepted', 'PPOs accepted', fmt], ['internationalOffers', 'International offers', fmt], ['registered', 'Students registered', fmt], ['participated', 'Students participated', fmt],
                  ].filter(([k]) => typeof placements.value[k] === 'number').map(([k, label, f]) => (
                    <div key={k} className={styles.hl}><span className={styles.hlK}>{label}</span><span className={styles.hlV}>{f(placements.value[k])}</span></div>
                  ))}
                </div>
                {Array.isArray(placements.caveats) && placements.caveats.length > 0 && (
                  <ul className={styles.bullets}>{placements.caveats.map((c, i) => <li key={i} className={styles.muted}>{c}</li>)}</ul>
                )}
              </section>
            )}

            {hasCampus && (
              <section id="campus" className={styles.section}>
                <h2 className={styles.h2}>Campus &amp; Location</h2>
                {has(id.address) && (
                  <>
                    <p className={styles.p}>{id.address.value}</p>
                    <a className={styles.ctaSecondaryDark} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${college.name}, ${id.address.value}`)}`} target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a>
                    <Src status={id.address.status} year={id.address.year} source={id.address.source} />
                  </>
                )}
                {has(id.campusAcres) && <p className={styles.p}>Campus area: <strong>{fmt(id.campusAcres.value)} acres</strong></p>}
                {railway && <p className={styles.p}>Nearest railway station: <strong>{railway.value}</strong><Src status={railway.status} year={railway.year} source={railway.source} /></p>}
                {airport && <p className={styles.p}>Nearest airport: <strong>{airport.value}</strong><Src status={airport.status} year={airport.year} source={airport.source} /></p>}
                {facilities && Array.isArray(facilities.value) && <><h3 className={styles.h3}>Facilities</h3><ul className={styles.bullets}>{facilities.value.map((f, i) => <li key={i}>{f}</li>)}</ul><Src status={facilities.status} year={facilities.year} source={facilities.source} /></>}
                {contact && <p className={styles.p}>{typeof contact.value === 'string' ? contact.value : JSON.stringify(contact.value)}<Src status={contact.status} year={contact.year} source={contact.source} /></p>}
              </section>
            )}

            {similar.length > 0 && (
              <section id="similar" className={styles.section}>
                <h2 className={styles.h2}>Compare similar colleges</h2>
                <ul className={styles.simList}>
                  {similar.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/engineering/colleges/${c.slug}`}>{c.name}</Link>
                      <span>{[c.city, c.state].filter(Boolean).join(', ')}{c.type ? ` · ${c.type}` : ''}</span>
                      {c.best && <span className={styles.simRank}>Best OPEN closing rank {fmt(c.best.rank)} ({c.best.label} {c.best.year}, {c.best.basis})</span>}
                      <AddToCompare slug={c.slug} small />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
      <CompareBar />
      <Footer isEngineering />
    </div>
  );
}
