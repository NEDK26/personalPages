import {
  AlertCircle,
  ExternalLink,
  Github,
  Globe,
  Mail,
  MapPin,
  Moon,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import avatarImage from "../assets/avatar.jpg";
import { fetchPublicContent } from "../lib/api";
import type { HighlightItem, LinkItem, Now, Profile, PublicContent } from "../types/public";

type PublicContentState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PublicContent };

type SocialLinkKey = keyof Profile["socials"];

interface NavigationItem {
  label: string;
  href: `#${string}`;
}

interface SocialLinkConfig {
  key: SocialLinkKey;
  label: string;
  icon: LucideIcon;
}

interface SectionShellProps {
  title: string;
  eyebrow: string;
  sectionId?: string;
  children: ReactNode;
}

interface ProfileCardProps {
  profile: Profile;
  sectionId?: string;
}

interface NowSectionProps {
  profile: Profile;
  now: Now;
  sectionId?: string;
}

interface HighlightsSectionProps {
  highlights: HighlightItem[];
  sectionId?: string;
}

interface LinksSectionProps {
  links: LinkItem[];
  sectionId?: string;
}

const navigationItems = [
  { label: "About", href: "#about" },
  { label: "Now", href: "#now" },
  { label: "Highlights", href: "#highlights" },
  { label: "Links", href: "#links" },
] as const satisfies readonly NavigationItem[];

const socialLinkConfig = [
  { key: "github", label: "GitHub", icon: Github },
  { key: "email", label: "Email", icon: Mail },
  { key: "blog", label: "Blog", icon: Globe },
] as const satisfies readonly SocialLinkConfig[];

function formatUpdatedAt(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "资料加载失败，请稍后重试。";
}

function opensNewTab(url: string) {
  return !url.startsWith("mailto:");
}

