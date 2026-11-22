import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} site-background tracking-tight antialiased`}
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
