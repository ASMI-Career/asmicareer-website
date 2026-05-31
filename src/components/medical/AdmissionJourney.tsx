'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'

const steps = [
  { num: '1', label: 'Cutoff Seminar', body: 'Understand real trends before you fill any preference.', style: 'gold' },
  { num: '2', label: '1-on-1 Strategy', body: 'Dedicated counsellor builds your personalised plan.', style: 'gold' },
  { num: '3', label: 'Smart Pref List', body: 'Algorithm-optimised preference list. Zero guesswork.', style: 'purple' },
  { num: '4', label: 'Final Admission', body: 'Support through to your reporting date.', style: 'purple' },
]

export default function AdmissionJourney() {
  const { ref, controls } = useScrollAnimation()

  return (
    <section style={{ background: '#1a0040', padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ fontSize: '20px' }}>🌱</div>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,2.5vw,36px)', color: '#FFD700', marginTop: '12px' }}>The ASMI Admission Journey</h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', marginTop: '10px' }}>4 phases from your rank to your admission letter.</p>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '28px', left: '11%', width: '28%', height: '2px', background: '#FFD700', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '28px', left: '50%', width: '28%', height: '2px', background: '#6a0dad', zIndex: 0 }} />

          <motion.div
            ref={ref}
            initial="hidden"
            animate={controls}
            variants={staggerVariants}
            style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '32px' }}
          >
            {steps.map((s, i) => (
              <motion.div
                key={s.label}
                variants={staggerChildVariants}
                transition={{ delay: i * 0.12 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '22%', minWidth: '160px' }}
              >
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%', fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1,
                  ...(s.style === 'gold' ? { background: '#FFD700', color: '#1a0040' } : { background: 'transparent', border: '2px solid #6a0dad', color: '#6a0dad' })
                }}>{s.num}</div>
                <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '15px', marginTop: '16px', color: s.style === 'gold' ? '#FFD700' : '#6a0dad' }}>{s.label}</div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.72)', marginTop: '8px', lineHeight: 1.5 }}>{s.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  )
}
