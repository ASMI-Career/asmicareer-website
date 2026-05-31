import HeroBase from '@/components/shared/HeroBase'
import { medicalData } from '@/data/medical'
import { medicalPalette } from '@/types'

export default function Hero() {
  return <HeroBase data={medicalData.hero} palette={medicalPalette} />
}
