'use client'
import { motion } from 'motion/react'
import { Spotlight } from '@/components/ui/spotlight'
import { Magnetic } from '@/components/ui/magnetic'
import { AnimatedBackground } from '@/components/ui/animated-background'
import Link from 'next/link'
import Image from 'next/image'
import {
  CONTENT,
  PROJECT_LINKS,
  EMAIL,
  SOCIAL_LINKS,
} from './data'
import { useLanguage } from './language'

const VARIANTS_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const VARIANTS_SECTION = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const TRANSITION_SECTION = {
  duration: 0.3,
}

const PROJECT_COVERS: Record<string, string> = {
  action: '/projects/zhixing.jpg',
  'free-agent': '/projects/freeagent.jpg',
}

function MagneticSocialLink({
  children,
  link,
}: {
  children: React.ReactNode
  link: string
}) {
  return (
    <Magnetic springOptions={{ bounce: 0 }} intensity={0.3}>
      <a
        href={link}
        className="group relative inline-flex shrink-0 items-center gap-[1px] rounded-full bg-zinc-100 px-2.5 py-1 text-sm text-black transition-colors duration-200 hover:bg-zinc-950 hover:text-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {children}
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
        >
          <path
            d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          ></path>
        </svg>
      </a>
    </Magnetic>
  )
}

export default function Personal() {
  const { language } = useLanguage()
  const content = CONTENT[language]
  return (
    <motion.main
      className="space-y-24"
      variants={VARIANTS_CONTAINER}
      initial="hidden"
      animate="visible"
    >
      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <div className="flex-1">
          <p className="text-zinc-600 dark:text-zinc-400">
            {content.intro}
          </p>
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">{content.projectsLabel}</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {content.projects.map((project) => (
            <div key={project.id} className="glass-project space-y-3">
              <div className="project-cover relative flex aspect-video items-center justify-center overflow-hidden rounded-xl text-4xl" aria-hidden="true">
                {PROJECT_COVERS[project.id] ? (
                  <Image src={PROJECT_COVERS[project.id]} alt="" fill sizes="(max-width: 640px) calc(100vw - 52px), 280px" className="object-cover" />
                ) : project.name.slice(0, 1)}
              </div>
              <div className="px-1">
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{project.name}</span>
                <p className="text-base text-zinc-600 dark:text-zinc-400">
                  {project.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['github', 'demo'] as const).map((kind) => {
                    const href = PROJECT_LINKS[project.id]?.[kind]
                    const label = kind === 'github' ? 'GitHub' : 'Demo'
                    return href ? <a key={kind} href={href} target="_blank" rel="noopener noreferrer" className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs text-zinc-800 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">{label} ↗</a> : <span key={kind} aria-label={`${label}: ${content.linkUnavailable}`} className="rounded-full bg-zinc-50 px-3 py-1.5 text-xs text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">{label} · {content.linkUnavailable}</span>
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">{content.experienceLabel}</h3>
        <div className="flex flex-col space-y-2">
          {content.experience.map((job) => (
            <div
              className="relative overflow-hidden rounded-2xl bg-zinc-300/30 p-[1px] dark:bg-zinc-600/30"
              key={job.id}
            >
              <Spotlight
                className="from-zinc-900 via-zinc-800 to-zinc-700 blur-2xl dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-50"
                size={64}
              />
              <div className="relative h-full w-full rounded-[15px] bg-white p-4 dark:bg-zinc-950">
                <div className="relative flex w-full flex-row justify-between">
                  <div>
                    <h4 className="font-normal dark:text-zinc-100">
                      {job.title}
                    </h4>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {job.company}
                    </p>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {job.start} - {job.end}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={VARIANTS_SECTION} transition={TRANSITION_SECTION}>
        <h3 className="mb-3 text-lg font-medium">{content.blogLabel}</h3>
        {content.blog.length > 0 ? (
          <div className="flex flex-col">
            <AnimatedBackground enableHover className="h-full w-full rounded-lg bg-zinc-100 dark:bg-zinc-900/80" transition={{ type: 'spring', bounce: 0, duration: 0.2 }}>
              {content.blog.map((post) => (
                <Link key={post.uid} data-id={post.uid} href={post.link} className="-mx-3 rounded-xl px-3 py-3">
                  <div className="flex flex-col space-y-1">
                    <h4 className="font-normal dark:text-zinc-100">{post.title}</h4>
                    <p className="text-zinc-500 dark:text-zinc-400">{post.description}</p>
                  </div>
                </Link>
              ))}
            </AnimatedBackground>
          </div>
        ) : <p className="text-zinc-500 dark:text-zinc-400">{content.emptyBlog}</p>}
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">{content.connect}</h3>
        <p className="mb-5 text-zinc-600 dark:text-zinc-400">
          {content.contact}{' '}
          <a className="underline dark:text-zinc-300" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </p>
        <div className="flex items-center justify-start space-x-3">
          {SOCIAL_LINKS.map((link) => (
            <MagneticSocialLink key={link.label} link={link.link}>
              {link.label}
            </MagneticSocialLink>
          ))}
        </div>
      </motion.section>
    </motion.main>
  )
}
