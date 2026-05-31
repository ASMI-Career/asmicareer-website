import FAQsBase from '@/components/shared/FAQsBase'
import { engineeringData } from '@/data/engineering'
import { engineeringPalette } from '@/types'

export default function FAQs() {
  return <FAQsBase data={engineeringData.faqs} palette={engineeringPalette} />
}
