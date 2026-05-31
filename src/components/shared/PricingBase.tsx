'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'
import { PaletteConfig } from '@/types'
import { medicalData } from '@/data/medical'

type PricingData = typeof medicalData.pricing

interface Props {
  data: PricingData
  palette: PaletteConfig
}

export default function PricingBase({ data, palette }: Props) {
  const { ref, controls } = useScrollAnimation()
  const bannerAnim = useScrollAnimation()
  const isEng = palette.primaryBg === '#0a1628'
  const sectionBg = isEng ? '#0a1628' : '#ffffff'
  const headlineColor = isEng ? '#ffffff' : '#1a0040'
  const subColor = isEng ? 'rgba(255,255,255,0.55)' : 'rgba(26,0,64,0.55)'
  const cardBg = isEng ? '#0f1f35' : '#f8f6ff'
  const examColor = palette.accentColor
  const courseColor = isEng ? '#ffffff' : '#1a0040'
  const priceColor = isEng ? '#ffffff' : '#1a0040'
  const typeColor = isEng ? 'rgba(255,255,255,0.5)' : 'rgba(26,0,64,0.55)'
  const btnDefaultStyle = isEng
    ? { border: `1.5px solid ${palette.accentColor}`, background: 'transparent', color: palette.accentColor }
    : { border: '1.5px solid rgba(26,0,64,0.2)', background: 'transparent', color: '#1a0040' }
  const bannerBg = isEng
    ? 'linear-gradient(135deg,#00A896 0%,#0097A7 50%,#00695C 100%)'
    : '#1a0040'
  const bannerBorderTop = isEng ? palette.accentColor : '#FFD700'
  const bannerHeadColor = isEng ? '#ffffff' : '#FFD700'

  return (
    <section style={{ background: sectionBg, padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ display: 'inline-block', background: isEng ? palette.accentColor : '#FFD700', color: isEng ? '#0a1628' : '#1a0040', fontFamily: 'var(--font-montserrat)', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', padding: '4px 16px', borderRadius: '20px', marginBottom: '16px' }}>{data.eyebrow}</span>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,2.5vw,36px)', color: headlineColor }}>{data.headline}</h2>
          <p style={{ fontSize: '14px', color: subColor, marginTop: '10px' }}>{data.sub}</p>
        </div>

        <motion.div ref={ref} initial="hidden" animate={controls} variants={staggerVariants} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {data.cards.map(c => (
            <motion.div key={c.exam} variants={staggerChildVariants} style={{ flex: 1, minWidth: '200px', borderRadius: '16px', padding: '28px', background: cardBg, border: c.featured ? `2px solid ${palette.accentColor}` : `1.5px solid ${palette.cardBorder}`, position: 'relative', cursor: 'pointer' }}>
              {c.featured && (
                <span style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: isEng ? palette.accentColor : '#FFD700', color: isEng ? '#0a1628' : '#1a0040', fontFamily: 'var(--font-montserrat)', fontSize: '9px', fontWeight: 800, letterSpacing: '1px', padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap' }}>★ POPULAR</span>
              )}
              <div style={{ fontSize: '11px', fontWeight: 700, color: examColor, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{c.exam}</div>
              <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '18px', color: courseColor }}>{c.course}</div>
              <div style={{ fontSize: '13px', color: typeColor }}>{c.type}</div>
              <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '36px', color: priceColor, margin: '20px 0' }}>{c.price}</div>
              <button style={{ width: '100%', padding: '13px', borderRadius: '50px', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '13px', ...(c.featured ? { border: 'none', background: `linear-gradient(135deg,${palette.accentColor} 0%,${palette.secondaryAccent} 100%)`, color: isEng ? '#0a1628' : '#ffffff' } : btnDefaultStyle) }}>
                Learn More
              </button>
            </motion.div>
          ))}
        </motion.div>

        <motion.div ref={bannerAnim.ref} initial="hidden" animate={bannerAnim.controls} variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }} style={{ background: bannerBg, borderRadius: '20px', padding: '52px 60px', textAlign: 'center', marginTop: '48px', borderTop: `4px solid ${bannerBorderTop}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,3vw,48px)', color: bannerHeadColor, position: 'relative' }}>{data.banner.headline}</div>
          <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '20px', color: 'rgba(255,255,255,0.8)', marginTop: '10px', position: 'relative' }}>{data.banner.sub}</div>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginTop: '16px', maxWidth: '560px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>{data.banner.body}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '28px', flexWrap: 'wrap' }}>
            <a href="/inquiry" style={{ background: isEng ? palette.accentColor : '#FFD700', color: isEng ? '#0a1628' : '#1a0040', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', padding: '14px 32px', borderRadius: '50px', textDecoration: 'none' }}>{data.banner.cta1}</a>
            <a href="#" style={{ background: 'transparent', color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', padding: '14px 32px', borderRadius: '50px', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.25)' }}>{data.banner.cta2}</a>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
