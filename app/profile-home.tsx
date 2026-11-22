'use client'

import { motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { CONTENT, DISPLAY_NAME, EMAIL, PROJECT_LINKS, SOCIAL_LINKS } from './data'
import { useLanguage } from './language'

const TABS = ['experience', 'projects', 'blog'] as const
type ProfileTab = (typeof TABS)[number]

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

function ExperiencePanel({
  entries,
  role,
  intro,
}: {
  entries: readonly {
    id: string
    title: string
    company: string
    start: string
    end: string
  }[]
  role: string
  intro: string
}) {
  if (entries.length === 0) {
    return (
      <div>
        <p className="text-[15px] font-medium text-white">{role}</p>
        <p className="mt-1 text-[13px] leading-5 text-[#b5bac1]">{intro}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className="rounded-2xl bg-[#1e1f22] px-3.5 py-3"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="min-w-0 text-[15px] font-medium text-white">
              {entry.title}
            </h2>
            <p className="shrink-0 text-xs text-[#949ba4]">
              {entry.start} – {entry.end}
            </p>
          </div>
          <p className="mt-1 text-[13px] text-[#b5bac1]">{entry.company}</p>
        </article>
      ))}
    </div>
  )
}

function ProjectsPanel({
  projects,
}: {
  projects: readonly { id: string; name: string; description: string }[]
}) {
  return (
    <div className="space-y-2">
      {projects.map((project) => {
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
                <h2 className="truncate text-[15px] font-medium text-white">
                  {project.name}
                </h2>
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
  )
}

function BlogPanel({
  posts,
  empty,
}: {
  posts: readonly {
    uid: string
    title: string
    description: string
    link: string
  }[]
  empty: string
}) {
  if (posts.length === 0) {
    return <p className="text-sm text-[#949ba4]">{empty}</p>
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <Link
          key={post.uid}
          href={post.link}
          className={`block rounded-2xl bg-[#1e1f22] px-3.5 py-3 transition-colors hover:bg-[#232428] active:bg-[#2a2c33] ${focusRing}`}
        >
          <h2 className="text-[15px] font-medium text-white">{post.title}</h2>
          <p className="mt-1 text-[13px] leading-5 text-[#b5bac1]">
            {post.description}
          </p>
        </Link>
      ))}
    </div>
  )
}

export function ProfileHome() {
  const { language, setLanguage } = useLanguage()
  const content = CONTENT[language]
  const reduceMotion = useReducedMotion()
  const initial = content.name.slice(0, 1)
  const [tab, setTab] = useState<ProfileTab>('experience')
  const focusTab = useRef<ProfileTab | null>(null)

  useEffect(() => {
    if (!focusTab.current) return
    document.getElementById(`profile-tab-${focusTab.current}`)?.focus()
    focusTab.current = null
  }, [tab])

  function selectTab(next: ProfileTab, moveFocus = false) {
    if (moveFocus) focusTab.current = next
    setTab(next)
  }

  function onTabListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const index = TABS.indexOf(tab)
    let nextIndex = index
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft')
      nextIndex = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = TABS.length - 1
    else return
    event.preventDefault()
    selectTab(TABS[nextIndex], true)
  }

  return (
    <motion.main
      className="mx-auto w-full max-w-[440px] px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))] font-[family-name:var(--font-geist)] md:max-w-[480px] lg:py-12"
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: 'easeOut' }}
    >
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

        <h1
          lang="en"
          className="mt-4 max-w-full truncate font-[family-name:var(--font-nickname),var(--font-geist),sans-serif] text-[34px] leading-none font-black tracking-tight text-white"
        >
          {DISPLAY_NAME}
        </h1>
        <p className="mt-1 text-[15px] leading-6 font-medium text-white">
          {content.name}
        </p>

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

        <div
          role="tablist"
          aria-label={content.tabListLabel}
          aria-orientation="horizontal"
          className="mt-6 flex border-b border-white/10"
          onKeyDown={onTabListKeyDown}
        >
          {TABS.map((id) => {
            const selected = tab === id
            return (
              <button
                key={id}
                id={`profile-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`profile-panel-${id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(id)}
                className={`flex h-11 flex-1 cursor-pointer flex-col items-center justify-end text-[14px] font-medium ${focusRing}`}
              >
                <span
                  className={`-mb-px border-b-2 px-0.5 pb-2.5 whitespace-nowrap ${
                    selected
                      ? 'border-white text-white'
                      : 'border-transparent text-[#949ba4] hover:text-[#dbdee1]'
                  }`}
                >
                  {content.tabs[id]}
                </span>
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          id={`profile-panel-${tab}`}
          aria-labelledby={`profile-tab-${tab}`}
          tabIndex={0}
          className={`mt-4 ${focusRing}`}
        >
          {tab === 'experience' ? (
            <ExperiencePanel
              entries={content.experience}
              role={content.role}
              intro={content.intro}
            />
          ) : null}
          {tab === 'projects' ? (
            <ProjectsPanel projects={content.projects} />
          ) : null}
          {tab === 'blog' ? (
            <BlogPanel posts={content.blog} empty={content.emptyBlog} />
          ) : null}
        </div>
      </div>

      <p className="mt-8 text-xs text-[#949ba4]">© {content.name}</p>
    </motion.main>
  )
}
