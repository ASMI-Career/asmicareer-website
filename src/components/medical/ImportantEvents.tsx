import ImportantEventsBase from '@/components/shared/ImportantEventsBase'
import { medicalData } from '@/data/medical'
import { medicalPalette } from '@/types'

export default function ImportantEvents() {
  return <ImportantEventsBase data={medicalData.events} palette={medicalPalette} />
}
