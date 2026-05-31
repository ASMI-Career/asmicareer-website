import AdmissionJourneyBase from '@/components/shared/AdmissionJourneyBase'
import { engineeringData } from '@/data/engineering'
import { engineeringPalette } from '@/types'

export default function AdmissionJourney() {
  return <AdmissionJourneyBase data={engineeringData.journey} palette={engineeringPalette} />
}
