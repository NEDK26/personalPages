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

import avatarImage from "../assets/avatar.jpg";
import { fetchPublicContent } from "../lib/api";
import type { Profile, PublicContent } from "../types/public";

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
        <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/55 p-8 text-center shadow-[0_24px_80px_rgba(88,28,135,0.12)] backdrop-blur-xl">
          <RefreshCw className="mx-auto mb-4 h-10 w-10 animate-spin text-purple-700" />
          <h1 className="mb-2 text-2xl text-slate-900">正在连接后端</h1>
          <p className="leading-relaxed text-slate-600">
            正在读取个人资料、链接和项目亮点数据。
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-200 to-purple-100 p-4 text-slate-700">
        <div className="w-full max-w-md rounded-[2rem] border border-white/60 bg-white/55 p-8 text-center shadow-[0_24px_80px_rgba(88,28,135,0.12)] backdrop-blur-xl">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-rose-500" />
          <h1 className="mb-2 text-2xl text-slate-900">后端连接失败</h1>
          <p className="mb-6 leading-relaxed text-slate-600">{state.message}</p>
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

  const { profile, now, links, highlights } = state.data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-200 to-purple-100 p-4 text-slate-800">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/60 bg-white/55 p-6 shadow-[0_24px_80px_rgba(88,28,135,0.12)] backdrop-blur-xl md:p-10">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl text-slate-900">{profile.name}</h1>
              <Moon className="h-5 w-5 text-purple-700" />
            </div>
            <div className="text-sm text-slate-600">
              最近更新于 <time dateTime={now.updatedAt}>{formatUpdatedAt(now.updatedAt)}</time>
            </div>
          </div>

          <nav className="mb-10 flex flex-wrap gap-4 text-sm text-slate-700 md:gap-6">
            {navigationItems.map((item) => (
              <a key={item.href} href={item.href} className="transition-colors hover:text-slate-900">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
            <section id="about" className="flex flex-col items-center rounded-[2rem] bg-white/55 p-8 text-center shadow-sm">
              <div className="mb-6 h-48 w-48 overflow-hidden rounded-full border-4 border-white bg-purple-100 shadow-lg">
                <img
                  src={avatarImage}
                  alt={`${profile.name} avatar`}
                  className="h-full w-full object-cover"
                />
              </div>

              <h2 className="mb-3 text-3xl text-slate-900">{profile.name}</h2>
              <p className="mb-4 text-lg text-slate-700">{profile.headline}</p>
              <p className="mb-5 leading-relaxed text-slate-600">{profile.shortBio}</p>

              <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600">
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

              <div className="flex gap-4">
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

            <div className="grid gap-6">
              <section id="now" className="rounded-[2rem] bg-white/55 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h3 className="text-xl text-slate-900">Now</h3>
                  <span className="rounded-full bg-purple-200/60 px-3 py-1 text-sm text-slate-700">
                    {profile.languages.join(" / ")}
                  </span>
                </div>

                <p className="mb-4 text-lg text-slate-800">{now.focus}</p>
                <p className="mb-5 leading-relaxed text-slate-600">{now.availability}</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-500">Learning</h4>
                    <div className="flex flex-wrap gap-2">
                      {now.learning.map((item) => (
                        <span key={item} className="rounded-full bg-white/80 px-3 py-1 text-sm text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-sm uppercase tracking-[0.24em] text-slate-500">Shipping</h4>
                    <div className="flex flex-wrap gap-2">
                      {now.shipping.map((item) => (
                        <span key={item} className="rounded-full bg-white/80 px-3 py-1 text-sm text-slate-700">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section id="highlights" className="rounded-[2rem] bg-white/55 p-6 shadow-sm">
                <h3 className="mb-4 text-xl text-slate-900">Highlights</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {highlights.map((highlight) => (
                    <article key={highlight.title} className="rounded-[1.5rem] bg-white/80 p-4">
                      <span className="mb-3 inline-flex rounded-full bg-purple-200/60 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-700">
                        {highlight.kind}
                      </span>
                      <h4 className="mb-2 text-lg text-slate-900">{highlight.title}</h4>
                      <p className="leading-relaxed text-slate-600">{highlight.description}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section id="links" className="rounded-[2rem] bg-white/55 p-6 shadow-sm">
                <h3 className="mb-4 text-xl text-slate-900">Links</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  {links.map((link) => (
                    <a
                      key={`${link.type}-${link.label}`}
                      href={link.url}
                      className="flex items-center justify-between rounded-[1.5rem] bg-white/80 px-4 py-4 text-slate-800 transition-colors hover:bg-white hover:text-purple-700"
                      target={opensNewTab(link.url) ? "_blank" : undefined}
                      rel={opensNewTab(link.url) ? "noreferrer" : undefined}
                    >
                      <div>
                        <div className="text-sm uppercase tracking-[0.24em] text-slate-500">{link.type}</div>
                        <div className="mt-1 text-lg text-slate-900">{link.label}</div>
                      </div>
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
