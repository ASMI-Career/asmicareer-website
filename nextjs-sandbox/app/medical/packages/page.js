'use client';

import Nav from '../../components/Nav';
import Footer from '../../components/Footer';
import '../medical.css';
import './packages.css';
import Link from 'next/link';

export default function PackagesPage() {
  const meritFeatures = [
    {
      name: "Medical Admission Guidance",
      desc: "Comprehensive guidance from start to finish. Additional sessions before every round to keep you prepared."
    },
    {
      name: "One-to-One Counselling",
      desc: "Personal sessions covering college selection by quality, budget, patient flow, and city. Includes open state process guidance."
    },
    {
      name: "College Preference List",
      desc: "Custom college preference list prepared for every round of the admission process — not just once."
    },
    {
      name: "Round-wise Cutoff Data",
      desc: "Actual round-wise cutoffs shared in real time so you always know where you stand and which colleges to target."
    },
    {
      name: "WhatsApp Admission Alerts",
      desc: "All admission timelines, seat matrices, and allotment results sent directly to you. You will never miss a deadline."
    },
    {
      name: "Admission Form Filling",
      desc: "Registration, preference form filling, and document scanning support. MH State & MCC included. Extra states at ₹5,000/state."
    },
    {
      name: "Document Verification",
      desc: "Every certificate checked, scanned and organised into a PDF — nothing left to chance."
    },
    {
      name: "Dedicated Helpline",
      desc: "Three family numbers saved with us — student, father, mother — no missed calls, priority answering."
    }
  ];

  const nriFeatures = [
    {
      name: "Medical Admission Guidance",
      desc: "Comprehensive guidance from start to finish for NRI and management quota admissions in private & deemed universities."
    },
    {
      name: "One-to-One Counselling",
      desc: "Personal sessions covering seat planning under NRI/management quota, budget mapping, and university selections."
    },
    {
      name: "College Preference List",
      desc: "Custom college preference list for deemed universities and private institution management seats, prepared for every round."
    },
    {
      name: "Round-wise Cutoff Data",
      desc: "Actual closing ranks and merit lists for NRI and management quota seats shared in real time."
    },
    {
      name: "WhatsApp Admission Alerts",
      desc: "Instant updates on NRI quota registration windows, eligibility criteria changes, and physical verification schedules."
    },
    {
      name: "Admission Form Filling",
      desc: "Dedicated form filling support for deemed universities, offline registrations, and NRI eligibility applications."
    },
    {
      name: "Document Verification",
      desc: "Detailed verification and organisation of NRI sponsorship letters, bank details, and compliance certificates."
    },
    {
      name: "Dedicated Helpline",
      desc: "Three family numbers saved with us — student, father, mother — no missed calls, priority answering."
    }
  ];

  return (
    <div className="pkg-page">
      <Nav />

      <main className="pkg-container">
        <header className="pkg-header">
          <span className="pkg-eyebrow">PACKAGES & PRICING</span>
          <h1 className="pkg-headline">Simple Pricing. Expert Counselling.</h1>
          <p className="pkg-sub">
            Choose the counselling plan that fits your admission path. Fully transparent, expert-led guidance all the way.
          </p>
        </header>

        <div className="pkg-grid">
          {/* Merit based */}
          <div className="pkg-card pkg-card-featured">
            <span className="pkg-badge">★ RECOMMENDED</span>
            <h2 className="pkg-title">Complete Medical Admission Counselling</h2>
            <div className="pkg-subtitle">Merit Based</div>
            
            <div className="pkg-price-block">
              <div className="pkg-price">₹10,000 – ₹30,000</div>
              <div className="pkg-price-note">
                Pricing confirmed at your nearest branch · No payment to enquire.
              </div>
            </div>

            <div className="pkg-features-title">What's Included:</div>
            <ul className="pkg-features-list">
              {meritFeatures.map((f, i) => (
                <li key={i} className="pkg-feature-item">
                  <span className="pkg-feature-check">✓</span>
                  <div>
                    <div className="pkg-feature-name">{f.name}</div>
                    <div className="pkg-feature-desc">{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>

            <a 
              href="https://wa.me/917410019074?text=Hi%2C%20I%20want%20to%20register%20for%20the%20Complete%20Medical%20Admission%20Counselling%20%28Merit%20Based%29%20package."
              target="_blank"
              rel="noopener noreferrer"
              className="pkg-btn pkg-btn-gold"
            >
              Register Now
            </a>
          </div>

          {/* NRI Quota */}
          <div className="pkg-card">
            <h2 className="pkg-title">Complete Medical Admission Counselling</h2>
            <div className="pkg-subtitle">NRI or Management Quota</div>
            
            <div className="pkg-price-block">
              <div className="pkg-price">₹60,000</div>
              <div className="pkg-price-note">
                Flat fee · No deadline · Same price anytime.
              </div>
            </div>

            <div className="pkg-features-title">What's Included:</div>
            <ul className="pkg-features-list">
              {nriFeatures.map((f, i) => (
                <li key={i} className="pkg-feature-item">
                  <span className="pkg-feature-check">✓</span>
                  <div>
                    <div className="pkg-feature-name">{f.name}</div>
                    <div className="pkg-feature-desc">{f.desc}</div>
                  </div>
                </li>
              ))}
            </ul>

            <a 
              href="https://wa.me/917410019074?text=Hi%2C%20I%20want%20to%20register%20for%20the%20Complete%20Medical%20Admission%20Counselling%20%28NRI%2FManagement%20Quota%29%20package."
              target="_blank"
              rel="noopener noreferrer"
              className="pkg-btn pkg-btn-outline"
            >
              Register Now
            </a>
          </div>
        </div>

        {/* Terms & Conditions */}
        <section className="pkg-terms">
          <div className="pkg-terms-title">
            📝 Terms & Conditions
          </div>
          <ul className="pkg-terms-list">
            <li>Non-refundable/non-transferable registration amount.</li>
            <li>All charges inclusive of GST.</li>
            <li>Early bird pricing (when running) valid only during its announced window, confirm current rates at nearest branch.</li>
            <li>Additional state/process form filling charged ₹5,000/state, not included in package.</li>
            <li>ASMI reserves the right to assign counsellors based on branch availability.</li>
          </ul>
        </section>

        {/* Undecided Fallback Block */}
        <div className="pricing-banner" style={{ marginTop: '0px', marginBottom: '40px' }}>
          <div className="pricing-banner-h">
            Not sure which package is right for you?
          </div>
          <div className="pricing-banner-sub">
            Talk to an ASMI counsellor for free — no payment, no obligation.
          </div>
          <p className="pricing-banner-body">
            Get clarity on your options in under 24 hours.
            Walk in, call, or message us on WhatsApp.
          </p>
          <div className="pricing-banner-btns">
            <Link href="/medical/inquiry" className="banner-btn-white">
              Book My Free Session →
            </Link>
            <a
              href="https://wa.me/917410019074?text=I%20want%20to%20know%20more%20about%20the%20packages."
              target="_blank"
              rel="noopener noreferrer"
              className="banner-btn-yellow"
            >
              WhatsApp Us 💬
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
