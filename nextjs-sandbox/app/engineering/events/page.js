'use client';
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

export default function EngineeringEventsPage() {
  return (
    <div style={{
      background: '#070f1c',
      fontFamily: "'Open Sans', sans-serif",
      color: 'rgba(255, 255, 255, 0.9)',
      minHeight: '100vh',
      paddingTop: '64px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <Nav links={engineeringNavLinks} ctaHref="/engineering/inquiry" homeHref="/engineering" />

      {/* Hero / Placeholder Content */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '540px',
          width: '100%',
          background: '#0d1f35',
          border: '1.5px solid rgba(0, 200, 180, 0.2)',
          borderRadius: '24px',
          padding: '48px 32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(0, 200, 180, 0.08)'
        }}>
          {/* Badge */}
          <span style={{
            display: 'inline-block',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '11px',
            fontWeight: 800,
            color: '#00C8B4',
            background: 'rgba(0, 200, 180, 0.1)',
            border: '1px solid rgba(0, 200, 180, 0.25)',
            padding: '6px 18px',
            borderRadius: '50px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '28px'
          }}>
            Seminars &amp; Webinars
          </span>

          <h1 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '28px',
            fontWeight: 900,
            color: '#ffffff',
            marginBottom: '16px',
            lineHeight: 1.2
          }}>
            Engineering Seminar Schedule Coming Soon
          </h1>

          <p style={{
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.65)',
            lineHeight: 1.7,
            marginBottom: '36px'
          }}>
            We are currently scheduling our upcoming live seminars and webinars for MHT CET &amp; JoSAA Counselling. Join our WhatsApp channel to get notified instantly when slots open.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <a
              href="https://chat.whatsapp.com/L7pxi8v0nrU54tApnBA99e"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#00C8B4',
                color: '#0a1628',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800,
                fontSize: '14px',
                padding: '14px 28px',
                borderRadius: '50px',
                textDecoration: 'none',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(0, 200, 180, 0.25)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 200, 180, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 200, 180, 0.25)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12.05 2C6.495 2 2 6.495 2 12.05c0 1.87.49 3.628 1.347 5.154L2 22l4.955-1.323A10.01 10.01 0 0 0 12.05 22C17.605 22 22 17.505 22 11.95 22 6.495 17.605 2 12.05 2zm0 18.214c-1.703 0-3.282-.455-4.637-1.248l-.333-.197-3.44.919.925-3.378-.217-.349a8.168 8.168 0 0 1-1.252-4.362c0-4.522 3.68-8.202 8.2-8.202 4.522 0 8.202 3.68 8.202 8.202 0 4.521-3.68 8.2-8.202 8.2-.001.001-.002 0-.003 0h.003z"/>
              </svg>
              Join WhatsApp Updates Channel
            </a>
            
            <Link
              href="/engineering"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: '13px',
                padding: '13px 28px',
                borderRadius: '50px',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              ← Back to Engineering Portal
            </Link>
          </div>
        </div>
      </section>

      <Footer isEngineering={true} />
    </div>
  );
}
