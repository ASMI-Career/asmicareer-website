import { useInView } from 'react-intersection-observer'
import { useAnimation } from 'framer-motion'
import { useEffect } from 'react'

export function useScrollAnimation(threshold = 0.15) {
  const controls = useAnimation()
  const [ref, inView] = useInView({ threshold, triggerOnce: true })

  useEffect(() => {
    if (inView) controls.start('visible')
  }, [controls, inView])

  return { ref, controls }
}

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number]

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease }
  }
}

export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' as const }
  }
}

export const staggerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    }
  }
}

export const staggerChildVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease }
  }
}
