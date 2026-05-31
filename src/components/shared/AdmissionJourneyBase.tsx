'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'
import { PaletteConfig } from '@/types'
import { medicalData } from '@/data/medical'

type JourneyData = typeof medicalData.journey

interface Props {
  data: JourneyData
  palette: PaletteConfig
}

export default function AdmissionJourneyBase({ data, palette }: Props) {
  const { ref, controls } = useScrollAnimation()
  const isEng = palette.primaryBg === '#0a1628'
  const headlineColor = isEng ? palette.accentColor : '#FFD700'
  const subColor = isEng ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.55)'
  const goldCircleBg = isEng ? palette.accentColor : '#FFD700'
  const goldCircleText = isEng ? '#0a1628' : '#1a0040'
  const purpleCircleBorder = isEng ? palette.accentColor : '#6a0dad'
  const purpleCircleText = isEng ? palette.accentColor : '#6a0dad'
  const goldLabelColor = isEng ? palette.accentColor : '#FFD700'
  const purpleLabelColor = isEng ? 'rgba(0,200,180,0.7)' : '#6a0dad'

  return (
    <section style={{ background: data.bg, padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ fontSize: '20px' }}>{data.icon}</div>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,2.5vw,36px)', color: headlineColor, marginTop: '12px' }}>{data.headline}</h2>
          <p style={{ fontSize: '15px', color: subColor, marginTop: '10px' }}>{data.sub}</p>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '28px', left: '11%', width: '28%', height: '2px', background: goldCircleBg, zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '28px', left: '50%', width: '28%', height: '2px', background: purpleCircleBorder, zIndex: 0 }} />

          <motion.div ref={ref} initial="hidden" animate={controls} variants={staggerVariants} style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: '32px' }}>
            {data.steps.map((s, i) => (
              <motion.div key={s.label} variants={staggerChildVariants} transition={{ delay: i * 0.12 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '22%', minWidth: '160px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, ...(s.style === 'gold' ? { background: goldCircleBg, color: goldCircleText } : { background: 'transparent', border: `2px solid ${purpleCircleBorder}`, color: purpleCircleText }) }}>
                  {s.num}
                </div>
                <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '15px', marginTop: '16px', color: s.style === 'gold' ? goldLabelColor : purpleLabelColor }}>{s.label}</div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.72)', marginTop: '8px', lineHeight: 1.5 }}>{s.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </section>
  )
}
