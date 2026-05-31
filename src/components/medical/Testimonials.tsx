'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'

const testimonials = [
  { name: 'Dr. Sarang Chaudhari', tag1: 'NEET UG 2024', tag2: 'AIIMS New Delhi', quote: 'ASMI\'s counsellor guided me through every round of MCC counselling. Got my first preference college.', featured: false },
  { name: 'Anannya Ayer', tag1: 'NEET UG 2024', tag2: 'Grant Medical College', quote: 'The preference list they built for me was perfect. Zero panic, all clarity from day one.', featured: true },
  { name: 'Dr. Pooja Kulkarni', tag1: 'NEET PG 2024', tag2: 'Kasturba Medical College', quote: 'Paid ₹3,999 and saved lakhs in wrong decisions. Best investment of my medical journey.', featured: false },
]

export default function Testimonials() {
  const { ref, controls } = useScrollAnimation()

  return (
    <section style={{ background: 'rgba(106,13,173,0.06)', padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ display: 'inline-block', background: '#f3e5ff', color: '#6a0dad', fontFamily: 'var(--font-montserrat)', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', padding: '4px 16px', borderRadius: '20px', marginBottom: '16px' }}>RESULTS</span>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,2.5vw,36px)', color: '#1a0040' }}>Real Students. Real Seats.</h2>
          <p style={{ fontSize: '14px', color: 'rgba(26,0,64,0.55)', marginTop: '10px' }}>Names, colleges — no vague praise.</p>
          <div style={{ fontSize: '20px', marginTop: '8px' }}>🍃</div>
        </div>

        {/* Avatar row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {['#e8d5f5','#d4c5f0','#c8b4e8','#e8d5f5','#d4c5f0','#c8b4e8','#e8d5f5','#d4c5f0','#c8b4e8'].map((bg, i) => (
            <div key={i} style={{ width: '56px', height: '56px', borderRadius: '50%', background: bg, border: i === 0 ? '3px solid #6a0dad' : '3px solid transparent', flexShrink: 0 }} />
          ))}
        </div>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={staggerVariants}
          style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              variants={staggerChildVariants}
              style={{
                flex: 1,
                minWidth: '240px',
                borderRadius: '16px',
                padding: '28px',
                ...(t.featured
                  ? { background: '#1a0040', boxShadow: '0 12px 40px rgba(26,0,64,0.25)', transform: 'translateY(-6px)' }
                  : { background: '#ffffff', boxShadow: '0 4px 20px rgba(106,13,173,0.08)' })
              }}
            >
              <div style={{ color: '#FFD700', fontSize: '16px', marginBottom: '16px' }}>★★★★★</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: t.featured ? 'rgba(255,215,0,0.15)' : '#e8d5f5', flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', color: t.featured ? '#ffffff' : '#1a0040' }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: t.featured ? 'rgba(255,215,0,0.85)' : '#6a0dad', lineHeight: 1.5 }}>{t.tag1}</div>
                  <div style={{ fontSize: '11px', color: t.featured ? 'rgba(255,215,0,0.85)' : '#6a0dad', lineHeight: 1.5 }}>{t.tag2}</div>
                </div>
              </div>
              <div style={{ color: t.featured ? '#FFD700' : '#6a0dad', fontSize: '28px', margin: '16px 0 8px', lineHeight: 1 }}>❝</div>
              <p style={{ fontSize: '13px', color: t.featured ? 'rgba(255,255,255,0.8)' : 'rgba(26,0,64,0.7)', lineHeight: 1.7 }}>"{t.quote}"</p>
            </motion.div>
          ))}
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '32px' }}>
          {['‹', '›'].map(arrow => (
            <button key={arrow} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid rgba(106,13,173,0.2)', background: '#ffffff', color: '#6a0dad', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{arrow}</button>
          ))}
        </div>

      </div>
    </section>
  )
}
