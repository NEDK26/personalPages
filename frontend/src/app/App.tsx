import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Github,
  Globe,
  Images,
  LoaderCircle,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Masonry, { ResponsiveMasonry } from "react-responsive-masonry";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode, TouchEvent } from "react";

import avatarImage from "../assets/avatar.jpg";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  fetchAdminContent,
  fetchMoreLives,
  fetchPublicContent,
  loginAdmin,
  saveAdminHighlights,
  saveAdminLives,
} from "../lib/api";
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
type AdminEditorTab = "lives" | "highlights";

interface AdminCredentials {
  username: string;
  password: string;
}

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

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lives: LifeMoment[];
  highlights: HighlightItem[];
  onReplaceLives: (items: LifeMoment[]) => void;
  onReplaceHighlights: (items: HighlightItem[]) => void;
}

const ADMIN_STORAGE_KEY = "personal-space-admin-credentials";
const ADMIN_HASH = "#admin";

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

function isAdminHash(hash: string) {
  return hash.replace(/^#/, "") === "admin";
}

function createEmptyLifeMoment() {
  const now = Date.now().toString();

  return {
    id: `life-${now}`,
    title: "",
    imageUrl: "",
    alt: "",
    location: "",
    capturedAt: new Date().toISOString().slice(0, 10),
    description: "",
    width: 1200,
    height: 1600,
  } satisfies LifeMoment;
}

function createEmptyHighlightItem() {
  return {
    title: "",
    description: "",
    kind: "project",
  } satisfies HighlightItem;
}

function SectionShell({ title, eyebrow, sectionId, children }: SectionShellProps) {
  return (
    <section
      id={sectionId}
      className="scroll-mt-24 rounded-[1.5rem] border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:rounded-[1.75rem] sm:p-6"
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
      className="scroll-mt-24 flex flex-col items-center rounded-[1.75rem] border border-zinc-200 bg-white/80 p-5 text-center shadow-sm backdrop-blur-sm sm:rounded-[2rem] sm:p-8"
    >
      <div className="mb-5 h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-zinc-200 shadow-lg sm:mb-6 sm:h-44 sm:w-44 lg:h-48 lg:w-48">
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
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-3 py-1">
          <MapPin className="h-4 w-4" />
          {profile.location}
        </span>
        <span className="rounded-full bg-white/80 px-3 py-1">{profile.languages.join(" / ")}</span>
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {profile.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-zinc-200 px-3 py-1 text-sm text-slate-700">
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
              className="rounded-full bg-white/90 p-3 text-slate-800 transition-colors hover:bg-zinc-100 hover:text-slate-950"
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
        <span className="hidden rounded-full bg-zinc-200 px-3 py-1 text-sm text-slate-700 sm:inline-flex">
          {profile.languages.join(" / ")}
        </span>
      </div>

      <p className="mb-5 text-sm leading-6 text-slate-600 sm:text-base sm:leading-relaxed">{now.availability}</p>

      <div className="mb-5 flex flex-wrap gap-2 sm:hidden">
        {profile.languages.map((language) => (
          <span key={language} className="rounded-full bg-zinc-200 px-3 py-1 text-sm text-slate-700">
            {language}
          </span>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-500">Learning</h4>
          <div className="flex flex-wrap gap-2">
            {now.learning.map((item) => (
              <span key={item} className="rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-sm text-slate-700">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-500">Shipping</h4>
          <div className="flex flex-wrap gap-2">
            {now.shipping.map((item) => (
              <span key={item} className="rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-sm text-slate-700">
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
          <article key={highlight.title} className="rounded-[1.25rem] border border-zinc-200 bg-white/90 p-4 shadow-sm sm:rounded-[1.5rem]">
            <span className="mb-3 inline-flex rounded-full bg-zinc-200 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-700">
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

function LivesSection({
  lives,
  pageInfo,
  isLoadingMore,
  loadMoreError,
  onLoadMore,
  sectionId,
}: LivesSectionProps) {
  const [selectedLifeIndex, setSelectedLifeIndex] = useState<number | null>(null);
  const selectedLife = selectedLifeIndex === null ? null : lives[selectedLifeIndex];
  const hasPreviousLife = selectedLifeIndex !== null && selectedLifeIndex > 0;
  const hasNextLife = selectedLifeIndex !== null && selectedLifeIndex < lives.length - 1;
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedLifeIndex === null) {
      return;
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && hasPreviousLife) {
        event.preventDefault();
        setSelectedLifeIndex((currentIndex) => {
          if (currentIndex === null || currentIndex <= 0) {
            return currentIndex;
          }

          return currentIndex - 1;
        });
      }

      if (event.key === "ArrowRight" && hasNextLife) {
        event.preventDefault();
        setSelectedLifeIndex((currentIndex) => {
          if (currentIndex === null || currentIndex >= lives.length - 1) {
            return currentIndex;
          }

          return currentIndex + 1;
        });
      }
    }

    window.addEventListener("keydown", handleKeydown);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [hasNextLife, hasPreviousLife, lives.length, selectedLifeIndex]);

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

  function handleOpenLife(index: number) {
    setSelectedLifeIndex(index);
  }

  function handleShowPreviousLife() {
    setSelectedLifeIndex((currentIndex) => {
      if (currentIndex === null || currentIndex <= 0) {
        return currentIndex;
      }

      return currentIndex - 1;
    });
  }

  function handleShowNextLife() {
    setSelectedLifeIndex((currentIndex) => {
      if (currentIndex === null || currentIndex >= lives.length - 1) {
        return currentIndex;
      }

      return currentIndex + 1;
    });
  }

  return (
    <SectionShell title="Lives" eyebrow="Photo Journal" sectionId={sectionId}>
      <Dialog open={selectedLife !== null} onOpenChange={(open) => !open && setSelectedLifeIndex(null)}>
        <ResponsiveMasonry columnsCountBreakPoints={{ 0: 2, 768: 3, 1200: 4 }}>
          <Masonry gutter="6px">
            {lives.map((life, index) => (
              <button
                key={life.id}
                type="button"
                aria-label={`查看 ${life.title}`}
                onClick={() => handleOpenLife(index)}
                className="group relative block w-full overflow-hidden border border-zinc-200 bg-white/85 text-left shadow-sm transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-hidden"
              >
                <img
                  src={life.imageUrl}
                  alt={life.alt}
                  width={life.width}
                  height={life.height}
                  loading="lazy"
                  className="h-auto w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
              </button>
            ))}
          </Masonry>
        </ResponsiveMasonry>

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

        <DialogContent className="max-w-[calc(100%-1rem)] overflow-hidden rounded-none border-zinc-200 bg-white/98 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:max-w-4xl">
          {selectedLife ? (
            <div className="grid gap-0 md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
              <div className="relative border-b border-zinc-200 bg-zinc-100/80 md:border-r md:border-b-0">
                <img
                  src={selectedLife.imageUrl}
                  alt={selectedLife.alt}
                  width={selectedLife.width}
                  height={selectedLife.height}
                  className="h-full min-h-[320px] w-full object-cover md:min-h-[640px]"
                />

                <button
                  type="button"
                  aria-label="查看上一张照片"
                  onClick={handleShowPreviousLife}
                  disabled={!hasPreviousLife}
                  className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-none border border-zinc-300 bg-white/90 text-slate-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  aria-label="查看下一张照片"
                  onClick={handleShowNextLife}
                  disabled={!hasNextLife}
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-none border border-zinc-300 bg-white/90 text-slate-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col justify-between p-5 sm:p-6">
                <DialogHeader className="text-left">
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-500">
                    {String((selectedLifeIndex ?? 0) + 1).padStart(2, "0")} / {String(lives.length).padStart(2, "0")}
                  </div>
                  <DialogTitle className="text-2xl leading-tight text-slate-950">{selectedLife.title}</DialogTitle>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200 px-3 py-1">
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

function AdminDialog({ open, onOpenChange, lives, highlights, onReplaceLives, onReplaceHighlights }: AdminDialogProps) {
  const [adminTab, setAdminTab] = useState<AdminEditorTab>("lives");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [credentials, setCredentials] = useState<AdminCredentials | null>(null);
  const [draftLives, setDraftLives] = useState<LifeMoment[]>(lives);
  const [draftHighlights, setDraftHighlights] = useState<HighlightItem[]>(highlights);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [editingEnabled, setEditingEnabled] = useState(true);

  useEffect(() => {
    setDraftLives(lives);
  }, [lives]);

  useEffect(() => {
    setDraftHighlights(highlights);
  }, [highlights]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedCredentials = window.localStorage.getItem(ADMIN_STORAGE_KEY);

    if (!storedCredentials) {
      return;
    }

    try {
      const parsedCredentials: unknown = JSON.parse(storedCredentials);

      if (
        typeof parsedCredentials === "object" &&
        parsedCredentials !== null &&
        typeof (parsedCredentials as AdminCredentials).username === "string" &&
        typeof (parsedCredentials as AdminCredentials).password === "string"
      ) {
        const nextCredentials = parsedCredentials as AdminCredentials;

        setCredentials(nextCredentials);
        setUsername(nextCredentials.username);
        setPassword(nextCredentials.password);
      }
    } catch {
      window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  }, []);

  async function loadAdminData(nextCredentials: AdminCredentials) {
    setIsLoadingContent(true);
    setAdminError(null);

    try {
      const content = await fetchAdminContent(nextCredentials.username, nextCredentials.password);

      setDraftLives(content.lives);
      setDraftHighlights(content.highlights);
      setEditingEnabled(content.editingEnabled);
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setIsLoadingContent(false);
    }
  }

  useEffect(() => {
    if (!open || !credentials) {
      return;
    }

    void loadAdminData(credentials);
  }, [open, credentials]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoggingIn(true);
    setAdminError(null);

    try {
      const nextCredentials = await loginAdmin(username, password);

      setCredentials(nextCredentials);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(nextCredentials));
      }

      await loadAdminData(nextCredentials);
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    setCredentials(null);
    setPassword("");
    setAdminError(null);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  }

  function updateDraftLife(index: number, key: keyof LifeMoment, value: string | number) {
    setDraftLives((currentLives) => {
      return currentLives.map((life, currentIndex) => {
        if (currentIndex !== index) {
          return life;
        }

        return {
          ...life,
          [key]: value,
        };
      });
    });
  }

  function updateDraftHighlight(index: number, key: keyof HighlightItem, value: string) {
    setDraftHighlights((currentHighlights) => {
      return currentHighlights.map((highlight, currentIndex) => {
        if (currentIndex !== index) {
          return highlight;
        }

        return {
          ...highlight,
          [key]: value,
        };
      });
    });
  }

  async function handleSaveLives() {
    if (!credentials) {
      return;
    }

    setIsSaving(true);
    setAdminError(null);

    try {
      const savedLives = await saveAdminLives(credentials.username, credentials.password, draftLives);

      setDraftLives(savedLives);
      onReplaceLives(savedLives);
      onOpenChange(false);
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveHighlights() {
    if (!credentials) {
      return;
    }

    setIsSaving(true);
    setAdminError(null);

    try {
      const savedHighlights = await saveAdminHighlights(credentials.username, credentials.password, draftHighlights);

      setDraftHighlights(savedHighlights);
      onReplaceHighlights(savedHighlights);
      onOpenChange(false);
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1rem)] border-zinc-300 bg-white/96 shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:max-w-5xl">
        {!credentials ? (
          <form className="grid gap-4" onSubmit={handleLoginSubmit}>
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl text-slate-950">Admin Login</DialogTitle>
              <DialogDescription>输入管理员账号后即可编辑 Lives 和 Work 内容。</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username"
                className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-slate-900"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-slate-900 outline-none transition-colors focus:border-slate-900"
              />
            </div>

            {adminError ? <p className="text-sm text-rose-500">{adminError}</p> : null}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingIn ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              {isLoggingIn ? "登录中..." : "登录"}
            </button>
          </form>
        ) : (
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl text-slate-950">Admin Console</DialogTitle>
                <DialogDescription>
                  {editingEnabled ? "编辑后的内容会写回后端存储。" : "当前环境未启用持久化存储，只能查看，不能保存。"}
                </DialogDescription>
              </DialogHeader>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-zinc-100"
              >
                <LogOut className="h-4 w-4" />
                退出
              </button>
            </div>

            <div className="inline-flex w-fit rounded-full border border-zinc-300 bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setAdminTab("lives")}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  adminTab === "lives" ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-white"
                }`}
              >
                Lives
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("highlights")}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  adminTab === "highlights" ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-white"
                }`}
              >
                Work
              </button>
            </div>

            {isLoadingContent ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white/90 px-4 py-2 text-sm text-slate-700">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                正在加载内容...
              </div>
            ) : null}

            {adminError ? <p className="text-sm text-rose-500">{adminError}</p> : null}

            {adminTab === "lives" ? (
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setDraftLives((currentLives) => [...currentLives, createEmptyLifeMoment()])}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-zinc-100"
                  >
                    <Plus className="h-4 w-4" />
                    新增照片
                  </button>
                </div>

                <div className="grid max-h-[55vh] gap-4 overflow-y-auto pr-1">
                  {draftLives.map((life, index) => (
                    <section key={`${life.id}-${index}`} className="rounded-[1.5rem] border border-zinc-300 bg-zinc-50/70 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Life #{index + 1}</p>
                        <button
                          type="button"
                          onClick={() => setDraftLives((currentLives) => currentLives.filter((_, currentIndex) => currentIndex !== index))}
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-rose-500 transition-colors hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={life.title} onChange={(event) => updateDraftLife(index, "title", event.target.value)} placeholder="标题" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <input value={life.location} onChange={(event) => updateDraftLife(index, "location", event.target.value)} placeholder="地点" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <input value={life.imageUrl} onChange={(event) => updateDraftLife(index, "imageUrl", event.target.value)} placeholder="图片地址" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2" />
                        <input value={life.alt} onChange={(event) => updateDraftLife(index, "alt", event.target.value)} placeholder="图片 alt 文案" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2" />
                        <input value={life.capturedAt} onChange={(event) => updateDraftLife(index, "capturedAt", event.target.value)} placeholder="拍摄日期 YYYY-MM-DD" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <div className="grid grid-cols-2 gap-3">
                          <input value={String(life.width)} onChange={(event) => updateDraftLife(index, "width", Number(event.target.value) || 0)} placeholder="宽度" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                          <input value={String(life.height)} onChange={(event) => updateDraftLife(index, "height", Number(event.target.value) || 0)} placeholder="高度" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        </div>
                        <textarea value={life.description} onChange={(event) => updateDraftLife(index, "description", event.target.value)} placeholder="描述" rows={4} className="rounded-[1.5rem] border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2" />
                      </div>
                    </section>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => void handleSaveLives()}
                  disabled={isSaving || !editingEnabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  保存 Lives
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setDraftHighlights((currentHighlights) => [...currentHighlights, createEmptyHighlightItem()])}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-zinc-100"
                  >
                    <Plus className="h-4 w-4" />
                    新增 Work
                  </button>
                </div>

                <div className="grid max-h-[55vh] gap-4 overflow-y-auto pr-1">
                  {draftHighlights.map((highlight, index) => (
                    <section key={`${highlight.title}-${index}`} className="rounded-[1.5rem] border border-zinc-300 bg-zinc-50/70 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Work #{index + 1}</p>
                        <button
                          type="button"
                          onClick={() => setDraftHighlights((currentHighlights) => currentHighlights.filter((_, currentIndex) => currentIndex !== index))}
                          className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-rose-500 transition-colors hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <input value={highlight.title} onChange={(event) => updateDraftHighlight(index, "title", event.target.value)} placeholder="标题" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <select value={highlight.kind} onChange={(event) => updateDraftHighlight(index, "kind", event.target.value)} className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900">
                          <option value="project">project</option>
                          <option value="approach">approach</option>
                          <option value="skill">skill</option>
                        </select>
                        <textarea value={highlight.description} onChange={(event) => updateDraftHighlight(index, "description", event.target.value)} placeholder="描述" rows={4} className="rounded-[1.5rem] border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                      </div>
                    </section>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => void handleSaveHighlights()}
                  disabled={isSaving || !editingEnabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  保存 Work
                </button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MobileBottomDock({ activeSection, onSelect }: MobileBottomDockProps) {
  return (
    <div className="mobile-dock-offset pointer-events-none fixed inset-x-0 z-40 px-3 md:hidden">
      <nav
        aria-label="Section navigation"
        role="tablist"
        className="pointer-events-auto mx-auto max-w-sm rounded-[1.5rem] border border-zinc-300 bg-gradient-to-b from-white/92 to-zinc-100/92 p-1.5 shadow-[0_14px_40px_rgba(15,23,42,0.18)] backdrop-blur-2xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 motion-safe:duration-700"
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
                    ? "bg-slate-950 text-white shadow-[0_6px_18px_rgba(15,23,42,0.18)]"
                    : "text-slate-500 hover:bg-zinc-100 hover:text-slate-950"
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
      return <NowSection profile={profile} now={now} sectionId="now" />;
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
  const { profile, now } = data;
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
    setLives((currentLives) => {
      const nextVisibleCount = Math.min(items.length, Math.max(currentLives.length, Math.min(4, items.length)));
      const nextLives = items.slice(0, nextVisibleCount);

      setLivesPageInfo({
        nextCursor: nextVisibleCount < items.length && nextLives.length > 0 ? nextLives[nextLives.length - 1].id : null,
        hasMore: nextVisibleCount < items.length,
      });

      return nextLives;
    });
    setLoadMoreLivesError(null);
  }

  function handleReplaceHighlights(items: HighlightItem[]) {
    setHighlights(items);
  }

  return (
    <div className="mobile-page-padding relative min-h-screen overflow-hidden bg-gradient-to-b from-zinc-200 via-zinc-100 to-white px-3 py-4 text-slate-900 sm:px-4 sm:py-6 md:py-8 lg:pb-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 lg:hidden">
        <div className="absolute -left-10 top-12 h-32 w-32 rounded-full bg-white/70 blur-3xl" />
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-zinc-300/35 blur-3xl" />
        <div className="absolute right-10 top-28 h-28 w-28 rounded-full bg-black/8 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-5xl items-start justify-center lg:min-h-screen lg:items-center">
        <div className="w-full rounded-[1.75rem] border border-white/70 bg-white/75 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:rounded-[2rem] sm:p-6 md:p-10">
          <div className="mb-6 hidden md:flex md:justify-between">
            <FloatingSectionNav activeSection={activeSection} onSelect={handleSelectSection} />
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-500">
              <Moon className="h-4 w-4 text-slate-900" />
              monochrome
            </div>
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

      <AdminDialog
        open={isAdminOpen}
        onOpenChange={handleAdminOpenChange}
        lives={lives}
        highlights={highlights}
        onReplaceLives={handleReplaceLives}
        onReplaceHighlights={handleReplaceHighlights}
      />

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-200 to-white p-4 text-slate-700">
        <div className="w-full max-w-md rounded-[1.75rem] border border-zinc-200 bg-white/90 p-6 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:rounded-[2rem] sm:p-8">
          <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-slate-900" />
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
