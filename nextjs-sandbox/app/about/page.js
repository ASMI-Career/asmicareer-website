'use client';
import './about.css';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <div className="about-page">

      {/* NAV */}
      <Nav />

      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-inner">
          <span className="about-eyebrow">ABOUT ASMI</span>
          <h1 className="about-headline">
            We've Lived This Journey.<br />That's Why We Do This.
          </h1>
          <p className="about-sub">
            Founded in 2014 by someone who faced the chaos of medical admissions personally —
            ASMI Career exists to make sure no student loses their seat to confusion, misinformation,
            or a missed deadline.
          </p>
        </div>
      </section>

      {/* STATS STRIP */}
      <div className="about-stats">
        {[
          { num: '11+', label: 'Years of Experience' },
          { num: '25,000+', label: 'Admissions Done' },
          { num: '6', label: 'Cities Across Maharashtra' },
          { num: '4.9 ★', label: 'Google Rating' },
          { num: '1,000+', label: 'Seminars Conducted' },
        ].map((s, i) => (
          <div className="about-stat" key={i}>
            <div className="about-stat-num">{s.num}</div>
            <div className="about-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* FOUNDER SECTION */}
      <section className="about-founders">
        <div className="about-founders-inner">
          <div className="about-section-label">OUR FOUNDERS</div>
          <h2 className="about-section-headline">The People Behind ASMI</h2>

          <div className="about-founder-grid">
            <div className="about-founder-card">
              <div className="about-founder-avatar">AK</div>
              <div className="about-founder-info">
                <div className="about-founder-name">Anish Kulkarni</div>
                <div className="about-founder-role">Founder & Director</div>
                <p className="about-founder-bio">
                  Having faced the complexity of medical admissions firsthand, Anish founded ASMI Career
                  in 2014 with a clear mission — provide honest, accurate guidance to every student,
                  regardless of their score or budget. Under his leadership, ASMI has guided over
                  25,000 students to their medical seats across India. His expertise spans MH State,
                  MCC AIQ, and open state counselling across 15+ states.
                </p>
              </div>
            </div>

            <div className="about-founder-card">
              <div className="about-founder-card">
                <div className="about-founder-avatar">SK</div>
                <div className="about-founder-info">
                  <div className="about-founder-name">Sharang Katti</div>
                  <div className="about-founder-role">Director</div>
                  <p className="about-founder-bio">
                    An engineer by training, Sharang brings deep expertise in JoSAA, COMEDK,
                    and state engineering counselling. His systematic approach to preference
                    filling and his network across Karnataka, UP and Maharashtra institutions
                    has helped thousands of engineering aspirants secure their dream colleges.
                    He personally oversees quality across all ASMI branches.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VISION MISSION */}
      <section className="about-vm">
        <div className="about-vm-inner">
          <div className="about-vm-card">
            <div className="about-vm-icon">🎯</div>
            <div className="about-vm-label">OUR VISION</div>
            <p className="about-vm-text">
              To empower every aspiring doctor with transparent and accurate guidance —
              offering the knowledge and support needed to navigate the admission process
              confidently and begin their medical career on a strong foundation.
            </p>
          </div>
          <div className="about-vm-card">
            <div className="about-vm-icon">🚀</div>
            <div className="about-vm-label">OUR MISSION</div>
            <p className="about-vm-text">
              To simplify medical admissions with step-by-step guidance and personalised,
              data-driven support — ensuring every student secures their seat confidently
              and stress-free, regardless of rank or background.
            </p>
          </div>
          <div className="about-vm-card">
            <div className="about-vm-icon">💡</div>
            <div className="about-vm-label">OUR VALUES</div>
            <p className="about-vm-text">
              Transparency over promises. Accuracy over guesswork. Student interest over
              commissions. We have never and will never take referral fees from colleges —
              our only loyalty is to the student.
            </p>
          </div>
        </div>
      </section>

      {/* WHY STARTED */}
      <section className="about-story">
        <div className="about-story-inner">
          <div className="about-section-label">OUR STORY</div>
          <h2 className="about-section-headline">Why ASMI Was Started</h2>
          <div className="about-story-grid">
            <div className="about-story-text">
              <p>
                Every year, thousands of students lose their MBBS seat — not because their
                score was too low, but because they filled the wrong preference, missed a
                deadline, or trusted the wrong agent.
              </p>
              <p>
                In 2014, Anish Kulkarni saw this firsthand. The admission process was opaque,
                agents were charging ₹5–10 lakhs for "guaranteed" seats that didn't exist,
                and students with good scores were ending up in wrong colleges while students
                with lower scores used smarter strategies to get better ones.
              </p>
              <p>
                ASMI was built to fix this. Not with algorithms or chatbots — but with
                real counsellors, verified data, and a commitment to staying with every
                student until they report to their allotted college.
              </p>
              <p>
                Today, with 6 offices across Maharashtra and 11 years of experience,
                ASMI is the most trusted name in NEET counselling in the state.
              </p>
            </div>
            <div className="about-story-highlights">
              {[
                { year: '2014', text: 'ASMI founded in Mumbai' },
                { year: '2016', text: 'Expanded to Pune and Kolhapur' },
                { year: '2019', text: 'Crossed 10,000 admissions milestone' },
                { year: '2021', text: 'Opened Sangli and Thane branches' },
                { year: '2023', text: 'Chh. Sambhajinagar franchise launched' },
                { year: '2024', text: 'Crossed 25,000 admissions' },
                { year: '2025', text: 'ASMI Digital platform launched' },
              ].map((h, i) => (
                <div className="about-timeline-item" key={i}>
                  <div className="about-timeline-year">{h.year}</div>
                  <div className="about-timeline-text">{h.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BRANCHES */}
      <section className="about-branches">
        <div className="about-branches-inner">
          <div className="about-section-label">OUR PRESENCE</div>
          <h2 className="about-section-headline">6 Cities. One Mission.</h2>
          <div className="about-branches-grid">
            {['Mumbai · Andheri East', 'Thane · Thane West', 'Pune · Law College Road',
              'Kolhapur · Rajarampuri', 'Sangli · Vishrambag Chowk', 'Chh. Sambhajinagar · Kalda Corner'
            ].map((b, i) => (
              <div className="about-branch-pill" key={i}>📍 {b}</div>
            ))}
          </div>
          <Link href="/contact" className="about-branches-link">
            Find your nearest branch →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <div className="about-cta-inner">
          <h2 className="about-cta-headline">Ready to work with us?</h2>
          <p className="about-cta-sub">
            Book a free counselling session. No payment. No obligation.
          </p>
          <div className="about-cta-btns">
            <Link href="/inquiry" className="about-cta-btn-primary">
              Book Free Counselling →
            </Link>
            <a
              href="https://wa.me/917410019074"
              className="about-cta-btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Us 💬
            </a>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}
