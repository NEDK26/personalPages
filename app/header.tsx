'use client'
import Link from 'next/link'
import { useLanguage } from './language'
import { CONTENT } from './data'

export function Header() {
  const { language, setLanguage } = useLanguage()
  const content = CONTENT[language]
  return (
    <header className="mb-8 flex items-center justify-between">
      <div>
        <Link href="/" className="font-medium text-black dark:text-white">
          {content.name}
        </Link>
        <p className="text-zinc-600 dark:text-zinc-400">
          {content.role}
        </p>
      </div>
      <div role="group" aria-label="Language / 语言" className="glass-switch flex gap-1 rounded-full p-1 text-xs">
        {(['en', 'zh'] as const).map((option) => <button key={option} type="button" lang={option === 'zh' ? 'zh-CN' : 'en'} aria-pressed={language === option} onClick={() => setLanguage(option)} className={`rounded-full px-3 py-1.5 transition-colors ${language === option ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white' : 'text-zinc-500'}`}>{option === 'en' ? 'EN' : '中文'}</button>)}
      </div>
    </header>
  )
}
