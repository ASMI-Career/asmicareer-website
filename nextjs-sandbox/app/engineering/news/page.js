'use client';
import { useState, useEffect } from 'react';
import './news.css';
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

/* ─── helpers ─────────────────────────────────────────────── */
function isExpired(event) {
  // Result entries never expire — stay visible until manually removed
  if (event.title && event.title.toLowerCase().includes('result')) {
    return false;
  }

  const eventDate = new Date(event.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

function daysUntil(dateStr) {
  const event = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  event.setHours(0, 0, 0, 0);
  return Math.round((event - today) / (1000 * 60 * 60 * 24));
}

const TAG_CFG = {
  'URGENT':      { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef5350', border: 'rgba(239, 68, 68, 0.25)' },
  'EXAM DATE':   { bg: 'rgba(0, 200, 180, 0.12)', color: '#00C8B4', border: 'rgba(0, 200, 180, 0.25)' },
  'RESULT':      { bg: 'rgba(52, 211, 153, 0.12)', color: '#34d399', border: 'rgba(52, 211, 153, 0.25)' },
  'ASMI SEMINAR':{ bg: 'rgba(255, 215, 0, 0.12)', color: '#ffd700', border: 'rgba(255, 215, 0, 0.25)' },
  'NOTICE':      { bg: 'rgba(255, 255, 255, 0.06)', color: 'rgba(255, 255, 255, 0.75)', border: 'rgba(255, 255, 255, 0.12)' },
};
const getCfg = tag => TAG_CFG[tag] || TAG_CFG['NOTICE'];

/* ─── main component ──────────────────────────────────────── */
export default function EngineeringNewsPage() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/engineeringEvents.json')
      .then(r => r.json())
      .then(data => {
        const active = data.filter(e => !isExpired(e));
        active.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(active);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filterEvents = () => {
    if (filter === 'all')       return events;
    if (filter === 'deadlines') return events.filter(e => e.type === 'deadline' || e.tag === 'URGENT');
    if (filter === 'exams')     return events.filter(e => e.type === 'exam' || e.tag === 'EXAM DATE' || e.tag === 'RESULT');
    if (filter === 'seminars')  return events.filter(e => e.type === 'asmi' || e.tag === 'ASMI SEMINAR');
    return events;
  };

  const filtered   = filterEvents();
  const spotlight  = events.filter(e => {
    const d = daysUntil(e.date);
    return d >= 0 && d <= 14;
  });

  return (
    <>
      {/* ── PAGE ─────────────────────────────────────────── */}
      <div className="en-page">
        <Nav links={engineeringNavLinks} ctaHref="/engineering/inquiry" homeHref="/engineering" />

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="en-hero">
          <div className="en-hero-inner">
            <span className="en-eyebrow">ENGINEERING — LIVE UPDATES</span>
            <h1 className="en-hero-h1">
              Every JEE &amp; CET Deadline. <span className="en-h1-accent">One Place.</span>
            </h1>
            <p className="en-hero-sub">
              JoSAA, MHT-CET, CSAB, PERA CET and more — exam dates, counselling
              rounds, and reporting deadlines, updated live.
            </p>
            <div className="en-hero-actions">
              <a href="#en-events" className="en-btn-primary">View All Deadlines ↓</a>
              <a
                href="https://chat.whatsapp.com/L7pxi8v0nrU54tApnBA99e"
                target="_blank" rel="noopener noreferrer"
                className="en-btn-wa"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.05 2C6.495 2 2 6.495 2 12.05c0 1.87.49 3.628 1.347 5.154L2 22l4.955-1.323A10.01 10.01 0 0 0 12.05 22C17.605 22 22 17.505 22 11.95 22 6.495 17.605 2 12.05 2zm0 18.214c-1.703 0-3.282-.455-4.637-1.248l-.333-.197-3.44.919.925-3.378-.217-.349a8.168 8.168 0 0 1-1.252-4.362c0-4.522 3.68-8.202 8.2-8.202 4.522 0 8.202 3.68 8.202 8.202 0 4.521-3.68 8.2-8.202 8.2-.001.001-.002 0-.003 0h.003z"/></svg>
                WhatsApp Alerts
              </a>
            </div>
          </div>
        </section>

        {/* ── SPOTLIGHT STRIP (≤14 days) ──────────────── */}
        {!loading && spotlight.length > 0 && (
          <section className="en-strip-section">
            <div className="en-strip-head">
              <span className="en-strip-badge">⚡ Urgent</span>
              <span className="en-strip-heading">Coming Up in the Next 14 Days</span>
            </div>
            <div className="en-strip">
              {spotlight.map((e, i) => {
                const d   = daysUntil(e.date);
                const cfg = getCfg(e.tag);
                return (
                  <div className="en-strip-card" key={i}>
                    <div className="en-sc-datebox">
                      <span className="en-sc-day">{new Date(e.date).getDate()}</span>
                      <span className="en-sc-mon">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</span>
                    </div>
                    <div className="en-sc-body">
                      <span className="en-sc-tag" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                        {e.tag}
                      </span>
                      <p className="en-sc-title">{e.title}</p>
                      <span className={`en-sc-daylabel ${d === 0 ? 'en-today' : d <= 3 ? 'en-hot' : ''}`}>
                        {d === 0 ? '🔴 TODAY' : d === 1 ? '🟠 Tomorrow' : `${d} days left`}
                      </span>
                    </div>
                    {e.link && (
                      <a href={e.link} target="_blank" rel="noopener noreferrer" className="en-sc-cta">
                        {e.cta || 'View'} →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── MAIN EVENTS SECTION ──────────────────────── */}
        <section className="en-events-section" id="en-events">
          <div className="en-events-inner">

            <div className="en-events-header">
              <h2 className="en-events-title">
                Engineering Updates 2026 <span className="en-events-title-accent">— All Notices</span>
              </h2>
              <p className="en-events-sub">Official dates from JoSAA, CSAB, MHT CET, and ASMI seminars</p>
            </div>

            {/* FILTER TABS */}
            <div className="en-filters">
              {[
                { id: 'all',       label: 'All' },
                { id: 'deadlines', label: '🔴 Deadlines' },
                { id: 'exams',     label: '📋 Exam Dates / Results' },
                { id: 'seminars',  label: '🎓 ASMI Seminars' },
              ].map(f => (
                <button
                  key={f.id}
                  className={`en-filter-pill ${filter === f.id ? 'active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading && <div className="en-loading">Loading updates…</div>}

            {!loading && filtered.length === 0 && (
              <div className="en-empty">
                <span style={{ fontSize: 36 }}>🗓️</span>
                <p>No updates in this category right now. Check back soon.</p>
              </div>
            )}

            {/* CARDS GRID */}
            {!loading && filtered.length > 0 && (
              <div className="en-grid">
                {filtered.map((e, i) => {
                  const cfg = getCfg(e.tag);
                  const d   = daysUntil(e.date);
                  const isUrgent = e.type === 'deadline' || e.tag === 'URGENT';
                  return (
                    <div className={`en-card ${isUrgent ? 'en-card-urgent' : ''}`} key={i}>
                      {/* top date strip */}
                      <div className="en-card-top">
                        <div className="en-card-datebox">
                          <span className="en-cd-day">{new Date(e.date).getDate()}</span>
                          <span className="en-cd-mon">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</span>
                          <span className="en-cd-yr">{new Date(e.date).getFullYear()}</span>
                        </div>
                        {d >= 0 && d <= 7 && (
                          <span className={`en-card-urgency ${d === 0 ? 'today' : d <= 2 ? 'hot' : 'soon'}`}>
                            {d === 0 ? 'TODAY' : d === 1 ? 'Tomorrow' : `${d}d left`}
                          </span>
                        )}
                      </div>

                      {/* body */}
                      <div className="en-card-body">
                        <span
                          className="en-card-tag"
                          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                        >
                          {e.tag}
                        </span>
                        <h3 className="en-card-title">{e.title}</h3>
                        <p className="en-card-date-display">{e.display_date}</p>
                      </div>

                      {/* footer */}
                      <div className="en-card-footer">
                        {e.link && (
                          <a href={e.link} target="_blank" rel="noopener noreferrer" className="en-card-btn-primary">
                            {e.cta || 'Apply Now'}
                          </a>
                        )}
                        {e.pdf && (
                          <a href={e.pdf} target="_blank" rel="noopener noreferrer" className="en-card-btn-sec">
                            📄 View Notice
                          </a>
                        )}
                        {!e.link && !e.pdf && (
                          <span className="en-card-nolink">Date noted — no action needed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── WHATSAPP CTA BANNER ──────────────────────── */}
        <section className="en-wa-section">
          <div className="en-wa-inner">
            <div className="en-wa-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.05 2C6.495 2 2 6.495 2 12.05c0 1.87.49 3.628 1.347 5.154L2 22l4.955-1.323A10.01 10.01 0 0 0 12.05 22C17.605 22 22 17.505 22 11.95 22 6.495 17.605 2 12.05 2zm0 18.214c-1.703 0-3.282-.455-4.637-1.248l-.333-.197-3.44.919.925-3.378-.217-.349a8.168 8.168 0 0 1-1.252-4.362c0-4.522 3.68-8.202 8.2-8.202 4.522 0 8.202 3.68 8.202 8.202 0 4.521-3.68 8.2-8.202 8.2-.001.001-.002 0-.003 0h.003z"/></svg>
            </div>
            <div className="en-wa-text">
              <h3 className="en-wa-title">Get Instant Alerts on WhatsApp</h3>
              <p className="en-wa-sub">Never miss a deadline — ASMI sends you alerts the moment new notices drop.</p>
            </div>
            <a
              href="https://chat.whatsapp.com/L7pxi8v0nrU54tApnBA99e"
              target="_blank" rel="noopener noreferrer"
              className="en-wa-btn"
            >
              Join on WhatsApp →
            </a>
          </div>
        </section>

        <Footer />
      </div>


    </>
  );
}
