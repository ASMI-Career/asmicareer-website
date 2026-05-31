'use client'

import { useEffect } from 'react'

interface TearDividerProps {
  onPathsReady: (medD: string, engD: string) => void
}

const tearDeltas = [
  { dx: -6,  dy: 0    }, { dx: -8,  dy: 0.06 }, { dx: +3,  dy: 0.09 },
  { dx: -14, dy: 0.13 }, { dx: +1,  dy: 0.16 }, { dx: -17, dy: 0.20 },
  { dx: +6,  dy: 0.23 }, { dx: -20, dy: 0.29 }, { dx: +4,  dy: 0.33 },
  { dx: -16, dy: 0.39 }, { dx: +5,  dy: 0.43 }, { dx: -19, dy: 0.46 },
  { dx: +3,  dy: 0.52 }, { dx: -16, dy: 0.55 }, { dx: +7,  dy: 0.61 },
  { dx: -21, dy: 0.64 }, { dx: +2,  dy: 0.69 }, { dx: -18, dy: 0.72 },
  { dx: +5,  dy: 0.77 }, { dx: -22, dy: 0.81 }, { dx: +1,  dy: 0.86 },
  { dx: -17, dy: 0.89 }, { dx: +6,  dy: 0.94 }, { dx: -14, dy: 1.0  },
]

export function buildTearPaths(W: number, H: number) {
  const cx = W / 2
  const xs = tearDeltas.map(p => cx + p.dx)
  const ys = tearDeltas.map(p => p.dy * H)

  let medD = `M0,0 L${xs[0]},0`
  for (let i = 1; i < xs.length; i++) medD += ` L${xs[i]},${ys[i]}`
  medD += ` L0,${H} Z`

  let engD = `M${xs[0]},0 L${W},0 L${W},${H}`
  for (let i = xs.length - 1; i >= 0; i--) engD += ` L${xs[i]},${ys[i]}`
  engD += ' Z'

  return { medD, engD }
}

export default function TearDivider({ onPathsReady }: TearDividerProps) {
  useEffect(() => {
    function update() {
      const { medD, engD } = buildTearPaths(window.innerWidth, window.innerHeight)
      onPathsReady(medD, engD)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [onPathsReady])

  return null
}
