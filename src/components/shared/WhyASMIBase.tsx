'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, fadeUpVariants, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'
import { PaletteConfig } from '@/types'
import { medicalData } from '@/data/medical'

type WhyData = typeof medicalData.why

interface Props {
  data: WhyData
  palette: PaletteConfig
}

export default function WhyASMIBase({ data, palette }: Props) {
  const { ref, controls } = useScrollAnimation()
  const cardAnim = useScrollAnimation()
  const isEng = palette.primaryBg === '#0a1628'
  const sectionBg = isEng ? '#0f1f35' : '#FFD700'
  const eyebrowBg = isEng ? palette.accentColor : '#1a0040'
  const eyebrowText = isEng ? '#0a1628' : '#FFD700'
  const headlineColor = isEng ? '#ffffff' : '#1a0040'
  const subColor = isEng ? 'rgba(255,255,255,0.6)' : 'rgba(26,0,64,0.65)'
  const iconBg = isEng ? 'rgba(0,200,180,0.1)' : 'rgba(26,0,64,0.08)'
  const featureTitleColor = isEng ? '#ffffff' : '#1a0040'
  const featureBodyColor = isEng ? 'rgba(255,255,255,0.55)' : 'rgba(26,0,64,0.6)'
  const overlayTagColor = isEng ? palette.accentColor : '#6a0dad'
  const overlayTitleColor = isEng ? '#0a1628' : '#1a0040'
  const overlaySubColor = isEng ? 'rgba(10,22,40,0.6)' : 'rgba(26,0,64,0.6)'

  return (
    <section style={{ background: sectionBg, padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', gap: '60px', alignItems: 'center', flexWrap: 'wrap' }}>

        <motion.div ref={ref} initial="hidden" animate={controls} variants={staggerVariants} style={{ flex: '0 0 45%', maxWidth: '45%' }}>
          <motion.span variants={staggerChildVariants} style={{ display: 'inline-block', background: eyebrowBg, color: eyebrowText, fontFamily: 'var(--font-montserrat)', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', padding: '4px 14px', borderRadius: '20px', marginBottom: '20px' }}>{data.eyebrow}</motion.span>
          <motion.h2 variants={staggerChildVariants} style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,2.5vw,36px)', color: headlineColor, lineHeight: 1.15, marginBottom: '12px' }}>{data.headline}</motion.h2>
          <motion.p variants={staggerChildVariants} style={{ fontSize: '14px', color: subColor, marginBottom: '36px' }}>{data.sub}</motion.p>

          <motion.div variants={staggerVariants} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {data.features.map(f => (
              <motion.div key={f.title} variants={staggerChildVariants} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, width: '44px', height: '44px', background: iconBg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{f.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', color: featureTitleColor }}>{f.title}</div>
                  <div style={{ fontSize: '13px', color: featureBodyColor, lineHeight: 1.6, marginTop: '3px' }}>{f.body}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div ref={cardAnim.ref} initial="hidden" animate={cardAnim.controls} variants={fadeUpVariants} style={{ flex: '0 0 55%', maxWidth: '55%', position: 'relative', borderRadius: '20px', overflow: 'hidden', height: '440px', background: data.overlayBg }}>
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', background: 'rgba(255,255,255,0.95)', borderRadius: '14px', padding: '18px 22px' }}>
            <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', color: overlayTagColor }}>{data.overlayTag}</div>
            <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '18px', color: overlayTitleColor, marginTop: '6px' }}>{data.overlayTitle}</div>
            <p style={{ fontSize: '12px', color: overlaySubColor, marginTop: '4px', marginBottom: '14px', lineHeight: 1.5 }}>{data.overlaySub}</p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a href="/inquiry" style={{ background: isEng ? palette.accentColor : '#1a0040', color: isEng ? '#0a1628' : '#ffffff', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '12px', padding: '10px 20px', borderRadius: '50px', textDecoration: 'none' }}>Book a Free Call 📞</a>
              <a href="#" style={{ background: isEng ? palette.darkColor : '#6a0dad', color: isEng ? '#00C8B4' : '#ffffff', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '12px', padding: '10px 20px', borderRadius: '50px', textDecoration: 'none' }}>Watch Video</a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
