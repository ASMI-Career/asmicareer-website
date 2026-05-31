import PricingBase from '@/components/shared/PricingBase'
import { engineeringData } from '@/data/engineering'
import { engineeringPalette } from '@/types'

export default function Pricing() {
  return <PricingBase data={engineeringData.pricing} palette={engineeringPalette} />
}
