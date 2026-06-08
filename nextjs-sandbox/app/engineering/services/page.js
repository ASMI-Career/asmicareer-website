'use client';
import './services.css';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

const engineeringNavLinks = [
  { label: 'Colleges', href: '/engineering/colleges' },
  { label: 'Counselling', href: '/engineering/counselling' },
  { label: 'Packages', href: '/engineering#packages' },
  { label: 'Services', href: '/engineering/services' },
  { label: 'News & Events', href: '/engineering#events' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
];

const SERVICES = [
  {
    icon: '🎓',
    title: 'Engineering Admission Guidance',
    tag: 'Core Service',
    items: [
      'Comprehensive start-to-end guidance for the entire admission process',
      'Detailed information on all colleges — fees, location, ranking, placements',
      'Guidance on JoSAA, CSAB Special Rounds, and Institute Level rounds',
      'Regular seminars explaining JoSAA and State admission rules',
      'Updates on every rule change as it happens during the counselling season',
    ]
  },
  {
    icon: '🤝',
    title: 'One-on-One Personalised Counselling',
    tag: 'Core Service',
    items: [
      'Personal sessions analysing your rank, category, domicile, fees and goals',
      'Round-wise counselling to solve queries across multiple processes simultaneously',
      'Guidance on backup options across branches — CS, IT, AI/ML, ECE, Mech, Civil',
      'Interaction with seniors already studying at target colleges',
      'Separate sessions for parents to address their questions and concerns',
    ]
  },
  {
    icon: '📋',
    title: 'College & Branch Preference List',
    tag: 'Core Service',
    items: [
      'Detailed analysis of 1000+ colleges, seat matrix, and previous year cutoffs',
      'Personalised preference list built for every round — not a one-time template',
      'Category-wise and round-wise cutoff mapping for your specific profile',
      'Open state options included for students with lower state chances',
      'Updated after every round result to reflect new cutoff trends',
    ]
  },
  {
    icon: '📄',
    title: 'Admission Form Filling',
    tag: 'Included',
    items: [
      'Registration form filling for JoSAA and CSAB processes',
      'Preference form filling for every round of MH State CET counselling',
      'Form filling for private and deemed universities (BITS, VIT, SRM, etc.)',
      'Additional states covered (COMEDK, UPSEE, TS EAMCET, etc.)',
      'Spot round and institute-level form filling covered',
      'Vigilant verification before every submission — zero tolerance for errors',
    ]
  },
  {
    icon: '📁',
    title: 'Document Verification',
    tag: 'Included',
    items: [
      'Complete verification of every document before the process begins',
      'Checklist provided with category-specific additional documents',
      'Scanned PDF of every certificate provided to student',
      'Flag and resolve document issues before they cause admission problems',
      'Guidance on obtaining missing certificates (caste validity, EWS, NCL, domicile etc.)',
    ]
  },
  {
    icon: '💬',
    title: 'WhatsApp & Helpline Support',
    tag: 'Included',
    items: [
      'Direct WhatsApp access to your assigned counsellor throughout the process',
      'Central helpline at 7410019074 available during all working hours',
      'No ticketing system — real responses from real counsellors',
      'Query resolution within same business day for registered students',
      'Parent WhatsApp group for branch-wise updates and alerts',
    ]
  },
  {
    icon: '💡',
    title: 'Admission Alerts & Updates',
    tag: 'Included',
    items: [
      'Instant WhatsApp alerts for registration windows, seat matrix, allotment results',
      'Round deadline reminders sent 48 hours and 24 hours before closing',
      'Official notices and government circulars shared immediately',
      'JoSAA, NTA, and State CET Cell updates monitored and forwarded daily',
      'No student misses a deadline due to late information',
    ]
  },
  {
    icon: '🏥',
    title: 'Post Allotment Assistance',
    tag: 'Included',
    items: [
      'Guidance on Float, Slide, or Freeze options after every round',
      'Reporting process explained — dates, documents, fees payment',
      'Hostel and accommodation information for allotted college',
      'Branch upgradation details explained before commitment',
      'Final verification of documents before reporting date',
    ]
  },
  {
    icon: '📊',
    title: 'Round-wise Cutoff Data',
    tag: 'Data Access',
    items: [
      'College-wise and round-wise closing ranks across all previous years',
      'Category-wise cutoffs — General, EWS, OBC-NCL, SC, ST',
      'Separate cutoff tracking for Home State and All India Quotas',
      'Trend analysis — rising vs falling cutoffs for each college and branch',
      'ASMI Engineering Cutoff details provided after JEE/CET results',
    ]
  },
];

export default function EngineeringServicesPage() {
  return (
    <div className="svc-page">

      <Nav links={engineeringNavLinks} ctaHref="/engineering/inquiry" />

      <section className="svc-hero">
        <div className="svc-hero-inner">
          <span className="svc-eyebrow">ENGINEERING SERVICES</span>
          <h1 className="svc-headline">Everything Included. No Hidden Charges.</h1>
          <p className="svc-sub">
            Every service below is part of your ASMI Engineering package.
            Not sold separately. Not billed per round.
            One enrolment — complete support until you report to college.
          </p>
          <Link href="/engineering#packages" className="svc-hero-link">View Packages & Pricing →</Link>
        </div>
      </section>

      <section className="svc-list">
        <div className="svc-list-inner">
          {SERVICES.map((s, i) => (
            <div className="svc-card" key={i}>
              <div className="svc-card-left">
                <div className="svc-icon">{s.icon}</div>
                <span className="svc-tag">{s.tag}</span>
              </div>
              <div className="svc-card-right">
                <div className="svc-title">{s.title}</div>
                <ul className="svc-items">
                  {s.items.map((item, j) => (
                    <li key={j}>
                      <span className="svc-check">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="svc-cta">
        <div className="svc-cta-inner">
          <h2 className="svc-cta-headline">All of this. One enrolment.</h2>
          <p className="svc-cta-sub">Pricing varies by selected package (JoSAA, CET, Deemed).</p>
          <div className="svc-cta-btns">
            <Link href="/engineering/inquiry" className="svc-cta-btn-primary">Book Free Counselling →</Link>
            <Link href="/engineering#packages" className="svc-cta-btn-secondary">View Packages</Link>
          </div>
        </div>
      </section>

      <Footer isEngineering={true} />

    </div>
  );
}
