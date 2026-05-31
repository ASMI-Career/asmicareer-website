'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'

const events = [
  { tag: 'ENGINEERING', tagBg: '#e8f0ff', tagColor: '#6a0dad', time: '2 hours ago', headline: 'JEE Advanced 2024 Registration Open', body: 'Last date to apply is May 7th, 2024. Don\'t miss the deadline.' },
  { tag: 'URGENT', tagBg: '#fff0f0', tagColor: '#d32f2f', time: '5 hours ago', headline: 'NEET UG Admit Card Released', body: 'Download your hall tickets now from the official website.' },
  { tag: 'MEDICAL', tagBg: '#f3e5ff', tagColor: '#6a0dad', time: 'Yesterday', headline: 'NEET Results Announcement', body: 'Results scheduled for the second week of June. Stay tuned.' },
]

export default function ImportantEvents() {
  const { ref, controls } = useScrollAnimation()

  return (
    <section id="events" style={{ background: '#ffffff', padding: '48px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '18px', color: '#1a0040' }}>
            <span style={{ color: '#6a0dad' }}>●</span>
            News and events
          </div>
          <a href="#" style={{ color: '#6a0dad', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>View all →</a>
        </div>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={staggerVariants}
          style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}
        >
          {events.map(e => (
            <motion.div
              key={e.headline}
              variants={staggerChildVariants}
              style={{ flex: 1, minWidth: '240px', background: '#fafafa', border: '1px solid rgba(26,0,64,0.10)', borderRadius: '12px', padding: '20px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '9px', padding: '4px 10px', borderRadius: '20px', letterSpacing: '1px', background: e.tagBg, color: e.tagColor }}>{e.tag}</span>
                <span style={{ fontSize: '11px', color: '#999' }}>{e.time}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', color: '#1a0040', lineHeight: 1.4, marginBottom: '6px' }}>{e.headline}</div>
              <p style={{ fontSize: '12px', color: 'rgba(26,0,64,0.6)', lineHeight: 1.6 }}>{e.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
