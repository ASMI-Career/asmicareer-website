'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'

const problems = [
  'Wrong Preference Order = Seat Lost Forever',
  'Deadlines Close in 24–72 Hours. No Mercy.',
  'Fake Agents Charging ₹5–10L for \'Guaranteed\' Seats',
]

const solutions = [
  'Algorithm-optimised preference list, submitted before deadline.',
  'WhatsApp alerts for every round deadline instantly.',
  'Only verified portals. No middlemen. Fixed transparent pricing.',
]

export default function ProblemSolution() {
  const leftAnim = useScrollAnimation()
  const rightAnim = useScrollAnimation()

  return (
    <section style={{ background: '#ffffff', padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(22px,2.5vw,36px)', color: '#1a0040', lineHeight: 1.2 }}>Students Fail Counselling — Before It Even Starts.</h2>
          <p style={{ fontSize: '15px', color: 'rgba(26,0,64,0.55)', marginTop: '12px' }}>Here's what goes wrong — and exactly how ASMI fixes it.</p>
        </div>

        <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', flexWrap: 'wrap' }}>

          {/* LEFT: Problems */}
          <motion.div
            ref={leftAnim.ref}
            initial="hidden"
            animate={leftAnim.controls}
            variants={staggerVariants}
            style={{ flex: '0 0 33%', width: '33%', paddingRight: '32px' }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: 'rgba(26,0,64,0.5)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#d32f2f' }}>●</span> THE PROBLEM
            </div>
            {problems.map((p, i) => (
              <motion.div key={i} variants={staggerChildVariants} style={{ display: 'flex', gap: '16px', marginBottom: '28px', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(26,0,64,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '14px', color: '#1a0040' }}>{i + 1}</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
                  <span style={{ flexShrink: 0, width: '3px', alignSelf: 'stretch', borderRadius: '2px', background: '#d32f2f', minHeight: '20px' }} />
                  <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', color: '#1a0040', lineHeight: 1.5 }}>{p}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CENTER: VS */}
          <div style={{ flex: '0 0 34%', width: '34%', position: 'relative', overflow: 'hidden', borderRadius: '16px', height: '420px', background: 'linear-gradient(160deg,#e8e0f5 0%,#c8b4e8 100%)' }}>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '56px', height: '56px', borderRadius: '50%', background: '#6a0dad', color: '#ffffff', fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(106,13,173,0.4)' }}>VS</div>
          </div>

          {/* RIGHT: Solutions */}
          <motion.div
            ref={rightAnim.ref}
            initial="hidden"
            animate={rightAnim.controls}
            variants={staggerVariants}
            style={{ flex: '0 0 33%', width: '33%', paddingLeft: '32px' }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: 'rgba(26,0,64,0.5)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#2e7d32' }}>●</span> THE SOLUTION
            </div>
            {solutions.map((s, i) => (
              <motion.div key={i} variants={staggerChildVariants} style={{ display: 'flex', gap: '16px', marginBottom: '28px', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', border: '2px solid rgba(46,125,50,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '14px', color: '#1a0040' }}>{i + 1}</span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1 }}>
                  <span style={{ flexShrink: 0, width: '3px', alignSelf: 'stretch', borderRadius: '2px', background: '#2e7d32', minHeight: '20px' }} />
                  <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', color: '#1a0040', lineHeight: 1.5 }}>{s}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