function SectionShell({ title, eyebrow, sectionId, children }: SectionShellProps) {
  return (
    <section
      id={sectionId}
      className="scroll-mt-24 rounded-[1.5rem] border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-sm sm:rounded-[1.75rem] sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-5">
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-[0.24em] text-slate-500 sm:text-xs sm:tracking-[0.28em]">
            {eyebrow}
          </p>
          <h3 className="text-lg text-slate-900 sm:text-xl">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function ProfileCard({ profile, sectionId }: ProfileCardProps) {
  return (
    <section
      id={sectionId}
      className="scroll-mt-24 flex flex-col items-center rounded-[1.75rem] border border-white/60 bg-white/70 p-5 text-center shadow-sm backdrop-blur-sm sm:rounded-[2rem] sm:p-8"
    >
      <div className="mb-5 h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-purple-100 shadow-lg sm:mb-6 sm:h-44 sm:w-44 lg:h-48 lg:w-48">
        <img
          src={avatarImage}
          alt={`${profile.name} avatar`}
          className="h-full w-full object-cover"
        />
      </div>

      <h2 className="mb-3 text-2xl text-slate-900 sm:text-3xl">{profile.name}</h2>
      <p className="mb-4 text-base leading-7 text-slate-700 sm:text-lg">{profile.headline}</p>
      <p className="mb-5 text-sm leading-6 text-slate-600 sm:text-base sm:leading-relaxed">{profile.shortBio}</p>

      <div className="mb-5 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-600 sm:mb-6 sm:gap-3">
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1">
          <MapPin className="h-4 w-4" />
          {profile.location}
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1">{profile.timezone}</span>
        <span className="rounded-full bg-white/80 px-3 py-1">{profile.status}</span>
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {profile.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-purple-200/60 px-3 py-1 text-sm text-slate-700">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex w-full flex-wrap justify-center gap-3 sm:gap-4">
        {socialLinkConfig.map(({ key, label, icon: Icon }) => {
          const href = profile.socials[key];

          return (
            <a
              key={key}
              href={href}
              aria-label={label}
              className="rounded-full bg-white/80 p-3 text-slate-800 transition-colors hover:bg-white hover:text-purple-700"
              target={opensNewTab(href) ? "_blank" : undefined}
              rel={opensNewTab(href) ? "noreferrer" : undefined}
            >
              <Icon className="h-5 w-5" />
            </a>
          );
        })}
      </div>
    </section>
  );
}

function NowSection({ profile, now, sectionId }: NowSectionProps) {
  return (
    <SectionShell title="Now" eyebrow="Live Status" sectionId={sectionId}>
      <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-base leading-7 text-slate-800 sm:text-lg">{now.focus}</p>
        <span className="hidden rounded-full bg-purple-200/60 px-3 py-1 text-sm text-slate-700 sm:inline-flex">
          {profile.languages.join(" / ")}
        </span>
      </div>

      <p className="mb-5 text-sm leading-6 text-slate-600 sm:text-base sm:leading-relaxed">{now.availability}</p>

      <div className="mb-5 flex flex-wrap gap-2 sm:hidden">
        {profile.languages.map((language) => (
          <span key={language} className="rounded-full bg-purple-200/60 px-3 py-1 text-sm text-slate-700">
            {language}
          </span>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-500">Learning</h4>
          <div className="flex flex-wrap gap-2">
            {now.learning.map((item) => (
              <span key={item} className="rounded-full bg-white/85 px-3 py-1 text-sm text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-500">Shipping</h4>
          <div className="flex flex-wrap gap-2">
            {now.shipping.map((item) => (
              <span key={item} className="rounded-full bg-white/85 px-3 py-1 text-sm text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function HighlightsSection({ highlights, sectionId }: HighlightsSectionProps) {
  return (
    <SectionShell title="Highlights" eyebrow="Selected Work" sectionId={sectionId}>
      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((highlight) => (
          <article key={highlight.title} className="rounded-[1.25rem] bg-white/85 p-4 shadow-sm sm:rounded-[1.5rem]">
            <span className="mb-3 inline-flex rounded-full bg-purple-200/60 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-700">
              {highlight.kind}
            </span>
            <h4 className="mb-2 text-lg text-slate-900">{highlight.title}</h4>
            <p className="leading-relaxed text-slate-600">{highlight.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function LinksSection({ links, sectionId }: LinksSectionProps) {
  return (
    <SectionShell title="Links" eyebrow="Reach Out" sectionId={sectionId}>
      <div className="grid gap-3 md:grid-cols-3">
        {links.map((link) => (
          <a
            key={`${link.type}-${link.label}`}
            href={link.url}
            className="flex flex-col items-start gap-3 rounded-[1.25rem] bg-white/85 px-4 py-4 text-slate-800 transition-colors hover:bg-white hover:text-purple-700 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-[1.5rem]"
            target={opensNewTab(link.url) ? "_blank" : undefined}
            rel={opensNewTab(link.url) ? "noreferrer" : undefined}
          >
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-slate-500">{link.type}</div>
              <div className="mt-1 text-lg text-slate-900">{link.label}</div>
            </div>
            <ExternalLink className="h-5 w-5 shrink-0" />
          </a>
        ))}
      </div>
    </SectionShell>
  );
}

function ReadyState({ data }: { data: PublicContent }) {
  const { profile, now, links, highlights } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-purple-100 px-3 py-4 text-slate-800 sm:px-4 sm:py-6 md:py-8">
      <div className="mx-auto flex max-w-5xl items-start justify-center lg:min-h-screen lg:items-center">
        <div className="w-full rounded-[1.75rem] border border-white/60 bg-white/55 p-4 shadow-[0_24px_80px_rgba(88,28,135,0.12)] backdrop-blur-xl sm:rounded-[2rem] sm:p-6 md:p-10">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl text-slate-900 sm:text-2xl">{profile.name}</h1>
              <Moon className="h-5 w-5 text-purple-700" />
            </div>
            <div className="text-xs text-slate-600 sm:text-sm">
              最近更新于 <time dateTime={now.updatedAt}>{formatUpdatedAt(now.updatedAt)}</time>
            </div>
          </div>

          <nav className="mb-6 -mx-1 overflow-x-auto pb-1 lg:hidden">
            <div className="flex min-w-max gap-2 px-1">
              {navigationItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="whitespace-nowrap rounded-full bg-white/80 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-white hover:text-slate-900"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          <nav className="mb-10 hidden flex-wrap gap-6 text-sm text-slate-700 lg:flex">
            {navigationItems.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-slate-900">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="grid gap-4 sm:gap-5 lg:hidden">
            <ProfileCard profile={profile} sectionId="about" />
            <NowSection profile={profile} now={now} sectionId="now" />
            <HighlightsSection highlights={highlights} sectionId="highlights" />
            <LinksSection links={links} sectionId="links" />
          </div>

          <div className="hidden gap-8 lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
            <ProfileCard profile={profile} sectionId="about" />

            <div className="grid gap-6">
              <NowSection profile={profile} now={now} sectionId="now" />
              <HighlightsSection highlights={highlights} sectionId="highlights" />
              <LinksSection links={links} sectionId="links" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<PublicContentState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    void fetchPublicContent(controller.signal)
      .then((data) => {
        setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          message: getErrorMessage(error),
        });
      });

    return () => {
      controller.abort();
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-200 to-purple-100 p-4 text-slate-700">
        <div className="w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white/55 p-6 text-center shadow-[0_24px_80px_rgba(88,28,135,0.12)] backdrop-blur-xl sm:rounded-[2rem] sm:p-8">
          <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-purple-700" />
          <h1 className="mb-2 text-xl text-slate-900 sm:text-2xl">正在连接后端</h1>
          <p className="text-sm leading-6 text-slate-600 sm:text-base sm:leading-relaxed">
            正在读取个人资料、链接和项目亮点数据。
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-200 to-purple-100 p-4 text-slate-700">
        <div className="w-full max-w-md rounded-[1.75rem] border border-white/60 bg-white/55 p-6 text-center shadow-[0_24px_80px_rgba(88,28,135,0.12)] backdrop-blur-xl sm:rounded-[2rem] sm:p-8">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
          <h1 className="mb-2 text-xl text-slate-900 sm:text-2xl">后端连接失败</h1>
          <p className="mb-6 text-sm leading-6 text-slate-600 sm:text-base sm:leading-relaxed">{state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-purple-200/70 px-6 py-3 text-slate-900 transition-colors hover:bg-purple-300/70"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return <ReadyState data={state.data} />;
}
