import PricingBase from '@/components/shared/PricingBase'
import { medicalData } from '@/data/medical'
import { medicalPalette } from '@/types'

export default function Pricing() {
  return <PricingBase data={medicalData.pricing} palette={medicalPalette} />
}
