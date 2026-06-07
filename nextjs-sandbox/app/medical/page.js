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
          // Activate each step sequentially
          [0,1,2,3,4,5].forEach(i => {
            setTimeout(() => setActiveStep(i), 600 + i * 700);
          });
        }
      },
      { threshold: 0.3 }
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

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
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
                  <li><a href="/tools/college-predictor">Colleges</a></li>
                  <li><a href="/inquiry">Counselling</a></li>
                  <li><a href="#packages">Packages</a></li>
                  <li><a href="#tools">Services</a></li>
                  <li><a href="/tools/events">News & Events</a></li>
                  <li><a href="#about-us">About Us</a></li>
                  <li><a href="/inquiry">Contact Us</a></li>
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
          <a href="/tools/college-predictor">Colleges</a>
          <a href="/inquiry">Counselling</a>
          <a href="#packages">Packages</a>
          <a href="#tools">Services</a>
          <a href="/tools/events">News & Events</a>
          <a href="#about-us">About Us</a>
          <a href="/inquiry">Contact Us</a>
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
            <div className="journey-sprout" aria-hidden="true">🌱</div>
            <h2 className="journey-headline" id="journey-heading">
              The ASMI Admission Journey
            </h2>
            <p className="journey-sub">
              From your NEET score to your final admission letter — we walk every step with you.
            </p>
          </div>

          {/* DESKTOP WINDING PATH */}
          <div className="journey-road-wrap">

            {/* SVG Road */}
            <svg
              className={`journey-svg${journeyActive ? ' journey-svg-active' : ''}`}
              viewBox="0 0 1100 320"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* Dashed road path: top row L→R then curve down then bottom row R→L */}
              <path
                className="journey-road-path"
                d="M 100 100 L 450 100 L 550 100 Q 600 100 600 160 Q 600 220 550 220 L 100 220"
                fill="none"
                stroke="#FFD700"
                strokeWidth="3"
                strokeDasharray="12 8"
              />
              {/* Animated traveling dot */}
              {journeyActive && (
                <circle className="journey-traveler" r="8" fill="#FFD700">
                  <animateMotion
                    dur="4.2s"
                    fill="freeze"
                    path="M 100 100 L 450 100 L 550 100 Q 600 100 600 160 Q 600 220 550 220 L 100 220"
                  />
                </circle>
              )}
            </svg>

            {/* TOP ROW: Steps 1, 2, 3 */}
            <div className="journey-row journey-row-top">

              {/* STEP 1 — Seminar */}
              <div className={`journey-step${activeStep >= 0 ? ' step-active' : ''}`}>
                <div className="journey-illus">
                  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <rect x="15" y="10" width="50" height="34" rx="4" fill="none" stroke="#FFD700" strokeWidth="2.5"/>
                    <rect x="20" y="15" width="40" height="24" rx="2" fill="rgba(255,215,0,0.12)"/>
                    <line x1="40" y1="44" x2="40" y2="52" stroke="#FFD700" strokeWidth="2"/>
                    <rect x="28" y="52" width="24" height="4" rx="2" fill="#FFD700"/>
                    <circle cx="22" cy="65" r="5" fill="none" stroke="#c084fc" strokeWidth="2"/>
                    <circle cx="40" cy="68" r="5" fill="none" stroke="#c084fc" strokeWidth="2"/>
                    <circle cx="58" cy="65" r="5" fill="none" stroke="#c084fc" strokeWidth="2"/>
                    <line x1="22" y1="62" x2="25" y2="55" stroke="#c084fc" strokeWidth="1.5"/>
                    <line x1="40" y1="65" x2="40" y2="56" stroke="#c084fc" strokeWidth="1.5"/>
                    <line x1="58" y1="62" x2="55" y2="55" stroke="#c084fc" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div className="journey-node gold">1</div>
                <div className="journey-step-content">
                  <div className="journey-step-title">Cutoff Seminar</div>
                  <div className="journey-step-body">Understand real admission cutoffs and trends across India before you decide anything.</div>
                </div>
              </div>

              {/* STEP 2 — Consultation */}
              <div className={`journey-step${activeStep >= 1 ? ' step-active' : ''}`}>
                <div className="journey-illus">
                  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="28" width="64" height="40" rx="6" fill="none" stroke="#FFD700" strokeWidth="2.5"/>
                    <rect x="14" y="34" width="30" height="20" rx="3" fill="rgba(255,215,0,0.12)" stroke="#FFD700" strokeWidth="1.5"/>
                    <circle cx="24" cy="18" r="8" fill="none" stroke="#FFD700" strokeWidth="2"/>
                    <line x1="24" y1="26" x2="24" y2="28" stroke="#FFD700" strokeWidth="2"/>
                    <circle cx="56" cy="18" r="8" fill="none" stroke="#c084fc" strokeWidth="2"/>
                    <line x1="56" y1="26" x2="56" y2="28" stroke="#c084fc" strokeWidth="2"/>
                    <line x1="50" y1="44" x2="66" y2="44" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="50" y1="50" x2="62" y2="50" stroke="#c084fc" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="journey-node gold">2</div>
                <div className="journey-step-content">
                  <div className="journey-step-title">Expert Consultation</div>
                  <div className="journey-step-body">Get your chances assessed by an ASMI counsellor and enrol for personalised support.</div>
                </div>
              </div>

              {/* STEP 3 — One-on-One */}
              <div className={`journey-step${activeStep >= 2 ? ' step-active' : ''}`}>
                <div className="journey-illus">
                  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="18" r="10" fill="none" stroke="#FFD700" strokeWidth="2.5"/>
                    <path d="M 20 50 Q 20 36 40 36 Q 60 36 60 50" fill="none" stroke="#FFD700" strokeWidth="2.5"/>
                    <rect x="26" y="54" width="28" height="18" rx="3" fill="none" stroke="#c084fc" strokeWidth="2"/>
                    <line x1="30" y1="60" x2="50" y2="60" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="30" y1="65" x2="44" y2="65" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
                    <polyline points="46,62 49,65 54,59" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="journey-node gold">3</div>
                <div className="journey-step-content">
                  <div className="journey-step-title">One-on-One Guidance</div>
                  <div className="journey-step-body">Your counsellor covers process, colleges, budget, documents and all your questions.</div>
                </div>
              </div>

            </div>

            {/* BOTTOM ROW: Steps 6, 5, 4 (right to left visually = 4,5,6 journey order) */}
            <div className="journey-row journey-row-bottom">

              {/* STEP 4 — Documents */}
              <div className={`journey-step${activeStep >= 3 ? ' step-active' : ''}`}>
                <div className="journey-step-content bottom">
                  <div className="journey-step-title">Document Verification</div>
                  <div className="journey-step-body">Every certificate checked, scanned and organised into a PDF — nothing left to chance.</div>
                </div>
                <div className="journey-node purple">4</div>
                <div className="journey-illus">
                  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <rect x="18" y="8" width="44" height="56" rx="4" fill="none" stroke="#c084fc" strokeWidth="2.5"/>
                    <rect x="24" y="16" width="32" height="4" rx="2" fill="rgba(192,132,252,0.3)"/>
                    <rect x="24" y="26" width="32" height="4" rx="2" fill="rgba(192,132,252,0.3)"/>
                    <rect x="24" y="36" width="24" height="4" rx="2" fill="rgba(192,132,252,0.3)"/>
                    <circle cx="56" cy="56" r="14" fill="#1a0040" stroke="#4ade80" strokeWidth="2"/>
                    <polyline points="49,56 54,61 63,51" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* STEP 5 — Preferences */}
              <div className={`journey-step${activeStep >= 4 ? ' step-active' : ''}`}>
                <div className="journey-step-content bottom">
                  <div className="journey-step-title">Preference Finalisation</div>
                  <div className="journey-step-body">Your final college list built on rank, budget, city and course — counsellor-verified.</div>
                </div>
                <div className="journey-node purple">5</div>
                <div className="journey-illus">
                  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <rect x="14" y="8" width="52" height="64" rx="5" fill="none" stroke="#c084fc" strokeWidth="2.5"/>
                    <rect x="20" y="18" width="40" height="8" rx="3" fill="rgba(255,215,0,0.25)" stroke="#FFD700" strokeWidth="1.5"/>
                    <text x="24" y="25" fill="#FFD700" fontSize="8" fontFamily="sans-serif" fontWeight="bold">★ 1st</text>
                    <rect x="20" y="32" width="40" height="7" rx="3" fill="rgba(192,132,252,0.15)"/>
                    <rect x="20" y="44" width="40" height="7" rx="3" fill="rgba(192,132,252,0.15)"/>
                    <rect x="20" y="56" width="40" height="7" rx="3" fill="rgba(192,132,252,0.15)"/>
                    <line x1="24" y1="36" x2="52" y2="36" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="24" y1="48" x2="52" y2="48" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="24" y1="60" x2="44" y2="60" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>

              {/* STEP 6 — Final Admission */}
              <div className={`journey-step${activeStep >= 5 ? ' step-active' : ''}`}>
                <div className="journey-step-content bottom">
                  <div className="journey-step-title">Final Admission</div>
                  <div className="journey-step-body">Full support through every round until your seat is confirmed and docs are submitted.</div>
                </div>
                <div className="journey-node navy">6</div>
                <div className="journey-illus">
                  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="20" r="11" fill="none" stroke="#FFD700" strokeWidth="2.5"/>
                    <path d="M 22 48 Q 22 34 40 34 Q 58 34 58 48" fill="none" stroke="#FFD700" strokeWidth="2.5"/>
                    <rect x="22" y="52" width="36" height="22" rx="4" fill="none" stroke="#FFD700" strokeWidth="2"/>
                    <line x1="28" y1="60" x2="52" y2="60" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="28" y1="66" x2="44" y2="66" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/>
                    {/* Star burst */}
                    <circle cx="62" cy="14" r="10" fill="rgba(255,215,0,0.15)" stroke="#FFD700" strokeWidth="1.5"/>
                    <text x="58" y="18" fill="#FFD700" fontSize="12">★</text>
                  </svg>
                </div>
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
                  <h2 className="pricing-headline" id="pricing-heading">Every Admission Path, Covered.</h2>
                  <p className="pricing-sub1">From NEET to JEE to MBBS Abroad — expert support for every stream and every round.</p>
                  <p className="pricing-sub2"><span className="ps2-purple">Big</span> On Data. <span className="ps2-muted">Light</span> On Your Pocket. Access all the data you need, without overpaying for it.</p>
              </div>
      
              <div className="pricing-cards">
      
                  <div className="pricing-card">
                      <div className="pricing-exam">NEET UG</div>
                      <div className="pricing-course">NEET UG</div>
                      <div className="pricing-type">UG Counselling</div>
                      <div className="pricing-price">₹2,499</div>
                      <button className="pricing-btn-default">Learn More</button>
                  </div>
      
                  <div className="pricing-card featured">
                      <span className="pricing-popular">★ POPULAR</span>
                      <div className="pricing-exam">NEET PG</div>
                      <div className="pricing-course">NEET PG</div>
                      <div className="pricing-type">PG Counselling</div>
                      <div className="pricing-price">₹3,999</div>
                      <button className="pricing-btn-featured">Learn More</button>
                  </div>
      
                  <div className="pricing-card">
                      <div className="pricing-exam">JEE</div>
                      <div className="pricing-course">JEE</div>
                      <div className="pricing-type">B.Tech Counselling</div>
                      <div className="pricing-price">₹3,999</div>
                      <button className="pricing-btn-default">Learn More</button>
                  </div>
      
                  <div className="pricing-card">
                      <div className="pricing-exam">MBBS ABROAD</div>
                      <div className="pricing-course">MBBS Abroad</div>
                      <div className="pricing-type">Admission Guidance</div>
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
                  <h2 className="testi-headline" id="testi-heading">Real Students. Real Seats.</h2>
                  <p className="testi-sub">Names, colleges — no vague praise.</p>
                  <div className="testi-leaf" aria-hidden="true">🍃</div>
              </div>
      
              <div className="testi-avatars" aria-label="Student testimonials">
                  <div className="testi-avatar active" style={{ background: '#e8d5f5' }} aria-label="Aahan Chawla"></div>
                  <div className="testi-avatar" style={{ background: '#d4c5f0' }} aria-label="Hiral Mahajan"></div>
                  <div className="testi-avatar" style={{ background: '#c8b4e8' }} aria-label="Prathamesh Kulkarni"></div>
                  <div className="testi-avatar" style={{ background: '#e8d5f5' }} aria-label="Shrihaan Ghare"></div>
                  <div className="testi-avatar" style={{ background: '#d4c5f0' }} aria-label="Isha Tilak"></div>
                  <div className="testi-avatar" style={{ background: '#c8b4e8' }} aria-label="Kabir Singh"></div>
                  <div className="testi-avatar" style={{ background: '#e8d5f5' }} aria-label="Dhruv Mundra"></div>
                  <div className="testi-avatar" style={{ background: '#d4c5f0' }} aria-label="Vanshika Shah"></div>
                  <div className="testi-avatar" style={{ background: '#c8b4e8' }} aria-label="Arva Inamdar"></div>
              </div>
      
              <div className="testi-cards">
      
                  <div className="testi-card">
                      <div className="testi-stars" aria-label="5 stars">★★★★★</div>
                      <div className="testi-student-row">
                          <div className="testi-avatar-sm" aria-hidden="true"></div>
                          <div>
                              <div className="testi-name">Aahan Chawla</div>
                              <div className="testi-tag">AIR 96 · Score 646</div>
                              <div className="testi-tag" style={{ color: '#6a0dad', fontWeight: '700' }}>KEM Mumbai</div>
                          </div>
                      </div>
                      <div className="testi-quote-mark" aria-hidden="true">❝</div>
                      <p className="testi-body">"ASMI Career made my entire admission journey fully structured. With Anish Sir's clear guidance and constant support, every step felt easy to handle."</p>
                  </div>
      
                  <div className="testi-card">
                      <div className="testi-stars" aria-label="5 stars">★★★★★</div>
                      <div className="testi-student-row">
                          <div className="testi-avatar-sm" aria-hidden="true"></div>
                          <div>
                              <div className="testi-name">Shrihaan Ghare</div>
                              <div className="testi-tag">OCI Candidate</div>
                              <div className="testi-tag" style={{ color: '#6a0dad', fontWeight: '700' }}>AIIMS Delhi</div>
                          </div>
                      </div>
                      <div className="testi-quote-mark" aria-hidden="true">❝</div>
                      <p className="testi-body">"The OCI admission process felt confusing at first, but ASMI Career broke everything down step by step. Rohan Sir's clarity on choices, documents, and timelines kept me focused."</p>
                  </div>
      
                  <div className="testi-card">
                      <div className="testi-stars" aria-label="5 stars">★★★★★</div>
                      <div className="testi-student-row">
                          <div className="testi-avatar-sm" aria-hidden="true"></div>
                          <div>
                              <div className="testi-name">Kabir Singh</div>
                              <div className="testi-tag">Karnataka Process</div>
                              <div className="testi-tag" style={{ color: '#6a0dad', fontWeight: '700' }}>MS Ramaiah, Bangalore</div>
                          </div>
                      </div>
                      <div className="testi-quote-mark" aria-hidden="true">❝</div>
                      <p className="testi-body">"I wanted the best possible college, and ASMI Career guided me through every option with honesty. Anish Sir explained each step of the Karnataka process clearly."</p>
                  </div>
      
              </div>
      
              <div className="testi-nav">
                  <button className="testi-arrow" aria-label="Previous testimonials">‹</button>
                  <button className="testi-arrow" aria-label="Next testimonials">›</button>
              </div>
      
          </div>
      </section>
      
      
      {/* ════════════════════════════════
           SECTION — STUDENT OUTCOMES
      ════════════════════════════════ */}
      <section style={{ background: '#1a0040', padding: '56px 80px' }} aria-labelledby="outcomes-heading">
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <span style={{ fontFamily: '\'Montserrat\',sans-serif', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: '#FFD700' }}>Results</span>
                  <h2 id="outcomes-heading" style={{ fontFamily: '\'Montserrat\',sans-serif', fontSize: 'clamp(24px,4vw,36px)', fontWeight: '900', color: '#ffffff', marginTop: '8px' }}>Turning Dreams Into Admissions.</h2>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>Real students. Real ranks. Real colleges.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '16px' }}>
      
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: '\'Montserrat\',sans-serif', fontSize: '13px', fontWeight: '900', color: '#FFD700', marginBottom: '4px' }}>AIR 96</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>Aahan Chawla</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>KEM Mumbai</div>
                  </div>
      
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: '\'Montserrat\',sans-serif', fontSize: '13px', fontWeight: '900', color: '#FFD700', marginBottom: '4px' }}>AIR 119</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>Hiral Mahajan</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>KEM Mumbai</div>
                  </div>
      
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: '\'Montserrat\',sans-serif', fontSize: '13px', fontWeight: '900', color: '#FFD700', marginBottom: '4px' }}>AIR 176</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>Prathamesh Kulkarni</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>JIPMER Puducherry</div>
                  </div>
      
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: '\'Montserrat\',sans-serif', fontSize: '13px', fontWeight: '900', color: '#FFD700', marginBottom: '4px' }}>AIR 595</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>Harshit Mukpalkar</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>KEM Mumbai</div>
                  </div>
      
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: '\'Montserrat\',sans-serif', fontSize: '13px', fontWeight: '900', color: '#FFD700', marginBottom: '4px' }}>AIR 676</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>Adarsh Singh</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>AIIMS Nagpur</div>
                  </div>
      
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: '\'Montserrat\',sans-serif', fontSize: '13px', fontWeight: '900', color: '#FFD700', marginBottom: '4px' }}>AIR 903</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>Atharva Swami</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>AIIMS Jodhpur</div>
                  </div>
      
                  <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' }}>
                      <div style={{ fontFamily: '\'Montserrat\',sans-serif', fontSize: '13px', fontWeight: '900', color: '#FFD700', marginBottom: '4px' }}>AIR 988</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>Sparsh Lalwani</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>BJMC Pune</div>
                  </div>
      
              </div>
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <a href="/inquiry" style={{ display: 'inline-block', background: '#FFD700', color: '#1a0040', fontFamily: '\'Montserrat\',sans-serif', fontWeight: '800', fontSize: '14px', padding: '14px 28px', borderRadius: '8px', textDecoration: 'none' }}>Join Them — Book Free Counselling →</a>
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
      <section className="faq-section" aria-labelledby="faq-heading">
          <div className="faq-inner">
      
              <div className="faq-header">
                  <span className="faq-eyebrow">FAQs</span>
                  <h2 className="faq-headline" id="faq-heading">Frequently Asked</h2>
                  <p className="faq-sub">The questions every student and parent asks us first.</p>
              </div>
      
              <div className="faq-accordion">
      
                  <div className={`faq-item ${openFaq === 0 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(0)}>
                          What is NEET counselling and how does ASMI help?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 0 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 0 ? 'block' : 'none' }}>
                          NEET counselling is the process of selecting and filling college preferences after your NEET result. ASMI assigns you a dedicated counsellor who builds your preference list, tracks deadlines, and guides you through every round — MCC AIQ, state quota, and deemed.
                      </div>
                  </div>
      
                  <div className={`faq-item ${openFaq === 1 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(1)}>
                          How is ASMI different from free YouTube advice?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 1 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 1 ? 'block' : 'none' }}>
                          YouTube gives general information. ASMI gives you a personalised strategy based on your specific rank, category, state, and target colleges — with a real counsellor accountable to your outcome.
                      </div>
                  </div>
      
                  <div className={`faq-item ${openFaq === 2 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(2)}>
                          Does ASMI cover both NEET UG and JEE?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 2 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 2 ? 'block' : 'none' }}>
                          Yes. ASMI has dedicated teams for NEET UG, NEET PG, JEE Main, JEE Advanced, MHT-CET, and MBBS Abroad counselling.
                      </div>
                  </div>
      
                  <div className={`faq-item ${openFaq === 3 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(3)}>
                          How much do your packages cost?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 3 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 3 ? 'block' : 'none' }}>
                          Packages start at ₹2,499 for basic counselling and go up to ₹3,999 for full-service end-to-end support. All pricing is fixed — no hidden charges.
                      </div>
                  </div>
      
                  <div className={`faq-item ${openFaq === 4 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(4)}>
                          What if I don't get a seat after paying?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 4 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 4 ? 'block' : 'none' }}>
                          We don't guarantee seats — no honest counsellor can. But we guarantee a complete, optimised strategy built around your rank. Most students who follow our preference list secure a seat in round 1 or 2.
                      </div>
                  </div>
      
                  <div className={`faq-item ${openFaq === 5 ? 'open' : ''}`}>
                      <div className="faq-question" onClick={() => toggleFaq(5)}>
                          Can parents stay updated throughout?
                          <span className="faq-icon" aria-hidden="true">{openFaq === 5 ? '−' : '+'}</span>
                      </div>
                      <div className="faq-answer" style={{ display: openFaq === 5 ? 'block' : 'none' }}>
                          Yes. Parents receive WhatsApp updates at every stage — round results, deadline reminders, document checklists, and reporting date alerts.
                      </div>
                  </div>
      
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
                      <a href="/tools/college-predictor" className="footer-link">College Predictor</a>
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
