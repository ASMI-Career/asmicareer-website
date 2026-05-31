'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'

const cards = [
  { exam: 'NEET UG', course: 'NEET UG', type: 'UG Counselling', price: '₹2,499', featured: false },
  { exam: 'NEET PG', course: 'NEET PG', type: 'PG Counselling', price: '₹3,999', featured: true },
  { exam: 'JEE', course: 'JEE', type: 'B.Tech Counselling', price: '₹3,999', featured: false },
  { exam: 'MBBS ABROAD', course: 'MBBS Abroad', type: 'Admission Guidance', price: '₹3,999', featured: false },
]

export default function Pricing() {
  const { ref, controls } = useScrollAnimation()
  const bannerAnim = useScrollAnimation()

  return (
    <section style={{ background: '#ffffff', padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ display: 'inline-block', background: '#FFD700', color: '#1a0040', fontFamily: 'var(--font-montserrat)', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', padding: '4px 16px', borderRadius: '20px', marginBottom: '16px' }}>SERVICES</span>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,2.5vw,36px)', color: '#1a0040' }}>Every Admission Path, Covered.</h2>
          <p style={{ fontSize: '14px', color: 'rgba(26,0,64,0.55)', marginTop: '10px' }}>From NEET to JEE to MBBS Abroad — expert support for every stream and every round.</p>
          <p style={{ fontSize: '14px', color: '#1a0040', fontWeight: 700, marginTop: '6px' }}>
            <span style={{ color: '#6a0dad' }}>Big</span> On Data. <span style={{ color: 'rgba(26,0,64,0.55)', fontWeight: 400 }}>Light</span> On Your Pocket.
          </p>
        </div>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={staggerVariants}
          style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}
        >
          {cards.map(c => (
            <motion.div
              key={c.exam}
              variants={staggerChildVariants}
              style={{ flex: 1, minWidth: '200px', borderRadius: '16px', padding: '28px', background: '#f8f6ff', border: c.featured ? '2px solid #6a0dad' : '1.5px solid rgba(106,13,173,0.08)', position: 'relative', cursor: 'pointer' }}
            >
              {c.featured && (
                <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#FFD700', color: '#1a0040', fontFamily: 'var(--font-montserrat)', fontSize: '9px', fontWeight: 800, letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap' }}>★ POPULAR</span>
              )}
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#6a0dad', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{c.exam}</div>
              <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '18px', color: '#1a0040' }}>{c.course}</div>
              <div style={{ fontSize: '13px', color: 'rgba(26,0,64,0.55)' }}>{c.type}</div>
              <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '36px', color: '#1a0040', margin: '20px 0' }}>{c.price}</div>
              <button style={{ width: '100%', padding: '13px', borderRadius: '50px', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '13px', ...(c.featured ? { border: 'none', background: 'linear-gradient(135deg,#6a0dad 0%,#9c27b0 100%)', color: '#ffffff' } : { border: '1.5px solid rgba(26,0,64,0.2)', background: 'transparent', color: '#1a0040' }) }}>
                Learn More
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Banner */}
        <motion.div
          ref={bannerAnim.ref}
          initial="hidden"
          animate={bannerAnim.controls}
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
          style={{ background: '#1a0040', borderRadius: '20px', padding: '52px 60px', textAlign: 'center', marginTop: '48px', borderTop: '4px solid #FFD700', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,3vw,48px)', color: '#FFD700', position: 'relative' }}>Take the first step.</div>
          <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '20px', color: 'rgba(255,255,255,0.8)', marginTop: '10px', position: 'relative' }}>Book a FREE 1-to-1 with an Asmi Counsellor.</div>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginTop: '16px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Talk to a real mentor in under 24 hours. No payment, no obligation — just clarity on what your future could look like.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '28px', flexWrap: 'wrap' }}>
            <a href="/inquiry" style={{ background: '#FFD700', color: '#1a0040', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', padding: '14px 32px', borderRadius: '50px', textDecoration: 'none', position: 'relative' }}>Book My Free Session →</a>
            <a href="#" style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', padding: '14px 32px', borderRadius: '50px', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.25)', position: 'relative' }}>WhatsApp Us 💬</a>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
