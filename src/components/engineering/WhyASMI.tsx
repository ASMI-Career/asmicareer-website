import WhyASMIBase from '@/components/shared/WhyASMIBase'
import { engineeringData } from '@/data/engineering'
import { engineeringPalette } from '@/types'

export default function WhyASMI() {
  return <WhyASMIBase data={engineeringData.why} palette={engineeringPalette} />
}
