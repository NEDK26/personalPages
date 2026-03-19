export const linkTypes = ["code", "website", "contact"] as const satisfies readonly string[];
export const highlightKinds = ["project", "approach", "skill"] as const satisfies readonly string[];

export type LinkType = (typeof linkTypes)[number];
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
  timezone: string;
  languages: string[];
  status: string;
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

export interface LinkItem {
  label: string;
  url: string;
  type: LinkType;
}

export interface HighlightItem {
  title: string;
  description: string;
  kind: HighlightKind;
}

export interface LinksResponse {
  items: LinkItem[];
}

export interface HighlightsResponse {
  items: HighlightItem[];
}

export interface PublicContent {
  profile: Profile;
  now: Now;
  links: LinkItem[];
  highlights: HighlightItem[];
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function createLiteralUnionGuard<const TValues extends readonly string[]>(values: TValues) {
  const knownValues = new Set<string>(values);

  return (value: unknown): value is TValues[number] => {
    return typeof value === "string" && knownValues.has(value);
  };
}

const isLinkType = createLiteralUnionGuard(linkTypes);
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
    typeof value.timezone === "string" &&
    isStringArray(value.languages) &&
    typeof value.status === "string" &&
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

function isLinkItem(value: unknown): value is LinkItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.label === "string" &&
    typeof value.url === "string" &&
    isLinkType(value.type)
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

export function isLinksResponse(value: unknown): value is LinksResponse {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value.items) && value.items.every((item) => isLinkItem(item));
}

export function isHighlightsResponse(value: unknown): value is HighlightsResponse {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value.items) && value.items.every((item) => isHighlightItem(item));
}
