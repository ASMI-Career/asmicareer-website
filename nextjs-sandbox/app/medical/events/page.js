'use client';
import { useState, useEffect, useRef } from 'react';
import './events.css';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/IukRVFifsfS2yiFiA80HOu';
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@ASMICareervideo';

/* ─── ABOUT ITEMS ──────────────────────────────────────────── */
const ABOUT_ITEMS = [
  { icon: '🏥', title: 'College Cutoff Analysis', body: 'Real NEET cutoffs for government, private, and deemed colleges across Maharashtra — explained simply.' },
  { icon: '📋', title: 'Counselling Roadmap', body: 'Step-by-step guide to MCC AIQ, MH State CAP rounds, and how to apply strategically for your rank.' },
  { icon: '💡', title: 'Live Q&A Session', body: 'Ask our experts directly — your rank, category, home state, and best college options answered live.' },
  { icon: '📊', title: 'Fee Structure Clarity', body: 'Transparent breakdown of government, management, and NRI quota fees so you can plan your budget.' },
  { icon: '🎯', title: 'Category Strategies', body: 'OBC, SC/ST, EWS, NRI — understand how your category changes your college options and quota strategy.' },
  { icon: '🤝', title: '1:1 Follow-up Access', body: 'Book a free personal counselling session with an ASMI expert after the seminar — no extra charge.' },
];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const SEMINAR_PHOTOS = [
  '/images_events/seminar-01.jpg',
  '/images_events/seminar-02.jpg',
  '/images_events/seminar-03.jpg',
  '/images_events/seminar-04.jpeg',
  '/images_events/seminar-05.jpeg',
  '/images_events/seminar-06.jpeg',
  '/images_events/seminar-07.jpeg',
  '/images_events/seminar-08.jpeg',
  '/images_events/seminar-09.jpeg',
  '/images_events/seminar-10.jpeg',
  '/images_events/seminar-11.jpeg',
  '/images_events/seminar-12.jpeg',
  '/images_events/seminar-13.jpeg',
  '/images_events/seminar-14.jpeg',
  '/images_events/seminar-15.jpeg',
];

function SeminarCarousel() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    if (animating) return;
    setPrev(current);
    setCurrent(idx);
    setAnimating(true);
    setTimeout(() => { setPrev(null); setAnimating(false); }, 700);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent(c => {
        const next = (c + 1) % SEMINAR_PHOTOS.length;
        setPrev(c);
        setAnimating(true);
        setTimeout(() => { setPrev(null); setAnimating(false); }, 700);
        return next;
      });
    }, 3500);
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div style={{position:'relative',width:'100%',borderRadius:'18px',overflow:'hidden',
      boxShadow:'0 12px 48px rgba(26,0,64,0.22)',aspectRatio:'4/3',background:'#1a0040'}}>
      <style>{`
        @keyframes sc-fadein {
          from { opacity:0; transform:scale(1.06); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes sc-fadeout {
          from { opacity:1; transform:scale(1); }
          to   { opacity:0; transform:scale(0.96); }
        }
        .sc-slide-in  { animation: sc-fadein  0.7s ease both; }
        .sc-slide-out { animation: sc-fadeout 0.7s ease both; }
      `}</style>

      {/* outgoing */}
      {prev !== null && (
        <img key={'out'+prev} src={SEMINAR_PHOTOS[prev]} alt=""
          className="sc-slide-out"
          style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
      )}
      {/* incoming */}
      <img key={'in'+current} src={SEMINAR_PHOTOS[current]} alt={`ASMI Seminar ${current+1}`}
        className="sc-slide-in"
        style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />

      {/* gradient overlay */}
      <div style={{position:'absolute',inset:0,
        background:'linear-gradient(to top, rgba(26,0,64,0.55) 0%, transparent 60%)',
        pointerEvents:'none'}} />

      {/* dot indicators */}
      <div style={{position:'absolute',bottom:'14px',left:0,right:0,
        display:'flex',justifyContent:'center',gap:'6px',flexWrap:'wrap',padding:'0 12px'}}>
        {SEMINAR_PHOTOS.map((_,i) => (
          <button key={i} onClick={() => goTo(i)}
            style={{width: i===current?'22px':'8px', height:'8px',borderRadius:'4px',
              border:'none',cursor:'pointer',padding:0,transition:'width 0.3s ease',
              background: i===current ? '#FFD700' : 'rgba(255,255,255,0.45)'}}
            aria-label={`Go to slide ${i+1}`} />
        ))}
      </div>

    </div>
  );
}

