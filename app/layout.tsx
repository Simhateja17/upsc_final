import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { AuthModalProvider } from '@/contexts/AuthModalContext'
import AuthModal from '@/components/AuthModal'
import { Cormorant_Garamond, DM_Sans, Sora, Playfair_Display, Inter, Merriweather } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant-garamond',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

const interFont = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter-rwj',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-merriweather',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'RiseWithJeet - UPSC Preparation Platform',
  description: 'India\'s #1 AI-Powered UPSC Platform. Trusted by 50,000+ aspirants preparing with AI-powered learning, daily MCQs practice, instant mains answer evaluation, expert mentorship, and smart revision tools.',
  keywords: 'UPSC, IAS, Civil Services, Exam Preparation, AI Learning, MCQs, Answer Evaluation',
  icons: {
    icon: [
      { url: '/risewithjeet_favicon.jpg', type: 'image/jpeg' },
    ],
    shortcut: '/risewithjeet_favicon.jpg',
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${dmSans.variable} ${sora.variable} ${playfair.variable} ${interFont.variable} ${merriweather.variable}`}>
        <AuthProvider>
          <AuthModalProvider>
            {children}
            <AuthModal />
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
