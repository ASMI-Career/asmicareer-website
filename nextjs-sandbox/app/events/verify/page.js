'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import './verify.css';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySE02MPVvJobNKjT5NlAIazXAslEIdYz-yPXIKPiae7t3JNxpxcxAVneImTpNEzCvHhg/exec';
const DASHBOARD_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz_0k81uo0WOYsHaghxqlMBBdJMmc0c4TzYDjnLpsqtQ2yhzhPkVlfmxZ_mmVrh_pls/exec';
const STAFF_PIN = '2026';

const CATEGORY_OPTIONS = ['OPEN', 'OBC', 'EWS', 'SC', 'ST', 'VJ', 'NT1', 'NT2', 'NT3', 'SEBC'];
const COURSE_OPTIONS = ['MBBS', 'BDS', 'BAMS', 'BHMS', 'BPT'];

async function submitDashboardInquiry({ fullName, studentContact, neetScore, category, courses, city }) {
  const body = new URLSearchParams();
  body.append('source', 'Seminar');
  body.append('fullName', fullName || '');
  body.append('studentContact', studentContact || '');
  body.append('neetScore', neetScore || '');
  body.append('category', category || '');
  body.append('courses', courses || '');
  body.append('city', city || '');

  const res = await fetch(DASHBOARD_SCRIPT_URL, { method: 'POST', body });
  const text = await res.text();
  const token = text.trim();
  if (!token) throw new Error('Empty token returned');
  return token;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');

  const [verified, setVerified] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Feature 1 — score/category/course entry after check-in
  const [neetScore, setNeetScore] = useState('');
  const [category, setCategory] = useState('OPEN');
  const [course, setCourse] = useState('MBBS');
  const [dashSubmitting, setDashSubmitting] = useState(false);
  const [dashToken, setDashToken] = useState('');
  const [dashError, setDashError] = useState('');

  // Feature 2 — walk-in registration
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkForm, setWalkForm] = useState({
    name: '', phone: '', email: '', neetScore: '', category: 'OPEN', course: 'MBBS'
  });
  const [walkSubmitting, setWalkSubmitting] = useState(false);
  const [walkError, setWalkError] = useState('');
  const [walkToken, setWalkToken] = useState('');
  const [walkBookingId, setWalkBookingId] = useState('');

  // Check pin authorization
  useEffect(() => {
    const isVerified = sessionStorage.getItem('asmi_staff_verified') === 'true';
    if (isVerified) {
      setVerified(true);
    }
  }, []);

  // Fetch ticket status when verified and id is present
  useEffect(() => {
    if (!verified || !id) {
      setResult(null);
      return;
    }

    async function checkTicket() {
      setLoading(true);
      setError('');
      setResult(null);

      try {
        const res = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify({ action: 'verifySeminarTicket', bookingId: id })
        });
        const data = await res.json();
        
        if (data && data.success) {
          setResult(data);
        } else {
          setError(data?.message || 'Verification failed. Ticket not found.');
        }
      } catch (err) {
        setError('Error verifying ticket. Check connection and try again.');
      } finally {
        setLoading(false);
      }
    }

    checkTicket();
  }, [verified, id]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pin === STAFF_PIN) {
      sessionStorage.setItem('asmi_staff_verified', 'true');
      setVerified(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN');
      setPin('');
    }
  };

  const handleScanNext = () => {
    router.push('/events/verify');
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();
    setDashSubmitting(true);
    setDashError('');
    try {
      const token = await submitDashboardInquiry({
        fullName: result?.name,
        studentContact: result?.phone,
        neetScore,
        category,
        courses: course,
        city: result?.city
      });
      setDashToken(token);
    } catch (err) {
      setDashError('Could not submit. Check connection and try again.');
    } finally {
      setDashSubmitting(false);
    }
  };

  const handleWalkInFieldChange = (field) => (e) => {
    setWalkForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setWalkSubmitting(true);
    setWalkError('');
    try {
      const res1 = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addWalkIn',
          name: walkForm.name,
          phone: walkForm.phone,
          email: walkForm.email,
          neetYear: 'NEET 2026'
        })
      });
      const data1 = await res1.json();
      if (!data1 || !data1.success) {
        throw new Error(data1?.error || 'Walk-in registration failed');
      }
      setWalkBookingId(data1.bookingId);

      const token = await submitDashboardInquiry({
        fullName: walkForm.name,
        studentContact: walkForm.phone,
        neetScore: walkForm.neetScore,
        category: walkForm.category,
        courses: walkForm.course,
        city: ''
      });
      setWalkToken(token);
    } catch (err) {
      setWalkError('Could not complete walk-in registration. Try again.');
    } finally {
      setWalkSubmitting(false);
    }
  };

  // Render 1: PIN Entry Screen
  if (!verified) {
    return (
      <div className="sv-container">
        <div className="sv-card sv-pin-card">
          <div className="sv-logo-wrap">
            <span className="sv-logo-badge">ASMI STAFF</span>
          </div>
          <h1 className="sv-title">Staff Access</h1>
          <p className="sv-desc">Please enter the 4-digit staff PIN to unlock scanner verification.</p>
          <form onSubmit={handlePinSubmit} className="sv-form">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="sv-pin-input"
            />
            {pinError && <p className="sv-error-text">{pinError}</p>}
            <button type="submit" disabled={pin.length < 4} className="sv-btn-primary">
              Enter →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render 2: Loading State
  if (loading) {
    return (
      <div className="sv-container">
        <div className="sv-card sv-loading-card">
          <div className="sv-spinner" />
          <h2 className="sv-loading-title">Verifying Ticket...</h2>
          <p className="sv-loading-desc">Checking booking ID: {id}</p>
        </div>
      </div>
    );
  }

  // Render 3: No Booking ID provided
  if (!id) {
    if (walkToken) {
      return (
        <div className="sv-container">
          <div className="sv-card sv-green-card">
            <div className="sv-icon-circle green">✓</div>
            <h2 className="sv-result-title">Walk-in Registered ✓</h2>
            <p className="sv-checkin-time-badge success">Booking ID: {walkBookingId}</p>
            <a href={`https://asmicareer.in/dashboard.html?token=${encodeURIComponent(walkToken)}&mode=counsel`}
               target="_blank" rel="noopener noreferrer" className="sv-btn-primary">
              View Report
            </a>
            <button onClick={() => { setShowWalkIn(false); setWalkToken(''); setWalkBookingId(''); }} className="sv-btn-sec">
              Scan Next Ticket
            </button>
          </div>
        </div>
      );
    }

    if (showWalkIn) {
      return (
        <div className="sv-container">
          <div className="sv-card sv-neutral-card">
            <div className="sv-icon-circle neutral">🚶</div>
            <h2 className="sv-result-title">Walk-in Registration</h2>
            <form onSubmit={handleWalkInSubmit} className="sv-form">
              <input type="text" placeholder="Full Name" required
                value={walkForm.name} onChange={handleWalkInFieldChange('name')} className="sv-pin-input" />
              <input type="tel" placeholder="Phone" required
                value={walkForm.phone} onChange={handleWalkInFieldChange('phone')} className="sv-pin-input" />
              <input type="email" placeholder="Email" required
                value={walkForm.email} onChange={handleWalkInFieldChange('email')} className="sv-pin-input" />
              <input type="number" placeholder="NEET Score" required
                value={walkForm.neetScore} onChange={handleWalkInFieldChange('neetScore')} className="sv-pin-input" />
              <select value={walkForm.category} onChange={handleWalkInFieldChange('category')} className="sv-pin-input">
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={walkForm.course} onChange={handleWalkInFieldChange('course')} className="sv-pin-input">
                {COURSE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {walkError && <p className="sv-error-text">{walkError}</p>}
              <button type="submit" disabled={walkSubmitting} className="sv-btn-primary">
                {walkSubmitting ? 'Submitting…' : 'Register Walk-in'}
              </button>
            </form>
            <button onClick={() => setShowWalkIn(false)} className="sv-btn-sec">Cancel</button>
          </div>
        </div>
      );
    }

    return (
      <div className="sv-container">
        <div className="sv-card sv-neutral-card">
          <div className="sv-icon-circle neutral">🎟️</div>
          <h2 className="sv-result-title">Ready to Scan</h2>
          <p className="sv-result-desc">No booking ID provided. Scan a valid ticket QR code at the seminar entrance.</p>
          <button onClick={() => setShowWalkIn(true)} className="sv-btn-sec">Walk-in / Not Registered</button>
        </div>
      </div>
    );
  }

  // Render 4: Fetch Error Case
  if (error) {
    return (
      <div className="sv-container">
        <div className="sv-card sv-red-card">
          <div className="sv-icon-circle red">✕</div>
          <h2 className="sv-result-title">Error</h2>
          <p className="sv-result-desc">{error}</p>
          <button onClick={handleScanNext} className="sv-btn-sec">Scan Next Ticket</button>
        </div>
      </div>
    );
  }

  // Render 5: Result States based on Apps Script Response
  if (result) {
    const isNotFound = !result.valid || result.status === 'not_found';
    const isAlreadyCheckedIn = result.status === 'already_checked_in';
    const isCheckedIn = result.status === 'checked_in';

    if (isNotFound) {
      return (
        <div className="sv-container">
          <div className="sv-card sv-red-card">
            <div className="sv-icon-circle red">✕</div>
            <h2 className="sv-result-title">Ticket Not Found</h2>
            <p className="sv-result-desc">This booking ID ({id}) doesn't match any registration. Verify manually.</p>
            <button onClick={handleScanNext} className="sv-btn-sec">Scan Next Ticket</button>
          </div>
        </div>
      );
    }

    if (isAlreadyCheckedIn) {
      const formattedTime = result.checkedInAt ? new Date(result.checkedInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'unknown time';
      const formattedDate = result.checkedInAt ? new Date(result.checkedInAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
      return (
        <div className="sv-container">
          <div className="sv-card sv-amber-card">
            <div className="sv-icon-circle amber">⚠️</div>
            <h2 className="sv-result-title">Already Checked In</h2>
            <p className="sv-checkin-time-badge">Checked in at {formattedDate} {formattedTime}</p>
            
            <div className="sv-details-section">
              <div className="sv-detail-row"><span className="sv-dl">Name:</span><span className="sv-dv">{result.name}</span></div>
              <div className="sv-detail-row"><span className="sv-dl">Category:</span><span className="sv-dv">{result.neetYear}</span></div>
              <div className="sv-detail-row"><span className="sv-dl">Seats:</span><span className="sv-dv">{result.seats} seat(s)</span></div>
              <hr className="sv-divider" />
              <div className="sv-detail-row"><span className="sv-dl">Seminar:</span><span className="sv-dv">{result.city} — {result.slot}</span></div>
              <div className="sv-detail-row"><span className="sv-dl">Venue:</span><span className="sv-dv">{result.venue}</span></div>
            </div>
            
            <button onClick={handleScanNext} className="sv-btn-sec">Scan Next Ticket</button>
          </div>
        </div>
      );
    }

    if (isCheckedIn) {
      return (
        <div className="sv-container">
          <div className="sv-card sv-green-card">
            <div className="sv-icon-circle green">✓</div>
            <h2 className="sv-result-title">Verified ✓</h2>
            <p className="sv-checkin-time-badge success">Checked in just now</p>

            <div className="sv-details-section">
              <div className="sv-detail-row"><span className="sv-dl">Name:</span><span className="sv-dv">{result.name}</span></div>
              <div className="sv-detail-row"><span className="sv-dl">Category:</span><span className="sv-dv">{result.neetYear}</span></div>
              <div className="sv-detail-row"><span className="sv-dl">Seats:</span><span className="sv-dv">{result.seats} seat(s)</span></div>
              <hr className="sv-divider" />
              <div className="sv-detail-row"><span className="sv-dl">Seminar:</span><span className="sv-dv">{result.city} — {result.slot}</span></div>
              <div className="sv-detail-row"><span className="sv-dl">Venue:</span><span className="sv-dv">{result.venue}</span></div>
            </div>

            {!dashToken && (
              <form onSubmit={handleScoreSubmit} className="sv-form">
                <input type="number" placeholder="NEET Score" required
                  value={neetScore} onChange={(e) => setNeetScore(e.target.value)} className="sv-pin-input" />
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="sv-pin-input">
                  {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={course} onChange={(e) => setCourse(e.target.value)} className="sv-pin-input">
                  {COURSE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {dashError && <p className="sv-error-text">{dashError}</p>}
                <button type="submit" disabled={dashSubmitting} className="sv-btn-primary">
                  {dashSubmitting ? 'Submitting…' : 'Submit Score'}
                </button>
              </form>
            )}

            {dashToken && (
              <a href={`https://asmicareer.in/dashboard.html?token=${encodeURIComponent(dashToken)}&mode=counsel`}
                 target="_blank" rel="noopener noreferrer" className="sv-btn-primary">
                View Report
              </a>
            )}

            <button onClick={handleScanNext} className="sv-btn-sec">Scan Next Ticket</button>
          </div>
        </div>
      );
    }
  }

  return null;
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="sv-container">
        <div className="sv-card sv-loading-card">
          <div className="sv-spinner" />
          <h2 className="sv-loading-title">Loading Page...</h2>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
