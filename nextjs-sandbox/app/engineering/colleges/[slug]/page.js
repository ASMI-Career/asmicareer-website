// Public engineering college page. Server component: every section is in the static HTML.
// Data: public/data/engineering-colleges.json (+ build-time cutoff index in lib/engCollegeData.js). Nothing is invented:
// a missing field means the line or section is not rendered.
import Link from 'next/link';
import Nav from '../../../components/Nav';
import Footer from '../../../components/Footer';
import CutoffTables from './CutoffTables';
import styles from './college.module.css';
import {
  SITE_URL, PULSE_METHOD_TEXT, loadColleges, canonicalUrl, cutoffsFor, isIndexable, examLabels, primarySection, branchCount,
  autoSummary, metaDescription, similarColleges, admissionBlocks, jsonLd,
} from '../../../../lib/engCollegePage';

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

const fmt = (n) => Number(n).toLocaleString('en-IN');
const initials = (name) => { const w = String(name).split(/\s+/).filter(Boolean); return (w.length > 1 ? w[0][0] + w[1][0] : String(name).slice(0, 2)).toUpperCase(); };

export default async function Page({ params }) {
  const all = loadColleges();
  const college = await find(params);
  const cut = cutoffsFor(college);
  const prim = primarySection(cut);
  const nBranches = branchCount(cut);
  const labels = examLabels(college);
  const where = [college.city, college.state].filter(Boolean).join(', ');
  const hasFees = Boolean(college.seats || college.annual_fees);
  const adm = admissionBlocks(college, cut);
  const similar = similarColleges(college, all, 6);
  const description = college.description && String(college.description).trim();
  const showPulse = Boolean(college.asmi_pulse_score) && PULSE_METHOD_TEXT.length > 0;

  const stats = [];
  if (college.seats) stats.push({ k: 'Seats', v: fmt(college.seats) });
  if (college.annual_fees) stats.push({ k: 'Annual fees', v: `₹${fmt(college.annual_fees)}` });
  if (nBranches) stats.push({ k: 'Branches', v: String(nBranches) });
  if (prim) stats.push({ k: 'Best closing rank (OPEN)', v: fmt(prim.sum.bestRank), sub: `${prim.sum.bestBranch} · ${prim.sec.label} ${prim.sec.year} · Round ${prim.sum.bestRound} · ${prim.sec.basis}` });

  const nav = [{ id: 'overview', label: 'Overview' }];
  if (cut.sections.length) nav.push({ id: 'cutoffs', label: 'Branches & Cut-offs' });
  nav.push({ id: 'admissions', label: 'Admissions' });
  nav.push({ id: 'fees', label: hasFees ? 'Fees & Seats' : 'Fees & Contact' });
  if (similar.length) nav.push({ id: 'similar', label: 'Similar colleges' });

  const ld = jsonLd(college).map((o) => JSON.stringify(o).replace(/</g, '\\u003c'));

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
                {where && <span className={styles.pill}>📍 {where}</span>}
                {college.type && <span className={styles.pill}>🎓 {college.type}</span>}
                {labels.map((l) => <span key={l} className={styles.chip}>{l}</span>)}
                {college.asmi_recommended && <span className={styles.rec}>★ ASMI RECOMMENDS</span>}
              </div>
            </div>
          </div>
          <div className={styles.ctaRow}>
            <Link href="/engineering/inquiry" className={styles.ctaPrimary}>Talk to ASMI Experts →</Link>
            {college.website && <a href={college.website} target="_blank" rel="noopener noreferrer" className={styles.ctaSecondary}>College Website ↗</a>}
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
              </div>
            ))}
          </div>
        )}

        <nav className={styles.anchors} aria-label="On this page">
          {nav.map((n) => <a key={n.id} href={`#${n.id}`}>{n.label}</a>)}
        </nav>

        <section id="overview" className={styles.section}>
          <h2 className={styles.h2}>Overview</h2>
          <p className={styles.p}>{description || autoSummary(college, cut)}</p>
          {showPulse && (
            <div className={styles.pulse}>
              <div><span className={styles.pulseV}>{college.asmi_pulse_score}</span><span className={styles.pulseK}>ASMI Pulse Score</span></div>
              <p className={styles.p}>{PULSE_METHOD_TEXT}</p>
            </div>
          )}
        </section>

        {cut.sections.length > 0 && (
          <section id="cutoffs" className={styles.section}>
            <h2 className={styles.h2}>Branches &amp; Cut-offs</h2>
            <p className={styles.notice}>Last year&apos;s ranks are a guide, not a promise. Data shown is from the {[...new Set(cut.sections.map((s) => s.year))].join(' / ')} counselling rounds.</p>
            <CutoffTables sections={cut.sections} />
          </section>
        )}

        <section id="admissions" className={styles.section}>
          <h2 className={styles.h2}>Admissions</h2>
          {labels.length > 0 && <div className={styles.pills}>{labels.map((l) => <span key={l} className={styles.chip}>{l}</span>)}</div>}
          {adm.blocks.map((b) => <p key={b.id} className={styles.p}>{b.text}</p>)}
          {(adm.generic || (adm.blocks.length === 0)) && <p className={styles.p}>{adm.generic || 'Contact ASMI for the current admission process.'}</p>}
        </section>

        <section id="fees" className={styles.section}>
          <h2 className={styles.h2}>{hasFees ? 'Fees & Seats' : 'Fees & Contact'}</h2>
          {hasFees ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <tbody>
                  {college.seats ? <tr><th scope="row">Seats</th><td>{fmt(college.seats)}</td></tr> : null}
                  {college.annual_fees ? <tr><th scope="row">Annual fees</th><td>₹{fmt(college.annual_fees)}</td></tr> : null}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.ask}>
              <p className={styles.p}>Want this college&apos;s fees and contact details? Ask ASMI.</p>
              <Link href="/engineering/inquiry" className={styles.ctaPrimary}>Talk to ASMI Experts →</Link>
            </div>
          )}
        </section>

        {similar.length > 0 && (
          <section id="similar" className={styles.section}>
            <h2 className={styles.h2}>Similar colleges</h2>
            <ul className={styles.simList}>
              {similar.map((c) => (
                <li key={c.slug}><Link href={`/engineering/colleges/${c.slug}`}>{c.name}</Link><span>{[c.city, c.state].filter(Boolean).join(', ')}</span></li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <Footer isEngineering />
    </div>
  );
}
