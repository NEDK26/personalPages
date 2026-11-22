'use client'

import { motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { CONTENT, EMAIL, PROJECT_LINKS, SOCIAL_LINKS } from './data'
import { useLanguage } from './language'

const PROJECT_COVERS: Record<string, string> = {
  action: '/projects/zhixing.jpg',
  'free-agent': '/projects/freeagent.jpg',
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9cdfb]'

function publicHandle(url: string) {
  try {
    return new URL(url).pathname.split('/').filter(Boolean)[0] || url
  } catch {
    return url
  }
}

function projectDestinations(id: string) {
  const links = PROJECT_LINKS[id]
  if (!links) return []
  return [
    links.github ? { href: links.github, label: 'GitHub' } : null,
    links.demo ? { href: links.demo, label: 'Demo' } : null,
  ].filter((item): item is { href: string; label: string } => item !== null)
}

export function ProfileHome() {
  const { language, setLanguage } = useLanguage()
  const content = CONTENT[language]
  const reduceMotion = useReducedMotion()
  const initial = content.name.slice(0, 1)

  return (
    <motion.main
      className="mx-auto w-full max-w-[480px] px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] font-[family-name:var(--font-geist)] lg:max-w-5xl lg:px-8 lg:py-12"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
    >
      <div className="lg:grid lg:grid-cols-[24rem_minmax(0,1fr)] lg:items-start lg:gap-x-16">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="grid size-[92px] shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_30%_24%,#4a4e5a_0%,#2a2c33_46%,#16171b_100%)] text-[34px] leading-none font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
            >
              {initial}
            </div>
            <p className="min-w-0 flex-1 rounded-2xl bg-[#1e1f22] px-3.5 py-3 text-[14px] leading-5 text-[#dbdee1]">
              {content.intro}
            </p>
          </div>

          <h1 className="mt-4 text-[22px] leading-7 font-semibold tracking-tight text-white">
            {content.name}
          </h1>

          <div className="mt-1 flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`truncate text-sm font-medium text-[#b5bac1] underline-offset-2 hover:text-white hover:underline ${focusRing}`}
                >
                  {publicHandle(link.link)}
                  <span className="ml-1.5 font-normal text-[#949ba4]">
                    {link.label}
                  </span>
                </a>
              ))}
            </div>
            <div
              role="group"
              aria-label="Language / 语言"
              className="flex shrink-0 items-center gap-1.5 text-[13px]"
            >
              {(['en', 'zh'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  lang={option === 'zh' ? 'zh-CN' : 'en'}
                  aria-pressed={language === option}
                  onClick={() => setLanguage(option)}
                  className={`cursor-pointer rounded px-1.5 py-1 ${focusRing} ${
                    language === option
                      ? 'font-medium text-white'
                      : 'text-[#949ba4] hover:text-[#dbdee1]'
                  }`}
                >
                  {option === 'en' ? 'EN' : '中文'}
                </button>
              ))}
            </div>
          </div>

          <a
            href={`mailto:${EMAIL}`}
            className={`mt-4 flex h-11 w-full items-center justify-center rounded-lg bg-[#5865f2] text-[15px] font-medium text-white transition-colors hover:bg-[#4752c4] active:bg-[#3c45a5] ${focusRing}`}
          >
            {content.connect}
          </a>
          <p className="mt-2.5 text-[13px] leading-5 text-[#949ba4]">
            {content.contact}{' '}
            <a
              href={`mailto:${EMAIL}`}
              className={`text-[#dbdee1] underline-offset-2 hover:underline ${focusRing}`}
            >
              {EMAIL}
            </a>
          </p>
        </div>

        <div className="min-w-0">
          <section className="mt-7 lg:mt-0" aria-labelledby="profile-projects">
            <h2
              id="profile-projects"
              className="mb-2.5 text-[13px] font-medium text-[#949ba4]"
            >
              {content.projectsLabel}
            </h2>
            <div className="space-y-2">
              {content.projects.map((project) => {
                const destinations = projectDestinations(project.id)
                const cover = PROJECT_COVERS[project.id]
                const body = (
                  <>
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-[#2b2d31]">
                      {cover ? (
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="truncate text-[15px] font-medium text-white">
                          {project.name}
                        </h3>
                        {destinations.length === 1 ? (
                          <span className="shrink-0 text-xs text-[#949ba4]">
                            {destinations[0].label}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-[13px] leading-5 text-pretty text-[#b5bac1]">
                        {project.description}
                      </p>
                      {destinations.length > 1 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {destinations.map((destination) => (
                            <a
                              key={destination.label}
                              href={destination.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`rounded-md bg-white/5 px-2 py-1 text-xs text-[#dbdee1] hover:bg-white/10 ${focusRing}`}
                            >
                              {destination.label}
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </>
                )
                const cardClass = `flex items-start gap-3 rounded-2xl bg-[#1e1f22] p-3 transition-colors ${
                  destinations.length === 1
                    ? `hover:bg-[#232428] active:bg-[#2a2c33] ${focusRing}`
                    : ''
                }`

                if (destinations.length === 1) {
                  return (
                    <a
                      key={project.id}
                      href={destinations[0].href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardClass}
                    >
                      {body}
                    </a>
                  )
                }

                return (
                  <div key={project.id} className={cardClass}>
                    {body}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-6" aria-labelledby="profile-blog">
            <h2
              id="profile-blog"
              className="mb-2.5 text-[13px] font-medium text-[#949ba4]"
            >
              {content.blogLabel}
            </h2>
            {content.blog.length > 0 ? (
              <div className="space-y-2">
                {content.blog.map((post) => (
                  <Link
                    key={post.uid}
                    href={post.link}
                    className={`block rounded-2xl bg-[#1e1f22] px-3.5 py-3 transition-colors hover:bg-[#232428] active:bg-[#2a2c33] ${focusRing}`}
                  >
                    <h3 className="text-[15px] font-medium text-white">
                      {post.title}
                    </h3>
                    <p className="mt-1 text-[13px] leading-5 text-[#b5bac1]">
                      {post.description}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#949ba4]">{content.emptyBlog}</p>
            )}
          </section>
        </div>
      </div>

      <p className="mt-8 text-xs text-[#949ba4]">© {content.name}</p>
    </motion.main>
  )
}
