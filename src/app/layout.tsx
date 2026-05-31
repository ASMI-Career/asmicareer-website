import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import './globals.css'
import WhatsAppButton from '@/components/WhatsAppButton'
import ScrollToTop from '@/components/ScrollToTop'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'ASMI Career — Medical & Engineering Admissions',
    template: '%s — ASMI Career',
  },
  description: 'Expert NEET and JEE counselling. 40,000+ students guided since 2016.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans`} suppressHydrationWarning>
        {children}
        <WhatsAppButton />
        <ScrollToTop />
      </body>
    </html>
  )
}
