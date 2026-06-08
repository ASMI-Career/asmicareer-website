'use client';
import './contact.css';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

const engineeringNavLinks = [
  { label: 'Colleges', href: '/engineering/colleges' },
  { label: 'Counselling', href: '/engineering/counselling' },
  { label: 'Packages', href: '/engineering#packages' },
  { label: 'Services', href: '/engineering/services' },
  { label: 'News & Events', href: '/engineering#events' },
  { label: 'About Us', href: '/engineering/about' },
  { label: 'Contact Us', href: '/engineering/contact' },
];

const BRANCHES = [
  {
    city: 'Mumbai',
    area: 'Andheri East',
    address: '42, 4th Floor, A Wing, Silver Astra, J.B. Nagar, Andheri East, Mumbai',
    phone: '7410019077',
    whatsapp: '917410019077',
    maps: 'https://maps.app.goo.gl/1UQpxoTs4msmVXiH8',
    inquiry: '/engineering/inquiry?source=andheri',
  },
  {
    city: 'Thane',
    area: 'Thane West',
    address: '201, 2nd Floor, Ram Niwas, Gokhale Road, near Shri Gaondevi Temple, Besides McDonald\'s, Thane West',
    phone: '7410019075',
    whatsapp: '917410019075',
    maps: 'https://maps.app.goo.gl/9va5LoADHXwLUwBq9',
    inquiry: '/engineering/inquiry?source=thane',
  },
  {
    city: 'Pune',
    area: 'Law College Road',
    address: 'Business Guild Complex, Office No. 302, 3rd Floor, In front of Hotel New Wadeshwar, Law College Road, Pune',
    phone: '7410013458',
    whatsapp: '917410013458',
    maps: 'https://maps.app.goo.gl/F47RuGGUSPM7GdFC6',
    inquiry: '/engineering/inquiry?source=pune',
  },
  {
    city: 'Kolhapur',
    area: 'Rajarampuri',
    address: 'B-203, Muktashram Appt., Opp. Planet Fashion, 7th Lane, Rajarampuri, Kolhapur',
    phone: '7057575833',
    whatsapp: '917057575833',
    maps: 'https://maps.app.goo.gl/jSrHArpXM68qnW8',
    inquiry: '/engineering/inquiry?source=kolhapur',
  },
  {
    city: 'Sangli',
    area: 'Vishrambag Chowk',
    address: 'Flat No. 6, Satya Apartment, Above Picock Photo Studio, Vishrambag Chowk, Sangli',
    phone: '7410019076',
    whatsapp: '917410019076',
    maps: 'https://maps.app.goo.gl/Qp7eRwXWpkiqRSSq5',
    inquiry: '/engineering/inquiry?source=sangli',
  },
  {
    city: 'Chh. Sambhajinagar',
    area: 'Kalda Corner',
    address: 'Shrinidhi Building, Plot No. 95, Shrey Nagar, near HDFC Bank, Kalda Corner, Chh. Sambhajinagar',
    phone: '8484980032',
    whatsapp: '918484980032',
    maps: 'https://maps.app.goo.gl/CWfPiaVhi7tL7cSx9',
    inquiry: '/engineering/inquiry?source=sambhajinagar',
  },
];

export default function EngineeringContactPage() {
  return (
    <div className="contact-page">

      {/* NAV */}
      <Nav links={engineeringNavLinks} ctaHref="/engineering/inquiry" />

      {/* HEADER */}
      <div className="contact-header">
        <span className="contact-eyebrow">CONTACT US</span>
        <h1 className="contact-headline">Find Your Nearest ASMI Branch</h1>
        <p className="contact-sub">
          6 offices across Maharashtra. Walk in, call, or WhatsApp —
          an engineering counsellor is always available.
        </p>
        <div className="contact-helpline">
          <span className="contact-helpline-label">Central Helpline</span>
          <a href="tel:7410019074" className="contact-helpline-num">
            📞 7410019074
          </a>
          <a
            href="https://wa.me/917410019074"
            className="contact-helpline-wa"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp →
          </a>
        </div>
      </div>

      {/* BRANCH GRID */}
      <div className="contact-grid">
        {BRANCHES.map((b, i) => (
          <div className="branch-card" key={i}>
            <div className="branch-card-top">
              <div>
                <div className="branch-city">{b.city}</div>
                <div className="branch-area">{b.area}</div>
              </div>
              <div className="branch-num-badge">{String(i + 1).padStart(2, '0')}</div>
            </div>

            <p className="branch-address">{b.address}</p>

            <div className="branch-actions">
              <a
                href={`tel:${b.phone}`}
                className="branch-btn branch-btn-call"
                aria-label={`Call ${b.city} branch`}
              >
                📞 {b.phone}
              </a>
              <a
                href={`https://wa.me/${b.whatsapp}`}
                className="branch-btn branch-btn-wa"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${b.city} branch`}
              >
                💬 WhatsApp
              </a>
            </div>

            <div className="branch-links">
              <a
                href={b.maps}
                className="branch-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                📍 Get Directions
              </a>
              <a href={b.inquiry} className="branch-link branch-link-primary">
                Book Session →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* CENTRAL CTA */}
      <div className="contact-cta-strip">
        <div className="contact-cta-inner">
          <div className="contact-cta-text">
            <p className="contact-cta-headline">Not sure which branch?</p>
            <p className="contact-cta-sub">
              Use our central inquiry form — we'll route you to the right counsellor.
            </p>
          </div>
          <a href="/engineering/inquiry" className="contact-cta-btn">
            Book via Central Form →
          </a>
        </div>
      </div>

      {/* FOOTER STRIP */}
      <Footer isEngineering={true} />

    </div>
  );
}
