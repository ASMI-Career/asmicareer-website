'use client'

import { motion } from 'framer-motion'
import { fadeUpVariants, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'

export default function Hero() {
  return (
    <section style={{ background: '#FFD700', minHeight: '88vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto', padding: '60px 80px', display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>

        {/* LEFT */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerVariants}
          style={{ flex: '0 0 55%', maxWidth: '55%' }}
        >
          <motion.div variants={staggerChildVariants} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6a0dad', fontWeight: 700, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6a0dad', flexShrink: 0 }} />
            INDIA'S SMARTEST YOUTH CAREER PLATFORM
          </motion.div>

          <motion.h1 variants={staggerChildVariants} style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(34px,4.5vw,58px)', lineHeight: 1.1, color: '#1a0040', letterSpacing: '-0.02em', marginBottom: '20px' }}>
            Asmi gives you the<br />
            seat you <span style={{ color: '#6a0dad' }}>deserve.</span>
          </motion.h1>

          <motion.p variants={staggerChildVariants} style={{ fontSize: '14px', lineHeight: 1.7, color: 'rgba(26,0,64,0.65)', maxWidth: '480px', marginBottom: '32px' }}>
            NEET &amp; JEE counselling by verified experts — a real counsellor who knows your file, from rank day to admission day. Zero guesswork.
          </motion.p>

          <motion.div variants={staggerChildVariants} style={{ display: 'flex', gap: '40px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {[['10+', 'Years of experience'], ['20k+', 'Admissions done!'], ['4.9 rating ★', 'on google reviews']].map(([num, lbl]) => (
              <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '32px', lineHeight: 1, color: '#1a0040', letterSpacing: '-0.02em' }}>{num}</span>
                <span style={{ fontSize: '11px', color: 'rgba(26,0,64,0.55)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{lbl}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={staggerChildVariants} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <a href="#tools" style={{ display: 'inline-flex', alignItems: 'center', background: '#6a0dad', color: '#ffffff', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', padding: '14px 28px', borderRadius: '50px', textDecoration: 'none' }}>
              Explore tools ↓
            </a>
            <a href="#counselling" style={{ display: 'inline-flex', alignItems: 'center', background: '#1a0040', color: '#FFD700', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', padding: '14px 28px', borderRadius: '50px', textDecoration: 'none' }}>
              How it works ↓
            </a>
          </motion.div>
        </motion.div>

        {/* RIGHT — Widget Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ flex: '0 0 45%', maxWidth: '45%' }}
        >
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', boxShadow: '0 20px 60px rgba(26,0,64,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ background: '#f0f0f0', color: '#555', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '11px', padding: '5px 12px', borderRadius: '20px' }}>Expert mentors</span>
              <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '13px', color: '#1a0040' }}>100+ Counsellors</span>
            </div>

            <div style={{ background: '#f8f6ff', borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', color: '#1a0040' }}>Your College Matches</span>
                <span style={{ background: '#6a0dad', color: '#ffffff', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', fontFamily: 'var(--font-montserrat)' }}>AI · Live</span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', letterSpacing: '1.5px', fontWeight: 700 }}>NEET RANK</div>
                <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '52px', lineHeight: 1, color: '#6a0dad', letterSpacing: '-0.02em' }}>2,847</div>
                <div style={{ fontSize: '11px', color: '#999', marginTop: '4px', fontWeight: 600, letterSpacing: '1px' }}>AIR · NEET UG 2026</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'AIIMS New Delhi', dot: '#4caf50', pill: 'Likely ✓', pillBg: '#e8f5e9', pillColor: '#2e7d32' },
                  { name: 'Maulana Azad Medical', dot: '#ffb300', pill: 'Possible', pillBg: '#fff8e1', pillColor: '#f57c00' },
                  { name: 'Grant Medical College', dot: '#2196f3', pill: 'Safe Seat', pillBg: '#e3f2fd', pillColor: '#1565c0' },
                ].map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '12px', color: '#1a0040' }}>{c.name}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: c.pillBg, color: c.pillColor, whiteSpace: 'nowrap' }}>{c.pill}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(26,0,64,0.5)' }}>Success rate</span>
              <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '13px', color: '#1a0040' }}>90%+ students</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
