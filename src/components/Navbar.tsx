'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface NavbarProps {
  variant?: 'medical' | 'engineering' | 'default'
}

export default function Navbar({ variant = 'default' }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const ctaStyle = {
    medical: { bg: '#FFD700', text: '#1a0040' },
    engineering: { bg: '#00C8B4', text: '#0a1628' },
    default: { bg: '#FFD700', text: '#1a0040' },
  }[variant]

  const navLinks = [
    { label: 'Colleges', href: '/colleges' },
    { label: 'Counselling', href: '/counselling' },
    { label: 'Packages', href: '/packages' },
    { label: 'Services', href: '/services' },
    { label: 'News & Events', href: '/news' },
  ]

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: '#ffffff',
      boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
      fontFamily: 'var(--font-montserrat)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 32px',
        height: '72px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '32px',
      }}>

        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0 }}>
          <Image
            src="/asmi-logo.png"
            alt="ASMI Career"
            width={80}
            height={48}
            style={{ objectFit: 'contain' }}
            priority
          />
        </Link>

        {/* Search bar — desktop */}
        <div style={{
          flex: 1,
          maxWidth: '380px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }} className="hidden md:flex">
          <input
            type="text"
            placeholder="Search for colleges, exams, or courses"
            style={{
              width: '100%',
              padding: '10px 16px',
              paddingRight: '100px',
              borderRadius: '50px',
              border: '1.5px solid rgba(26,0,64,0.12)',
              fontSize: '13px',
              fontFamily: 'var(--font-montserrat)',
              fontWeight: 500,
              color: '#1a0040',
              outline: 'none',
              background: '#f8f6ff',
            }}
          />
          <button style={{
            position: 'absolute',
            right: '4px',
            background: '#FFD700',
            color: '#1a0040',
            fontWeight: 800,
            fontSize: '12px',
            padding: '7px 18px',
            borderRadius: '50px',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-montserrat)',
          }}>
            Search
          </button>
        </div>

        {/* Nav links — desktop */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
        }} className="hidden lg:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1a0040',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                opacity: 0.75,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.75')}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA button */}
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/book-session"
            style={{
              background: ctaStyle.bg,
              color: ctaStyle.text,
              fontWeight: 800,
              fontSize: '13px',
              padding: '12px 24px',
              borderRadius: '50px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-montserrat)',
              display: 'block',
            }}
          >
            Book free 1-on-1 session
          </Link>
        </motion.div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
          }}
          className="lg:hidden"
        >
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: 'block',
              width: '22px',
              height: '2px',
              background: '#1a0040',
              borderRadius: '2px',
              transition: 'all 0.3s',
            }} />
          ))}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: '#ffffff',
              borderTop: '1px solid rgba(26,0,64,0.08)',
              padding: '16px 32px 24px',
            }}
          >
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: 'block',
                  padding: '12px 0',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a0040',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(26,0,64,0.06)',
                }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/book-session"
              style={{
                display: 'block',
                marginTop: '16px',
                background: ctaStyle.bg,
                color: ctaStyle.text,
                fontWeight: 800,
                fontSize: '14px',
                padding: '14px 24px',
                borderRadius: '50px',
                textDecoration: 'none',
                textAlign: 'center',
              }}
              onClick={() => setMobileOpen(false)}
            >
              Book free 1-on-1 session
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
