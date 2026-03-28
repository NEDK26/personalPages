import {
  isAdminContentResponse,
  isHighlightsResponse,
  isLivesResponse,
  isNow,
  isProfile,
} from "../types/public";
import type {
  AdminContentResponse,
  HighlightsResponse,
  LivesPageInfo,
  LivesResponse,
  Now,
  Profile,
  PublicContent,
} from "../types/public";

const LIVES_PAGE_SIZE = 4;

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
  const [profile, now, livesResponse, highlightsResponse] = await Promise.all([
    fetchJson<Profile>("/profile", isProfile, signal),
    fetchJson<Now>("/now", isNow, signal),
    fetchJson<LivesResponse>(buildLivesPath(), isLivesResponse, signal),
    fetchJson<HighlightsResponse>("/highlights", isHighlightsResponse, signal),
  ]);

  return {
    profile,
    now,
    lives: livesResponse.items,
    livesPageInfo: livesResponse.pageInfo,
    highlights: highlightsResponse.items,
  };
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

function createBasicAuthHeader(username: string, password: string) {
  const encodedValue = btoa(`${username}:${password}`);

  return `Basic ${encodedValue}`;
}

async function fetchAdminJson<T>(
  path: string,
  guard: (value: unknown) => value is T,
  username: string,
  password: string,
  init?: RequestInit,
) {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: createBasicAuthHeader(username, password),
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
      Authorization: createBasicAuthHeader(username, password),
    },
  });

  if (!response.ok) {
    throw new Error(response.status === 401 ? "账号或密码错误" : "管理员登录失败");
  }

  return {
    username,
    password,
  };
}

export async function fetchAdminContent(username: string, password: string): Promise<AdminContentResponse> {
  return fetchAdminJson<AdminContentResponse>(
    "/admin/content",
    isAdminContentResponse,
    username,
    password,
  );
}

export async function saveAdminLives(
  username: string,
  password: string,
  items: LivesResponse["items"],
) {
  const response = await fetchAdminJson<LivesResponse>(
    "/admin/lives",
    isLivesResponse,
    username,
    password,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    },
  );

  return response.items;
}

export async function saveAdminHighlights(
  username: string,
  password: string,
  items: HighlightsResponse["items"],
) {
  const response = await fetchAdminJson<HighlightsResponse>(
    "/admin/highlights",
    isHighlightsResponse,
    username,
    password,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    },
  );

  return response.items;
}
