import {
  AlertCircle,
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  GraduationCap,
  Github,
  Globe,
  Images,
  LoaderCircle,
  Mail,
  MapPin,
  Moon,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { ReactNode, TouchEvent } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/styles.css";

import avatarImage from "../assets/avatar.jpg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./components/ui/drawer";
import { useIsMobile } from "./components/ui/use-mobile";
import { fetchMoreLives, fetchPublicContent } from "../lib/api";
import type {
  HighlightItem,
  LifeMoment,
  LivesPageInfo,
  Now,
  Profile,
  PublicContent,
} from "../types/public";

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
  now: Now;
  sectionId?: string;
}

interface HighlightsSectionProps {
  highlights: HighlightItem[];
  sectionId?: string;
}

interface LivesSectionProps {
  lives: LifeMoment[];
  pageInfo: LivesPageInfo;
  isLoadingMore: boolean;
  loadMoreError: string | null;
  onLoadMore: () => void;
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
  livesPageInfo: LivesPageInfo;
  isLoadingMoreLives: boolean;
  loadMoreLivesError: string | null;
  onLoadMoreLives: () => void;
  highlights: HighlightItem[];
}

const ADMIN_HASH = "#admin";
const AdminDialog = lazy(() => import("./AdminDialog"));

const navigationItems = [
  { id: "about", label: "About", mobileLabel: "About", icon: UserRound },
  { id: "now", label: "Journey", mobileLabel: "Path", icon: Clock3 },
  { id: "highlights", label: "Projects", mobileLabel: "Work", icon: Sparkles },
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

function buildLifeMomentAltText(life: Pick<LifeMoment, "alt" | "title" | "description">) {
  return life.alt.trim() || life.title.trim() || life.description.trim() || "生活照片";
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

function isAdminHash(hash: string) {
  return hash.replace(/^#/, "") === "admin";
}

function SectionShell({ title, eyebrow, sectionId, children }: SectionShellProps) {
  return (
    <section
      id={sectionId}
      className="scroll-mt-24 rounded-[1.35rem] bg-white/72 p-4 backdrop-blur-sm sm:p-5 md:rounded-[1.75rem] md:border md:border-zinc-200 md:bg-white/80 md:p-6 md:shadow-sm"
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
      className="scroll-mt-24 flex flex-col items-center rounded-[1.5rem] bg-white/72 px-4 py-4 text-center backdrop-blur-sm sm:px-6 sm:py-6 md:grid md:grid-cols-[11rem_minmax(0,1fr)] md:items-center md:gap-8 md:rounded-[2rem] md:border md:border-zinc-200 md:bg-white/80 md:px-8 md:py-8 md:text-left md:shadow-sm lg:grid-cols-[12rem_minmax(0,1fr)] lg:px-10"
    >
      <div className="mb-4 h-36 w-36 shrink-0 overflow-hidden rounded-full border-4 border-white bg-zinc-200 shadow-lg sm:mb-5 sm:h-40 sm:w-40 md:mb-0 md:h-44 md:w-44 lg:h-48 lg:w-48">
        <img
          src={avatarImage}
          alt={`${profile.name} avatar`}
          loading="eager"
          fetchPriority="high"
          draggable={false}
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="flex w-full max-w-[24rem] flex-col items-center gap-3 md:max-w-none md:items-start md:gap-5">
        <div className="flex w-full flex-col items-center gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="space-y-2 md:space-y-3">
            <h2 className="text-[1.9rem] leading-none text-slate-900 sm:text-[2.15rem] md:text-[2.5rem]">{profile.name}</h2>
            <p className="text-sm leading-6 text-slate-700 sm:text-base sm:leading-7 md:max-w-none md:text-base lg:text-lg xl:whitespace-nowrap">
              {profile.headline}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 sm:gap-3 sm:text-sm md:justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-3 py-1 md:shrink-0">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-wrap justify-center gap-1.5 sm:gap-2 md:justify-start">
          {profile.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs text-slate-700 sm:px-3 sm:text-sm">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex w-full flex-wrap justify-center gap-2.5 sm:gap-3 md:justify-start">
          {socialLinkConfig.map(({ key, label, icon: Icon }) => {
            const href = profile.socials[key];

            return (
              <a
                key={key}
                href={href}
                aria-label={label}
                className="rounded-full bg-white/90 p-2.5 text-slate-800 transition-colors hover:bg-zinc-100 hover:text-slate-950 sm:p-3"
                target={opensNewTab(href) ? "_blank" : undefined}
                rel={opensNewTab(href) ? "noreferrer" : undefined}
              >
                <Icon className="h-5 w-5" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NowSection({ now, sectionId }: NowSectionProps) {
  return (
    <SectionShell title="Journey" eyebrow="Growth Path" sectionId={sectionId}>
      <p className="mb-5 text-sm leading-7 text-slate-600 sm:text-base">{now.summary}</p>

      <div className="grid gap-4">
        {now.items.map((item) => {
          const Icon = item.type === "education" ? GraduationCap : BriefcaseBusiness;
          const typeLabel = item.type === "education" ? "Education" : "Work";

          return (
            <article key={item.id} className="rounded-[1.5rem] border border-zinc-200 bg-white/90 p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-zinc-200 p-3 text-slate-900">
                    <Icon className="h-5 w-5" />
                  </div>

                  <div>
                    <span className="inline-flex rounded-full bg-zinc-200 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-700">
                      {typeLabel}
                    </span>
                    <h4 className="mt-3 text-lg text-slate-950">{item.title}</h4>
                    <p className="mt-1 text-sm text-slate-500">{item.organization}</p>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2 text-sm text-slate-500 sm:items-end">
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{item.period}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1">
                    <MapPin className="h-4 w-4" />
                    {item.location}
                  </span>
                </div>
              </div>

              <p className="mt-4 leading-7 text-slate-600">{item.description}</p>
            </article>
          );
        })}
      </div>
    </SectionShell>
  );
}

function HighlightsSection({ highlights, sectionId }: HighlightsSectionProps) {
  const [selectedHighlight, setSelectedHighlight] = useState<HighlightItem | null>(null);
  const isMobile = useIsMobile();

  function handleHighlightDetailOpenChange(open: boolean) {
    if (!open) {
      setSelectedHighlight(null);
    }
  }

  return (
    <SectionShell title="Projects" eyebrow="Project Experience" sectionId={sectionId}>
      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((highlight) => (
          <button
            key={highlight.id}
            type="button"
            onClick={() => setSelectedHighlight(highlight)}
            className="rounded-[1.25rem] border border-zinc-200 bg-white/90 p-4 text-left shadow-sm transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-hidden sm:rounded-[1.5rem]"
          >
            <span className="mb-3 inline-flex rounded-full bg-zinc-200 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-700">
              {highlight.kind}
            </span>
            <h4 className="mb-2 text-lg text-slate-900">{highlight.title}</h4>
            <p className="text-sm text-slate-500">{highlight.period}</p>
            <p className="mt-3 leading-relaxed text-slate-600">{highlight.summary}</p>
          </button>
        ))}
      </div>

      {isMobile ? (
        <Drawer open={selectedHighlight !== null} onOpenChange={handleHighlightDetailOpenChange}>
          <DrawerContent className="max-h-[85svh] border-zinc-200 bg-white/96 shadow-[0_-18px_48px_rgba(15,23,42,0.14)]">
            {selectedHighlight ? (
              <div className="overflow-y-auto">
                <DrawerHeader className="text-left">
                  <span className="inline-flex w-fit rounded-full bg-zinc-200 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-700">
                    {selectedHighlight.kind}
                  </span>
                  <DrawerTitle className="text-xl leading-tight text-slate-950">{selectedHighlight.title}</DrawerTitle>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{selectedHighlight.period}</span>
                    {selectedHighlight.stack.map((item) => (
                      <span key={item} className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-slate-600">
                        {item}
                      </span>
                    ))}
                  </div>
                  <DrawerDescription className="text-base leading-7 text-slate-600">
                    {selectedHighlight.description}
                  </DrawerDescription>
                  {selectedHighlight.link ? (
                    <a
                      href={selectedHighlight.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-zinc-100 hover:text-slate-950"
                    >
                      <ExternalLink className="h-4 w-4" />
                      查看相关链接
                    </a>
                  ) : null}
                </DrawerHeader>
              </div>
            ) : null}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={selectedHighlight !== null} onOpenChange={handleHighlightDetailOpenChange}>
          <DialogContent className="max-w-[calc(100%-1rem)] border-zinc-200 bg-white/96 shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:max-w-2xl">
            {selectedHighlight ? (
              <DialogHeader className="text-left">
                <span className="inline-flex w-fit rounded-full bg-zinc-200 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-700">
                  {selectedHighlight.kind}
                </span>
                <DialogTitle className="text-2xl text-slate-950">{selectedHighlight.title}</DialogTitle>
                <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                  <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">{selectedHighlight.period}</span>
                  {selectedHighlight.stack.map((item) => (
                    <span key={item} className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-slate-600">
                      {item}
                    </span>
                  ))}
                </div>
                <DialogDescription className="text-base leading-7 text-slate-600">
                  {selectedHighlight.description}
                </DialogDescription>
                {selectedHighlight.link ? (
                  <a
                    href={selectedHighlight.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-zinc-100 hover:text-slate-950"
                  >
                    <ExternalLink className="h-4 w-4" />
                    查看相关链接
                  </a>
                ) : null}
              </DialogHeader>
            ) : null}
          </DialogContent>
        </Dialog>
      )}
    </SectionShell>
  );
}

function LivesSection({
  lives,
  pageInfo,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  sectionId,
}: LivesSectionProps) {
  const [selectedLifeIndex, setSelectedLifeIndex] = useState<number | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pageInfo.hasMore || isLoadingMore || Boolean(loadMoreError)) {
      return;
    }

    const sentinel = loadMoreSentinelRef.current;

    if (!sentinel) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: "240px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [isLoadingMore, loadMoreError, onLoadMore, pageInfo.hasMore, lives.length]);

  const slides = lives.map((life) => ({
    src: life.imageUrl,
    alt: buildLifeMomentAltText(life),
    width: life.width,
    height: life.height,
    title: life.title.trim() || "未命名",
    description: (
      <div className="space-y-3 text-left">
        {life.capturedAt ? (
          <div className="text-xs uppercase tracking-[0.16em] text-white/75">
            {formatDate(life.capturedAt, { year: "numeric", month: "long", day: "numeric" })}
          </div>
        ) : null}
        {life.description ? <p className="text-sm leading-6 text-white/90 sm:text-base">{life.description}</p> : null}
      </div>
    ),
  }));

  return (
    <SectionShell title="Lives" eyebrow="Photo Journal" sectionId={sectionId}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {lives.map((life, index) => (
          <button
            key={life.id}
            type="button"
            aria-label={`查看 ${life.title.trim() || "未命名照片"}`}
            onClick={() => setSelectedLifeIndex(index)}
            className="group relative aspect-square overflow-hidden border border-zinc-200 bg-white/90 text-left shadow-sm transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-hidden"
          >
            <img
              src={life.thumbnailUrl ?? life.imageUrl}
              alt={buildLifeMomentAltText(life)}
              loading="lazy"
              onError={(event) => {
                if (event.currentTarget.src !== life.imageUrl) {
                  event.currentTarget.src = life.imageUrl;
                }
              }}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-100" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white">
              <p className="truncate text-sm">{life.title.trim() || "未命名"}</p>
            </div>
          </button>
        ))}
      </div>

      {(pageInfo.hasMore || isLoadingMore || loadMoreError) ? (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div ref={loadMoreSentinelRef} className="h-1 w-full" />

          {isLoadingMore ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white/85 px-4 py-2 text-sm text-slate-700">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              正在加载更多照片...
            </div>
          ) : null}

          {loadMoreError ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm text-rose-500">{loadMoreError}</p>
              <button
                type="button"
                onClick={onLoadMore}
                className="rounded-full border border-zinc-300 bg-white/85 px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-white hover:text-slate-950"
              >
                重新尝试
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <Lightbox
        open={selectedLifeIndex !== null}
        close={() => setSelectedLifeIndex(null)}
        index={selectedLifeIndex ?? 0}
        slides={slides}
        plugins={[Captions, Zoom]}
        captions={{ descriptionTextAlign: "start" }}
        carousel={{ finite: lives.length <= 1, imageFit: "contain" }}
        zoom={{ maxZoomPixelRatio: 4, scrollToZoom: false }}
        on={{
          view: ({ index }) => setSelectedLifeIndex(index),
        }}
        styles={{
          container: {
            backgroundColor: "rgba(9, 9, 11, 0.92)",
          },
        }}
      />
    </SectionShell>
  );
}

function MobileBottomDock({ activeSection, onSelect }: MobileBottomDockProps) {
  return (
    <div className="mobile-dock-offset pointer-events-none fixed inset-x-0 z-40 px-3 md:hidden">
      <nav
        aria-label="Section navigation"
        role="tablist"
        className="pointer-events-auto mx-auto max-w-[19rem] rounded-[1.25rem] bg-white/80 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.1)] backdrop-blur-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:duration-700"
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
                className={`flex min-h-11 flex-col items-center justify-center gap-0 rounded-[0.95rem] px-1 py-1 text-[9px] transition-all duration-300 ${
                  isActive
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:bg-black/[0.04] hover:text-slate-950"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 transition-transform duration-300 ${isActive ? "scale-105" : "scale-100"}`} />
                <span className="tracking-[0.12em] uppercase">{item.mobileLabel}</span>
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
      <div className="inline-flex flex-wrap items-center gap-2 rounded-[1.6rem] border border-zinc-300 bg-gradient-to-r from-white via-zinc-100 to-zinc-200/80 p-2 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur-xl">
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
                  ? "bg-slate-950 text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)]"
                  : "text-slate-600 hover:bg-zinc-100 hover:text-slate-950"
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

function ActiveSectionPanel({
  activeSection,
  profile,
  now,
  lives,
  livesPageInfo,
  isLoadingMoreLives,
  loadMoreLivesError,
  onLoadMoreLives,
  highlights,
}: ActiveSectionPanelProps) {
  switch (activeSection) {
    case "about":
      return <ProfileCard profile={profile} sectionId="about" />;
    case "now":
      return <NowSection now={now} sectionId="now" />;
    case "highlights":
      return <HighlightsSection highlights={highlights} sectionId="highlights" />;
    case "lives":
      return (
        <LivesSection
          lives={lives}
          pageInfo={livesPageInfo}
          isLoadingMore={isLoadingMoreLives}
          loadMoreError={loadMoreLivesError}
          onLoadMore={onLoadMoreLives}
          sectionId="lives"
        />
      );
    default:
      return <ProfileCard profile={profile} sectionId="about" />;
  }
}

function ReadyState({ data }: { data: PublicContent }) {
  const [activeSection, setActiveSection] = useState<NavigationSectionId>(() => {
    if (typeof window === "undefined") {
      return "about";
    }

    return getSectionIdFromHash(window.location.hash);
  });
  const [isAdminOpen, setIsAdminOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return isAdminHash(window.location.hash);
  });
  const [panelDirection, setPanelDirection] = useState<PanelDirection>("forward");
  const [profile, setProfile] = useState(data.profile);
  const [now, setNow] = useState(data.now);
  const [lives, setLives] = useState(data.lives);
  const [livesPageInfo, setLivesPageInfo] = useState(data.livesPageInfo);
  const [highlights, setHighlights] = useState(data.highlights);
  const [isLoadingMoreLives, setIsLoadingMoreLives] = useState(false);
  const [loadMoreLivesError, setLoadMoreLivesError] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    function handleHashChange() {
      if (isAdminHash(window.location.hash)) {
        setIsAdminOpen(true);
        return;
      }

      setIsAdminOpen(false);
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

    setIsAdminOpen(false);
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

  function handleAdminOpenChange(open: boolean) {
    setIsAdminOpen(open);

    if (typeof window === "undefined") {
      return;
    }

    if (open) {
      if (window.location.hash !== ADMIN_HASH) {
        window.history.replaceState(null, "", ADMIN_HASH);
      }

      return;
    }

    if (window.location.hash === ADMIN_HASH) {
      window.history.replaceState(null, "", `#${activeSection}`);
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

  async function handleLoadMoreLives() {
    if (isLoadingMoreLives || !livesPageInfo.hasMore || !livesPageInfo.nextCursor) {
      return;
    }

    setIsLoadingMoreLives(true);
    setLoadMoreLivesError(null);

    try {
      const nextLivesPage = await fetchMoreLives(livesPageInfo.nextCursor);

      setLives((currentLives) => [...currentLives, ...nextLivesPage.items]);
      setLivesPageInfo(nextLivesPage.pageInfo);
    } catch (error) {
      setLoadMoreLivesError(getErrorMessage(error));
    } finally {
      setIsLoadingMoreLives(false);
    }
  }

  function handleReplaceLives(items: LifeMoment[]) {
    const visibleLives = items.filter((item) => item.status === "published");

    setLives((currentLives) => {
      const nextVisibleCount = Math.min(
        visibleLives.length,
        Math.max(currentLives.length, Math.min(4, visibleLives.length)),
      );
      const nextLives = visibleLives.slice(0, nextVisibleCount);

      setLivesPageInfo({
        nextCursor: nextVisibleCount < visibleLives.length && nextLives.length > 0 ? nextLives[nextLives.length - 1].id : null,
        hasMore: nextVisibleCount < visibleLives.length,
      });

      return nextLives;
    });
    setLoadMoreLivesError(null);
  }

  function handleReplaceProfile(content: Profile) {
    setProfile(content);
  }

  function handleReplaceNow(content: Now) {
    setNow({
      ...content,
      items: content.items.filter((item) => item.status === "published"),
    });
  }

  function handleReplaceHighlights(items: HighlightItem[]) {
    setHighlights(items.filter((item) => item.status === "published"));
  }

  return (
    <div className="mobile-page-padding relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-200 via-zinc-100 to-white px-3 py-4 text-slate-900 sm:px-4 sm:py-6 md:py-8 lg:pb-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 lg:hidden">
        <div className="absolute -left-10 top-12 h-32 w-32 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-zinc-300/35 blur-3xl" />
        <div className="absolute right-10 top-28 h-28 w-28 rounded-full bg-black/8 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-5xl items-start justify-center lg:min-h-screen lg:items-center">
        <div className="w-full md:rounded-[1.75rem] md:border md:border-white/70 md:bg-white/75 md:p-10 md:shadow-[0_24px_80px_rgba(15,23,42,0.12)] md:backdrop-blur-xl lg:rounded-[2rem]">
          <div className="mb-6 hidden md:flex md:justify-between">
            <FloatingSectionNav activeSection={activeSection} onSelect={handleSelectSection} />
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
              <Moon className="h-4 w-4 text-slate-900" />
              just do it
            </div>
          </div>

          <div className="grid gap-3 sm:gap-4 md:hidden">
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
                livesPageInfo={livesPageInfo}
                isLoadingMoreLives={isLoadingMoreLives}
                loadMoreLivesError={loadMoreLivesError}
                onLoadMoreLives={handleLoadMoreLives}
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
                livesPageInfo={livesPageInfo}
                isLoadingMoreLives={isLoadingMoreLives}
                loadMoreLivesError={loadMoreLivesError}
                onLoadMoreLives={handleLoadMoreLives}
                highlights={highlights}
              />
            </div>
          </div>
        </div>
      </div>

      {isAdminOpen ? (
        <Suspense fallback={null}>
          <AdminDialog
            open
            onOpenChange={handleAdminOpenChange}
            profile={profile}
            now={now}
            lives={lives}
            highlights={highlights}
            onReplaceProfile={handleReplaceProfile}
            onReplaceNow={handleReplaceNow}
            onReplaceLives={handleReplaceLives}
            onReplaceHighlights={handleReplaceHighlights}
          />
        </Suspense>
      ) : null}

      <MobileBottomDock activeSection={activeSection} onSelect={handleSelectSection} />
    </div>
  );
}

export default function App() {
  const [state, setState] = useState<PublicContentState>({ status: "loading" });

  useEffect(() => {
    window.localStorage.removeItem("personal-space-admin-credentials");
  }, []);

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-200 to-white p-4 text-slate-700">
        <div className="w-full max-w-md rounded-[1.75rem] border border-zinc-200 bg-white/90 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:rounded-[2rem] sm:p-8">
          <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-slate-900" />
          <h1 className="mb-2 text-xl text-slate-900 sm:text-2xl">Loading...</h1>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-200 to-white p-4 text-slate-700">
        <div className="w-full max-w-md rounded-[1.75rem] border border-zinc-200 bg-white/90 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:rounded-[2rem] sm:p-8">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
          <h1 className="mb-2 text-xl text-slate-900 sm:text-2xl">后端连接失败</h1>
          <p className="mb-6 text-sm leading-6 text-slate-600 sm:text-base sm:leading-relaxed">{state.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-slate-950 px-6 py-3 text-white transition-colors hover:bg-black"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return <ReadyState data={state.data} />;
}
