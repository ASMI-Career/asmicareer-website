'use client';
import './resources.css';
import Link from 'next/link';

const TOOLS = [
  {
    icon: '🎯',
    title: 'College Predictor',
    description: 'Enter your NEET rank and get a list of colleges you can target — filtered by state, category, quota, and fees.',
    status: 'live',
    link: '/tools/college-predictor',
    cta: 'Try Now →',
  },
  {
    icon: '📊',
    title: 'Cutoff Explorer',
    description: 'Browse round-wise closing ranks for 820+ colleges across all categories, quotas, and years.',
    status: 'live',
    link: '/tools/cutoff-explorer',
    cta: 'Explore Cutoffs →',
  },
  {
    icon: '📋',
    title: 'Document Checklist',
    description: 'Interactive category-aware checklist — select your category and quota to see exactly which documents you need.',
    status: 'coming',
    link: null,
    cta: 'Coming Soon',
  },
  {
    icon: '📅',
    title: 'Deadline Feed',
    description: 'Live counselling round dates, registration windows, and result dates — all in one place.',
    status: 'live',
    link: '/medical#events',
    cta: 'View Deadlines →',
  },
];

const GUIDES = [
  {
    icon: '📖',
    title: 'MH State MBBS Admission Guide',
    description: 'Complete guide to Maharashtra State CET Cell process — CAP rounds, registration, preference filling, reporting.',
    tag: 'Guide',
    link: null,
  },
  {
    icon: '🇮🇳',
    title: 'MCC AIQ Counselling Guide',
    description: 'Step-by-step guide to All India Quota counselling on mcc.nic.in — registration, fee payment, choice filling.',
    tag: 'Guide',
    link: null,
  },
  {
    icon: '📑',
    title: 'Document Checklist PDF',
    description: 'Printable checklist of all documents required for MBBS admission — general and category-specific.',
    tag: 'PDF',
    link: null,
  },
  {
    icon: '💰',
    title: 'MBBS Fees Guide 2025',
    description: 'State-wise fee structures for government, private and deemed MBBS colleges across India.',
    tag: 'PDF',
    link: null,
  },
  {
    icon: '🗺️',
    title: 'Open States Guide',
    description: 'How to apply to Karnataka, UP, Telangana, AP, Tamil Nadu and other state quotas as a Maharashtra student.',
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

export default function ResourcesPage() {
  return (
    <div className="res-page">

      <nav className="res-nav">
        <Link href="/"><img src="/asmi-logo.png" alt="ASMI Career" height="36" /></Link>
        <Link href="/inquiry" className="res-nav-cta">Book Free Session →</Link>
      </nav>

      <section className="res-hero">
        <div className="res-hero-inner">
          <span className="res-eyebrow">RESOURCES</span>
          <h1 className="res-headline">Tools, Guides & Data.<br />All Free.</h1>
          <p className="res-sub">
            Everything you need to research your options, understand the process,
            and prepare for NEET counselling — in one place.
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
          <Link href="/inquiry" className="res-cta-btn">Book Free Counselling →</Link>
        </div>
      </section>

      <div className="res-footer-strip">
        <span>© 2026 ASMI Youth Career Advisor LLP</span>
        <span>asmicareer.com · asmicareer.in</span>
      </div>

    </div>
  );
}
