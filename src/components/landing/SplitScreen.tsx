'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import MedicalPanel from './MedicalPanel'
import EngineeringPanel from './EngineeringPanel'
import CenterLogo from './CenterLogo'
import TearDivider, { buildTearPaths } from './TearDivider'

export default function SplitScreen() {
  const router = useRouter()
  const [medClipPath, setMedClipPath] = useState('')
  const [engClipPath, setEngClipPath] = useState('')
  const [hoveredSide, setHoveredSide] = useState<'medical' | 'engineering' | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [floodColor, setFloodColor] = useState<string | null>(null)
  const [isPulsing, setIsPulsing] = useState(false)
  const [showCanvas, setShowCanvas] = useState<'medical' | 'engineering' | null>(null)
  const medCanvasRef = useRef<HTMLCanvasElement>(null)
  const engCanvasRef = useRef<HTMLCanvasElement>(null)

  const handlePathsReady = useCallback((medD: string, engD: string) => {
    setMedClipPath(medD)
    setEngClipPath(engD)
  }, [])

  // Medical canvas animation
  const runMedicalAnimation = useCallback(() => {
    const canvas = medCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    let startTime: number | null = null
    const duration = 2200
    let cells = [{ x: w/2, y: h/2, r: 55, vx: 0, vy: 0, gen: 0, color: 0 }]
    let lastSplit = 0
    let pulses: Array<{r: number, maxR: number, color: number}> = []
    let lastPulse = 0

    function animate(ts: number) {
      if (!startTime) startTime = ts
      const elapsed = ts - startTime
      const t = elapsed / 1000
      ctx!.clearRect(0, 0, w, h)

      // Radial pulses
      if (elapsed - lastPulse > 350) {
        pulses.push({ r: 0, maxR: Math.max(w, h) * 0.9, color: pulses.length % 2 })
        lastPulse = elapsed
      }
      pulses = pulses.filter(p => p.r < p.maxR)
      pulses.forEach(p => {
        p.r += 6
        const alpha = (1 - p.r / p.maxR) * 0.25
        ctx!.beginPath()
        ctx!.arc(w/2, h/2, p.r, 0, Math.PI*2)
        ctx!.strokeStyle = p.color === 0
          ? `rgba(106,13,173,${alpha})`
          : `rgba(255,215,0,${alpha*1.4})`
        ctx!.lineWidth = 2.5
        ctx!.stroke()
      })

      // Cell division
      if (elapsed - lastSplit > 400 && cells.length < 32) {
        const newCells: typeof cells = []
        cells.forEach(c => {
          const angle = Math.random() * Math.PI * 2
          const speed = 0.4 + Math.random() * 0.3
          const gen = c.gen + 1
          const r = 55 / Math.sqrt(gen + 1)
          newCells.push(
            { x: c.x, y: c.y, r, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, gen, color: gen%2 },
            { x: c.x, y: c.y, r, vx: -Math.cos(angle)*speed, vy: -Math.sin(angle)*speed, gen, color: (gen+1)%2 }
          )
        })
        cells = newCells
        lastSplit = elapsed
      }
      cells.forEach(c => {
        c.x += c.vx
        c.y += c.vy
        if (!(Math.abs(c.x - w/2) < 90 && Math.abs(c.y - h/2) < 60)) {
          ctx!.beginPath()
          ctx!.arc(c.x, c.y, Math.max(c.r + Math.sin(t*3)*2, 3), 0, Math.PI*2)
          ctx!.fillStyle = c.color === 0 ? 'rgba(106,13,173,0.35)' : 'rgba(26,0,64,0.3)'
          ctx!.fill()
        }
      })

      // DNA helix
      const progress = Math.min(elapsed / duration, 1)
      for (let i = 0; i < 45; i++) {
        const np = i / 45
        if (np > progress) continue
        const cy = h - (np * h)
        if (Math.abs(cy - h/2) < 70) continue
        const angle = t * 1.2 + i * 0.28
        const radius = 40 + np * 15
        const x1 = w/2 + Math.cos(angle) * radius
        const x2 = w/2 + Math.cos(angle + Math.PI) * radius
        const z1 = Math.cos(angle)
        ctx!.beginPath(); ctx!.moveTo(x1, cy); ctx!.lineTo(x2, cy)
        ctx!.strokeStyle = 'rgba(26,0,64,0.18)'; ctx!.lineWidth = 2; ctx!.stroke()
        ctx!.beginPath(); ctx!.arc(x1, cy, z1>0?7:4.5, 0, Math.PI*2)
        ctx!.fillStyle = z1>0 ? 'rgba(106,13,189,0.9)' : 'rgba(148,92,212,0.6)'; ctx!.fill()
        ctx!.beginPath(); ctx!.arc(x2, cy, z1>0?4.5:7, 0, Math.PI*2)
        ctx!.fillStyle = z1>0 ? 'rgba(69,43,110,0.6)' : 'rgba(26,0,64,0.9)'; ctx!.fill()
      }

      if (elapsed < duration) {
        requestAnimationFrame(animate)
      } else {
        ctx!.fillStyle = '#ffffff'
        ctx!.fillRect(0, 0, w, h)
        setIsPulsing(false)
        setTimeout(() => router.push('/medical'), 150)
      }
    }
    requestAnimationFrame(animate)
  }, [router])

  // Engineering canvas animation
  const runEngineeringAnimation = useCallback(() => {
    const canvas = engCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const colW = 14
    const colCount = Math.floor(w / colW)
    const drops = new Array(colCount).fill(1)
    const centerX = w / 2
    const colDelays = Array.from({ length: colCount }, (_, i) =>
      (Math.abs(i * colW - centerX) / centerX) * 600
    )

    let startTime: number | null = null

    function drawRain(ts: number) {
      if (!startTime) startTime = ts
      const elapsed = ts - startTime

      ctx!.fillStyle = 'rgba(10,22,40,0.13)'
      ctx!.fillRect(0, 0, w, h)
      ctx!.font = '900 13px Montserrat, monospace'

      for (let i = 0; i < colCount; i++) {
        if (elapsed < colDelays[i]) continue
        const x = i * colW
        const y = drops[i] * colW
        if (Math.abs(x - w/2) < 90 && Math.abs(y - h/2) < 60) { drops[i]++; continue }
        ctx!.fillStyle = drops[i] % 3 === 0 ? '#ffffff' : '#00C8B4'
        ctx!.fillText(Math.random() > 0.5 ? '1' : '0', x, y)
        if (y > h && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }

      if (elapsed < 1800) {
        requestAnimationFrame(drawRain)
      } else {
        ctx!.fillStyle = '#0a1628'
        ctx!.fillRect(0, 0, w, h)
        setIsPulsing(false)
        setTimeout(() => router.push('/engineering'), 150)
      }
    }
    requestAnimationFrame(drawRain)
  }, [router])

  const handleMedicalClick = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setHoveredSide(null)
    setFloodColor('#FFD700')

    setTimeout(() => {
      setIsPulsing(true)
      setShowCanvas('medical')
      const canvas = medCanvasRef.current
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        runMedicalAnimation()
      }
    }, 500)
  }, [isTransitioning, runMedicalAnimation])

  const handleEngineeringClick = useCallback(() => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setHoveredSide(null)
    setFloodColor('#0a1628')

    setTimeout(() => {
      setIsPulsing(true)
      setShowCanvas('engineering')
      const canvas = engCanvasRef.current
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        runEngineeringAnimation()
      }
    }, 400)
  }, [isTransitioning, runEngineeringAnimation])

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Hidden SVG defs for clip paths */}
      <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <clipPath id="tearMed" clipPathUnits="userSpaceOnUse">
            <path d={medClipPath}/>
          </clipPath>
          <clipPath id="tearEng" clipPathUnits="userSpaceOnUse">
            <path d={engClipPath}/>
          </clipPath>
        </defs>
      </svg>

      {/* Tear paths builder */}
      <TearDivider onPathsReady={handlePathsReady} />

      {/* Medical panel */}
      <MedicalPanel
        clipPath="url(#tearMed)"
        isHovered={hoveredSide === 'medical'}
        otherHovered={hoveredSide === 'engineering'}
        onHoverStart={() => !isTransitioning && setHoveredSide('medical')}
        onHoverEnd={() => setHoveredSide(null)}
        onClick={handleMedicalClick}
      />

      {/* Engineering panel */}
      <EngineeringPanel
        clipPath="url(#tearEng)"
        isHovered={hoveredSide === 'engineering'}
        otherHovered={hoveredSide === 'medical'}
        onHoverStart={() => !isTransitioning && setHoveredSide('engineering')}
        onHoverEnd={() => setHoveredSide(null)}
        onClick={handleEngineeringClick}
      />

      {/* Medical content */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '50%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '56px 52px',
        zIndex: 20,
        pointerEvents: 'none',
        opacity: isTransitioning ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '2px', color: 'rgba(26,0,64,0.55)', marginBottom: '12px', textTransform: 'uppercase' }}>Medical</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(28px,3.5vw,52px)', lineHeight: 1.15, color: '#1a0040', margin: '0 0 16px' }}>
          Every NEET Score<br />Deserves The<br />
          <span style={{ color: '#6a0dad' }}>Best College.</span>
        </h1>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(26,0,64,0.65)', maxWidth: '400px', marginBottom: '20px' }}>
          Guiding 25,000+ students to their dream medical seats through data-driven counselling.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {['NEET UG', 'MBBS', 'BDS', 'AYUSH', 'BPTH'].map(tag => (
            <span key={tag} style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(26,0,64,0.1)', color: '#1a0040', border: '1px solid rgba(26,0,64,0.18)' }}>{tag}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '28px' }}>
          {[['25K+','Admissions'],['11+','Years Experience'],['4.9★','User Rating']].map(([num, label]) => (
            <div key={label}>
              <span style={{ display: 'block', fontSize: '32px', fontWeight: 900, color: '#1a0040', lineHeight: 1.1 }}>{num}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(26,0,64,0.5)' }}>{label}</span>
            </div>
          ))}
        </div>
        <a
          href="/medical"
          onClick={e => { e.preventDefault(); handleMedicalClick() }}
          style={{ display: 'inline-block', background: '#1a0040', color: '#FFD700', fontWeight: 800, fontSize: '14px', padding: '15px 36px', borderRadius: '50px', textDecoration: 'none', pointerEvents: 'auto', alignSelf: 'flex-start' }}
        >
          Start NEET Journey →
        </a>
      </div>

      {/* Engineering content */}
      <div style={{
        position: 'absolute',
        top: 0, right: 0,
        width: '50%', height: '100%',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        padding: '56px 52px 56px 80px',
        zIndex: 20,
        pointerEvents: 'none',
        opacity: isTransitioning ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '2px', color: 'rgba(0,200,180,0.7)', marginBottom: '12px', textTransform: 'uppercase' }}>Engineering</p>
        <h1 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 900, fontSize: 'clamp(24px,3vw,46px)', lineHeight: 1.15, color: '#ffffff', margin: '0 0 16px' }}>
          Engineering Counselling<br />Built Around
          <span style={{ color: '#00C8B4' }}> Your<br />Rank & Branch.</span>
        </h1>
        <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', maxWidth: '400px', marginBottom: '20px' }}>
          Guiding students to their dream engineering colleges and branches through data-driven counselling.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
          {['JEE', 'MHT-CET', 'BITS', 'Manipal', 'VIT'].map(tag => (
            <span key={tag} style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(0,200,180,0.1)', color: 'rgba(0,200,180,0.85)', border: '1px solid rgba(0,200,180,0.2)' }}>{tag}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '24px', marginBottom: '28px' }}>
          {[['10K+','Admissions'],['500+','Colleges'],['All India','Coverage']].map(([num, label]) => (
            <div key={label}>
              <span style={{ display: 'block', fontSize: '32px', fontWeight: 900, color: '#ffffff', lineHeight: 1.1 }}>{num}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
            </div>
          ))}
        </div>
        <a
          href="/engineering"
          onClick={e => { e.preventDefault(); handleEngineeringClick() }}
          style={{ display: 'inline-block', background: '#00A896', color: '#ffffff', fontWeight: 800, fontSize: '14px', padding: '15px 36px', borderRadius: '50px', textDecoration: 'none', pointerEvents: 'auto', alignSelf: 'flex-start' }}
        >
          Find My Branch & College →
        </a>
      </div>

      {/* Center logo */}
      <CenterLogo isPulsing={isPulsing} />

      {/* Flood overlay */}
      <AnimatePresence>
        {floodColor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              inset: 0,
              background: floodColor,
              zIndex: 50,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      {/* Medical canvas */}
      <canvas
        ref={medCanvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99,
          display: showCanvas === 'medical' ? 'block' : 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Engineering canvas */}
      <canvas
        ref={engCanvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99,
          display: showCanvas === 'engineering' ? 'block' : 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
