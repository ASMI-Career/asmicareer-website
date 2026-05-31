import TopUniversitiesBase from '@/components/shared/TopUniversitiesBase'
import { medicalData } from '@/data/medical'
import { medicalPalette } from '@/types'

export default function TopUniversities() {
  return <TopUniversitiesBase data={medicalData.universities} palette={medicalPalette} />
}