export default function EventsPage() {
  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <>
      <div className="ev-page">
        <Nav />

        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="ev-hero">
          <div className="ev-hero-inner">
            <span className="ev-hero-eyebrow">FREE · LIVE · EXPERT-LED · MAHARASHTRA</span>
            <h1 className="ev-hero-h1">
              ASMI Career<br />
              <span className="ev-h1-gold">Free Counselling</span><br />
              Seminars 2026
            </h1>
            <p className="ev-hero-sub">
              Attend a live session with our NEET counselling experts. Understand
              cutoffs, college options, and your strategy — before the rush begins.
              Seats are limited and entry is completely free.
            </p>
            <div className="ev-hero-btns">
              <a
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank" rel="noopener noreferrer"
                className="ev-btn-primary"
              >
                Join Our WhatsApp Community →
              </a>
              <a
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank" rel="noopener noreferrer"
                className="ev-btn-wa"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12.05 2C6.495 2 2 6.495 2 12.05c0 1.87.49 3.628 1.347 5.154L2 22l4.955-1.323A10.01 10.01 0 0 0 12.05 22C17.605 22 22 17.505 22 11.95 22 6.495 17.605 2 12.05 2zm0 18.214c-1.703 0-3.282-.455-4.637-1.248l-.333-.197-3.44.919.925-3.378-.217-.349a8.168 8.168 0 0 1-1.252-4.362c0-4.522 3.68-8.202 8.2-8.202 4.522 0 8.202 3.68 8.202 8.202 0 4.521-3.68 8.2-8.202 8.2h.003z"/>
                </svg>
                Get Updates on WhatsApp
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="ev-stats-bar">
            {[
              { num: '1,000+',  lbl: 'Seminars Conducted' },
              { num: '25,000+', lbl: 'Students Guided' },
              { num: '100%',    lbl: 'FREE Entry' },
              { num: '6',       lbl: 'Cities in Maharashtra' },
            ].map((s, i) => (
              <div className="ev-stat-item" key={i}>
                <span className="ev-stat-num">{s.num}</span>
                <span className="ev-stat-lbl">{s.lbl}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── NEW SECTION 2 — "Why Attend" Section ── */}
        <section className="ev-why-section">
          <div className="ev-why-inner">
            <div className="ev-why-grid">
              <div className="ev-why-left">
                <SeminarCarousel />
              </div>
              <div className="ev-why-right">
                <span className="ev-section-eyebrow">WHY ATTEND?</span>
                <h2 className="ev-section-title-dark">Give 2 Hours To Get The Right College</h2>
                <p className="ev-section-sub-dark">
                  The exam is over — but the next 60 days will decide where you spend the next 5 years.
                  Most students leave this to chance. The smart ones prepare now.
                </p>
                <div className="ev-why-list">
                  {[
                    {
                      t: 'Know Exactly Where You Stand',
                      d: 'Your expected score matched to real colleges, real cutoffs, real chances.'
                    },
                    {
                      t: 'Understand The System Before It Confuses You',
                      d: 'Counselling rounds, quota types, deadlines — simplified in one session.'
                    },
                    {
                      t: 'More Options Than You Walked In With',
                      d: 'These options exist at every rank — the difference is knowing where to look.'
                    },
                    {
                      t: 'Spend Smart, Not Just Big',
                      d: 'Which colleges give you the career, not just the degree.'
                    },
                    {
                      t: 'Your Question Is The Last Agenda Item',
                      d: "We don't close until every doubt in the room is answered."
                    }
                  ].map((item, idx) => (
                    <div className="ev-why-item" key={idx}>
                      <span className="ev-why-checkmark">✓</span>
                      <div className="ev-why-item-content">
                        <h4 className="ev-why-item-title">{item.t}</h4>
                        <p className="ev-why-item-desc">{item.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── NEW SECTION 3 — "Mistakes You Will Avoid" Section ── */}
        <section className="ev-mistakes-section">
          <div className="ev-mistakes-inner">
            <div className="ev-sec-head-center">
              <span className="ev-section-eyebrow">AVOID CRITICAL ERRORS</span>
              <h2 className="ev-section-title-dark-center">Mistakes Students Make — That You Won't</h2>
              <p className="ev-section-sub-dark-center">One simple mistake during counselling can cost you your dream seat or college. Learn to avoid them.</p>
            </div>
            <div className="ev-mistakes-grid">
              {[
                "Picking the wrong college at the right rank",
                "Paying lakhs extra in fees unnecessarily",
                "Missing better options you didn't know existed",
                "Poor counselling decisions made under pressure"
              ].map((mistake, idx) => (
                <div className="ev-mistake-card" key={idx}>
                  <span className="ev-mistake-icon">❌</span>
                  <p className="ev-mistake-text">{mistake}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── THANK YOU / WHATSAPP SECTION (replaces seminar registration) ── */}
        <section className="ev-seminars-section" id="seminar-grid">
          <div className="ev-seminars-inner">
            <div className="ev-sec-head">
              <h2 className="ev-sec-title">
                Thank You <span className="ev-sec-title-accent">— See You Online</span>
              </h2>
              <p className="ev-sec-sub">
                Thank you to everyone who attended our seminars this year! Any further
                sessions will be conducted online — please join our WhatsApp Community
                to stay updated.
              </p>
            </div>
            <div style={{display:'flex',justifyContent:'center',gap:'16px',flexWrap:'wrap'}}>
              <a
                href={WHATSAPP_COMMUNITY_URL}
                target="_blank" rel="noopener noreferrer"
                className="ev-wa-cta"
              >
                💬 Join WhatsApp Community
              </a>
              <a
                href={YOUTUBE_CHANNEL_URL}
                target="_blank" rel="noopener noreferrer"
                className="ev-btn-primary"
              >
                ▶ Subscribe on YouTube
              </a>
            </div>
          </div>
        </section>

        {/* ── WHAT HAPPENS ─────────────────────────────────── */}
        <section className="ev-about-section">
          <div className="ev-about-inner">
            <div className="ev-sec-head">
              <h2 className="ev-sec-title">What happens at an <span style={{color:'#FFD700'}}>ASMI Seminar?</span></h2>
              <p className="ev-sec-sub">Expert guidance, zero sales pitch — just clarity.</p>
            </div>
            <div className="ev-about-grid">
              {ABOUT_ITEMS.map((item, i) => (
                <div className="ev-about-card" key={i}>
                  <span className="ev-about-icon">{item.icon}</span>
                  <h3 className="ev-about-card-title">{item.title}</h3>
                  <p className="ev-about-card-body">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── NEW SECTION 4 — Counsellor / Speaker Section ── */}
        <section className="ev-counsellors-section">
          <div className="ev-counsellors-inner">
            <div className="ev-sec-head-center">
              <span className="ev-section-eyebrow">OUR EXPERTS</span>
              <h2 className="ev-section-title-dark-center">Meet The Counsellors Guiding This Session</h2>
              <p className="ev-section-sub-dark-center">Real experts. 12+ years of combined experience. No sales pitch — just clarity.</p>
            </div>
            <div className="ev-counsellors-grid" style={{justifyContent:'center',display:'flex',gap:'32px',flexWrap:'wrap'}}>
              {[
                { name: 'Anish Kulkarni', role: 'Founder & Director', seminars: 'Pune Seminar', img: '/images_events/Anish.jpg' },
                { name: 'Sharang Katti',  role: 'Director',           seminars: 'Thane Seminar',             img: '/images_events/Sharang.jpg' },
              ].map((c, idx) => (
                <div className="ev-counsellor-card" key={idx}>
                  <div className="ev-counsellor-avatar-wrapper">
                    <img
                      src={c.img}
                      alt={c.name}
                      className="ev-counsellor-avatar"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.classList.add('avatar-fallback');
                      }}
                    />
                    <div className="ev-avatar-fallback-icon">👤</div>
                  </div>
                  <h4 className="ev-counsellor-name">{c.name}</h4>
                  <p className="ev-counsellor-title">{c.role}</p>
                  <p className="ev-counsellor-title" style={{fontSize:'12px',marginTop:'4px',color:'#6a0dad'}}>{c.seminars}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── NEW SECTION 5 — "Why Students Trust ASMI Career" Stats Strip ── */}
        <section className="ev-trust-stats-section">
          <div className="ev-trust-stats-inner">
            <h3 className="ev-trust-heading">Why Students Trust ASMI Career</h3>
            <div className="ev-trust-grid">
              {[
                { num: '25K+', lbl: 'Admissions Done' },
                { num: '12+',  lbl: 'Years Of Expertise' },
                { num: '4.9 ★', lbl: 'Google Rating' },
                { num: '200+', lbl: 'Seminars Conducted' }
              ].map((s, idx) => (
                <div className="ev-trust-item" key={idx}>
                  <div className="ev-trust-circle">
                    <span className="ev-trust-num">{s.num}</span>
                  </div>
                  <span className="ev-trust-lbl">{s.lbl}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VIDEO SECTION */}
        <section style={{background:'#1a0040',padding:'80px 40px'}}>
          <div style={{maxWidth:'1100px',margin:'0 auto',textAlign:'center'}}>
            <div style={{display:'inline-block',background:'rgba(255,215,0,0.12)',
              color:'#FFD700',border:'1px solid rgba(255,215,0,0.25)',
              borderRadius:'20px',padding:'5px 16px',fontSize:'11px',
              fontWeight:'700',letterSpacing:'2px',marginBottom:'16px'}}>
              SEMINAR GLIMPSES
            </div>
            <h2 style={{color:'#FFD700',fontFamily:'Montserrat,sans-serif',
              fontWeight:'900',fontSize:'clamp(28px,4vw,44px)',marginBottom:'8px'}}>
              See What Happens In The Room
            </h2>
            <p style={{color:'rgba(255,215,0,0.6)',fontSize:'16px',marginBottom:'48px'}}>
              Real students. Real questions. Real answers.
            </p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',
              gap:'24px',justifyItems:'center'}}>
              {['hW_Z9vTIPVo','A6EcZ35_ZsE','5To544g3ztY'].map((id,i)=>(
                <div key={i} style={{width:'100%',maxWidth:'300px',
                  borderRadius:'16px',overflow:'hidden',
                  boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
                  border:'1px solid rgba(255,215,0,0.15)'}}>
                  <div style={{position:'relative',paddingBottom:'177.78%',height:0}}>
                    <iframe
                      src={`https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`}
                      title={`ASMI Seminar Glimpse ${i+1}`}
                      style={{position:'absolute',top:0,left:0,
                        width:'100%',height:'100%',border:'none'}}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── NEW SECTION 7 — Closing CTA Banner ── */}
        <section className="ev-closing-cta-section">
          <div className="ev-closing-cta-bg-overlay" />
          <div className="ev-closing-cta-inner">
            <h2 className="ev-closing-title">Ready To Take The Next Step In Your Medical Career?</h2>
            <p className="ev-closing-sub">
              Be a part of ASMI's Free Counselling Seminars — and build your medical future with the right guidance.
            </p>
            <a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="ev-closing-btn">
              Join Our WhatsApp Community →
            </a>
          </div>
        </section>

        {/* ── WHATSAPP BANNER ──────────────────────────────── */}
        <section className="ev-wa-section">
          <div className="ev-wa-inner">
            <div>
              <h3 className="ev-wa-title">Can't attend in person?</h3>
              <p className="ev-wa-sub">Get personalised guidance on WhatsApp. Our counsellors respond within hours.</p>
            </div>
            <a
              href="https://wa.me/917410019074?text=Hi,%20I%20need%20assistance"
              target="_blank" rel="noopener noreferrer"
              className="ev-wa-cta"
            >
              💬 Chat on WhatsApp
            </a>
          </div>
        </section>

        <Footer />
      </div>

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="ev-sticky-bar">
        <div className="ev-sticky-inner">
          <div className="ev-sticky-left">
            <span className="ev-sticky-icon">🗓️</span>
            <span className="ev-sticky-date">Thank you for a great season!</span>
          </div>
          <div className="ev-sticky-center">
            <span className="ev-sticky-badge">ONLINE NOW</span>
            <span className="ev-sticky-text">Further sessions will be conducted online</span>
          </div>
          <div className="ev-sticky-right">
            <a href={WHATSAPP_COMMUNITY_URL} target="_blank" rel="noopener noreferrer" className="ev-sticky-btn">
              Join WhatsApp Community →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
