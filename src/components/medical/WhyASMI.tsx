import WhyASMIBase from '@/components/shared/WhyASMIBase'
import { medicalData } from '@/data/medical'
import { medicalPalette } from '@/types'

export default function WhyASMI() {
  return <WhyASMIBase data={medicalData.why} palette={medicalPalette} />
}
