import ResourcesBase from '@/components/shared/ResourcesBase'
import { engineeringData } from '@/data/engineering'
import { engineeringPalette } from '@/types'

export default function Resources() {
  return <ResourcesBase data={engineeringData.resources} palette={engineeringPalette} />
}
