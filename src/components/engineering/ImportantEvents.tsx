import ImportantEventsBase from '@/components/shared/ImportantEventsBase'
import { engineeringData } from '@/data/engineering'
import { engineeringPalette } from '@/types'

export default function ImportantEvents() {
  return <ImportantEventsBase data={engineeringData.events} palette={engineeringPalette} />
}
