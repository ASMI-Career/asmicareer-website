'use client';
import { useState, useEffect } from 'react';
import './news.css';
import Nav from '../../components/Nav';
import Footer from '../../components/Footer';

/* ─── helpers ─────────────────────────────────────────────── */
function isExpired(event) {
  // Result entries never expire — stay visible until manually removed
  if (event.title && event.title.toLowerCase().includes('result')) {
    return false;
  }

  const targetDate = event.expiry_date ? event.expiry_date : event.date;
  const eventDate = new Date(targetDate);
  const now = new Date();
  // If expiry_date includes a time component, compare exact timestamps; otherwise compare by day
  if (event.expiry_date && event.expiry_date.includes('T')) {
    return eventDate < now;
  }
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
  'URGENT':      { bg: '#fff0f0', color: '#c0131b', border: '#fca5a5' },
  'EXAM DATE':   { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  'ADMIT CARD':  { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd' },
  'ASMI SEMINAR':{ bg: '#fffbeb', color: '#92400e', border: '#fcd34d' },
  'RESULT':      { bg: '#f0fdf4', color: '#166534', border: '#86efac' },
  'NOTICE':      { bg: '#f5f3ff', color: '#6d28d9', border: '#c4b5fd' },
  'COUNSELLING': { bg: '#fdf2f8', color: '#9d174d', border: '#f9a8d4' },
};
const getCfg = tag => TAG_CFG[tag] || TAG_CFG['NOTICE'];

/* ─── main component ──────────────────────────────────────── */
export default function NewsPage() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/events.json')
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
    if (filter === 'exams')     return events.filter(e => e.type === 'exam' || e.tag === 'EXAM DATE' || e.tag === 'ADMIT CARD');
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
      <div className="np-page">
        <Nav />

        {/* ── HERO ─────────────────────────────────────── */}
        <section className="np-hero">
          <div className="np-hero-inner">
            <span className="np-eyebrow">NEET &amp; MEDICAL — LIVE UPDATES</span>
            <h1 className="np-hero-h1">
              Every Deadline.<br />Every Date. <span className="np-h1-accent">One Place.</span>
            </h1>
            <p className="np-hero-sub">
              NEET UG, MHT CET, MCC Counselling, BPT Admissions — updated live
              as official notices drop. Never miss a deadline again.
            </p>
            <div className="np-hero-actions">
              <a href="#np-events" className="np-btn-primary">View All Deadlines ↓</a>
              <a
                href="https://chat.whatsapp.com/IukRVFifsfS2yiFiA80HOu"
                target="_blank" rel="noopener noreferrer"
                className="np-btn-wa"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.05 2C6.495 2 2 6.495 2 12.05c0 1.87.49 3.628 1.347 5.154L2 22l4.955-1.323A10.01 10.01 0 0 0 12.05 22C17.605 22 22 17.505 22 11.95 22 6.495 17.605 2 12.05 2zm0 18.214c-1.703 0-3.282-.455-4.637-1.248l-.333-.197-3.44.919.925-3.378-.217-.349a8.168 8.168 0 0 1-1.252-4.362c0-4.522 3.88-8.202 8.2-8.202 4.522 0 8.202 3.68 8.202 8.202 0 4.521-3.68 8.2-8.202 8.2-.001.001-.002 0-.003 0h.003z"/></svg>
                WhatsApp Alerts
              </a>
            </div>
          </div>
        </section>

        {/* ── SPOTLIGHT STRIP (≤14 days) ──────────────── */}
        {!loading && spotlight.length > 0 && (
          <section className="np-strip-section">
            <div className="np-strip-head">
              <span className="np-strip-badge">⚡ Urgent</span>
              <span className="np-strip-heading">Coming Up in the Next 14 Days</span>
            </div>
            <div className="np-strip">
              {spotlight.map((e, i) => {
                const d   = daysUntil(e.date);
                const cfg = getCfg(e.tag);
                return (
                  <div className="np-strip-card" key={i}>
                    <div className="np-sc-datebox">
                      <span className="np-sc-day">{new Date(e.date).getDate()}</span>
                      <span className="np-sc-mon">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</span>
                    </div>
                    <div className="np-sc-body">
                      <span className="np-sc-tag" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                        {e.tag}
                      </span>
                      <p className="np-sc-title">{e.title}</p>
                      <span className={`np-sc-daylabel ${d === 0 ? 'np-today' : d <= 3 ? 'np-hot' : ''}`}>
                        {d === 0 ? '🔴 TODAY' : d === 1 ? '🟠 Tomorrow' : `${d} days left`}
                      </span>
                    </div>
                    {e.link && (
                      <a href={e.link} target="_blank" rel="noopener noreferrer" className="np-sc-cta">
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
        <section className="np-events-section" id="np-events">
          <div className="np-events-inner">

            <div className="np-events-header">
              <h2 className="np-events-title">
                Medical Updates 2026 <span className="np-events-title-accent">— All Notices</span>
              </h2>
              <p className="np-events-sub">Official dates from NTA, MCC, MHT CET, and ASMI seminars</p>
            </div>

            {/* FILTER TABS */}
            <div className="np-filters">
              {[
                { id: 'all',       label: 'All' },
                { id: 'deadlines', label: '🔴 Deadlines' },
                { id: 'exams',     label: '📋 Exam Dates' },
                { id: 'seminars',  label: '🎓 ASMI Seminars' },
              ].map(f => (
                <button
                  key={f.id}
                  className={`np-filter-pill ${filter === f.id ? 'active' : ''}`}
                  onClick={() => setFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {loading && <div className="np-loading">Loading updates…</div>}

            {!loading && filtered.length === 0 && (
              <div className="np-empty">
                <span style={{ fontSize: 36 }}>🗓️</span>
                <p>No updates in this category right now. Check back soon.</p>
              </div>
            )}

            {/* CARDS GRID */}
            {!loading && filtered.length > 0 && (
              <div className="np-grid">
                {filtered.map((e, i) => {
                  const cfg = getCfg(e.tag);
                  const d   = daysUntil(e.date);
                  const isUrgent = e.type === 'deadline' || e.tag === 'URGENT';
                  return (
                    <div className={`np-card ${isUrgent ? 'np-card-urgent' : ''}`} key={i}>
                      {/* top date strip */}
                      <div className="np-card-top">
                        <div className="np-card-datebox">
                          <span className="np-cd-day">{new Date(e.date).getDate()}</span>
                          <span className="np-cd-mon">{new Date(e.date).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</span>
                          <span className="np-cd-yr">{new Date(e.date).getFullYear()}</span>
                        </div>
                        {d >= 0 && d <= 7 && (
                          <span className={`np-card-urgency ${d === 0 ? 'today' : d <= 2 ? 'hot' : 'soon'}`}>
                            {d === 0 ? 'TODAY' : d === 1 ? 'Tomorrow' : `${d}d left`}
                          </span>
                        )}
                      </div>

                      {/* body */}
                      <div className="np-card-body">
                        <span
                          className="np-card-tag"
                          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
                        >
                          {e.tag}
                        </span>
                        <h3 className="np-card-title">{e.title}</h3>
                        <p className="np-card-date-display">{e.display_date}</p>
                      </div>

                      {/* footer */}
                      <div className="np-card-footer">
                        {e.link && (
                          <a href={e.link} target="_blank" rel="noopener noreferrer" className="np-card-btn-primary">
                            {e.cta || 'Apply Now'}
                          </a>
                        )}
                        {e.pdf && (
                          <a href={e.pdf} target="_blank" rel="noopener noreferrer" className="np-card-btn-sec">
                            📄 View Notice
                          </a>
                        )}
                        {!e.link && !e.pdf && (
                          <span className="np-card-nolink">Date noted — no action needed</span>
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
        <section className="np-wa-section">
          <div className="np-wa-inner">
            <div className="np-wa-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.05 2C6.495 2 2 6.495 2 12.05c0 1.87.49 3.628 1.347 5.154L2 22l4.955-1.323A10.01 10.01 0 0 0 12.05 22C17.605 22 22 17.505 22 11.95 22 6.495 17.605 2 12.05 2zm0 18.214c-1.703 0-3.282-.455-4.637-1.248l-.333-.197-3.44.919.925-3.378-.217-.349a8.168 8.168 0 0 1-1.252-4.362c0-4.522 3.68-8.202 8.2-8.202 4.522 0 8.202 3.68 8.202 8.202 0 4.521-3.68 8.2-8.202 8.2-.001.001-.002 0-.003 0h.003z"/></svg>
            </div>
            <div className="np-wa-text">
              <h3 className="np-wa-title">Get Instant Alerts on WhatsApp</h3>
              <p className="np-wa-sub">Never miss a deadline — ASMI sends you alerts the moment new notices drop.</p>
            </div>
            <a
              href="https://chat.whatsapp.com/IukRVFifsfS2yiFiA80HOu"
              target="_blank" rel="noopener noreferrer"
              className="np-wa-btn"
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
