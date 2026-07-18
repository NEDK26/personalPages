import {
  isAdminContentResponse,
  isAdminLifeImageUploadResponse,
  isLivesResponse,
  isPublicContent,
} from "../types/public";
import type {
  AdminContentResponse,
  AdminLifeImageUploadResponse,
  LivesPageInfo,
  LivesResponse,
  PublicContent,
} from "../types/public";

const LIVES_PAGE_SIZE = 4;
const DIRECT_BLOB_MULTIPART_THRESHOLD_BYTES = 4_500_000;
let adminCsrfToken: string | null = null;

const apiConfig = {
  baseUrl: resolveBaseUrl(),
} as const satisfies { baseUrl: string };

function resolveBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!configuredBaseUrl) {
    return "/api";
  }

  const normalizedBaseUrl = normalizeBaseUrl(configuredBaseUrl);

  if (import.meta.env.PROD && /^https?:\/\//.test(normalizedBaseUrl)) {
    return "/api";
  }

  return normalizedBaseUrl;
}

function normalizeBaseUrl(baseUrl: string) {
  const trimmedBaseUrl = baseUrl.trim();

  if (trimmedBaseUrl.length === 0) {
    return "/api";
  }

  return trimmedBaseUrl.endsWith("/") ? trimmedBaseUrl.slice(0, -1) : trimmedBaseUrl;
}

function buildApiUrl(path: string) {
  return path.startsWith("/") ? `${apiConfig.baseUrl}${path}` : `${apiConfig.baseUrl}/${path}`;
}

function buildLivesPath(cursor?: string | null, limit = LIVES_PAGE_SIZE) {
  const searchParams = new URLSearchParams({
    limit: String(limit),
  });

  if (cursor) {
    searchParams.set("cursor", cursor);
  }

  return `/lives?${searchParams.toString()}`;
}

async function fetchJson<T>(
  path: string,
  guard: (value: unknown) => value is T,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path}: ${response.status}`);
  }

  const payload: unknown = await response.json();

  if (!guard(payload)) {
    throw new Error(`API response shape is invalid for ${path}`);
  }

  return payload;
}

export async function fetchPublicContent(signal?: AbortSignal): Promise<PublicContent> {
  return fetchJson<PublicContent>("/content", isPublicContent, signal);
}

export async function fetchMoreLives(
  cursor: string,
  signal?: AbortSignal,
): Promise<{ items: LivesResponse["items"]; pageInfo: LivesPageInfo }> {
  const response = await fetchJson<LivesResponse>(buildLivesPath(cursor), isLivesResponse, signal);

  return {
    items: response.items,
    pageInfo: response.pageInfo,
  };
}

function sanitizeFileNameSegment(value: string) {
  const normalizedValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedValue || "image";
}

function getImageFileExtension(fileName: string, contentType: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  const rawExtension = lastDotIndex >= 0 ? fileName.slice(lastDotIndex + 1) : "";
  const normalizedExtension = sanitizeFileNameSegment(rawExtension);

  if (normalizedExtension !== "image") {
    return normalizedExtension;
  }

  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function buildLifeImageUploadPathname(file: File) {
  const lastDotIndex = file.name.lastIndexOf(".");
  const rawBaseName = lastDotIndex >= 0 ? file.name.slice(0, lastDotIndex) : file.name;
  const baseName = sanitizeFileNameSegment(rawBaseName);
  const extension = getImageFileExtension(file.name, file.type);

  return `lives/${baseName}.${extension}`;
}

function buildLifeThumbnailPathname(pathname: string) {
  const fileName = pathname.split("/").pop() ?? pathname;
  const baseName = fileName.replace(/\.[^.]+$/, "");

  return `lives/thumbs/${baseName}.webp`;
}

function buildBlobUrlFromPathname(blobUrl: string, pathname: string) {
  const url = new URL(blobUrl);
  url.pathname = `/${pathname}`;

  return url.toString();
}

async function uploadAdminLifeImageThroughLegacyProxy(
  file: File,
): Promise<AdminLifeImageUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(buildApiUrl("/admin/lives/upload"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      ...(adminCsrfToken ? { "X-CSRF-Token": adminCsrfToken } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getApiErrorMessage(response, "图片上传失败"));
  }

  const payload: unknown = await response.json();

  if (!isAdminLifeImageUploadResponse(payload)) {
    throw new Error("图片上传响应格式不正确");
  }

  return payload;
}

function shouldUseLegacyBackendUpload() {
  return import.meta.env.DEV;
}

async function getApiErrorMessage(response: Response, fallbackMessage: string) {
  try {
    const payload: unknown = await response.json();

    if (typeof payload !== "object" || payload === null) {
      return fallbackMessage;
    }

    if (typeof (payload as { message?: unknown }).message === "string") {
      return (payload as { message: string }).message;
    }

    if (typeof (payload as { error?: unknown }).error === "string") {
      return (payload as { error: string }).error;
    }

    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function fetchAdminJson<T>(
  path: string,
  guard: (value: unknown) => value is T,
  init?: RequestInit,
) {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(adminCsrfToken && init?.method && !["GET", "HEAD"].includes(init.method)
        ? { "X-CSRF-Token": adminCsrfToken }
        : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path}: ${response.status}`);
  }

  const payload: unknown = await response.json();

  if (!guard(payload)) {
    throw new Error(`API response shape is invalid for ${path}`);
  }

  return payload;
}

