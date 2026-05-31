import AdmissionJourneyBase from '@/components/shared/AdmissionJourneyBase'
import { medicalData } from '@/data/medical'
import { medicalPalette } from '@/types'

export default function AdmissionJourney() {
  return <AdmissionJourneyBase data={medicalData.journey} palette={medicalPalette} />
}
