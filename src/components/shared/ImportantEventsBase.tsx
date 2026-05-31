'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, staggerVariants, staggerChildVariants } from '@/hooks/useScrollAnimation'
import { PaletteConfig } from '@/types'
import { medicalData } from '@/data/medical'

type EventsData = typeof medicalData.events

interface Props {
  data: EventsData
  palette: PaletteConfig
}

export default function ImportantEventsBase({ data, palette }: Props) {
  const { ref, controls } = useScrollAnimation()
  const isEng = palette.primaryBg === '#0a1628'
  const sectionBg = isEng ? '#0a1628' : '#ffffff'
  const titleColor = isEng ? '#ffffff' : '#1a0040'
  const cardBg = isEng ? '#0f1f35' : '#fafafa'
  const cardBorder = isEng ? 'rgba(0,200,180,0.12)' : 'rgba(26,0,64,0.10)'
  const bodyColor = isEng ? 'rgba(255,255,255,0.55)' : 'rgba(26,0,64,0.6)'
  const headlineColor = isEng ? '#ffffff' : '#1a0040'
  const timeColor = isEng ? 'rgba(255,255,255,0.4)' : '#999'

  return (
    <section id="events" style={{ background: sectionBg, padding: '48px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '18px', color: titleColor }}>
            <span style={{ color: palette.accentColor }}>●</span>
            News and events
          </div>
          <a href="#" style={{ color: palette.accentColor, fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>View all →</a>
        </div>

        <motion.div ref={ref} initial="hidden" animate={controls} variants={staggerVariants} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {data.map(e => (
            <motion.div key={e.title} variants={staggerChildVariants} style={{ flex: 1, minWidth: '240px', background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '12px', padding: '20px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '9px', padding: '4px 10px', borderRadius: '20px', letterSpacing: '1px', background: e.tagBg, color: e.tagColor }}>{e.tag}</span>
                <span style={{ fontSize: '11px', color: timeColor }}>{e.time}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 800, fontSize: '14px', color: headlineColor, lineHeight: 1.4, marginBottom: '6px' }}>{e.title}</div>
              <p style={{ fontSize: '12px', color: bodyColor, lineHeight: 1.6 }}>{e.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
