import {
  AlertCircle,
  CalendarDays,
  Clock3,
  Github,
  Globe,
  Images,
  Mail,
  MapPin,
  Moon,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { useEffect, useRef, useState } from "react";
import type { ReactNode, TouchEvent } from "react";

import avatarImage from "../assets/avatar.jpg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { fetchPublicContent } from "../lib/api";
import type { HighlightItem, LifeMoment, Now, Profile, PublicContent } from "../types/public";

type PublicContentState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: PublicContent };

type NavigationSectionId = "about" | "now" | "highlights" | "lives";
type PanelDirection = "forward" | "backward";
type SocialLinkKey = keyof Profile["socials"];

interface NavigationItem {
  id: NavigationSectionId;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
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

interface LivesSectionProps {
  lives: LifeMoment[];
  sectionId?: string;
}

interface MobileBottomDockProps {
  activeSection: NavigationSectionId;
  onSelect: (sectionId: NavigationSectionId) => void;
}

interface FloatingSectionNavProps {
  activeSection: NavigationSectionId;
  onSelect: (sectionId: NavigationSectionId) => void;
}

interface ActiveSectionPanelProps {
  activeSection: NavigationSectionId;
  profile: Profile;
  now: Now;
  lives: LifeMoment[];
  highlights: HighlightItem[];
}

const navigationItems = [
  { id: "about", label: "About", mobileLabel: "About", icon: UserRound },
  { id: "now", label: "Now", mobileLabel: "Now", icon: Clock3 },
  { id: "highlights", label: "Highlights", mobileLabel: "Work", icon: Sparkles },
  { id: "lives", label: "Lives", mobileLabel: "Lives", icon: Images },
] as const satisfies readonly NavigationItem[];

const socialLinkConfig = [
  { key: "github", label: "GitHub", icon: Github },
  { key: "email", label: "Email", icon: Mail },
  { key: "blog", label: "Blog", icon: Globe },
] as const satisfies readonly SocialLinkConfig[];

function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  },
) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", options).format(parsedDate);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "资料加载失败，请稍后重试。";
}

function opensNewTab(url: string) {
  return !url.startsWith("mailto:");
}

