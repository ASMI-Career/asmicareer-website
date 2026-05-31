import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import '../globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-montserrat',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ASMI Career — Medical & Engineering Admissions',
  description: 'Expert NEET and JEE counselling. 40,000+ students guided since 2016.',
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} font-sans`} style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
