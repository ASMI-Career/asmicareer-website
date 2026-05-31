import TestimonialsBase from '@/components/shared/TestimonialsBase'
import { engineeringData } from '@/data/engineering'
import { engineeringPalette } from '@/types'

export default function Testimonials() {
  return <TestimonialsBase data={engineeringData.testimonials} palette={engineeringPalette} />
}
