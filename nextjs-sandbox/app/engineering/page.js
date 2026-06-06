'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EngineeringPortal() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  
  const uniTrackRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for reveal animation
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    
    // Animate items
    const animItems = document.querySelectorAll('[data-animate]');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const siblings = [...(el.closest('.prob-table, .problems-inner, .why-grid, .packages-grid')?.querySelectorAll('[data-animate]') || [])];
          const idx = siblings.indexOf(el);
          el.style.transitionDelay = (idx >= 0 ? idx * 0.07 : 0) + 's';
          el.classList.add('visible');
          revealObserver.unobserve(el);
        }
      });
    }, { threshold: 0.12 });
    animItems.forEach(el => revealObserver.observe(el));

    // Staggered reveals
    const whyCards = document.querySelectorAll('[data-why-animate]');
    const whyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const allCards = [...document.querySelectorAll('[data-why-animate]')];
          const idx = allCards.indexOf(el);
          el.style.transitionDelay = (idx >= 0 ? idx * 0.1 : 0) + 's';
          el.classList.add('visible');
          whyObserver.unobserve(el);
        }
      });
    }, { threshold: 0.1 });
    whyCards.forEach(el => whyObserver.observe(el));

    const pkgCards = document.querySelectorAll('[data-pkg-animate]');
    const pkgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const allPkg = [...document.querySelectorAll('[data-pkg-animate]')];
          const idx = allPkg.indexOf(el);
          el.style.transitionDelay = (idx >= 0 ? idx * 0.1 : 0) + 's';
          el.classList.add('visible');
          pkgObserver.unobserve(el);
        }
      });
    }, { threshold: 0.1 });
    pkgCards.forEach(el => pkgObserver.observe(el));

    const animateEls = document.querySelectorAll('.animate');
    const animateObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animateObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    animateEls.forEach(el => animateObserver.observe(el));

    const testiCards = document.querySelectorAll('[data-testi-animate]');
    const testiObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const allTesti = [...document.querySelectorAll('[data-testi-animate]')];
          const idx = allTesti.indexOf(el);
          el.style.transitionDelay = (idx >= 0 ? idx * 0.1 : 0) + 's';
          el.classList.add('visible');
          testiObserver.unobserve(el);
        }
      });
    }, { threshold: 0.1 });
    testiCards.forEach(el => testiObserver.observe(el));

    return () => {
      revealObserver.disconnect();
      whyObserver.disconnect();
      pkgObserver.disconnect();
      animateObserver.disconnect();
      testiObserver.disconnect();
    };
  }, []);

  const scrollCarousel = (direction) => {
    if (uniTrackRef.current) {
      uniTrackRef.current.scrollBy({ left: direction * 320, behavior: 'smooth' });
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="engineeringPortal">
      
      {/* ════════════════════════════════
           SECTION 1 — FIXED NAV
      ════════════════════════════════ */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="mainNav" aria-label="Main navigation">
          <div className="nav-inner">
      
              <a href="/" className="nav-back" aria-label="Back to home">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Home
              </a>
      
              <a href="/" className="nav-logo" aria-label="ASMI Career">
                  <img src="asmi-logo.png" alt="ASMI Career" />
              </a>
      
              <ul className="nav-links" role="list">
                  <li><a href="#colleges">Colleges</a></li>
                  <li><a href="#counselling">Counselling</a></li>
                  <li><a href="#packages">Packages</a></li>
                  <li><a href="#services">Services</a></li>
                  <li><a href="#events">News & Events</a></li>
              </ul>
      
              <div className="nav-cta">
                  <a href="/inquiry" aria-label="Book a free counselling session">
                      Book Free Session
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                          <path d="M2 6.5H11M7.5 3L11 6.5L7.5 10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                  </a>
              </div>
      
              <button className={`nav-hamburger ${drawerOpen ? 'open' : ''}`} id="hamburger" onClick={() => setDrawerOpen(!drawerOpen)} aria-label="Open menu" aria-expanded="false" aria-controls="navDrawer">
                  <span></span>
                  <span></span>
                  <span></span>
              </button>
      
          </div>
      </nav>
      
      {/* Mobile navigation drawer */}
      <div className={`nav-drawer ${drawerOpen ? 'open' : ''}`} id="navDrawer" role="navigation" aria-label="Mobile navigation">
          <a href="/">← Home</a>
          <a href="#colleges">Colleges</a>
          <a href="#counselling">Counselling</a>
          <a href="#packages">Packages</a>
          <a href="#services">Services</a>
          <a href="#events">News & Events</a>
          <a href="/inquiry" className="drawer-cta">Book Free Session →</a>
      </div>
      
      
      {/* ════════════════════════════════
           SECTION 2 — HERO
      ════════════════════════════════ */}
      <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-inner">
      
              {/* LEFT */}
              <div className="hero-left">
                  <motion.div
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  >
                      <div className="hero-eyebrow" aria-label="India's smartest engineering admission platform">
                          <span className="eyebrow-dot" aria-hidden="true"></span>
                          INDIA'S SMARTEST ENGINEERING ADMISSION PLATFORM
                      </div>
          
                      <h1 className="hero-h1" id="hero-heading">
                          Asmi gets you the<br />
                          branch you <span className="accent">deserve.</span>
                      </h1>
          
                      <p className="hero-sub">
                          JEE & MHT-CET counselling by verified experts — a real counsellor
                          who knows your rank, from result day to reporting day. Zero guesswork.
                      </p>
          
                      <div className="hero-stats" role="list" aria-label="Key statistics">
                          <div className="hero-stat" role="listitem">
                              <span className="stat-num">10+</span>
                              <span className="stat-lbl">Years of experience</span>
                          </div>
                          <div className="hero-stat" role="listitem">
                              <span className="stat-num">20k+</span>
                              <span className="stat-lbl">Admissions done!</span>
                          </div>
                          <div className="hero-stat" role="listitem">
                              <span className="stat-num">4.9 rating ★</span>
                              <span className="stat-lbl">on google reviews</span>
                          </div>
                      </div>
          
                      <div className="hero-ctas">
                          <a href="#tools" className="btn-primary">Explore tools ↓</a>
                          <a href="#counselling" className="btn-secondary">How it works ↓</a>
                      </div>
                  </motion.div>
              </div>
      
              {/* RIGHT */}
              <div className="hero-right">
                  <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="hero-card"
                  >
      
                      <div className="card-top-row">
                          <span className="card-pill-grey">Expert mentors</span>
                          <span className="card-top-bold">100+ Counsellors</span>
                      </div>
      
                      <div className="card-inner">
      
                          <div className="card-inner-header">
                              <span className="card-inner-title">Your College Matches</span>
                              <span className="card-ai-pill">AI · Live</span>
                          </div>
      
                          <div className="rank-display">
                              <div className="rank-label">JEE RANK</div>
                              <div className="rank-number">8,432</div>
                              <div className="rank-sub">CRL · JEE Main 2026</div>
                          </div>
      
                          <ul className="college-list" aria-label="College matches">
                              <li className="college-item">
                                  <div className="college-dot-name">
                                      <span className="college-dot teal" aria-hidden="true"></span>
                                      <span className="college-name">IIT Bombay — CS</span>
                                  </div>
                                  <span className="likelihood-pill pill-possible">Possible</span>
                              </li>
                              <li className="college-item">
                                  <div className="college-dot-name">
                                      <span className="college-dot green" aria-hidden="true"></span>
                                      <span className="college-name">NIT Trichy — ECE</span>
                                  </div>
                                  <span className="likelihood-pill pill-likely">Likely ✓</span>
                              </li>
                              <li className="college-item">
                                  <div className="college-dot-name">
                                      <span className="college-dot blue" aria-hidden="true"></span>
                                      <span className="college-name">BITS Pilani — Mech</span>
                                  </div>
                                  <span className="likelihood-pill pill-safe">Safe Seat</span>
                              </li>
                          </ul>
      
                      </div>
      
                      <div className="card-bottom-row">
                          <span className="card-bottom-label">Success rate</span>
                          <span className="card-bottom-bold">90%+ students</span>
                      </div>
      
                  </motion.div>
              </div>
      
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 2b — IMPORTANT EVENTS
      ════════════════════════════════ */}
      <section className="events-section" id="events" aria-labelledby="events-heading">
          <div className="events-inner">
              <div className="events-header">
                  <div className="events-title" id="events-heading">
                      <span className="events-title-dot" aria-hidden="true">●</span>
                      News and events
                  </div>
                  <a href="#" className="events-view-all">View all →</a>
              </div>
              <div className="events-cards">
                  <div className="event-card">
                      <div className="event-card-top">
                          <span className="event-tag tag-jee">JEE</span>
                          <span className="event-time">2 hours ago</span>
                      </div>
                      <div className="event-headline">JEE Advanced 2026 Registration Open</div>
                      <p className="event-body">Last date to apply is June 2nd, 2026. Don't miss the deadline.</p>
                  </div>
                  <div className="event-card">
                      <div className="event-card-top">
                          <span className="event-tag tag-urgent">URGENT</span>
                          <span className="event-time">5 hours ago</span>
                      </div>
                      <div className="event-headline">JEE Main Session 2 Results Out</div>
                      <p className="event-body">Check your scorecard now on the official NTA portal.</p>
                  </div>
                  <div className="event-card">
                      <div className="event-card-top">
                          <span className="event-tag tag-mhtcet">MHT-CET</span>
                          <span className="event-time">Yesterday</span>
                      </div>
                      <div className="event-headline">MHT-CET 2026 Merit List Released</div>
                      <p className="event-body">Download your merit list and prepare for CAP rounds.</p>
                  </div>
              </div>
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 2c — TOP TIER UNIVERSITIES
      ════════════════════════════════ */}
      <section className="unis-section" aria-labelledby="unis-heading">
          <div className="unis-inner">
              <div className="unis-header">
                  <div className="unis-title" id="unis-heading">
                      <span className="unis-title-dot" aria-hidden="true">🔵</span>
                      Top tier universities
                  </div>
                  <div className="unis-header-right">
                      <a href="#" className="unis-view-all">View all →</a>
                      <button className="unis-arrow-btn" id="uniPrev" onClick={() => scrollCarousel(-1)} aria-label="Previous universities">‹</button>
                      <button className="unis-arrow-btn" id="uniNext" onClick={() => scrollCarousel(1)} aria-label="Next universities">›</button>
                  </div>
              </div>
              <div className="unis-track" ref={uniTrackRef} id="uniTrack" role="list">
                  <div className="uni-card" role="listitem">
                      <div className="uni-img">
                          <span className="uni-rating">★ 4.2/5</span>
                          <span className="uni-heart" aria-hidden="true">♡</span>
                      </div>
                      <div className="uni-content">
                          <div className="uni-meta"><span>📍 Mumbai</span><span>🎓 Engineering</span></div>
                          <div className="uni-name">IIT Bombay</div>
                      </div>
                  </div>
                  <div className="uni-card" role="listitem">
                      <div className="uni-img">
                          <span className="uni-rating">★ 4.8/5</span>
                          <span className="uni-heart" aria-hidden="true">♡</span>
                      </div>
                      <div className="uni-content">
                          <div className="uni-meta"><span>📍 Bangalore</span><span>🎓 Engineering</span></div>
                          <div className="uni-name">IIT Bangalore (IISC)</div>
                      </div>
                  </div>
                  <div className="uni-card" role="listitem">
                      <div className="uni-img">
                          <span className="uni-rating">★ 4.8/5</span>
                          <span className="uni-heart" aria-hidden="true">♡</span>
                          <span className="uni-recommend-badge">★ ASMI RECOMMENDS</span>
                      </div>
                      <div className="uni-content">
                          <div className="uni-meta"><span>📍 Pilani</span><span>🎓 Engineering</span></div>
                          <div className="uni-name">BITS Pilani</div>
                      </div>
                  </div>
                  <div className="uni-card" role="listitem">
                      <div className="uni-img">
                          <span className="uni-rating">★ 4.5/5</span>
                          <span className="uni-heart" aria-hidden="true">♡</span>
                      </div>
                      <div className="uni-content">
                          <div className="uni-meta"><span>📍 Trichy</span><span>🎓 Engineering</span></div>
                          <div className="uni-name">NIT Trichy</div>
                      </div>
                  </div>
              </div>
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION Ps — PROBLEM / SOLUTION
      ════════════════════════════════ */}
      <section className="ps-section" aria-labelledby="ps-heading">
          <div className="ps-inner">
              <div className="ps-header">
                  <h2 className="ps-headline" id="ps-heading">Engineering Students Lose Branches — Before Counselling Even Starts.</h2>
                  <p className="ps-sub">Here's what goes wrong — and exactly how ASMI fixes it.</p>
              </div>
              <div className="ps-grid">
                  <div className="ps-left">
                      <div className="ps-col-lbl"><span className="ps-dot-red" aria-hidden="true">●</span> THE PROBLEM</div>
                      <div className="ps-item">
                          <span className="ps-num" aria-hidden="true">1</span>
                          <div className="ps-item-body"><span className="ps-bar red" aria-hidden="true"></span><span className="ps-text">Wrong Branch-College Combo = Career Regret</span></div>
                      </div>
                      <div className="ps-item">
                          <span className="ps-num" aria-hidden="true">2</span>
                          <div className="ps-item-body"><span className="ps-bar red" aria-hidden="true"></span><span className="ps-text">JoSAA Rounds Close in 24 Hours. No Extensions.</span></div>
                      </div>
                      <div className="ps-item">
                          <span className="ps-num" aria-hidden="true">3</span>
                          <div className="ps-item-body"><span className="ps-bar red" aria-hidden="true"></span><span className="ps-text">Coaching Centres Pushing Wrong Colleges for Commission</span></div>
                      </div>
                  </div>
                  <div className="ps-img-col" role="img" aria-label="Problem vs Solution comparison">
                      <div className="ps-vs" aria-label="VS">VS</div>
                  </div>
                  <div className="ps-right">
                      <div className="ps-col-lbl"><span className="ps-dot-green" aria-hidden="true">●</span> THE SOLUTION</div>
                      <div className="ps-item">
                          <span className="ps-num solution" aria-hidden="true">1</span>
                          <div className="ps-item-body"><span className="ps-bar green" aria-hidden="true"></span><span className="ps-text">Branch-first strategy built around your rank and career goal.</span></div>
                      </div>
                      <div className="ps-item">
                          <span className="ps-num solution" aria-hidden="true">2</span>
                          <div className="ps-item-body"><span className="ps-bar green" aria-hidden="true"></span><span className="ps-text">Real-time JoSAA and CSAB alerts on WhatsApp every round.</span></div>
                      </div>
                      <div className="ps-item">
                          <span className="ps-num solution" aria-hidden="true">3</span>
                          <div className="ps-item-body"><span className="ps-bar green" aria-hidden="true"></span><span className="ps-text">Only NIC-verified data. No coaching bias. No commissions.</span></div>
                      </div>
                  </div>
              </div>
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION Why — WHY ASMI
      ════════════════════════════════ */}
      <section className="why-section" aria-labelledby="why-heading">
          <div className="why-inner">
              <div className="why-left">
                  <span className="why-eyebrow">WHY ASMI</span>
                  <h2 className="why-headline" id="why-heading">India's Most Trusted Engineering Admission Platform</h2>
                  <p className="why-sub">11 years. 10,000+ branches secured. Here's what makes the difference.</p>
                  <div className="why-features">
                      <div className="why-feature">
                          <div className="why-icon" aria-hidden="true">👤</div>
                          <div>
                              <div className="why-feature-title">Verified Counsellors</div>
                              <div className="why-feature-body">JEE-specialist counsellors, not generalists. They know every branch cutoff.</div>
                          </div>
                      </div>
                      <div className="why-feature">
                          <div className="why-icon" aria-hidden="true">🗄️</div>
                          <div>
                              <div className="why-feature-title">Official Data Only</div>
                              <div className="why-feature-body">Cutoffs pulled directly from JoSAA, CSAB, and state portals. Live data.</div>
                          </div>
                      </div>
                      <div className="why-feature">
                          <div className="why-icon" aria-hidden="true">🔔</div>
                          <div>
                              <div className="why-feature-title">Real-Time Alerts</div>
                              <div className="why-feature-body">WhatsApp updates every JoSAA round — freeze deadlines, upgrade windows, everything.</div>
                          </div>
                      </div>
                      <div className="why-feature">
                          <div className="why-icon" aria-hidden="true">₹</div>
                          <div>
                              <div className="why-feature-title">Transparent Pricing</div>
                              <div className="why-feature-body">Fixed packages. No institute commissions. No hidden referral fees.</div>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="why-right" role="img" aria-label="Why ASMI engineering platform">
                  <div className="why-overlay-card">
                      <div className="why-overlay-label"><span aria-hidden="true">●</span> CRACK YOUR TARGET BRANCH</div>
                      <div className="why-overlay-headline">How ASMI secures your branch</div>
                      <p className="why-overlay-sub">See how we guide 10,000+ students to their target branch — from rank day to reporting date.</p>
                      <div className="why-overlay-btns">
                          <a href="/inquiry" className="why-btn-dark">Book a Free Call 📞</a>
                          <a href="#" className="why-btn-purple">Watch Video</a>
                      </div>
                  </div>
              </div>
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION Journey — ENGINEERING JOURNEY
      ════════════════════════════════ */}
      <section className="journey-section" aria-labelledby="journey-heading">
          <div className="journey-inner">
              <div className="journey-header">
                  <div className="journey-icon" aria-hidden="true">🌱</div>
                  <h2 className="journey-headline" id="journey-heading">The ASMI Engineering Journey</h2>
                  <p className="journey-sub">4 phases from your rank to your branch letter.</p>
              </div>
              <div className="journey-steps-wrap">
                  <div className="journey-line-left" aria-hidden="true"></div>
                  <div className="journey-line-right" aria-hidden="true"></div>
                  <div className="journey-runner" aria-hidden="true">🏃</div>
                  <div className="journey-steps" role="list">
                      <div className="journey-step" role="listitem">
                          <div className="journey-circle gold">1</div>
                          <div className="journey-label gold">Cutoff Analysis</div>
                          <p className="journey-body">Understand branch-wise cutoff trends before filling any preference.</p>
                      </div>
                      <div className="journey-step" role="listitem">
                          <div className="journey-circle gold">2</div>
                          <div className="journey-label gold">1-on-1 Strategy</div>
                          <p className="journey-body">Dedicated counsellor maps your rank to your best branch options.</p>
                      </div>
                      <div className="journey-step" role="listitem">
                          <div className="journey-circle purple">3</div>
                          <div className="journey-label purple">Smart Pref List</div>
                          <p className="journey-body">JoSAA/CSAB preference list built for maximum upgrade potential.</p>
                      </div>
                      <div className="journey-step" role="listitem">
                          <div className="journey-circle purple">4</div>
                          <div className="journey-label purple">Final Admission</div>
                          <p className="journey-body">Support through freeze deadline, document verification, reporting.</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION Pricing
      ════════════════════════════════ */}
      <section className="pricing-section" aria-labelledby="pricing-heading">
          <div className="pricing-inner">
              <div className="pricing-header">
                  <span className="pricing-eyebrow">SERVICES</span>
                  <h2 className="pricing-headline" id="pricing-heading">Every Engineering Path, Covered.</h2>
                  <p className="pricing-sub1">From JEE to MHT-CET to BITS — expert support for every rank and every round.</p>
                  <p className="pricing-sub2"><span className="ps2-purple">Big</span> On Data. <span className="ps2-muted">Light</span> On Your Pocket. Access all the data you need, without overpaying for it.</p>
              </div>
              <div className="pricing-cards">
                  <div className="pricing-card">
                      <div className="pricing-exam">JEE MAIN</div>
                      <div className="pricing-course">JEE Main</div>
                      <div className="pricing-type">B.Tech Counselling</div>
                      <div className="pricing-price">₹2,499</div>
                      <button className="pricing-btn-default">Learn More</button>
                  </div>
                  <div className="pricing-card featured">
                      <span className="pricing-popular">★ POPULAR</span>
                      <div className="pricing-exam">JEE ADVANCED</div>
                      <div className="pricing-course">JEE Advanced</div>
                      <div className="pricing-type">IIT Counselling</div>
                      <div className="pricing-price">₹3,999</div>
                      <button className="pricing-btn-featured">Learn More</button>
                  </div>
                  <div className="pricing-card">
                      <div className="pricing-exam">MHT-CET</div>
                      <div className="pricing-course">MHT-CET</div>
                      <div className="pricing-type">CAP Counselling</div>
                      <div className="pricing-price">₹3,999</div>
                      <button className="pricing-btn-default">Learn More</button>
                  </div>
                  <div className="pricing-card">
                      <div className="pricing-exam">BITS/MANIPAL/VIT</div>
                      <div className="pricing-course">BITS/Manipal/VIT</div>
                      <div className="pricing-type">Private Univ Guidance</div>
                      <div className="pricing-price">₹3,999</div>
                      <button className="pricing-btn-default">Learn More</button>
                  </div>
              </div>
              <div className="pricing-banner">
                  <div className="pricing-banner-h">Take the first step.</div>
                  <div className="pricing-banner-sub">Book a FREE 1-to-1 with an Asmi Counsellor.</div>
                  <p className="pricing-banner-body">Talk to a real mentor in under 24 hours. No payment, no obligation — just clarity on what your future could look like.</p>
                  <div className="pricing-banner-btns">
                      <a href="/inquiry" className="banner-btn-white">Book My Free Session →</a>
                      <a href="#" className="banner-btn-yellow">WhatsApp Us 💬</a>
                  </div>
              </div>
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION Testimonials
      ════════════════════════════════ */}
      <section className="testi-section" aria-labelledby="testi-heading">
          <div className="testi-inner">
              <div className="testi-header">
                  <span className="testi-eyebrow">RESULTS</span>
                  <h2 className="testi-headline" id="testi-heading">Real Students. Real Branches.</h2>
                  <p className="testi-sub">Names, colleges, branches — no vague praise.</p>
                  <div className="testi-leaf" aria-hidden="true">🍃</div>
              </div>
              <div className="testi-avatars" aria-label="Student testimonials">
                  <div className="testi-avatar active" aria-label="Student 1"></div>
                  <div className="testi-avatar" aria-label="Student 2"></div>
                  <div className="testi-avatar" aria-label="Student 3"></div>
                  <div className="testi-avatar" aria-label="Student 4"></div>
                  <div className="testi-avatar" aria-label="Student 5"></div>
                  <div className="testi-avatar" aria-label="Student 6"></div>
                  <div className="testi-avatar" aria-label="Student 7"></div>
                  <div className="testi-avatar" aria-label="Student 8"></div>
                  <div className="testi-avatar" aria-label="Student 9"></div>
              </div>
              <div className="testi-cards">
                  <div className="testi-card">
                      <div className="testi-stars" aria-label="5 stars">★★★★★</div>
                      <div className="testi-student-row">
                          <div className="testi-avatar-sm" aria-hidden="true"></div>
                          <div>
                              <div className="testi-name">Rahul Sharma</div>
                              <div className="testi-tag">JEE Advanced 2024</div>
                              <div className="testi-tag">IIT Bombay CS</div>
                          </div>
                      </div>
                      <div className="testi-quote-mark" aria-hidden="true">❝</div>
                      <p className="testi-body">"ASMI's branch strategy was spot on. Got CS at IIT Bombay in round 1 itself."</p>
                  </div>
                  <div className="testi-card">
                      <div className="testi-stars" aria-label="5 stars">★★★★★</div>
                      <div className="testi-student-row">
                          <div className="testi-avatar-sm" aria-hidden="true"></div>
                          <div>
                              <div className="testi-name">Priya Nair</div>
                              <div className="testi-tag">JEE Main 2024</div>
                              <div className="testi-tag">NIT Trichy ECE</div>
                          </div>
                      </div>
                      <div className="testi-quote-mark" aria-hidden="true">❝</div>
                      <p className="testi-body">"They built my preference list across 180 colleges. Upgraded twice. Ended up exactly where I wanted."</p>
                  </div>
                  <div className="testi-card">
                      <div className="testi-stars" aria-label="5 stars">★★★★★</div>
                      <div className="testi-student-row">
                          <div className="testi-avatar-sm" aria-hidden="true"></div>
                          <div>
                              <div className="testi-name">Arjun Mehta</div>
                              <div className="testi-tag">MHT-CET 2024</div>
                              <div className="testi-tag">COEP Pune</div>
                          </div>
                      </div>
                      <div className="testi-quote-mark" aria-hidden="true">❝</div>
                      <p className="testi-body">"The JoSAA round alerts on WhatsApp saved me from missing the freeze deadline. Literally life-changing."</p>
                  </div>
              </div>
              <div className="testi-nav">
                  <button className="testi-arrow" aria-label="Previous testimonials">‹</button>
                  <button className="testi-arrow" aria-label="Next testimonials">›</button>
              </div>
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION Resources
      ════════════════════════════════ */}
      <section className="resources-section" aria-labelledby="resources-heading">
          <div className="resources-inner">
              <div className="resources-header">
                  <div>
                      <h2 className="resources-headline" id="resources-heading">Resources</h2>
                      <p className="resources-sub">Access high-quality guides, research-backed articles, and downloadable templates curated for student success</p>
                  </div>
                  <a href="#" className="resources-view-all">View all →</a>
              </div>
              <div className="resources-cards">
                  <div className="resource-card">
                      <div className="resource-img" style={{ background: 'linear-gradient(135deg,#0d2137 0%,#1a3a5c 100%)' }}>
                          <span className="resource-img-emoji" aria-hidden="true">🧠</span>
                          <span className="resource-tag" style={{ background: '#1565c0', color: '#ffffff' }}>ARTICLE</span>
                      </div>
                      <div className="resource-content">
                          <div className="resource-title">JEE Rank vs Branch: The Real Tradeoffs</div>
                          <p className="resource-body">Understand which branches are worth the rank drop — and which aren't.</p>
                          <div className="resource-footer">
                              <span className="resource-meta">2400 words</span>
                              <a href="#" className="resource-cta-link">Read more →</a>
                          </div>
                      </div>
                  </div>
                  <div className="resource-card">
                      <div className="resource-img" style={{ background: 'linear-gradient(135deg,#0a1628 0%,#004d40 100%)' }}>
                          <span className="resource-img-emoji" aria-hidden="true">📄</span>
                          <span className="resource-tag" style={{ background: '#00C8B4', color: '#0a1628' }}>DOWNLOAD</span>
                      </div>
                      <div className="resource-content">
                          <div className="resource-title">JoSAA Round-wise Cutoff PDF 2025</div>
                          <p className="resource-body">All IIT, NIT, IIIT cutoffs from JoSAA 2025 — round by round.</p>
                          <div className="resource-footer">
                              <span className="resource-meta">PDF · 2.1 MB</span>
                              <a href="#" className="resource-cta-btn">Get it Now ↓</a>
                          </div>
                      </div>
                  </div>
                  <div className="resource-card">
                      <div className="resource-img" style={{ background: 'linear-gradient(135deg,#1a3a5c 0%,#00695C 100%)' }}>
                          <span className="resource-img-emoji" aria-hidden="true">▶️</span>
                          <span className="resource-tag" style={{ background: '#00897b', color: '#ffffff' }}>VIDEO</span>
                      </div>
                      <div className="resource-content">
                          <div className="resource-title">How to Build Your JoSAA Preference List</div>
                          <p className="resource-body">Step-by-step walkthrough of building a winning preference list.</p>
                          <div className="resource-footer">
                              <span className="resource-meta">12 min 40 sec</span>
                              <a href="#" className="resource-cta-link">Watch →</a>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION FAQs
      ════════════════════════════════ */}
      <section className="faq-section" aria-labelledby="faq-heading">
          <div className="faq-inner">
              <div className="faq-header">
                  <span className="faq-eyebrow">FAQs</span>
                  <h2 className="faq-headline" id="faq-heading">Frequently Asked</h2>
                  <p className="faq-sub">The questions every JEE student and parent asks us first.</p>
              </div>
              <div className="faq-accordion">
                  <div className={`faq-item ${openFaq === 0 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(0)}>
                          What is JEE counselling and how does ASMI help?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 0 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 0 ? 'block' : 'none' }}>JEE counselling is the process of filling preferences for engineering colleges through JoSAA after your JEE result. ASMI provides end-to-end support — from understanding your rank and category to filling the right preferences at the right time across JoSAA, CSAB and state CET rounds.</div>
                  </div>
                  <div className={`faq-item ${openFaq === 1 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(1)}>
                          How is ASMI different from free YouTube JEE advice?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 1 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 1 ? 'block' : 'none' }}>YouTube gives general advice. ASMI gives personalised guidance based on your exact rank, branch preference, domicile and budget. Our counsellors track every JoSAA round for you and alert you in real time.</div>
                  </div>
                  <div className={`faq-item ${openFaq === 2 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(2)}>
                          Does ASMI cover JEE Mains, Advanced and state CETs?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 2 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 2 ? 'block' : 'none' }}>Yes. We cover JoSAA for JEE Mains and Advanced, CSAB, MHT-CET, KCET, TSEAMCET and 10+ other state CETs — all in one package.</div>
                  </div>
                  <div className={`faq-item ${openFaq === 3 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(3)}>
                          What are your engineering counselling package prices?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 3 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 3 ? 'block' : 'none' }}>Packages start at ₹2,499 for JEE Main counselling and go up to ₹3,999 for full IIT/JoSAA end-to-end support. All pricing is fixed — no hidden charges or institute commissions.</div>
                  </div>
                  <div className={`faq-item ${openFaq === 4 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(4)}>
                          What if I don't get my preferred branch after paying?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 4 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 4 ? 'block' : 'none' }}>We guide you through every available round including CSAB and institutional rounds. We also help you evaluate upgrade options and alternative branches strategically.</div>
                  </div>
                  <div className={`faq-item ${openFaq === 5 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(5)}>
                          Can parents track the JoSAA counselling process?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 5 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 5 ? 'block' : 'none' }}>Absolutely. We send WhatsApp updates to both the student and parents after every JoSAA round. You are never in the dark.</div>
                  </div>
              </div>
          </div>
      </section>
      
      
      <div style={{ display: 'none' }}>
      {/* ════════════════════════════════
           OLD SECTIONS (hidden)
      ════════════════════════════════ */}
      
      {/* placeholder to preserve old hero structure */}
      <section className="hero" style={{ display: 'none' }} aria-labelledby="hero-heading-old">
          <div className="hero-stats" role="list" aria-label="Key statistics">
      
                  <div className="hero-stat" role="listitem">
                      <span className="stat-num" id="stat-students" aria-label="10,000 plus students guided">10K+</span>
                      <span className="stat-lbl">Students Guided</span>
                  </div>
      
                  <div className="stat-divider" aria-hidden="true"></div>
      
                  <div className="hero-stat" role="listitem">
                      <span className="stat-num" id="stat-years" aria-label="11 plus years experience">11+</span>
                      <span className="stat-lbl">Years Experience</span>
                  </div>
      
                  <div className="stat-divider" aria-hidden="true"></div>
      
                  <div className="hero-stat" role="listitem">
                      <span className="stat-num" id="stat-colleges" aria-label="500 plus colleges">500+</span>
                      <span className="stat-lbl">Colleges</span>
                  </div>
      
                  <div className="stat-divider" aria-hidden="true"></div>
      
                  <div className="hero-stat" role="listitem">
                      <span className="stat-num" id="stat-rating" aria-label="4.9 star Google rating">4.9&#9733;</span>
                      <span className="stat-lbl">Google Rating</span>
                  </div>
      
              </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 3 — TRUST STRIP
      ════════════════════════════════ */}
      <section className="trust-strip" aria-label="Colleges our students have been admitted to">
          <div className="trust-track" aria-hidden="true">
              <span className="trust-item">IIT Bombay · IIT Delhi · NIT Trichy · BITS Pilani · VIT Vellore · Manipal MIT · IIT Madras · NIT Warangal · COEP Pune · VJTI Mumbai · IIT Kharagpur · IIIT Hyderabad ·</span>
              <span className="trust-item">IIT Bombay · IIT Delhi · NIT Trichy · BITS Pilani · VIT Vellore · Manipal MIT · IIT Madras · NIT Warangal · COEP Pune · VJTI Mumbai · IIT Kharagpur · IIIT Hyderabad ·</span>
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 4 — PROBLEMS
      ════════════════════════════════ */}
      <section className="problems" aria-labelledby="prob-heading">
          <div className="problems-noise" aria-hidden="true"></div>
          <div className="problems-inner">
      
              <div className="prob-header">
                  <span className="prob-badge">The Problem</span>
                  <h2 className="prob-headline" id="prob-heading">Students Miss Their College —<br />Before JoSAA Even Begins.</h2>
                  <p className="prob-sub">Here's what goes wrong — and exactly how ASMI fixes it.</p>
              </div>
      
              <div className="prob-table" role="table" aria-label="Problems and ASMI solutions">
      
                  <div className="prob-table-header" role="row">
                      <span className="prob-col-label red" role="columnheader">The Problem</span>
                      <span className="prob-col-label green" role="columnheader">How ASMI Fixes It</span>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">01</span>
                          <span className="prob-text-left">Wrong branch/college preference order</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Algorithm-optimised JoSAA preference list submitted before deadline</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">02</span>
                          <span className="prob-text-left">JoSAA freeze/float/slide confusion</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Clear strategy explained for each round option</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">03</span>
                          <span className="prob-text-left">Missing open state college options</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Complete state CET analysis — MH, KA, TS, AP and more</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">04</span>
                          <span className="prob-text-left">CSAB special round confusion</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Complete CSAB guidance — who qualifies and what to do</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">05</span>
                          <span className="prob-text-left">Not understanding home state vs other state quota</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Clear domicile strategy for each state CET</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">06</span>
                          <span className="prob-text-left">Incorrect documents at reporting</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Complete document checklist for engineering college reporting</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">07</span>
                          <span className="prob-text-left">Last minute choice filling errors</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Real-time support during the choice filling window</span>
                      </div>
                  </div>
      
              </div>
      
              <div className="prob-highlight" data-animate>
                  💡 Students with lower ranks often get better branches due to smarter JoSAA choice filling strategy.
              </div>
      
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 5 — COUNSELLING PROCESS
      ════════════════════════════════ */}
      <section className="process" aria-labelledby="process-heading">
          <div className="process-inner">
      
              <span className="process-badge">Our Process</span>
              <h2 className="process-headline" id="process-heading">Your Path From JEE Rank<br />To Engineering Seat.</h2>
              <p className="process-sub">Simple. Transparent. Student-first.</p>
      
              <div className="process-rows" aria-label="JoSAA counselling process steps">
      
                  <div className="process-row" role="list">
                      <div className="process-step" role="listitem">
                          <div className="step-circle">1</div>
                          <span className="step-label">JEE Result</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">2</div>
                          <span className="step-label">JoSAA Registration</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">3</div>
                          <span className="step-label">Document Upload</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">4</div>
                          <span className="step-label">Choice Filling</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">5</div>
                          <span className="step-label">Seat Allotment</span>
                      </div>
                  </div>
      
                  <div className="process-row" role="list">
                      <div className="process-step" role="listitem">
                          <div className="step-circle">R1</div>
                          <span className="step-label">Round 1</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">R2</div>
                          <span className="step-label">Round 2</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">R3</div>
                          <span className="step-label">Round 3</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">CS</div>
                          <span className="step-label">CSAB Round</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">IR</div>
                          <span className="step-label">Institutional Rounds</span>
                      </div>
                  </div>
      
              </div>
      
              <div className="process-terms" aria-label="Important JoSAA terms">
                  <div className="term-card">
                      <div className="term-label">Freeze</div>
                      <div className="term-def">Lock current allotted seat — no more upgrades</div>
                  </div>
                  <div className="term-card">
                      <div className="term-label">Float</div>
                      <div className="term-def">Keep current seat, try for better options</div>
                  </div>
                  <div className="term-card">
                      <div className="term-label">Slide</div>
                      <div className="term-def">Upgrade only within same institute</div>
                  </div>
                  <div className="term-card">
                      <div className="term-label">CSAB</div>
                      <div className="term-def">Central Seat Allocation Board special rounds</div>
                  </div>
                  <div className="term-card">
                      <div className="term-label">Spot Round</div>
                      <div className="term-def">Last-chance institutional seat filling</div>
                  </div>
              </div>
      
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 6 — WHY ASMI
      ════════════════════════════════ */}
      <section className="why-asmi" aria-labelledby="why-heading">
          <div className="why-inner">
      
              <span className="why-badge">Why ASMI</span>
              <h2 className="why-headline" id="why-heading">The Difference Is In The Details.</h2>
              <p className="why-sub">11 years. 10,000+ engineering admissions. Zero false promises.</p>
      
              <div className="why-grid">
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">👁</span>
                      <div className="why-title">Transparent Guidance</div>
                      <div className="why-body">No false promises. No agent commissions. Fixed transparent pricing.</div>
                  </div>
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">🔬</span>
                      <div className="why-title">Real College Research</div>
                      <div className="why-body">Updated JoSAA cutoffs, branch-wise analysis — verified every round.</div>
                  </div>
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">🎓</span>
                      <div className="why-title">Experienced Counsellors</div>
                      <div className="why-body">11+ years. 10,000+ engineering admissions guided personally.</div>
                  </div>
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">🗺</span>
                      <div className="why-title">All India Support</div>
                      <div className="why-body">JEE, MHT-CET, KCET, TSEAMCET and 10+ state CETs covered.</div>
                  </div>
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">❤️</span>
                      <div className="why-title">Student-First Approach</div>
                      <div className="why-body">Your rank, branch preference and budget — every recommendation personalised.</div>
                  </div>
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">📊</span>
                      <div className="why-title">Round-wise Tracking</div>
                      <div className="why-body">JoSAA rounds 1-6, CSAB, institutional rounds — nothing missed.</div>
                  </div>
      
              </div>
      
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 7 — TOOLS
      ════════════════════════════════ */}
      <section className="tools" id="tools" aria-labelledby="tools-heading">
          <div className="tools-inner">
      
              <span className="tools-badge">Free Tools</span>
              <h2 className="tools-headline" id="tools-heading">Everything You Need.<br />Built For You.</h2>
              <p className="tools-sub">Try our free branch assessment tool below, or book a free session and our counsellors will run your JoSAA strategy manually.</p>
      
              <div className="tools-grid">
      
                  <div className="tool-card">
                      <span className="tool-tier-badge">FREE · ACTIVE</span>
                      <span className="tool-icon" aria-hidden="true">🧠</span>
                      <div className="tool-title">Branch Assessment</div>
                      <p className="tool-body">Take our scientific 31-question assessment and get an instant AI-powered compatibility report.</p>
                      <a href="/tools/branch-assessment" className="tool-cta">Start Assessment →</a>
                  </div>
      
                  <div className="tool-card">
                      <span className="tool-tier-badge">FREE · COMING SOON</span>
                      <span className="tool-icon" aria-hidden="true">🔍</span>
                      <div className="tool-title">JoSAA Cutoff Explorer</div>
                      <p className="tool-body">Search IIT, NIT, IIIT and GFTI cutoffs by branch, category and rank. Updated with 2025 actual data.</p>
                      <span className="tool-cta disabled" aria-disabled="true">Coming Soon</span>
                  </div>
      
                  <div className="tool-card">
                      <span className="tool-tier-badge">FREE · COMING SOON</span>
                      <span className="tool-icon" aria-hidden="true">🏛</span>
                      <div className="tool-title">College Comparator</div>
                      <p className="tool-body">Compare IITs, NITs and private colleges by branch, fees, placement data and location side-by-side.</p>
                      <span className="tool-cta disabled" aria-disabled="true">Coming Soon</span>
                  </div>
      
                  <div className="tool-card">
                      <span className="tool-tier-badge paid">PAID · ₹PLACEHOLDER</span>
                      <span className="tool-icon" aria-hidden="true">📊</span>
                      <div className="tool-title">Rank Predictor</div>
                      <p className="tool-body">Enter your JEE rank and category. Instantly see every eligible college and branch across JoSAA, CSAB and state CETs.</p>
                      <a href="/inquiry" className="tool-cta paid-cta">Get Access →</a>
                  </div>
      
              </div>
      
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 8 — PACKAGES
      ════════════════════════════════ */}
      <section className="packages" id="packages" aria-labelledby="packages-heading">
          <div className="packages-inner">
      
              <span className="packages-badge">Packages</span>
              <h2 className="packages-headline" id="packages-heading">Every Admission Path, Covered.</h2>
              <p className="packages-sub">From JEE Mains to BITS Pilani — expert support for every exam and every round.</p>
      
              <div className="packages-grid">
      
                  <div className="pkg-card" data-pkg-animate>
                      <div>
                          <span className="pkg-stream-badge">JEE MAINS</span>
                      </div>
                      <div className="pkg-course">B.Tech Counselling</div>
                      <div className="pkg-price">₹PLACEHOLDER</div>
                      <ul className="pkg-features" aria-label="Package features">
                          <li>JoSAA counselling</li>
                          <li>State CET strategy</li>
                          <li>Branch analysis</li>
                          <li>Document verification</li>
                          <li>Round-wise WhatsApp alerts</li>
                      </ul>
                      <a href="/inquiry" className="pkg-cta">Learn More →</a>
                  </div>
      
                  <div className="pkg-card popular" data-pkg-animate>
                      <div>
                          <span className="pkg-stream-badge">JEE</span>
                          <span className="pkg-popular-label">POPULAR</span>
                      </div>
                      <div className="pkg-course">B.Tech Premium</div>
                      <div className="pkg-price">₹PLACEHOLDER</div>
                      <ul className="pkg-features" aria-label="Package features">
                          <li>All of above</li>
                          <li>CSAB rounds</li>
                          <li>Institutional rounds</li>
                          <li>BITS/Manipal/VIT guidance</li>
                          <li>Priority support</li>
                      </ul>
                      <a href="/inquiry" className="pkg-cta">Learn More →</a>
                  </div>
      
                  <div className="pkg-card" data-pkg-animate>
                      <div>
                          <span className="pkg-stream-badge">MHT-CET</span>
                      </div>
                      <div className="pkg-course">Maharashtra B.Tech</div>
                      <div className="pkg-price">₹PLACEHOLDER</div>
                      <ul className="pkg-features" aria-label="Package features">
                          <li>CAP rounds guidance</li>
                          <li>College preference strategy</li>
                          <li>Home state quota analysis</li>
                          <li>Document support</li>
                          <li>Round tracking</li>
                      </ul>
                      <a href="/inquiry" className="pkg-cta">Learn More →</a>
                  </div>
      
                  <div className="pkg-card" data-pkg-animate>
                      <div>
                          <span className="pkg-stream-badge">BITS/VIT/MANIPAL</span>
                      </div>
                      <div className="pkg-course">Private Universities</div>
                      <div className="pkg-price">₹PLACEHOLDER</div>
                      <ul className="pkg-features" aria-label="Package features">
                          <li>BITSAT strategy</li>
                          <li>Campus & branch guidance</li>
                          <li>VITEEE & MET counselling</li>
                          <li>Fee & placement analysis</li>
                          <li>Application support</li>
                      </ul>
                      <a href="/inquiry" className="pkg-cta">Learn More →</a>
                  </div>
      
              </div>
      
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 9 — TESTIMONIALS
      ════════════════════════════════ */}
      <section className="testimonials" aria-labelledby="testi-heading">
          <div className="testi-inner">
      
              <span className="testi-badge">Student Success</span>
              <h2 className="testi-headline" id="testi-heading">Straight From The Students.</h2>
              <p className="testi-sub">Real results from real students we've guided into top engineering colleges.</p>
      
              <div className="testi-grid">
      
                  <div className="testi-card" data-testi-animate>
                      <div className="testi-avatar">RS</div>
                      <div className="testi-name">Rohan S.</div>
                      <div className="testi-detail">B.Tech CSE · IIT Bombay</div>
                      <span className="testi-score">JEE AIR [XXX]</span>
                      <p className="testi-quote">"ASMI helped me navigate JoSAA rounds perfectly. Got CSE at IIT Bombay which I thought was out of reach."</p>
                      <div className="testi-stars">★★★★★</div>
                  </div>
      
                  <div className="testi-card" data-testi-animate>
                      <div className="testi-avatar">PP</div>
                      <div className="testi-name">Priya P.</div>
                      <div className="testi-detail">B.Tech ECE · NIT Trichy</div>
                      <span className="testi-score">MHT-CET [XX] percentile</span>
                      <p className="testi-quote">"Their MHT-CET counselling strategy helped me get ECE at NIT Trichy. Worth every rupee."</p>
                      <div className="testi-stars">★★★★★</div>
                  </div>
      
                  <div className="testi-card" data-testi-animate>
                      <div className="testi-avatar">AS</div>
                      <div className="testi-name">Aarav S.</div>
                      <div className="testi-detail">B.Tech CS · BITS Pilani</div>
                      <span className="testi-score">BITSAT [XXX]</span>
                      <p className="testi-quote">"ASMI's BITS counselling support was exceptional. They knew exactly which campus and branch to target."</p>
                      <div className="testi-stars">★★★★★</div>
                  </div>
      
              </div>
      
          </div>
      </section>
      
      
      
      
      
      {/* ════════════════════════════════
           SECTION 11 — CTA BANNER
      ════════════════════════════════ */}
      <section className="cta-banner" aria-labelledby="cta-heading">
          <div className="cta-deco cta-deco-1" aria-hidden="true"></div>
          <div className="cta-deco cta-deco-2" aria-hidden="true"></div>
          <div className="cta-inner">
              <h2 className="cta-headline animate" id="cta-heading">Take The First Step.</h2>
              <p className="cta-sub animate">Book a FREE 1-to-1 with an ASMI Counsellor. Talk to a real mentor in under 24 hours. No payment. No obligation. Just clarity.</p>
              <div className="cta-buttons animate">
                  <a href="/inquiry" className="cta-btn-primary">Book My Free Session →</a>
                  <a href="#" className="cta-btn-secondary">WhatsApp Us →</a>
              </div>
          </div>
      </section>
      </div>
      
      
      {/* ════════════════════════════════
           SECTION 12 — FOOTER
      ════════════════════════════════ */}
      <footer className="footer" role="contentinfo">
          <div className="footer-inner">
      
              <div className="footer-grid">
      
                  <div className="footer-col-brand">
                      <img src="asmi-logo.png" alt="ASMI Career" className="footer-logo-img" />
                      <p className="footer-tagline">Guiding Futures, Building Engineers</p>
                      <div className="footer-socials" aria-label="Social media links">
                          <a href="#" className="footer-social" aria-label="Facebook">f</a>
                          <a href="#" className="footer-social" aria-label="Instagram">ig</a>
                          <a href="#" className="footer-social" aria-label="YouTube">yt</a>
                          <a href="#" className="footer-social" aria-label="WhatsApp">wa</a>
                      </div>
                  </div>
      
                  <div>
                      <span className="footer-col-header">Get</span>
                      <a href="#" className="footer-link">Counselling</a>
                      <a href="#" className="footer-link">Services</a>
                      <a href="#packages" className="footer-link">Packages</a>
                      <a href="/tools/cutoff-explorer" className="footer-link">Cutoff Explorer</a>
                      <a href="#" className="footer-link">Resources</a>
                  </div>
      
                  <div>
                      <span className="footer-col-header">Explore</span>
                      <a href="#" className="footer-link">Universities</a>
                      <a href="#" className="footer-link">Updates & Events</a>
                      <a href="#" className="footer-link">Success Stories</a>
                      <a href="#" className="footer-link">FAQs</a>
                      <a href="#" className="footer-link">Webinars & Video Guides</a>
                  </div>
      
                  <div>
                      <span className="footer-col-header">Company</span>
                      <a href="#" className="footer-link">About Us</a>
                      <a href="#" className="footer-link">Contact Us</a>
                      <a href="#" className="footer-link">Privacy Policy</a>
                      <a href="#" className="footer-link">Terms of Service</a>
                  </div>
      
              </div>
      
              <div className="footer-bottom">
                  <span className="footer-bottom-text">© 2026 ASMI Youth Career Advisor LLP. All rights reserved.</span>
                  <span className="footer-bottom-text">asmicareer.com · asmicareer.in</span>
              </div>
      
          </div>
      </footer>
    </div>
  );
}
