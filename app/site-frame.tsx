'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './footer'
import { Header } from './header'

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === '/' || pathname === '/projects') {
    return <div className="profile-canvas">{children}</div>
  }

  return (
    <div className="flex min-h-screen w-full flex-col font-[family-name:var(--font-inter-tight)]">
      <div className="relative mx-auto w-full max-w-screen-sm flex-1 px-4 pt-20">
        <Header />
        {children}
        <Footer />
      </div>
    </div>
  )
}
