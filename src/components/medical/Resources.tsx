import ResourcesBase from '@/components/shared/ResourcesBase'
import { medicalData } from '@/data/medical'
import { medicalPalette } from '@/types'

export default function Resources() {
  return <ResourcesBase data={medicalData.resources} palette={medicalPalette} />
}
