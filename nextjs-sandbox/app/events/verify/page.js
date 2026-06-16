'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import './verify.css';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySE02MPVvJobNKjT5NlAIazXAslEIdYz-yPXIKPiae7t3JNxpxcxAVneImTpNEzCvHhg/exec';
const STAFF_PIN = '2026';

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
    return (
      <div className="sv-container">
        <div className="sv-card sv-neutral-card">
          <div className="sv-icon-circle neutral">🎟️</div>
          <h2 className="sv-result-title">Ready to Scan</h2>
          <p className="sv-result-desc">No booking ID provided. Scan a valid ticket QR code at the seminar entrance.</p>
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
