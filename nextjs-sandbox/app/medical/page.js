'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function MedicalPortal() {
  const FEATURED_COLLEGE_SLUGS = [
    'grant-medical-college-mumbai',
    'maulana-azad-medical-college-new-delhi',
    'kasturba-medical-college-manipal',
    'symbiosis-medical-college-for-women-pune'
  ];

  const PS_PAIRS = [
    {
      problem: 'Wrong Preference Order = Seat Lost Forever',
      solution: 'Counsellor-built preference list — right colleges, right order, submitted on time.'
    },
    {
      problem: 'Deadlines Close in 24–72 Hours. No Mercy.',
      solution: 'WhatsApp alerts for every round deadline, sent the moment it opens.'
    },
    {
      problem: 'Fake Agents Charging ₹5–10L for "Guaranteed" Seats',
      solution: 'Only verified official portals. No middlemen. Fixed transparent pricing.'
    },
    {
      problem: 'Deposit Cancellations Can Cost ₹1–5 Lakhs',
      solution: 'Full guidance on bonds, deposits and refund eligibility — explained upfront.'
    },
    {
      problem: 'Document Errors and Missing Certificates at Reporting',
      solution: 'Document verification support with scanned PDF of every certificate — nothing left to chance.'
    }
  ];

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const faqRef = useRef(null);
  const [faqVisible, setFaqVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [carouselColleges, setCarouselColleges] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activePs, setActivePs] = useState(0);
  const psTimerRef = useRef(null);

  const uniTrackRef = useRef(null);
  const statRefs = useRef([]);
  const statsAnimated = useRef(false);
  const journeyRef = useRef(null);
  const [journeyActive, setJourneyActive] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);

  const testiRef = useRef(null);
  const [testiVisible, setTestiVisible] = useState(false);
  const [boraCount, setBoraCount] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !testiVisible) {
          setTestiVisible(true);
          // Count up AIR 1 score
          let count = 0;
          const interval = setInterval(() => {
            count += 12;
            if (count >= 720) { count = 720; clearInterval(interval); }
            setBoraCount(count);
          }, 20);
        }
      },
      { threshold: 0.2 }
    );
    if (testiRef.current) observer.observe(testiRef.current);
    return () => observer.disconnect();
  }, [testiVisible]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !journeyActive) {
          setJourneyActive(true);
          if (journeyRef.current) {
            journeyRef.current.querySelector('.highway-scene')
              ?.classList.add('scene-active');
          }
          [0,1,2,3,4,5].forEach(i => {
            setTimeout(() => setActiveStep(i), 800 + i * 800);
          });
        }
      },
      { threshold: 0.2 }
    );
    if (journeyRef.current) observer.observe(journeyRef.current);
    return () => observer.disconnect();
  }, [journeyActive]);

  useEffect(() => {
    fetch('/data/events.json')
      .then(r => r.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(sorted);
      })
      .catch(err => console.warn('Events feed unavailable:', err));
  }, []);

  useEffect(() => {
    fetch('/data/colleges.json')
      .then(r => r.json())
      .then(data => {
        // Get featured colleges in exact order
        const featured = FEATURED_COLLEGE_SLUGS
          .map(slug => data.find(c => c.slug === slug))
          .filter(Boolean);
        setCarouselColleges(featured);
      })
      .catch(err => console.warn('Colleges fetch failed:', err));
  }, []);

  useEffect(() => {
    psTimerRef.current = setInterval(() => {
      setActivePs(prev => (prev + 1) % PS_PAIRS.length);
    }, 3500);
    return () => clearInterval(psTimerRef.current);
  }, []);

  function handlePsHover(index) {
    clearInterval(psTimerRef.current);
    setActivePs(index);
  }

  function handlePsLeave() {
    psTimerRef.current = setInterval(() => {
      setActivePs(prev => (prev + 1) % PS_PAIRS.length);
    }, 3500);
  }

  useEffect(() => {
    const stats = [
      { target: 11,    suffix: '+',  format: null, decimal: 0 },
      { target: 25000, suffix: '+',  format: 'k',  decimal: 0 },
      { target: 4.9,   suffix: ' ★', format: null, decimal: 1 },
      { target: 1000,  suffix: '+',  format: null, decimal: 0 },
    ];

    function animateCounter(el, config) {
      const { target, suffix, format, decimal } = config;
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        current = increment * step;
        if (step >= steps) { current = target; clearInterval(timer); }
        let display = decimal > 0 ? current.toFixed(decimal) : Math.floor(current);
        if (format === 'k') display = Math.floor(current / 1000) + 'K';
        el.textContent = display + suffix;
      }, duration / steps);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !statsAnimated.current) {
          statsAnimated.current = true;
          statRefs.current.forEach((el, i) => { if (el) animateCounter(el, stats[i]); });
          observer.disconnect();
        }
      });
    }, { threshold: 0.3 });

    if (statRefs.current[0]) observer.observe(statRefs.current[0]);
    return () => observer.disconnect();
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

    return () => {
      revealObserver.disconnect();
      whyObserver.disconnect();
      pkgObserver.disconnect();
      animateObserver.disconnect();
    };
  }, []);

  const scrollCarousel = (direction) => {
    if (uniTrackRef.current) {
      uniTrackRef.current.scrollBy({ left: direction * 320, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setFaqVisible(true);
      },
      { threshold: 0.1 }
    );
    if (faqRef.current) observer.observe(faqRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(prev => prev === index ? null : index);
  };

  return (
    <div className="medicalPortal">
      
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
                  <li><a href="/colleges">Colleges</a></li>
                  <li><a href="/counselling">Counselling</a></li>
                  <li><a href="#packages">Packages</a></li>
                  <li><a href="/services">Services</a></li>
                  <li><a href="#events">News & Events</a></li>
                  <li><a href="/about">About Us</a></li>
                  <li><a href="/contact">Contact Us</a></li>
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
          <a href="/colleges">Colleges</a>
          <a href="/counselling">Counselling</a>
          <a href="#packages">Packages</a>
          <a href="/services">Services</a>
          <a href="#events">News & Events</a>
          <a href="/about">About Us</a>
          <a href="/contact">Contact Us</a>
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
                      <div className="hero-eyebrow" aria-label="India's smartest youth career platform">
                          <span className="eyebrow-dot" aria-hidden="true"></span>
                          MAHARASHTRA'S #1 NEET COUNSELLORS
                      </div>
          
                      <h1 className="hero-h1" id="hero-heading">
                          ASMI turns your NEET rank into<br />
                          the admission you <span className="accent">deserve.</span>
                      </h1>
          
                      <p className="hero-sub">
                          From your NEET rank to your MBBS seat — we handle college selection, preference filling, document verification and every round until you're admitted.
                      </p>
          
                      <div className="hero-stats" role="list" aria-label="Key statistics">
                          <div className="hero-stat" role="listitem">
                              <span className="stat-num" ref={el => statRefs.current[0] = el}>11+</span>
                              <span className="stat-lbl">Years of experience</span>
                          </div>
                          <div className="hero-stat" role="listitem">
                              <span className="stat-num" ref={el => statRefs.current[1] = el}>25K+</span>
                              <span className="stat-lbl">Admissions done</span>
                          </div>
                          <div className="hero-stat" role="listitem">
                              <span className="stat-num" ref={el => statRefs.current[2] = el}>4.9 ★</span>
                              <span className="stat-lbl">Google rating</span>
                          </div>
                          <div className="hero-stat" role="listitem">
                              <span className="stat-num" ref={el => statRefs.current[3] = el}>1000+</span>
                              <span className="stat-lbl">Seminars conducted</span>
                          </div>
                      </div>
          
                      <div className="hero-ctas">
                          <a href="/inquiry" className="btn-primary">Book Free Counselling →</a>
                          <a href="#tools" className="btn-secondary">Explore Tools ↓</a>
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
                          <span className="card-pill-grey">Your Admission Portal</span>
                          <span className="card-top-bold">ASMI Dashboard</span>
                      </div>
      
                      <div className="card-inner">
      
                          <div className="card-inner-header">
                              <span className="card-inner-title">Your College Shortlist</span>
                              <span className="card-ai-pill">Live · Personalised</span>
                          </div>
      
                          <div className="rank-display">
                              <div className="rank-label">YOUR NEET RANK</div>
                              <div className="rank-number">25,678</div>
                              <div className="rank-sub">AIR · Open Category</div>
                          </div>
      
                          <ul className="college-list" aria-label="College shortlist">
                              <li className="college-item">
                                  <div className="college-dot-name">
                                      <span className="college-dot green" aria-hidden="true"></span>
                                      <span className="college-name">GMC Pune</span>
                                  </div>
                                  <span className="likelihood-pill pill-safe">Safe ✓</span>
                              </li>
                              <li className="college-item">
                                  <div className="college-dot-name">
                                      <span className="college-dot yellow" aria-hidden="true"></span>
                                      <span className="college-name">GMC Nagpur</span>
                                  </div>
                                  <span className="likelihood-pill pill-likely">Likely</span>
                              </li>
                              <li className="college-item">
                                  <div className="college-dot-name">
                                      <span className="college-dot blue" aria-hidden="true"></span>
                                      <span className="college-name">Seth GS Medical, Mumbai</span>
                                  </div>
                                  <span className="likelihood-pill pill-possible">Borderline</span>
                              </li>
                          </ul>
      
                      </div>
      
                      <div className="card-bottom-row">
                          <span className="card-bottom-label">Counsellor assigned</span>
                          <span className="card-bottom-bold">Anish Kulkarni</span>
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
                      News &amp; Events
                  </div>
                  <a href="/tools/events" className="events-view-all">View all →</a>
              </div>
              <div className="events-track-wrapper" aria-label="Upcoming events">
                  {events.length > 0 && (
                      <div className="events-track">
                          {[...events, ...events].map((ev, i) => {
                              return (
                                  <div className="event-card" key={i}>
                                      <span className={`event-tag tag-${ev.type}`}>{ev.tag}</span>
                                      <div className="event-date">{ev.display_date}</div>
                                      <div className="event-headline">{ev.title}</div>
                                      <div className="event-card-actions">
                                          {ev.link && ev.cta && (
                                              <a
                                                  href={ev.link}
                                                  className={`event-cta-btn${ev.type === 'asmi' ? ' asmi-btn' : ''}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                              >
                                                  {ev.cta} →
                                              </a>
                                          )}
                                          {ev.pdf && (
                                              <a
                                                  href={ev.pdf}
                                                  className="event-notice-btn"
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  aria-label={`View official notice for ${ev.title}`}
                                              >
                                                  📄 View Notice
                                              </a>
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 2c — TOP TIER UNIVERSITIES
      ════════════════════════════════ */}
      <section className="univ-section" aria-labelledby="univ-heading">
        <div className="univ-inner">

          <div className="univ-header">
            <div className="univ-title-row">
              <span className="univ-dot" aria-hidden="true">●</span>
              <h2 className="univ-title" id="univ-heading">Top Tier Universities</h2>
            </div>
            <div className="univ-header-right">
              <a href="/colleges" className="univ-view-all">View all →</a>
              <button
                className="univ-arrow"
                onClick={() => setCarouselIndex(i => Math.max(0, i - 1))}
                aria-label="Previous colleges"
                disabled={carouselIndex === 0}
              >‹</button>
              <button
                className="univ-arrow"
                onClick={() => setCarouselIndex(i =>
                  Math.min(carouselColleges.length - 4, i + 1)
                )}
                aria-label="Next colleges"
                disabled={carouselIndex >= carouselColleges.length - 4}
              >›</button>
            </div>
          </div>

          <div className="univ-track-wrapper">
            <div
              className="univ-track"
              style={{ transform: `translateX(-${carouselIndex * 25}%)` }}
            >
              {carouselColleges.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div className="univ-card skeleton-card" key={i}>
                      <div className="univ-card-img skeleton-img" />
                      <div className="univ-card-body">
                        <div className="skeleton-line short" />
                        <div className="skeleton-line long" />
                      </div>
                    </div>
                  ))
                : carouselColleges.map((college, i) => {
                    const imgPath = `/images/colleges/${college.slug}.jpg`;
                    const hasPhoto = college.photo !== null ||
                      FEATURED_COLLEGE_SLUGS.includes(college.slug);

                    return (
                      <a
                        href={`/colleges/${college.slug}`}
                        className="univ-card"
                        key={college.slug}
                        aria-label={college.name}
                      >
                        <div
                          className="univ-card-img"
                          style={hasPhoto
                            ? { backgroundImage: `url(${imgPath})` }
                            : { background: college.photo_placeholder_color || '#1a0040' }
                          }
                        >
                          {college.asmi_recommended && (
                            <span className="univ-asmi-badge">★ ASMI RECOMMENDS</span>
                          )}
                          {college.asmi_pulse_score && (
                            <span className="univ-rating">★ {college.asmi_pulse_score}/5</span>
                          )}
                          <button
                            className="univ-heart"
                            aria-label={`Save ${college.name}`}
                            onClick={e => e.preventDefault()}
                          >♡</button>
                        </div>
                        <div className="univ-card-body">
                          <div className="univ-card-meta">
                            {college.city && (
                              <span className="univ-meta-item">
                                <span aria-hidden="true">📍</span> {college.city}
                              </span>
                            )}
                            <span className="univ-meta-item">
                              <span aria-hidden="true">🎓</span> {college.type}
                            </span>
                          </div>
                          <div className="univ-card-name">{college.name}</div>
                          {college.seats && (
                            <div className="univ-card-seats">
                              {college.seats} MBBS seats
                            </div>
                          )}
                        </div>
                      </a>
                    );
                  })
              }
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
            <h2 className="ps-headline" id="ps-heading">
              Students Fail Counselling — Before It Even Starts.
            </h2>
            <p className="ps-sub">
              Here's what goes wrong — and exactly how ASMI fixes it.
            </p>
          </div>

          <div className="ps-grid">

            {/* LEFT: PROBLEMS */}
            <div className="ps-left">
              <div className="ps-col-lbl">
                <span className="ps-dot-red" aria-hidden="true">●</span> THE PROBLEM
              </div>
              {PS_PAIRS.map((pair, i) => (
                <div
                  key={i}
                  className={`ps-item${activePs === i ? ' ps-item-active-red' : ''}`}
                  onMouseEnter={() => handlePsHover(i)}
                  onMouseLeave={handlePsLeave}
                  onClick={() => setActivePs(i)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={activePs === i}
                  onKeyDown={e => e.key === 'Enter' && setActivePs(i)}
                >
                  <span className="ps-num" aria-hidden="true">{i + 1}</span>
                  <div className="ps-item-body">
                    <span className="ps-bar red" aria-hidden="true"></span>
                    <span className="ps-text">{pair.problem}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* CENTER: IMAGE PLACEHOLDER */}
            <div className="ps-img-col" role="img" aria-label="Problem vs Solution comparison">
              <div className="ps-img-placeholder">
                <div className="ps-pair-counter">
                  {PS_PAIRS.map((_, i) => (
                    <span
                      key={i}
                      className={`ps-counter-dot${activePs === i ? ' active' : ''}`}
                      onClick={() => setActivePs(i)}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <div className="ps-vs" aria-label="VS">VS</div>
              </div>
            </div>

            {/* RIGHT: SOLUTIONS */}
            <div className="ps-right">
              <div className="ps-col-lbl">
                <span className="ps-dot-green" aria-hidden="true">●</span> THE SOLUTION
              </div>
              {PS_PAIRS.map((pair, i) => (
                <div
                  key={i}
                  className={`ps-item${activePs === i ? ' ps-item-active-green' : ''}`}
                  onMouseEnter={() => handlePsHover(i)}
                  onMouseLeave={handlePsLeave}
                  onClick={() => setActivePs(i)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={activePs === i}
                  onKeyDown={e => e.key === 'Enter' && setActivePs(i)}
                >
                  <span className="ps-num solution" aria-hidden="true">{i + 1}</span>
                  <div className="ps-item-body">
                    <span className="ps-bar green" aria-hidden="true"></span>
                    <span className="ps-text">{pair.solution}</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* CTA STRIP */}
          <div className="ps-cta-strip">
            <p className="ps-cta-text">
              Recognised any of these? Get free guidance from ASMI.
            </p>
            <a href="/inquiry" className="ps-cta-btn">
              Book Free Counselling →
            </a>
          </div>

        </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION Why — WHY ASMI
      ════════════════════════════════ */}
      <section className="why-section" aria-labelledby="why-heading" id="about-us">
          <div className="why-inner">

              <div className="why-left">
                  <span className="why-eyebrow">WHY ASMI</span>
                  <h2 className="why-headline" id="why-heading">
                      Maharashtra's Most Trusted Name in NEET Counselling
                  </h2>
                  <p className="why-sub">
                      11 years. 25,000+ admissions. Here's what makes the difference.
                  </p>

                  <div className="why-features">

                      <div className="why-feature">
                          <div className="why-icon" aria-hidden="true">🗺️</div>
                          <div>
                              <div className="why-feature-title">We've Lived This Journey</div>
                              <div className="why-feature-body">
                                  Founded by someone who faced admission struggles personally.
                                  Not a corporate platform — a counsellor who knows what it feels like.
                              </div>
                          </div>
                      </div>

                      <div className="why-feature">
                          <div className="why-icon" aria-hidden="true">✅</div>
                          <div>
                              <div className="why-feature-title">Official Data Only</div>
                              <div className="why-feature-body">
                                  Every cutoff verified directly from MCC and state portals.
                                  Every rule confirmed before we guide you. No estimates, no guesswork.
                              </div>
                          </div>
                      </div>

                      <div className="why-feature">
                          <div className="why-icon" aria-hidden="true">📍</div>
                          <div>
                              <div className="why-feature-title">Present in 6 Cities</div>
                              <div className="why-feature-body">
                                  Physical offices in Mumbai, Thane, Pune, Kolhapur, Sangli
                                  and Chh. Sambhajinagar. Real people, real offices — not a website.
                              </div>
                          </div>
                      </div>

                      <div className="why-feature">
                          <div className="why-icon" aria-hidden="true">💬</div>
                          <div>
                              <div className="why-feature-title">Direct Counsellor Access</div>
                              <div className="why-feature-body">
                                  WhatsApp your counsellor directly — not a chatbot, not a
                                  ticketing system. A real person who knows your file.
                              </div>
                          </div>
                      </div>

                  </div>
              </div>

              <div className="why-right">
                  <div className="why-video-wrap">
                      <iframe
                          className="why-video"
                          src="https://www.youtube.com/embed/DM7i7CBk6dI"
                          title="How ASMI helps students win"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          loading="lazy"
                      />
                  </div>
                  <div className="why-overlay-card">
                      <div className="why-overlay-label">
                          <span aria-hidden="true">●</span> FROM RANK TO ADMISSION
                      </div>
                      <div className="why-overlay-headline">
                          See how ASMI guides students step by step
                      </div>
                      <p className="why-overlay-sub">
                          25,000+ students guided. Watch how we take you from
                          NEET rank to your MBBS seat.
                      </p>
                      <div className="why-overlay-btns">
                          <a href="/inquiry" className="why-btn-dark">Book a Free Call 📞</a>
                      </div>
                  </div>
              </div>

          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION Journey — ADMISSION JOURNEY
      ════════════════════════════════ */}
      <section className="journey-section" ref={journeyRef} aria-labelledby="journey-heading">
        <div className="journey-inner">

          <div className="journey-header">
            <span className="journey-sprout" aria-hidden="true">🌱</span>
            <h2 className="journey-headline" id="journey-heading">
              The ASMI Admission Journey
            </h2>
            <p className="journey-sub">
              From your NEET score to your final admission letter — we walk every step with you.
            </p>
          </div>

          {/* HIGHWAY SCENE */}
          <div className="highway-scene">

            {/* SVG Road */}
            <svg
              className="highway-svg"
              viewBox="0 0 1200 500"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                {/* Glow filter for road edges */}
                <filter id="glow-yellow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                {/* Strong glow for lamp */}
                <filter id="glow-lamp" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="6" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                {/* Car headlight gradient */}
                <radialGradient id="headlight" cx="50%" cy="0%" r="80%">
                  <stop offset="0%" stopColor="rgba(255,255,200,0.6)"/>
                  <stop offset="100%" stopColor="rgba(255,255,200,0)"/>
                </radialGradient>
              </defs>

              {/* Road surface — wide S-curve */}
              {/* Left edge of road */}
              <path
                className="road-edge-left"
                d="M 60 80 C 60 80, 380 60, 500 200 C 620 340, 840 420, 1140 420"
                fill="none"
                stroke="#FFD700"
                strokeWidth="2"
                filter="url(#glow-yellow)"
              />
              {/* Right edge of road */}
              <path
                className="road-edge-right"
                d="M 60 140 C 60 140, 380 120, 500 260 C 620 400, 840 480, 1140 480"
                fill="none"
                stroke="#FFD700"
                strokeWidth="2"
                filter="url(#glow-yellow)"
              />
              {/* Road surface fill */}
              <path
                className="road-surface"
                d="M 60 80 C 60 80, 380 60, 500 200 C 620 340, 840 420, 1140 420
                   L 1140 480 C 840 480, 620 400, 500 260 C 380 120, 60 140, 60 140 Z"
                fill="#0d001f"
                opacity="0.9"
              />
              {/* Center dashes */}
              <path
                className="road-center-dashes"
                d="M 60 110 C 60 110, 380 90, 500 230 C 620 370, 840 450, 1140 450"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                strokeDasharray="20 15"
              />

              {/* Animated road draw overlay */}
              <path
                className={`road-draw${journeyActive ? ' road-draw-active' : ''}`}
                d="M 60 110 C 60 110, 380 90, 500 230 C 620 370, 840 450, 1140 450"
                fill="none"
                stroke="transparent"
                strokeWidth="60"
              />

              {/* Street lamp poles — 6 positions along the road */}
              {[
                { x: 100, y: 90,  side: 'top' },
                { x: 310, y: 76,  side: 'top' },
                { x: 520, y: 195, side: 'top' },
                { x: 700, y: 340, side: 'bottom' },
                { x: 900, y: 415, side: 'bottom' },
                { x: 1100, y: 430, side: 'bottom' },
              ].map((lamp, i) => (
                <g key={i}>
                  {/* Pole */}
                  <line
                    x1={lamp.x}
                    y1={lamp.side === 'top' ? lamp.y : lamp.y + 60}
                    x2={lamp.x}
                    y2={lamp.side === 'top' ? lamp.y - 50 : lamp.y + 10}
                    stroke={activeStep >= i ? '#FFD700' : '#333'}
                    strokeWidth="2"
                  />
                  {/* Lamp head */}
                  <circle
                    cx={lamp.x}
                    cy={lamp.side === 'top' ? lamp.y - 55 : lamp.y + 5}
                    r="8"
                    fill={activeStep >= i ? '#FFD700' : '#222'}
                    filter={activeStep >= i ? 'url(#glow-lamp)' : ''}
                  />
                  {/* Glow ring when active */}
                  {activeStep >= i && (
                    <circle
                      cx={lamp.x}
                      cy={lamp.side === 'top' ? lamp.y - 55 : lamp.y + 5}
                      r="20"
                      fill="rgba(255,215,0,0.08)"
                    />
                  )}
                </g>
              ))}

              {/* Traveling car */}
              {journeyActive && (
                <g className="highway-car">
                  <animateMotion
                    dur="4.8s"
                    fill="freeze"
                    path="M 60 110 C 60 110, 380 90, 500 230 C 620 370, 840 450, 1140 450"
                  />
                  {/* Car body top-down */}
                  <rect x="-10" y="-16" width="20" height="32" rx="4" fill="#FFD700"/>
                  <rect x="-7" y="-14" width="14" height="10" rx="2" fill="#1a0040"/>
                  <rect x="-7" y="4" width="14" height="10" rx="2" fill="#1a0040"/>
                  {/* Wheels */}
                  <rect x="-13" y="-12" width="5" height="8" rx="1" fill="#333"/>
                  <rect x="8" y="-12" width="5" height="8" rx="1" fill="#333"/>
                  <rect x="-13" y="4" width="5" height="8" rx="1" fill="#333"/>
                  <rect x="8" y="4" width="5" height="8" rx="1" fill="#333"/>
                  {/* Headlights */}
                  <ellipse cx="0" cy="-28" rx="16" ry="24" fill="url(#headlight)" opacity="0.7"/>
                </g>
              )}
            </svg>

            {/* STEP CARDS — positioned along the road */}
            <div className="highway-steps">

              {[
                {
                  pos: 'top-left',
                  icon: '🎯',
                  title: 'Cutoff Seminar',
                  body: 'Understand real admission cutoffs and trends across India before you decide anything.',
                  color: 'gold'
                },
                {
                  pos: 'top-center-left',
                  icon: '🤝',
                  title: 'Expert Consultation',
                  body: 'Get your chances assessed by an ASMI counsellor and enrol for personalised support.',
                  color: 'gold'
                },
                {
                  pos: 'top-center-right',
                  icon: '🗂️',
                  title: 'One-on-One Guidance',
                  body: 'Your counsellor covers process, colleges, budget, documents and all your questions.',
                  color: 'gold'
                },
                {
                  pos: 'bottom-center-left',
                  icon: '📋',
                  title: 'Document Verification',
                  body: 'Every certificate checked, scanned and organised into a PDF — nothing left to chance.',
                  color: 'purple'
                },
                {
                  pos: 'bottom-center-right',
                  icon: '⭐',
                  title: 'Preference Finalisation',
                  body: 'Your final college list built on rank, budget, city and course — counsellor-verified.',
                  color: 'purple'
                },
                {
                  pos: 'bottom-right',
                  icon: '🎓',
                  title: 'Final Admission',
                  body: 'Full support through every round until your seat is confirmed and docs are submitted.',
                  color: 'navy'
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className={`highway-step-card pos-${step.pos} color-${step.color}${activeStep >= i ? ' card-active' : ''}`}
                >
                  <div className="hsc-icon">{step.icon}</div>
                  <div className="hsc-num">{i + 1}</div>
                  <div className="hsc-title">{step.title}</div>
                  <div className="hsc-body">{step.body}</div>
                </div>
              ))}

            </div>

          </div>

        </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION Pricing
      ════════════════════════════════ */}
      <section className="pricing-section" aria-labelledby="pricing-heading" id="packages">
        <div className="pricing-inner">

          <div className="pricing-header">
            <span className="pricing-eyebrow">PACKAGES</span>
            <h2 className="pricing-headline" id="pricing-heading">
              Everything You Need. Nothing You Don't.
            </h2>
            <p className="pricing-sub">
              Two focused packages. Real counsellors. No hidden charges.
            </p>
          </div>

          <div className="pricing-cards">

            {/* PACKAGE 1 */}
            <div className="pricing-card pricing-card-featured">
              <div className="pricing-recommended">★ RECOMMENDED</div>
              <div className="pricing-pkg-label">PACKAGE 1</div>
              <div className="pricing-pkg-title">
                Complete Medical Admission Counselling
              </div>
              <div className="pricing-pkg-subtitle">Merit Based</div>
              <div className="pricing-pkg-desc">
                For students admitted via general merit or category cutoffs.
                Covers MH State + MCC counselling.
              </div>

              <div className="pricing-price-block">
                <div className="pricing-price">₹10,000 – ₹30,000</div>
                <div className="pricing-price-note">
                  Pricing confirmed at your nearest branch · No payment to enquire
                </div>
                <div className="pricing-branches">
                  Mumbai / Thane &nbsp;·&nbsp; Pune &nbsp;·&nbsp;
                  Kolhapur / Sangli &nbsp;·&nbsp; Chh. Sambhajinagar
                </div>
              </div>

              <ul className="pricing-features">
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">Medical Admission Guidance</div>
                    <div className="pf-body">Comprehensive guidance from start to finish. Additional sessions before every round.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">One-to-One Counselling</div>
                    <div className="pf-body">Personal sessions covering college selection, budget, patient flow and city preference.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">College Preference List</div>
                    <div className="pf-body">Custom preference list prepared for every round — not just once.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">Round-wise Cutoff Data</div>
                    <div className="pf-body">Actual round-wise cutoffs shared in real time so you always know where you stand.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">WhatsApp Admission Alerts</div>
                    <div className="pf-body">All timelines, seat matrices and allotment results sent directly. Never miss a deadline.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">Admission Form Filling</div>
                    <div className="pf-body">MH State + MCC form filling included. Other states at ₹5,000/state extra.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">Document Verification</div>
                    <div className="pf-body">Every certificate checked and provided as scanned PDF.</div>
                  </div>
                </li>
              </ul>

              <a href="/inquiry" className="pricing-btn-primary">
                Book Free Counselling →
              </a>
            </div>

            {/* PACKAGE 2 */}
            <div className="pricing-card">
              <div className="pricing-pkg-label">PACKAGE 2</div>
              <div className="pricing-pkg-title">
                Complete Medical Admission Counselling
              </div>
              <div className="pricing-pkg-subtitle">NRI or Management Quota</div>
              <div className="pricing-pkg-desc">
                For students pursuing NRI quota or management quota seats
                in private and deemed colleges.
              </div>

              <div className="pricing-price-block">
                <div className="pricing-price">₹60,000</div>
                <div className="pricing-price-note">
                  Flat fee · No deadline · Same price anytime
                </div>
              </div>

              <ul className="pricing-features">
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">NRI / Management Quota Guidance</div>
                    <div className="pf-body">Specialised counselling for private and deemed college seats via NRI or management quota.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">One-to-One Counselling</div>
                    <div className="pf-body">Personal sessions covering all quota-specific options, budget and documentation.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">College Preference List</div>
                    <div className="pf-body">Custom list across private and deemed colleges matching your rank and budget.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">Round-wise Cutoff Data</div>
                    <div className="pf-body">Real-time cutoffs for management and NRI quota seats across all rounds.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">WhatsApp Admission Alerts</div>
                    <div className="pf-body">All timelines and updates sent directly. Never miss a management round deadline.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">Form Filling Assistance</div>
                    <div className="pf-body">Registration and preference form filling support for all applicable rounds.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check">✓</span>
                  <div>
                    <div className="pf-title">Document Verification</div>
                    <div className="pf-body">Every certificate checked and provided as scanned PDF.</div>
                  </div>
                </li>
              </ul>

              <a href="/inquiry" className="pricing-btn-secondary">
                Book Free Counselling →
              </a>
            </div>

            {/* SOFTWARE TEASER */}
            <div className="pricing-card pricing-card-teaser">
              <div className="pricing-coming-soon">COMING SOON</div>
              <div className="pricing-pkg-label">SOFTWARE</div>
              <div className="pricing-pkg-title">
                ASMI Digital Platform
              </div>
              <div className="pricing-pkg-subtitle">Self-Serve Access</div>
              <div className="pricing-pkg-desc">
                Access ASMI's college predictor, cutoff data, seat matrix
                and document tools — independently, at your own pace.
                No personalised counselling service included.
              </div>

              <div className="pricing-price-block">
                <div className="pricing-price pricing-price-tbd">Pricing TBD</div>
                <div className="pricing-price-note">
                  Launching after counselling season 2026
                </div>
              </div>

              <ul className="pricing-features pricing-features-muted">
                <li>
                  <span className="pf-check pf-check-muted">○</span>
                  <div>
                    <div className="pf-title">College Predictor Tool</div>
                    <div className="pf-body">Rank-based college matching across 820+ colleges.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check pf-check-muted">○</span>
                  <div>
                    <div className="pf-title">Cutoff Explorer</div>
                    <div className="pf-body">Category-wise closing ranks with multi-year comparison.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check pf-check-muted">○</span>
                  <div>
                    <div className="pf-title">Document Checklist</div>
                    <div className="pf-body">Interactive category-aware document tracker.</div>
                  </div>
                </li>
                <li>
                  <span className="pf-check pf-check-muted">○</span>
                  <div>
                    <div className="pf-title">Deadline Feed</div>
                    <div className="pf-body">Live counselling round dates and registration windows.</div>
                  </div>
                </li>
              </ul>

              <button className="pricing-btn-teaser" disabled>
                Notify Me When Live
              </button>
            </div>

          </div>

          {/* BOTTOM BANNER */}
          <div className="pricing-banner">
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
              <a href="/inquiry" className="banner-btn-white">
                Book My Free Session →
              </a>
              <a
                href="https://wa.me/917410019074"
                target="_blank"
                rel="noopener noreferrer"
                className="banner-btn-yellow"
              >
                WhatsApp Us 💬
              </a>
            </div>
          </div>

        </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION — DREAMS & RESULTS
      ════════════════════════════════ */}
      <section
        className="dreams-section"
        ref={testiRef}
        aria-labelledby="dreams-heading"
      >
        <div className="dreams-inner">

          {/* Section header */}
          <div className={`dreams-header${testiVisible ? ' dreams-header-visible' : ''}`}>
            <span className="dreams-eyebrow">RESULTS</span>
            <h2 className="dreams-headline" id="dreams-heading">
              Turning Dreams Into Admissions.
            </h2>
            <p className="dreams-sub">Real students. Real ranks. Real colleges.</p>
          </div>

          {/* HERO QUOTE — Bora AIR 1 */}
          <div className={`bora-card${testiVisible ? ' bora-visible' : ''}`}>
            <div className="bora-glow-ring" aria-hidden="true" />
            <div className="bora-avatar">VB</div>
            <div className="bora-content">
              <div className="bora-air-badge">
                <span className="bora-air-label">NEET 2023</span>
                <span className="bora-air-num">AIR 1</span>
                <span className="bora-score">
                  Score: <span className="bora-score-num">{boraCount}</span>/720
                </span>
              </div>
              <div className="bora-name">Varunchakravarti Bora</div>
              <blockquote className="bora-quote">
                "After scoring 720 in NEET, I mistakenly chose only the All India Quota.
                I contacted Anish Sir, and with his excellent guidance, we reset the quota
                and added AIIMS Delhi. I advise all NEET aspirants to undergo proper
                counselling with ASMI Career when applying for Medical Admission."
              </blockquote>
            </div>
          </div>

          {/* TOPPER STRIP — auto-scroll */}
          <div className="toppers-wrap">
            <div className={`toppers-track${testiVisible ? ' toppers-animate' : ''}`}>
              {[
                { air: 52,   name: 'Umayma Malbari', score: 715, college: 'KEM Mumbai',   initials: 'UM' },
                { air: 91,   name: 'Soham Gaykar',   score: 715, college: 'AIIMS Delhi',  initials: 'SG' },
                { air: 123,  name: 'Maulik Patel',   score: 715, college: 'KEM Mumbai',   initials: 'MP' },
                { air: 208,  name: 'Sammed Patil',   score: 715, college: 'MAMC Delhi',   initials: 'SP' },
                { air: 1053, name: 'Satyajit Jagtap',score: 700, college: 'AIIMS Raipur', initials: 'SJ' },
                { air: 1315, name: 'Kartik Satpute', score: 700, college: 'AIIMS Nagpur', initials: 'KS' },
                { air: 1622, name: 'Amit Honmore',   score: 700, college: 'AIIMS Bhopal', initials: 'AH' },
                // Duplicate for seamless loop
                { air: 52,   name: 'Umayma Malbari', score: 715, college: 'KEM Mumbai',   initials: 'UM' },
                { air: 91,   name: 'Soham Gaykar',   score: 715, college: 'AIIMS Delhi',  initials: 'SG' },
                { air: 123,  name: 'Maulik Patel',   score: 715, college: 'KEM Mumbai',   initials: 'MP' },
                { air: 208,  name: 'Sammed Patil',   score: 715, college: 'MAMC Delhi',   initials: 'SP' },
                { air: 1053, name: 'Satyajit Jagtap',score: 700, college: 'AIIMS Raipur', initials: 'SJ' },
                { air: 1315, name: 'Kartik Satpute', score: 700, college: 'AIIMS Nagpur', initials: 'KS' },
                { air: 1622, name: 'Amit Honmore',   score: 700, college: 'AIIMS Bhopal', initials: 'AH' },
              ].map((t, i) => (
                <div className="topper-card" key={i}>
                  <div className="topper-avatar">{t.initials}</div>
                  <div className="topper-air">AIR {t.air}</div>
                  <div className="topper-name">{t.name}</div>
                  <div className="topper-score">Score {t.score}</div>
                  <div className="topper-college">{t.college}</div>
                </div>
              ))}
            </div>
          </div>

          {/* THREE TESTIMONIALS */}
          <div className="testi-grid">
            {[
              {
                name: 'Renuka Bhandari',
                college: 'Armed Forces Medical College, Pune',
                initials: 'RB',
                quote: 'I owe my success in securing admission to AFMC, Pune, to the unwavering support of ASMI Career and Sharang Sir. Their tailored guidance during the interview and test preparation, along with connections to seniors, played a pivotal role.',
                delay: 0
              },
              {
                name: 'Aditi Sawant',
                college: 'AIIMS Delhi',
                initials: 'AS',
                quote: 'Navigating the AIIMS admission process as an OCI student was daunting. However, ASMI Career and Sharang Sir\'s expertise in eligibility requirements and document verification ensured I overcame every hurdle to earn my spot at AIIMS Delhi.',
                delay: 200
              },
              {
                name: 'Shivansh Siingh',
                college: 'Seth GS Medical College, Mumbai',
                initials: 'SS',
                quote: 'Achieving a NEET score of 691 was great, but figuring out the right college was another challenge. Thanks to Anish Sir\'s insightful advice and ASMI\'s meticulous handling of paperwork and updates, I secured Seth GS Medical College.',
                delay: 400
              }
            ].map((t, i) => (
              <div
                key={i}
                className={`testi-card-new${testiVisible ? ' testi-card-visible' : ''}`}
                style={{ transitionDelay: `${t.delay}ms` }}
              >
                <div className="testi-quote-icon" aria-hidden="true">❝</div>
                <div className="testi-stars" aria-label="5 stars">
                  {[0,1,2,3,4].map(s => (
                    <span
                      key={s}
                      className={`testi-star${testiVisible ? ' testi-star-fill' : ''}`}
                      style={{ transitionDelay: `${t.delay + s * 100}ms` }}
                      aria-hidden="true"
                    >★</span>
                  ))}
                </div>
                <p className="testi-body-new">{t.quote}</p>
                <div className="testi-student">
                  <div className="testi-avatar-new">{t.initials}</div>
                  <div>
                    <div className="testi-name-new">{t.name}</div>
                    <div className="testi-college-new">{t.college}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className={`dreams-cta${testiVisible ? ' dreams-cta-visible' : ''}`}>
            <a href="/inquiry" className="dreams-cta-btn">
              Join Them — Book Free Counselling →
            </a>
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
                      <h2 className="resources-headline" id="resources-heading">Free Resources</h2>
                      <p className="resources-sub">Tools, checklists and data — built for NEET 2026 students. No login required.</p>
                  </div>
                  <a href="#" className="resources-view-all">View all →</a>
              </div>
      
              <div className="resources-cards">
      
                  <div className="resource-card">
                      <div className="resource-img" style={{ background: 'linear-gradient(135deg,#1a0040 0%,#6a0dad 100%)' }}>
                          <span className="resource-img-emoji" aria-hidden="true">📋</span>
                          <span className="resource-tag" style={{ background: '#FFD700', color: '#1a0040' }}>DOWNLOAD</span>
                      </div>
                      <div className="resource-content">
                          <div className="resource-title">Documents Checklist — NEET 2026</div>
                          <p className="resource-body">Category-wise document list for MH State, AIQ, and Management quota. Know exactly what to carry before reporting.</p>
                          <div className="resource-footer">
                              <span className="resource-meta">Interactive Tool</span>
                              <a href="/tools/documents-checklist.html" className="resource-cta-btn">Open Checklist ↓</a>
                          </div>
                      </div>
                  </div>
      
                  <div className="resource-card">
                      <div className="resource-img" style={{ background: 'linear-gradient(135deg,#1a0040 0%,#2D0A5E 100%)' }}>
                          <span className="resource-img-emoji" aria-hidden="true">📈</span>
                          <span className="resource-tag" style={{ background: '#FFD700', color: '#1a0040' }}>DATA</span>
                      </div>
                      <div className="resource-content">
                          <div className="resource-title">MBBS Cutoff Explorer — 2025 Data</div>
                          <p className="resource-body">Search closing ranks by state, category, quota and college type. Updated with actual 2025–26 round data.</p>
                          <div className="resource-footer">
                              <span className="resource-meta">1,000+ colleges</span>
                              <a href="/tools/cutoff-explorer" className="resource-cta-link">Explore Now →</a>
                          </div>
                      </div>
                  </div>
      
                  <div className="resource-card">
                      <div className="resource-img" style={{ background: 'linear-gradient(135deg,#6a0dad 0%,#2D0A5E 100%)' }}>
                          <span className="resource-img-emoji" aria-hidden="true">🔮</span>
                          <span className="resource-tag" style={{ background: '#FFD700', color: '#1a0040' }}>FREE TOOL</span>
                      </div>
                      <div className="resource-content">
                          <div className="resource-title">College Predictor — Enter Your Rank</div>
                          <p className="resource-body">Enter your NEET AIR and instantly see Safe, Likely, and Borderline college options across India. No login required.</p>
                          <div className="resource-footer">
                              <span className="resource-meta">Rank-based · 2025 data</span>
                              <a href="/tools/college-predictor" className="resource-cta-link">Predict Now →</a>
                          </div>
                      </div>
                  </div>
      
              </div>
      
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION FAQs
      ════════════════════════════════ */}
      <section
        className="faq-section"
        ref={faqRef}
        aria-labelledby="faq-heading"
        id="faqs"
      >
        <div className="faq-inner">

          <div className={`faq-header${faqVisible ? ' faq-header-visible' : ''}`}>
            <span className="faq-eyebrow">FAQs</span>
            <h2 className="faq-headline" id="faq-heading">
              Frequently Asked
            </h2>
            <p className="faq-sub">
              The questions every student and parent asks us first.
            </p>
          </div>

          <div className="faq-list" role="list">
            {[
              {
                q: 'What is NEET counselling and how does ASMI help?',
                a: 'NEET counselling is the process of selecting and filling college preferences after your NEET result. ASMI assigns you a dedicated counsellor who builds your personalised preference list, tracks every deadline, and guides you through every round — MCC AIQ, MH State quota, and open states — until you are admitted.'
              },
              {
                q: 'How is ASMI different from free YouTube advice?',
                a: 'YouTube gives general information for a general student. ASMI gives you a personalised strategy built on your specific rank, category, state domicile, budget, and target colleges — with a real counsellor who is accountable to your outcome and available on WhatsApp throughout the process.'
              },
              {
                q: 'Does ASMI cover both Maharashtra State quota and All India quota?',
                a: 'Yes. ASMI covers MH State quota (85% seats), MCC All India quota (15% seats), Deemed university counselling, and open state counselling for Karnataka, Kerala, Telangana, Uttar Pradesh, Tamil Nadu and more — all under one package.'
              },
              {
                q: 'How much do your packages cost?',
                a: 'Package pricing varies by branch — starting from ₹10,000 in Kolhapur and Sangli, ₹20,000 in Pune, and ₹30,000 in Mumbai and Thane. NRI / Management quota counselling is ₹60,000 flat. All pricing is confirmed at your nearest branch — no payment required to enquire.'
              },
              {
                q: 'What if I don\'t get a seat after paying?',
                a: 'No counsellor can honestly guarantee a seat — your rank is the primary factor. What ASMI guarantees is a complete, counsellor-built strategy optimised for your rank, category, and preferences. The large majority of students who follow our preference list secure a seat in Round 1 or Round 2.'
              },
              {
                q: 'Can parents stay updated throughout the process?',
                a: 'Yes. Parents receive WhatsApp updates at every stage — round results, deadline reminders, document checklists, seat matrix releases, allotment results, and reporting date alerts. Nothing important happens without you knowing first.'
              },
              {
                q: 'What is the difference between MH State quota and All India quota?',
                a: '85% of seats in Maharashtra government colleges are reserved for Maharashtra domicile students under MH State quota, conducted by the State CET Cell. The remaining 15% are All India Quota (AIQ) seats filled by MCC (Medical Counselling Committee) and are open to students from any state. AIQ cutoffs are typically higher. ASMI helps you decide which quota to prioritise based on your rank and category.'
              },
              {
                q: 'Does ASMI help with open state colleges outside Maharashtra?',
                a: 'Yes. ASMI has detailed data and experience with open state counselling in Karnataka, Kerala, Telangana, Andhra Pradesh, Uttar Pradesh, Tamil Nadu, Haryana and more. If your Maharashtra options are limited at your rank, open state colleges can significantly expand your choices — and ASMI maps this out for you.'
              },
            ].map((faq, i) => (
              <div
                key={i}
                className={`faq-item${faqVisible ? ' faq-item-visible' : ''}${openFaq === i ? ' faq-item-open' : ''}`}
                style={{ transitionDelay: `${i * 60}ms` }}
                role="listitem"
              >
                <button
                  className="faq-question"
                  onClick={() => toggleFaq(i)}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                >
                  <span className="faq-q-text">{faq.q}</span>
                  <span className="faq-icon" aria-hidden="true">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                <div
                  className="faq-answer-wrap"
                  id={`faq-answer-${i}`}
                  role="region"
                  style={{
                    maxHeight: openFaq === i ? '400px' : '0px',
                    opacity: openFaq === i ? 1 : 0,
                  }}
                >
                  <p className="faq-answer">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`faq-cta${faqVisible ? ' faq-cta-visible' : ''}`}>
            <p className="faq-cta-text">Still have questions?</p>
            <a
              href="https://wa.me/917410019074"
              target="_blank"
              rel="noopener noreferrer"
              className="faq-cta-btn"
            >
              WhatsApp Us →
            </a>
          </div>

        </div>
      </section>
      
      
      <div style={{ display: 'none' }}>
      {/* ════════════════════════════════
           SECTION 3 — TRUST STRIP
      ════════════════════════════════ */}
      <section className="trust-strip" aria-label="Colleges our students have been admitted to">
          <div className="trust-track" aria-hidden="true">
              <span className="trust-item">AIIMS Delhi · Seth GS Medical Mumbai · Grant Medical College · KMC Manipal · DY Patil Pune · Kasturba Medical · JIPMER · BHU Medical · GMC Nagpur · AIIMS Nagpur · Maulana Azad · AFMC Pune ·</span>
              <span className="trust-item">AIIMS Delhi · Seth GS Medical Mumbai · Grant Medical College · KMC Manipal · DY Patil Pune · Kasturba Medical · JIPMER · BHU Medical · GMC Nagpur · AIIMS Nagpur · Maulana Azad · AFMC Pune ·</span>
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
                  <h2 className="prob-headline" id="prob-heading">Students Fail Counselling —<br />Before It Even Starts.</h2>
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
                          <span className="prob-text-left">Wrong preference order = lost seat forever</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Algorithm-optimised preference list submitted before deadline</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">02</span>
                          <span className="prob-text-left">Deadlines close in 24–72 hours. No mercy.</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">WhatsApp alerts for every round deadline instantly</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">03</span>
                          <span className="prob-text-left">Fake agents charging ₹5–10L for guaranteed seats</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Only verified portals. No middlemen. Fixed transparent pricing</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">04</span>
                          <span className="prob-text-left">Deposit cancellations can cost ₹1–5 Lakhs</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Full guidance on bonds, deposits & refund eligibility upfront</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">05</span>
                          <span className="prob-text-left">Missing open state college options</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Complete open state analysis — KA, KL, TS, UP, TN and more</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">06</span>
                          <span className="prob-text-left">Wrong documents at reporting</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Complete document checklist and verification support</span>
                      </div>
                  </div>
      
                  <div className="prob-row" role="row" data-animate>
                      <div className="prob-cell-left" role="cell">
                          <span className="prob-num" aria-hidden="true">07</span>
                          <span className="prob-text-left">Not understanding AIQ vs State Quota</span>
                      </div>
                      <div className="prob-cell-right" role="cell">
                          <svg className="prob-check" viewBox="0 0 18 18" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="8.5" stroke="#15803d" strokeWidth="1"/><path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="#15803d" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span className="prob-text-right">Clear quota strategy basis score, category and domicile</span>
                      </div>
                  </div>
      
              </div>
      
              <div className="prob-highlight" data-animate>
                  💡 Students with lower marks often get better colleges due to smarter counselling strategy.
              </div>
      
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION 5 — COUNSELLING PROCESS
      ════════════════════════════════ */}
      <section className="process" aria-labelledby="process-heading">
          <div className="process-inner">
      
              <span className="process-badge">Our Process</span>
              <h2 className="process-headline" id="process-heading">Your Path From NEET Score<br />To Medical Seat.</h2>
              <p className="process-sub">Simple. Transparent. Student-first.</p>
      
              <div className="process-rows" aria-label="Counselling process steps">
      
                  <div className="process-row" role="list">
                      <div className="process-step" role="listitem">
                          <div className="step-circle">1</div>
                          <span className="step-label">NEET Result</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">2</div>
                          <span className="step-label">Registration</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">3</div>
                          <span className="step-label">Document Verification</span>
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
                          <div className="step-circle">MU</div>
                          <span className="step-label">Mop-up Round</span>
                      </div>
                      <div className="step-arrow" aria-hidden="true"></div>
                      <div className="process-step" role="listitem">
                          <div className="step-circle">SV</div>
                          <span className="step-label">Stray Vacancy</span>
                      </div>
                  </div>
      
              </div>
      
              <div className="process-terms" aria-label="Important counselling terms">
                  <div className="term-card">
                      <div className="term-label">Free Exit</div>
                      <div className="term-def">Exit without losing the seat</div>
                  </div>
                  <div className="term-card">
                      <div className="term-label">Upgradation</div>
                      <div className="term-def">Option to upgrade to a better college</div>
                  </div>
                  <div className="term-card">
                      <div className="term-label">Bond</div>
                      <div className="term-def">Rural service agreement</div>
                  </div>
                  <div className="term-card">
                      <div className="term-label">Open Category</div>
                      <div className="term-def">Seats available for all eligible</div>
                  </div>
                  <div className="term-card">
                      <div className="term-label">AIQ</div>
                      <div className="term-def">All India Quota seats by MCC</div>
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
              <p className="why-sub">11 years. 25,000+ students. Zero false promises.</p>
      
              <div className="why-grid">
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">👁</span>
                      <div className="why-title">Transparent Guidance</div>
                      <div className="why-body">No false promises. No agent commissions. What we say is what we do.</div>
                  </div>
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">🔬</span>
                      <div className="why-title">Real College Research</div>
                      <div className="why-body">Updated cutoff data, bond rules, fee structures — verified every round.</div>
                  </div>
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">🎓</span>
                      <div className="why-title">Experienced Counsellors</div>
                      <div className="why-body">11+ years. Counsellors who have guided 25,000+ students personally.</div>
                  </div>
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">🗺</span>
                      <div className="why-title">All India Support</div>
                      <div className="why-body">MH, KA, KL, TS, UP, TN and 15+ states covered. No blind spots.</div>
                  </div>
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">❤️</span>
                      <div className="why-title">Student-First Approach</div>
                      <div className="why-body">Your score, category, budget — every recommendation personalised.</div>
                  </div>
      
                  <div className="why-card" data-why-animate>
                      <span className="why-icon" aria-hidden="true">📊</span>
                      <div className="why-title">Round-wise Tracking</div>
                      <div className="why-body">MCC Round 1, 2, Mop-up, Stray — we track every round for you.</div>
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
              <p className="tools-sub">Three free tools. One powerful paid platform. Use them together for the sharpest admission strategy.</p>
      
              <div className="tools-grid">
      
                  <div className="tool-card">
                      <span className="tool-tier-badge">FREE</span>
                      <span className="tool-icon" aria-hidden="true">🔍</span>
                      <div className="tool-title">Cutoff Explorer</div>
                      <p className="tool-body">Search 1,000+ colleges by state, category, score range and fee. Updated with 2025–26 actual data.</p>
                      <a href="/tools/cutoff-explorer" className="tool-cta">Explore Now →</a>
                  </div>
      
                  <div className="tool-card">
                      <span className="tool-tier-badge">FREE</span>
                      <span className="tool-icon" aria-hidden="true">🔮</span>
                      <div className="tool-title">College Predictor</div>
                      <p className="tool-body">Predict your MBBS admission chances using your NEET All India Rank. See Safe, Likely, and Borderline options instantly.</p>
                      <a href="/tools/college-predictor" className="tool-cta">Predict Now →</a>
                  </div>
      
                  <div className="tool-card">
                      <span className="tool-tier-badge">FREE</span>
                      <span className="tool-icon" aria-hidden="true">🏛</span>
                      <div className="tool-title">College Search</div>
                      <p className="tool-body">Filter colleges by state, stream, fees, NAAC grade and bond. Side-by-side comparison in seconds.</p>
                      <span className="tool-cta disabled" aria-disabled="true">Coming Soon</span>
                  </div>
      
                  <div className="tool-card">
                      <span className="tool-tier-badge paid">PAID</span>
                      <span className="tool-icon" aria-hidden="true">📊</span>
                      <div className="tool-title">Rank Predictor</div>
                      <p className="tool-body">Enter your score and category. Instantly see your predicted rank range and every eligible college across India.</p>
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
              <p className="packages-sub">Transparent pricing, no hidden charges. Fees vary by branch — starting from ₹10,000.</p>
      
              <div className="packages-grid">
      
                  <div className="pkg-card" data-pkg-animate>
                      <div>
                          <span className="pkg-stream-badge">NEET UG</span>
                      </div>
                      <div className="pkg-course">MBBS Counselling</div>
                      <div className="pkg-price">From ₹10,000</div>
                      <ul className="pkg-features" aria-label="Package features">
                          <li>Complete MCC counselling</li>
                          <li>State quota strategy</li>
                          <li>Open state analysis</li>
                          <li>Document verification</li>
                          <li>Round-wise WhatsApp alerts</li>
                      </ul>
                      <a href="/inquiry" className="pkg-cta">Learn More →</a>
                  </div>
      
                  <div className="pkg-card popular" data-pkg-animate>
                      <div>
                          <span className="pkg-stream-badge">NEET UG</span>
                          <span className="pkg-popular-label">POPULAR</span>
                      </div>
                      <div className="pkg-course">MBBS + BDS Counselling</div>
                      <div className="pkg-price">From ₹10,000</div>
                      <ul className="pkg-features" aria-label="Package features">
                          <li>All of above</li>
                          <li>BDS specific guidance</li>
                          <li>Deemed university counselling</li>
                          <li>All India rounds</li>
                          <li>Priority support</li>
                      </ul>
                      <a href="/inquiry" className="pkg-cta">Learn More →</a>
                  </div>
      
                  <div className="pkg-card" data-pkg-animate>
                      <div>
                          <span className="pkg-stream-badge">NEET UG</span>
                      </div>
                      <div className="pkg-course">AYUSH Counselling</div>
                      <div className="pkg-price">From ₹10,000</div>
                      <ul className="pkg-features" aria-label="Package features">
                          <li>BAMS/BHMS/BUMS</li>
                          <li>State AYUSH counselling</li>
                          <li>College preference strategy</li>
                          <li>Document support</li>
                          <li>Round tracking</li>
                      </ul>
                      <a href="/inquiry" className="pkg-cta">Learn More →</a>
                  </div>
      
                  <div className="pkg-card" data-pkg-animate>
                      <div>
                          <span className="pkg-stream-badge">MBBS ABROAD</span>
                      </div>
                      <div className="pkg-course">International Admissions</div>
                      <div className="pkg-price">Contact Us</div>
                      <ul className="pkg-features" aria-label="Package features">
                          <li>Country selection</li>
                          <li>University shortlisting</li>
                          <li>Visa guidance</li>
                          <li>Pre-departure support</li>
                          <li>Alumni network</li>
                      </ul>
                      <a href="/inquiry" className="pkg-cta">Learn More →</a>
                  </div>
      
              </div>
      
              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'rgba(26,0,64,0.55)', fontFamily: '\'Open Sans\',sans-serif' }}>
                  Mumbai & Thane — ₹30,000  ·  Pune — ₹20,000  ·  Kolhapur & Sangli — ₹10,000–12,000<br />
                  <span style={{ fontSize: '12px' }}>Pricing confirmed at your free counselling session. No payment required to enquire.</span>
              </p>
      
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
                      <p className="footer-tagline">Guiding Futures, Building Doctors</p>
                      <div className="footer-socials" aria-label="Social media links">
                          <a
                            href="https://www.facebook.com/asmicareer/"
                            className="footer-social"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="ASMI Career on Facebook"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                            </svg>
                          </a>
                          <a
                            href="https://www.instagram.com/asmi_career?igsh=MWFoYm93ZGxoY3E5dg%3D%3D"
                            className="footer-social"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="ASMI Career on Instagram"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                              <circle cx="12" cy="12" r="4"/>
                              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                            </svg>
                          </a>
                          <a
                            href="https://www.youtube.com/@ASMICareervideo"
                            className="footer-social"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="ASMI Career on YouTube"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
                              <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
                            </svg>
                          </a>
                          <a
                            href="https://wa.me/917410019074"
                            className="footer-social"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="ASMI Career on WhatsApp"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                            </svg>
                          </a>
                      </div>
                  </div>
      
                  <div>
                      <span className="footer-col-header">Get</span>
                      <a href="/counselling" className="footer-link">Counselling</a>
                      <a href="/services" className="footer-link">Services</a>
                      <a href="#packages" className="footer-link">Packages</a>
                      <a href="/tools/cutoff-explorer" className="footer-link">Cutoff Explorer</a>
                      <a href="/tools/college-predictor" className="footer-link">College Predictor</a>
                      <a href="/resources" className="footer-link">Resources</a>
                  </div>
      
                  <div>
                    <span className="footer-col-header">Explore</span>
                    <a href="/colleges" className="footer-link">Universities</a>
                    <a href="#events" className="footer-link">Updates &amp; Events</a>
                    <a href="#dreams-heading" className="footer-link">Success Stories</a>
                    <a href="#faqs" className="footer-link">FAQs</a>
                    <a
                      href="https://www.youtube.com/@ASMICareervideo"
                      className="footer-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >Webinars &amp; Video Guides</a>
                  </div>
      
                  <div>
                      <span className="footer-col-header">Company</span>
                      <a href="/about" className="footer-link">About Us</a>
                      <a href="/contact" className="footer-link">Contact Us</a>
                      <a href="/privacy-policy" className="footer-link">Privacy Policy</a>
                      <a href="/terms" className="footer-link">Terms of Service</a>
                  </div>
      
              </div>
      
              <div className="footer-bottom">
                  <span className="footer-bottom-text">© 2026 ASMI Youth Career Advisor LLP. All rights reserved.</span>
                  <span className="footer-bottom-text">asmicareer.com · asmicareer.in</span>
              </div>
      
          </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/917410019074"
        className="whatsapp-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <span className="whatsapp-tooltip">Chat with us</span>
        <div className="whatsapp-pulse"></div>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
