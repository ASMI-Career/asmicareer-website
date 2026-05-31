'use client'

import { motion } from 'framer-motion'

interface EngineeringPanelProps {
  clipPath: string
  isHovered: boolean
  otherHovered: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
  onClick: () => void
}

export default function EngineeringPanel({
  clipPath,
  isHovered,
  otherHovered,
  onHoverStart,
  onHoverEnd,
  onClick,
}: EngineeringPanelProps) {
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
        backgroundImage: "url('/IIT_Bombay.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        clipPath: clipPath || 'none',
        zIndex: 1,
        cursor: 'pointer',
      }}
    >
      {/* Dark wash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#0a1628', opacity: 0.88,
        pointerEvents: 'none',
      }} />

      {/* Circuit SVG overlay */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M 80 60 L 80 180 L 240 180" fill="none" stroke="rgba(0,200,180,0.12)" strokeWidth="1"/>
        <path d="M 320 40 L 320 120 L 480 120 L 480 240" fill="none" stroke="rgba(0,200,180,0.10)" strokeWidth="1"/>
        <path d="M 120 300 L 280 300 L 280 420 L 400 420" fill="none" stroke="rgba(0,200,180,0.08)" strokeWidth="1"/>
        <path d="M 60 450 L 60 560 L 200 560" fill="none" stroke="rgba(0,200,180,0.10)" strokeWidth="1"/>
        <circle cx="80" cy="180" r="3" fill="rgba(0,200,180,0.2)"/>
        <circle cx="320" cy="120" r="3" fill="rgba(0,200,180,0.2)"/>
        <circle cx="280" cy="300" r="3" fill="rgba(0,200,180,0.2)"/>
      </svg>
    </motion.div>
  )
}