function getSectionIdFromHash(hash: string): NavigationSectionId {
  const normalizedHash = hash.replace(/^#/, "");

  for (const item of navigationItems) {
    if (item.id === normalizedHash) {
      return item.id;
    }
  }

  return "about";
}

function getSectionIndex(sectionId: NavigationSectionId) {
  return navigationItems.findIndex((item) => item.id === sectionId);
}

function getPanelAnimationClass(direction: PanelDirection) {
  return direction === "forward"
    ? "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-right-4 motion-safe:duration-300"
    : "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-left-4 motion-safe:duration-300";
}

function SectionShell({ title, eyebrow, sectionId, children }: SectionShellProps) {
  return (
    <section
      id={sectionId}
      className="scroll-mt-24 rounded-[1.5rem] border border-white/65 bg-white/70 p-4 shadow-sm backdrop-blur-sm sm:rounded-[1.75rem] sm:p-6"
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
      className="scroll-mt-24 flex flex-col items-center rounded-[1.75rem] border border-white/65 bg-white/70 p-5 text-center shadow-sm backdrop-blur-sm sm:rounded-[2rem] sm:p-8"
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
        <span className="rounded-full bg-white/80 px-3 py-1">{profile.languages.join(" / ")}</span>
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
              className="rounded-full bg-white/85 p-3 text-slate-800 transition-colors hover:bg-white hover:text-purple-700"
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

function LivesSection({ lives, sectionId }: LivesSectionProps) {
  const [selectedLife, setSelectedLife] = useState<LifeMoment | null>(null);

  return (
    <SectionShell title="Lives" eyebrow="Photo Journal" sectionId={sectionId}>
      <Dialog open={selectedLife !== null} onOpenChange={(open) => !open && setSelectedLife(null)}>
        <ResponsiveMasonry columnsCountBreakPoints={{ 0: 2, 768: 3, 1200: 4 }}>
          <Masonry gutter="12px">
            {lives.map((life) => (
              <button
                key={life.id}
                type="button"
                aria-label={`查看 ${life.title}`}
                onClick={() => setSelectedLife(life)}
                className="group relative block w-full overflow-hidden border border-white/65 bg-white/75 text-left shadow-sm transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-hidden"
              >
                <img
                  src={life.imageUrl}
                  alt={life.alt}
                  width={life.width}
                  height={life.height}
                  loading="lazy"
                  className="h-auto w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
              </button>
            ))}
          </Masonry>
        </ResponsiveMasonry>

        <DialogContent className="max-w-[calc(100%-1rem)] overflow-hidden border-white/70 bg-white/95 p-0 shadow-[0_24px_80px_rgba(88,28,135,0.14)] sm:max-w-3xl">
          {selectedLife ? (
            <div className="grid gap-0 md:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
              <div className="bg-slate-950/5">
                <img
                  src={selectedLife.imageUrl}
                  alt={selectedLife.alt}
                  width={selectedLife.width}
                  height={selectedLife.height}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="flex flex-col justify-between p-5 sm:p-6">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-2xl leading-tight text-slate-950">{selectedLife.title}</DialogTitle>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1">
                      <MapPin className="h-4 w-4" />
                      {selectedLife.location}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(selectedLife.capturedAt, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <DialogDescription className="text-base leading-7 text-slate-600">
                    {selectedLife.description}
                  </DialogDescription>
                </DialogHeader>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </SectionShell>
  );
}

function MobileBottomDock({ activeSection, onSelect }: MobileBottomDockProps) {
  return (
    <div className="mobile-dock-offset pointer-events-none fixed inset-x-0 z-40 px-3 md:hidden">
      <nav
        aria-label="Section navigation"
        role="tablist"
        className="pointer-events-auto mx-auto max-w-sm rounded-[1.5rem] border border-white/75 bg-gradient-to-b from-white/84 to-purple-100/78 p-1.5 shadow-[0_14px_40px_rgba(88,28,135,0.16)] backdrop-blur-2xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:duration-700"
      >
        <div className="grid grid-cols-4 gap-1">
          {navigationItems.map((item) => {
            const isActive = item.id === activeSection;
            const Icon = item.icon;

            return (
              <button
                type="button"
                key={item.id}
                id={`mobile-tab-${item.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`mobile-panel-${item.id}`}
                onClick={() => onSelect(item.id)}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-1.5 py-1.5 text-[10px] transition-all duration-300 ${
                  isActive
                    ? "bg-purple-200/90 text-slate-950 shadow-[0_6px_18px_rgba(88,28,135,0.14)]"
                    : "text-slate-500 hover:bg-white/60 hover:text-purple-800"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 transition-transform duration-300 ${isActive ? "scale-105" : "scale-100"}`} />
                <span className="tracking-[0.08em] uppercase">{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function FloatingSectionNav({ activeSection, onSelect }: FloatingSectionNavProps) {
  return (
    <nav aria-label="Section navigation" role="tablist" className="hidden md:flex">
      <div className="inline-flex flex-wrap items-center gap-2 rounded-[1.6rem] border border-white/72 bg-gradient-to-r from-white/82 via-white/72 to-purple-100/74 p-2 shadow-[0_18px_48px_rgba(88,28,135,0.14)] backdrop-blur-xl">
        {navigationItems.map((item) => {
          const isActive = item.id === activeSection;
          const Icon = item.icon;

          return (
            <button
              type="button"
              key={item.id}
              id={`desktop-tab-${item.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`desktop-panel-${item.id}`}
              onClick={() => onSelect(item.id)}
              className={`inline-flex items-center gap-2 rounded-[1.2rem] px-4 py-2.5 text-sm transition-all duration-300 ${
                isActive
                  ? "bg-purple-200/90 text-slate-950 shadow-[0_8px_24px_rgba(88,28,135,0.14)]"
                  : "text-slate-600 hover:bg-white/70 hover:text-purple-800"
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? "scale-105" : "scale-100"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ActiveSectionPanel({ activeSection, profile, now, lives, highlights }: ActiveSectionPanelProps) {
  switch (activeSection) {
    case "about":
      return <ProfileCard profile={profile} sectionId="about" />;
    case "now":
      return <NowSection profile={profile} now={now} sectionId="now" />;
    case "highlights":
      return <HighlightsSection highlights={highlights} sectionId="highlights" />;
    case "lives":
      return <LivesSection lives={lives} sectionId="lives" />;
    default:
      return <ProfileCard profile={profile} sectionId="about" />;
  }
}

function ReadyState({ data }: { data: PublicContent }) {
  const { profile, now, lives, highlights } = data;
  const [activeSection, setActiveSection] = useState<NavigationSectionId>(() => {
    if (typeof window === "undefined") {
      return "about";
    }

    return getSectionIdFromHash(window.location.hash);
  });
  const [panelDirection, setPanelDirection] = useState<PanelDirection>("forward");
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleHashChange() {
      const nextSection = getSectionIdFromHash(window.location.hash);

      setPanelDirection(getSectionIndex(nextSection) >= getSectionIndex(activeSection) ? "forward" : "backward");
      setActiveSection(nextSection);
    }

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [activeSection]);

  function handleSelectSection(sectionId: NavigationSectionId) {
    if (sectionId === activeSection) {
      return;
    }

    setPanelDirection(getSectionIndex(sectionId) > getSectionIndex(activeSection) ? "forward" : "backward");
    setActiveSection(sectionId);

    if (typeof window === "undefined") {
      return;
    }

    const nextHash = `#${sectionId}`;

    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  }

  function handleMobilePanelTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];

    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleMobilePanelTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];

    touchCurrentRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleMobilePanelTouchEnd() {
    const start = touchStartRef.current;
    const end = touchCurrentRef.current;

    touchStartRef.current = null;
    touchCurrentRef.current = null;

    if (!start || !end) {
      return;
    }

    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const minimumSwipeDistance = 56;

    if (Math.abs(deltaX) < minimumSwipeDistance || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) {
      return;
    }

    const currentIndex = getSectionIndex(activeSection);

    if (deltaX < 0 && currentIndex < navigationItems.length - 1) {
      handleSelectSection(navigationItems[currentIndex + 1].id);
      return;
    }

    if (deltaX > 0 && currentIndex > 0) {
      handleSelectSection(navigationItems[currentIndex - 1].id);
    }
  }

  return (
    <div className="mobile-page-padding relative min-h-screen overflow-hidden bg-gradient-to-b from-purple-200 via-purple-100 to-fuchsia-100 px-3 py-4 text-slate-800 sm:px-4 sm:py-6 md:py-8 lg:pb-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 lg:hidden">
        <div className="absolute -left-10 top-12 h-32 w-32 rounded-full bg-white/45 blur-3xl" />
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-fuchsia-200/35 blur-3xl" />
        <div className="absolute right-10 top-28 h-28 w-28 rounded-full bg-purple-300/28 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-5xl items-start justify-center lg:min-h-screen lg:items-center">
        <div className="w-full rounded-[1.75rem] border border-white/65 bg-white/55 p-4 shadow-[0_24px_80px_rgba(88,28,135,0.12)] backdrop-blur-xl sm:rounded-[2rem] sm:p-6 md:p-10">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl text-slate-900 sm:text-2xl">{profile.name}</h1>
              <Moon className="h-5 w-5 text-purple-700" />
            </div>
            <div className="text-xs text-slate-600 sm:text-sm">
              最近更新于 <time dateTime={now.updatedAt}>{formatDate(now.updatedAt)}</time>
            </div>
          </div>

          <div className="mb-6 hidden md:flex md:justify-start">
            <FloatingSectionNav activeSection={activeSection} onSelect={handleSelectSection} />
          </div>

          <div className="grid gap-4 sm:gap-5 md:hidden">
            <div
              key={`mobile-${activeSection}`}
              id={`mobile-panel-${activeSection}`}
              role="tabpanel"
              aria-labelledby={`mobile-tab-${activeSection}`}
              onTouchStart={handleMobilePanelTouchStart}
              onTouchMove={handleMobilePanelTouchMove}
              onTouchEnd={handleMobilePanelTouchEnd}
              onTouchCancel={handleMobilePanelTouchEnd}
              className={getPanelAnimationClass(panelDirection)}
              style={{ touchAction: "pan-y" }}
            >
              <ActiveSectionPanel
                activeSection={activeSection}
                profile={profile}
                now={now}
                lives={lives}
                highlights={highlights}
              />
            </div>
          </div>

          <div className="hidden md:block">
            <div
              key={`desktop-${activeSection}`}
              id={`desktop-panel-${activeSection}`}
              role="tabpanel"
              aria-labelledby={`desktop-tab-${activeSection}`}
              className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-300"
            >
              <ActiveSectionPanel
                activeSection={activeSection}
                profile={profile}
                now={now}
                lives={lives}
                highlights={highlights}
              />
            </div>
          </div>
        </div>
      </div>

      <MobileBottomDock activeSection={activeSection} onSelect={handleSelectSection} />
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
        <div className="w-full max-w-md rounded-[1.75rem] border border-white/65 bg-white/55 p-6 text-center shadow-[0_24px_80px_rgba(88,28,135,0.12)] backdrop-blur-xl sm:rounded-[2rem] sm:p-8">
          <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-purple-700" />
          <h1 className="mb-2 text-xl text-slate-900 sm:text-2xl">正在连接后端</h1>
          <p className="text-sm leading-6 text-slate-600 sm:text-base sm:leading-relaxed">
            正在读取个人资料、生活照片和项目亮点数据。
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-200 to-purple-100 p-4 text-slate-700">
        <div className="w-full max-w-md rounded-[1.75rem] border border-white/65 bg-white/55 p-6 text-center shadow-[0_24px_80px_rgba(88,28,135,0.12)] backdrop-blur-xl sm:rounded-[2rem] sm:p-8">
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
