'use client';
import { useState, useEffect } from 'react';
import './events.css';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

/* ─── CONFIG ────────────────────────────────────────────────
   Replace with your deployed Apps Script Web App URL.
   Deploy the apps-script-seminars.js additions as a Web App
   (Execute as: Me, Who has access: Anyone).
────────────────────────────────────────────────────────────── */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySE02MPVvJobNKjT5NlAIazXAslEIdYz-yPXIKPiae7t3JNxpxcxAVneImTpNEzCvHhg/exec';

/* ─── CITY CODES for Booking ID ───────────────────────────── */
const CITY_CODE = {
  Mumbai: 'MUM', Thane: 'THA', Pune: 'PUN',
  Kolhapur: 'KOL', Sangli: 'SAN', 'Chh. Sambhajinagar': 'SAM',
};

function generateBookingId(city) {
  const code = CITY_CODE[city] || 'ASM';
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ASMI-${code}-${ds}-${rand}`;
}

/* ─── STEP CONFIG ──────────────────────────────────────────── */
const STEPS = [
  { label: 'Choose Seminar', icon: '📍' },
  { label: 'Time Slot',      icon: '🕐' },
  { label: 'Your Details',   icon: '👤' },
  { label: 'Your Ticket',    icon: '🎟️' },
];

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
export default function EventsPage() {
  const [seminars, setSeminars] = useState([]);
  const [cityFilter, setCityFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [remainingSeats, setRemainingSeats] = useState({});

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSeminar, setSelectedSeminar] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', neetYear: 'NEET 2026', members: 0 });
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fetchRemainingSeats = () => {
    if (APPS_SCRIPT_URL && APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE') {
      fetch(`${APPS_SCRIPT_URL}?action=getRemainingSeats`)
        .then(r => r.json())
        .then(data => {
          if (data && typeof data === 'object') {
            setRemainingSeats(data);
          }
        })
        .catch(err => console.error("Error fetching remaining seats:", err));
    }
  };

  useEffect(() => {
    fetch('/data/seminars.json')
      .then(r => r.json())
      .then(data => { setSeminars(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchRemainingSeats();
  }, [seminars]);

  /* ── derived ── */
  const upcoming = seminars.filter(s => !s.coming_soon);
  const cities = ['All', ...Array.from(new Set(seminars.map(s => s.city)))];
  const filtered = cityFilter === 'All' ? seminars : seminars.filter(s => s.city === cityFilter);

  /* ── modal helpers ── */
  function openModal(seminar = null, startStep = 1) {
    fetchRemainingSeats(); // refresh remaining seats on modal open
    setStep(startStep);
    setSelectedSeminar(seminar);
    setSelectedSlot(seminar?.slots?.[0] ?? null);
    setForm({ name: '', phone: '', email: '', neetYear: 'NEET 2026', members: 0 });
    setBooking(null);
    setSubmitError('');
    setModalOpen(true);
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    setModalOpen(false);
    document.body.style.overflow = '';
  }

  function nextStep() { setStep(s => Math.min(4, s + 1)); }
  function prevStep() { setStep(s => Math.max(1, s - 1)); }

  /* ── validation ── */
  const requestedSeats = form.members + 1;
  const hasEnoughSeats = selectedSeminar ? (remainingSeats[selectedSeminar.id] === undefined || remainingSeats[selectedSeminar.id] >= requestedSeats) : true;

  const ok1 = selectedSeminar && !selectedSeminar.coming_soon && (remainingSeats[selectedSeminar.id] === undefined || remainingSeats[selectedSeminar.id] > 0);
  const ok2 = !!selectedSlot;
  const ok3 = form.name.trim().length > 1
    && form.phone.replace(/\D/g,'').length === 10
    && form.email.includes('@') && form.email.includes('.')
    && hasEnoughSeats;

  /* ── submission ── */
  async function handleSubmit() {
    if (!ok3 || submitting) return;
    setSubmitting(true);
    setSubmitError('');

    const bookingId = generateBookingId(selectedSeminar.city);
    const payload = {
      action: 'bookSeminar',
      bookingId,
      seminarId:    selectedSeminar.id,
      seminarTitle: selectedSeminar.title,
      city:         selectedSeminar.city,
      branch:       selectedSeminar.branch,
      venue:        selectedSeminar.venue,
      venueMaps:    selectedSeminar.venue_maps,
      date:         selectedSeminar.display_date,
      slot:         selectedSlot?.time ?? 'TBD',
      name:         form.name.trim(),
      phone:        form.phone.replace(/\D/g,''),
      email:        form.email.trim(),
      neetYear:     form.neetYear,
      members:      form.members,
    };

    try {
      // Build query string to call GET endpoint for reading CORS JSON response
      const q = new URLSearchParams();
      Object.keys(payload).forEach(k => q.append(k, payload[k]));
      
      const res = await fetch(`${APPS_SCRIPT_URL}?${q.toString()}`);
      const data = await res.json();
      
      if (data && data.success) {
        setBooking(payload);
        setStep(4);
      } else {
        setSubmitError(data.message || 'Booking failed. This seminar might be fully booked. Please try again.');
      }
    } catch (err) {
      setSubmitError('Could not connect. Please try again or call ' + selectedSeminar.phone);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── print ticket ── */
  function handlePrint() {
    if (!booking) return;
    const verifyUrl = `https://asmicareer.in/events/verify?id=${encodeURIComponent(booking.bookingId)}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verifyUrl)}&color=1a0040&bgcolor=ffffff`;
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head><title>ASMI Ticket — ${booking.bookingId}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;background:#fff;padding:32px}
  .ticket{max-width:600px;margin:0 auto;border:2px solid #1a0040;border-radius:16px;overflow:hidden}
  .t-header{background:linear-gradient(135deg,#1a0040,#6a0dad);padding:20px 24px;display:flex;align-items:center;justify-content:space-between}
  .t-header img{height:40px}
  .t-confirmed{background:#FFD700;color:#1a0040;font-weight:900;font-size:12px;padding:5px 14px;border-radius:50px;letter-spacing:.5px}
  .t-main{padding:20px 24px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #eee}
  .t-bid-lbl{font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#6a0dad;margin-bottom:4px}
  .t-bid{font-size:20px;font-weight:900;color:#1a0040;letter-spacing:.5px}
  .t-name{font-size:15px;font-weight:700;color:#1a0040;margin-top:12px}
  .t-contact{font-size:12px;color:#555;margin-top:2px}
  .t-qr{border:2px solid #FFD700;border-radius:8px;padding:4px}
  .t-details{padding:16px 24px;background:#fafafa;border-bottom:1px solid #eee}
  .t-row{display:flex;gap:12px;margin-bottom:6px;font-size:13px}
  .t-lbl{width:80px;color:#888;flex-shrink:0}
  .t-val{color:#1a0040;font-weight:600;flex:1}
  .t-footer{background:#1a0040;padding:14px 24px;text-align:center}
  .t-footer p{color:rgba(255,255,255,.65);font-size:11px;margin-bottom:2px}
  .t-footer b{color:#FFD700}
  @media print{body{padding:0}button{display:none}}
</style></head><body>
<div class="ticket">
  <div class="t-header">
    <img src="${window.location.origin}/asmi-logo.png" alt="ASMI Career" onerror="this.style.display='none'">
    <span class="t-confirmed">✅ BOOKING CONFIRMED</span>
  </div>
  <div class="t-main">
    <div>
      <div class="t-bid-lbl">BOOKING ID</div>
      <div class="t-bid">${booking.bookingId}</div>
      <div class="t-name">${booking.name}</div>
      <div class="t-contact">${booking.phone} &nbsp;·&nbsp; ${booking.email}</div>
    </div>
    <img src="${qrSrc}" alt="QR Code" class="t-qr" width="100" height="100">
  </div>
  <div class="t-details">
    <div class="t-row"><span class="t-lbl">Event</span><span class="t-val">${booking.seminarTitle} — ${booking.city}</span></div>
    <div class="t-row"><span class="t-lbl">Date</span><span class="t-val">${booking.date}</span></div>
    <div class="t-row"><span class="t-lbl">Time</span><span class="t-val">${booking.slot}</span></div>
    <div class="t-row"><span class="t-lbl">Venue</span><span class="t-val">${booking.venue}</span></div>
    <div class="t-row"><span class="t-lbl">Attendees</span><span class="t-val">${parseInt(booking.members) + 1} person${parseInt(booking.members) > 0 ? 's' : ''}</span></div>
    <div class="t-row"><span class="t-lbl">Category</span><span class="t-val">${booking.neetYear}</span></div>
  </div>
  <div class="t-footer">
    <p>Show this ticket at the venue entrance &nbsp;|&nbsp; Booking Date: ${new Date().toLocaleDateString('en-IN')}</p>
    <p><b>ASMI Career</b> &nbsp;·&nbsp; 7410019074 &nbsp;·&nbsp; asmicareer.in</p>
  </div>
</div>
<br><button onclick="window.print()" style="display:block;margin:16px auto;padding:10px 28px;background:#1a0040;color:#FFD700;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">🖨️ Print Ticket</button>
</body></html>`);
    win.document.close();
    win.focus();
  }

  /* ── WhatsApp share ── */
  function handleWAShare() {
    const msg = encodeURIComponent(
      `Hi, I've registered for the ASMI Seminar.\nBooking ID: ${booking.bookingId}\nName: ${booking.name}\nCity: ${booking.city}\nDate: ${booking.date}`
    );
    window.open(`https://wa.me/917410019074?text=${msg}`, '_blank');
  }

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
              ASMI Career <span className="ev-h1-gold">Free Counselling</span><br />
              Seminars 2026
            </h1>
            <p className="ev-hero-sub">
              Attend a live session with our NEET counselling experts. Understand
              cutoffs, college options, and your strategy — before the rush begins.
              Seats are limited and entry is completely free.
            </p>
            <div className="ev-hero-btns">
              <button className="ev-btn-primary" onClick={() => openModal(null, 1)}>
                Book Your Free Seat →
              </button>
              <a
                href="https://wa.me/917410019074"
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
                <div className="ev-why-img-wrapper">
                  <img
                    src="/images/events/audience-placeholder.jpg"
                    alt="ASMI seminar audience"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.classList.add('placeholder-fallback');
                    }}
                  />
                  <div className="ev-img-fallback-text">ASMI Seminar Audience</div>
                </div>
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

        {/* ── SEMINAR CARDS ─────────────────────────────────── */}
        <section className="ev-seminars-section" id="seminar-grid">
          <div className="ev-seminars-inner">

            <div className="ev-sec-head">
              <h2 className="ev-sec-title">
                ASMI Seminars 2026 <span className="ev-sec-title-accent">— Book Your Seat</span>
              </h2>
              <p className="ev-sec-sub">Select a city · Entry is completely free</p>
            </div>

            {/* City Filter */}
            <div className="ev-city-filters">
              {cities.map(city => (
                <button
                  key={city}
                  className={`ev-city-pill ${cityFilter === city ? 'active' : ''}`}
                  onClick={() => setCityFilter(city)}
                >
                  {city}
                </button>
              ))}
            </div>

            {loading && <div className="ev-loading">Loading seminars…</div>}

            {/* Grid */}
            {!loading && (
              <div className="ev-grid">
                {filtered.map(s => {
                  const seatsLeft = remainingSeats[s.id];
                  const isFull = seatsLeft !== undefined && seatsLeft <= 0;
                  return (
                    <div className={`ev-card ${s.coming_soon ? 'ev-card-soon' : ''} ${isFull ? 'ev-card-full' : ''}`} key={s.id}>

                      {/* Card header strip */}
                      <div
                        className="ev-card-strip"
                        style={{ background: `linear-gradient(135deg, ${s.color_from}, ${s.color_to})` }}
                      >
                        <div className="ev-card-strip-left">
                          {!s.coming_soon ? (
                            <>
                              <span className="ev-card-daynum">{new Date(s.date + 'T00:00:00').getDate()}</span>
                              <div className="ev-card-daydetail">
                                <span className="ev-card-mon">{new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</span>
                                {s.day && <span className="ev-card-dow">{s.day}</span>}
                              </div>
                            </>
                          ) : (
                            <span className="ev-card-tba">📢 Date TBA</span>
                          )}
                        </div>
                        <div className="ev-card-strip-right">
                          <span className="ev-card-city-label">{s.branch}</span>
                          {s.is_free && <span className="ev-free-badge">FREE</span>}
                          {s.coming_soon && <span className="ev-soon-badge">Coming Soon</span>}
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="ev-card-body">
                        <h3 className="ev-card-title">{s.title}</h3>
                        <p className="ev-card-subtitle">{s.subtitle}</p>

                        {!s.coming_soon ? (
                          <div className="ev-card-details">
                            {s.slots.map((slot, si) => (
                              <div className="ev-detail-row" key={si}>
                                <span className="ev-detail-icon">🕐</span>
                                <span className="ev-slot-time">{slot.time}</span>
                              </div>
                            ))}
                            <div className="ev-detail-row">
                              <span className="ev-detail-icon">📍</span>
                              <span className="ev-venue-text">{s.venue}</span>
                            </div>
                            {seatsLeft !== undefined && (
                              <div className="ev-detail-row">
                                <span className="ev-detail-icon">🎟️</span>
                                <span className={`ev-seats-badge ${isFull ? 'full' : 'left'}`}>
                                  {isFull ? 'Sold Out / Full' : `${seatsLeft} seats left`}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="ev-coming-soon-msg">
                            <p>Date will be announced soon.</p>
                            <p>Join our WhatsApp to get notified instantly.</p>
                          </div>
                        )}
                      </div>

                      {/* Card footer */}
                      <div className="ev-card-footer">
                        {!s.coming_soon ? (
                          <>
                            <button
                              className="ev-book-btn"
                              disabled={isFull}
                              onClick={() => openModal(s, 2)}
                            >
                              {isFull ? 'FULL' : 'Book Ticket'}
                            </button>
                            <a
                              href={s.venue_maps}
                              target="_blank" rel="noopener noreferrer"
                              className="ev-dir-btn"
                            >
                              📍 Directions
                            </a>
                          </>
                        ) : (
                          <a
                            href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(`Hi, I'd like to be notified when the ${s.city} ASMI seminar date is announced.`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="ev-notify-btn"
                          >
                            💬 Notify Me on WhatsApp
                          </a>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
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
            <div className="ev-counsellors-grid">
              {[
                { n: '1', b: 'Mumbai East' },
                { n: '2', b: 'Thane Central' },
                { n: '3', b: 'Pune Campus' },
                { n: '4', b: 'Kolhapur Division' },
                { n: '5', b: 'Sangli District' },
                { n: '6', b: 'Senior Advisory Board' }
              ].map((c, idx) => (
                <div className="ev-counsellor-card" key={idx}>
                  <div className="ev-counsellor-avatar-wrapper">
                    <img
                      src={`/images/events/counsellor-${c.n}.jpg`}
                      alt={`Counsellor Name ${c.n}`}
                      className="ev-counsellor-avatar"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.classList.add('avatar-fallback');
                      }}
                    />
                    <div className="ev-avatar-fallback-icon">👤</div>
                  </div>
                  <h4 className="ev-counsellor-name">Counsellor Name {c.n}</h4>
                  <p className="ev-counsellor-title">Senior Counsellor — {c.b}</p>
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

        {/* ── NEW SECTION 6 — "Glimpses of Previous Seminars" Video Section ── */}
        <section className="ev-video-section">
          <div className="ev-video-inner">
            <div className="ev-sec-head-center">
              <span className="ev-section-eyebrow">SEMINAR GALLERY</span>
              <h2 className="ev-section-title-dark-center">Glimpses of Our Previous Seminars</h2>
              <p className="ev-section-sub-dark-center">See what happens in the room — real students, real questions, real answers.</p>
            </div>
            <div className="ev-video-wrapper">
              <video
                className="seminar-glimpse-video"
                poster="/images/events/glimpses-poster.jpg"
                controls
                muted
                loop
                playsInline
                preload="none"
              >
                <source src="/videos/events/seminar-glimpses.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
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
            <a href="#seminar-grid" className="ev-closing-btn">
              Reserve Your Slot Now →
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
              href="https://wa.me/917410019074"
              target="_blank" rel="noopener noreferrer"
              className="ev-wa-cta"
            >
              💬 Chat on WhatsApp
            </a>
          </div>
        </section>

        <Footer />
      </div>

      {/* ══════════════════════════════════════════════════
          BOOKING MODAL
      ══════════════════════════════════════════════════ */}
      {modalOpen && (
        <div
          className="ev-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Book Ticket"
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="ev-modal">

            {/* Modal header */}
            <div className="ev-modal-hdr">
              <h2 className="ev-modal-hdr-title">Book Ticket</h2>
              <button className="ev-modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            {/* Progress steps */}
            <div className="ev-steps-bar">
              {STEPS.map((s, i) => {
                const num = i + 1;
                const isDone   = num < step;
                const isActive = num === step;
                return (
                  <div className="ev-step-wrap" key={i}>
                    <div className={`ev-step-circle ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                      {isDone ? '✓' : s.icon}
                    </div>
                    <span className={`ev-step-label ${isActive ? 'active' : ''}`}>{s.label}</span>
                    {i < STEPS.length - 1 && (
                      <div className={`ev-step-line ${num < step ? 'done' : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── STEP 1: Choose Seminar ── */}
            {step === 1 && (
              <div className="ev-modal-body">
                <p className="ev-step-hint">Select an upcoming ASMI seminar</p>
                {upcoming.length === 0 ? (
                  <p className="ev-no-seminars">No seminars scheduled yet. Follow us on WhatsApp for announcements.</p>
                ) : (
                  <div className="ev-seminar-pick-list">
                    {upcoming.map(s => {
                      const semSeats = remainingSeats[s.id];
                      const semFull = semSeats !== undefined && semSeats <= 0;
                      return (
                        <div
                          key={s.id}
                          className={`ev-seminar-pick ${selectedSeminar?.id === s.id ? 'selected' : ''} ${semFull ? 'disabled' : ''}`}
                          onClick={() => {
                            if (semFull) return;
                            setSelectedSeminar(s);
                            setSelectedSlot(s.slots[0] ?? null);
                          }}
                        >
                          <div className="ev-sp-datebox">
                            <span className="ev-sp-day">{new Date(s.date + 'T00:00:00').getDate()}</span>
                            <span className="ev-sp-mon">{new Date(s.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}</span>
                          </div>
                          <div className="ev-sp-info">
                            <span className="ev-sp-city">{s.city} — {s.branch}</span>
                            <span className="ev-sp-venue">{s.venue.length > 50 ? s.venue.slice(0, 50) + '…' : s.venue}</span>
                            {semSeats !== undefined && (
                              <span className={`ev-sp-seats ${semFull ? 'full' : ''}`}>
                                {semFull ? 'Fully Booked' : `${semSeats} seats left`}
                              </span>
                            )}
                          </div>
                          <div className={`ev-sp-radio ${selectedSeminar?.id === s.id ? 'selected' : ''} ${semFull ? 'disabled' : ''}`} />
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="ev-modal-footer">
                  <button
                    className="ev-modal-btn-primary"
                    disabled={!ok1}
                    onClick={nextStep}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Choose Slot ── */}
            {step === 2 && selectedSeminar && (
              <div className="ev-modal-body">
                <div className="ev-step2-summary">
                  <span className="ev-s2-date-pill">{selectedSeminar.display_date}</span>
                  <span className="ev-s2-city">{selectedSeminar.city} — {selectedSeminar.branch}</span>
                </div>
                <p className="ev-step-hint">Choose your preferred time slot</p>
                <div className="ev-slot-list">
                  {selectedSeminar.slots.map(slot => (
                    <div
                      key={slot.id}
                      className={`ev-slot-row ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      <div className="ev-slot-info">
                        <p className="ev-slot-event-name">{selectedSeminar.title}</p>
                        <p className="ev-slot-venue-name">{selectedSeminar.venue}</p>
                        <span className="ev-slot-time-pill">{slot.time}</span>
                      </div>
                      <button
                        className={`ev-slot-select-btn ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                      >
                        {selectedSlot?.id === slot.id ? '✓ Selected' : 'Select'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="ev-modal-footer">
                  <button className="ev-modal-btn-sec" onClick={prevStep}>← Back</button>
                  <button className="ev-modal-btn-primary" disabled={!ok2} onClick={nextStep}>Next →</button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Your Details ── */}
            {step === 3 && (
              <div className="ev-modal-body">
                <p className="ev-step-hint">Enter your details — your ticket will be emailed to you</p>
                <div className="ev-form">
                  <div className="ev-fg">
                    <label className="ev-fl">Full Name *</label>
                    <input
                      className="ev-fi"
                      type="text"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    />
                  </div>
                  <div className="ev-fg">
                    <label className="ev-fl">Mobile Number *</label>
                    <input
                      className="ev-fi"
                      type="tel"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={form.phone}
                      onChange={e => setForm(f => ({...f, phone: e.target.value.replace(/\D/g,'')}))}
                    />
                  </div>
                  <div className="ev-fg">
                    <label className="ev-fl">Email Address *</label>
                    <input
                      className="ev-fi"
                      type="email"
                      placeholder="Email address (ticket will be sent here)"
                      value={form.email}
                      onChange={e => setForm(f => ({...f, email: e.target.value}))}
                    />
                  </div>
                  <div className="ev-fg">
                    <label className="ev-fl">Appearing In</label>
                    <div className="ev-radio-row">
                      {['NEET 2026', 'NEET 2027', 'Parent/Guardian'].map(opt => (
                        <label
                          key={opt}
                          className={`ev-radio-pill ${form.neetYear === opt ? 'active' : ''}`}
                        >
                          <input
                            type="radio" name="neetYear" value={opt}
                            checked={form.neetYear === opt}
                            onChange={() => setForm(f => ({...f, neetYear: opt}))}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="ev-fg">
                    <label className="ev-fl">Additional Members</label>
                    <div className="ev-counter">
                      <button
                        className="ev-counter-btn"
                        onClick={() => setForm(f => ({...f, members: Math.max(0, f.members - 1)}))}
                        disabled={form.members === 0}
                        type="button"
                      >−</button>
                      <span className="ev-counter-num">{form.members}</span>
                      <button
                        className="ev-counter-btn"
                        onClick={() => setForm(f => ({...f, members: Math.min(4, f.members + 1)}))}
                        disabled={form.members === 4}
                        type="button"
                      >+</button>
                    </div>
                    <p className="ev-fhint">People accompanying you (max 4, each needs 1 seat)</p>
                  </div>
                  {!hasEnoughSeats && selectedSeminar && (
                    <p className="ev-error">
                      Only {remainingSeats[selectedSeminar.id]} seat(s) left. Please reduce the number of additional members.
                    </p>
                  )}
                  {submitError && <p className="ev-error">{submitError}</p>}
                </div>
                <div className="ev-modal-footer">
                  <button className="ev-modal-btn-sec" onClick={prevStep}>← Back</button>
                  <button
                    className="ev-modal-btn-primary"
                    disabled={!ok3 || submitting}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'Booking…' : 'Confirm & Get Ticket →'}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: Ticket ── */}
            {step === 4 && booking && (
              <div className="ev-modal-body ev-ticket-body">
                {/* Ticket card */}
                <div className="ev-ticket">
                  <div className="ev-ticket-top">
                    <img src="/asmi-logo.png" alt="ASMI Career" className="ev-ticket-logo" />
                    <span className="ev-ticket-confirmed">✅ Booking Confirmed</span>
                  </div>
                  <div className="ev-ticket-mid">
                    <div className="ev-ticket-id-block">
                      <p className="ev-ticket-id-lbl">BOOKING ID</p>
                      <p className="ev-ticket-id">{booking.bookingId}</p>
                      <p className="ev-ticket-attendee">{booking.name}</p>
                      <p className="ev-ticket-contact">{booking.phone} · {booking.email}</p>
                    </div>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://asmicareer.in/events/verify?id=${booking.bookingId}`)}&color=1a0040`}
                      alt="QR Code"
                      className="ev-ticket-qr"
                    />
                  </div>
                  <div className="ev-ticket-details">
                    {[
                      { l: 'Event',     v: `${booking.seminarTitle} — ${booking.city}` },
                      { l: 'Date',      v: booking.date },
                      { l: 'Time',      v: booking.slot },
                      { l: 'Venue',     v: booking.venue },
                      { l: 'Attendees', v: `${parseInt(booking.members)+1} person${parseInt(booking.members)>0?'s':''}` },
                    ].map(row => (
                      <div className="ev-ticket-row" key={row.l}>
                        <span className="ev-ticket-row-lbl">{row.l}</span>
                        <span className="ev-ticket-row-val">{row.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="ev-ticket-bottom">
                    Show this ticket at the venue entrance · Ticket also sent to {booking.email}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="ev-ticket-actions">
                  <button className="ev-download-btn" onClick={handlePrint}>
                    📥 Download / Print Ticket
                  </button>
                  <button className="ev-wa-share-btn" onClick={handleWAShare}>
                    💬 Share on WhatsApp
                  </button>
                  <button className="ev-done-btn" onClick={closeModal}>Done</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── STICKY BOTTOM BAR ── */}
      <div className="ev-sticky-bar">
        <div className="ev-sticky-inner">
          <div className="ev-sticky-left">
            <span className="ev-sticky-icon">🗓️</span>
            <span className="ev-sticky-date">Next Seminar: Sunday, 5 July 2026</span>
          </div>
          <div className="ev-sticky-center">
            <span className="ev-sticky-badge">100% FREE</span>
            <span className="ev-sticky-text">Limited Seats — First Come, First Serve</span>
          </div>
          <div className="ev-sticky-right">
            <a href="#seminar-grid" className="ev-sticky-btn">
              Book Your Free Seat →
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
