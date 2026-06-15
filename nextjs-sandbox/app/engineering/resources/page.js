'use client';
import './resources.css';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

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

const TOOLS = [
  {
    icon: '🎯',
    title: 'Engineering College Predictor',
    description: 'Enter your JEE or MHT-CET percentile and get a list of colleges you can target — filtered by state, category, quota, and branch.',
    status: 'coming',
    link: null,
    cta: 'Coming Soon',
  },
  {
    icon: '📊',
    title: 'Cutoff Explorer',
    description: 'Browse round-wise closing ranks for 1000+ engineering colleges across all categories, quotas, and years.',
    status: 'coming',
    link: null,
    cta: 'Coming Soon',
  },
  {
    icon: '📋',
    title: 'Document Checklist',
    description: 'Interactive category-aware checklist — select your category and quota to see exactly which documents you need for JoSAA & CET.',
    status: 'coming',
    link: null,
    cta: 'Coming Soon',
  },
  {
    icon: '📅',
    title: 'Deadline Feed',
    description: 'Live counselling round dates, registration windows, and result dates — all in one place.',
    status: 'live',
    link: '/engineering#events',
    cta: 'View Deadlines →',
  },
];

const GUIDES = [
  {
    icon: '📖',
    title: 'JoSAA Counselling Guide',
    description: 'Complete guide to IIT, NIT, IIIT, and GFTI admission process — rounds, registration, preference filling, and freeze/float.',
    tag: 'Guide',
    link: null,
  },
  {
    icon: '🇮🇳',
    title: 'MH State CET CAP Guide',
    description: 'Step-by-step guide to Maharashtra State Engineering counselling — registration, option form filling, reporting.',
    tag: 'Guide',
    link: null,
  },
  {
    icon: '📑',
    title: 'Engineering Document Checklist PDF',
    description: 'Printable checklist of all documents required for B.Tech admission — general and category-specific.',
    tag: 'PDF',
    link: null,
  },
  {
    icon: '💰',
    title: 'Engineering Fees Guide 2025',
    description: 'State-wise fee structures for government, private and deemed engineering colleges across India.',
    tag: 'PDF',
    link: null,
  },
  {
    icon: '🗺️',
    title: 'Open States Guide',
    description: 'How to apply to COMEDK, UPSEE, TS EAMCET, and other major state quotas as an outside student.',
    tag: 'Guide',
    link: null,
  },
  {
    icon: '📹',
    title: 'Video Guides & Webinars',
    description: 'Watch ASMI\'s YouTube channel for detailed admission process explainers, seminar recordings, and Q&A sessions.',
    tag: 'Video',
    link: 'https://www.youtube.com/@ASMICareervideo',
    external: true,
  },
];

export default function EngineeringResourcesPage() {
  return (
    <div className="res-page">

      <Nav links={engineeringNavLinks} ctaHref="/engineering/inquiry" homeHref="/engineering" />

      <section className="res-hero">
        <div className="res-hero-inner">
          <span className="res-eyebrow">ENGINEERING RESOURCES</span>
          <h1 className="res-headline">Tools, Guides & Data.<br />All Free.</h1>
          <p className="res-sub">
            Everything you need to research your options, understand the process,
            and prepare for Engineering counselling — in one place.
          </p>
        </div>
      </section>

      {/* TOOLS */}
      <section className="res-section">
        <div className="res-section-inner">
          <div className="res-section-label">DIGITAL TOOLS</div>
          <h2 className="res-section-headline">Interactive Tools</h2>
          <div className="res-tools-grid">
            {TOOLS.map((t, i) => (
              <div className={`res-tool-card${t.status === 'coming' ? ' res-tool-coming' : ''}`} key={i}>
                <div className="res-tool-top">
                  <div className="res-tool-icon">{t.icon}</div>
                  {t.status === 'coming' && (
                    <span className="res-coming-badge">Coming Soon</span>
                  )}
                  {t.status === 'live' && (
                    <span className="res-live-badge">● Live</span>
                  )}
                </div>
                <div className="res-tool-title">{t.title}</div>
                <p className="res-tool-desc">{t.description}</p>
                {t.link ? (
                  <Link href={t.link} className="res-tool-cta">{t.cta}</Link>
                ) : (
                  <span className="res-tool-cta-disabled">{t.cta}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GUIDES */}
      <section className="res-section res-section-alt">
        <div className="res-section-inner">
          <div className="res-section-label">GUIDES & DOWNLOADS</div>
          <h2 className="res-section-headline">Guides, PDFs & Videos</h2>
          <div className="res-guides-grid">
            {GUIDES.map((g, i) => (
              <div className="res-guide-card" key={i}>
                <div className="res-guide-top">
                  <span className="res-guide-icon">{g.icon}</span>
                  <span className={`res-guide-tag tag-${g.tag.toLowerCase()}`}>{g.tag}</span>
                </div>
                <div className="res-guide-title">{g.title}</div>
                <p className="res-guide-desc">{g.description}</p>
                {g.link ? (
                  <a
                    href={g.link}
                    className="res-guide-link"
                    target={g.external ? '_blank' : undefined}
                    rel={g.external ? 'noopener noreferrer' : undefined}
                  >
                    {g.external ? 'Watch on YouTube →' : 'Download →'}
                  </a>
                ) : (
                  <span className="res-guide-link-disabled">Coming Soon</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="res-cta">
        <div className="res-cta-inner">
          <h2 className="res-cta-headline">Need personalised guidance?</h2>
          <p className="res-cta-sub">Tools give you data. Counsellors give you a strategy.</p>
          <Link href="/engineering/inquiry" className="res-cta-btn">Book Free Counselling →</Link>
        </div>
      </section>

      <Footer isEngineering={true} />

    </div>
  );
}
