import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Passion_One } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from './language'
import { SiteFrame } from './site-frame'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111214',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nedk.cn/'),
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Xu Minda | Personal Website',
    template: '%s | Xu Minda',
  },
  description:
    'Robotics engineer exploring AI applications and practical software solutions.',
}

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

// Latin nickname only. Not Pricedown: that face needs a paid webfont license.
// Passion One is SIL OFL and may be embedded. See licenses/PassionOne-OFL.txt.
const nickname = Passion_One({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  fallback: ['Arial Narrow', 'Arial', 'sans-serif'],
  variable: '--font-nickname',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} ${nickname.variable} site-background tracking-tight antialiased`}
      >
        <ThemeProvider
          enableSystem={true}
          attribute="class"
          storageKey="theme"
          defaultTheme="system"
        >
          <LanguageProvider>
            <SiteFrame>{children}</SiteFrame>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
