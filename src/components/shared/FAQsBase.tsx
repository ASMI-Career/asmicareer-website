'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, fadeUpVariants } from '@/hooks/useScrollAnimation'
import { PaletteConfig } from '@/types'
import { medicalData } from '@/data/medical'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

type FAQsData = typeof medicalData.faqs

interface Props {
  data: FAQsData
  palette: PaletteConfig
}

export default function FAQsBase({ data, palette }: Props) {
  const { ref, controls } = useScrollAnimation()
  const isEng = palette.primaryBg === '#0a1628'
  const sectionBg = isEng ? '#0f1f35' : '#f8f6ff'
  const eyebrowBg = isEng ? palette.accentColor : '#FFD700'
  const eyebrowText = isEng ? '#0a1628' : '#1a0040'
  const headlineColor = isEng ? '#ffffff' : '#1a0040'
  const subColor = isEng ? 'rgba(255,255,255,0.55)' : 'rgba(26,0,64,0.55)'
  const itemBg = isEng ? '#0a1628' : '#ffffff'
  const itemBorder = isEng ? 'rgba(0,200,180,0.12)' : 'rgba(106,13,173,0.08)'
  const questionColor = isEng ? '#ffffff' : '#1a0040'
  const answerColor = isEng ? 'rgba(255,255,255,0.6)' : 'rgba(26,0,64,0.6)'
  const answerBorderColor = isEng ? 'rgba(0,200,180,0.08)' : 'rgba(106,13,173,0.06)'

  return (
    <section style={{ background: sectionBg, padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <motion.div ref={ref} initial="hidden" animate={controls} variants={fadeUpVariants} style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ display: 'inline-block', background: eyebrowBg, color: eyebrowText, fontFamily: 'var(--font-montserrat)', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', padding: '4px 16px', borderRadius: '20px', marginBottom: '16px' }}>FAQs</span>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,2.5vw,36px)', color: headlineColor }}>Frequently Asked</h2>
          <p style={{ fontSize: '14px', color: subColor, marginTop: '10px' }}>The questions every student and parent asks us first.</p>
        </motion.div>

        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <Accordion className="w-full">
            {data.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} style={{ background: itemBg, borderRadius: '12px', marginBottom: '12px', border: `1px solid ${itemBorder}`, overflow: 'hidden' }}>
                <AccordionTrigger style={{ padding: '20px 24px', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '15px', color: questionColor, textAlign: 'left' }}>
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent style={{ padding: '16px 24px 20px', fontSize: '13px', color: answerColor, lineHeight: 1.7, borderTop: `1px solid ${answerBorderColor}` }}>
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

      </div>
    </section>
  )
}
