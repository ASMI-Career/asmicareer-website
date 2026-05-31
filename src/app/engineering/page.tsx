import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ErrorBoundary from '@/components/ErrorBoundary'
import Hero from '@/components/engineering/Hero'
import ImportantEvents from '@/components/engineering/ImportantEvents'
import TopUniversities from '@/components/engineering/TopUniversities'
import ProblemSolution from '@/components/engineering/ProblemSolution'
import WhyASMI from '@/components/engineering/WhyASMI'
import AdmissionJourney from '@/components/engineering/AdmissionJourney'
import Pricing from '@/components/engineering/Pricing'
import Testimonials from '@/components/engineering/Testimonials'
import Resources from '@/components/engineering/Resources'
import FAQs from '@/components/engineering/FAQs'

export const metadata: Metadata = {
  title: 'JEE Engineering Counselling',
  description: 'Expert JEE and MHT-CET counselling for B.Tech admissions. 10,000+ students guided since 2016.',
  openGraph: {
    title: 'JEE Engineering Counselling — ASMI Career',
    url: 'https://asmicareer.in/engineering',
  }
}

export default function EngineeringPage() {
  return (
    <>
      <Navbar variant="engineering" />
      <ErrorBoundary>
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
      </ErrorBoundary>
      <Footer />
    </>
  )
}
