import TopUniversitiesBase from '@/components/shared/TopUniversitiesBase'
import { engineeringData } from '@/data/engineering'
import { engineeringPalette } from '@/types'

export default function TopUniversities() {
  return <TopUniversitiesBase data={engineeringData.universities} palette={engineeringPalette} />
}
