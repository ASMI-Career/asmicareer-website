import ProblemSolutionBase from '@/components/shared/ProblemSolutionBase'
import { medicalData } from '@/data/medical'
import { medicalPalette } from '@/types'

export default function ProblemSolution() {
  return <ProblemSolutionBase data={medicalData.ps} palette={medicalPalette} />
}
