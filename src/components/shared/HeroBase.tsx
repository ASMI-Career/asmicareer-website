'use client'

import { motion } from 'framer-motion'
import { staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'
import { PaletteConfig } from '@/types'
import { medicalData } from '@/data/medical'

type HeroData = typeof medicalData.hero

interface Props {
  data: HeroData
  palette: PaletteConfig
}

export default function HeroBase({ data, palette }: Props) {
  const isEng = palette.primaryBg === '#0a1628'
  const textPrimary = isEng ? '#ffffff' : palette.darkColor
  const textMuted = isEng ? 'rgba(255,255,255,0.65)' : 'rgba(26,0,64,0.65)'
  const statMuted = isEng ? 'rgba(255,255,255,0.5)' : 'rgba(26,0,64,0.55)'
  const cardBg = isEng ? '#0f2040' : '#ffffff'
  const innerBg = isEng ? 'rgba(0,200,180,0.06)' : '#f8f6ff'
  const titleColor = isEng ? '#00C8B4' : '#1a0040'
  const pillGrey = isEng ? 'rgba(255,255,255,0.08)' : '#f0f0f0'
  const pillGreyText = isEng ? 'rgba(255,255,255,0.6)' : '#555'
  const pillRightColor = isEng ? '#00C8B4' : '#1a0040'

  return (
    <section style={{ background: palette.primaryBg, minHeight: '88vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: '1360px', margin: '0 auto', padding: '60px 80px', display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>

        {/* LEFT */}
        <motion.div initial="hidden" animate="visible" variants={staggerVariants} style={{ flex: '0 0 55%', maxWidth: '55%' }}>
          <motion.div variants={staggerChildVariants} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: palette.accentColor, fontWeight: 700, fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: palette.accentColor, flexShrink: 0 }} />
            {data.eyebrow}
          </motion.div>

          <motion.h1 variants={staggerChildVariants} style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(34px,4.5vw,58px)', lineHeight: 1.1, color: textPrimary, letterSpacing: '-0.02em', marginBottom: '20px' }}>
            {data.headline} <span style={{ color: palette.accentColor }}>{data.accentWord}</span>
          </motion.h1>

          <motion.p variants={staggerChildVariants} style={{ fontSize: '14px', lineHeight: 1.7, color: textMuted, maxWidth: '480px', marginBottom: '32px' }}>
            {data.sub}
          </motion.p>

          <motion.div variants={staggerChildVariants} style={{ display: 'flex', gap: '40px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {data.stats.map(s => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '32px', lineHeight: 1, color: textPrimary, letterSpacing: '-0.02em' }}>{s.num}</span>
                <span style={{ fontSize: '11px', color: statMuted, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={staggerChildVariants} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <a href="#tools" style={{ display: 'inline-flex', alignItems: 'center', background: palette.accentColor, color: isEng ? '#0a1628' : '#ffffff', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', padding: '14px 28px', borderRadius: '50px', textDecoration: 'none' }}>
              {data.ctaPrimary}
            </a>
            <a href="#counselling" style={{ display: 'inline-flex', alignItems: 'center', background: palette.darkColor, color: isEng ? '#00C8B4' : '#FFD700', fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', padding: '14px 28px', borderRadius: '50px', textDecoration: 'none' }}>
              {data.ctaSecondary}
            </a>
          </motion.div>
        </motion.div>

        {/* RIGHT — Widget */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} style={{ flex: '0 0 45%', maxWidth: '45%' }}>
          <div style={{ background: cardBg, borderRadius: '20px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ background: pillGrey, color: pillGreyText, fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '11px', padding: '5px 12px', borderRadius: '20px' }}>{data.widget.pill}</span>
              <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '13px', color: pillRightColor }}>{data.widget.pillRight}</span>
            </div>

            <div style={{ background: innerBg, borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', color: titleColor }}>Your College Matches</span>
                <span style={{ background: palette.accentColor, color: isEng ? '#0a1628' : '#ffffff', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>AI · Live</span>
              </div>

              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: isEng ? 'rgba(255,255,255,0.4)' : '#999', letterSpacing: '1.5px', fontWeight: 700 }}>{data.widget.rankLabel}</div>
                <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '52px', lineHeight: 1, color: palette.accentColor, letterSpacing: '-0.02em' }}>{data.widget.rankNumber}</div>
                <div style={{ fontSize: '11px', color: isEng ? 'rgba(255,255,255,0.4)' : '#999', marginTop: '4px', fontWeight: 600, letterSpacing: '1px' }}>{data.widget.rankSub}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.widget.colleges.map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '12px', color: titleColor }}>{c.name}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: c.pillBg, color: c.pillColor, whiteSpace: 'nowrap' }}>{c.likelihood}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
              <span style={{ fontSize: '12px', color: isEng ? 'rgba(255,255,255,0.4)' : 'rgba(26,0,64,0.5)' }}>{data.widget.successLabel}</span>
              <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '13px', color: isEng ? '#00C8B4' : '#1a0040' }}>{data.widget.successValue}</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
