'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

interface CenterLogoProps {
  isPulsing: boolean
}

export default function CenterLogo({ isPulsing }: CenterLogoProps) {
  return (
    <motion.div
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        zIndex: 100,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      animate={isPulsing ? {
        x: '-50%',
        y: '-50%',
        scale: [1, 1.05, 1],
      } : {
        x: '-50%',
        y: '-50%',
        scale: 1,
      }}
      transition={isPulsing ? {
        scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
      } : {
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      <Image
        src="/asmi-logo.png"
        alt="ASMI Career"
        width={100}
        height={60}
        style={{ objectFit: 'contain' }}
        priority
      />
    </motion.div>
  )
}
