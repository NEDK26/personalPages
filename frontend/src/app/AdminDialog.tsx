import { ArrowDown, ArrowUp, LoaderCircle, LogOut, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./components/ui/dialog";
import {
  fetchAdminContent,
  loginAdmin,
  logoutAdmin,
  saveAdminContent,
  saveAdminHighlights,
  saveAdminLives,
  saveAdminNow,
  saveAdminProfile,
  uploadAdminLifeImage,
} from "../lib/api";
import { prepareLifeImageForUpload } from "../lib/life-image";
import type { ContentStatus, HighlightItem, JourneyItem, LifeMoment, Now, Profile } from "../types/public";

type AdminEditorTab = "profile" | "now" | "lives" | "highlights";
interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  now: Now;
  lives: LifeMoment[];
  highlights: HighlightItem[];
  onReplaceProfile: (content: Profile) => void;
  onReplaceNow: (content: Now) => void;
  onReplaceLives: (items: LifeMoment[]) => void;
  onReplaceHighlights: (items: HighlightItem[]) => void;
}

const statusOptions = [
  { value: "published", label: "显示" },
  { value: "draft", label: "草稿" },
  { value: "hidden", label: "隐藏" },
] as const satisfies ReadonlyArray<{ value: ContentStatus; label: string }>;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "资料加载失败，请稍后重试。";
}

function createCapturedAtValue() {
  return new Date().toISOString().slice(0, 10);
}

function buildLifeMomentAltText(life: Pick<LifeMoment, "alt" | "title" | "description">) {
  return life.alt.trim() || life.title.trim() || life.description.trim() || "生活照片";
}

function normalizeLifeMomentForSave(life: LifeMoment, sortOrder: number): LifeMoment {
  return {
    ...life,
    title: life.title.trim(),
    imageUrl: life.imageUrl.trim(),
    thumbnailUrl: life.thumbnailUrl?.trim() || undefined,
    alt: buildLifeMomentAltText(life),
    location: life.location.trim(),
    capturedAt: life.capturedAt.trim() || createCapturedAtValue(),
    description: life.description.trim(),
    width: life.width > 0 ? life.width : 1200,
    height: life.height > 0 ? life.height : 1600,
    sortOrder,
  };
}

function normalizeLivesForSave(items: LifeMoment[]) {
  return items.map((life, index) => normalizeLifeMomentForSave(life, index));
}

function createEmptyLifeMoment() {
  const now = Date.now().toString();

  return {
    id: `life-${now}`,
    title: "",
    imageUrl: "",
    alt: "",
    location: "",
    capturedAt: createCapturedAtValue(),
    description: "",
    width: 1200,
    height: 1600,
    status: "published",
    sortOrder: 0,
  } satisfies LifeMoment;
}

function createEmptyJourneyItem() {
  const now = Date.now().toString();

  return {
    id: `journey-${now}`,
    type: "education",
    title: "",
    organization: "",
    location: "",
    period: "",
    description: "",
    status: "published",
    sortOrder: 0,
  } satisfies JourneyItem;
}

function createEmptyHighlightItem() {
  const now = Date.now().toString();

  return {
    id: `project-${now}`,
    title: "",
    summary: "",
    description: "",
    kind: "project",
    period: "",
    stack: [],
    link: "",
    status: "published",
    sortOrder: 0,
  } satisfies HighlightItem;
}

function normalizeSortOrder<TItem extends { sortOrder: number }>(items: TItem[]) {
  return items.map((item, index) => ({
    ...item,
    sortOrder: index,
  }));
}

