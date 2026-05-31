'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  const columns = [
    {
      heading: 'GET',
      links: [
        { label: 'Counselling', href: '/counselling' },
        { label: 'Services', href: '/services' },
        { label: 'Packages', href: '/packages' },
        { label: 'Rank Predictor', href: '/rank-predictor' },
        { label: 'Resources', href: '/resources' },
      ]
    },
    {
      heading: 'EXPLORE',
      links: [
        { label: 'Universities', href: '/colleges' },
        { label: 'Updates and events', href: '/news' },
        { label: 'Webinars and video guides', href: '/webinars' },
        { label: 'Success stories', href: '/success-stories' },
        { label: 'FAQs', href: '/faqs' },
      ]
    },
    {
      heading: 'COMPANY',
      links: [
        { label: 'About us', href: '/about' },
        { label: 'Contact us', href: '/contact' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ]
    },
  ]

  return (
    <footer style={{
      background: '#1a0040',
      color: '#ffffff',
      padding: '64px 80px 32px',
      fontFamily: 'var(--font-montserrat)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
      }}>

        {/* Top row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 1fr 1fr',
          gap: '48px',
          marginBottom: '48px',
        }}>

          {/* Logo + social */}
          <div>
            <Image
              src="/asmi-logo.png"
              alt="ASMI Career"
              width={80}
              height={48}
              style={{ objectFit: 'contain', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              {['🌐', 'f', 'in'].map((icon, i) => (
                <a key={i} href="#" style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#FFD700'
                    e.currentTarget.style.color = '#FFD700'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
                  }}
                >{icon}</a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map(col => (
            <div key={col.heading}>
              <p style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '2px',
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '20px',
                textTransform: 'uppercase',
              }}>
                {col.heading}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.links.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.65)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <p style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: 500,
          }}>
            © 2026 Asmi Pvt. Ltd. All rights reserved.
          </p>
          <p style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.35)',
            fontWeight: 500,
          }}>
            Made with ✦ for the next generation.
          </p>
        </div>
      </div>
    </footer>
  )
}
