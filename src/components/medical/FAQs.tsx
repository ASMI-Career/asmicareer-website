import FAQsBase from '@/components/shared/FAQsBase'
import { medicalData } from '@/data/medical'
import { medicalPalette } from '@/types'

export default function FAQs() {
  return <FAQsBase data={medicalData.faqs} palette={medicalPalette} />
}