function moveArrayItem<TItem>(items: TItem[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  nextItems.splice(toIndex, 0, movedItem);

  return nextItems;
}

function AdminDialog({
  open,
  onOpenChange,
  profile,
  now,
  lives,
  highlights,
  onReplaceProfile,
  onReplaceNow,
  onReplaceLives,
  onReplaceHighlights,
}: AdminDialogProps) {
  const [adminTab, setAdminTab] = useState<AdminEditorTab>("profile");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [savedProfileState, setSavedProfileState] = useState<Profile>(profile);
  const [savedNowState, setSavedNowState] = useState<Now>(now);
  const [savedLivesState, setSavedLivesState] = useState<LifeMoment[]>(lives);
  const [savedHighlightsState, setSavedHighlightsState] = useState<HighlightItem[]>(highlights);
  const [draftProfile, setDraftProfile] = useState<Profile>(profile);
  const [draftNow, setDraftNow] = useState<Now>(now);
  const [draftLives, setDraftLives] = useState<LifeMoment[]>(lives);
  const [draftHighlights, setDraftHighlights] = useState<HighlightItem[]>(highlights);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLifeId, setUploadingLifeId] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [editingEnabled, setEditingEnabled] = useState(true);
  const lifeImageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (open) {
      return;
    }

    setSavedProfileState(profile);
    setDraftProfile(profile);
  }, [open, profile]);

  useEffect(() => {
    if (open) {
      return;
    }

    setSavedNowState(now);
    setDraftNow(now);
  }, [now, open]);

  useEffect(() => {
    if (open) {
      return;
    }

    setSavedLivesState(lives);
    setDraftLives(lives);
  }, [lives, open]);

  useEffect(() => {
    if (open) {
      return;
    }

    setSavedHighlightsState(highlights);
    setDraftHighlights(highlights);
  }, [highlights, open]);

  async function loadAdminData() {
    setIsLoadingContent(true);
    setAdminError(null);

    try {
      const content = await fetchAdminContent();

      setSavedProfileState(content.profile);
      setSavedNowState(content.now);
      setSavedLivesState(content.lives);
      setSavedHighlightsState(content.highlights);
      setDraftProfile(content.profile);
      setDraftNow(content.now);
      setDraftLives(content.lives);
      setDraftHighlights(content.highlights);
      setEditingEnabled(content.editingEnabled);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAuthenticated(false);
      setAdminError(null);
    } finally {
      setIsLoadingContent(false);
    }
  }

  function updateDraftProfileField(key: keyof Profile, value: string | string[] | Profile["socials"]) {
    setDraftProfile((currentProfile) => ({
      ...currentProfile,
      [key]: value,
    }));
  }

  function updateDraftProfileSocial(key: keyof Profile["socials"], value: string) {
    setDraftProfile((currentProfile) => ({
      ...currentProfile,
      socials: {
        ...currentProfile.socials,
        [key]: value,
      },
    }));
  }

  function updateDraftProfileTags(value: string) {
    setDraftProfile((currentProfile) => ({
      ...currentProfile,
      tags: value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    }));
  }

  async function handleSaveProfile() {
    if (!isAuthenticated) {
      return;
    }

    setIsSaving(true);
    setAdminError(null);

    try {
      const savedProfile = await saveAdminProfile(draftProfile);

      setSavedProfileState(savedProfile);
      setDraftProfile(savedProfile);
      onReplaceProfile(savedProfile);
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function updateDraftNowField(key: keyof Now, value: string) {
    setDraftNow((currentNow) => ({
      ...currentNow,
      [key]: value,
    }));
  }

  function updateDraftJourneyItem(index: number, key: keyof JourneyItem, value: string) {
    setDraftNow((currentNow) => ({
      ...currentNow,
      items: currentNow.items.map((item, currentIndex) => {
        if (currentIndex !== index) {
          return item;
        }

        return {
          ...item,
          [key]: value,
        };
      }),
    }));
  }

  function updateDraftJourneyStatus(index: number, value: ContentStatus) {
    setDraftNow((currentNow) => ({
      ...currentNow,
      items: currentNow.items.map((item, currentIndex) => {
        if (currentIndex !== index) {
          return item;
        }

        return {
          ...item,
          status: value,
        };
      }),
    }));
  }

  function moveDraftJourneyItem(index: number, direction: "up" | "down") {
    setDraftNow((currentNow) => ({
      ...currentNow,
      items: normalizeSortOrder(
        moveArrayItem(currentNow.items, index, direction === "up" ? index - 1 : index + 1),
      ),
    }));
  }

  async function handleSaveNow() {
    if (!isAuthenticated) {
      return;
    }

    setIsSaving(true);
    setAdminError(null);

    try {
      const normalizedNow = {
        ...draftNow,
        items: normalizeSortOrder(draftNow.items),
      };
      const savedNow = await saveAdminNow(normalizedNow);

      setSavedNowState(savedNow);
      setDraftNow(savedNow);
      onReplaceNow(savedNow);
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (!open || isAuthenticated) {
      return;
    }

    void loadAdminData();
  }, [open, isAuthenticated]);

  const hasPendingChanges =
    JSON.stringify(draftProfile) !== JSON.stringify(savedProfileState) ||
    JSON.stringify(draftNow) !== JSON.stringify(savedNowState) ||
    JSON.stringify(draftLives) !== JSON.stringify(savedLivesState) ||
    JSON.stringify(draftHighlights) !== JSON.stringify(savedHighlightsState);
  const isUploadingLifeImage = uploadingLifeId !== null;
  const isAdminBusy = isSaving || isUploadingLifeImage;

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen && hasPendingChanges && typeof window !== "undefined") {
      const shouldClose = window.confirm("你还有未保存的修改，确定直接关闭吗？");

      if (!shouldClose) {
        return;
      }
    }

    onOpenChange(nextOpen);
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoggingIn(true);
    setAdminError(null);

    try {
      await loginAdmin(username, password);
      setPassword("");
      await loadAdminData();
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    try {
      await logoutAdmin();
    } catch {
      // The local authenticated state still needs to be cleared if the session expired.
    }

    setIsAuthenticated(false);
    setPassword("");
    setAdminError(null);
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

  async function handleLifeImageSelect(lifeId: string, event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    event.target.value = "";

    if (!nextFile || !isAuthenticated) {
      return;
    }

    setUploadingLifeId(lifeId);
    setAdminError(null);

    try {
      const preparedFile = await prepareLifeImageForUpload(nextFile);
      const uploadedImage = await uploadAdminLifeImage(preparedFile.imageFile);

      setDraftLives((currentLives) =>
        currentLives.map((life) => {
          if (life.id !== lifeId) {
            return life;
          }

          return {
            ...life,
            imageUrl: uploadedImage.url,
            thumbnailUrl: uploadedImage.thumbnailUrl ?? uploadedImage.url,
            alt: buildLifeMomentAltText(life),
            capturedAt: life.capturedAt || createCapturedAtValue(),
            width: preparedFile.width,
            height: preparedFile.height,
          };
        }),
      );
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setUploadingLifeId(null);
    }
  }

  function moveDraftLife(index: number, direction: "up" | "down") {
    setDraftLives((currentLives) => {
      return normalizeSortOrder(
        moveArrayItem(currentLives, index, direction === "up" ? index - 1 : index + 1),
      );
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

  function updateDraftHighlightStatus(index: number, value: ContentStatus) {
    setDraftHighlights((currentHighlights) => {
      return currentHighlights.map((highlight, currentIndex) => {
        if (currentIndex !== index) {
          return highlight;
        }

        return {
          ...highlight,
          status: value,
        };
      });
    });
  }

  function moveDraftHighlight(index: number, direction: "up" | "down") {
    setDraftHighlights((currentHighlights) => {
      return normalizeSortOrder(
        moveArrayItem(currentHighlights, index, direction === "up" ? index - 1 : index + 1),
      );
    });
  }

  function updateDraftHighlightStack(index: number, value: string) {
    setDraftHighlights((currentHighlights) => {
      return currentHighlights.map((highlight, currentIndex) => {
        if (currentIndex !== index) {
          return highlight;
        }

        return {
          ...highlight,
          stack: value
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
        };
      });
    });
  }

  async function handleSaveLives() {
    if (!isAuthenticated) {
      return;
    }

    setIsSaving(true);
    setAdminError(null);

    try {
      const savedLives = await saveAdminLives(normalizeLivesForSave(draftLives));

      setSavedLivesState(savedLives);
      setDraftLives(savedLives);
      onReplaceLives(savedLives);
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveHighlights() {
    if (!isAuthenticated) {
      return;
    }

    setIsSaving(true);
    setAdminError(null);

    try {
      const savedHighlights = await saveAdminHighlights(normalizeSortOrder(draftHighlights));

      setSavedHighlightsState(savedHighlights);
      setDraftHighlights(savedHighlights);
      onReplaceHighlights(savedHighlights);
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveAll() {
    if (!isAuthenticated) {
      return;
    }

    setIsSaving(true);
    setAdminError(null);

    try {
      const savedContent = await saveAdminContent({
        profile: draftProfile,
        now: {
          ...draftNow,
          items: normalizeSortOrder(draftNow.items),
        },
        lives: normalizeLivesForSave(draftLives),
        highlights: normalizeSortOrder(draftHighlights),
        editingEnabled,
      });

      setSavedProfileState(savedContent.profile);
      setSavedNowState(savedContent.now);
      setSavedLivesState(savedContent.lives);
      setSavedHighlightsState(savedContent.highlights);
      setDraftProfile(savedContent.profile);
      setDraftNow(savedContent.now);
      setDraftLives(savedContent.lives);
      setDraftHighlights(savedContent.highlights);
      setEditingEnabled(savedContent.editingEnabled);
      onReplaceProfile(savedContent.profile);
      onReplaceNow(savedContent.now);
      onReplaceLives(savedContent.lives);
      onReplaceHighlights(savedContent.highlights);
      onOpenChange(false);
    } catch (error) {
      setAdminError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="max-w-[calc(100%-1rem)] border-zinc-300 bg-white/96 shadow-[0_24px_80px_rgba(15,23,42,0.16)] sm:max-w-5xl">
        {!isAuthenticated ? (
          <form className="grid gap-4" onSubmit={handleLoginSubmit}>
            <DialogHeader className="text-left">
              <DialogTitle className="text-2xl text-slate-950">Admin Login</DialogTitle>
              <DialogDescription>输入管理员账号后即可编辑 Profile、Journey、Lives 和 Projects 内容。</DialogDescription>
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
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-zinc-100"
              >
                <LogOut className="h-4 w-4" />
                退出
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void handleSaveAll()}
                disabled={isAdminBusy || !editingEnabled || !hasPendingChanges}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAdminBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                保存全部
              </button>
              {hasPendingChanges ? <span className="text-sm text-amber-600">有未保存修改</span> : null}
            </div>

            <div className="inline-flex w-fit rounded-full border border-zinc-300 bg-zinc-100 p-1">
              <button
                type="button"
                onClick={() => setAdminTab("profile")}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  adminTab === "profile" ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-white"
                }`}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("now")}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  adminTab === "now" ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-white"
                }`}
              >
                Now
              </button>
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

            {adminTab === "profile" ? (
              <div className="grid gap-4">
                <div className="grid gap-4 rounded-[1.5rem] border border-zinc-300 bg-zinc-50/70 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={draftProfile.name}
                      onChange={(event) => updateDraftProfileField("name", event.target.value)}
                      placeholder="姓名"
                      className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                    />
                    <input
                      value={draftProfile.location}
                      onChange={(event) => updateDraftProfileField("location", event.target.value)}
                      placeholder="地点"
                      className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                    />
                    <input
                      value={draftProfile.headline}
                      onChange={(event) => updateDraftProfileField("headline", event.target.value)}
                      placeholder="一句话标题"
                      className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2"
                    />
                    <input
                      value={draftProfile.avatarUrl}
                      onChange={(event) => updateDraftProfileField("avatarUrl", event.target.value)}
                      placeholder="头像 URL"
                      className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2"
                    />
                    <input
                      value={draftProfile.socials.github}
                      onChange={(event) => updateDraftProfileSocial("github", event.target.value)}
                      placeholder="GitHub"
                      className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                    />
                    <input
                      value={draftProfile.socials.blog}
                      onChange={(event) => updateDraftProfileSocial("blog", event.target.value)}
                      placeholder="Blog"
                      className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                    />
                    <input
                      value={draftProfile.socials.email}
                      onChange={(event) => updateDraftProfileSocial("email", event.target.value)}
                      placeholder="Email"
                      className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2"
                    />
                    <input
                      value={draftProfile.tags.join(", ")}
                      onChange={(event) => updateDraftProfileTags(event.target.value)}
                      placeholder="标签，用逗号分隔"
                      className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSaveProfile()}
                  disabled={isAdminBusy || !editingEnabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAdminBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  保存 Profile
                </button>
              </div>
            ) : adminTab === "now" ? (
              <div className="grid gap-4">
                <div className="grid gap-4 rounded-[1.5rem] border border-zinc-300 bg-zinc-50/70 p-4">
                  <textarea
                    value={draftNow.summary}
                    onChange={(event) => updateDraftNowField("summary", event.target.value)}
                    placeholder="成长经历概述"
                    rows={4}
                    className="rounded-[1.5rem] border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() =>
                        setDraftNow((currentNow) => ({
                          ...currentNow,
                          items: normalizeSortOrder([
                            ...currentNow.items,
                            {
                              ...createEmptyJourneyItem(),
                              sortOrder: currentNow.items.length,
                            },
                          ]),
                        }))
                      }
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-zinc-100"
                    >
                      <Plus className="h-4 w-4" />
                      新增成长经历
                    </button>
                  </div>

                  <div className="grid max-h-[48vh] gap-4 overflow-y-auto pr-1">
                    {draftNow.items.map((item, index) => (
                      <section key={`${item.id}-${index}`} className="rounded-[1.5rem] border border-zinc-300 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Journey #{index + 1}</p>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs text-slate-500">
                              排序 {item.sortOrder + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => moveDraftJourneyItem(index, "up")}
                              disabled={index === 0}
                              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white p-2 text-slate-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveDraftJourneyItem(index, "down")}
                              disabled={index === draftNow.items.length - 1}
                              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white p-2 text-slate-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDraftNow((currentNow) => ({
                                  ...currentNow,
                                  items: normalizeSortOrder(
                                    currentNow.items.filter((_, currentIndex) => currentIndex !== index),
                                  ),
                                }))
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-rose-500 transition-colors hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              删除
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <select
                            value={item.type}
                            onChange={(event) => updateDraftJourneyItem(index, "type", event.target.value)}
                            className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                          >
                            <option value="education">education</option>
                            <option value="work">work</option>
                          </select>
                          <select
                            value={item.status}
                            onChange={(event) => updateDraftJourneyStatus(index, event.target.value as ContentStatus)}
                            className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <input value={item.period} onChange={(event) => updateDraftJourneyItem(index, "period", event.target.value)} placeholder="时间范围" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                          <input value={item.title} onChange={(event) => updateDraftJourneyItem(index, "title", event.target.value)} placeholder="标题" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                          <input value={item.organization} onChange={(event) => updateDraftJourneyItem(index, "organization", event.target.value)} placeholder="学校 / 公司" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                          <input value={item.location} onChange={(event) => updateDraftJourneyItem(index, "location", event.target.value)} placeholder="地点" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2" />
                          <textarea value={item.description} onChange={(event) => updateDraftJourneyItem(index, "description", event.target.value)} placeholder="描述" rows={4} className="rounded-[1.5rem] border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 md:col-span-2" />
                        </div>
                      </section>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleSaveNow()}
                  disabled={isAdminBusy || !editingEnabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAdminBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  保存 Now
                </button>
              </div>
            ) : adminTab === "lives" ? (
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setDraftLives((currentLives) =>
                        normalizeSortOrder([
                          ...currentLives,
                          {
                            ...createEmptyLifeMoment(),
                            sortOrder: currentLives.length,
                          },
                        ]),
                      )
                    }
                    disabled={isUploadingLifeImage}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs text-slate-500">
                              排序 {life.sortOrder + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => moveDraftLife(index, "up")}
                              disabled={index === 0 || isUploadingLifeImage}
                              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white p-2 text-slate-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveDraftLife(index, "down")}
                              disabled={index === draftLives.length - 1 || isUploadingLifeImage}
                              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white p-2 text-slate-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDraftLives((currentLives) =>
                                  normalizeSortOrder(currentLives.filter((_, currentIndex) => currentIndex !== index)),
                                )
                              }
                              disabled={isUploadingLifeImage}
                              className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-rose-500 transition-colors hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              删除
                            </button>
                          </div>
                        </div>

                      <div className="grid gap-3">
                        <input value={life.title} onChange={(event) => updateDraftLife(index, "title", event.target.value)} placeholder="标题（必填）" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <textarea value={life.description} onChange={(event) => updateDraftLife(index, "description", event.target.value)} placeholder="文案（可选）" rows={4} className="rounded-[1.5rem] border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            ref={(node) => {
                              lifeImageInputRefs.current[life.id] = node;
                            }}
                            type="file"
                            accept="image/*,.heic,.heif"
                            onChange={(event) => void handleLifeImageSelect(life.id, event)}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => lifeImageInputRefs.current[life.id]?.click()}
                            disabled={!editingEnabled || isAdminBusy}
                            className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {uploadingLifeId === life.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {uploadingLifeId === life.id ? "上传中..." : "上传"}
                          </button>
                          <span className="text-xs text-slate-500">服务器会自动生成缩略图；日期自动记录为 {life.capturedAt || createCapturedAtValue()}</span>
                        </div>
                        {life.imageUrl ? <p className="text-xs text-slate-500">已上传图片</p> : <p className="text-xs text-slate-400">还没有图片，先上传一张照片</p>}
                      </div>
                    </section>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => void handleSaveLives()}
                  disabled={isAdminBusy || !editingEnabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAdminBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  保存 Lives
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setDraftHighlights((currentHighlights) =>
                        normalizeSortOrder([
                          ...currentHighlights,
                          {
                            ...createEmptyHighlightItem(),
                            sortOrder: currentHighlights.length,
                          },
                        ]),
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-slate-800 transition-colors hover:bg-zinc-100"
                  >
                    <Plus className="h-4 w-4" />
                    新增 Work
                  </button>
                </div>

                <div className="grid max-h-[55vh] gap-4 overflow-y-auto pr-1">
                  {draftHighlights.map((highlight, index) => (
                    <section key={`${highlight.id}-${index}`} className="rounded-[1.5rem] border border-zinc-300 bg-zinc-50/70 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Work #{index + 1}</p>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs text-slate-500">
                              排序 {highlight.sortOrder + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => moveDraftHighlight(index, "up")}
                              disabled={index === 0}
                              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white p-2 text-slate-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveDraftHighlight(index, "down")}
                              disabled={index === draftHighlights.length - 1}
                              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white p-2 text-slate-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDraftHighlights((currentHighlights) =>
                                  normalizeSortOrder(
                                    currentHighlights.filter((_, currentIndex) => currentIndex !== index),
                                  ),
                                )
                              }
                              className="inline-flex items-center gap-1 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm text-rose-500 transition-colors hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              删除
                            </button>
                          </div>
                        </div>

                      <div className="grid gap-3">
                        <input value={highlight.title} onChange={(event) => updateDraftHighlight(index, "title", event.target.value)} placeholder="标题" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <input value={highlight.period} onChange={(event) => updateDraftHighlight(index, "period", event.target.value)} placeholder="项目时间" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <select value={highlight.kind} onChange={(event) => updateDraftHighlight(index, "kind", event.target.value)} className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900">
                          <option value="project">project</option>
                          <option value="approach">approach</option>
                          <option value="skill">skill</option>
                        </select>
                        <select value={highlight.status} onChange={(event) => updateDraftHighlightStatus(index, event.target.value as ContentStatus)} className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900">
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <input value={highlight.link ?? ""} onChange={(event) => updateDraftHighlight(index, "link", event.target.value)} placeholder="项目链接（可选）" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <input value={highlight.stack.join(", ")} onChange={(event) => updateDraftHighlightStack(index, event.target.value)} placeholder="技术栈，用逗号分隔" className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <textarea value={highlight.summary} onChange={(event) => updateDraftHighlight(index, "summary", event.target.value)} placeholder="卡片摘要" rows={3} className="rounded-[1.5rem] border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                        <textarea value={highlight.description} onChange={(event) => updateDraftHighlight(index, "description", event.target.value)} placeholder="详情描述" rows={5} className="rounded-[1.5rem] border border-zinc-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900" />
                      </div>
                    </section>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => void handleSaveHighlights()}
                  disabled={isAdminBusy || !editingEnabled}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAdminBusy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
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


export default AdminDialog;
