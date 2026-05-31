'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'
import { PaletteConfig } from '@/types'
import { medicalData } from '@/data/medical'

type ResourcesData = typeof medicalData.resources

interface Props {
  data: ResourcesData
  palette: PaletteConfig
}

export default function ResourcesBase({ data, palette }: Props) {
  const { ref, controls } = useScrollAnimation()
  const isEng = palette.primaryBg === '#0a1628'
  const sectionBg = isEng ? '#0a1628' : '#ffffff'
  const headlineColor = isEng ? '#ffffff' : '#1a0040'
  const subColor = isEng ? 'rgba(255,255,255,0.5)' : 'rgba(26,0,64,0.55)'
  const cardBg = isEng ? '#0f1f35' : '#ffffff'
  const cardBorder = isEng ? 'rgba(0,200,180,0.12)' : 'rgba(26,0,64,0.08)'
  const titleColor = isEng ? '#ffffff' : '#1a0040'
  const bodyColor = isEng ? 'rgba(255,255,255,0.5)' : 'rgba(26,0,64,0.55)'
  const metaColor = isEng ? 'rgba(255,255,255,0.35)' : 'rgba(26,0,64,0.4)'
  const borderTopColor = isEng ? 'rgba(0,200,180,0.12)' : 'rgba(26,0,64,0.06)'

  return (
    <section style={{ background: sectionBg, padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', gap: '40px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '28px', color: headlineColor }}>Resources</h2>
            <p style={{ fontSize: '13px', color: subColor, marginTop: '6px', maxWidth: '480px', lineHeight: 1.6 }}>Access high-quality guides, research-backed articles, and downloadable templates curated for student success</p>
          </div>
          <a href="#" style={{ color: palette.accentColor, fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', textDecoration: 'none', flexShrink: 0 }}>View all →</a>
        </div>

        <motion.div ref={ref} initial="hidden" animate={controls} variants={staggerVariants} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {data.map(r => (
            <motion.div key={r.title} variants={staggerChildVariants} style={{ flex: 1, minWidth: '240px', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${cardBorder}`, background: cardBg, cursor: 'pointer' }}>
              <div style={{ height: '180px', position: 'relative', background: r.imgBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '48px', opacity: 0.4 }}>{r.emoji}</span>
                <span style={{ position: 'absolute', top: '12px', left: '12px', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '9px', letterSpacing: '1px', padding: '4px 10px', borderRadius: '20px', background: r.tagBg, color: r.tagColor }}>{r.tag}</span>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '15px', color: titleColor, marginBottom: '8px', lineHeight: 1.4 }}>{r.title}</div>
                <p style={{ fontSize: '12px', color: bodyColor, lineHeight: 1.6, marginBottom: '16px' }}>{r.body}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${borderTopColor}`, paddingTop: '14px' }}>
                  <span style={{ fontSize: '11px', color: metaColor }}>{r.meta}</span>
                  {r.ctaType === 'button'
                    ? <a href="#" style={{ background: isEng ? palette.accentColor : '#FFD700', color: isEng ? '#0a1628' : '#1a0040', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '12px', padding: '8px 18px', borderRadius: '50px', textDecoration: 'none' }}>{r.cta}</a>
                    : <a href="#" style={{ color: palette.accentColor, fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>{r.cta}</a>
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
