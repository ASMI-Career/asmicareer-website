import HeroBase from '@/components/shared/HeroBase'
import { engineeringData } from '@/data/engineering'
import { engineeringPalette } from '@/types'

export default function Hero() {
  return <HeroBase data={engineeringData.hero} palette={engineeringPalette} />
}
