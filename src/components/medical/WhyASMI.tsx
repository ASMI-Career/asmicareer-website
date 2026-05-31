'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, fadeUpVariants, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'
import type { Variants } from 'framer-motion'

const features = [
  { icon: '👤', title: 'Verified Counsellors', body: 'Credentialed, background-checked experts. No anonymous advisors.' },
  { icon: '🗄️', title: 'Official Data Only', body: 'Cutoffs pulled directly from MCC, JoSAA, and state portals. No guesswork.' },
  { icon: '🔔', title: 'Real-Time Alerts', body: 'WhatsApp updates to student and parent — every round, every deadline.' },
  { icon: '₹', title: 'Transparent Pricing', body: 'Fixed packages, fully documented. No hidden fees, no commissions.' },
]

export default function WhyASMI() {
  const { ref, controls } = useScrollAnimation()
  const cardAnim = useScrollAnimation()

  return (
    <section style={{ background: '#FFD700', padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>

        {/* LEFT */}
        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={staggerVariants}
          style={{ flex: '0 0 45%', maxWidth: '45%' }}
        >
          <motion.span variants={staggerChildVariants} style={{ display: 'inline-block', background: '#1a0040', color: '#FFD700', fontFamily: 'var(--font-montserrat)', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', padding: '4px 14px', borderRadius: '20px', marginBottom: '20px' }}>WHY ASMI</motion.span>
          <motion.h2 variants={staggerChildVariants} style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,2.5vw,36px)', color: '#1a0040', lineHeight: 1.15, marginBottom: '12px' }}>India's Most Trusted Admission Platform</motion.h2>
          <motion.p variants={staggerChildVariants} style={{ fontSize: '14px', color: 'rgba(26,0,64,0.65)', marginBottom: '36px' }}>11 years. 25,000+ seats. Here's what makes the difference.</motion.p>

          <motion.div variants={staggerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {features.map(f => (
              <motion.div key={f.title} variants={staggerChildVariants} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: '44px', height: '44px', background: 'rgba(26,0,64,0.08)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{f.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', color: '#1a0040' }}>{f.title}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(26,0,64,0.6)', lineHeight: 1.6, marginTop: '3px' }}>{f.body}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT */}
        <motion.div
          ref={cardAnim.ref}
          initial="hidden"
          animate={cardAnim.controls}
          variants={fadeUpVariants}
          style={{ flex: '0 0 55%', maxWidth: '55%', position: 'relative', borderRadius: '20px', overflow: 'hidden', height: '440px', background: 'linear-gradient(160deg,#1a0040 0%,#6a0dad 100%)' }}
        >
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', background: 'rgba(255,255,255,0.95)', borderRadius: '14px', padding: '18px 22px' }}>
            <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', color: '#6a0dad', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>●</span> CRACK THE NEXT STEP
            </div>
            <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '18px', color: '#1a0040', marginTop: '6px' }}>How ASMI helps students win</div>
            <p style={{ fontSize: '12px', color: 'rgba(26,0,64,0.6)', marginTop: '4px', marginBottom: '14px', lineHeight: 1.5 }}>See how we guide 25,000+ students through every step — from rank to reporting date.</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a href="/inquiry" style={{ background: '#1a0040', color: '#ffffff', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '12px', padding: '10px 20px', borderRadius: '50px', textDecoration: 'none' }}>Book a Free Call 📞</a>
              <a href="#" style={{ background: '#6a0dad', color: '#ffffff', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '12px', padding: '10px 20px', borderRadius: '50px', textDecoration: 'none' }}>Watch Video</a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
