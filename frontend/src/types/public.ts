export const highlightKinds = ["project", "approach", "skill"] as const satisfies readonly string[];

export type HighlightKind = (typeof highlightKinds)[number];

export interface ProfileSocials {
  github: string;
  blog: string;
  email: string;
}

export interface Profile {
  name: string;
  headline: string;
  avatarUrl: string;
  location: string;
  languages: string[];
  shortBio: string;
  tags: string[];
  socials: ProfileSocials;
}

export interface Now {
  focus: string;
  learning: string[];
  shipping: string[];
  availability: string;
  updatedAt: string;
}

export interface LifeMoment {
  id: string;
  title: string;
  imageUrl: string;
  alt: string;
  location: string;
  capturedAt: string;
  description: string;
  width: number;
  height: number;
}

export interface HighlightItem {
  title: string;
  description: string;
  kind: HighlightKind;
}

export interface LivesPageInfo {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface LivesResponse {
  items: LifeMoment[];
  pageInfo: LivesPageInfo;
}

export interface HighlightsResponse {
  items: HighlightItem[];
}

export interface PublicContent {
  profile: Profile;
  now: Now;
  lives: LifeMoment[];
  livesPageInfo: LivesPageInfo;
  highlights: HighlightItem[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function createLiteralUnionGuard<const TValues extends readonly string[]>(values: TValues) {
  const knownValues = new Set<string>(values);

  return (value: unknown): value is TValues[number] => {
    return typeof value === "string" && knownValues.has(value);
  };
}

const isHighlightKind = createLiteralUnionGuard(highlightKinds);

function isProfileSocials(value: unknown): value is ProfileSocials {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.github === "string" &&
    typeof value.blog === "string" &&
    typeof value.email === "string"
  );
}

export function isProfile(value: unknown): value is Profile {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.name === "string" &&
    typeof value.headline === "string" &&
    typeof value.avatarUrl === "string" &&
    typeof value.location === "string" &&
    isStringArray(value.languages) &&
    typeof value.shortBio === "string" &&
    isStringArray(value.tags) &&
    isProfileSocials(value.socials)
  );
}

export function isNow(value: unknown): value is Now {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.focus === "string" &&
    isStringArray(value.learning) &&
    isStringArray(value.shipping) &&
    typeof value.availability === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isLifeMoment(value: unknown): value is LifeMoment {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.imageUrl === "string" &&
    typeof value.alt === "string" &&
    typeof value.location === "string" &&
    typeof value.capturedAt === "string" &&
    typeof value.description === "string" &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height)
  );
}

function isHighlightItem(value: unknown): value is HighlightItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    isHighlightKind(value.kind)
  );
}

function isLivesPageInfo(value: unknown): value is LivesPageInfo {
  if (!isRecord(value)) {
    return false;
  }

  const hasValidCursor = value.nextCursor === null || typeof value.nextCursor === "string";

  return typeof value.hasMore === "boolean" && hasValidCursor;
}

export function isLivesResponse(value: unknown): value is LivesResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.items) &&
    value.items.every((item) => isLifeMoment(item)) &&
    isLivesPageInfo(value.pageInfo)
  );
}

export function isHighlightsResponse(value: unknown): value is HighlightsResponse {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value.items) && value.items.every((item) => isHighlightItem(item));
}
