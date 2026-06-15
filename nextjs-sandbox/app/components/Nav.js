'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import './nav.css';

const defaultLinks = [
  { label: 'Colleges', href: '/colleges' },
  { label: 'Counselling', href: '/counselling' },
  { label: 'Packages', href: '/medical#packages' },
  { label: 'Services', href: '/services' },
  { label: 'Events',     href: '/events' },
  { label: 'News',       href: '/medical/news' },
  { label: 'About Us', href: '/about' },
  { label: 'Contact Us', href: '/contact' },
];

export default function Nav({ links = defaultLinks, ctaHref = "/inquiry" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="mainNav" aria-label="Main navigation">
          <div className="nav-inner">
      
              <Link href="/" className="nav-back" aria-label="Back to home">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Home
              </Link>
      
              <Link href="/" className="nav-logo" aria-label="ASMI Career">
                  <img src="/asmi-logo.png" alt="ASMI Career" />
              </Link>
      
              <ul className="nav-links" role="list">
                  {links.map((link, i) => (
                      <li key={i}><Link href={link.href}>{link.label}</Link></li>
                  ))}
              </ul>
      
              <div className="nav-cta">
                  <Link href={ctaHref} aria-label="Book a free counselling session">
                      Book Free Session
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                          <path d="M2 6.5H11M7.5 3L11 6.5L7.5 10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                  </Link>
              </div>
      
              <button className={`nav-hamburger ${menuOpen ? 'open' : ''}`} id="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" aria-expanded="false" aria-controls="navDrawer">
                  <span></span>
                  <span></span>
                  <span></span>
              </button>
      
          </div>
      </nav>
      
      <div className={`nav-drawer ${menuOpen ? 'open' : ''}`} id="navDrawer" role="navigation" aria-label="Mobile navigation">
          <Link href="/" onClick={() => setMenuOpen(false)}>← Home</Link>
          {links.map((link, i) => (
              <Link key={i} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>
          ))}
          <Link href={ctaHref} className="drawer-cta" onClick={() => setMenuOpen(false)}>Book Free Session →</Link>
      </div>
    </>
  );
}
