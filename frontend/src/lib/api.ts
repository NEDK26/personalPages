import {
  isHighlightsResponse,
  isLivesResponse,
  isNow,
  isProfile,
} from "../types/public";
import type {
  HighlightsResponse,
  LivesResponse,
  Now,
  Profile,
  PublicContent,
} from "../types/public";

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
    fetchJson<LivesResponse>("/lives", isLivesResponse, signal),
    fetchJson<HighlightsResponse>("/highlights", isHighlightsResponse, signal),
  ]);

  return {
    profile,
    now,
    lives: livesResponse.items,
    highlights: highlightsResponse.items,
  };
}
