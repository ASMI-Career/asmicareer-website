'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState(null); // 'medical' | 'engineering'
  const [logoPulse, setLogoPulse] = useState(false);

  const mCanvasRef = useRef(null);
  const eCanvasRef = useRef(null);
  const mContentRef = useRef(null);
  const eContentRef = useRef(null);

  // Trigger Medical Transition
  const handleMedicalClick = (e) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTransitionTarget('medical');
    setLogoPulse(true);

    // Fade out text contents
    if (mContentRef.current) mContentRef.current.style.opacity = '0';
    if (eContentRef.current) eContentRef.current.style.opacity = '0';

    setTimeout(() => {
      runMedicalAnimation();
    }, 500);
  };

  // Trigger Engineering Transition
  const handleEngineeringClick = (e) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTransitionTarget('engineering');
    setLogoPulse(true);

    // Fade out text contents
    if (mContentRef.current) mContentRef.current.style.opacity = '0';
    if (eContentRef.current) eContentRef.current.style.opacity = '0';

    setTimeout(() => {
      runEngineeringAnimation();
    }, 500);
  };

  // Medical Animation (DNA and circles)
  const runMedicalAnimation = () => {
    const canvas = mCanvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.style.display = 'block';
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    let startTime = null;
    const duration = 2200;
    let cells = [{ x: w / 2, y: h / 2, r: 55, vx: 0, vy: 0, gen: 0, color: 0 }];
    let lastSplit = 0;
    let pulses = [];
    let lastPulse = 0;

    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const t = elapsed / 1000;
      ctx.clearRect(0, 0, w, h);

      if (elapsed - lastPulse > 350) {
        pulses.push({ r: 0, maxR: Math.max(w, h) * 0.9, color: pulses.length % 2 });
        lastPulse = elapsed;
      }
      pulses = pulses.filter((p) => p.r < p.maxR);
      pulses.forEach((p) => {
        p.r += 6;
        const alpha = (1 - p.r / p.maxR) * 0.25;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, p.r, 0, Math.PI * 2);
        ctx.strokeStyle =
          p.color === 0 ? `rgba(106,13,173,${alpha})` : `rgba(255,215,0,${alpha * 1.4})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      });

      if (elapsed - lastSplit > 400 && cells.length < 32) {
        const newCells = [];
        cells.forEach((c) => {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.4 + Math.random() * 0.3;
          const gen = c.gen + 1;
          const r = 55 / Math.sqrt(gen + 1);
          newCells.push(
            { x: c.x, y: c.y, r, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, gen, color: gen % 2 },
            { x: c.x, y: c.y, r, vx: -Math.cos(angle) * speed, vy: -Math.sin(angle) * speed, gen, color: (gen + 1) % 2 }
          );
        });
        cells = newCells;
        lastSplit = elapsed;
      }

      cells.forEach((c) => {
        c.x += c.vx;
        c.y += c.vy;
        if (!(Math.abs(c.x - w / 2) < 90 && Math.abs(c.y - h / 2) < 60)) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, Math.max(c.r + Math.sin(t * 3) * 2, 3), 0, Math.PI * 2);
          ctx.fillStyle = c.color === 0 ? 'rgba(106,13,173,0.35)' : 'rgba(26,0,64,0.3)';
          ctx.fill();
        }
      });

      const progress = Math.min(elapsed / duration, 1);
      for (let i = 0; i < 45; i++) {
        const np = i / 45;
        if (np > progress) continue;
        const cy = h - np * h;
        if (Math.abs(cy - h / 2) < 70) continue;
        const angle = t * 1.2 + i * 0.28;
        const radius = 40 + np * 15;
        const x1 = w / 2 + Math.cos(angle) * radius;
        const x2 = w / 2 + Math.cos(angle + Math.PI) * radius;
        const z1 = Math.cos(angle);
        ctx.beginPath();
        ctx.moveTo(x1, cy);
        ctx.lineTo(x2, cy);
        ctx.strokeStyle = 'rgba(26,0,64,0.18)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x1, cy, z1 > 0 ? 7 : 4.5, 0, Math.PI * 2);
        ctx.fillStyle = z1 > 0 ? 'rgba(106,13,189,0.9)' : 'rgba(148,92,212,0.6)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, cy, z1 > 0 ? 4.5 : 7, 0, Math.PI * 2);
        ctx.fillStyle = z1 > 0 ? 'rgba(69,43,110,0.6)' : 'rgba(26,0,64,0.9)';
        ctx.fill();
      }

      if (elapsed < duration) {
        requestAnimationFrame(animate);
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        setLogoPulse(false);
        setTimeout(() => {
          router.push('/medical');
        }, 150);
      }
    }
    requestAnimationFrame(animate);
  };

  // Engineering Animation (Matrix rain)
  const runEngineeringAnimation = () => {
    const canvas = eCanvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.style.display = 'block';
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colW = 14;
    const colCount = Math.floor(w / colW);
    const drops = new Array(colCount).fill(1);
    const centerX = w / 2;
    const colDelays = Array.from(
      { length: colCount },
      (_, i) => (Math.abs(i * colW - centerX) / centerX) * 600
    );

    let startTime = null;

    function drawRain(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;

      ctx.fillStyle = 'rgba(10,22,40,0.13)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = '900 13px var(--font-montserrat), monospace';

      for (let i = 0; i < colCount; i++) {
        if (elapsed < colDelays[i]) continue;
        const x = i * colW;
        const y = drops[i] * colW;
        if (Math.abs(x - w / 2) < 90 && Math.abs(y - h / 2) < 60) {
          drops[i]++;
          continue;
        }
        ctx.fillStyle = drops[i] % 3 === 0 ? '#ffffff' : '#00C8B4';
        ctx.fillText(Math.random() > 0.5 ? '1' : '0', x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }

      if (elapsed < 1800) {
        requestAnimationFrame(drawRain);
      } else {
        ctx.fillStyle = '#0a1628';
        ctx.fillRect(0, 0, w, h);
        setLogoPulse(false);
        setTimeout(() => {
          router.push('/engineering');
        }, 150);
      }
    }
    requestAnimationFrame(drawRain);
  };

  return (
    <div className={styles.splitContainer}>
      <div className={styles.divider}></div>

      {/* Canvases */}
      <canvas ref={mCanvasRef} className={styles.globalCanvas}></canvas>
      <canvas ref={eCanvasRef} className={styles.engCanvas}></canvas>

      {/* Central Logo */}
      <div className={`${styles.centerLogo} ${logoPulse ? styles.logoPulse : ''}`}>
        <img src="/asmi-logo.png" alt="ASMI Career" />
      </div>

      {/* Transition Overlay */}
      {isTransitioning && transitionTarget === 'medical' && (
        <div style={{
          position: 'fixed', inset: 0, background: '#FFD700', zIndex: 50,
          transition: 'opacity 0.5s ease', pointerEvents: 'none'
        }} />
      )}
      {isTransitioning && transitionTarget === 'engineering' && (
        <div style={{
          position: 'fixed', inset: 0, background: '#0a1628', zIndex: 50,
          transition: 'opacity 0.4s ease', pointerEvents: 'none'
        }} />
      )}

      {/* Panels */}
      <div className={styles.split}>
        {/* Medical Panel */}
        <div className={styles.medical} onClick={handleMedicalClick}>
          <div className={styles.mWash}></div>
          <div className={styles.mVignette}></div>
          <div ref={mContentRef} className={styles.mContent}>
            <p className={styles.mEyebrow}>Medical</p>
            <h1 className={styles.mHeadline}>
              Every NEET Score<br />
              Deserves The<br />
              <span>Best College.</span>
            </h1>
            <p className={styles.mSub}>
              Guiding 25,000+ students to their dream medical
              seats through data-driven counselling.
            </p>
            <div className={styles.tags}>
              <span className={styles.mTag}>NEET UG</span>
              <span className={styles.mTag}>MBBS</span>
              <span className={styles.mTag}>BDS</span>
              <span className={styles.mTag}>AYUSH</span>
              <span className={styles.mTag}>BPTH</span>
            </div>
            <div className={styles.stats}>
              <div className={styles.mStat}>
                <span className={styles.statNum}>25K+</span>
                <span className={styles.statLbl}>Admissions</span>
              </div>
              <div className={styles.mStat}>
                <span className={styles.statNum}>11+</span>
                <span className={styles.statLbl}>Years Experience</span>
              </div>
              <div className={styles.mStat}>
                <span className={styles.statNum}>4.9★</span>
                <span className={styles.statLbl}>User Rating</span>
              </div>
            </div>
            <button className={styles.mCta} onClick={(e) => { e.stopPropagation(); handleMedicalClick(); }}>
              Start NEET Journey →
            </button>
          </div>
        </div>

        {/* Engineering Panel */}
        <div className={styles.engineering} onClick={handleEngineeringClick}>
          <div className={styles.eWash}></div>
          <svg className={styles.circuitSvg} xmlns="http://www.w3.org/2000/svg">
            <path d="M 80 60 L 80 180 L 240 180" fill="none" stroke="rgba(0,200,180,0.12)" strokeWidth="1" />
            <path d="M 320 40 L 320 120 L 480 120 L 480 240" fill="none" stroke="rgba(0,200,180,0.10)" strokeWidth="1" />
            <path d="M 120 300 L 280 300 L 280 420 L 400 420" fill="none" stroke="rgba(0,200,180,0.08)" strokeWidth="1" />
            <path d="M 60 450 L 60 560 L 200 560" fill="none" stroke="rgba(0,200,180,0.10)" strokeWidth="1" />
            <path d="M 350 350 L 500 350 L 500 480 L 580 480" fill="none" stroke="rgba(0,200,180,0.08)" strokeWidth="1" />
            <path d="M 100 600 L 260 600 L 260 700" fill="none" stroke="rgba(0,200,180,0.07)" strokeWidth="1" />
            <path d="M 420 500 L 420 620 L 560 620" fill="none" stroke="rgba(0,200,180,0.09)" strokeWidth="1" />
            <path d="M 180 720 L 360 720 L 360 800" fill="none" stroke="rgba(0,200,180,0.07)" strokeWidth="1" />
            <circle cx="80" cy="180" r="3" fill="rgba(0,200,180,0.2)" />
            <circle cx="320" cy="120" r="3" fill="rgba(0,200,180,0.2)" />
            <circle cx="280" cy="300" r="3" fill="rgba(0,200,180,0.2)" />
            <circle cx="480" cy="240" r="3" fill="rgba(0,200,180,0.2)" />
            <circle cx="60" cy="560" r="3" fill="rgba(0,200,180,0.2)" />
            <circle cx="500" cy="350" r="3" fill="rgba(0,200,180,0.2)" />
            <circle cx="260" cy="600" r="3" fill="rgba(0,200,180,0.2)" />
            <circle cx="420" cy="620" r="3" fill="rgba(0,200,180,0.2)" />
          </svg>
          <div ref={eContentRef} className={styles.eContent}>
            <p className={styles.eEyebrow}>Engineering</p>
            <h1 className={styles.eHeadline}>
              Engineering Counselling<br />
              Built Around <span>Your<br />
              Rank & Branch.</span>
            </h1>
            <p className={styles.eSub}>
              Guiding students to their dream engineering colleges
              and branches through data-driven counselling.
            </p>
            <div className={styles.tags}>
              <span className={styles.eTag}>JEE</span>
              <span className={styles.eTag}>MHT-CET</span>
              <span className={styles.eTag}>BITS</span>
              <span className={styles.eTag}>Manipal</span>
              <span className={styles.eTag}>VIT</span>
            </div>
            <div className={styles.stats}>
              <div className={styles.eStat}>
                <span className={styles.statNum}>10K+</span>
                <span className={styles.statLbl}>Admissions</span>
              </div>
              <div className={styles.eStat}>
                <span className={styles.statNum}>500+</span>
                <span className={styles.statLbl}>Colleges</span>
              </div>
              <div className={styles.eStat}>
                <span className={styles.statNum}>All India</span>
                <span className={styles.statLbl}>Reach</span>
              </div>
            </div>
            <button className={styles.eCta} onClick={(e) => { e.stopPropagation(); handleEngineeringClick(); }}>
              Find My Branch & College →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
