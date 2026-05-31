import TestimonialsBase from '@/components/shared/TestimonialsBase'
import { medicalData } from '@/data/medical'
import { medicalPalette } from '@/types'

export default function Testimonials() {
  return <TestimonialsBase data={medicalData.testimonials} palette={medicalPalette} />
}
