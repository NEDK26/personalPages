'use client'

import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { CONTENT, PROJECT_LINKS } from '../data'
import { useLanguage } from '../language'

const PROJECT_COVERS: Record<string, string> = {
  action: '/projects/zhixing.jpg',
  'free-agent': '/projects/freeagent.jpg',
  'keyboard-simulator': '/projects/keyboard-simulator.jpg',
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9cdfb]'

export default function ProjectCollection() {
  const { language } = useLanguage()
  const { projectCollection, projects, linkUnavailable } = CONTENT[language]

  return (
    <main className="mx-auto w-full max-w-[440px] px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] font-[family-name:var(--font-geist)] md:max-w-[480px] lg:py-12">
      <Link
        href="/#projects"
        className={`inline-flex items-center gap-2 rounded-sm text-sm text-[#b5bac1] hover:text-white ${focusRing}`}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {projectCollection.back}
      </Link>

      <h1 className="mt-5 text-2xl font-semibold text-white">{projectCollection.title}</h1>

      <ul className="mt-6 space-y-2">
        {projects.map((project) => {
          const links = PROJECT_LINKS[project.id]
          const cover = PROJECT_COVERS[project.id]
          const destinations = [
            { label: 'GitHub', href: links?.github },
            { label: 'Demo', href: links?.demo },
          ]

          return (
            <li key={project.id} className="flex items-start gap-3 rounded-2xl bg-[#1e1f22] p-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#2b2d31]">
                {cover && <Image alt="" src={cover} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-[15px] font-medium text-white">{project.name}</h2>
                <p className="mt-1 text-[13px] leading-5 text-[#b5bac1]">{project.description}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {destinations.map(({ label, href }) => (
                    href ? (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`rounded-md bg-white/5 px-2 py-1 text-xs text-[#dbdee1] hover:bg-white/10 ${focusRing}`}
                      >
                        {label}
                      </a>
                    ) : (
                      <span key={label} className="px-2 py-1 text-xs text-[#949ba4]">
                        {label} · {linkUnavailable}
                      </span>
                    )
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