export async function loginAdmin(username: string, password: string) {
  const response = await fetch(buildApiUrl("/admin/login"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(response.status === 401 ? "账号或密码错误" : "管理员登录失败");
  }

  const payload: unknown = await response.json();

  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as { csrfToken?: unknown }).csrfToken !== "string"
  ) {
    throw new Error("管理员登录响应格式不正确");
  }

  adminCsrfToken = (payload as { csrfToken: string }).csrfToken;
}

export async function logoutAdmin() {
  await fetchAdminJson<{ ok: boolean }>(
    "/admin/login",
    (value): value is { ok: boolean } =>
      typeof value === "object" && value !== null && (value as { ok?: unknown }).ok === true,
    { method: "DELETE" },
  );
  adminCsrfToken = null;
}

export async function fetchAdminContent(): Promise<AdminContentResponse> {
  const content = await fetchAdminJson<AdminContentResponse>("/admin/content", isAdminContentResponse);

  adminCsrfToken = content.csrfToken;
  return content;
}

export async function saveAdminContent(content: Omit<AdminContentResponse, "csrfToken">) {
  return fetchAdminJson<AdminContentResponse>(
    "/admin/content",
    isAdminContentResponse,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile: content.profile,
        now: content.now,
        lives: content.lives,
        highlights: content.highlights,
      }),
    },
  );
}

export async function uploadAdminLifeImage(
  file: File,
): Promise<AdminLifeImageUploadResponse> {
  if (shouldUseLegacyBackendUpload()) {
    return uploadAdminLifeImageThroughLegacyProxy(file);
  }

  try {
    const { upload } = await import("@vercel/blob/client");
    const commonUploadOptions = {
      access: "public" as const,
      handleUploadUrl: buildApiUrl("/admin/lives/upload"),
      headers: {
        Accept: "application/json",
        ...(adminCsrfToken ? { "X-CSRF-Token": adminCsrfToken } : {}),
      },
    };
    const uploadedBlob = await upload(buildLifeImageUploadPathname(file), file, {
      ...commonUploadOptions,
      contentType: file.type || undefined,
      multipart: file.size > DIRECT_BLOB_MULTIPART_THRESHOLD_BYTES,
    });
    const thumbnailPathname = buildLifeThumbnailPathname(uploadedBlob.pathname);

    return {
      url: uploadedBlob.url,
      thumbnailUrl: buildBlobUrlFromPathname(uploadedBlob.url, thumbnailPathname),
      pathname: uploadedBlob.pathname,
      contentType: uploadedBlob.contentType,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "图片上传失败");
  }
}
