'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'

const resources = [
  {
    bg: 'linear-gradient(135deg,#1a237e 0%,#283593 100%)',
    emoji: '🧠',
    tagBg: '#3949ab', tagColor: '#ffffff', tag: 'ARTICLE',
    title: 'Mastering Focus in the Digital Age',
    body: 'Learn why multi-tasking is a myth and how to regain your deep focus hours without draining...',
    meta: '2000 words',
    cta: { label: 'Read more →', type: 'link' },
  },
  {
    bg: 'linear-gradient(135deg,#f5f5dc 0%,#e8f5e9 100%)',
    emoji: '📄',
    tagBg: '#FFD700', tagColor: '#1a0040', tag: 'DOWNLOAD',
    title: 'Study Planner Pro Template',
    body: 'A comprehensive weekly planner designed for university students to track the latest updates...',
    meta: 'PDF · 1.2 MB',
    cta: { label: 'Get it Now ↓', type: 'btn' },
  },
  {
    bg: 'linear-gradient(135deg,#e8f5e9 0%,#b2dfdb 100%)',
    emoji: '▶️',
    tagBg: '#00897b', tagColor: '#ffffff', tag: 'VIDEO',
    title: 'Mental Wellness for Students',
    body: 'A complete guide to navigating stress, anxiety, and burnout during final exam...',
    meta: '7 min 21 sec',
    cta: { label: 'Watch →', type: 'link' },
  },
]

export default function Resources() {
  const { ref, controls } = useScrollAnimation()

  return (
    <section style={{ background: '#ffffff', padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '40px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '28px', color: '#1a0040' }}>Resources</h2>
            <p style={{ fontSize: '13px', color: 'rgba(26,0,64,0.55)', marginTop: '6px', maxWidth: '480px', lineHeight: 1.6 }}>Access high-quality guides, research-backed articles, and downloadable templates curated for student success</p>
          </div>
          <a href="#" style={{ color: '#6a0dad', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', textDecoration: 'none', flexShrink: 0 }}>View all →</a>
        </div>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={staggerVariants}
          style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}
        >
          {resources.map(r => (
            <motion.div
              key={r.title}
              variants={staggerChildVariants}
              style={{ flex: 1, minWidth: '240px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(26,0,64,0.08)', cursor: 'pointer' }}
            >
              <div style={{ height: '180px', position: 'relative', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '48px', opacity: 0.4 }}>{r.emoji}</span>
                <span style={{ position: 'absolute', top: '12px', left: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '9px', letterSpacing: '1px', padding: '4px 10px', borderRadius: '20px', background: r.tagBg, color: r.tagColor }}>{r.tag}</span>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '15px', color: '#1a0040', marginBottom: '8px', lineHeight: 1.4 }}>{r.title}</div>
                <p style={{ fontSize: '12px', color: 'rgba(26,0,64,0.55)', lineHeight: 1.6, marginBottom: '16px' }}>{r.body}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(26,0,64,0.06)', paddingTop: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(26,0,64,0.4)' }}>{r.meta}</span>
                  {r.cta.type === 'btn'
                    ? <a href="#" style={{ background: '#FFD700', color: '#1a0040', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '12px', padding: '8px 18px', borderRadius: '50px', textDecoration: 'none' }}>{r.cta.label}</a>
                    : <a href="#" style={{ color: '#6a0dad', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>{r.cta.label}</a>
                  }
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  )
}
