'use client'

import { motion } from 'framer-motion'
import { useScrollAnimation, fadeUpVariants } from '@/hooks/useScrollAnimation'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const faqs = [
  {
    q: 'What is NEET counselling and how does ASMI help?',
    a: 'NEET counselling is the process of selecting and filling college preferences after your NEET result. ASMI assigns you a dedicated counsellor who builds your preference list, tracks deadlines, and guides you through every round — MCC AIQ, state quota, and deemed.',
  },
  {
    q: 'How is ASMI different from free YouTube advice?',
    a: 'YouTube gives general information. ASMI gives you a personalised strategy based on your specific rank, category, state, and target colleges — with a real counsellor accountable to your outcome.',
  },
  {
    q: 'Does ASMI cover both NEET UG and JEE?',
    a: 'Yes. ASMI has dedicated teams for NEET UG, NEET PG, JEE Main, JEE Advanced, MHT-CET, and MBBS Abroad counselling.',
  },
  {
    q: 'How much do your packages cost?',
    a: 'Packages start at ₹2,499 for basic counselling and go up to ₹3,999 for full-service end-to-end support. All pricing is fixed — no hidden charges.',
  },
  {
    q: 'What if I don\'t get a seat after paying?',
    a: 'We don\'t guarantee seats — no honest counsellor can. But we guarantee a complete, optimised strategy built around your rank. Most students who follow our preference list secure a seat in round 1 or 2.',
  },
  {
    q: 'Can parents stay updated throughout?',
    a: 'Yes. Parents receive WhatsApp updates at every stage — round results, deadline reminders, document checklists, and reporting date alerts.',
  },
]

export default function FAQs() {
  const { ref, controls } = useScrollAnimation()

  return (
    <section style={{ background: '#f8f6ff', padding: '72px 80px' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        <motion.div
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={fadeUpVariants}
          style={{ textAlign: 'center', marginBottom: '48px' }}
        >
          <span style={{ display: 'inline-block', background: '#FFD700', color: '#1a0040', fontFamily: 'var(--font-montserrat)', fontSize: '10px', fontWeight: 800, letterSpacing: '2px', padding: '4px 16px', borderRadius: '20px', marginBottom: '16px' }}>FAQs</span>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,2.5vw,36px)', color: '#1a0040' }}>Frequently Asked</h2>
          <p style={{ fontSize: '14px', color: 'rgba(26,0,64,0.55)', marginTop: '10px' }}>The questions every student and parent asks us first.</p>
        </motion.div>

        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <Accordion className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                style={{ background: '#ffffff', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(106,13,173,0.08)', overflow: 'hidden' }}
              >
                <AccordionTrigger style={{ padding: '20px 24px', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '15px', color: '#1a0040', textAlign: 'left' }}>
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent style={{ padding: '16px 24px 20px', fontSize: '13px', color: 'rgba(26,0,64,0.6)', lineHeight: 1.7, borderTop: '1px solid rgba(106,13,173,0.06)' }}>
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
