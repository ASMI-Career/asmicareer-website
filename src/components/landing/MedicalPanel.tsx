'use client'

import { motion } from 'framer-motion'

interface MedicalPanelProps {
  clipPath: string
  isHovered: boolean
  otherHovered: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
  onClick: () => void
}

export default function MedicalPanel({
  clipPath,
  isHovered,
  otherHovered,
  onHoverStart,
  onHoverEnd,
  onClick,
}: MedicalPanelProps) {
  return (
    <motion.div
      onClick={onClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      animate={{
        scale: isHovered ? 1.02 : otherHovered ? 0.97 : 1,
        filter: isHovered
          ? 'brightness(1.08)'
          : otherHovered
          ? 'brightness(0.45)'
          : 'brightness(1)',
      }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: "url('/AIIMS_Delhi.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        clipPath: clipPath || 'none',
        zIndex: 2,
        cursor: 'pointer',
      }}
    >
      {/* Yellow wash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#FFD700', opacity: 0.82,
        pointerEvents: 'none',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg,rgba(26,0,64,0.15) 0%,transparent 60%)',
        pointerEvents: 'none',
      }} />
    </motion.div>
  )
}
