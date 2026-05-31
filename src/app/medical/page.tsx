import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Hero from '@/components/medical/Hero'
import ImportantEvents from '@/components/medical/ImportantEvents'
import TopUniversities from '@/components/medical/TopUniversities'
import ProblemSolution from '@/components/medical/ProblemSolution'
import WhyASMI from '@/components/medical/WhyASMI'
import AdmissionJourney from '@/components/medical/AdmissionJourney'
import Pricing from '@/components/medical/Pricing'
import Testimonials from '@/components/medical/Testimonials'
import Resources from '@/components/medical/Resources'
import FAQs from '@/components/medical/FAQs'

export const metadata: Metadata = {
  title: 'NEET Medical Counselling',
  description: 'Expert NEET UG counselling for MBBS, BDS, AYUSH admissions. 25,000+ students guided since 2016.',
  openGraph: {
    title: 'NEET Medical Counselling — ASMI Career',
    url: 'https://asmicareer.in/medical',
  }
}

export default function MedicalPage() {
  return (
    <>
      <Navbar variant="medical" />
      <Hero />
      <ImportantEvents />
      <TopUniversities />
      <ProblemSolution />
      <WhyASMI />
      <AdmissionJourney />
      <Pricing />
      <Testimonials />
      <Resources />
      <FAQs />
      <Footer />
    </>
  )
}
