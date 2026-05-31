'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'
import { PaletteConfig } from '@/types'
import { medicalData } from '@/data/medical'

type TestimonialsData = typeof medicalData.testimonials

interface Props {
  data: TestimonialsData
  palette: PaletteConfig
}

export default function TestimonialsBase({ data, palette }: Props) {
  const { ref, controls } = useScrollAnimation()
  const isEng = palette.primaryBg === '#0a1628'
  const sectionBg = isEng ? 'rgba(0,200,180,0.04)' : 'rgba(106,13,173,0.06)'
  const eyebrowBg = isEng ? 'rgba(0,200,180,0.12)' : '#f3e5ff'
  const eyebrowColor = isEng ? palette.accentColor : '#6a0dad'
  const headlineColor = isEng ? '#ffffff' : '#1a0040'
  const subColor = isEng ? 'rgba(255,255,255,0.55)' : 'rgba(26,0,64,0.55)'
  const cardBg = isEng ? '#0f1f35' : '#ffffff'
  const cardShadow = isEng ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(106,13,173,0.08)'
  const featuredBg = isEng ? palette.accentColor : '#1a0040'
  const featuredNameColor = isEng ? '#0a1628' : '#ffffff'
  const featuredTagColor = isEng ? 'rgba(10,22,40,0.7)' : 'rgba(255,215,0,0.85)'
  const featuredQuoteColor = isEng ? '#0a1628' : '#FFD700'
  const featuredBodyColor = isEng ? 'rgba(10,22,40,0.8)' : 'rgba(255,255,255,0.8)'
  const featuredAvatarBg = isEng ? 'rgba(10,22,40,0.15)' : 'rgba(255,215,0,0.15)'

  return (
    <section style={{ background: sectionBg, padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ display: 'inline-block', background: eyebrowBg, color: eyebrowColor, fontFamily: 'var(--font-montserrat)', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', padding: '4px 16px', borderRadius: '20px', marginBottom: '16px' }}>RESULTS</span>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,2.5vw,36px)', color: headlineColor }}>Real Students. Real {isEng ? 'Branches' : 'Seats'}.</h2>
          <p style={{ fontSize: '14px', color: subColor, marginTop: '10px' }}>Names, colleges — no vague praise.</p>
          <div style={{ fontSize: '20px', marginTop: '8px' }}>🍃</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {['#e8d5f5','#d4c5f0','#c8b4e8','#e8d5f5','#d4c5f0','#c8b4e8','#e8d5f5','#d4c5f0','#c8b4e8'].map((bg, i) => (
            <div key={i} style={{ width: '56px', height: '56px', borderRadius: '50%', background: isEng ? 'rgba(0,200,180,0.15)' : bg, border: i === 0 ? `3px solid ${palette.accentColor}` : '3px solid transparent', flexShrink: 0 }} />
          ))}
        </div>

        <motion.div ref={ref} initial="hidden" animate={controls} variants={staggerVariants} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {data.map(t => (
            <motion.div key={t.name} variants={staggerChildVariants} style={{ flex: 1, minWidth: '240px', borderRadius: '16px', padding: '28px', ...(t.featured ? { background: featuredBg, boxShadow: `0 12px 40px ${palette.accentColor}33`, transform: 'translateY(-6px)' } : { background: cardBg, boxShadow: cardShadow, border: `1px solid ${palette.cardBorder}` }) }}>
              <div style={{ color: '#FFD700', fontSize: '16px', marginBottom: '16px' }}>★★★★★</div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: t.featured ? featuredAvatarBg : (isEng ? 'rgba(0,200,180,0.15)' : '#e8d5f5'), flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', color: t.featured ? featuredNameColor : (isEng ? '#ffffff' : '#1a0040') }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: t.featured ? featuredTagColor : palette.accentColor, lineHeight: 1.5 }}>{t.edu}</div>
                  <div style={{ fontSize: '11px', color: t.featured ? featuredTagColor : palette.accentColor, lineHeight: 1.5 }}>{t.college}</div>
                </div>
              </div>
              <div style={{ color: t.featured ? featuredQuoteColor : palette.accentColor, fontSize: '28px', margin: '16px 0 8px', lineHeight: 1 }}>❝</div>
              <p style={{ fontSize: '13px', color: t.featured ? featuredBodyColor : (isEng ? 'rgba(255,255,255,0.7)' : 'rgba(26,0,64,0.7)'), lineHeight: 1.7 }}>"{t.quote}"</p>
            </motion.div>
          ))}
        </motion.div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '32px' }}>
          {['‹', '›'].map(arrow => (
            <button key={arrow} style={{ width: '40px', height: '40px', borderRadius: '50%', border: `1.5px solid ${palette.accentColor}33`, background: isEng ? '#0f1f35' : '#ffffff', color: palette.accentColor, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{arrow}</button>
          ))}
        </div>

      </div>
    </section>
  )
}
