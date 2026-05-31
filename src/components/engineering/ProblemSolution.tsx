import ProblemSolutionBase from '@/components/shared/ProblemSolutionBase'
import { engineeringData } from '@/data/engineering'
import { engineeringPalette } from '@/types'

export default function ProblemSolution() {
  return <ProblemSolutionBase data={engineeringData.ps} palette={engineeringPalette} />
}
