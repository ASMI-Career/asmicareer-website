'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'
import { PaletteConfig } from '@/types'
import { medicalData } from '@/data/medical'

type UnisData = typeof medicalData.universities

interface Props {
  data: UnisData
  palette: PaletteConfig
}

export default function TopUniversitiesBase({ data, palette }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const { ref, controls } = useScrollAnimation()
  const isEng = palette.primaryBg === '#0a1628'
  const sectionBg = isEng ? '#0a1628' : '#ffffff'
  const titleColor = isEng ? '#ffffff' : '#1a0040'
  const cardBg = isEng ? '#0f1f35' : '#ffffff'
  const cardShadow = isEng ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(26,0,64,0.08)'
  const metaColor = isEng ? 'rgba(255,255,255,0.4)' : 'rgba(26,0,64,0.5)'
  const nameColor = isEng ? '#ffffff' : '#1a0040'
  const ratingBg = isEng ? 'rgba(0,200,180,0.15)' : 'rgba(255,255,255,0.92)'
  const ratingColor = isEng ? '#00C8B4' : '#1a0040'
  const arrowBorder = isEng ? 'rgba(0,200,180,0.2)' : 'rgba(26,0,64,0.15)'

  const scroll = (dir: number) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  return (
    <section style={{ background: sectionBg, padding: '60px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '22px', color: titleColor }}>
            🔵 Top tier universities
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="#" style={{ color: palette.accentColor, fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>View all →</a>
            {['‹', '›'].map((arrow, i) => (
              <button key={arrow} onClick={() => scroll(i === 0 ? -1 : 1)} style={{ width: '36px', height: '36px', borderRadius: '50%', border: `1.5px solid ${arrowBorder}`, background: 'transparent', color: isEng ? '#00C8B4' : '#1a0040', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {arrow}
              </button>
            ))}
          </div>
        </div>

        <motion.div ref={ref} initial="hidden" animate={controls} variants={staggerVariants}>
          <div ref={trackRef} style={{ display: 'flex', gap: '20px', overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', width: '100%' }}>
            {data.map(u => (
              <motion.div key={u.name} variants={staggerChildVariants} style={{ flex: '0 0 calc(25% - 15px)', background: cardBg, borderRadius: '16px', overflow: 'hidden', boxShadow: cardShadow, cursor: 'pointer', border: `1px solid ${palette.cardBorder}` }}>
                <div style={{ height: '180px', position: 'relative', background: isEng ? 'linear-gradient(135deg,#0f2040 0%,#1a3a5c 100%)' : 'linear-gradient(135deg,#e8e0f5 0%,#d4c5f0 100%)' }}>
                  <span style={{ position: 'absolute', top: '12px', left: '12px', background: ratingBg, color: ratingColor, fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '11px', borderRadius: '20px', padding: '3px 10px' }}>{u.rating}</span>
                  <span style={{ position: 'absolute', bottom: '12px', right: '12px', color: isEng ? 'rgba(255,255,255,0.3)' : 'rgba(26,0,64,0.4)', fontSize: '18px' }}>♡</span>
                  {u.recommended && (
                    <span style={{ position: 'absolute', bottom: '12px', left: '12px', background: palette.accentColor, color: isEng ? '#0a1628' : '#1a0040', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '9px', letterSpacing: '0.5px', padding: '4px 10px', borderRadius: '4px' }}>★ ASMI RECOMMENDS</span>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '11px', color: metaColor, fontWeight: 600 }}>
                    <span>📍 {u.city}</span>
                    <span>🎓 {u.stream}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', color: nameColor, lineHeight: 1.4 }}>{u.name}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
