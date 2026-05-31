'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'

const universities = [
  { rating: '★ 3.8/5', location: 'Pune', type: 'Medical', name: 'Symbiosis Medical College for Women (SMCW)', recommended: false },
  { rating: '★ 4.8/5', location: 'Bangalore', type: 'Medical', name: 'Kasturba Medical College, Manipal', recommended: false },
  { rating: '★ 4.8/5', location: 'Mumbai', type: 'Medical', name: 'Grant Medical College & Sir J.J. Hospitals', recommended: true },
  { rating: '★ 4.8/5', location: 'Delhi', type: 'Medical', name: 'Maulana Azad Medical College', recommended: false },
]

export default function TopUniversities() {
  const trackRef = useRef<HTMLDivElement>(null)
  const { ref, controls } = useScrollAnimation()

  const scroll = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <section style={{ background: '#ffffff', padding: '60px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '22px', color: '#1a0040' }}>
            🔵 Top tier universities
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="#" style={{ color: '#6a0dad', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>View all →</a>
            {['‹', '›'].map((arrow, i) => (
              <button key={arrow} onClick={() => scroll(i === 0 ? -1 : 1)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid rgba(26,0,64,0.15)', background: '#ffffff', color: '#1a0040', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {arrow}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={staggerVariants}
          style={{ display: 'flex', gap: '20px', overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', overflow: 'hidden' }}
        >
          <div ref={trackRef} style={{ display: 'flex', gap: '20px', overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', width: '100%' }}>
            {universities.map(u => (
              <motion.div
                key={u.name}
                variants={staggerChildVariants}
                style={{ flex: '0 0 calc(25% - 15px)', background: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(26,0,64,0.08)', cursor: 'pointer' }}
              >
                <div style={{ height: '180px', position: 'relative', background: 'linear-gradient(135deg,#e8e0f5 0%,#d4c5f0 100%)' }}>
                  <span style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.92)', color: '#1a0040', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '11px', borderRadius: '20px', padding: '3px 10px' }}>{u.rating}</span>
                  <span style={{ position: 'absolute', bottom: '12px', right: '12px', color: 'rgba(26,0,64,0.4)', fontSize: '18px' }}>♡</span>
                  {u.recommended && (
                    <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: '#FFD700', color: '#1a0040', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '9px', letterSpacing: '0.5px', padding: '4px 10px', borderRadius: '4px' }}>★ ASMI RECOMMENDS</span>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '11px', color: 'rgba(26,0,64,0.5)', fontWeight: 600 }}>
                    <span>📍 {u.location}</span>
                    <span>🎓 {u.type}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', color: '#1a0040', lineHeight: 1.4 }}>{u.name}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
