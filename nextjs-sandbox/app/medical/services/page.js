'use client';
import './services.css';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

const SERVICES = [
  {
    icon: '🎓',
    title: 'Medical Admission Guidance',
    tag: 'Core Service',
    items: [
      'Comprehensive start-to-end guidance for the entire admission process',
      'Detailed information on all colleges — fees, location, ranking, facilities',
      'Guidance on Mop-Up, Stray Vacancy, and Institute Level rounds',
      'Regular seminars explaining Maharashtra State and AIQ admission rules',
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
      'Guidance on backup options across streams — MBBS, BDS, BAMS, BHMS, BPTh',
      'Interaction with seniors already studying at target colleges',
      'Separate sessions for parents to address their questions and concerns',
    ]
  },
  {
    icon: '📋',
    title: 'College Preference List',
    tag: 'Core Service',
    items: [
      'Detailed analysis of 820+ colleges, seat matrix, and previous year cutoffs',
      'Personalised preference list built for every round — not a one-time template',
      'Category-wise and round-wise cutoff mapping for your specific profile',
      'Open state options included for students with lower Maharashtra chances',
      'Updated after every round result to reflect new cutoff trends',
    ]
  },
  {
    icon: '📄',
    title: 'Admission Form Filling',
    tag: 'Included',
    items: [
      'Registration form filling for MH State CET Cell process',
      'Preference form filling for every round of MH State counselling',
      'MCC AIQ registration and preference filling included',
      'Additional states at ₹5,000/state (Karnataka, UP, Telangana, AP etc.)',
      'Stray Vacancy round form filling covered',
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
      'Guidance on obtaining missing certificates (caste validity, domicile etc.)',
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
      'NTA, MCC, and State CET Cell updates monitored and forwarded daily',
      'No student misses a deadline due to late information',
    ]
  },
  {
    icon: '🏥',
    title: 'Post Allotment Assistance',
    tag: 'Included',
    items: [
      'Guidance on whether to accept allotment, upgrade, or wait for next round',
      'Reporting process explained — dates, documents, DD details, fees',
      'Hostel and accommodation information for allotted college',
      'Bond and stipend details explained before commitment',
      'Final verification of documents before reporting date',
    ]
  },
  {
    icon: '📊',
    title: 'Round-wise Cutoff Data',
    tag: 'Data Access',
    items: [
      'College-wise and round-wise closing ranks across all previous years',
      'Category-wise cutoffs — Open, OBC, SC, ST, EWS, VJ, NT, SBC',
      'Separate cutoff tracking for MH State, AIQ, Management, NRI quotas',
      'Trend analysis — rising vs falling cutoffs for each college',
      'ASMI cutoff booklet provided after NEET results',
    ]
  },
];

export default function ServicesPage() {
  return (
    <div className="svc-page">

      <Nav />

      <section className="svc-hero">
        <div className="svc-hero-inner">
          <span className="svc-eyebrow">SERVICES</span>
          <h1 className="svc-headline">Everything Included. No Hidden Charges.</h1>
          <p className="svc-sub">
            Every service below is part of your ASMI package.
            Not sold separately. Not billed per round.
            One enrolment — complete support until you report to college.
          </p>
          <Link href="/packages" className="svc-hero-link">View Packages & Pricing →</Link>
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
          <p className="svc-cta-sub">Starting from ₹10,000. Pricing varies by branch.</p>
          <div className="svc-cta-btns">
            <Link href="/inquiry" className="svc-cta-btn-primary">Book Free Counselling →</Link>
            <Link href="/packages" className="svc-cta-btn-secondary">View Packages</Link>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}
