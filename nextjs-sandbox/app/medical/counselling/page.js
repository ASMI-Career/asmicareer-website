'use client';
import './counselling.css';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

const PROCESS_STEPS = [
  { num: 1, title: 'Attend a Seminar', body: 'Start with our free cutoff seminar to understand the admission landscape — college options, cutoffs, quotas, and what to expect this year.' },
  { num: 2, title: 'Expert Assessment', body: 'Book a one-on-one session with an ASMI counsellor. We analyse your rank, category, domicile, budget and target colleges — and give you an honest picture of your options.' },
  { num: 3, title: 'Enrol & Get Assigned', body: 'Once enrolled, you are assigned a dedicated counsellor who knows your file. You are added to the ASMI updates group for real-time alerts.' },
  { num: 4, title: 'Document Verification', body: 'We verify every certificate, flag missing documents, and provide a scanned PDF of your complete document set — before the process begins, not after.' },
  { num: 5, title: 'Preference List Built', body: 'Your counsellor builds a personalised, round-wise preference list — based on your rank, category, budget, city preference, and course. Not a template. Built for you.' },
  { num: 6, title: 'Form Filling', body: 'We fill your registration and preference forms for every round — MH State, MCC AIQ, and open states. Verified before submission. No errors, no rejections.' },
  { num: 7, title: 'Round-by-Round Support', body: 'After every allotment result, we advise on upgradation vs locking, and guide you through reporting requirements.' },
  { num: 8, title: 'Admission Secured', body: 'We stay with you until you physically report to your allotted college and your admission is confirmed. No mid-process handoffs.' },
];

const WHAT_COVERED = [
  { icon: '🏥', title: 'MH State Quota (85%)', body: 'Maharashtra State CET Cell process for all government, private and deemed colleges in Maharashtra.' },
  { icon: '🇮🇳', title: 'MCC All India Quota (15%)', body: 'National counselling by MCC for AIQ seats across all government and central colleges.' },
  { icon: '🌟', title: 'AIIMS & JIPMER', body: 'Dedicated guidance for AIIMS (20 campuses) and JIPMER Puducherry/Karaikal admissions.' },
  { icon: '🗺️', title: 'Open States', body: 'Karnataka, Kerala, UP, Telangana, AP, Tamil Nadu, Haryana, Bihar and more — full guidance for out-of-Maharashtra options.' },
  { icon: '🏛️', title: 'Deemed Universities', body: 'Private deemed university counselling including management quota and NRI quota seats.' },
  { icon: '💊', title: 'AYUSH & Allied', body: 'BAMS, BHMS, BDS, BPTh, BVSc — all streams covered under the same package.' },
];

export default function CounsellingPage() {
  return (
    <div className="coun-page">

      <Nav />

      {/* HERO */}
      <section className="coun-hero">
        <div className="coun-hero-inner">
          <span className="coun-eyebrow">MEDICAL ADMISSION COUNSELLING</span>
          <h1 className="coun-headline">
            Your Rank. The Right College.<br />Every Round Covered.
          </h1>
          <p className="coun-sub">
            ASMI's counselling is not a one-time session. It's a complete end-to-end
            service — from your NEET result to the day you report to your allotted
            college. With a real counsellor assigned to your file.
          </p>
          <div className="coun-hero-btns">
            <Link href="/inquiry" className="coun-btn-primary">Book Free Counselling →</Link>
            <a href="https://wa.me/917410019074" className="coun-btn-secondary"
              target="_blank" rel="noopener noreferrer">WhatsApp Us 💬</a>
          </div>
        </div>
      </section>

      {/* WHAT WE COVER */}
      <section className="coun-covers">
        <div className="coun-covers-inner">
          <div className="coun-section-label">ADMISSION PROCESSES WE COVER</div>
          <h2 className="coun-section-headline">Every Quota. Every State. Every Round.</h2>
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
              { label: 'Form Filling', asmi: '✓ Included (MH + MCC)', others: '✗ Extra cost or not offered' },
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
          <Link href="/inquiry" className="coun-cta-btn">Book Free Counselling →</Link>
        </div>
      </section>

      <Footer />

    </div>
  );
}
