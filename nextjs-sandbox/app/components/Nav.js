'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import './nav.css';

export default function Nav() {
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
                  <li><Link href="/colleges">Colleges</Link></li>
                  <li><Link href="/counselling">Counselling</Link></li>
                  <li><Link href="/medical#packages">Packages</Link></li>
                  <li><Link href="/services">Services</Link></li>
                  <li><Link href="/medical#events">News & Events</Link></li>
                  <li><Link href="/about">About Us</Link></li>
                  <li><Link href="/contact">Contact Us</Link></li>
              </ul>
      
              <div className="nav-cta">
                  <Link href="/inquiry" aria-label="Book a free counselling session">
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
      
      {/* Mobile navigation drawer */}
      <div className={`nav-drawer ${menuOpen ? 'open' : ''}`} id="navDrawer" role="navigation" aria-label="Mobile navigation">
          <Link href="/" onClick={() => setMenuOpen(false)}>← Home</Link>
          <Link href="/colleges" onClick={() => setMenuOpen(false)}>Colleges</Link>
          <Link href="/counselling" onClick={() => setMenuOpen(false)}>Counselling</Link>
          <Link href="/medical#packages" onClick={() => setMenuOpen(false)}>Packages</Link>
          <Link href="/services" onClick={() => setMenuOpen(false)}>Services</Link>
          <Link href="/medical#events" onClick={() => setMenuOpen(false)}>News & Events</Link>
          <Link href="/about" onClick={() => setMenuOpen(false)}>About Us</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact Us</Link>
          <Link href="/inquiry" className="drawer-cta" onClick={() => setMenuOpen(false)}>Book Free Session →</Link>
      </div>
    </>
  );
}
