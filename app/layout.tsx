import type { Metadata } from 'next'
import { Inter, Manrope, Roboto, Poppins } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['400', '500', '600', '700', '800'],
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
})

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
})

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'RiseWithJeet - UPSC Preparation Platform',
  description: 'India\'s #1 AI-Powered UPSC Platform. Trusted by 50,000+ aspirants preparing with AI-powered learning, daily MCQs practice, instant mains answer evaluation, expert mentorship, and smart revision tools.',
  keywords: 'UPSC, IAS, Civil Services, Exam Preparation, AI Learning, MCQs, Answer Evaluation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable} ${roboto.variable} ${poppins.variable}`}>{children}</body>
    </html>
  )
}
