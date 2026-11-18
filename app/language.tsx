'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Language = 'en' | 'zh'
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void }>({ language: 'en', setLanguage: () => {} })

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  useEffect(() => {
    const saved = localStorage.getItem('site-language')
    if (saved === 'zh' || saved === 'en') setLanguage(saved)
  }, [])
  useEffect(() => { document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en' }, [language])
  function changeLanguage(next: Language) {
    setLanguage(next)
    localStorage.setItem('site-language', next)
  }
  return <LanguageContext.Provider value={{ language, setLanguage: changeLanguage }}>{children}</LanguageContext.Provider>
}

export function useLanguage() { return useContext(LanguageContext) }
