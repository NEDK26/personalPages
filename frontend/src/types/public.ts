export const highlightKinds = ["project", "approach", "skill"] as const satisfies readonly string[];
export const journeyItemKinds = ["education", "work"] as const satisfies readonly string[];
export const contentStatuses = ["draft", "published", "hidden"] as const satisfies readonly string[];

export type HighlightKind = (typeof highlightKinds)[number];
export type JourneyItemKind = (typeof journeyItemKinds)[number];
export type ContentStatus = (typeof contentStatuses)[number];

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
  tags: string[];
  socials: ProfileSocials;
}

export interface JourneyItem {
  id: string;
  type: JourneyItemKind;
  title: string;
  organization: string;
  location: string;
  period: string;
  description: string;
  status: ContentStatus;
  sortOrder: number;
}

export interface Now {
  summary: string;
  items: JourneyItem[];
  updatedAt: string;
}

export interface LifeMoment {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  alt: string;
  location: string;
  capturedAt: string;
  description: string;
  width: number;
  height: number;
  status: ContentStatus;
  sortOrder: number;
}

export interface HighlightItem {
  id: string;
  title: string;
  summary: string;
  description: string;
  kind: HighlightKind;
  period: string;
  stack: string[];
  link?: string;
  status: ContentStatus;
  sortOrder: number;
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

export interface AdminContentResponse {
  profile: Profile;
  now: Now;
  lives: LifeMoment[];
  highlights: HighlightItem[];
  editingEnabled: boolean;
}

export interface AdminLifeImageUploadResponse {
  url: string;
  thumbnailUrl?: string;
  pathname: string;
  contentType: string;
  size: number;
  uploadedAt: string;
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
const isJourneyItemKind = createLiteralUnionGuard(journeyItemKinds);
const isContentStatus = createLiteralUnionGuard(contentStatuses);

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

function isJourneyItem(value: unknown): value is JourneyItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    isJourneyItemKind(value.type) &&
    typeof value.title === "string" &&
    typeof value.organization === "string" &&
    typeof value.location === "string" &&
    typeof value.period === "string" &&
    typeof value.description === "string" &&
    isContentStatus(value.status) &&
    isFiniteNumber(value.sortOrder)
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
    isStringArray(value.tags) &&
    isProfileSocials(value.socials)
  );
}

export function isNow(value: unknown): value is Now {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.summary === "string" &&
    Array.isArray(value.items) &&
    value.items.every((item) => isJourneyItem(item)) &&
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
    (value.thumbnailUrl === undefined || typeof value.thumbnailUrl === "string") &&
    typeof value.alt === "string" &&
    typeof value.location === "string" &&
    typeof value.capturedAt === "string" &&
    typeof value.description === "string" &&
    isFiniteNumber(value.width) &&
    isFiniteNumber(value.height) &&
    isContentStatus(value.status) &&
    isFiniteNumber(value.sortOrder)
  );
}

function isHighlightItem(value: unknown): value is HighlightItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    typeof value.description === "string" &&
    isHighlightKind(value.kind) &&
    typeof value.period === "string" &&
    isStringArray(value.stack) &&
    (value.link === undefined || typeof value.link === "string") &&
    isContentStatus(value.status) &&
    isFiniteNumber(value.sortOrder)
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

export function isAdminContentResponse(value: unknown): value is AdminContentResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isProfile(value.profile) &&
    isNow(value.now) &&
    Array.isArray(value.lives) &&
    value.lives.every((item) => isLifeMoment(item)) &&
    Array.isArray(value.highlights) &&
    value.highlights.every((item) => isHighlightItem(item)) &&
    typeof value.editingEnabled === "boolean"
  );
}

export function isAdminLifeImageUploadResponse(value: unknown): value is AdminLifeImageUploadResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.url === "string" &&
    (value.thumbnailUrl === undefined || typeof value.thumbnailUrl === "string") &&
    typeof value.pathname === "string" &&
    typeof value.contentType === "string" &&
    isFiniteNumber(value.size) &&
    typeof value.uploadedAt === "string"
  );
}
