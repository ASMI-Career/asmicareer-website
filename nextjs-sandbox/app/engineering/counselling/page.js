'use client';
import './counselling.css';
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

const PROCESS_STEPS = [
  { num: 1, title: 'Attend a Seminar', body: 'Start with our free cutoff seminar to understand the admission landscape — college options, cutoffs, quotas, and what to expect this year.' },
  { num: 2, title: 'Expert Assessment', body: 'Book a one-on-one session with an ASMI counsellor. We analyse your rank, category, domicile, budget and target colleges — and give you an honest picture of your options.' },
  { num: 3, title: 'Enrol & Get Assigned', body: 'Once enrolled, you are assigned a dedicated counsellor who knows your file. You are added to the ASMI updates group for real-time alerts.' },
  { num: 4, title: 'Document Verification', body: 'We verify every certificate, flag missing documents, and provide a scanned PDF of your complete document set — before the process begins, not after.' },
  { num: 5, title: 'Preference List Built', body: 'Your counsellor builds a personalised, round-wise preference list — based on your rank, category, budget, city preference, and course. Not a template. Built for you.' },
  { num: 6, title: 'Form Filling', body: 'We fill your registration and preference forms for every round — JoSAA, CSAB, MH State CET, and private universities. Verified before submission. No errors, no rejections.' },
  { num: 7, title: 'Round-by-Round Support', body: 'After every allotment result, we advise on upgradation vs locking, float/slide options, and guide you through reporting requirements.' },
  { num: 8, title: 'Admission Secured', body: 'We stay with you until you physically report to your allotted college and your admission is confirmed. No mid-process handoffs.' },
];

const WHAT_COVERED = [
  { icon: '🏛️', title: 'JoSAA & CSAB', body: 'National counselling for IITs, NITs, IIITs, and GFTIs based on your JEE Main and Advanced ranks.' },
  { icon: '🏢', title: 'MH State CET (CAP)', body: 'Maharashtra State CET Cell process for all government, private, and university-managed engineering colleges in Maharashtra.' },
  { icon: '🌟', title: 'Deemed & Private Unis', body: 'Dedicated guidance for BITS Pilani, VIT, Manipal, SRM, Symbiosis, and other top private institutions.' },
  { icon: '🇮🇳', title: 'Open States', body: 'COMEDK, UPSEE, TS EAMCET, AP EAPCET, and other major state counseling processes for out-of-state options.' },
  { icon: '💼', title: 'Management Quota', body: 'Guidance and support for NRI and management quota seats in top private colleges across India.' },
  { icon: '🎓', title: 'Branch Selection', body: 'In-depth guidance on choosing the right engineering branch based on your aptitude and future career goals.' },
];

export default function EngineeringCounsellingPage() {
  return (
    <div className="coun-page">

      <Nav links={engineeringNavLinks} ctaHref="/engineering/inquiry" homeHref="/engineering" />

      {/* HERO */}
      <section className="coun-hero">
        <div className="coun-hero-inner">
          <span className="coun-eyebrow">ENGINEERING ADMISSION COUNSELLING</span>
          <h1 className="coun-headline">
            Your Rank. The Right College.<br />Every Round Covered.
          </h1>
          <p className="coun-sub">
            ASMI's counselling is not a one-time session. It's a complete end-to-end
            service — from your JEE/CET result to the day you report to your allotted
            college. With a real counsellor assigned to your file.
          </p>
          <div className="coun-hero-btns">
            <Link href="/engineering/inquiry" className="coun-btn-primary">Book Free Counselling →</Link>
            <a href="https://wa.me/917410019074" className="coun-btn-secondary"
              target="_blank" rel="noopener noreferrer">WhatsApp Us 💬</a>
          </div>
        </div>
      </section>

      {/* WHAT WE COVER */}
      <section className="coun-covers">
        <div className="coun-covers-inner">
          <div className="coun-section-label">ADMISSION PROCESSES WE COVER</div>
          <h2 className="coun-section-headline">Every Exam. Every Quota. Every Round.</h2>
          <div className="coun-covers-grid">
            {WHAT_COVERED.map((c, i) => (
              <div className="coun-cover-card" key={i}>
                <div className="coun-cover-icon">{c.icon}</div>
                <div className="coun-cover-title">{c.title}</div>
                <p className="coun-cover-body">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="coun-process">
        <div className="coun-process-inner">
          <div className="coun-section-label">HOW IT WORKS</div>
          <h2 className="coun-section-headline">The ASMI Counselling Process</h2>
          <div className="coun-steps">
            {PROCESS_STEPS.map((s, i) => (
              <div className="coun-step" key={i}>
                <div className="coun-step-num">{s.num}</div>
                <div className="coun-step-content">
                  <div className="coun-step-title">{s.title}</div>
                  <p className="coun-step-body">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFFERENTIATOR */}
      <section className="coun-diff">
        <div className="coun-diff-inner">
          <div className="coun-section-label">WHY ASMI</div>
          <h2 className="coun-section-headline">What Makes ASMI Different</h2>
          <div className="coun-diff-grid">
            {[
              { label: 'Personalised Preference List', asmi: '✓ Built per student, per round', others: '✗ Generic template' },
              { label: 'Form Filling', asmi: '✓ Included (JoSAA + CET + Others)', others: '✗ Extra cost or not offered' },
              { label: 'Document Verification', asmi: '✓ Scanned PDF provided', others: '✗ Not covered' },
              { label: 'Post-Allotment Guidance', asmi: '✓ Until reporting', others: '✗ Ends at result' },
              { label: 'Open State Counselling', asmi: '✓ 10+ states covered', others: '✗ Maharashtra only' },
              { label: 'Pricing', asmi: '✓ ₹10,000–₹30,000', others: '✗ ₹30,000–₹1,20,000' },
            ].map((d, i) => (
              <div className="coun-diff-row" key={i}>
                <div className="coun-diff-label">{d.label}</div>
                <div className="coun-diff-asmi">{d.asmi}</div>
                <div className="coun-diff-others">{d.others}</div>
              </div>
            ))}
          </div>
          <div className="coun-diff-header">
            <div></div>
            <div className="coun-diff-col-head asmi-head">ASMI</div>
            <div className="coun-diff-col-head others-head">Others</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="coun-cta">
        <div className="coun-cta-inner">
          <h2 className="coun-cta-headline">Start with a free session.</h2>
          <p className="coun-cta-sub">No payment required. No obligation. Just clarity on your options.</p>
          <Link href="/engineering/inquiry" className="coun-cta-btn">Book Free Counselling →</Link>
        </div>
      </section>

      <Footer isEngineering={true} />

    </div>
  );
}
